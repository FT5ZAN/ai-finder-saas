'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import styled from 'styled-components';
import { useAlert } from '@/components/B-components/alert/AlertContext';
import { redirectToPricing, shouldRedirectToPricing } from '@/utils/redirect';
import { useHistoryTracker } from '@/lib/useHistoryTracker';

import {
  ContextMenu,
  CreateFolderModal,
  FolderSelectionMenu,
  FolderSection,
  SavedTool,
  Folder
} from '@/components/B-components/saved-tools';

// Add subscription interface
interface SubscriptionData {
  isSubscribed: boolean;
  planAmount: number;
  toolLimit: number;
  folderLimit: number;
  totalSavedTools: number;
  currentFolders: number;
  canSaveMoreTools: boolean;
  canCreateMoreFolders: boolean;
}

// Confirmation Dialog Styles
const DeleteConfirmationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
`;

const DeleteConfirmationDialog = styled.div`
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const DeleteConfirmationTitle = styled.h3`
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-align: center;
`;

const DeleteConfirmationMessage = styled.p`
  color: #d1d5db;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 24px 0;
  text-align: center;
  
  strong {
    color: #ef4444;
  }
`;

const DeleteConfirmationButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const DeleteCancelButton = styled.button`
  background: #374151;
  color: #ffffff;
  border: 2px solid #4b5563;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #4b5563;
    border-color: #6b7280;
  }
`;

const DeleteConfirmButton = styled.button`
  background: #dc2626;
  color: #ffffff;
  border: 2px solid #dc2626;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #b91c1c;
    border-color: #b91c1c;
  }
`;

