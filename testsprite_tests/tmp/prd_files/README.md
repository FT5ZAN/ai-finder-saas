# AI Finder SaaS - Authentication System

A production-ready SaaS application with Google OAuth and email/password authentication built with Next.js, NextAuth.js, and MongoDB.

## 🚀 Features

- **Unified Authentication**: Single page for both login and registration
- **Google OAuth**: Seamless Google sign-in integration
- **Email/Password**: Traditional email and password authentication
- **MongoDB Integration**: Robust database storage with Mongoose
- **Production Ready**: Error handling, logging, and security best practices
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: NextAuth.js 4
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Validation**: Zod, Validator.js
- **Security**: bcryptjs, rate limiting
- **Logging**: Winston

## 📋 Prerequisites

- Node.js 18+ 
- npm 8+
- MongoDB Atlas account
- Google OAuth credentials

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
MONGODB_URI_USERS=your-mongodb-atlas-connection-string

# Optional: For production
NODE_ENV=production
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-finder-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Google OAuth and MongoDB credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Test authentication at `http://localhost:3000/auth/login`

## 🔐 Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to your `.env.local`

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Add it to `MONGODB_URI_USERS` in your `.env.local`

## 🏗️ Production Build

### Build for Production

```bash
# Clean previous builds
npm run clean

# Type check and lint
npm run type-check
npm run lint

# Build for production
npm run build:production
```

### Start Production Server

```bash
npm run start:production
```

### Environment Variables for Production

```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGODB_URI_USERS=your-production-mongodb-uri
```

## 🧪 Testing

### Test Database Connection

```bash
# Start the development server
npm run dev

# In another terminal, test the database connection
npm run test:db
```

### Manual Testing

1. **Email/Password Registration**:
   - Go to `/auth/login`
   - Click "Sign up"
   - Fill in name, email, and password
   - Submit and verify user is created

2. **Email/Password Login**:
   - Go to `/auth/login`
   - Enter email and password
   - Submit and verify successful login

3. **Google OAuth**:
   - Go to `/auth/login`
   - Click "Continue with Google"
   - Complete Google OAuth flow
   - Verify user is created in database

## 🔍 Troubleshooting

### Common Issues

#### 1. Google OAuth Not Working
- Verify Google OAuth credentials are correct
- Check redirect URIs match exactly
- Ensure Google+ API is enabled

#### 2. Database Connection Issues
- Verify MongoDB connection string
- Check network connectivity
- Ensure database user has proper permissions

#### 3. Users Not Storing in Database
- Check database connection logs
- Verify adapter configuration
- Test with debug endpoint: `/api/auth/debug`

#### 4. Authentication Errors
- Check NextAuth configuration
- Verify environment variables
- Review server logs for detailed errors

### Debug Endpoints

- **Database Status**: `GET /api/auth/debug`
- **Authentication Error**: `/auth/error`

### Logs

The application uses Winston for logging. Check console output for:
- Database connection status
- Authentication events
- Error details

## 📁 Project Structure

```
ai-finder-saas/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts    # NextAuth configuration
│   │       ├── register/route.ts         # User registration API
│   │       └── debug/route.ts            # Debug endpoint
│   ├── auth/
│   │   ├── login/page.tsx                # Unified auth page
│   │   ├── logout/page.tsx               # Logout page
│   │   └── error/page.tsx                # Error page
│   └── ...
├── lib/
│   ├── db/
│   │   ├── adapter.ts                    # Custom NextAuth adapter
│   │   ├── clientPromise.ts              # MongoDB client
│   │   └── userdb.ts                     # User database connection
│   └── logger.ts                         # Winston logger
├── models/
│   └── user.ts                           # User model with validation
└── ...
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **Rate Limiting**: 5 attempts per 15 minutes
- **Input Validation**: Zod schema validation
- **XSS Protection**: Input sanitization
- **CSRF Protection**: NextAuth built-in protection
- **Secure Headers**: Next.js security headers

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform supporting Node.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the debug endpoints
3. Check server logs
4. Create an issue with detailed information
