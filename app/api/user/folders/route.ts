import { auth } from "@clerk/nextjs/server";
import { connectUserDB } from "@/lib/db/userdb";
import { connectToolsDB } from "@/lib/db/websitedb";
import User from "@/models/user";
import { getToolModel } from "@/models/tools";
import { NextResponse } from "next/server";

// Helper function to get user ID from Clerk
const getUserId = async (): Promise<string | null> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('No authenticated user found');
      return null;
    }
    console.log('Authenticated userId:', userId);
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Helper function to decrement tool save count
const decrementToolSaveCount = async (toolName: string) => {
  try {
    await connectToolsDB();
    const Tool = await getToolModel();
    
    await Tool.findOneAndUpdate(
      { title: toolName },
      { $inc: { saveCount: -1 } }
    );
  } catch (error) {
    console.error('Error decrementing tool save count:', error);
  }
};

// GET - Get all folders for the user
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to user database
    await connectUserDB();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return all folders with proper date formatting
    const folders = user.folders.map(folder => ({
      name: folder.name,
      tools: folder.tools,
      createdAt: folder.createdAt.toISOString()
    }));

    console.log('API returning folders:', folders);
    console.log('Folder names:', folders.map(f => f.name));

    return NextResponse.json({
      success: true,
      folders: folders,
      totalCount: folders.length
    });

  } catch (error) {
    console.error("Get folders error:", error);
    return NextResponse.json(
      { error: "Failed to get folders", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Create a new folder
export async function POST(req: Request) {
  try {
    const { folderName } = await req.json();
    console.log('POST /api/user/folders - folderName:', folderName);

    if (!folderName || folderName.trim() === '') {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('POST /api/user/folders - userId:', userId);

    // Connect to user database
    await connectUserDB();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user can create more folders
    if (!user.canCreateMoreFolders()) {
      const folderLimit = user.getFolderLimit();
      const currentFolders = user.folders.length;
      return NextResponse.json(
        { 
          error: "Folder limit reached", 
          details: `You can only create ${folderLimit} folders. You currently have ${currentFolders} folders.`,
          limit: folderLimit,
          current: currentFolders,
          isSubscribed: user.isSubscribed,
          planAmount: user.planAmount,
          redirectToPricing: true
        },
        { status: 403 }
      );
    }

    // Check if folder name already exists
    const existingFolder = user.folders.find(folder => 
      folder.name.toLowerCase() === folderName.trim().toLowerCase()
    );

    if (existingFolder) {
      return NextResponse.json(
        { error: "Folder with this name already exists" },
        { status: 409 }
      );
    }

    // Add new folder
    const newFolder = {
      name: folderName.trim(),
      tools: [],
      createdAt: new Date()
    };

    console.log('Creating new folder with data:', newFolder);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $push: { folders: newFolder } },
      { new: true, runValidators: true }
    );

    console.log('Updated user folders:', updatedUser?.folders);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to create folder" },
        { status: 500 }
      );
    }

    console.log('POST /api/user/folders - folder created successfully');

    return NextResponse.json({
      success: true,
      message: "Folder created successfully",
      folder: {
        name: newFolder.name,
        tools: newFolder.tools,
        createdAt: newFolder.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: "Failed to create folder", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a folder
export async function DELETE(req: Request) {
  try {
    const { folderName } = await req.json();
    console.log('DELETE /api/user/folders - folderName:', folderName);

    if (!folderName) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('DELETE /api/user/folders - userId:', userId);

    // Connect to user database
    await connectUserDB();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the folder
    const folder = user.folders.find(f => f.name === folderName);
    
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Decrement save count for all tools in the folder before deleting
    for (const tool of folder.tools) {
      await decrementToolSaveCount(tool.name);
    }

    // Remove folder completely from database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        $pull: { folders: { name: folderName } }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to delete folder" },
        { status: 500 }
      );
    }

    console.log('DELETE /api/user/folders - folder deleted successfully');

    return NextResponse.json({
      success: true,
      message: "Folder deleted successfully"
    });

  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json(
      { error: "Failed to delete folder", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT - Add tool to folder or remove tool from folder
export async function PUT(req: Request) {
  try {
    const { toolName, folderName, action } = await req.json();
    console.log('PUT /api/user/folders - toolName:', toolName, 'folderName:', folderName, 'action:', action);

    if (!toolName || !folderName || !action) {
      return NextResponse.json(
        { error: "Tool name, folder name, and action are required" },
        { status: 400 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('PUT /api/user/folders - userId:', userId);

    // Connect to user database
    await connectUserDB();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the folder
    const folder = user.folders.find(f => f.name === folderName);
    
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    if (action === 'add') {
      // Check if user can add more tools to this folder
      if (!user.canAddToolToFolder(folderName)) {
        const toolLimit = user.getToolLimit();
        const totalSavedTools = user.getTotalSavedTools();
        return NextResponse.json(
          { 
            error: "Tool limit reached", 
            details: `You can only save ${toolLimit} tools. You currently have ${totalSavedTools} tools.`,
            limit: toolLimit,
            current: totalSavedTools,
            isSubscribed: user.isSubscribed,
            planAmount: user.planAmount,
            redirectToPricing: true
          },
          { status: 403 }
        );
      }

      // Find the tool in saved tools
      const toolToAdd = user.savedTools.find(t => t.name === toolName);
      
      if (!toolToAdd) {
        return NextResponse.json(
          { error: "Tool not found in saved tools" },
          { status: 404 }
        );
      }

      // Check if tool is already in any other folder
      const toolInOtherFolder = user.folders.find(f => 
        f.name !== folderName && f.tools.some(t => t.name === toolName)
      );
      
      if (toolInOtherFolder) {
        return NextResponse.json(
          { error: `Tool "${toolName}" is already in folder "${toolInOtherFolder.name}". A tool can only be in one folder at a time.` },
          { status: 409 }
        );
      }

      // Check if tool is already in this folder
      const existingTool = folder.tools.find(t => t.name === toolName);
      if (existingTool) {
        return NextResponse.json(
          { error: `Tool "${toolName}" is already in folder "${folderName}"` },
          { status: 409 }
        );
      }

      // Add tool to folder and remove from saved tools
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $push: { [`folders.${user.folders.findIndex(f => f.name === folderName)}.tools`]: toolToAdd },
          $pull: { savedTools: { name: toolName } }
        },
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json(
          { error: "Failed to add tool to folder" },
          { status: 500 }
        );
      }

      console.log('PUT /api/user/folders - tool added to folder successfully');

      return NextResponse.json({
        success: true,
        message: "Tool added to folder successfully"
      });

    } else if (action === 'remove') {
      // Remove tool from folder
      const toolToRemove = folder.tools.find(t => t.name === toolName);
      
      if (!toolToRemove) {
        return NextResponse.json(
          { error: "Tool not found in this folder" },
          { status: 404 }
        );
      }

      // Remove tool from folder completely (don't add back to saved tools)
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $pull: { [`folders.${user.folders.findIndex(f => f.name === folderName)}.tools`]: { name: toolName } }
        },
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json(
          { error: "Failed to remove tool from folder" },
          { status: 500 }
        );
      }

      // Decrement save count when removing from folder since tool is completely removed
      await decrementToolSaveCount(toolName);

      console.log('PUT /api/user/folders - tool removed from folder successfully');

      return NextResponse.json({
        success: true,
        message: "Tool removed from folder successfully"
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'add' or 'remove'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Update folder error:", error);
    return NextResponse.json(
      { error: "Failed to update folder", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 