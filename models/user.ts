import mongoose, { Schema, model, models, Document, Model, Error as MongooseError } from "mongoose";
import validator from "validator";
import { isURL, isAlphanumeric, escape } from "validator";

// Constants
const MAX_EMAIL_LENGTH = 100;
const MAX_FOLDER_NAME_LENGTH = 100;
const MAX_TOOL_NAME_LENGTH = 100;
const MAX_URL_LENGTH = 2048;
const MAX_TOOL_DESCRIPTION_LENGTH = 1000;
const MAX_TOOL_CATEGORY_LENGTH = 50;
const MAX_SAVED_TOOLS = 200;
const SCHEMA_VERSION = 4;

// Subscription constants
const FREE_TOOL_LIMIT = 20;
const FREE_FOLDER_LIMIT = 3;
const TOOLS_PER_DOLLAR = 10;
const FOLDERS_PER_DOLLAR = 1;

// Interfaces
export interface ISavedTool {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  description?: string;
  category?: string;
  savedAt: Date;
}

export interface IFolder {
  name: string;
  tools: ISavedTool[];
  createdAt: Date;
}

export interface IPaymentHistory {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  planAmount: number;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  clerkId: string;
  name?: string;
  image?: string;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
  folders: IFolder[];
  savedTools: ISavedTool[];
  likedTools: mongoose.Types.ObjectId[];
  schemaVersion: number;
  totalSavedCount: number;
  
  // Subscription fields
  isSubscribed: boolean;
  planAmount: number; // Amount paid in dollars
  toolLimit: number;
  folderLimit: number;
  
  // Payment history
  paymentHistory: IPaymentHistory[];
  
  // Methods
  updateLastLogin(): Promise<void>;
  addFolder(folderName: string): Promise<void>;
  removeFolder(folderName: string): Promise<void>;
  renameFolder(oldName: string, newName: string): Promise<void>;
  addToolToFolder(folderName: string, tool: ISavedTool): Promise<void>;
  removeToolFromFolder(folderName: string, toolName: string): Promise<void>;
  addSavedTool(tool: ISavedTool): Promise<void>;
  removeSavedTool(toolName: string): Promise<void>;
  moveToolToFolder(toolName: string, folderName: string): Promise<void>;
  
  // Subscription methods
  getToolLimit(): number;
  getFolderLimit(): number;
  getTotalSavedTools(): number;
  canSaveMoreTools(): boolean;
  canCreateMoreFolders(): boolean;
  canAddToolToFolder(folderName: string): boolean;
  updateSubscription(planAmount: number): Promise<void>;
  addToBalance(amount: number): Promise<void>;
  addPaymentRecord(payment: IPaymentHistory): Promise<void>;
}

interface IUserModel extends Model<IUser> {
  watchChanges(): mongoose.mongo.ChangeStream;
}

// Log helper
const logError = (error: unknown, context: string, metadata: Record<string, any> = {}) => {
  const errorDetails = {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...metadata,
  };
  console.error(`[${context}] Error:`, errorDetails);
};

const UserSchema = new Schema<IUser, IUserModel>({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [MAX_EMAIL_LENGTH, `Email cannot exceed ${MAX_EMAIL_LENGTH} characters`],
    validate: {
      validator: (email: string) => validator.isEmail(email),
      message: "Please provide a valid email address",
    },
  },
  clerkId: {
    type: String,
    required: [true, "Clerk ID is required"],
    unique: true,
    index: true,
  },
  emailVerified: { type: Date, default: null },
  name: { type: String, trim: true },
  image: {
    type: String,
    trim: true,
    validate: {
      validator: (value: string) => !value || isURL(value),
      message: "Please provide a valid image URL",
    },
  },
  isActive: { type: Boolean, default: true, select: false },
  lastLogin: { type: Date, select: false },
  likedTools: {
    type: [Schema.Types.ObjectId],
    ref: "Tool",
    default: [],
    validate: {
      validator: (ids: mongoose.Types.ObjectId[]) => ids.length <= MAX_SAVED_TOOLS,
      message: `Cannot like more than ${MAX_SAVED_TOOLS} tools`,
    },
  },
  savedTools: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: MAX_TOOL_NAME_LENGTH,
          validate: {
            validator: (v: string) => isAlphanumeric(v, 'en-US', { ignore: ' -_+.' }),
            message: "Invalid tool name characters",
          },
        },
        logoUrl: {
          type: String,
          required: true,
          trim: true,
          maxlength: MAX_URL_LENGTH,
          validate: {
            validator: (v: string) => isURL(v, { require_protocol: true }),
            message: "Invalid logo URL",
          },
        },
        websiteUrl: {
          type: String,
          required: true,
          trim: true,
          maxlength: MAX_URL_LENGTH,
          validate: {
            validator: (v: string) => isURL(v, { require_protocol: true }),
            message: "Invalid website URL",
          },
        },
        description: {
          type: String,
          trim: true,
          maxlength: MAX_TOOL_DESCRIPTION_LENGTH,
          validate: {
            validator: (v: string) => !v || validator.isAscii(v),
            message: "Invalid characters in description",
          },
        },
        category: {
          type: String,
          trim: true,
          maxlength: MAX_TOOL_CATEGORY_LENGTH,
          validate: {
            validator: (v: string) => !v || isAlphanumeric(v, "en-US", { ignore: " -" }),
            message: "Invalid category characters",
          },
        },
        savedAt: { type: Date, default: Date.now },
      }
    ],
    default: [],
  },
  folders: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: MAX_FOLDER_NAME_LENGTH,
          validate: {
            validator: (v: string) => v && v.trim().length > 0,
            message: "Folder name cannot be empty",
          },
        },
        tools: {
          type: [
            {
              name: {
                type: String,
                required: true,
                trim: true,
                maxlength: MAX_TOOL_NAME_LENGTH,
                validate: {
                  validator: (v: string) => isAlphanumeric(v, 'en-US', { ignore: ' -_+.' }),
                  message: "Invalid tool name",
                },
              },
              logoUrl: {
                type: String,
                required: true,
                trim: true,
                maxlength: MAX_URL_LENGTH,
                validate: {
                  validator: (v: string) => isURL(v, { require_protocol: true }),
                  message: "Invalid logo URL",
                },
              },
              websiteUrl: {
                type: String,
                required: true,
                trim: true,
                maxlength: MAX_URL_LENGTH,
                validate: {
                  validator: (v: string) => isURL(v, { require_protocol: true }),
                  message: "Invalid website URL",
                },
              },
              description: {
                type: String,
                trim: true,
                maxlength: MAX_TOOL_DESCRIPTION_LENGTH,
                validate: {
                  validator: (v: string) => !v || validator.isAscii(v),
                  message: "Invalid characters in description",
                },
              },
              category: {
                type: String,
                trim: true,
                maxlength: MAX_TOOL_CATEGORY_LENGTH,
                validate: {
                  validator: (v: string) => !v || isAlphanumeric(v, 'en-US', { ignore: ' -' }),
                  message: "Invalid category",
                },
              },
              savedAt: { type: Date, default: Date.now },
            }
          ],
          default: [],
        },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    default: [],
  },
  
  // Subscription fields
  isSubscribed: { type: Boolean, default: false },
  planAmount: { type: Number, default: 0, min: 0 }, // Amount paid in dollars
  toolLimit: { type: Number, default: FREE_TOOL_LIMIT },
  folderLimit: { type: Number, default: FREE_FOLDER_LIMIT },
  
  // Payment history
  paymentHistory: {
    type: [
      {
        orderId: { type: String, required: true },
        paymentId: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true, default: 'INR' },
        status: { type: String, required: true },
        planAmount: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    default: [],
  },
  
  schemaVersion: { type: Number, default: SCHEMA_VERSION, select: false },
}, {
  timestamps: true,
  toJSON: { transform(doc, ret) { /* omitted for brevity */ return ret; } },
  toObject: { transform(doc, ret) { /* omitted for brevity */ return ret; } },
  autoIndex: process.env.NODE_ENV !== "production",
});

