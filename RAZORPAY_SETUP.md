# Razorpay Integration Setup Guide

## Overview
This guide explains how to set up Razorpay payment gateway integration for the AI Finder micro top-up subscription system.

## Features Implemented
- ✅ Razorpay order creation
- ✅ Payment verification with signature validation
- ✅ Webhook handling for payment confirmations
- ✅ Payment history tracking
- ✅ Micro top-up system ($1 packs for +10 tools, +1 folder)

## Environment Variables Required

Add these to your `.env.local` file:

```env
# RAZORPAY
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Razorpay Dashboard Setup

### 1. Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete KYC verification

### 2. Get API Keys
1. Go to **Settings** → **API Keys**
2. Generate a new key pair
3. Copy the **Key ID** and **Key Secret**
4. Update your environment variables

### 3. Configure Webhooks
1. Go to **Settings** → **Webhooks**
2. Add a new webhook with:
   - **URL**: `https://yourdomain.com/api/webhooks/razorpay`
   - **Events**: Select `payment.captured`
3. Copy the webhook secret and add to environment variables

### 4. Test Mode vs Live Mode
- **Test Mode**: Use `rzp_test_` keys for development
- **Live Mode**: Use `rzp_live_` keys for production

## API Endpoints

### 1. Create Order
```
POST /api/user/subscription
Body: { "planAmount": number }
Response: { "order": { "id", "amount", "currency", "receipt", "key_id" } }
```

### 2. Verify Payment
```
POST /api/user/subscription/verify
Body: { 
  "razorpay_order_id": string,
  "razorpay_payment_id": string, 
  "razorpay_signature": string,
  "planAmount": number 
}
```

### 3. Webhook Handler
```
POST /api/webhooks/razorpay
Headers: { "x-razorpay-signature": string }
Body: Razorpay webhook payload
```

## Payment Flow

1. **User clicks "Buy Packs"** on pricing page
2. **Frontend creates order** via `/api/user/subscription`
3. **Razorpay modal opens** with order details
4. **User completes payment** through Razorpay
5. **Payment verification** via `/api/user/subscription/verify`
6. **Webhook confirmation** (backup) via `/api/webhooks/razorpay`
7. **User subscription updated** with new limits

## Database Schema Updates

### User Model Changes
- Added `paymentHistory` array to track all payments
- Each payment record includes:
  - `orderId`: Razorpay order ID
  - `paymentId`: Razorpay payment ID
  - `amount`: Payment amount in paise
  - `currency`: Payment currency (INR)
  - `status`: Payment status
  - `planAmount`: Plan amount in dollars
  - `createdAt`: Payment timestamp

## Security Features

### 1. Signature Verification
- All payments verified using HMAC SHA256
- Prevents payment tampering
- Uses Razorpay secret key for verification

### 2. Webhook Security
- Webhook signatures verified
- Prevents unauthorized webhook calls
- Uses webhook secret for verification

### 3. Receipt Validation
- Unique receipt IDs generated per order
- Contains user ID and plan amount
- Prevents order manipulation

## Testing

### 1. Test Cards
Use these test card numbers:
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### 2. Test UPI
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

### 3. Test Net Banking
- **Success**: `HDFC`
- **Failure**: `ICICI`

## Error Handling

### Common Errors
1. **Invalid Signature**: Check API keys and signature verification
2. **Order Not Found**: Verify order creation process
3. **Payment Failed**: Check payment method and amount
4. **Webhook Issues**: Verify webhook URL and secret

### Debugging
- Check browser console for frontend errors
- Check server logs for backend errors
- Use Razorpay dashboard for payment status

## Production Checklist

- [ ] Switch to live mode API keys
- [ ] Update webhook URL to production domain
- [ ] Test payment flow with real cards
- [ ] Monitor webhook delivery
- [ ] Set up error monitoring
- [ ] Configure backup payment verification

## Support

For Razorpay-specific issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

For application-specific issues:
- Check server logs
- Review API responses
- Verify database connections 