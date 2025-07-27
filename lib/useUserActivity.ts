import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

export const useUserActivity = () => {
  const { isSignedIn, userId } = useAuth();
  const hasAttemptedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const updateUserActivity = async () => {
      if (isSignedIn && userId && !hasAttemptedRef.current) {
        try {
          // Updating user activity
          
          const response = await fetch('/api/user/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              action: 'login',
              timestamp: new Date().toISOString()
            }),
          });

          if (response.ok) {
            await response.json();
            // User activity updated successfully
            hasAttemptedRef.current = true;
            retryCountRef.current = 0; // Reset retry count on success
          } else if (response.status === 202) {
            const result = await response.json();
            if (result.code === 'USER_NOT_FOUND') {
              // User doesn't exist yet - retry with exponential backoff
              retryCountRef.current += 1;
              if (retryCountRef.current < maxRetries) {
                const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
                // User not found in database yet, retrying
                setTimeout(updateUserActivity, delay);
                return;
              } else {
                // Max retries reached for user activity update
                hasAttemptedRef.current = true; // Stop retrying
              }
            } else {
              console.error('User activity update failed:', result);
              hasAttemptedRef.current = true; // Don't retry on other 202s
            }
          } else if (response.status === 404) {
            // Handle actual 404 errors (not user not found)
            console.error('User activity endpoint not found:', response.status, response.statusText);
            hasAttemptedRef.current = true; // Don't retry on 404s
          } else {
            console.error('User activity update failed:', response.status, response.statusText);
            hasAttemptedRef.current = true; // Don't retry on errors
          }
        } catch (error) {
          console.error('Error updating user activity:', error);
          hasAttemptedRef.current = true; // Don't retry on network errors
        }
      }
    };

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset attempt flag when user changes
    hasAttemptedRef.current = false;
    retryCountRef.current = 0;

    // Update activity when component mounts (user visits page)
    // Add a longer delay to ensure user creation completes first
    const initialDelay = setTimeout(updateUserActivity, 5000); // Increased from 3s to 5s

    // Set up periodic activity updates (every 5 minutes) only if initial attempt succeeds
    intervalRef.current = setInterval(() => {
      if (hasAttemptedRef.current) {
        updateUserActivity();
      }
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSignedIn, userId]);

  // Clean up when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      hasAttemptedRef.current = false;
      retryCountRef.current = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isSignedIn]);
}; 