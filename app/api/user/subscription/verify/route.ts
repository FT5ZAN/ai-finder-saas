import { auth } from "@clerk/nextjs/server";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/utils/razorpay";

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

// POST - Verify payment and update subscription
export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planAmount } = await req.json();
    
    console.log('POST /api/user/subscription/verify - Payment verification request:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planAmount
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planAmount) {
      return NextResponse.json(
        { error: "Missing required payment information" },
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

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      console.error('Payment signature verification failed');
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
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

    // Add to user's balance (accumulative)
    await user.addToBalance(planAmount);

    // Record payment history
    await user.addPaymentRecord({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: planAmount * 100, // Convert to paise for consistency
      currency: 'INR',
      status: 'captured',
      planAmount: planAmount,
      createdAt: new Date(),
    });

    // Get updated subscription data
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

    console.log('POST /api/user/subscription/verify - Payment verified and subscription updated successfully');

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription updated successfully",
      subscription
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 