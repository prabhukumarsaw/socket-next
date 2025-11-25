"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, Reply, ChevronDown, ChevronUp, Trash2, Shield, AlertTriangle } from "lucide-react"
import { createComment, getComments, moderateComment, likeComment } from "@/lib/actions/comments"
import { getCurrentUser } from "@/lib/auth/jwt-server"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

interface Comment {
  id: string
  authorName: string
  content: string
  createdAt: Date
  likes: number
  isApproved: boolean
  isSpam: boolean
  isVulgar: boolean
  parentId: string | null
  replies?: Comment[]
}

interface CommentsSectionProps {
  newsId: string
  count: number
}

export function CommentsSection({ newsId, count: initialCount }: CommentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [canModerate, setCanModerate] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; commentId: string | null }>({
    open: false,
    commentId: null,
  })

  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
    parentId: null as string | null,
  })

  // Check moderation permissions
  useEffect(() => {
    async function checkPermissions() {
      try {
        const user = await getCurrentUser()
        if (user) {
          // Check if user has comment.moderate permission
          const response = await fetch("/api/auth/check-permission?permission=comment.moderate")
          if (response.ok) {
            const data = await response.json()
            setCanModerate(data.hasPermission || false)
          }
        }
      } catch (error) {
        console.error("Permission check error:", error)
      }
    }
    checkPermissions()
  }, [])

  // Load comments when section opens
  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments()
    }
  }, [isOpen])

  async function loadComments() {
    setLoading(true)
    try {
      const result = await getComments(newsId, canModerate)
      if (result.success) {
        setComments(result.comments as Comment[])
      }
    } catch (error) {
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.content.trim() || !formData.authorName.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      const result = await createComment({
        newsId,
        parentId: formData.parentId || undefined,
        authorName: formData.authorName,
        authorEmail: formData.authorEmail || undefined,
        content: formData.content,
      })

      if (result.success) {
        toast.success(result.message || "Comment posted successfully!")
        setFormData({
          authorName: "",
          authorEmail: "",
          content: "",
          parentId: null,
        })
        setReplyTo(null)
        await loadComments()
      } else {
        toast.error(result.error || "Failed to post comment")
      }
    } catch (error) {
      toast.error("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleModerate(commentId: string, action: "approve" | "reject" | "spam" | "vulgar" | "delete") {
    try {
      const result = await moderateComment({
        commentId,
        action,
      })

      if (result.success) {
        toast.success(result.message || "Comment moderated successfully")
        await loadComments()
      } else {
        toast.error(result.error || "Failed to moderate comment")
      }
    } catch (error) {
      toast.error("Failed to moderate comment")
    }
  }

  async function handleLike(commentId: string) {
    try {
      await likeComment(commentId)
      await loadComments()
    } catch (error) {
      toast.error("Failed to like comment")
    }
  }

  function startReply(commentId: string, authorName: string) {
    setReplyTo(commentId)
    setFormData({
      ...formData,
      parentId: commentId,
      content: `@${authorName} `,
    })
  }

  function cancelReply() {
    setReplyTo(null)
    setFormData({
      ...formData,
      parentId: null,
      content: "",
    })
  }

  function formatDate(date: Date | string) {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  }

  function renderComment(comment: Comment, depth: number = 0) {
    const isPending = !comment.isApproved || comment.isSpam || comment.isVulgar

    return (
      <div key={comment.id} className={`space-y-4 ${depth > 0 ? "ml-8 md:ml-12 border-l-2 border-border pl-4" : ""}`}>
        <div className="group flex gap-3 md:gap-5">
          <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0 border border-border shadow-sm">
            <AvatarFallback className="font-bold text-muted-foreground">
              {comment.authorName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground text-base">{comment.authorName}</span>
                {isPending && canModerate && (
                  <Badge variant="destructive" className="text-xs">
                    {comment.isVulgar ? "Vulgar" : comment.isSpam ? "Spam" : "Pending"}
                  </Badge>
                )}
                {!isPending && <Badge variant="secondary" className="text-xs">User</Badge>}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
              <p>{comment.content}</p>
            </div>

            <div className="flex items-center gap-5 mt-3 pt-2">
              <button
                onClick={() => handleLike(comment.id)}
                className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-muted-foreground hover:text-blue-600 transition-colors"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{comment.likes}</span>
              </button>
              <button
                onClick={() => startReply(comment.id, comment.authorName)}
                className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-muted-foreground hover:text-blue-600 transition-colors"
              >
                <Reply className="h-3.5 w-3.5" />
                <span>Reply</span>
              </button>
              {canModerate && (
                <div className="flex items-center gap-2 ml-auto">
                  {isPending ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerate(comment.id, "approve")}
                      className="h-7 text-xs"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(comment.id, "vulgar")}
                        className="h-7 text-xs text-orange-600"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Flag
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteDialog({ open: true, commentId: comment.id })}
                        className="h-7 text-xs text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-12 scroll-mt-24" id="comments">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 text-base md:text-lg border-border hover:border-blue-300 text-foreground hover:text-blue-600 font-bold uppercase tracking-wider bg-card hover:bg-blue-50/50 dark:hover:bg-blue-950/20 flex items-center justify-between px-6 md:px-10 group transition-all shadow-sm"
      >
        <span className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <MessageSquare className="h-5 w-5" />
          </span>
          {isOpen ? "Hide Comments" : `View ${initialCount} Comments`}
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-xl font-bold text-foreground">Discussion</h3>
            <span className="text-sm text-muted-foreground font-medium">{initialCount} Comments</span>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="flex gap-3 md:gap-5 bg-muted/30 p-4 md:p-6 rounded-xl border border-border/50">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0 border-2 border-background shadow-sm hidden sm:block">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                {formData.authorName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {replyTo && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 p-2 rounded text-sm">
                  <span className="text-blue-600 dark:text-blue-400">Replying to comment</span>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelReply} className="h-6 text-xs">
                    Cancel
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-background text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={formData.authorEmail}
                  onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-background text-sm"
                />
              </div>
              <textarea
                placeholder="What are your thoughts? Join the discussion..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-4 border border-input rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[120px] bg-background text-base resize-y transition-all placeholder:text-muted-foreground/70"
                required
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground hidden sm:block">Be respectful and keep it relevant.</p>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-sm hover:shadow w-full sm:w-auto"
                >
                  {submitting ? "Posting..." : replyTo ? "Post Reply" : "Post Comment"}
                </Button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No comments yet. Be the first to comment!</div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, commentId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.commentId) {
                  handleModerate(deleteDialog.commentId, "delete")
                  setDeleteDialog({ open: false, commentId: null })
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
