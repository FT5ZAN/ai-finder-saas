import { connectToolsDB } from "@/lib/db/websitedb";
import { getToolModel } from "@/models/tools";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Helper function to get user ID from Clerk
const getUserId = async (): Promise<string | null> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      // No authenticated user found
      return null;
    }
    // Authenticated userId received
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Helper function to increment saveCount and add user to savedBy for a tool
const incrementToolSaveCount = async (toolName: string) => {
  try {
    // Connect to tools database
    await connectToolsDB();
    const Tool = await getToolModel();
    
    // Find and update the tool - increment saveCount only
    const result = await Tool.updateOne(
      { title: toolName },
      { 
        $inc: { saveCount: 1 }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Incremented saveCount for tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error incrementing saveCount for tool ${toolName}:`, error);
  }
};

// Helper function to decrement saveCount and remove user from savedBy for a tool
const decrementToolSaveCount = async (toolName: string) => {
  try {
    // Connect to tools database
    await connectToolsDB();
    const Tool = await getToolModel();
    
    // Find and update the tool - decrement saveCount only
    const result = await Tool.updateOne(
      { title: toolName },
      { 
        $inc: { saveCount: -1 }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Decremented saveCount for tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error decrementing saveCount for tool ${toolName}:`, error);
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json(
        { error: "Tool ID is required" },
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

    // Connect to both databases to get tool name
    await connectToolsDB();
    await connectUserDB();
    const Tool = await getToolModel();

    // Find the tool to get its name
    const tool = await Tool.findById(toolId);
    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    // Find user and check if they have saved this tool
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if tool is in saved tools by name
    const hasSavedInUnsorted = user.savedTools.some(savedTool => savedTool.name === tool.title);
    
    // Check if tool is in any folder
    const hasSavedInFolders = user.folders.some(folder => 
      folder.tools.some(folderTool => folderTool.name === tool.title)
    );
    
    // Tool is saved if it's in saved tools OR in any folder
    const hasSaved = hasSavedInUnsorted || hasSavedInFolders;

    return NextResponse.json({
      hasSaved,
      savedToolsCount: user.savedTools.length
    });

  } catch (error) {
    console.error("Check save status error:", error);
    return NextResponse.json(
      { error: "Failed to check save status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { toolId } = await req.json();
    console.log('POST /api/tools/save - toolId:', toolId);

    if (!toolId) {
      return NextResponse.json(
        { error: "Tool ID is required" },
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

    console.log('POST /api/tools/save - userId:', userId);

    // Connect to both databases
    await connectToolsDB();
    await connectUserDB();
    const Tool = await getToolModel();

    // Find the tool
    const tool = await Tool.findById(toolId);
    console.log('POST /api/tools/save - found tool:', tool ? tool.title : 'not found');

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user can save more tools
    if (!user.canSaveMoreTools()) {
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

    // Check if user already saved this tool
    const existingTool = user.savedTools.find(t => t.name === tool.title);
    if (existingTool) {
      console.log('POST /api/tools/save - tool already saved, returning early');
      return NextResponse.json({
        success: true,
        message: "Tool already saved",
        savedToolsCount: user.savedTools.length,
        hasSaved: true
      });
    }

    // Add tool to user's saved tools
    const savedTool = {
      name: tool.title,
      logoUrl: tool.logoUrl,
      websiteUrl: tool.websiteUrl,
      category: tool.category,
      toolType: tool.toolType || 'browser',
      savedAt: new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $push: { savedTools: savedTool } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to save tool" },
        { status: 500 }
      );
    }

    console.log('POST /api/tools/save - tool saved successfully');

    // Increment saveCount for the tool and add user to savedBy
    await incrementToolSaveCount(tool.title);

    // Get the updated tool to get the new saveCount
    const updatedTool = await Tool.findById(toolId);
    const newSaveCount = updatedTool ? updatedTool.saveCount : tool.saveCount + 1;

    return NextResponse.json({
      success: true,
      message: "Tool saved successfully",
      savedToolsCount: updatedUser.savedTools.length,
      hasSaved: true,
      saveCount: newSaveCount
    });

  } catch (error) {
    console.error("Save tool error:", error);
    return NextResponse.json(
      { error: "Failed to save tool", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { toolId } = await req.json();
    console.log('DELETE /api/tools/save - toolId:', toolId);

    if (!toolId) {
      return NextResponse.json(
        { error: "Tool ID is required" },
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

    console.log('DELETE /api/tools/save - userId:', userId);

    // Connect to both databases
    await connectToolsDB();
    await connectUserDB();
    const Tool = await getToolModel();

    // Find the tool
    const tool = await Tool.findById(toolId);
    console.log('DELETE /api/tools/save - found tool:', tool ? tool.title : 'not found');

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has saved this tool (either in savedTools or in any folder)
    const existingTool = user.savedTools.find(t => t.name === tool.title);
    const toolInFolders = user.folders.filter(folder => 
      folder.tools.some(t => t.name === tool.title)
    );
    
    if (!existingTool && toolInFolders.length === 0) {
      console.log('DELETE /api/tools/save - tool not saved anywhere, returning early');
      return NextResponse.json({
        success: true,
        message: "Tool not saved",
        savedToolsCount: user.savedTools.length,
        hasSaved: false
      });
    }

    // Prepare update operations
    const updateOperations: Record<string, any> = {};
    
    // Remove tool from saved tools if it exists there
    if (existingTool) {
      updateOperations.$pull = { savedTools: { name: tool.title } };
    }
    
    // Remove tool from all folders where it exists
    toolInFolders.forEach(folder => {
      const folderIndex = user.folders.findIndex(f => f.name === folder.name);
      if (folderIndex !== -1) {
        if (!updateOperations.$pull) updateOperations.$pull = {};
        updateOperations.$pull[`folders.${folderIndex}.tools`] = { name: tool.title };
      }
    });

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateOperations,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to unsave tool" },
        { status: 500 }
      );
    }

    console.log('DELETE /api/tools/save - tool unsaved successfully from all locations');

    // Decrement saveCount for the tool and remove user from savedBy
    await decrementToolSaveCount(tool.title);

    // Get the updated tool to get the new saveCount
    const updatedTool = await Tool.findById(toolId);
    const newSaveCount = updatedTool ? updatedTool.saveCount : Math.max(0, (tool.saveCount || 0) - 1);

    return NextResponse.json({
      success: true,
      message: "Tool unsaved successfully",
      savedToolsCount: updatedUser.savedTools.length,
      hasSaved: false,
      saveCount: newSaveCount
    });

  } catch (error) {
    console.error("Unsave tool error:", error);
    return NextResponse.json(
      { error: "Failed to unsave tool", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 