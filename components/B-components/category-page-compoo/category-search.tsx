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
      {/* Pagination Info - Redesigned */}
      {!searchTerm && totalCategoryCount > 0 && (
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '1rem 2rem',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '500',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '2px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px 12px 0 0'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              📊
            </span>
            <span>
              Showing <strong>{startIndex + 1}-{Math.min(endIndex, filteredCategories.length)}</strong> of <strong>{filteredCategories.length}</strong> categories
            </span>
            {totalCategoryCount > filteredCategories.length && (
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                +{totalCategoryCount - filteredCategories.length} more available
              </span>
            )}
          </div>
          
          {/* Progress indicator */}
          <div style={{
            marginTop: '0.75rem',
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(filteredCategories.length / totalCategoryCount) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Search Results Info - Redesigned */}
      {searchTerm && (
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '1rem 2rem',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '500',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '2px',
            background: 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)',
            borderRadius: '12px 12px 0 0'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              🔍
            </span>
            <span>
              Found <strong>{filteredCategories.length}</strong> categor{filteredCategories.length !== 1 ? 'ies' : 'y'} for "<strong>{searchTerm}</strong>"
            </span>
          </div>
        </div>
      )}

      <div className="parant" style={{ width: '100%', minHeight: 'auto', padding: '1rem 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="child" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px', 
          width: '100%', 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 1rem', 
          placeItems: 'center' 
        }}>
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
              {totalPages >= 1 && (
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

              {/* Show message when only one page */}
              {totalPages === 1 && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '1rem',
                  color: '#fff',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#cccccc' }}>
                    Showing all {filteredCategories.length} categories
                  </p>
                </div>
              )}

              {/* Load More Indicator for Total Categories */}
              {totalCategoryCount > filteredCategories.length && !searchTerm && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '1rem',
                  color: '#fff',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    Showing {filteredCategories.length} of {totalCategoryCount} categories
                  </p>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '0.9rem', 
                    color: '#cccccc' 
                  }}>
                    More categories are available. Use search to find specific categories.
                  </p>
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
                No categories match your search: "{searchTerm}"
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