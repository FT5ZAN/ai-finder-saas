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
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh category data
  const refreshCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="category-search-container">
      <SearchBar 
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search categories..."
      />
      
      {isLoading && (
        <div className="loading-indicator">
          <p>Refreshing category data...</p>
        </div>
      )}

      <div className="category-grid">
        {filteredCategories.map((category) => (
          <CategoryCard
            key={category.name}
            name={category.name}
            toolCount={category.toolCount}
            description={category.description}
          />
        ))}
      </div>

      {filteredCategories.length === 0 && searchTerm && (
        <div className="no-results">
          <p>No categories found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default CategorySearch; 