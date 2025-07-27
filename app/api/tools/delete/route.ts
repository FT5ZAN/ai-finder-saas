import { connectToolsDB } from "@/lib/db/websitedb";
import { connectUserDB } from "@/lib/db/userdb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import { getToolModel } from "@/models/tools";

export async function DELETE(req: NextRequest) {
  try {
    const { toolId } = await req.json();

    if (!toolId) {
      return NextResponse.json(
        { error: "Tool ID is required" },
        { status: 400 }
      );
    }

    // Connect to both databases
    await connectToolsDB();
    await connectUserDB();
    const Tool = await getToolModel();

    // Find the tool to get its details
    const tool = await Tool.findById(toolId);
    
    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    console.log(`Deleting tool: ${tool.title} (ID: ${toolId})`);

    // Get all users who have liked or saved this tool (including in folders)
    const usersWithTool = await User.find({
      $or: [
        { likedTools: toolId },
        { 'savedTools.name': tool.title },
        { 'folders.tools.name': tool.title }
      ]
    });

    console.log(`Found ${usersWithTool.length} users with this tool`);

    // Remove tool from all users' likedTools, savedTools, and folders
    const updatePromises = usersWithTool.map(user => {
      const updates: Record<string, unknown> = {};
      
      // Remove from likedTools
      if (user.likedTools.includes(toolId)) {
        updates.$pull = { likedTools: toolId };
      }
      
      // Remove from savedTools (hard delete, not soft delete)
      const hasSavedTool = user.savedTools.some(st => st.name === tool.title);
      if (hasSavedTool) {
        updates.$pull = { savedTools: { name: tool.title } };
      }
      
      // Remove from all folders
      const foldersWithTool = user.folders.filter(folder => 
        folder.tools.some(t => t.name === tool.title)
      );
      
      if (foldersWithTool.length > 0) {
        // Update each folder that contains the tool
        const folderUpdates = user.folders.map((folder, index) => {
          const hasTool = folder.tools.some(t => t.name === tool.title);
          if (hasTool) {
            return {
              [`folders.${index}.tools`]: folder.tools.filter(t => t.name !== tool.title)
            };
          }
          return null;
        }).filter(Boolean);
        
        // Merge all folder updates
        folderUpdates.forEach(update => {
          Object.assign(updates, update);
        });
      }
      
      if (Object.keys(updates).length > 0) {
        return User.findByIdAndUpdate(user._id, updates, { new: true });
      }
      return Promise.resolve();
    });

    // Wait for all user updates to complete
    await Promise.all(updatePromises);

    // Finally, delete the tool from the tools collection
    await Tool.findByIdAndDelete(toolId);

    console.log(`Successfully deleted tool and cleaned up ${usersWithTool.length} user records`);

    return NextResponse.json({
      success: true,
      message: "Tool deleted successfully",
      cleanedUpUsers: usersWithTool.length
    });

  } catch (error) {
    console.error("Delete tool error:", error);
    return NextResponse.json(
      { error: "Failed to delete tool", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 