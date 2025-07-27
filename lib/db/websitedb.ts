import mongoose, { Mongoose, ConnectOptions } from "mongoose";

// Structured logging function
const log = (level: "info" | "error" | "warn", message: string, metadata: Record<string, unknown> = {}) => {
  const logDetails = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };
  console[level](`[TOOLS_DB] ${JSON.stringify(logDetails)}`);
};

// MongoDB URI from environment variable
const MONGODB_URI_TOOLS = process.env.MONGODB_URI_TOOLS || "";

// Validate MongoDB URI at startup
if (!MONGODB_URI_TOOLS) {
  log("error", "MongoDB URI is not defined");
  throw new Error("❌ MongoDB URI is not defined. Please set MONGODB_URI_TOOLS in your environment.");
}

// Global mongoose cache interface for tools DB
declare global {
  var mongooseTools: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

// Initialize cached connection
const cached = global.mongooseTools || { conn: null, promise: null };

// Track if listeners have been added to prevent duplicates
let toolsConnectionListenersAdded = false;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connectToolsDB(): Promise<Mongoose> {
  // Return cached connection if available
  if (cached.conn) {
    log("info", "Reusing existing TOOLS DB connection");
    return cached.conn;
  }

  // Initialize connection if no promise exists
  if (!cached.promise) {
    log("info", "Initiating new TOOLS DB connection");
    
    cached.promise = attemptConnectionWithRetry();
  }

  try {
    cached.conn = await cached.promise;
    global.mongooseTools = cached;
    return cached.conn;
  } catch (error) {
    log("error", "TOOLS DB connection failed", { error: (error as Error).message });
    cached.promise = null; // Reset promise for retry
    throw new Error(`❌ TOOLS DB connection error: ${(error as Error).message}`);
  }
}

async function attemptConnectionWithRetry(): Promise<Mongoose> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log("info", `Connection attempt ${attempt}/${MAX_RETRIES}`);
      
      // Create a new mongoose instance for tools DB to avoid conflicts
      const toolsMongoose = new mongoose.Mongoose();
      
      const options: ConnectOptions = {
        bufferCommands: false, // Disable command buffering for real-time apps
        maxPoolSize: 3, // Reduced pool size for better stability
        minPoolSize: 1, // Reduced minimum connections
        serverSelectionTimeoutMS: 15000, // Reduced timeout to 15 seconds
        socketTimeoutMS: 30000, // Reduced socket timeout to 30 seconds
        connectTimeoutMS: 15000, // Connection timeout
        family: 4, // Prefer IPv4 for consistency
        autoIndex: process.env.NODE_ENV !== "production", // Disable auto-indexing in production
        retryWrites: true, // Enable retryable writes
        w: "majority", // Write concern for data durability
        heartbeatFrequencyMS: 10000, // Heartbeat frequency
        maxIdleTimeMS: 30000, // Max idle time for connections
        directConnection: false, // Allow connection through mongos
        // Add retry options
        retryReads: true,
        // Add timeout options
        maxStalenessSeconds: 90,
      };

      const mongooseInstance = await toolsMongoose.connect(MONGODB_URI_TOOLS, options);
      
      log("info", "Successfully connected to TOOLS DB");
      
      // Only add listeners once to prevent memory leaks
      if (!toolsConnectionListenersAdded) {
        mongooseInstance.connection.on("disconnected", () => {
          log("warn", "TOOLS DB disconnected, will attempt to reconnect");
          cached.conn = null; // Reset connection on disconnect
        });
        mongooseInstance.connection.on("reconnected", () => {
          log("info", "TOOLS DB reconnected successfully");
        });
        mongooseInstance.connection.on("error", (err) => {
          log("error", "TOOLS DB connection error", { error: err.message });
          cached.conn = null; // Reset connection on error
        });
        toolsConnectionListenersAdded = true;
      }
      
      return mongooseInstance;
      
    } catch (error) {
      lastError = error as Error;
      log("error", `Connection attempt ${attempt} failed`, { 
        error: (error as Error).message,
        attempt,
        maxRetries: MAX_RETRIES
      });
      
      // If this is not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        log("info", `Waiting ${RETRY_DELAY}ms before retry...`);
        await delay(RETRY_DELAY);
      }
    }
  }

  // If all attempts failed, throw the last error
  throw lastError || new Error("Failed to connect to MongoDB after all retry attempts");
}

// Graceful shutdown handler
process.on("SIGINT", async () => {
  if (cached.conn) {
    await cached.conn.connection.close();
    log("info", "TOOLS DB connection closed due to app termination");
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (cached.conn) {
    await cached.conn.connection.close();
    log("info", "TOOLS DB connection closed due to app termination");
  }
  process.exit(0);
});

export { connectToolsDB };