// Virtual for total saved count
UserSchema.virtual('totalSavedCount').get(function(this: IUser) {
  const savedToolsCount = this.savedTools.length;
  const folderToolsCount = this.folders.reduce((total, folder) => {
    return total + folder.tools.length;
  }, 0);
  return savedToolsCount + folderToolsCount;
});

// Instance methods
UserSchema.methods.updateLastLogin = async function(this: IUser): Promise<void> {
  this.lastLogin = new Date();
  await this.save();
};

UserSchema.methods.getToolLimit = function(this: IUser): number {
  if (this.isSubscribed && this.planAmount > 0) {
    return FREE_TOOL_LIMIT + (this.planAmount * TOOLS_PER_DOLLAR);
  }
  return FREE_TOOL_LIMIT;
};

UserSchema.methods.getFolderLimit = function(this: IUser): number {
  if (this.isSubscribed && this.planAmount > 0) {
    return FREE_FOLDER_LIMIT + (this.planAmount * FOLDERS_PER_DOLLAR);
  }
  return FREE_FOLDER_LIMIT;
};

UserSchema.methods.getTotalSavedTools = function(this: IUser): number {
  const savedToolsCount = this.savedTools.length;
  const folderToolsCount = this.folders.reduce((total, folder) => {
    return total + folder.tools.length;
  }, 0);
  return savedToolsCount + folderToolsCount;
};

UserSchema.methods.canSaveMoreTools = function(this: IUser): boolean {
  const currentCount = this.getTotalSavedTools();
  const limit = this.getToolLimit();
  return currentCount < limit;
};

UserSchema.methods.canCreateMoreFolders = function(this: IUser): boolean {
  const limit = this.getFolderLimit();
  return this.folders.length < limit;
};

UserSchema.methods.canAddToolToFolder = function(this: IUser, folderName: string): boolean {
  const folder = this.folders.find(f => f.name === folderName);
  if (!folder) return false;
  
  const toolsInFolder = folder.tools.length;
  return toolsInFolder < 5; // Maximum 5 tools per folder
};

UserSchema.methods.updateSubscription = async function(this: IUser, planAmount: number): Promise<void> {
  this.planAmount = planAmount;
  this.isSubscribed = planAmount > 0;
  this.toolLimit = this.getToolLimit();
  this.folderLimit = this.getFolderLimit();
  await this.save();
};

UserSchema.methods.addToBalance = async function(this: IUser, amount: number): Promise<void> {
  this.planAmount += amount;
  this.isSubscribed = this.planAmount > 0;
  this.toolLimit = this.getToolLimit();
  this.folderLimit = this.getFolderLimit();
  await this.save();
};

UserSchema.methods.addPaymentRecord = async function(this: IUser, payment: IPaymentHistory): Promise<void> {
  this.paymentHistory.push(payment);
  await this.save();
};

// Pre-save middleware to update limits
UserSchema.pre('save', function(next) {
  if (this.isModified('planAmount') || this.isModified('isSubscribed')) {
    this.toolLimit = this.getToolLimit();
    this.folderLimit = this.getFolderLimit();
  }
  next();
});

const User = (models.User as IUserModel) || model<IUser, IUserModel>("User", UserSchema);
export default User;
