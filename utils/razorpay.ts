import Razorpay from 'razorpay';
import crypto from 'crypto';

// Check if required environment variables are set
const checkRazorpayConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay configuration missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }
};

// Initialize Razorpay instance
export const razorpay = (() => {
  try {
    checkRazorpayConfig();
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  } catch (error) {
    console.warn('Razorpay not configured:', error);
    return null;
  }
})();

// Create a new order
export const createOrder = async (amount: number, receipt: string) => {
  try {
    if (!razorpay) {
      throw new Error('Razorpay is not configured. Please set up environment variables.');
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Verify payment signature
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret key not configured');
    }

    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (
  body: string,
  signature: string
) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      throw new Error('Razorpay webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Generate unique receipt ID
export const generateReceiptId = (userId: string, planAmount: number) => {
  const timestamp = Date.now();
  return `receipt_${userId}_${planAmount}_${timestamp}`;
}; 