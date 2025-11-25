"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";

/**
 * Comment Management Server Actions
 * Handles CRUD operations for comments with moderation
 */

const createCommentSchema = z.object({
  newsId: z.string().min(1, "News ID is required"),
  parentId: z.string().optional(),
  authorName: z.string().min(1, "Name is required").max(100, "Name too long"),
  authorEmail: z.string().email().optional().or(z.literal("")),
  content: z.string().min(1, "Comment cannot be empty").max(5000, "Comment too long"),
});

const moderateCommentSchema = z.object({
  commentId: z.string(),
  action: z.enum(["approve", "reject", "spam", "vulgar", "delete"]),
  reason: z.string().optional(),
});

// Simple vulgar word filter (can be enhanced with external API)
const vulgarWords = [
  // Add your list of vulgar words here
  "badword1", "badword2", // Example placeholders
];

function containsVulgarContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return vulgarWords.some((word) => lowerText.includes(word.toLowerCase()));
}

/**
 * Create a new comment
 * Anyone can comment, but content is checked for vulgarity
 */
export async function createComment(data: z.infer<typeof createCommentSchema>) {
  try {
    const validated = createCommentSchema.parse(data);

    // Get IP and user agent
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Check if news exists
    const news = await prisma.news.findUnique({
      where: { id: validated.newsId },
      select: { id: true, slug: true, isPublished: true },
    });

    if (!news) {
      return { success: false, error: "News post not found" };
    }

    if (!news.isPublished) {
      return { success: false, error: "Cannot comment on unpublished posts" };
    }

    // Check for vulgar content
    const isVulgar = containsVulgarContent(validated.content);

    // Auto-approve unless vulgar
    const isApproved = !isVulgar;

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        newsId: validated.newsId,
        parentId: validated.parentId || null,
        authorName: validated.authorName,
        authorEmail: validated.authorEmail || null,
        content: validated.content,
        isApproved,
        isVulgar,
        ipAddress,
        userAgent,
      },
      include: {
        parent: {
          select: {
            id: true,
            authorName: true,
          },
        },
      },
    });

    // Revalidate the news page
    revalidatePath(`/news/${news.slug}`);

    return {
      success: true,
      comment: {
        id: comment.id,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
        isApproved: comment.isApproved,
        parentId: comment.parentId,
      },
      message: isVulgar
        ? "Your comment has been flagged for review and will be published after moderation."
        : "Comment posted successfully!",
    };
  } catch (error) {
    console.error("Create comment error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to post comment" };
  }
}

/**
 * Get comments for a news post
 * Only approved comments are shown to public
 */
export async function getComments(newsId: string, includePending: boolean = false) {
  try {
    const currentUser = await getCurrentUser();
    const canModerate = currentUser
      ? await hasPermission(currentUser.userId, "comment.moderate")
      : false;

    const comments = await prisma.comment.findMany({
      where: {
        newsId,
        parentId: null, // Only top-level comments
        ...(canModerate && includePending
          ? {}
          : { isApproved: true, isSpam: false }),
      },
      include: {
        replies: {
          where: canModerate && includePending ? {} : { isApproved: true, isSpam: false },
          orderBy: { createdAt: "asc" },
          include: {
            replies: {
              where: canModerate && includePending ? {} : { isApproved: true, isSpam: false },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, comments };
  } catch (error) {
    console.error("Get comments error:", error);
    return { success: false, error: "Failed to load comments", comments: [] };
  }
}

/**
 * Moderate a comment (approve, reject, mark as spam/vulgar, or delete)
 * Requires comment.moderate permission
 */
export async function moderateComment(data: z.infer<typeof moderateCommentSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "comment.moderate");
    if (!hasAccess) {
      return { success: false, error: "You don't have permission to moderate comments" };
    }

    const validated = moderateCommentSchema.parse(data);

    const comment = await prisma.comment.findUnique({
      where: { id: validated.commentId },
      include: { news: { select: { slug: true } } },
    });

    if (!comment) {
      return { success: false, error: "Comment not found" };
    }

    let updateData: any = {
      moderatedAt: new Date(),
      moderatedBy: currentUser.userId,
    };

    switch (validated.action) {
      case "approve":
        updateData.isApproved = true;
        updateData.isSpam = false;
        updateData.isVulgar = false;
        break;
      case "reject":
        updateData.isApproved = false;
        break;
      case "spam":
        updateData.isApproved = false;
        updateData.isSpam = true;
        break;
      case "vulgar":
        updateData.isApproved = false;
        updateData.isVulgar = true;
        break;
      case "delete":
        await prisma.comment.delete({
          where: { id: validated.commentId },
        });
        revalidatePath(`/news/${comment.news.slug}`);
        await createAuditLog({
          action: "DELETE_COMMENT",
          resource: "Comment",
          resourceId: validated.commentId,
          description: `User ${currentUser.email} deleted comment`,
        });
        return { success: true, message: "Comment deleted successfully" };
    }

    await prisma.comment.update({
      where: { id: validated.commentId },
      data: updateData,
    });

    revalidatePath(`/news/${comment.news.slug}`);
    await createAuditLog({
      action: `MODERATE_COMMENT_${validated.action.toUpperCase()}`,
      resource: "Comment",
      resourceId: validated.commentId,
      description: `User ${currentUser.email} ${validated.action} comment${validated.reason ? `: ${validated.reason}` : ""}`,
    });

    return { success: true, message: `Comment ${validated.action}d successfully` };
  } catch (error) {
    console.error("Moderate comment error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to moderate comment" };
  }
}

/**
 * Like a comment
 */
export async function likeComment(commentId: string) {
  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Like comment error:", error);
    return { success: false, error: "Failed to like comment" };
  }
}

/**
 * Get comment count for a news post
 */
export async function getCommentCount(newsId: string) {
  try {
    const count = await prisma.comment.count({
      where: {
        newsId,
        isApproved: true,
        isSpam: false,
      },
    });

    return { success: true, count };
  } catch (error) {
    return { success: false, count: 0 };
  }
}