const SavedToolsClientPage = () => {
  const { isSignedIn, userId } = useAuth();
  const { showSuccess, showError, showInfo } = useAlert();
  const [savedTools, setSavedTools] = useState<SavedTool[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'tool' | 'page';
    toolName?: string;
    websiteUrl?: string;
    folderName?: string;
  } | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [folderSelectionMenu, setFolderSelectionMenu] = useState<{
    x: number;
    y: number;
    toolName: string;
    websiteUrl: string;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isVisible: boolean;
    folderName: string;
  }>({ isVisible: false, folderName: '' });
  const hasShownWelcomeRef = useRef(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure hydration safety
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isSignedIn && userId && isClient) {
      fetchSavedTools();
      fetchFolders();
      fetchSubscription();
      
      // Only show welcome alert once per session
      if (!hasShownWelcomeRef.current) {
        showInfo('welcome to your saved tools!');
        hasShownWelcomeRef.current = true;
      }
    }
  }, [isSignedIn, userId, showInfo, isClient]);

  const fetchSavedTools = async () => {
    try {
      const response = await fetch('/api/user/saved-tools');
      
      if (response.ok) {
        const data = await response.json();
        setSavedTools(data.savedTools || []);
      } else {
        setError('Failed to fetch saved tools');
      }
    } catch (error) {
      console.error('Error fetching saved tools:', error);
      setError('Failed to fetch saved tools');
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/user/folders');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw folders data:', data);
        
        const formattedFolders = (data.folders || [])
          .map((folder: Record<string, unknown>) => {
            console.log('Processing folder:', folder);
            return {
              ...folder,
              createdAt: typeof folder.createdAt === 'string'
                ? folder.createdAt
                : (typeof folder.createdAt === 'number' || folder.createdAt instanceof Date)
                  ? new Date(folder.createdAt).toISOString()
                  : new Date().toISOString()
            };
          });
        
        console.log('Formatted folders:', formattedFolders);
        setFolders(formattedFolders);
      } else {
        console.error('Failed to fetch folders');
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        console.error('Failed to fetch subscription');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleRemoveTool = async (toolName: string) => {
    try {
      // Find the tool in the tools database to get its ID
      const toolsResponse = await fetch('/api/tools');
      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        const tool = toolsData.tools.find((t: Record<string, unknown>) => t.title === toolName);
        
        if (tool) {
          // Remove from saved tools
          const response = await fetch('/api/tools/save', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ toolId: tool.id }),
          });

          if (response.ok) {
            // Remove from local state
            setSavedTools(prev => prev.filter(t => t.name !== toolName));
            showSuccess('Tool removed successfully!');
          }
        }
      }
    } catch (error) {
      console.error('Error removing tool:', error);
    }
    setContextMenu(null);
  };

  const { trackToolVisit } = useHistoryTracker();

  const handleVisitTool = (websiteUrl: string, toolName?: string, logoUrl?: string) => {
    // Track the tool visit in history
    if (toolName && logoUrl) {
      trackToolVisit({
        id: toolName.toLowerCase().replace(/\s+/g, '-'),
        name: toolName,
        logo: logoUrl,
        url: websiteUrl
      });
    }
    
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    setContextMenu(null);
  };

  const handleCardClick = (websiteUrl: string, toolName?: string, logoUrl?: string) => {
    handleVisitTool(websiteUrl, toolName, logoUrl);
  };

  const handleContextMenu = (event: React.MouseEvent, type: 'tool' | 'page', toolName?: string, websiteUrl?: string, folderName?: string) => {
    event.preventDefault();
    
    // Check if the click target is a SaveButton or its menu
    const target = event.target as HTMLElement;
    if (target.closest('.save-btn') || target.closest('[data-save-menu]')) {
      return; // Don't show global context menu if clicking on SaveButton
    }
    
    // Calculate position with boundary checking
    let x = event.clientX;
    let y = event.clientY;
    
    // Adjust if menu would go off screen (assuming menu width ~200px and height ~150px)
    if (x + 200 > window.innerWidth) {
      x = x - 200;
    }
    if (y + 150 > window.innerHeight) {
      y = y - 150;
    }
    
    // Ensure minimum position
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setContextMenu({
      x,
      y,
      type,
      toolName,
      websiteUrl,
      folderName
    });
  };

  const handleToolContextMenu = (event: React.MouseEvent, toolName: string, websiteUrl: string, folderName?: string) => {
    event.preventDefault();
    
    // Check if the click target is a SaveButton or its menu
    const target = event.target as HTMLElement;
    if (target.closest('.save-btn') || target.closest('[data-save-menu]')) {
      return; // Don't show global context menu if clicking on SaveButton
    }
    
    // Calculate position with boundary checking
    let x = event.clientX;
    let y = event.clientY;
    
    // Adjust if menu would go off screen (assuming menu width ~200px and height ~150px)
    if (x + 200 > window.innerWidth) {
      x = x - 200;
    }
    if (y + 150 > window.innerHeight) {
      y = y - 150;
    }
    
    // Ensure minimum position
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setContextMenu({
      x,
      y,
      type: 'tool',
      toolName,
      websiteUrl,
      folderName: folderName === 'Unsorted Tools' ? undefined : folderName
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      const response = await fetch('/api/user/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new folder to local state immediately
        if (data.folder) {
          const newFolder = {
            ...data.folder,
            createdAt: typeof data.folder.createdAt === 'string' 
              ? data.folder.createdAt 
              : new Date(data.folder.createdAt).toISOString()
          };
          setFolders(prev => [...prev, newFolder]);
        }
        setShowCreateFolderModal(false);
        showSuccess(`Folder "${folderName}" created successfully!`);
      } else {
        const data = await response.json();
        if (shouldRedirectToPricing(data)) {
          showError('You&apos;ve reached your folder limit! Redirecting to pricing...');
          redirectToPricing();
        } else {
          showError(data.error || 'Failed to create folder');
        }
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      showError('Failed to create folder');
    }
  };

  const handleMoveToFolder = async (folderName: string) => {
    if (!folderSelectionMenu) return;
    
    try {
      // Check if tool is already in the target folder
      const targetFolder = folders.find(folder => folder.name === folderName);
      if (targetFolder && targetFolder.tools.some(tool => tool.name === folderSelectionMenu.toolName)) {
        showError(`Tool is already in folder "${folderName}"`);
        setFolderSelectionMenu(null);
        return;
      }

      // Check if tool is already in any other folder
      const toolInOtherFolder = folders.find(folder => 
        folder.name !== folderName && folder.tools.some(tool => tool.name === folderSelectionMenu.toolName)
      );
      
      if (toolInOtherFolder) {
        showError(`Tool is already in folder "${toolInOtherFolder.name}". A tool can only be in one folder at a time.`);
        setFolderSelectionMenu(null);
        return;
      }

      // Move tool to folder
      const response = await fetch('/api/user/folders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          toolName: folderSelectionMenu.toolName, 
          folderName,
          action: 'add' 
        }),
      });

      if (response.ok) {
        // Update local state immediately
        const toolToMove = savedTools.find(tool => tool.name === folderSelectionMenu.toolName);
        if (toolToMove) {
          setFolders(prev => prev.map(folder => {
            if (folder.name === folderName) {
              return {
                ...folder,
                tools: [...folder.tools, toolToMove]
              };
            }
            return folder;
          }));
          setSavedTools(prev => prev.filter(tool => tool.name !== folderSelectionMenu.toolName));
        }
        showSuccess(`Tool moved to folder "${folderName}" successfully!`);
      } else {
        const data = await response.json();
        if (shouldRedirectToPricing(data)) {
          showError('You&apos;ve reached your tool limit! Redirecting to pricing...');
          redirectToPricing();
        } else {
          showError(data.error || 'Failed to move tool to folder');
          // Refresh data from server to ensure state is correct
          fetchSavedTools();
          fetchFolders();
        }
      }
    } catch (error) {
      console.error('Error moving tool to folder:', error);
      showError('Failed to move tool to folder');
      // Refresh data from server to ensure state is correct
      fetchSavedTools();
      fetchFolders();
    }
    setFolderSelectionMenu(null);
  };

  const handleAddToFolder = () => {
    if (contextMenu && contextMenu.toolName && contextMenu.websiteUrl) {
      setFolderSelectionMenu({
        x: contextMenu.x + 150, // Position next to the context menu
        y: contextMenu.y,
        toolName: contextMenu.toolName,
        websiteUrl: contextMenu.websiteUrl
      });
      setContextMenu(null);
    }
  };

  const closeFolderSelectionMenu = () => {
    setFolderSelectionMenu(null);
  };

  const handleRemoveFromFolder = async () => {
    if (!contextMenu || !contextMenu.toolName || !contextMenu.folderName) return;
    
    try {
      const response = await fetch('/api/user/folders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          toolName: contextMenu.toolName, 
          folderName: contextMenu.folderName,
          action: 'remove' 
        }),
      });

      if (response.ok) {
        // Update local state immediately
        setFolders(prev => prev.map(folder => {
          if (folder.name === contextMenu.folderName) {
            return {
              ...folder,
              tools: folder.tools.filter(tool => tool.name !== contextMenu.toolName)
            };
          }
          return folder;
        }));
        // Tool is completely removed, no need to refresh saved tools
        showSuccess('Tool removed from folder successfully!');
      } else {
          const data = await response.json();
          showError(data.error || 'Failed to remove tool from folder');
        }
    } catch (error) {
      console.error('Error removing tool from folder:', error);
      showError('Failed to remove tool from folder');
    }
    setContextMenu(null);
  };

  const handleDeleteFolder = async (folderName: string) => {
    // Show custom confirmation dialog
    setDeleteConfirmation({ isVisible: true, folderName });
  };

  const confirmDeleteFolder = async () => {
    const { folderName } = deleteConfirmation;
    
    try {
      const response = await fetch('/api/user/folders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName }),
      });

      if (response.ok) {
        // Update local state immediately
        setFolders(prev => prev.filter(folder => folder.name !== folderName));
        showSuccess(`Folder "${folderName}" deleted successfully! All tools in the folder have been removed.`);
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      showError('Failed to delete folder');
    } finally {
      setDeleteConfirmation({ isVisible: false, folderName: '' });
    }
  };

  const cancelDeleteFolder = () => {
    setDeleteConfirmation({ isVisible: false, folderName: '' });
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <Container>
        <Header>
          <h1>Saved Tools</h1>
          <p>Please sign in to view your saved tools.</p>
        </Header>
      </Container>
    );
  }

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Container>
        <Header>
          <h1>Saved Tools</h1>
          <p>Error: {error}</p>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
     
      <Header>
        
        <h1>Saved Tools</h1>
        {/* <p>You have {totalTools} saved tools in {folders.length + 1} folders</p> */}
        

      {/* Current Plan Display */}
      {subscription && subscription.toolLimit !== undefined && subscription.folderLimit !== undefined && (
        <CurrentPlanSection>
          <CurrentPlanHeader>
            {/* <PlanIcon>👑</PlanIcon> */}
            <div>
              <CurrentPlanTitle>
                Current Plan: ${subscription.planAmount === 0 ? 'Free' : subscription.planAmount}
              </CurrentPlanTitle>
              <CurrentPlanSubtitle>
                {subscription.planAmount === 0 ? 'Basic access' : 'Premium features unlocked'}
              </CurrentPlanSubtitle>
            </div>
          </CurrentPlanHeader>

          <UsageGrid>
            <UsageCard>
              <UsageHeader>
                <UsageIcon>🛠️</UsageIcon>
                <UsageTitle>Tools Saved</UsageTitle>
              </UsageHeader>
              <UsageValue>
                {subscription.totalSavedTools || 0} / {subscription.toolLimit || 0}
              </UsageValue>
              <ProgressBar>
                              <ProgressFill 
                $percent={
                  subscription.toolLimit && subscription.toolLimit > 0 && subscription.totalSavedTools !== undefined
                    ? Math.min(((subscription.totalSavedTools || 0) / subscription.toolLimit) * 100, 100)
                    : 0
                }
                $color={
                  subscription.toolLimit && subscription.toolLimit > 0 && subscription.totalSavedTools !== undefined
                    ? ((subscription.totalSavedTools || 0) / subscription.toolLimit) > 0.8
                      ? '#ef4444'
                      : ((subscription.totalSavedTools || 0) / subscription.toolLimit) > 0.6
                        ? '#f59e0b'
                        : '#10b981'
                    : '#10b981'
                }
              />
              </ProgressBar>
            </UsageCard>

            <UsageCard>
              <UsageHeader>
                <UsageIcon>📁</UsageIcon>
                <UsageTitle>Folders Created</UsageTitle>
              </UsageHeader>
              <UsageValue>
                {subscription.currentFolders || 0} / {subscription.folderLimit || 0}
              </UsageValue>
              <ProgressBar>
                              <ProgressFill 
                $percent={
                  subscription.folderLimit && subscription.folderLimit > 0 && subscription.currentFolders !== undefined
                    ? Math.min(((subscription.currentFolders || 0) / subscription.folderLimit) * 100, 100)
                    : 0
                }
                $color={
                  subscription.folderLimit && subscription.folderLimit > 0 && subscription.currentFolders !== undefined
                    ? ((subscription.currentFolders || 0) / subscription.folderLimit) > 0.8
                      ? '#ef4444'
                      : ((subscription.currentFolders || 0) / subscription.folderLimit) > 0.6
                        ? '#f59e0b'
                        : '#10b981'
                    : '#10b981'
                }
              />
              </ProgressBar>
            </UsageCard>
          </UsageGrid>

          {(!subscription.canSaveMoreTools || !subscription.canCreateMoreFolders) && (
            <LimitWarning>
              ⚠️ You&apos;ve reached some limits! <UpgradeLink href="/priceing">Upgrade your plan</UpgradeLink> for more tools and folders.
            </LimitWarning>
          )}
        </CurrentPlanSection>
      )}
       </Header>
     <Start>
      <PageContent 
        onContextMenu={(e) => handleContextMenu(e, 'page')}
        onClick={() => {
          // Close any open SaveButton menus when clicking on page content
          const saveMenus = document.querySelectorAll('[data-save-menu="true"]');
          saveMenus.forEach(menu => {
            const event = new CustomEvent('closeSaveMenu');
            menu.dispatchEvent(event);
          });
        }}
      >
        {/* Always display Unsorted Tools section first */}
        <FolderSection
          folder={{
            name: 'Unsorted Tools',
            tools: savedTools,
            createdAt: new Date().toISOString()
          }}
          onCardClick={handleCardClick}
          onCardContextMenu={handleToolContextMenu}
          onDeleteFolder={() => {}} // No delete for unsorted tools section
          onCreateFolder={() => setShowCreateFolderModal(true)}
          isUnsorted={true} // Flag to identify unsorted section
        />

        {/* Display other Folders in a row layout */}
        {folders.length > 0 && (
          <CustomFoldersContainer>
            {folders.map((folder, folderIndex) => (
              <FolderSection
                key={folderIndex}
                folder={folder}
                onCardClick={handleCardClick}
                onCardContextMenu={handleToolContextMenu}
                onDeleteFolder={handleDeleteFolder}
                isUnsorted={false}
              />
            ))}
          </CustomFoldersContainer>
        )}
      </PageContent>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onVisit={contextMenu.websiteUrl ? () => {
            // Find the tool to get its logo URL
            const tool = savedTools.find(t => t.name === contextMenu.toolName) || 
                        folders.flatMap(f => f.tools).find(t => t.name === contextMenu.toolName);
            handleVisitTool(contextMenu.websiteUrl!, contextMenu.toolName, tool?.logoUrl);
          } : undefined}
          onRemove={contextMenu.toolName && !contextMenu.folderName ? () => handleRemoveTool(contextMenu.toolName!) : undefined}
          onRemoveFromFolder={contextMenu.toolName && contextMenu.folderName ? handleRemoveFromFolder : undefined}
          onCreateFolder={() => setShowCreateFolderModal(true)}
          onAddToFolder={contextMenu.toolName && !contextMenu.folderName ? handleAddToFolder : undefined}
          onClose={closeContextMenu}
        />
      )}

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />

      {folderSelectionMenu && (
        <FolderSelectionMenu
          x={folderSelectionMenu.x}
          y={folderSelectionMenu.y}
          folders={folders}
          toolName={folderSelectionMenu.toolName}
          onSelectFolder={(folderName) => handleMoveToFolder(folderName)}
          onClose={closeFolderSelectionMenu}
        />
      )}

      {/* Custom Delete Confirmation Dialog */}
      {deleteConfirmation.isVisible && (
        <DeleteConfirmationOverlay onClick={cancelDeleteFolder}>
          <DeleteConfirmationDialog onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <DeleteConfirmationTitle>Delete Folder</DeleteConfirmationTitle>
            <DeleteConfirmationMessage>
              Are you sure you want to delete the folder &quot;{deleteConfirmation.folderName}&quot;?
              <br />
              <strong>This action cannot be undone.</strong>
            </DeleteConfirmationMessage>
            <DeleteConfirmationButtons>
              <DeleteCancelButton onClick={cancelDeleteFolder}>
                Cancel
              </DeleteCancelButton>
              <DeleteConfirmButton onClick={confirmDeleteFolder}>
                Delete Folder
              </DeleteConfirmButton>
            </DeleteConfirmationButtons>
          </DeleteConfirmationDialog>
        </DeleteConfirmationOverlay>
      )}
      </Start>
    </Container>
  );
};

