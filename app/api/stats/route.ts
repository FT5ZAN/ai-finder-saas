import { NextResponse } from "next/server";
import { connectUserDB } from "@/lib/db/userdb";
import { connectToolsDB } from "@/lib/db/websitedb";
import User from "@/models/user";
import { getToolModel } from "@/models/tools";

// GET - Get platform statistics
export async function GET() {
  try {
    console.log('Stats API: Starting...');
    
    // Connect to databases
    await connectUserDB();
    console.log('Stats API: User DB connected');
    await connectToolsDB();
    console.log('Stats API: Tools DB connected');

    // Get user count (active users who have logged in)
    const userCount = await User.countDocuments({ 
      isActive: true,
      lastLogin: { $exists: true }
    });
    console.log('Stats API: User count:', userCount);

    // Get tool model and counts
    const Tool = await getToolModel();
    console.log('Stats API: Tool model obtained');
    
    // Get category count (unique categories from tools)
    const categories = await Tool.distinct('category');
    const categoryCount = categories.length;
    console.log('Stats API: Categories:', categories);
    console.log('Stats API: Category count:', categoryCount);

    // Get total tool count
    const toolCount = await Tool.countDocuments({});
    console.log('Stats API: Tool count:', toolCount);

    const result = {
      success: true,
      userCount,
      categoryCount,
      toolCount
    };
    
    console.log('Stats API: Final result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get statistics", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 