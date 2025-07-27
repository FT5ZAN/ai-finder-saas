import { NextResponse } from "next/server";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";
import { verifyWebhookSignature } from "@/utils/razorpay";

// POST - Handle Razorpay webhook events
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature in webhook');
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(body, signature);

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(body);
    console.log('Razorpay webhook received:', payload.event);

    // Handle payment.captured event
    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const order = payload.payload.order.entity;

      console.log('Payment captured:', {
        paymentId: payment.id,
        orderId: order.id,
        amount: payment.amount,
        status: payment.status
      });

      // Extract user ID and plan amount from receipt
      const receipt = order.receipt;
      const receiptParts = receipt.split('_');
      
      if (receiptParts.length >= 4) {
        const userId = receiptParts[1];
        const planAmount = parseInt(receiptParts[2]);

        // Connect to user database
        await connectUserDB();

        // Find user
        const user = await User.findOne({ clerkId: userId });
        
        if (user) {
          // Add to user's balance (accumulative)
          await user.addToBalance(planAmount);
          
          // Record payment history (if not already recorded)
          const existingPayment = user.paymentHistory.find(p => p.paymentId === payment.id);
          if (!existingPayment) {
            await user.addPaymentRecord({
              orderId: order.id,
              paymentId: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              planAmount: planAmount,
              createdAt: new Date(payment.created_at * 1000), // Convert from Unix timestamp
            });
          }
          
          console.log('User subscription updated via webhook:', {
            userId,
            planAmount,
            newBalance: user.planAmount
          });
        } else {
          console.error('User not found for webhook:', userId);
        }
      } else {
        console.error('Invalid receipt format in webhook:', receipt);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
} 