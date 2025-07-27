# Complaint System Implementation

## Overview
The AI chatbot has been updated with a new complaint system that allows users to report issues or complaints directly through a modal interface. The complaints are sent to Gmail via a backend API endpoint.

## Changes Made

### 1. Backend API Route
- **File**: `app/api/complain/route.ts`
- **Purpose**: Handles complaint submissions and sends them to Gmail
- **Features**:
  - Validates complaint message
  - Uses nodemailer to send emails
  - Error handling and response formatting

### 2. AI Chatbot Component Updates
- **File**: `components/B-components/ai-chatbot/AIChatbot.tsx`
- **Changes**:
  - Removed old complaint system (WhatsApp integration)
  - Added complaint button (🚨) in input container
  - Added complaint modal with form
  - Added complaint submission handler
  - Added state management for complaint modal

### 3. CSS Styling
- **File**: `components/B-components/ai-chatbot/AIChatbot.module.css`
- **New Styles**:
  - `.complaintButton` - Styled complaint button
  - `.modalOverlay` - Modal backdrop
  - `.modal` - Modal container
  - `.modalHeader`, `.modalBody`, `.modalFooter` - Modal sections
  - `.cancelButton`, `.submitButton` - Modal buttons
  - Mobile responsive design

### 4. Dependencies
- **Added**: `nodemailer` and `@types/nodemailer`
- **Installation**: `npm install nodemailer @types/nodemailer --legacy-peer-deps`

## Environment Variables Required

Add these to your `.env` file:

```env
MY_GMAIL=yourname@gmail.com
MY_GMAIL_APP_PASSWORD=your_app_password
```

### Gmail App Password Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password as `MY_GMAIL_APP_PASSWORD`

## How It Works

1. **User clicks complaint button** (🚨) in the AI chatbot input area
2. **Modal opens** with a textarea for complaint description
3. **User types complaint** and clicks "Submit Complaint"
4. **API call** is made to `/api/complain` with the complaint message
5. **Email is sent** to the configured Gmail address
6. **Success message** is shown to the user
7. **Modal closes** automatically

## Testing

Use the provided test script:
```bash
node test-complaint-api.js
```

## Features

- ✅ Modern modal interface
- ✅ Form validation with character limits (5000 chars)
- ✅ Loading states and disabled states
- ✅ Comprehensive error handling
- ✅ Success notifications
- ✅ Mobile responsive design
- ✅ Gmail integration with HTML emails
- ✅ Clean UI/UX with character counter
- ✅ Production-ready error logging
- ✅ Input sanitization and validation
- ✅ Timeout handling for email service
- ✅ Environment variable validation

## Security Considerations

- ✅ Environment variables for sensitive data
- ✅ Input validation and sanitization on backend
- ✅ Error handling without exposing internal details
- ✅ Request method validation
- ✅ JSON parsing error handling
- ✅ Character limit enforcement (5000 chars)
- ✅ Empty message validation
- ✅ Type checking for all inputs
- ✅ Rate limiting (can be added if needed)

## Future Enhancements

- Add rate limiting to prevent spam
- Add complaint categories
- Add file attachments
- Add complaint tracking system
- Add admin dashboard for complaints 