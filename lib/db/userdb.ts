// this code is use to connect to a MongoDB database for user data management.
// This code is designed to be production-ready, with robust error handling, connection retries, and logging.
// It uses Mongoose for MongoDB interactions and includes features like connection monitoring, graceful shutdown,
import mongoose from "mongoose";
// import { logger } from "winston"; // Assuming winston for logging
import { logger } from "../logger"; // ✅
import { env } from "process";
import { isValidMongoUri } from "../../utils/validators"; // Fixed import path

// Define interfaces for better type safety
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseUser: MongooseCache | undefined;
}

// Configuration interface
interface MongoConfig {
  uri: string;
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  maxPoolSize: number;
  minPoolSize: number;
}

// Production-ready configuration
const MONGO_CONFIG: MongoConfig = {
  uri: env.MONGODB_URI_USERS || "",
  maxRetries: 3,
  retryDelay: 2000,
  connectionTimeout: 30000, // Increased timeout
  maxPoolSize: 5, // Reduced for stability
  minPoolSize: 1, // Reduced minimum
};

// Initialize global cache
if (!global.mongooseUser) {
  global.mongooseUser = { conn: null, promise: null };
}
const cached: MongooseCache = global.mongooseUser;

// Logger instance (assuming it's configured elsewhere)
// Use 'logger' directly; do not instantiate
// (No need for: const Logger = new logger({...}))

// Validate environment variables
function validateEnv(): void {
  if (!MONGO_CONFIG.uri) {
    logger.error("MONGODB_URI_USERS environment variable is not defined");
    throw new Error("MONGODB_URI_USERS environment variable is not defined");
  }
  if (!isValidMongoUri(MONGO_CONFIG.uri)) {
    logger.error("Invalid MongoDB URI format");
    throw new Error("Invalid MongoDB URI format");
  }
}

// Connection status monitor with cleanup
let connectionListenersAdded = false;

function monitorConnection(): void {
  if (connectionListenersAdded) {
    return; // Prevent duplicate listeners
  }

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected successfully", {
      uri: maskUri(MONGO_CONFIG.uri),
    });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB connection disconnected");
    cached.conn = null; // Reset connection on disconnect
  });

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", { error });
    cached.conn = null; // Reset connection on error
  });

  connectionListenersAdded = true;
}

// Mask sensitive URI information
function maskUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.password) {
      url.password = "****";
    }
    return url.toString();
  } catch {
    return uri;
  }
}

// Retry logic for connection with improved error handling
async function connectWithRetry(attempt = 1): Promise<typeof mongoose> {
  try {
    // Try different connection options to handle DNS issues
    const connectionOptions = {
      bufferCommands: false,
      maxPoolSize: MONGO_CONFIG.maxPoolSize,
      minPoolSize: MONGO_CONFIG.minPoolSize,
      serverSelectionTimeoutMS: MONGO_CONFIG.connectionTimeout,
      socketTimeoutMS: 60000, // Increased socket timeout
      connectTimeoutMS: 30000, // Connection timeout
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 30000, // Max idle time
      autoIndex: process.env.NODE_ENV !== "production",
      retryWrites: true,
      w: "majority" as const,
      // DNS resolution improvements
      family: 4, // Force IPv4
      directConnection: false, // Allow connection through mongos
    };

    // Try connection with different DNS resolution strategies
    let connection;
    
    try {
      // First attempt: Standard connection
      connection = await mongoose.connect(MONGO_CONFIG.uri, connectionOptions);
      return connection;
    } catch (firstError) {
      logger.warn(`First connection attempt failed, trying alternative DNS resolution:`, { error: firstError });
      
      // Second attempt: Try with different DNS settings
      try {
        const alternativeOptions = {
          ...connectionOptions,
          family: 6, // Try IPv6
          directConnection: true, // Try direct connection
        };
        
        connection = await mongoose.connect(MONGO_CONFIG.uri, alternativeOptions);
        return connection;
      } catch (secondError) {
        logger.warn(`Second connection attempt failed, trying with simplified options:`, { error: secondError });
        
        // Third attempt: Simplified connection options
        const simplifiedOptions = {
          bufferCommands: false,
          serverSelectionTimeoutMS: 10000, // Shorter timeout
          socketTimeoutMS: 30000,
          connectTimeoutMS: 15000,
          retryWrites: true,
          w: "majority" as const,
        };
        
        connection = await mongoose.connect(MONGO_CONFIG.uri, simplifiedOptions);
        return connection;
      }
    }
  } catch (error) {
    if (attempt >= MONGO_CONFIG.maxRetries) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to connect to MongoDB after ${MONGO_CONFIG.maxRetries} attempts:`, { error: errorMessage });
      throw new Error(`Failed to connect to MongoDB after ${MONGO_CONFIG.maxRetries} attempts: ${errorMessage}`);
    }
    
    logger.warn(`MongoDB connection attempt ${attempt} failed, retrying...`, { 
      error: error instanceof Error ? error.message : error,
      attempt,
      maxRetries: MONGO_CONFIG.maxRetries
    });
    
    // Exponential backoff with jitter
    const delay = MONGO_CONFIG.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(attempt + 1);
  }
}

async function connectUserDB(): Promise<typeof mongoose> {
  // Return cached connection if available
  if (cached.conn) {
    logger.info("Reusing existing USER DB connection");
    return cached.conn;
  }

  // Validate environment
  validateEnv();

  // Initialize connection monitoring
  monitorConnection();

  if (!cached.promise) {
    try {
      logger.info("Initiating new USER DB connection");
      cached.promise = connectWithRetry().then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        logger.info("USER DB connected successfully");
        return mongooseInstance;
      }).catch((error) => {
        logger.error("Failed to connect to USER DB", { error: error.message });
        cached.promise = null;
        throw error;
      });
    } catch (error) {
      cached.promise = null;
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    logger.error("USER DB connection failed", { error: (error as Error).message });
    throw new Error(`USER DB connection error: ${(error as Error).message}`);
  }
}

// Graceful shutdown
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Closing MongoDB connection...`);
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during MongoDB connection closure", { error });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Initialize graceful shutdown handling
setupGracefulShutdown();

export { connectUserDB, MONGO_CONFIG };