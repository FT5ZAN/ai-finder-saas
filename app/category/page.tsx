import { connectToolsDB } from '@/lib/db/websitedb';
import { getToolModel } from '@/models/tools';
import CategorySearch from '@/components/B-components/category-page-compoo/category-search';
import ErrorFallback from '@/components/B-components/category-page-compoo/ErrorFallback';
import './category.module.css';
import { Metadata } from 'next';

interface CategoryData {
  name: string;
  toolCount: number;
  description: string;
}

// SEO metadata
export const metadata: Metadata = {
  title: "AI Tool Categories | Find Tools by Use Case",
  description: "Browse AI tools grouped by category. Discover the best tools for design, writing, coding, and more.",
  keywords: "AI tools, categories, design tools, writing tools, coding tools, productivity tools",
  openGraph: {
    title: "AI Tool Categories | Find Tools by Use Case",
    description: "Browse AI tools grouped by category. Discover the best tools for design, writing, coding, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tool Categories | Find Tools by Use Case",
    description: "Browse AI tools grouped by category. Discover the best tools for design, writing, coding, and more.",
  },
};

// Add revalidation to ensure fresh data
export const revalidate = 60; // Revalidate every 60 seconds

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

// Get categories with pagination support
async function getCategoriesWithPagination(limit: number = 50): Promise<{
  categories: CategoryData[];
  totalCount: number;
}> {
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

    // Sort by tool count (most popular first) and limit to initial load
    const sortedCategories = categoryData
      .sort((a, b) => b.toolCount - a.toolCount)
      .slice(0, limit);

    return {
      categories: sortedCategories,
      totalCount: categoryData.length
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      categories: [],
      totalCount: 0
    };
  }
}

export default async function CategoryPage() {
  try {
    // Get categories with pagination (show first 50 initially to have multiple pages)
    const { categories, totalCount } = await getCategoriesWithPagination(50);
    
    console.log(`Loaded ${categories.length} categories (${totalCount} total available)`);

    return (
      <div className="grandp">
        <div className="parant">
          <div className="child">
            {/* Header Section - Title and Search in same row */}
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              padding: '0 1rem',
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto 2rem auto'
            }}>
              {/* Left Side - Title */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#fff',
                  margin: '0',
                  fontFamily: "'Courier New', Courier, monospace",
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  CATEGORYS
                </h1>
              </div>

              {/* Right Side - Search Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  minWidth: '300px'
                }}>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '25px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      backdropFilter: 'blur(10px)',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    🔍
                  </div>
                </div>
              </div>
            </div>

            {/* Category Cards Section */}
            <CategorySearch 
              initialCategories={categories} 
              totalCategoryCount={totalCount}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Database connection error:', error);
    
    return (
      <div className="grandp">
        <div className="parant">
          <div className="child">
            <ErrorFallback />
          </div>
        </div>
      </div>
    );
  }
}