const Container = styled.div`
  max-width: 100%;
      margin: 10px auto;
  padding: 0rem;
  min-height: 100vh;
  background:;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Start = styled.div`
  display: flex;
  flex-direction: column;
  align-items:center;
  width: 100%;
  background:;
  min-height: 95vh;
`;

const PageContent = styled.div`
  width: 100%;
    background: ;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: auto;
  
`;

const CustomFoldersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  margin-top: 1rem;
`;

const Header = styled.div`
     text-align: center;
    margin-bottom: rem;
    padding: 1rem;
    display: flex;
    background: transparent;
    align-items: center;
    width: 100%;
    justify-content: center;
    align-items: center;
    gap: 15rem;
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;
    background: linear-gradient(135deg,rgb(49, 42, 42) 0%,rgb(255, 255, 255) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
     
  }
  
  p {
    font-size: 1.1rem;
    color:rgb(255, 255, 255);
    margin: 0;
  }
`;

const CurrentPlanSection = styled.div`
  background: transparent;
  border-radius: 12px;
  padding: 0px;
  margin-bottom: 0px;
`;

const CurrentPlanHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  justify-content: center;
  align-items: center;
`;



const CurrentPlanTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const CurrentPlanSubtitle = styled.p`
  font-size: 1rem;
  margin: 0;
`;

const UsageGrid = styled.div`
  display: flex;
    gap: 0px;
    margin-bottom: 15px;
    background: transparent;
    align-items: center;
    place-content: space-around;
    

`;

const UsageCard = styled.div`
  flex: 0;
`;

const UsageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const UsageIcon = styled.span`
  font-size: 1.25rem;
  margin-right: 8px;
`;

const UsageTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const UsageValue = styled.p`
  font-size: 1rem;
  margin: 0;
`;

const ProgressBar = styled.div`
  height: 12px;
  background: #374151;
  border-radius: 8px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  background: ${({ $color }) => $color};
  width: ${({ $percent }) => $percent}%;
  border-radius: 8px;
`;

const LimitWarning = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
`;

const UpgradeLink = styled.a`
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;

export default SavedToolsClientPage; 