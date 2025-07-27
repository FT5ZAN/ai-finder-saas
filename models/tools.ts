import mongoose, { Schema, model, models, Document, Model, Error as MongooseError } from "mongoose";
import validator from "validator";
import { isURL, isAlphanumeric, escape } from "validator";
import { connectToolsDB } from "../lib/db/websitedb";

// Constants
const MAX_TITLE_LENGTH = 100;
const MAX_URL_LENGTH = 2048;
const MAX_CATEGORY_LENGTH = 50;
const MAX_ABOUT_LENGTH = 5000;

// Interfaces
export interface ITool extends Document {
  title: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  about: string;
  keywords: string[];
  toolType: 'browser' | 'downloadable';
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
  likeCount: number;
  saveCount: number;

}

interface IToolModel extends Model<ITool> {
  watchChanges(): mongoose.mongo.ChangeStream;
}

// Structured logging function
const logError = (error: unknown, context: string, metadata: Record<string, unknown> = {}) => {
  const errorDetails = {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...metadata,
  };
  console.error(`[TOOL_MODEL] ${context}:`, errorDetails);
};

const ToolSchema = new Schema<ITool, IToolModel>(
  {
    title: {
      type: String,
      required: [true, "Tool title is required"],
      trim: true,
      maxlength: [MAX_TITLE_LENGTH, `Title cannot exceed ${MAX_TITLE_LENGTH} characters`],
      validate: {
        validator: (value: string) => {
          // Allow letters, numbers, spaces, and common punctuation used in tool names
          // This includes: letters, numbers, spaces, hyphens, underscores, plus signs, periods, 
          // parentheses, colons, ampersands, exclamation marks, question marks, apostrophes, 
          // forward slashes, backslashes, hash symbols, and dots
          const allowedPattern = /^[a-zA-Z0-9\s\-_.+()&!?'"\/\\#:;@$%*]+$/;
          
          // Debug: Log any characters that don't match the pattern
          const invalidChars = value.split('').filter(char => !allowedPattern.test(char));
          if (invalidChars.length > 0) {
            console.log(`[TOOL_VALIDATION] Invalid characters in title "${value}":`, invalidChars);
          }
          
          return allowedPattern.test(value);
        },
        message: "Title contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed.",
      },
    },
    logoUrl: {
      type: String,
      required: [true, "Logo URL is required"],
      trim: true,
      maxlength: [MAX_URL_LENGTH, `Logo URL cannot exceed ${MAX_URL_LENGTH} characters`],
      validate: {
        validator: (value: string) => isURL(value, { require_protocol: true }),
        message: "Please provide a valid logo URL (e.g., https://example.com/logo.png)",
      },
    },
    websiteUrl: {
      type: String,
      required: [true, "Website URL is required"],
      trim: true,
      maxlength: [MAX_URL_LENGTH, `Website URL cannot exceed ${MAX_URL_LENGTH} characters`],
      validate: {
        validator: (value: string) => isURL(value, { require_protocol: true }),
        message: "Please provide a valid website URL (e.g., https://example.com)",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [MAX_CATEGORY_LENGTH, `Category cannot exceed ${MAX_CATEGORY_LENGTH} characters`],
      validate: {
        validator: (value: string) => isAlphanumeric(value, "en-US", { ignore: " -" }),
        message: "Category can only contain letters, numbers, spaces, or hyphens",
      },
    },
    about: {
      type: String,
      required: [true, "About text is required"],
      trim: true,
      maxlength: [MAX_ABOUT_LENGTH, `About section cannot exceed ${MAX_ABOUT_LENGTH} characters`],
    },
    keywords: {
      type: [String],
      required: [true, "Keywords are required"],
      validate: {
        validator: function(value: string[]) {
          return value && value.length >= 5 && value.length <= 10;
        },
        message: "Keywords must be between 5 and 10 items.",
      },
    },
    toolType: {
      type: String,
      required: true,
      enum: ['browser', 'downloadable'],
      default: 'browser',
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false, // Exclude from queries by default
    },
    likeCount: {
      type: Number,
      default: 0,
      min: [0, "Like count cannot be negative"],
    },
    saveCount: {
      type: Number,
      default: 0,
      min: [0, "Save count cannot be negative"],
    },

    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.isActive; // Exclude isActive from API responses
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.isActive;
        return ret;
      },
    },
    autoIndex: process.env.NODE_ENV !== "production", // Disable auto-indexing in production
  }
);

