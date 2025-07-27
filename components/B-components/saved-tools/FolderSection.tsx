'use client';
import React from 'react';
import styled from 'styled-components';
import ToolCard from './ToolCard';

import { Folder } from './types';

interface FolderSectionProps {
  folder: Folder;
  onCardClick: (websiteUrl: string, toolName?: string, logoUrl?: string) => void;
  onCardContextMenu: (event: React.MouseEvent, toolName: string, websiteUrl: string, folderName?: string) => void;
  onDeleteFolder: (folderName: string) => void;
  onCreateFolder?: () => void;
  isUnsorted?: boolean;
}

const FolderSection: React.FC<FolderSectionProps> = ({ 
  folder, 
  onCardClick, 
  onCardContextMenu, 
  onDeleteFolder,
  onCreateFolder,
  isUnsorted = false
}) => {
  console.log('FolderSection received folder:', folder);
  console.log('Folder name:', folder.name);
  console.log('Folder tools:', folder.tools);
  
  return (
    <FolderSectionContainer $isUnsorted={isUnsorted}>
      <FolderHeader $isUnsorted={isUnsorted}>
        <FolderTitle $isUnsorted={isUnsorted}>📁 {folder.name || 'Unnamed Folder'}</FolderTitle>
        <FolderActions>
          <FolderToolCount $isUnsorted={isUnsorted}>{folder.tools.length} tools</FolderToolCount>
          {isUnsorted && onCreateFolder && (
            <CreateFolderButton onClick={onCreateFolder}>
              ➕ Create Folder
            </CreateFolderButton>
          )}
          {!isUnsorted && (
            <DeleteFolderButton onClick={() => onDeleteFolder(folder.name)}>
              🗑️ Delete Folder
            </DeleteFolderButton>
          )}
        </FolderActions>
      </FolderHeader>
      {folder.tools.length > 0 ? (
        <ToolsGrid $isUnsorted={isUnsorted}>
          {folder.tools.map((tool, toolIndex) => (
            <ToolCard 
              key={toolIndex}
              tool={tool}
              onClick={(websiteUrl) => onCardClick(websiteUrl, tool.name, tool.logoUrl)}
              onContextMenu={onCardContextMenu}
              folderName={folder.name}
            />
          ))}
        </ToolsGrid>
      ) : (
        <EmptyFolder $isUnsorted={isUnsorted}>
          <p>No tools in this folder yet</p>
        </EmptyFolder>
      )}
    </FolderSectionContainer>
  );
};

const FolderSectionContainer = styled.div<{ $isUnsorted: boolean }>`
  margin-bottom: ${({ $isUnsorted }) => $isUnsorted ? '2rem' : '1rem'};
  background: #ffffff;
  border-radius: 16px;
  padding: ${({ $isUnsorted }) => $isUnsorted ? '2rem' : '1rem'};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  width: ${({ $isUnsorted }) => $isUnsorted ? '95%' : '45%'};
  min-width: ${({ $isUnsorted }) => $isUnsorted ? 'auto' : '300px'};
  max-width: ${({ $isUnsorted }) => $isUnsorted ? 'auto' : '400px'};
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const FolderHeader = styled.div<{ $isUnsorted: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ $isUnsorted }) => $isUnsorted ? '2rem' : '1rem'};
  padding-bottom: ${({ $isUnsorted }) => $isUnsorted ? '1.5rem' : '0.75rem'};
  border-bottom: 2px solid #f3f4f6;
`;

const FolderTitle = styled.h2<{ $isUnsorted: boolean }>`
  font-size: ${({ $isUnsorted }) => $isUnsorted ? '1.75rem' : '1.25rem'};
  color: #111827;
  margin: 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FolderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FolderToolCount = styled.span<{ $isUnsorted: boolean }>`
  font-size: ${({ $isUnsorted }) => $isUnsorted ? '0.875rem' : '0.75rem'};
  color: #6b7280;
  background: #f3f4f6;
  padding: ${({ $isUnsorted }) => $isUnsorted ? '0.5rem 1rem' : '0.25rem 0.75rem'};
  border-radius: 20px;
  font-weight: 500;
`;

const DeleteFolderButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
  }
`;

const EmptyFolder = styled.div<{ $isUnsorted: boolean }>`
  text-align: center;
  padding: ${({ $isUnsorted }) => $isUnsorted ? '3rem 2rem' : '1.5rem 1rem'};
  color: #6b7280;
  font-style: italic;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px dashed #d1d5db;
  font-size: ${({ $isUnsorted }) => $isUnsorted ? '1rem' : '0.875rem'};
`;

const ToolsGrid = styled.div<{ $isUnsorted: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isUnsorted }) => 
    $isUnsorted 
      ? 'repeat(auto-fill, minmax(80px, 1fr))' 
      : 'repeat(auto-fill, minmax(60px, 1fr))'
  };
  gap: ${({ $isUnsorted }) => $isUnsorted ? '1rem' : '0.75rem'};
  justify-items: center;
`;

const CreateFolderButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  }
`;

export default FolderSection; 