'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CategoryCard from './card';
import SearchBar from './search-bar';

interface CategoryData {
  name: string;
  toolCount: number;
  description: string;
}

interface CategorySearchProps {
  initialCategories: CategoryData[];
  totalCategoryCount?: number;
}

const CategorySearch: React.FC<CategorySearchProps> = ({ 
  initialCategories, 
  totalCategoryCount = 0 
}) => {
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedCategories, setDisplayedCategories] = useState<CategoryData[]>([]);

  // Performance optimization: items per page - show 20 categories per page
  const ITEMS_PER_PAGE = 20; // Show 20 categories per page

  // Function to refresh category data
  const refreshCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        setCategories(data.categories || initialCategories);
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [initialCategories]);

  // Refresh categories every 5 minutes to get updated counts
  useEffect(() => {
    const interval = setInterval(refreshCategories, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [refreshCategories]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }

    const searchLower = searchTerm.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchLower) ||
      category.description.toLowerCase().includes(searchLower)
    );
  }, [categories, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Debug log to see pagination state
  console.log('Pagination Debug:', {
    filteredCategoriesLength: filteredCategories.length,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    ITEMS_PER_PAGE
  });

  // Update displayed categories when search or page changes
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setDisplayedCategories(filteredCategories.slice(startIndex, endIndex));
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [filteredCategories, startIndex, endIndex]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Navigation functions
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return (
    <>
      <div className="search-container">
        <SearchBar onSearch={handleSearchChange} />
      </div>
      
      {/* Pagination Info */}
      {!searchTerm && totalCategoryCount > 0 && (
        <div className="pagination-info">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} categories
          {totalCategoryCount > filteredCategories.length && ` (${totalCategoryCount} total available)`}
        </div>
      )}

      {/* Search Results Info */}
      {searchTerm && (
        <div className="search-results-info">
          Found {filteredCategories.length} category{filteredCategories.length !== 1 ? 'ies' : 'y'} for "{searchTerm}"
        </div>
      )}

      <div className="categories-container">
        <div className="categories-grid">
          {isLoading && displayedCategories.length === 0 ? (
            // Loading skeleton
            Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <div 
                key={`skeleton-${index}`}
                className="loading-skeleton"
              />
            ))
          ) : displayedCategories.length > 0 ? (
            <>
              {displayedCategories.map((category) => (
                <CategoryCard 
                  key={category.name} 
                  name={category.name}
                  toolCount={category.toolCount}
                  description={category.description}
                />
              ))}
              
              {/* Pagination Controls */}
              {totalPages >= 1 && (
                <div className="pagination-controls">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                  >
                    ← Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Show message when only one page */}
              {totalPages === 1 && (
                <div className="single-page-message">
                  <p>Showing all {filteredCategories.length} categories</p>
                </div>
              )}

              {/* Load More Indicator for Total Categories */}
              {totalCategoryCount > filteredCategories.length && !searchTerm && (
                <div className="load-more-indicator">
                  <p>Showing {filteredCategories.length} of {totalCategoryCount} categories</p>
                  <p>More categories are available. Use search to find specific categories.</p>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <p>No categories match your search: "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for responsive design with perfect 4-column grid */}
      <style jsx>{`
        .search-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          padding: 0 1rem;
          width: 100%;
        }

        .pagination-info,
        .search-results-info {
          text-align: center;
          margin-bottom: 1rem;
          color: #fff;
          font-size: 0.9rem;
          background: rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          border-radius: 5px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .categories-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .categories-grid {
          display: grid;
          width: 100%;
          max-width: 1400px;
          padding: 0 1rem;
          gap: 20px;
          justify-items: center;
        }

        /* Desktop - Perfect 4-column grid */
        @media (min-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            max-width: 1200px;
          }
        }

        /* Large Desktop - Perfect 4-column grid */
        @media (min-width: 1400px) {
          .categories-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 28px;
            max-width: 1400px;
          }
        }

        .loading-skeleton {
          width: 100%;
          max-width: 280px;
          height: 160px;
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .pagination-controls {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          padding: 2rem 1rem;
          color: #fff;
          flex-wrap: wrap;
        }

        .pagination-btn {
          padding: 0.5rem 1rem;
          background-color: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(.disabled) {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .pagination-btn.disabled {
          background-color: rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
          opacity: 0.5;
        }

        .page-numbers {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .page-btn {
          padding: 0.5rem 0.75rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          color: #fff;
          cursor: pointer;
          min-width: 2.5rem;
          transition: all 0.2s ease;
        }

        .page-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .page-btn.active {
          background-color:rgb(0, 0, 0);
        }

        .single-page-message,
        .load-more-indicator {
          grid-column: 1 / -1;
          text-align: center;
          padding: 1rem;
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .single-page-message p,
        .load-more-indicator p {
          margin: 0;
          font-size: 0.9rem;
          color: #cccccc;
        }

        .load-more-indicator p:first-child {
          margin-bottom: 1rem;
          color: #fff;
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem;
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        /* Tablet - 3 columns */
        @media (max-width: 1023px) and (min-width: 768px) {
          .categories-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            max-width: 900px;
          }
        }

        /* Mobile Large - 2 columns */
        @media (max-width: 767px) and (min-width: 600px) {
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            max-width: 600px;
            padding: 0 0.5rem;
          }
        }

        /* Mobile - 1 column */
        @media (max-width: 599px) {
          .categories-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 0 0.5rem;
          }

          .pagination-controls {
            flex-direction: column;
            gap: 0.5rem;
          }

          .page-numbers {
            justify-content: center;
          }
        }

        /* Mobile Small */
        @media (max-width: 480px) {
          .pagination-info,
          .search-results-info {
            font-size: 0.8rem;
            padding: 0.375rem;
          }

          .pagination-btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.9rem;
          }

          .page-btn {
            padding: 0.375rem 0.5rem;
            min-width: 2rem;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 320px) {
          .categories-grid {
            padding: 0 0.25rem;
          }

          .pagination-controls {
            padding: 1rem 0.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default CategorySearch; 