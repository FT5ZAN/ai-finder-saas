import { NextRequest, NextResponse } from 'next/server';
import { connectToolsDB } from '@/lib/db/websitedb';
import { getToolModel } from '@/models/tools';

interface ToolCardProps {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  toolType: 'browser' | 'downloadable';
  likeCount: number;
  saveCount: number;
  about?: string;
}

// Helper function to safely serialize tool data
function serializeToolData(rawTool: Record<string, unknown>): ToolCardProps {
  return {
    id: String(rawTool._id || ''),
    title: String(rawTool.title || ''),
    logoUrl: String(rawTool.logoUrl || ''),
    websiteUrl: String(rawTool.websiteUrl || ''),
    category: String(rawTool.category || ''),
    toolType: (rawTool.toolType === 'downloadable' ? 'downloadable' : 'browser') as 'browser' | 'downloadable',
    likeCount: Number(rawTool.likeCount || 0),
    saveCount: Number(rawTool.saveCount || 0),
    about: rawTool.about ? String(rawTool.about) : undefined,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    
    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToolsDB();
    const Tool = await getToolModel();

    // Build query
    let query: any = { isActive: true };
    
    if (search.trim()) {
      // Search in title, about, and category
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { about: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    query.category = { $regex: new RegExp(`^${decodedCategory}$`, 'i') };

    // Get total count
    const totalCount = await Tool.countDocuments(query);

    // If no exact match found, try partial match
    if (totalCount === 0) {
      query.category = { $regex: new RegExp(decodedCategory, 'i') };
      const partialCount = await Tool.countDocuments(query);
      
      if (partialCount === 0) {
        return NextResponse.json({
          tools: [],
          totalCount: 0,
          currentPage: page,
          totalPages: 0,
          hasMore: false
        });
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Get tools with pagination
    const tools = await Tool.find(query)
      .sort({ likeCount: -1, saveCount: -1 }) // Sort by popularity
      .skip(skip)
      .limit(limit)
      .lean()
      .select('_id title logoUrl websiteUrl category toolType likeCount saveCount about');

    // Serialize and filter tools
    const serializedTools = tools
      .map(serializeToolData)
      .filter((tool: ToolCardProps) => tool.title && tool.logoUrl && tool.websiteUrl);

    return NextResponse.json({
      tools: serializedTools,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
      category: decodedCategory
    });

  } catch (error) {
    console.error('Error fetching tools by category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 