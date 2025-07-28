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

export async function GET() {
  try {
    // Retry database connection
    await retryOperation(async () => {
      await connectToolsDB();
    }, 3, 2000);

    const Tool = await getToolModel();

    // Get all categories with retry - optimized for large datasets
    const categoryData: CategoryData[] = await retryOperation(async () => {
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

    console.log(`API: Loaded ${categoryData.length} categories`);

    return NextResponse.json({
      success: true,
      categories: categoryData,
      total: categoryData.length
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