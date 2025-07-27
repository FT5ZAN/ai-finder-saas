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
}

const CategorySearch: React.FC<CategorySearchProps> = ({ initialCategories }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedCategories, setDisplayedCategories] = useState<CategoryData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Performance optimization: items per page - reduced to 20 for better performance
  const ITEMS_PER_PAGE = 20; // Show 20 categories initially

  // Memoized filter function for better performance
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialCategories;
    }

    const trimmedQuery = searchQuery.toLowerCase().trim();
    
    return initialCategories.filter(({ name, description }) =>
      name.toLowerCase().includes(trimmedQuery) || 
      description.toLowerCase().includes(trimmedQuery)
    ).sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match gets highest priority
      if (aName === trimmedQuery && bName !== trimmedQuery) return -1;
      if (bName === trimmedQuery && aName !== trimmedQuery) return 1;
      
      // Starts with query gets second priority
      if (aName.startsWith(trimmedQuery) && !bName.startsWith(trimmedQuery)) return -1;
      if (bName.startsWith(trimmedQuery) && !aName.startsWith(trimmedQuery)) return 1;
      
      // Alphabetical order for remaining matches
      return aName.localeCompare(bName);
    });
  }, [searchQuery, initialCategories]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

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
  }, [searchQuery]);

  // Debounced search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '2rem',
        padding: '0 1rem'
      }}>
        <SearchBar onSearch={handleSearch} />
      </div>
      
      {/* Search Results Info */}
      {searchQuery && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#fff',
          fontSize: '0.9rem'
        }}>
          Found {filteredCategories.length} category{filteredCategories.length !== 1 ? 'ies' : 'y'} for &quot;{searchQuery}&quot;
        </div>
      )}

      {/* Pagination Info */}
      {!searchQuery && totalPages > 1 && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#fff',
          fontSize: '0.9rem'
        }}>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} categories
        </div>
      )}
      
      <div className="parant">
        <div className="child">
          {isLoading && displayedCategories.length === 0 ? (
            // Loading skeleton
            Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <div 
                key={`skeleton-${index}`}
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  height: '160px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}
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
              {totalPages > 1 && (
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '2rem 1rem',
                  color: '#fff'
                }}>
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: currentPage === 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '5px',
                      color: '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    ← Previous
                  </button>

                  {/* Page Numbers */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: currentPage === pageNum ? '#667eea' : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '5px',
                            color: '#fff',
                            cursor: 'pointer',
                            minWidth: '2.5rem'
                          }}
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
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: currentPage === totalPages ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '5px',
                      color: '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '2rem',
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden'
            }}>
              <p>
                No categories match your search: &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for loading animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
};

export default CategorySearch; 