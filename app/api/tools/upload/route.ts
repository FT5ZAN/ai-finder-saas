// app/api/tools/upload/route.ts
import { connectToolsDB } from "@/lib/db/websitedb";
import { getToolModel } from "@/models/tools";
import { NextRequest, NextResponse } from "next/server";

// Helper function to format URLs
function formatUrl(url: string): string {
  if (!url) return url;
  
  // Remove whitespace
  url = url.trim();
  
  // If it doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//)) {
    url = `https://${url}`;
  }
  
  return url;
}

// Helper function to validate and format tool data
function validateAndFormatTool(toolData: { title?: string; logoUrl?: string; websiteUrl?: string; category?: string; about?: string; keywords?: string[]; toolType?: string }) {
  const errors: string[] = [];
  
  // Check required fields
  if (!toolData.title?.trim()) {
    errors.push("Tool title is required");
  }
  
  if (!toolData.logoUrl?.trim()) {
    errors.push("Logo URL is required");
  }
  
  if (!toolData.websiteUrl?.trim()) {
    errors.push("Website URL is required");
  }
  
  if (!toolData.category?.trim()) {
    errors.push("Category is required");
  }
  
  if (!toolData.about?.trim()) {
    errors.push("About text is required");
  }
  
  if (!toolData.keywords || !Array.isArray(toolData.keywords) || toolData.keywords.length < 5 || toolData.keywords.length > 10) {
    errors.push("Keywords must be an array with 5-10 items");
  }
  
  if (!toolData.toolType) {
    errors.push("Tool type is required");
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  // Format URLs
  const formattedLogoUrl = formatUrl(toolData.logoUrl || '');
  const formattedWebsiteUrl = formatUrl(toolData.websiteUrl || '');
  
  return {
    title: (toolData.title || '').trim(),
    logoUrl: formattedLogoUrl,
    websiteUrl: formattedWebsiteUrl,
    category: (toolData.category || '').trim(),
    about: toolData.about?.trim() || "",
    keywords: toolData.keywords || [],
    toolType: toolData.toolType || '',
  };
}

export async function POST(req: NextRequest) {
  try {
    // Connect to tools database
    await connectToolsDB();
    const Tool = await getToolModel();
    
    const body = await req.json();

    // Validate input
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Data must be a non-empty array of tools" },
        { status: 400 }
      );
    }

    // Validate and format each tool
    const formattedTools = [];
    for (let i = 0; i < body.length; i++) {
      try {
        const formattedTool = validateAndFormatTool(body[i]);
        formattedTools.push(formattedTool);
      } catch (error) {
        return NextResponse.json(
          { 
            error: `Tool ${i + 1} validation failed`, 
            details: error instanceof Error ? error.message : "Unknown validation error",
            toolIndex: i
          },
          { status: 400 }
        );
      }
    }

    // Insert tools using Mongoose for proper validation and hooks
    const inserted = [];
    for (let i = 0; i < formattedTools.length; i++) {
      try {
        const toolData = formattedTools[i];
        console.log(`Creating tool ${i + 1}:`, {
          title: toolData.title,
          titleLength: toolData.title.length,
          about: toolData.about?.substring(0, 100) + (toolData.about?.length > 100 ? '...' : ''),
          aboutLength: toolData.about?.length,
          keywordsCount: toolData.keywords?.length,
          websiteUrl: toolData.websiteUrl,
          logoUrl: toolData.logoUrl
        });
        
        const tool = new Tool({
          ...toolData,
          likeCount: 0,
          saveCount: 0,
        });
        
        const savedTool = await tool.save();
        inserted.push(savedTool);
        console.log(`Successfully created tool: ${savedTool.title}`);
      } catch (error) {
        console.error(`Failed to create tool ${i + 1}:`, error);
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.name === 'ValidationError') {
            return NextResponse.json(
              { 
                error: `Tool ${i + 1} validation failed`, 
                details: error.message,
                toolIndex: i,
                field: error.message.includes('websiteUrl') ? 'websiteUrl' : 
                       error.message.includes('logoUrl') ? 'logoUrl' : 'unknown'
              },
              { status: 400 }
            );
          }
          if (error.name === 'MongoServerError' && (error as unknown as { code: number }).code === 11000) {
            return NextResponse.json(
              { 
                error: `Tool ${i + 1} title already exists`, 
                details: "A tool with this title already exists in the database",
                toolIndex: i
              },
              { status: 409 }
            );
          }
        }
        
        return NextResponse.json(
          { 
            error: `Failed to create tool ${i + 1}`, 
            details: error instanceof Error ? error.message : "Unknown error",
            toolIndex: i
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      insertedCount: inserted.length,
      message: `Successfully added ${inserted.length} tool${inserted.length > 1 ? 's' : ''}!`
    });
    
  } catch (err) {
    console.error("Tool insert error:", err);
    
    // Handle specific error types
    if (err instanceof Error) {
      if (err.name === 'ValidationError') {
        return NextResponse.json(
          { error: "Validation failed", details: err.message },
          { status: 400 }
        );
      }
      if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
        return NextResponse.json(
          { error: "Tool title already exists" },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
