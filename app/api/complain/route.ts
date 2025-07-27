import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { message } = body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required and must be a string' }, { status: 400 });
    }

    if (message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
    }

    // Validate environment variables
    if (!process.env.MY_GMAIL || !process.env.MY_GMAIL_APP_PASSWORD) {
      console.error('Missing Gmail environment variables');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Create transporter with proper error handling
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_GMAIL_APP_PASSWORD,
      },
      // Add timeout and connection settings for production
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify transporter configuration
    await transporter.verify();

    // Send email with enhanced error handling
    const mailOptions = {
      from: process.env.MY_GMAIL,
      to: process.env.MY_GMAIL,
      subject: '🛠 New Complaint from AI Finder',
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">🚨 New Complaint from AI Finder</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px;">
            Received on: ${new Date().toLocaleString()}<br>
            From: AI Finder Complaint System
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Log successful complaint (without sensitive data)
    console.log(`Complaint submitted successfully at ${new Date().toISOString()}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Complaint submitted successfully' 
    });

  } catch (error) {
    // Enhanced error logging
    console.error('Complaint submission error:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        return NextResponse.json({ error: 'Email service authentication failed' }, { status: 500 });
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json({ error: 'Email service timeout' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to submit complaint. Please try again later.' 
    }, { status: 500 });
  }
} 