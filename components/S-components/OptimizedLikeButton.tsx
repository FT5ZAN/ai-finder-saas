'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useUser, SignInButton } from '@clerk/nextjs';

interface LikeButtonProps {
  toolId: string;
  initialLikeCount: number;
  className?: string;
}

// Global API call manager for like buttons
const likeApiManager = {
  pendingCalls: new Map<string, Promise<any>>(),
  callQueue: [] as Array<{ id: string; fn: () => Promise<any> }>,
  isProcessing: false,
  
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
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Like API call failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }
};

const OptimizedLikeButton: React.FC<LikeButtonProps> = ({ toolId, initialLikeCount, className }) => {
  const { isSignedIn, isLoaded } = useUser();
  const [currentLikeCount, setCurrentLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const checkStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const likeActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced check for user interaction status
  const checkUserInteraction = useCallback(async () => {
    if (!isLoaded || !isSignedIn || hasCheckedStatus) return;

    try {
      const response = await likeApiManager.queueCall(
        `check-like-${toolId}`,
        () => fetch(`/api/tools/like?toolId=${toolId}`, { method: 'GET' })
      );
      
      if (response.ok) {
        const likeData = await response.json();
        setIsLiked(likeData.hasLiked || false);
        setHasCheckedStatus(true);
      } else if (response.status === 401) {
        console.log('User not authenticated for like check');
        setHasCheckedStatus(true);
      } else {
        console.error('Failed to check like status:', response.status, response.statusText);
        setHasCheckedStatus(true);
      }
    } catch (error) {
      console.error('Error checking user interaction:', error);
      setHasCheckedStatus(true);
    }
  }, [toolId, isLoaded, isSignedIn, hasCheckedStatus]);

  // Check if user has already liked this tool on component mount (only if signed in)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Clear any existing timeout
    if (checkStatusTimeoutRef.current) {
      clearTimeout(checkStatusTimeoutRef.current);
    }

    // Debounce the check to prevent overwhelming the server
    checkStatusTimeoutRef.current = setTimeout(() => {
      checkUserInteraction();
    }, Math.random() * 1000); // Random delay between 0-1000ms

    return () => {
      if (checkStatusTimeoutRef.current) {
        clearTimeout(checkStatusTimeoutRef.current);
      }
    };
  }, [toolId, isLoaded, isSignedIn, checkUserInteraction]);

  const handleLike = useCallback(async () => {
    if (isLoading) return;
    
    if (!isSignedIn) {
      console.log('User not signed in, cannot like tool');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Attempting to ${isLiked ? 'unlike' : 'like'} tool ${toolId}`);
      
      const response = await likeApiManager.queueCall(
        `like-action-${toolId}`,
        () => fetch('/api/tools/like', {
          method: isLiked ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ toolId }),
        })
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Like response:', data);
        setCurrentLikeCount(data.likeCount);
        setIsLiked(!isLiked);
        console.log(`Tool ${isLiked ? 'unliked' : 'liked'} successfully. New count: ${data.likeCount}`);
      } else if (response.status === 401) {
        console.log('User not authenticated for like action');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to like tool:', response.status, response.statusText, errorData);
      }
    } catch (error) {
      console.error('Error liking tool:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toolId, isLiked, isSignedIn, isLoading]);

  // If user is not signed in, show sign-in button
  if (isLoaded && !isSignedIn) {
    return (
      <SignInButton>
        <StyledLikeButton 
          className={`action-btn like-btn ${className || ''}`}
          disabled={false}
        >
          ❤️ Sign in to Like
        </StyledLikeButton>
      </SignInButton>
    );
  }

  return (
    <StyledLikeButton 
      className={`action-btn like-btn ${isLiked ? 'active' : ''} ${className || ''}`}
      onClick={handleLike}
      disabled={isLoading || !isLoaded}
    >
      ❤️ Likes {currentLikeCount}
    </StyledLikeButton>
  );
};

const StyledLikeButton = styled.button`
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
    background: #dc2626;
    border-color: #dc2626;
  }

  &.active:hover:not(:disabled) {
    background: #b91c1c;
  }
`;

export default OptimizedLikeButton; 