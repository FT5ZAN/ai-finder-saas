// app/api/users/create/route.ts for creating a user in the database with Clerk authentication
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";

// Enhanced retry function with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database operation attempt ${attempt} failed:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        attempt,
        maxRetries
      });
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('All retry attempts failed');
}

export async function POST() {
  try {
    // Get authentication data
    const { userId } = await auth();
    if (!userId) {
      console.error("No userId found in auth");
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user data from Clerk
    const user = await currentUser();
    if (!user) {
      console.error("No user found in currentUser");
      return new Response("User not found", { status: 404 });
    }

    console.log("Creating user in database:", { 
      userId, 
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Connect to database with enhanced retry
    try {
      await retryOperation(async () => {
        return await connectUserDB();
      }, 3, 2000);
      console.log("Database connected successfully");
    } catch (connectionError) {
      console.error("Failed to connect to database after all retries:", connectionError);
      return new Response("Database connection failed", { status: 503 });
    }

    // Check if user already exists with retry
    let existing;
    try {
      existing = await retryOperation(async () => {
        return await User.findOne({ clerkId: userId });
      }, 2, 1000);
    } catch (findError) {
      console.error("Failed to check existing user:", findError);
      return new Response("Database query failed", { status: 500 });
    }

    if (existing) {
      console.log("User already exists:", existing._id);
      return Response.json({ exists: true, user: existing });
    }

    // Create new user with retry
    const primaryEmail = user.emailAddresses?.[0];
    let newUser;
    try {
      newUser = await retryOperation(async () => {
        const userData = {
          clerkId: userId,
          email: primaryEmail?.emailAddress || "",
          name: user.firstName || "",
          image: user.imageUrl || "",
          emailVerified: primaryEmail?.verification?.status === "verified" ? new Date() : null,
        };
        
        console.log("Creating user with data:", userData);
        return await User.create(userData);
      }, 2, 1000);
    } catch (createError) {
      console.error("Failed to create user:", createError);
      
      // Handle specific MongoDB errors
      if (createError instanceof Error) {
        if (createError.message.includes("duplicate key")) {
          console.log("Duplicate key error - user might already exist");
          // Try to find the user again in case it was created by another request
          try {
            const existingUser = await User.findOne({ clerkId: userId });
            if (existingUser) {
              return Response.json({ exists: true, user: existingUser });
            }
          } catch (findError) {
            console.error("Failed to find user after duplicate key error:", findError);
          }
          return new Response("User already exists", { status: 409 });
        }
        if (createError.message.includes("validation failed")) {
          console.error("Validation error:", createError.message);
          return new Response("Invalid user data", { status: 400 });
        }
        if (createError.message.includes("connection") || createError.message.includes("timeout")) {
          console.error("Connection error during user creation:", createError.message);
          return new Response("Database connection failed", { status: 503 });
        }
      }
      
      return new Response("Failed to create user", { status: 500 });
    }

    console.log("User created successfully:", newUser._id);
    return Response.json({ created: true, user: newUser });

  } catch (error) {
    console.error("User create error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return new Response("User already exists", { status: 409 });
      }
      if (error.message.includes("validation failed")) {
        return new Response("Invalid user data", { status: 400 });
      }
      if (error.message.includes("connection") || error.message.includes("timeout")) {
        return new Response("Database connection failed", { status: 503 });
      }
    }
    
    return new Response("Failed to create user", { status: 500 });
  }
}
