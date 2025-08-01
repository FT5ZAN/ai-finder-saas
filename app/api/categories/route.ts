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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    console.log('API Request parameters:', {
      page,
      limit,
      search,
      url: request.url
    });

    // Validate parameters
    if (page < 1) {
      console.log('Validation failed: page < 1', { page });
      return NextResponse.json({ error: "Page must be greater than 0" }, { status: 400 });
    }
    if (limit < 1 || limit > 100) {
      console.log('Validation failed: limit out of range', { limit });
      return NextResponse.json({ error: "Limit must be between 1 and 100" }, { status: 400 });
    }

    // Retry database connection
    await retryOperation(async () => {
      await connectToolsDB();
    }, 3, 2000);

    const Tool = await getToolModel();

    // Get categories with pagination and search support
    const result = await retryOperation(async () => {
      // Get all unique categories first
      const allCategories: string[] = await Tool.distinct('category');
      const sortedCategories = [...new Set(allCategories)].sort();

      console.log('Database categories:', {
        totalCategories: allCategories.length,
        sortedCategories: sortedCategories.length
      });

      // Apply search filter if provided
      let filteredCategories = sortedCategories;
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredCategories = sortedCategories.filter(category =>
          category.toLowerCase().includes(searchLower)
        );
        console.log('Search filtered categories:', {
          search,
          filteredCount: filteredCategories.length
        });
      }

      // Calculate pagination
      const totalCategories = filteredCategories.length;
      const totalPages = Math.ceil(totalCategories / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

      console.log('Pagination calculation:', {
        totalCategories,
        totalPages,
        startIndex,
        endIndex,
        paginatedCategoriesCount: paginatedCategories.length
      });

      // Process only the paginated categories
      const categoryData: CategoryData[] = await Promise.all(
        paginatedCategories.map(async (category) => {
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

      return {
        categories: categoryData,
        pagination: {
          currentPage: page,
          totalPages,
          totalCategories,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      };
    }, 2, 1000);

    console.log(`API: Loaded ${result.categories.length} categories for page ${page} (${result.pagination.totalCategories} total)`);

    return NextResponse.json({
      success: true,
      categories: result.categories,
      pagination: result.pagination
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