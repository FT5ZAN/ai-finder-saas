import { auth } from "@clerk/nextjs/server";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { createOrder, generateReceiptId } from "@/utils/razorpay";

// Helper function to get user ID from Clerk
const getUserId = async (): Promise<string | null> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('No authenticated user found');
      return null;
    }
    console.log('Authenticated userId:', userId);
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// GET - Get user's subscription status and limits
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to user database
    await connectUserDB();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get subscription data
    const subscription = {
      isSubscribed: user.isSubscribed,
      planAmount: user.planAmount,
      toolLimit: user.getToolLimit(),
      folderLimit: user.getFolderLimit(),
      totalSavedTools: user.getTotalSavedTools(),
      currentFolders: user.folders.length,
      canSaveMoreTools: user.canSaveMoreTools(),
      canCreateMoreFolders: user.canCreateMoreFolders()
    };

    return NextResponse.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Create Razorpay order for subscription purchase
export async function POST(req: Request) {
  try {
    const { planAmount } = await req.json();
    console.log('POST /api/user/subscription - planAmount:', planAmount);

    if (typeof planAmount !== 'number' || planAmount < 1) {
      return NextResponse.json(
        { error: "Valid plan amount is required (minimum 1)" },
        { status: 400 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('POST /api/user/subscription - userId:', userId);

    // Connect to user database
    await connectUserDB();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate unique receipt ID
    const receiptId = generateReceiptId(userId, planAmount);

    // Create Razorpay order
    const order = await createOrder(planAmount, receiptId);

    console.log('POST /api/user/subscription - Razorpay order created:', order.id);

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 