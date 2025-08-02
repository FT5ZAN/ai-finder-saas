'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Ensure hydration safety
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debounce search to avoid too many re-renders
  useEffect(() => {
    if (!isClient) return; // Don't trigger search during SSR
    
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch, isClient]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <StyledWrapper>
      <div className="group">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
          <g>
            <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
          </g>
        </svg>
        <input 
          id="query" 
          className="input" 
          type="search" 
          placeholder="Search categories..." 
          name="searchbar"
          value={searchQuery}
          onChange={handleInputChange}
          aria-label="Search categories"
        />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .group {
    display: flex;
    line-height: 0px;
    align-items: center;
    position: relative;
    max-width: 500px;
    width: 100%;
    margin-bottom: 3rem;
  }

  .input {
    font-family: "Montserrat", sans-serif;
    width: 100%;
    height: 50px;
    padding-left: 3rem;
    box-shadow: 0 0 0 1.5pxrgb(20, 39, 255), 0 0 25px -17px #000;
    border: 0;
    border-radius: 12px;
    background-color:rgb(0, 0, 0);
    outline: none;
    color: #bdbecb;
    transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1);
    cursor: text;
    z-index: 0;
    font-size: 16px;
    border: 1px solid rgb(255, 255, 255);
  }

  .input::placeholder {
    color: #bdbecb;
  }

  .input:hover {
    box-shadow: 0 0 0 2.5px #2f303d, 0px 0px 25px -15px #000;
  }

  .input:active {
    transform: scale(0.98);
  }

  .input:focus {
    box-shadow: 0 0 0 2.5px #2f303d;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    fill: #bdbecb;
    width: 1.25rem;
    height: 1.25rem;
    pointer-events: none;
    z-index: 1;
  }

  /* Responsive design */
  /* Large Desktop (1400px and up) */
  @media (min-width: 1400px) {
    .group {
      max-width: 600px;
    }
    
    .input {
      height: 55px;
      font-size: 18px;
      padding-left: 3.5rem;
    }
    
    .search-icon {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  /* Desktop (1024px to 1399px) */
  @media (max-width: 1399px) and (min-width: 1024px) {
    .group {
      max-width: 500px;
    }
    
    .input {
      height: 50px;
      font-size: 16px;
    }
  }

  /* Tablet (768px to 1023px) */
  @media (max-width: 1023px) and (min-width: 768px) {
    .group {
      max-width: 450px;
    }
    
    .input {
      height: 48px;
      font-size: 15px;
      padding-left: 2.75rem;
    }
    
    .search-icon {
      width: 1.125rem;
      height: 1.125rem;
    }
  }

  /* Mobile Large (600px to 767px) */
  @media (max-width: 767px) and (min-width: 600px) {
    .group {
      max-width: 400px;
    }
    
    .input {
      height: 45px;
      font-size: 15px;
      padding-left: 2.5rem;
    }
    
    .search-icon {
      width: 1rem;
      height: 1rem;
    }
  }

  /* Mobile Medium (480px to 599px) */
  @media (max-width: 599px) and (min-width: 480px) {
    .group {
      max-width: 350px;
    }
    
    .input {
      height: 42px;
      font-size: 14px;
      padding-left: 2.25rem;
    }
    
    .search-icon {
      width: 1rem;
      height: 1rem;
    }
  }

  /* Mobile Small (320px to 479px) */
  @media (max-width: 479px) and (min-width: 320px) {
    .group {
      max-width: 300px;
    }
    
    .input {
      height: 40px;
      font-size: 14px;
      padding-left: 2rem;
    }
    
    .search-icon {
      width: 0.875rem;
      height: 0.875rem;
    }
  }

  /* Extra Small Mobile (below 320px) */
  @media (max-width: 319px) {
    .group {
      max-width: 280px;
    }
    
    .input {
      height: 38px;
      font-size: 13px;
      padding-left: 1.75rem;
    }
    
    .search-icon {
      width: 0.75rem;
      height: 0.75rem;
    }
  }

  /* Landscape orientation adjustments for mobile */
  @media (max-width: 767px) and (orientation: landscape) {
    .group {
      max-width: 350px;
    }
    
    .input {
      height: 40px;
    }
  }

  /* High DPI displays */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .input {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  }

  /* Reduced motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .input {
      transition: none;
    }
    
    .input:active {
      transform: none;
    }
  }

  /* Focus visible for better accessibility */
  .input:focus-visible {
    outline: 2px solidrgb(255, 255, 255);
    outline-offset: 2px;
  }
`;

export default SearchBar; 