import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const permission = searchParams.get("permission");

    if (!permission) {
      return NextResponse.json(
        { success: false, error: "Permission parameter is required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, hasPermission: false });
    }

    const hasAccess = await hasPermission(user.userId, permission);
    return NextResponse.json({ success: true, hasPermission: hasAccess });
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check permission" },
      { status: 500 }
    );
  }
}

