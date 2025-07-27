'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useAlert } from '@/components/B-components/alert/AlertContext';
import { redirectToPricing, shouldRedirectToPricing } from '@/utils/redirect';
import { useUser, SignInButton } from '@clerk/nextjs';

interface Folder {
  name: string;
  tools: Array<{ name: string; logoUrl: string; websiteUrl: string; category: string; toolType?: string }>;
  createdAt: string;
}

interface SaveButtonProps {
  toolId: string;
  toolTitle: string;
  initialSaveCount: number;
  className?: string;
}

// Global state to ensure only one menu is open at a time
let globalMenuOpen = false;
const menuListeners: Array<() => void> = [];

const notifyMenuClose = () => {
  menuListeners.forEach(listener => listener());
};

const SaveButton: React.FC<SaveButtonProps> = ({ toolId, toolTitle, initialSaveCount, className }) => {
  const { showSuccess, showError } = useAlert();
  const { isSignedIn, isLoaded } = useUser();
  const [currentSaveCount, setCurrentSaveCount] = useState(initialSaveCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Listen for other menus opening
  useEffect(() => {
    const handleOtherMenuOpen = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    menuListeners.push(handleOtherMenuOpen);
    return () => {
      const index = menuListeners.indexOf(handleOtherMenuOpen);
      if (index > -1) {
        menuListeners.splice(index, 1);
      }
    };
  }, [showMenu]);

  // Update menu position and handle outside clicks
  useEffect(() => {
    const updateMenuPosition = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 200;
        const windowWidth = window.innerWidth;
        
        let left = rect.right - menuWidth;
        if (left < 0) left = 0;
        if (left + menuWidth > windowWidth) left = windowWidth - menuWidth;
        
        setMenuPosition({
          top: rect.bottom + 5,
          left: left
        });
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        globalMenuOpen = false;
      }
    };

    const handleCloseEvent = () => {
      if (showMenu) {
        setShowMenu(false);
        globalMenuOpen = false;
      }
    };

    if (showMenu) {
      updateMenuPosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', updateMenuPosition);
      window.addEventListener('resize', updateMenuPosition);
      menuRef.current?.addEventListener('closeSaveMenu', handleCloseEvent);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('scroll', updateMenuPosition);
        window.removeEventListener('resize', updateMenuPosition);
        menuRef.current?.removeEventListener('closeSaveMenu', handleCloseEvent);
      };
    }
  }, [showMenu]);

  // Check if user has already saved this tool on component mount (only if signed in)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasCheckedStatus) return;

    const checkUserInteraction = async () => {
      try {
        const saveResponse = await fetch(`/api/tools/save?toolId=${toolId}`, {
          method: 'GET',
        });
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          const isInSavedTools = saveData.hasSaved || false;
          
          // Only fetch folders if user has saved tools
          if (isInSavedTools) {
            const foldersResponse = await fetch('/api/user/folders');
            if (foldersResponse.ok) {
              const foldersData = await foldersResponse.json();
              
              const isInFolder = foldersData.folders?.some((folder: Folder) => 
                folder.tools?.some((tool: { name: string }) => tool.name === toolTitle)
              ) || false;
              
              const finalSavedState = isInSavedTools || isInFolder;
              setIsSaved(finalSavedState);
            } else {
              setIsSaved(isInSavedTools);
            }
          } else {
            setIsSaved(false);
          }
        } else if (saveResponse.status === 401) {
          // User is not authenticated, don't show error
          console.log('User not authenticated for save check');
          setIsSaved(false);
        } else {
          console.error('Error checking save status:', saveResponse.status);
          setIsSaved(false);
        }
        setHasCheckedStatus(true);
      } catch (error) {
        console.error('Error checking user interaction:', error);
        setIsSaved(false);
        setHasCheckedStatus(true);
      }
    };

    // Add debounce to prevent overwhelming the server
    const timeoutId = setTimeout(checkUserInteraction, Math.random() * 500);
    return () => clearTimeout(timeoutId);
  }, [toolId, toolTitle, isLoaded, isSignedIn, hasCheckedStatus]);

  // Fetch user folders (only if signed in and not already fetched)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || folders.length > 0) return;

    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/user/folders');
        if (response.ok) {
          const data = await response.json();
          setFolders(data.folders || []);
          
          const isInFolder = data.folders?.some((folder: Folder) => 
            folder.tools?.some((tool: { name: string }) => tool.name === toolTitle)
          ) || false;
          
          if (isInFolder) {
            setIsSaved(true);
          }
        } else if (response.status === 401) {
          // User is not authenticated, don't show error
          console.log('User not authenticated for folders fetch');
        } else {
          console.error('Error fetching folders:', response.status);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };

    // Add debounce to prevent overwhelming the server
    const timeoutId = setTimeout(fetchFolders, Math.random() * 1000);
    return () => clearTimeout(timeoutId);
  }, [toolTitle, isLoaded, isSignedIn, folders.length]);

  const handleSave = async () => {
    if (isLoading) return;
    
    if (!isSignedIn) {
      showError('Please sign in to save tools');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isSaved) {
        const toolInFolder = folders.find(folder => 
          folder.tools.some(tool => tool.name === toolTitle)
        );
        
        if (toolInFolder) {
          const response = await fetch('/api/user/folders', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              toolName: toolTitle, 
              folderName: toolInFolder.name,
              action: 'remove' 
            }),
          });

          if (response.ok) {
            setCurrentSaveCount(prev => Math.max(0, prev - 1));
            setIsSaved(false);
            showSuccess(`Tool removed from folder "${toolInFolder.name}" successfully!`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            showError(`Failed to remove tool: ${errorData.error || 'Unknown error'}`);
          }
        } else {
          const response = await fetch('/api/tools/save', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ toolId }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.saveCount !== undefined) {
              setCurrentSaveCount(data.saveCount);
            }
            setIsSaved(false);
            showSuccess('Tool unsaved successfully!');
          } else {
            const errorData = await response.json().catch(() => ({}));
            showError(`Failed to unsave tool: ${errorData.error || 'Unknown error'}`);
          }
        }
      } else {
        const response = await fetch('/api/tools/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ toolId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.saveCount !== undefined) {
            setCurrentSaveCount(data.saveCount);
          }
          setIsSaved(true);
          showSuccess('Tool saved successfully!');
        } else {
          const errorData = await response.json().catch(() => ({}));
          
          if (shouldRedirectToPricing(errorData)) {
            showError('You\'ve reached your tool limit! Redirecting to pricing...');
            redirectToPricing();
          } else {
            showError(`Failed to save tool: ${errorData.error || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Error saving tool:', error);
      showError('Failed to save tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToFolder = async (folderName: string) => {
    if (isLoading) return;
    
    if (!isSignedIn) {
      showError('Please sign in to save tools');
      return;
    }
    
    setIsLoading(true);
    try {
      const toolInFolder = folders.find(folder => 
        folder.tools.some(tool => tool.name === toolTitle)
      );
      
      if (toolInFolder) {
        showError(`Tool is already in folder "${toolInFolder.name}". A tool can only be in one folder at a time.`);
        setIsLoading(false);
        setShowMenu(false);
        globalMenuOpen = false;
        return;
      }

      const saveResponse = await fetch('/api/tools/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId }),
      });

      if (saveResponse.ok) {
        const moveResponse = await fetch('/api/user/folders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            toolName: toolTitle, 
            folderName,
            action: 'add' 
          }),
        });

        if (moveResponse.ok) {
          setCurrentSaveCount(prev => prev + 1);
          setIsSaved(true);
          showSuccess(`Tool saved to folder "${folderName}" successfully!`);
        } else {
          const errorData = await moveResponse.json().catch(() => ({}));
          
          if (shouldRedirectToPricing(errorData)) {
            showError('You\'ve reached your tool limit! Redirecting to pricing...');
            redirectToPricing();
          } else {
            showError(`Failed to save to folder: ${errorData.error || 'Unknown error'}`);
          }
        }
      } else {
        const errorData = await saveResponse.json().catch(() => ({}));
        
        if (shouldRedirectToPricing(errorData)) {
          showError('You\'ve reached your tool limit! Redirecting to pricing...');
          redirectToPricing();
        } else {
          showError(`Failed to save tool: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving tool to folder:', error);
      showError('Failed to save tool to folder. Please try again.');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
      globalMenuOpen = false;
    }
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isSignedIn) {
      showError('Please sign in to access save options');
      return;
    }
    
    // Close any other open menus
    if (globalMenuOpen) {
      notifyMenuClose();
    }
    
    setShowMenu(true);
    globalMenuOpen = true;
  };

  const closeMenu = () => {
    setShowMenu(false);
    globalMenuOpen = false;
  };

  // Get folders for the menu
  // If tool is not saved, show all folders
  // If tool is saved, show only folders that don't contain this tool
  const menuFolders = isSaved 
    ? folders.filter(folder => !folder.tools.some(tool => tool.name === toolTitle))
    : folders;

  // If user is not signed in, show sign-in button
  if (isLoaded && !isSignedIn) {
    return (
      <SaveButtonContainer>
        <SignInButton>
          <button 
            className={`action-btn save-btn ${className || ''}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minWidth: '80px',
              height: '32px',
              fontSize: '12px',
              fontWeight: '500',
              padding: '0 12px',
              border: '1px solid #ffffff',
              borderRadius: '6px',
              background: '#000000',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              position: 'relative'
            }}
          >
            💾 Sign in to Save
          </button>
        </SignInButton>
      </SaveButtonContainer>
    );
  }

  return (
    <SaveButtonContainer>
      {showMenu && isMounted && createPortal(
        <SimpleMenu 
          ref={menuRef} 
          data-save-menu="true"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <MenuHeader>Tool Actions:</MenuHeader>
          {isSaved ? (
            <MenuItem onClick={() => { handleSave(); closeMenu(); }}>
              🗑️ Unsave Tool
            </MenuItem>
          ) : (
            <>
              <MenuItem onClick={() => { handleSave(); closeMenu(); }}>
                💾 Save to Saved Tools
              </MenuItem>
              {menuFolders.length > 0 && (
                <>
                  <MenuDivider />
                  <MenuHeader>Save to Folder:</MenuHeader>
                  {menuFolders.map((folder, index) => (
                    <MenuItem 
                      key={index}
                      onClick={() => handleSaveToFolder(folder.name)}
                    >
                      📁 {folder.name}
                    </MenuItem>
                  ))}
                </>
              )}
            </>
          )}
        </SimpleMenu>,
        document.body
      )}
      
      <button 
        ref={buttonRef}
        className={`action-btn save-btn ${isSaved ? 'active' : ''} ${className || ''}`}
        onClick={handleSave}
        onContextMenu={handleRightClick}
        onMouseDown={(e) => {
          if (e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        disabled={isLoading || !isLoaded}
        title={isSaved ? "Click to unsave tool" : "Left click to save, Right click for more options"}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minWidth: '80px',
          height: '32px',
          fontSize: '12px',
          fontWeight: '500',
          padding: '0 12px',
          border: '1px solid #ffffff',
          borderRadius: '6px',
          background: isSaved ? '#065F46' : '#000000',
          color: '#ffffff',
          cursor: isLoading || !isLoaded ? 'not-allowed' : 'pointer',
          opacity: isLoading || !isLoaded ? 0.6 : 1,
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          position: 'relative'
        }}
      >
        {isSaved ? '🗑️ Unsave' : `💾 Save (${currentSaveCount})`}
      </button>
    </SaveButtonContainer>
  );
};

const SaveButtonContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const SimpleMenu = styled.div`
  position: fixed;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 99999;
  min-width: 200px;
  overflow: hidden;
`;

const MenuItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #f3f4f6;
  transition: background 0.2s ease;
  
  &:hover {
    background: #374151;
    cursor: pointer;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #374151;
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: #374151;
  margin: 0.5rem 0;
`;

const MenuHeader = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export default SaveButton; 