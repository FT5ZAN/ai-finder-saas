// this the floating context menu that appears when you right click on a tool or page
// it allows you to visit, remove, create folder, add to folder, remove from folder
'use client';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAlert } from '@/components/B-components/alert/AlertContext';

interface ContextMenuProps {
  x: number;
  y: number;
  onVisit?: () => void;
  onRemove?: () => void;
  onCreateFolder?: () => void;
  onAddToFolder?: () => void;
  onRemoveFromFolder?: () => void;
  onClose: () => void;
  type: 'tool' | 'page';
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, 
  y, 
  onVisit, 
  onRemove, 
  onCreateFolder, 
  onAddToFolder, 
  onRemoveFromFolder, 
  onClose, 
  type 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showInfo } = useAlert();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <ContextMenuContainer ref={menuRef} style={{ left: x, top: y }}>
      {type === 'tool' && onVisit && (
        <ContextMenuItem onClick={() => {
          onVisit();
          showInfo('Opening tool...');
        }}>
          🔵  Open
        </ContextMenuItem>
      )}
      {type === 'tool' && onAddToFolder && (
        <ContextMenuItem onClick={onAddToFolder}>
          📁 Add to Folder
        </ContextMenuItem>
      )}
      {type === 'tool' && onRemoveFromFolder && (
        <ContextMenuItem onClick={onRemoveFromFolder}>
          🗑️ Remove from Folder
        </ContextMenuItem>
      )}
      {type === 'tool' && onRemove && (
        <ContextMenuItem onClick={() => {
          onRemove();
          showSuccess('Tool removed successfully!');
        }}>
          ❌ Remove
        </ContextMenuItem>
      )}
      {type === 'page' && onCreateFolder && (
        <ContextMenuItem onClick={() => {
          onCreateFolder();
          showInfo('Creating new folder...');
        }}>
          📁 Create Folder
        </ContextMenuItem>
      )}
    </ContextMenuContainer>
  );
};

const ContextMenuContainer = styled.div`
  position: fixed;
  background: black;
  border: 1px solid rgb(41, 41, 43);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
`;

const ContextMenuItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: rgb(255, 254, 254);
  transition: background 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    cursor: pointer;
    color: black;
    border: 2px solid rgb(41, 41, 43);
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgb(0, 0, 0);
  }
`;

export default ContextMenu; 