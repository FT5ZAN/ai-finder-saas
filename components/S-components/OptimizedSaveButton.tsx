'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useAlert } from '@/components/B-components/alert/AlertContext';

interface SaveButtonProps {
  toolId: string;
  toolTitle: string;
  initialSaveCount: number;
  className?: string;
}

interface Folder {
  name: string;
  tools: Array<{ name: string }>;
}

// Global API call manager for save buttons
const saveApiManager = {
  pendingCalls: new Map<string, Promise<any>>(),
  callQueue: [] as Array<{ id: string; fn: () => Promise<any> }>,
  isProcessing: false,
  foldersCache: null as any,
  foldersCacheTime: 0,
  
  async addCall(callId: string, callFn: () => Promise<Response>) {
    // If already pending, return the existing promise
    if (this.pendingCalls.has(callId)) {
      return this.pendingCalls.get(callId) as Promise<Response>;
    }
    
    // Create new promise and add to pending calls
    const promise = callFn().finally(() => {
      this.pendingCalls.delete(callId);
    });
    
    this.pendingCalls.set(callId, promise);
    return promise;
  },
  
  async queueCall(callId: string, callFn: () => Promise<Response>) {
    return new Promise<Response>((resolve, reject) => {
      this.callQueue.push({
        id: callId,
        fn: async () => {
          try {
            const result = await this.addCall(callId, callFn);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      });
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
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
          await call.fn();
          // Add delay between calls to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          console.error('Save API call failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  },
  
  // Cache folders to prevent multiple API calls
  async getFolders() {
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    if (this.foldersCache && (now - this.foldersCacheTime) < cacheExpiry) {
      return this.foldersCache;
    }
    
    try {
      const response = await this.queueCall('fetch-folders', () => 
        fetch('/api/user/folders')
      );
      
      if (response.ok) {
        const data = await response.json();
        this.foldersCache = data.folders || [];
        this.foldersCacheTime = now;
        return this.foldersCache;
      }
      return [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }
};

// Global menu state management
let globalMenuOpen = false;
const menuListeners: Array<() => void> = [];

const notifyMenuClose = () => {
  menuListeners.forEach(listener => listener());
  globalMenuOpen = false;
};

const OptimizedSaveButton: React.FC<SaveButtonProps> = ({ toolId, toolTitle, initialSaveCount, className }) => {
  const { showSuccess, showError } = useAlert();
  const { isSignedIn, isLoaded } = useUser();
  const [currentSaveCount, setCurrentSaveCount] = useState(initialSaveCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const checkStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchFoldersTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        globalMenuOpen = false;
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Check if user has already saved this tool on component mount (only if signed in)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasCheckedStatus) return;

    // Clear any existing timeout
    if (checkStatusTimeoutRef.current) {
      clearTimeout(checkStatusTimeoutRef.current);
    }

    // Debounce the check to prevent overwhelming the server
    checkStatusTimeoutRef.current = setTimeout(async () => {
      try {
        const saveResponse = await saveApiManager.queueCall(
          `check-save-${toolId}`,
          () => fetch(`/api/tools/save?toolId=${toolId}`, { method: 'GET' })
        );
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          const isInSavedTools = saveData.hasSaved || false;
          
          const foldersData = await saveApiManager.getFolders();
          const isInFolder = foldersData.some((folder: Folder) => 
            folder.tools?.some((tool: { name: string }) => tool.name === toolTitle)
          ) || false;
          
          const finalSavedState = isInSavedTools || isInFolder;
          setIsSaved(finalSavedState);
        } else if (saveResponse.status === 401) {
          console.log('User not authenticated for save check');
        } else {
          console.error('Error checking save status:', saveResponse.status);
        }
        setHasCheckedStatus(true);
      } catch (error) {
        console.error('Error checking user interaction:', error);
        setHasCheckedStatus(true);
      }
    }, Math.random() * 1500); // Random delay between 0-1500ms

    return () => {
      if (checkStatusTimeoutRef.current) {
        clearTimeout(checkStatusTimeoutRef.current);
      }
    };
  }, [toolId, toolTitle, isLoaded, isSignedIn, hasCheckedStatus]);

  // Fetch user folders (only if signed in) with debouncing
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Clear any existing timeout
    if (fetchFoldersTimeoutRef.current) {
      clearTimeout(fetchFoldersTimeoutRef.current);
    }

    // Debounce the folders fetch
    fetchFoldersTimeoutRef.current = setTimeout(async () => {
      try {
        const foldersData = await saveApiManager.getFolders();
        setFolders(foldersData);
        
        const isInFolder = foldersData.some((folder: Folder) => 
          folder.tools?.some((tool: { name: string }) => tool.name === toolTitle)
        ) || false;
        
        if (isInFolder) {
          setIsSaved(true);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    }, Math.random() * 2000); // Random delay between 0-2000ms

    return () => {
      if (fetchFoldersTimeoutRef.current) {
        clearTimeout(fetchFoldersTimeoutRef.current);
      }
    };
  }, [toolTitle, isLoaded, isSignedIn]);

  const handleSave = useCallback(async () => {
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
          const response = await saveApiManager.queueCall(
            `remove-from-folder-${toolId}`,
            () => fetch('/api/user/folders', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                toolName: toolTitle, 
                folderName: toolInFolder.name,
                action: 'remove' 
              }),
            })
          );

          if (response.ok) {
            setCurrentSaveCount(prev => Math.max(0, prev - 1));
            setIsSaved(false);
            showSuccess(`Tool removed from folder "${toolInFolder.name}" successfully!`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            showError(`Failed to remove tool: ${errorData.error || 'Unknown error'}`);
          }
        } else {
          const response = await saveApiManager.queueCall(
            `unsave-tool-${toolId}`,
            () => fetch('/api/tools/save', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ toolId }),
            })
          );

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
        const response = await saveApiManager.queueCall(
          `save-tool-${toolId}`,
          () => fetch('/api/tools/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ toolId }),
          })
        );

        if (response.ok) {
          const data = await response.json();
          if (data.saveCount !== undefined) {
            setCurrentSaveCount(data.saveCount);
          }
          setIsSaved(true);
          showSuccess('Tool saved successfully!');
        } else {
          const errorData = await response.json().catch(() => ({}));
          
          if (errorData.redirectToPricing) {
            showError('You\'ve reached your tool limit! Redirecting to pricing...');
            // Redirect to pricing page
            window.location.href = '/pricing';
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
  }, [toolId, toolTitle, isSaved, folders, isSignedIn, isLoading, showSuccess, showError]);

  const handleSaveToFolder = useCallback(async (folderName: string) => {
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

      const saveResponse = await saveApiManager.queueCall(
        `save-to-folder-${toolId}`,
        () => fetch('/api/tools/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ toolId }),
        })
      );

      if (saveResponse.ok) {
        const moveResponse = await saveApiManager.queueCall(
          `move-to-folder-${toolId}`,
          () => fetch('/api/user/folders', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              toolName: toolTitle, 
              folderName,
              action: 'add' 
            }),
          })
        );

        if (moveResponse.ok) {
          setCurrentSaveCount(prev => prev + 1);
          setIsSaved(true);
          showSuccess(`Tool saved to folder "${folderName}" successfully!`);
        } else {
          const errorData = await moveResponse.json().catch(() => ({}));
          
          if (errorData.redirectToPricing) {
            showError('You\'ve reached your tool limit! Redirecting to pricing...');
            window.location.href = '/pricing';
          } else {
            showError(`Failed to save to folder: ${errorData.error || 'Unknown error'}`);
          }
        }
      } else {
        const errorData = await saveResponse.json().catch(() => ({}));
        
        if (errorData.redirectToPricing) {
          showError('You\'ve reached your tool limit! Redirecting to pricing...');
          window.location.href = '/pricing';
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
  }, [toolId, toolTitle, folders, isSignedIn, isLoading, showSuccess, showError]);

  const handleRightClick = useCallback((event: React.MouseEvent) => {
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
  }, [isSignedIn, showError]);

  // If user is not signed in, show sign-in button
  if (isLoaded && !isSignedIn) {
    return (
      <SignInButton>
        <StyledSaveButton 
          className={`action-btn save-btn ${className || ''}`}
          disabled={false}
        >
          💾 Sign in to Save
        </StyledSaveButton>
      </SignInButton>
    );
  }

  // Determine which folders to show in menu
  const menuFolders = isSaved 
    ? folders.filter(folder => !folder.tools.some(tool => tool.name === toolTitle))
    : folders;

  return (
    <SaveButtonContainer>
      {showMenu && (
        <MenuContainer
          ref={menuRef}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <MenuHeader>Save to folder:</MenuHeader>
          {menuFolders.length > 0 ? (
            menuFolders.map((folder) => (
              <MenuItem
                key={folder.name}
                onClick={() => handleSaveToFolder(folder.name)}
              >
                📁 {folder.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No folders available</MenuItem>
          )}
        </MenuContainer>
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

const MenuContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 8px 0;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  margin-top: 4px;
`;

const MenuHeader = styled.div`
  padding: 8px 16px;
  font-size: 12px;
  color: #888;
  border-bottom: 1px solid #333;
  margin-bottom: 4px;
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #333;
  }

  &:disabled {
    color: #666;
    cursor: not-allowed;
  }
`;

const StyledSaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 32px;
  font-size: 12px;
  font-weight: 500;
  padding: 0 12px;
  border: 1px solid #ffffff;
  border-radius: 6px;
  background: #000000;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;

  &:hover:not(:disabled) {
    background: #1a1a1a;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.active {
    background: #065F46;
    border-color: #065F46;
  }

  &.active:hover:not(:disabled) {
    background: #047857;
  }
`;

export default OptimizedSaveButton; 