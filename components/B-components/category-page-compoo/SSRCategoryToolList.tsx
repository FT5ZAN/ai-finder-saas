'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { FlipCard, DownloadableFlipCard } from '@/components/S-components';
import SearchBar from './search-bar';

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

interface SSRCategoryToolListProps {
  tools: ToolCardProps[];
  categoryName: string;
  categoryToolType: 'browser' | 'downloadable';
  totalToolCount?: number;
}

// Global state for API call management
const apiCallManager = {
  pendingCalls: new Set<string>(),
  callQueue: [] as Array<() => Promise<void>>,
  isProcessing: false,
  
  async addCall(callId: string, callFn: () => Promise<void>) {
    if (this.pendingCalls.has(callId)) {
      return; // Already pending
    }
    
    this.pendingCalls.add(callId);
    this.callQueue.push(async () => {
      try {
        await callFn();
      } finally {
        this.pendingCalls.delete(callId);
      }
    });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  },
  
  async processQueue() {
    if (this.isProcessing || this.callQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.callQueue.length > 0) {
      const call = this.callQueue.shift();
      if (call) {
        try {
          await call();
          // Add delay between calls to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
        } catch (error) {
          console.error('API call failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }
};

const SSRCategoryToolList: React.FC<SSRCategoryToolListProps> = ({ 
  tools, 
  categoryName, 
  categoryToolType,
  totalToolCount = 0
}) => {
  // Ensure tools is always an array to prevent hydration issues
  const safeTools = Array.isArray(tools) ? tools : [];
  const [displayedTools, setDisplayedTools] = useState<ToolCardProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Performance optimization: items per page - reduced to 10 for better performance
  const ITEMS_PER_PAGE = 10; // Show 10 tools at a time for better performance

  // Memoized filtered tools for better performance
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) {
      return safeTools;
    }

    // Normalize the search query (remove spaces, convert to lowercase)
    const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
    
    return safeTools.filter(tool => {
      // Normalize tool data for comparison
      const normalizedTitle = tool.title.toLowerCase().replace(/\s+/g, '');
      const normalizedAbout = (tool.about || '').toLowerCase().replace(/\s+/g, '');
      const normalizedCategory = tool.category.toLowerCase().replace(/\s+/g, '');
      
      // Check if query is found in any of the fields
      const titleMatch = normalizedTitle.includes(normalizedQuery);
      const aboutMatch = normalizedAbout.includes(normalizedQuery);
      const categoryMatch = normalizedCategory.includes(normalizedQuery);
      
      // Also check original text for partial word matches
      const originalTitleMatch = tool.title.toLowerCase().includes(searchQuery.toLowerCase());
      const originalAboutMatch = (tool.about || '').toLowerCase().includes(searchQuery.toLowerCase());
      const originalCategoryMatch = tool.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return titleMatch || aboutMatch || categoryMatch || originalTitleMatch || originalAboutMatch || originalCategoryMatch;
    });
  }, [safeTools, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Ensure hydration safety by only updating state after client-side mount
  useEffect(() => {
    setIsClient(true);
    setDisplayedTools(filteredTools.slice(0, ITEMS_PER_PAGE));
  }, [filteredTools]);

  // Update displayed tools when search or page changes with error handling
  useEffect(() => {
    if (!isClient) return;
    
    setIsLoading(true);
    setError(null);
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Simulate loading for better UX with retry logic
    const timer = setTimeout(() => {
      try {
        setDisplayedTools(filteredTools.slice(startIndex, endIndex));
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error('Error updating displayed tools:', error);
        setError('Failed to load tools. Please try again.');
        setIsLoading(false);
        
        // Retry logic
        if (retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev: number) => prev + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
        }
      }
    }, 50); // Reduced loading time

    return () => clearTimeout(timer);
  }, [filteredTools, startIndex, endIndex, isClient, retryCount]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Navigation functions with error handling
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

  // Retry function
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
  }, []);

  // Memoized tool components to prevent unnecessary re-renders
  const renderToolComponent = useCallback((tool: ToolCardProps) => {
    if (categoryToolType === 'downloadable') {
      return (
        <DownloadableFlipCard
          key={tool.id}
          id={tool.id}
          title={tool.title}
          logoUrl={tool.logoUrl}
          websiteUrl={tool.websiteUrl}
          category={tool.category}
          likeCount={tool.likeCount}
          about={tool.about}
        />
      );
    } else {
      return (
        <FlipCard
          key={tool.id}
          id={tool.id}
          title={tool.title}
          logoUrl={tool.logoUrl}
          websiteUrl={tool.websiteUrl}
          category={tool.category}
          toolType={tool.toolType}
          likeCount={tool.likeCount}
          saveCount={tool.saveCount}
          about={tool.about}
        />
      );
    }
  }, [categoryToolType]);

  // Don't render search functionality until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {safeTools.slice(0, ITEMS_PER_PAGE).map(renderToolComponent)}
      </div>
    );
  }

  return (
    <>
      <div style={{ 
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#fca5a5'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>{error}</p>
          {retryCount < maxRetries && (
            <button
              onClick={handleRetry}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '4px',
                color: '#fca5a5',
                cursor: 'pointer'
              }}
            >
              Retry ({maxRetries - retryCount} attempts left)
            </button>
          )}
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery && !error && (
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#fff',
          fontSize: '0.9rem'
        }}>
          Found {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot; in {categoryName}
        </div>
      )}

      {/* Pagination Info */}
      {!searchQuery && !error && totalPages > 1 && (
        <div style={{
         
          display: 'none'
        }}>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredTools.length)} of {filteredTools.length} tools
          {totalToolCount > filteredTools.length && ` (${totalToolCount} total available)`}
        </div>
      )}

      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}
        data-testid="tools-grid"
      >
        {isLoading && displayedTools.length === 0 ? (
          // Loading skeleton
          Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <div 
              key={`skeleton-${index}`}
              style={{
                width: '100%',
                height: '120px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          ))
        ) : displayedTools.length > 0 ? (
          <>
            {displayedTools.map(renderToolComponent)}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
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
                    backgroundColor: currentPage === 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
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
                          backgroundColor: currentPage === pageNum ? 'black' : 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '5px',
                          color: 'white',
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
                    backgroundColor: currentPage === totalPages ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
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

            {/* Load More Indicator for Total Tools */}
            {totalToolCount > filteredTools.length && !searchQuery && (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{ margin: '0 0 2rem 0' }}>
                  {/* Showing {filteredTools.length} of {totalToolCount} tools */}
                </p>
                <p style={{ 
                  margin: '0', 
                  fontSize: '0.9rem', 
                  color: '#cccccc' 
                }}>
                  More tools are available in the database. Use search to find specific tools.
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            <p>
              No tools match your search in &quot;{categoryName}&quot;
            </p>
          </div>
        )}
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

export default SSRCategoryToolList; 