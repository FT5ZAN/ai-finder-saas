import { NextRequest, NextResponse } from "next/server";
import { connectUserDB } from "@/lib/db/userdb";
import { connectToolsDB } from "@/lib/db/websitedb";
import { getToolModel } from "@/models/tools";
import User from "@/models/user";
import { auth } from "@clerk/nextjs/server";

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

    // Connect to both databases
    await connectToolsDB();
    await connectUserDB();
    const Tool = await getToolModel();

    // Find the tool
    const tool = await Tool.findById(toolId);

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    // Check if user has liked this tool by checking their user document
    const user = await User.findOne({ clerkId: userId });
    const hasLiked = user ? user.likedTools.some(id => id.toString() === toolId) : false;

    return NextResponse.json({
      hasLiked,
      likeCount: tool.likeCount || 0
    });

  } catch (error) {
    console.error("Check like status error:", error);
    return NextResponse.json(
      { error: "Failed to check like status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { toolId } = await req.json();
    console.log('POST /api/tools/like - toolId:', toolId);

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

    console.log('POST /api/tools/like - userId:', userId);

    // Connect to both databases
    await connectToolsDB();
    await connectUserDB();
    const Tool = await getToolModel();

    // Find the tool
    const tool = await Tool.findById(toolId);
    console.log('POST /api/tools/like - found tool:', tool ? tool.title : 'not found');

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    // Check if user has already liked this tool
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already liked this tool
    if (user.likedTools.some(id => id.toString() === toolId)) {
      console.log('POST /api/tools/like - user already liked, returning early');
      return NextResponse.json({
        success: true,
        message: "Tool already liked",
        likeCount: tool.likeCount || 0,
        hasLiked: true
      });
    }

    console.log('POST /api/tools/like - user has not liked yet, incrementing likeCount');

    // Increment likeCount and add tool to user's likedTools
    const updatedTool = await Tool.findByIdAndUpdate(
      toolId,
      { 
        $inc: { likeCount: 1 } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedTool) {
      return NextResponse.json(
        { error: "Failed to update tool" },
        { status: 500 }
      );
    }

    console.log('POST /api/tools/like - updated tool likeCount:', updatedTool.likeCount);

    // Also add tool to user's likedTools array
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $addToSet: { likedTools: toolId } },
      { new: true }
    );

    console.log('POST /api/tools/like - added tool to user likedTools');

    return NextResponse.json({
      success: true,
      message: "Tool liked successfully",
      likeCount: updatedTool.likeCount || 0,
      hasLiked: true
    });

    console.log('POST /api/tools/like - like functionality disabled');

    return NextResponse.json({
      success: true,
      message: "Like functionality is currently disabled",
      likeCount: 0,
      hasLiked: false
    });

  } catch (error) {
    console.error("Like tool error:", error);
    return NextResponse.json(
      { error: "Failed to like tool", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { toolId } = await req.json();
    console.log('DELETE /api/tools/like - toolId:', toolId);

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

    console.log('DELETE /api/tools/like - userId:', userId);

    // Connect to both databases
    await connectToolsDB();
    await connectUserDB();
    const Tool = await getToolModel();

    // Find the tool
    const tool = await Tool.findById(toolId);
    console.log('DELETE /api/tools/like - found tool:', tool ? tool.title : 'not found');

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    // Check if user has liked this tool
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has actually liked this tool
    if (!user.likedTools.some(id => id.toString() === toolId)) {
      console.log('DELETE /api/tools/like - user has not liked this tool, returning early');
      return NextResponse.json({
        success: true,
        message: "Tool not liked",
        likeCount: tool.likeCount || 0,
        hasLiked: false
      });
    }

    console.log('DELETE /api/tools/like - user has liked this tool, decrementing likeCount');

    // Decrement likeCount and remove tool from user's likedTools
    const updatedTool = await Tool.findByIdAndUpdate(
      toolId,
      { 
        $inc: { likeCount: -1 } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedTool) {
      return NextResponse.json(
        { error: "Failed to update tool" },
        { status: 500 }
      );
    }

    console.log('DELETE /api/tools/like - updated tool likeCount:', updatedTool.likeCount);

    // Also remove tool from user's likedTools array
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { likedTools: toolId } },
      { new: true }
    );

    console.log('DELETE /api/tools/like - removed tool from user likedTools');

    return NextResponse.json({
      success: true,
      message: "Tool unliked successfully",
      likeCount: updatedTool.likeCount || 0,
      hasLiked: false
    });

  } catch (error) {
    console.error("Unlike tool error:", error);
    return NextResponse.json(
      { error: "Failed to unlike tool", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 