// Indexes for performance
ToolSchema.index({ title: 1 }, { unique: true }); // Ensure unique titles
ToolSchema.index({ category: 1 }); // Optimize category-based queries
ToolSchema.index({ keywords: 1 }); // Optimize keyword-based searches
ToolSchema.index({ isActive: 1 }); // Optimize filtering active tools

// Helper function to clean special characters
function cleanSpecialCharacters(text: string): string {
  return text
    .replace(/[™©®•–—…]/g, '') // Remove trademark symbols, bullet points, em dashes, ellipsis
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Helper function to clean title characters
function cleanTitleCharacters(text: string): string {
  return text
    .replace(/[™©®•–—…]/g, '') // Remove trademark symbols, bullet points, em dashes, ellipsis
    .replace(/[^\w\s\-_.+()&!?'"\/\\#:;@$%*]/g, '') // Remove any other special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Pre-save hook for data sanitization
ToolSchema.pre("save", async function (next) {
  try {
    // Sanitize input data
    this.title = cleanTitleCharacters(this.title);
    this.category = escape(this.category);
    
    // Preserve about field without escaping to maintain user input
    if (this.about && this.about.trim()) {
      this.about = this.about.trim();
    }

    next();
  } catch (error) {
    logError(error, "ToolSchema-PreSave", { toolId: this._id?.toString(), title: this.title });
    next(error as MongooseError);
  }
});

// Error handling for save operations
ToolSchema.post("save", function (
  error: MongooseError & { name?: string; code?: number; keyPattern?: Record<string, number> },
  doc: ITool,
  next: (err?: Error) => void
) {
  const metadata = { toolId: String(doc._id), title: doc.title };
  if (error.name === "MongoServerError" && (error as unknown as { code: number }).code === 11000) {
    logError(error, "ToolSchema-DuplicateKey", metadata);
    next(new Error("Tool title already exists"));
  } else if (error.name === "ValidationError") {
    logError(error, "ToolSchema-Validation", metadata);
    next(new Error(error.message));
  } else {
    logError(error, "ToolSchema-Save", metadata);
    next(error);
  }
});

// Static method for real-time updates
ToolSchema.statics.watchChanges = function () {
  return this.watch().on("change", (change) => {
    console.log("[TOOL_MODEL] Change detected:", change);
    // Integrate with WebSocket or event emitter for real-time updates
  });
};

// Function to get the Tool model with proper database connection
async function getToolModel(): Promise<IToolModel> {
  try {
    // Ensure database connection to tools DB
    const toolsConnection = await connectToolsDB();
    
    // Force recreate the model to ensure schema changes are applied
    if (toolsConnection.models.Tool) {
      toolsConnection.deleteModel('Tool');
    }
    
    // Create new model on the tools connection
    return toolsConnection.model<ITool, IToolModel>("Tool", ToolSchema);
  } catch (error) {
    logError(error, "getToolModel", {});
    throw new Error(`Failed to get Tool model: ${(error as Error).message}`);
  }
}

// Export both the schema and the model getter function
export { ToolSchema, getToolModel };

// Default export for backward compatibility
// Note: This should be used carefully as it may not always use the correct connection
// Prefer using getToolModel() for guaranteed correct database connection
let Tool: IToolModel;

// Initialize the default export when needed
const getDefaultTool = () => {
  if (!Tool) {
    // This is a fallback - prefer using getToolModel() instead
    Tool = (models.Tool as IToolModel) || model<ITool, IToolModel>("Tool", ToolSchema);
  }
  return Tool;
};

export default getDefaultTool;