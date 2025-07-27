// this having now that rai add to folder which folder asking for folder name that code
'use client';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAlert } from '@/components/B-components/alert/AlertContext';

import { Folder } from './types';

interface FolderSelectionMenuProps {
  x: number;
  y: number;
  folders: Folder[];
  toolName: string;
  onSelectFolder: (folderName: string) => void;
  onClose: () => void;
}

const FolderSelectionMenu: React.FC<FolderSelectionMenuProps> = ({ 
  x, 
  y, 
  folders, 
  toolName,
  onSelectFolder, 
  onClose 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { showSuccess } = useAlert();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Filter out folders that already contain this tool
  const availableFolders = folders.filter(folder => 
    !folder.tools.some(tool => tool.name === toolName)
  );

  if (availableFolders.length === 0) {
    return (
      <ContextMenuContainer ref={menuRef} style={{ left: x, top: y }}>
        <ContextMenuItem style={{ color: 'red', fontStyle: 'italic' }}>
          No available folders (tool is already in all folders)
        </ContextMenuItem>
      </ContextMenuContainer>
    );
  }

  return (
    <ContextMenuContainer ref={menuRef} style={{ left: x, top: y }}>
      {availableFolders.map((folder, index) => (
        <ContextMenuItem 
          key={index}
          onClick={() => {
            onSelectFolder(folder.name);
            showSuccess(`Tool moved to "${folder.name}" successfully!`);
          }}
        >
          📁 {folder.name}
        </ContextMenuItem>
      ))}
    </ContextMenuContainer>
  );
};

const ContextMenuContainer = styled.div`
  position: fixed;
  background: black;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
`;

const ContextMenuItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color:rgb(255, 255, 255);
  transition: background 0.2s ease;
  
  &:hover {
    background:rgb(255, 255, 255);
    cursor: pointer;
    color: black;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }
`;

export default FolderSelectionMenu; 