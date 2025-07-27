import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useUser } from '@clerk/nextjs';
import { clearChatForLogout } from '@/lib/slices/chatSlice';
import { clearHistoryForNewUser } from '@/lib/slices/historySlice';

export const useChatCleanup = () => {
  const dispatch = useDispatch();
  const { user, isSignedIn } = useUser();

  // Function to clear chat and history on logout
  const handleLogout = useCallback(() => {
    console.log('Clearing chat and history due to logout');
    dispatch(clearChatForLogout());
    dispatch(clearHistoryForNewUser());
  }, [dispatch]);

  // Function to clear chat and history for new user
  const handleNewUser = useCallback(() => {
    console.log('Clearing chat and history for new user');
    dispatch(clearChatForLogout());
    dispatch(clearHistoryForNewUser());
  }, [dispatch]);

  // Track user changes and handle logout/new user scenarios
  useEffect(() => {
    if (!isSignedIn && user) {
      // User just logged out
      handleLogout();
    }
  }, [isSignedIn, user, handleLogout]);

  // Listen for Clerk-specific logout events with rate limiting
  useEffect(() => {
    let isProcessing = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const handleStorageChange = (e: StorageEvent) => {
      // Prevent multiple simultaneous processing
      if (isProcessing) return;
      
      // Check for Clerk JWT removal (most reliable indicator)
      if (e.key === '__clerk_client_jwt' && !e.newValue) {
        console.log('Clerk JWT removed, clearing chat and history');
        isProcessing = true;
        
        // Add delay to prevent rapid successive calls
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleLogout();
          isProcessing = false;
        }, 1000);
        return;
      }

      // Check for other Clerk-related storage changes
      if (e.key && (e.key.includes('clerk') || e.key.includes('auth'))) {
        // Check if user is actually logged out by looking for auth-related keys
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('clerk') || key.includes('auth') || key.includes('user')
        );
        
        if (authKeys.length === 0) {
          console.log('No auth keys found, clearing chat and history');
          isProcessing = true;
          
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            handleLogout();
            isProcessing = false;
          }, 1000);
        }
      }
    };

    // Listen for beforeunload event (page refresh/close)
    const handleBeforeUnload = () => {
      // Don't clear on page refresh, only on actual logout
      // This is handled by the storage event listener
    };

    // Listen for visibility change (tab switch/close)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or closed browser
        // Don't clear chat here, let it persist
      }
    };

    // Listen for focus events to detect when user returns to the tab
    const handleFocus = () => {
      // Check if user is still signed in when they return to the tab
      if (!isSignedIn) {
        handleLogout();
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleLogout, isSignedIn]);

  // Set up periodic cleanup check (every 10 minutes instead of 5)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Check if user is still signed in
      if (!isSignedIn) {
        handleLogout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(cleanupInterval);
  }, [isSignedIn, handleLogout]);

  // Manual logout function for external use
  const manualLogout = useCallback(() => {
    console.log('Manual logout triggered');
    handleLogout();
  }, [handleLogout]);

  // Manual new user function for external use
  const manualNewUser = useCallback(() => {
    console.log('Manual new user triggered');
    handleNewUser();
  }, [handleNewUser]);

  return { 
    manualLogout, 
    manualNewUser,
    isSignedIn,
    userId: user?.id 
  };
}; 