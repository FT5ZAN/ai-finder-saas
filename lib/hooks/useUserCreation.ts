import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useDispatch } from 'react-redux';
import { clearChatForLogout } from '@/lib/slices/chatSlice';
import { clearHistoryForNewUser } from '@/lib/slices/historySlice';

interface UserCreationState {
  isCreating: boolean;
  hasAttempted: boolean;
  success: boolean;
  error: string | null;
}

export const useUserCreation = () => {
  const { user, isSignedIn } = useUser();
  const dispatch = useDispatch();
  // Type assertion to help TypeScript understand the user type
  const typedUser = user as { id: string; emailAddresses?: Array<{ emailAddress: string; verification?: { status: string } }>; fullName?: string; firstName?: string; imageUrl?: string } | null;
  const [state, setState] = useState<UserCreationState>({
    isCreating: false,
    hasAttempted: false,
    success: false,
    error: null
  });
  
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelayRef = useRef(2000); // Start with 2 seconds
  const lastUserIdRef = useRef<string | null>(null);

  // Enhanced logout detection
  const handleUserLogout = useCallback(() => {
    console.log('User logged out, clearing chat and history');
    dispatch(clearChatForLogout());
    dispatch(clearHistoryForNewUser());
    lastUserIdRef.current = null;
  }, [dispatch]);

  // Enhanced new user detection
  const handleNewUser = useCallback(() => {
    console.log('New user detected, clearing chat and history');
    dispatch(clearChatForLogout());
    dispatch(clearHistoryForNewUser());
  }, [dispatch]);

  // Callback to trigger activity tracking after successful user creation
  const triggerActivityUpdate = useCallback(async () => {
    if (typedUser && typedUser.id) {
      try {
        // Triggering activity update after user creation
        await fetch('/api/user/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'login',
            timestamp: new Date().toISOString()
          }),
        });
        // Activity update triggered successfully
      } catch (error) {
        console.error('Failed to trigger activity update:', error);
      }
    }
  }, [typedUser?.id]);

  useEffect(() => {
    if (isSignedIn && typedUser && !state.hasAttempted && !state.isCreating) {
      createUser();
    }
  }, [isSignedIn, typedUser, state.hasAttempted, state.isCreating]);

  const createUser = useCallback(async () => {
    if (!typedUser || !typedUser.id) {
      setState(prev => ({ 
        ...prev, 
        error: 'No user data available' 
      }));
      return;
    }

    const userCreationKey = `user_creation_${typedUser.id}`;
    
    // Check if we've already attempted to create this user
    if (typeof window !== 'undefined' && localStorage.getItem(userCreationKey) === 'true') {
      setState(prev => ({ 
        ...prev, 
        hasAttempted: true,
        success: true 
      }));
      return;
    }

    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      // Add exponential backoff for rate limiting
      if (retryCountRef.current > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelayRef.current));
      }

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: typedUser.emailAddresses?.[0]?.emailAddress,
          clerkId: typedUser.id,
          name: typedUser.fullName || typedUser.firstName || 'User',
          image: typedUser.imageUrl,
          emailVerified: typedUser.emailAddresses?.[0]?.verification?.status === 'verified' 
            ? new Date().toISOString() 
            : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(userCreationKey, 'true');
        setState(prev => ({ 
          ...prev, 
          isCreating: false, 
          hasAttempted: true,
          success: true 
        }));
        retryCountRef.current = 0; // Reset retry count on success
        retryDelayRef.current = 2000; // Reset delay
        
        // Trigger activity update
        triggerActivityUpdate();
      } else if (response.status === 429) {
        // Rate limiting - implement exponential backoff
        retryCountRef.current += 1;
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000); // Max 30 seconds
        
        if (retryCountRef.current < maxRetries) {
          console.log(`Rate limited, retrying in ${retryDelayRef.current}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          setState(prev => ({ ...prev, isCreating: false }));
          // Retry after delay
          setTimeout(() => {
            setState(prev => ({ ...prev, isCreating: true }));
            createUser();
          }, retryDelayRef.current);
          return;
        } else {
          // Max retries reached
          localStorage.setItem(userCreationKey, 'true');
          setState(prev => ({ 
            ...prev, 
            isCreating: false, 
            hasAttempted: true,
            error: 'Rate limit exceeded. Please try again later.' 
          }));
        }
      } else if (response.status === 202) {
        const errorText = data.error || 'User not found in database';
        
        if (data.code === 'USER_NOT_FOUND') {
          // User doesn't exist yet - retry with exponential backoff
          retryCountRef.current += 1;
          if (retryCountRef.current < maxRetries) {
            const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
            // User not found in database yet, retrying
            setTimeout(() => {
              setState(prev => ({ ...prev, isCreating: false }));
            }, delay);
            return;
          } else {
            // Max retries reached for user creation
            localStorage.setItem(userCreationKey, 'true');
            setState(prev => ({ 
              ...prev, 
              isCreating: false, 
              hasAttempted: true,
              error: `Failed after ${maxRetries} attempts: ${errorText}` 
            }));
          }
        } else {
          setState(prev => ({ 
            ...prev, 
            isCreating: false,
            error: `HTTP ${response.status}: ${errorText}` 
          }));
        }
      } else {
        // For other errors or max retries reached
        if (retryCountRef.current >= maxRetries) {
          localStorage.setItem(userCreationKey, 'true');
          setState(prev => ({ 
            ...prev, 
            isCreating: false, 
            hasAttempted: true,
            error: `Failed after ${maxRetries} attempts: ${data.error || 'Unknown error'}` 
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            isCreating: false,
            error: `HTTP ${response.status}: ${data.error || 'Unknown error'}` 
          }));
        }
      }
    } catch (error) {
      console.error('User creation error:', error);
      retryCountRef.current += 1;
      
      if (retryCountRef.current < maxRetries) {
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        setTimeout(() => {
          setState(prev => ({ ...prev, isCreating: false }));
        }, delay);
      } else {
        localStorage.setItem(userCreationKey, 'true');
        setState(prev => ({ 
          ...prev, 
          isCreating: false, 
          hasAttempted: true,
          error: `Network error after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }));
      }
    }
  }, [typedUser, triggerActivityUpdate]);

  // Initialize user creation when user signs in
  useEffect(() => {
    if (isSignedIn && typedUser && !state.hasAttempted && !state.isCreating) {
      createUser();
    }
  }, [isSignedIn, typedUser?.id, state.hasAttempted, state.isCreating, createUser]);

  // Enhanced user change detection
  useEffect(() => {
    const currentUserId = typedUser?.id;
    
    // If user logged out (no user), clear data
    if (!isSignedIn && lastUserIdRef.current) {
      handleUserLogout();
      return;
    }
    
    // If this is a new user (different from last user), clear data
    if (isSignedIn && lastUserIdRef.current && lastUserIdRef.current !== currentUserId) {
      handleNewUser();
    }
    
    // Update last user ID
    if (isSignedIn && currentUserId) {
      lastUserIdRef.current = currentUserId;
    }
  }, [isSignedIn, typedUser?.id, handleUserLogout, handleNewUser]);

  // Clean up when user signs out
  useEffect(() => {
    if (!isSignedIn && typedUser && typedUser.id) {
      const userCreationKey = `user_creation_${typedUser.id}`;
      localStorage.removeItem(userCreationKey);
      setState({
        isCreating: false,
        hasAttempted: false,
        success: false,
        error: null
      });
      retryCountRef.current = 0;
      retryDelayRef.current = 2000;
    }
  }, [isSignedIn, typedUser?.id]);

  return {
    ...state,
    createUser, // Expose for manual triggering if needed
    handleUserLogout, // Expose for external use
    handleNewUser, // Expose for external use
    reset: () => {
      retryCountRef.current = 0;
      retryDelayRef.current = 2000;
      setState({
        isCreating: false,
        hasAttempted: false,
        success: false,
        error: null
      });
    }
  };
}; 