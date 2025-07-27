import { connectToolsDB } from "@/lib/db/websitedb";
import { getToolModel } from "@/models/tools";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'popularity'; // popularity, name, date
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Connect to tools database
    await connectToolsDB();
    const Tool = await getToolModel();

    // Build query
    const query: Record<string, unknown> = { isActive: true };
    if (category) {
      // Handle both URL-encoded format (from category cards) and slug format (from AI agent)
      let normalizedCategory = category.toLowerCase();
      
      // If it's URL-encoded (contains %20), decode it first
      if (normalizedCategory.includes('%20')) {
        normalizedCategory = decodeURIComponent(normalizedCategory);
      }
      
      // Create patterns for different category name formats
      const patterns = [
        normalizedCategory, // "all in one"
        normalizedCategory.replace(/\s+/g, '-'), // "all-in-one"
        normalizedCategory.replace(/\s+/g, ''), // "allinone"
        normalizedCategory.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), // "All In One"
        normalizedCategory.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-'), // "All-In-One"
      ];
      
      // Create a regex that matches any of these patterns
      const searchPattern = patterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      query.category = { $regex: new RegExp(searchPattern, 'i') };
    }

    // Build sort
    let sort: { [key: string]: 1 | -1 } = {};
    switch (sortBy) {
      case 'popularity':
        sort = { likeCount: -1, saveCount: -1 };
        break;
      case 'name':
        sort = { title: 1 };
        break;
      case 'date':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { likeCount: -1, saveCount: -1 };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const tools = await Tool.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalTools = await Tool.countDocuments(query);

    // Transform tools for response
    const transformedTools = tools.map((tool: Record<string, unknown>) => ({
      id: (tool._id as string | { toString(): string }).toString(),
      title: tool.title,
      logoUrl: tool.logoUrl,
      websiteUrl: tool.websiteUrl,
      category: tool.category,
      about: tool.about,
      keywords: tool.keywords || [],
      toolType: tool.toolType || 'browser',
      likeCount: tool.likeCount || 0,
      saveCount: tool.saveCount || 0,
      popularity: (Number(tool.likeCount) || 0) + (Number(tool.saveCount) || 0),
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt
    }));

    return NextResponse.json({
      success: true,
      tools: transformedTools,
      pagination: {
        page,
        limit,
        total: totalTools,
        totalPages: Math.ceil(totalTools / limit),
        hasNext: page * limit < totalTools,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Get tools error:", error);
    return NextResponse.json(
      { error: "Failed to get tools", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 