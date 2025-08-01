'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CategoryCard from './card';
import SearchBar from './search-bar';

interface CategoryData {
  name: string;
  toolCount: number;
  description: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCategories: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: number;
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
  const [displayedCategories, setDisplayedCategories] = useState<CategoryData[]>(initialCategories);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: Math.ceil(totalCategoryCount / 20),
    totalCategories: totalCategoryCount,
    hasNextPage: totalCategoryCount > 20,
    hasPreviousPage: false,
    itemsPerPage: 20
  });

  // Performance optimization: items per page - show 20 categories per page
  const ITEMS_PER_PAGE = 20; // Show 20 categories per page

  // Function to fetch categories from API with pagination
  const fetchCategories = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setIsLoading(true);
      
      // Build API URL with pagination parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });
      
      const response = await fetch(`/api/categories?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        if (data.success) {
          setCategories(data.categories || []);
          setPaginationInfo(data.pagination || {
            currentPage: page,
            totalPages: 1,
            totalCategories: data.categories?.length || 0,
            hasNextPage: false,
            hasPreviousPage: page > 1,
            itemsPerPage: ITEMS_PER_PAGE
          });
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to refresh category data
  const refreshCategories = useCallback(async () => {
    await fetchCategories(currentPage, searchTerm);
  }, [fetchCategories, currentPage, searchTerm]);

  // Refresh categories every 5 minutes to get updated counts
  useEffect(() => {
    const interval = setInterval(refreshCategories, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [refreshCategories]);

  // Filter categories based on search term (client-side filtering for search)
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

  // Update displayed categories when search or page changes
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setDisplayedCategories(filteredCategories);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [filteredCategories]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Navigation functions with API calls
  const goToNextPage = useCallback(async () => {
    if (paginationInfo.hasNextPage) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchCategories(nextPage, searchTerm);
    }
  }, [currentPage, paginationInfo.hasNextPage, fetchCategories, searchTerm]);

  const goToPreviousPage = useCallback(async () => {
    if (paginationInfo.hasPreviousPage) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      await fetchCategories(prevPage, searchTerm);
    }
  }, [currentPage, paginationInfo.hasPreviousPage, fetchCategories, searchTerm]);

  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= paginationInfo.totalPages) {
      setCurrentPage(page);
      await fetchCategories(page, searchTerm);
    }
  }, [paginationInfo.totalPages, fetchCategories, searchTerm]);

  return (
    <>
      <div className="search-container">
        <SearchBar onSearch={handleSearchChange} />
      </div>
      
      {/* Pagination Info */}
      {!searchTerm && paginationInfo.totalCategories > 0 && (
        <div className="pagination-info">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, paginationInfo.totalCategories)} of {paginationInfo.totalCategories} categories
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
              {paginationInfo.totalPages > 1 && !searchTerm && (
                <div className="pagination-controls">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={!paginationInfo.hasPreviousPage}
                    className={`pagination-btn ${!paginationInfo.hasPreviousPage ? 'disabled' : ''}`}
                  >
                    ← Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="page-numbers">
                    {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                      let pageNum;
                      if (paginationInfo.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= paginationInfo.totalPages - 2) {
                        pageNum = paginationInfo.totalPages - 4 + i;
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
                    disabled={!paginationInfo.hasNextPage}
                    className={`pagination-btn ${!paginationInfo.hasNextPage ? 'disabled' : ''}`}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Show message when only one page */}
              {paginationInfo.totalPages === 1 && !searchTerm && (
                <div className="single-page-message">
                  <p>Showing all {paginationInfo.totalCategories} categories</p>
                </div>
              )}

              {/* Load More Indicator for Total Categories */}
              {paginationInfo.totalCategories > displayedCategories.length && !searchTerm && (
                <div className="load-more-indicator">
                  <p>Showing {displayedCategories.length} of {paginationInfo.totalCategories} categories</p>
                  <p>Use pagination to see more categories.</p>
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