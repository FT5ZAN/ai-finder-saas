'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { FlipCard, DownloadableFlipCard } from '@/components/S-components';

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

interface VirtualizedToolListProps {
  tools: ToolCardProps[];
  categoryToolType: 'browser' | 'downloadable';
  itemHeight?: number;
  containerHeight?: number;
}

const VirtualizedToolList: React.FC<VirtualizedToolListProps> = ({
  tools,
  categoryToolType,
  itemHeight = 120,
  containerHeight = 600
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, tools.length);

  // Get visible items
  const visibleItems = useMemo(() => {
    return tools.slice(startIndex, endIndex);
  }, [tools, startIndex, endIndex]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Memoized tool component renderer
  const renderToolComponent = useCallback((tool: ToolCardProps, index: number) => {
    const top = (startIndex + index) * itemHeight;
    
    if (categoryToolType === 'downloadable') {
      return (
        <div key={tool.id} style={{ position: 'absolute', top, height: itemHeight, width: '100%' }}>
          <DownloadableFlipCard
            id={tool.id}
            title={tool.title}
            logoUrl={tool.logoUrl}
            websiteUrl={tool.websiteUrl}
            category={tool.category}
            likeCount={tool.likeCount}
            about={tool.about}
          />
        </div>
      );
    } else {
      return (
        <div key={tool.id} style={{ position: 'absolute', top, height: itemHeight, width: '100%' }}>
          <FlipCard
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
        </div>
      );
    }
  }, [categoryToolType, itemHeight, startIndex]);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: tools.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((tool, index) => renderToolComponent(tool, index))}
      </div>
    </div>
  );
};

export default VirtualizedToolList; 