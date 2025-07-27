'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useUser, SignInButton } from '@clerk/nextjs';

interface LikeButtonProps {
  toolId: string;
  initialLikeCount: number;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({ toolId, initialLikeCount, className }) => {
  const { isSignedIn, isLoaded } = useUser();
  const [currentLikeCount, setCurrentLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already liked this tool on component mount (only if signed in)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const checkUserInteraction = async () => {
      try {
        const likeResponse = await fetch(`/api/tools/like?toolId=${toolId}`, {
          method: 'GET',
        });
        
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsLiked(likeData.hasLiked || false);
        } else if (likeResponse.status === 401) {
          // User is not authenticated, don't show error
          console.log('User not authenticated for like check');
        } else {
          console.error('Failed to check like status:', likeResponse.status, likeResponse.statusText);
        }
      } catch (error) {
        console.error('Error checking user interaction:', error);
      }
    };

    checkUserInteraction();
  }, [toolId, isLoaded, isSignedIn]);

  const handleLike = async () => {
    if (isLoading) return;
    
    if (!isSignedIn) {
      console.log('User not signed in, cannot like tool');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Attempting to ${isLiked ? 'unlike' : 'like'} tool ${toolId}`);
      
      const response = await fetch('/api/tools/like', {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId }),
      });

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
  };

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
  padding: 8px 12px;
  border: 1px solid #ffffff;
  border-radius: 6px;
  background: #000000;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;

  &:hover {
    background: #3A2A4A;
    border-color: #4A3A5A;
    transform: translateY(-1px);
  }

  &.active {
    background: #7C2D12;
    border-color: #9A3412;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 11px;
    min-width: 50px;
  }

  @media (max-width: 480px) {
    padding: 4px 6px;
    font-size: 10px;
    min-width: 40px;
  }
`;

export default LikeButton; 