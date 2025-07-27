'use client';
import React, { useState } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { SavedTool } from './types';

interface ToolCardProps {
  tool: SavedTool;
  onClick: (websiteUrl: string) => void;
  onContextMenu: (event: React.MouseEvent, toolName: string, websiteUrl: string, folderName?: string) => void;
  folderName?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ 
  tool, 
  onClick, 
  onContextMenu, 
  folderName 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    onClick(tool.websiteUrl);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    onContextMenu(event, tool.name, tool.websiteUrl, folderName);
  };

  return (
    <ToolCardContainer 
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <LogoContainer>
        <Image
          src={tool.logoUrl}
          alt={tool.name}
          width={44}
          height={44}
          quality={100}
          unoptimized={true}
          className="saved-tool-image"
          style={{ objectFit: 'cover', borderRadius: '4px' }}
        />
      </LogoContainer>
      
      <AnimatePresence>
        {isHovered && (
          <ToolLabel
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tool.name}
          </ToolLabel>
        )}
      </AnimatePresence>
    </ToolCardContainer>
  );
};

const ToolCardContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background-color: white;
  border: 1px solid #222;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  user-select: none;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: #444;
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 4px;
  background: transparent;
  transition: all 0.3s ease;
  
  ${ToolCardContainer}:hover & {
    transform: scale(1.05);
  }
  
  .saved-tool-image {
    width: 44px !important;
    height: 44px !important;
    max-width: 44px !important;
    max-height: 44px !important;
    min-width: 44px !important;
    min-height: 44px !important;
    transition: transform 0.3s ease;
  }
  
  ${ToolCardContainer}:hover & .saved-tool-image {
    transform: scale(1.1);
  }
`;

const ToolLabel = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  left: 50%;
  width: fit-content;
  white-space: pre;
  border-radius: 0.375rem;
  border: 1px solid #222;
  background-color: #060010;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  color: #fff;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  z-index: 1000;
  pointer-events: none;
`;

export default ToolCard; 