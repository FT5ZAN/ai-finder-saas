import { NextResponse } from 'next/server';
import { connectToolsDB } from '@/lib/db/websitedb';
import { getToolModel } from '@/models/tools';

interface CategoryData {
  name: string;
  toolCount: number;
  description: string;
}

// Retry function for database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database operation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('All retry attempts failed');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20'); // Default 20 items per page
    
    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: "Page number must be greater than 0" },
        { status: 400 }
      );
    }
    
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Retry database connection
    await retryOperation(async () => {
      await connectToolsDB();
    }, 3, 2000);

    const Tool = await getToolModel();

    // Get all categories with retry - optimized for large datasets
    const allCategoryData: CategoryData[] = await retryOperation(async () => {
      const categories: string[] = await Tool.distinct('category');
      const sorted = [...new Set(categories)].sort();

      // Process categories in batches to avoid memory issues
      const batchSize = 50;
      const data: CategoryData[] = [];
      
      for (let i = 0; i < sorted.length; i += batchSize) {
        const batch = sorted.slice(i, i + batchSize);
        
        const batchData = await Promise.all(
          batch.map(async (category) => {
            // Use countDocuments for better performance than find().length
            const toolCount = await Tool.countDocuments({ 
              category, 
              isActive: true 
            });
            
            // Get description from first tool in category
            const firstTool = await Tool.findOne({ 
              category, 
              isActive: true 
            }).select('about').lean();
            
            const description = firstTool?.about || `Explore amazing ${category.toLowerCase()} tools`;

            return {
              name: category,
              toolCount,
              description
            };
          })
        );
        
        data.push(...batchData);
      }

      return data;
    }, 2, 1000);

    // Sort by tool count (most popular first)
    const sortedCategories = allCategoryData.sort((a, b) => b.toolCount - a.toolCount);
    
    // Calculate pagination
    const totalCategories = sortedCategories.length;
    const totalPages = Math.ceil(totalCategories / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get paginated categories
    const paginatedCategories = sortedCategories.slice(startIndex, endIndex);

    console.log(`API: Page ${page}/${totalPages}, Showing ${paginatedCategories.length} of ${totalCategories} categories`);

    return NextResponse.json({
      success: true,
      categories: paginatedCategories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { 
        error: "Failed to get categories", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 