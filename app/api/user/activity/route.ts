import { auth } from "@clerk/nextjs/server";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";
import { NextResponse } from "next/server";

// Helper function to get user ID from Clerk
const getUserId = async (): Promise<string | null> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      // No authenticated user found
      return null;
    }
    // Authenticated userId received
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// POST - Update user activity (last login, etc.)
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { action } = await req.json();

    // Connect to user database
    await connectUserDB();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      // User doesn't exist yet - this is normal during user creation
      // User activity update skipped - user not found in database yet (this is normal during user creation)
      return NextResponse.json({
        success: false,
        message: "User not found in database yet",
        code: "USER_NOT_FOUND"
      }, { status: 202 }); // Use 202 Accepted instead of 404 to indicate this is expected
    }

    // Update user activity based on action
    if (action === 'login') {
      await user.updateLastLogin();
      // User activity updated successfully
    }

    return NextResponse.json({
      success: true,
      message: "User activity updated successfully"
    });

  } catch (error) {
    console.error("Update user activity error:", error);
    return NextResponse.json(
      { error: "Failed to update user activity", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 