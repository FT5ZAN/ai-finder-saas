# AI Finder - User Database Setup Guide

## 🚨 IMPORTANT: Complete Setup Required

Your AI Finder project has a **user creation system** that automatically creates users in MongoDB when they sign in with Clerk, but it requires proper configuration.

## 📋 Prerequisites

1. **MongoDB Atlas Account** (free tier available)
2. **Clerk Account** (already configured)
3. **Environment Variables** (need to be set up)

## 🔧 Step-by-Step Setup

### 1. Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new cluster (free tier is fine)
4. Create a database user with read/write permissions
5. Get your connection string

### 2. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# FOR CLERK (you already have these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# FOR MONGODB (ADD THIS)
MONGODB_URI_USERS=mongodb+srv://username:password@cluster.mongodb.net/ai-finder-users?retryWrites=true&w=majority
```

**Replace the MongoDB URI with your actual connection string from Atlas.**

### 3. Test the Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test database connection:**
   Visit: `http://localhost:3000/api/test-db`
   
   You should see:
   ```json
   {
     "success": true,
     "message": "Database connection successful",
     "userCount": 0,
     "recentUsers": []
   }
   ```

3. **Test user creation:**
   - Sign in with Clerk on your app
   - Check the browser console for user creation logs
   - Visit the test endpoint again to see if user count increased

## 🔍 How It Works

### Automatic User Creation

When a user signs in with Clerk, the `UserCreationHandler` component automatically:

1. Detects the sign-in event
2. Calls `/api/users/create` API
3. Creates a user record in MongoDB
4. Logs the result to console

### Database Schema

Users are stored with:
- `clerkId`: Unique Clerk user ID
- `email`: User's email address
- `name`: User's first name
- `image`: Profile image URL
- `emailVerified`: Email verification status
- `folders`: User's saved tool folders
- `savedTools`: User's saved tools

## 🐛 Troubleshooting

### Issue: "MONGODB_URI_USERS environment variable is not defined"

**Solution:** Add the MongoDB URI to your `.env.local` file.

### Issue: "Database connection failed"

**Solution:** 
1. Check your MongoDB Atlas connection string
2. Ensure your IP is whitelisted in Atlas
3. Verify database user has proper permissions

### Issue: Users not appearing in database

**Solution:**
1. Check browser console for errors
2. Verify Clerk authentication is working
3. Check server logs for API errors
4. Test the `/api/test-db` endpoint

### Issue: "Invalid MongoDB URI format"

**Solution:** Ensure your connection string follows this format:
```
mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
```

## 📊 Monitoring

### Check User Creation

1. **Browser Console:** Look for "User creation result" logs
2. **Database Test:** Visit `/api/test-db` to see user count
3. **MongoDB Atlas:** Check your database directly

### Expected Behavior

1. User signs in with Clerk ✅
2. Console shows: "User creation result: {created: true, user: {...}}" ✅
3. Database test shows user count > 0 ✅
4. User can save tools and create folders ✅

## 🚀 Production Deployment

For production, ensure:

1. **Environment Variables:** Set in your hosting platform
2. **MongoDB Atlas:** Use production cluster
3. **Clerk:** Use production keys
4. **IP Whitelist:** Add your server IP to MongoDB Atlas

## 📞 Support

If you're still having issues:

1. Check the browser console for errors
2. Check the server logs
3. Test the `/api/test-db` endpoint
4. Verify all environment variables are set correctly

---

**Once this setup is complete, users will automatically be created in your MongoDB database when they sign in with Clerk!** 🎉 