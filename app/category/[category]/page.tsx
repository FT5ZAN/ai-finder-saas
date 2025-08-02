import { connectToolsDB } from '@/lib/db/websitedb';
import { getToolModel } from '@/models/tools';
import { Metadata } from 'next';
import CategoryToolList from '@/components/B-components/category-page-compoo/SSRCategoryToolList';

import Link from 'next/link';
import { Suspense } from 'react';

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

interface PageProps {
  params: Promise<{ category: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  
  return {
    title: `${decodedCategory} AI Tools | Browse by Category`,
    description: `Discover the best ${decodedCategory.toLowerCase()} AI tools. Browse, compare, and find the perfect tools for your needs.`,
    keywords: `${decodedCategory.toLowerCase()}, AI tools, artificial intelligence, productivity tools`,
    openGraph: {
      title: `${decodedCategory} AI Tools | Browse by Category`,
      description: `Discover the best ${decodedCategory.toLowerCase()} AI tools. Browse, compare, and find the perfect tools for your needs.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${decodedCategory} AI Tools | Browse by Category`,
      description: `Discover the best ${decodedCategory.toLowerCase()} AI tools. Browse, compare, and find the perfect tools for your needs.`,
    },
  };
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

// Server-side data fetching - optimized for performance with large datasets
async function getToolsByCategory(category: string): Promise<ToolCardProps[]> {
  try {
    // Retry database connection
    await retryOperation(async () => {
      await connectToolsDB();
    }, 3, 2000);

    const Tool = await getToolModel();

    // Get tools for the category with retry - using case-insensitive matching
    // Reduced initial load to 25 tools for better performance
    const tools = await retryOperation(async () => {
      return await Tool.find({ 
        category: { $regex: new RegExp(`^${category}$`, 'i') }, // Case-insensitive exact match
        isActive: true 
      })
      .sort({ likeCount: -1, saveCount: -1 }) // Sort by popularity
      .limit(25) // Reduced to 25 tools initially for better performance
      .lean()
      .select('_id title logoUrl websiteUrl category toolType likeCount saveCount about'); // Select only needed fields
    }, 2, 1000);

    // If no exact match found, try partial matching
    if (tools.length === 0) {
      const partialTools = await retryOperation(async () => {
        return await Tool.find({ 
          category: { $regex: new RegExp(category, 'i') }, // Case-insensitive partial match
          isActive: true 
        })
        .sort({ likeCount: -1, saveCount: -1 }) // Sort by popularity
        .limit(25) // Reduced to 25 tools initially
        .lean()
        .select('_id title logoUrl websiteUrl category toolType likeCount saveCount about');
      }, 2, 1000);
      
      if (partialTools.length > 0) {
        console.log(`Found ${partialTools.length} tools with partial category match for "${category}"`);
        return partialTools
          .map(serializeToolData)
          .filter((tool: ToolCardProps) => tool.title && tool.logoUrl && tool.websiteUrl);
      }
    }

    return tools
      .map(serializeToolData)
      .filter((tool: ToolCardProps) => tool.title && tool.logoUrl && tool.websiteUrl);
  } catch (error) {
    console.error('Error fetching tools for category:', category, error);
    return [];
  }
}

// Get total count of tools for pagination
async function getTotalToolCount(category: string): Promise<number> {
  try {
    await retryOperation(async () => {
      await connectToolsDB();
    }, 3, 2000);

    const Tool = await getToolModel();

    // Get total count for exact match
    let count = await retryOperation(async () => {
      return await Tool.countDocuments({ 
        category: { $regex: new RegExp(`^${category}$`, 'i') },
        isActive: true 
      });
    }, 2, 1000);

    // If no exact match, try partial match
    if (count === 0) {
      count = await retryOperation(async () => {
        return await Tool.countDocuments({ 
          category: { $regex: new RegExp(category, 'i') },
          isActive: true 
        });
      }, 2, 1000);
    }

    return count;
  } catch (error) {
    console.error('Error getting total tool count:', error);
    return 0;
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  
  // Fetch tools server-side (limited to 25 initially for better performance)
  const tools = await getToolsByCategory(decodedCategory);
  
  // Get total count for pagination info
  const totalToolCount = await getTotalToolCount(decodedCategory);
  
  // Determine the tool type for this category
  let categoryToolType: 'browser' | 'downloadable' = 'browser';
  if (tools.length > 0) {
    const toolTypes = [...new Set(tools.map(tool => tool.toolType))];
    if (toolTypes.length === 1) {
      categoryToolType = toolTypes[0];
    }
  }

  // Show a better message instead of 404 if no tools found
  if (!tools.length) {
    // Let's get all available categories to help debug
    let availableCategories: string[] = [];
    try {
      await retryOperation(async () => {
        await connectToolsDB();
      }, 3, 2000);
      
      const Tool = await getToolModel();
      const categories = await Tool.distinct('category');
      availableCategories = categories.sort();
    } catch (error) {
      console.error('Error fetching available categories:', error);
    }

    return (
      <div style={{ 
        padding: "2rem", 
        color: "#ffffff",
        textAlign: "center",
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          No tools found for &quot;{decodedCategory}&quot;
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#cccccc", marginBottom: "2rem" }}>
          This category might be empty or the category name might be different.
        </p>
        {availableCategories.length > 0 && (
          <div style={{ marginBottom: "2rem", textAlign: "left" }}>
            <p style={{ fontSize: "1rem", color: "#999999", marginBottom: "0.5rem" }}>
              Available categories:
            </p>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "0.5rem",
              justifyContent: "center",
              maxWidth: "600px"
            }}>
              {availableCategories.slice(0, 10).map((cat) => (
                <Link 
                  key={cat}
                  href={`/category/${encodeURIComponent(cat.toLowerCase())}`}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#374151",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontSize: "0.9rem"
                  }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}
        <Link 
          href="/category" 
          style={{
            padding: "1rem 2rem",
            backgroundColor: "#667eea",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "1.1rem"
          }}
        >
          Browse All Categories
        </Link>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "1rem", 
      color: "#ffffff",
      minHeight: "auto"
    }}>
      <div style={{ 
        display: "flex",
        height: "50px",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
       
      }}>
        <div>
          <h1 style={{ 
            fontSize: "2.5rem", 
            marginBottom: "1rem",
            textAlign: "center"
          }}>
            {decodedCategory} 
          </h1>
          {/* Show pagination info */}
          {totalToolCount > 10 && (
            <p style={{ 
              fontSize: "0rem", 
              color: "#cccccc", 
              textAlign: "center",
              marginTop: "0.5rem"
            }}>
              Showing top 10 of {totalToolCount} tools
            </p>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <CategoryToolList 
          tools={tools}
          categoryName={decodedCategory}
          categoryToolType={categoryToolType}
          totalToolCount={totalToolCount}
        />
      </Suspense>
    </div>
  );
}
