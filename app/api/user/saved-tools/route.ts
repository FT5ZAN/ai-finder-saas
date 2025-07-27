import { auth } from "@clerk/nextjs/server";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to user database
    await connectUserDB();

    // Find user and get their saved tools
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      savedTools: user.savedTools,
      totalCount: user.savedTools.length
    });

  } catch (error) {
    console.error("Get saved tools error:", error);
    return NextResponse.json(
      { error: "Failed to get saved tools", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 