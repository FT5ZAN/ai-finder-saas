import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LikeButton from '../../components/S-components/LikeButton';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <div data-testid="sign-in-button">{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseUser = require('@clerk/nextjs').useUser;

const renderLikeButton = (props: any, authState: any = { isSignedIn: false, isLoaded: true }) => {
  mockUseUser.mockReturnValue(authState);
  
  return render(<LikeButton {...props} />);
};

describe('LikeButton Component', () => {
  const defaultProps = {
    toolId: 'test-tool-id',
    initialLikeCount: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Authentication States', () => {
    test('shows sign-in button when user is not authenticated', () => {
      renderLikeButton(defaultProps, { isSignedIn: false, isLoaded: true });
      
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      expect(screen.getByText('❤️ Sign in to Like')).toBeInTheDocument();
    });

    test('shows like button when user is authenticated', () => {
      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
      expect(screen.getByText('❤️ Likes 10')).toBeInTheDocument();
    });

    test('shows loading state when authentication is loading', () => {
      renderLikeButton(defaultProps, { isSignedIn: false, isLoaded: false });
      
      const button = screen.getByText('❤️ Likes 10');
      expect(button).toBeDisabled();
    });
  });

  describe('API Calls', () => {
    test('does not make API calls when user is not authenticated', async () => {
      renderLikeButton(defaultProps, { isSignedIn: false, isLoaded: true });
      
      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    test('makes API calls when user is authenticated', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) });

      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/tools/like?toolId=test-tool-id', expect.any(Object));
      });
    });

    test('handles 401 errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('User not authenticated for like check');
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Like Functionality', () => {
    test('calls like API when like button is clicked', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likeCount: 11 }) });

      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: 'test-tool-id' }),
        });
      });
    });

    test('calls unlike API when like button is clicked and already liked', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: true }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likeCount: 9 }) });

      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: 'test-tool-id' }),
        });
      });
    });

    test('handles 401 errors in like action gracefully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) })
        .mockResolvedValueOnce({ ok: false, status: 401 });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('User not authenticated for like action');
      });
      
      consoleSpy.mockRestore();
    });

    test('does not make API calls when user is not authenticated and tries to like', async () => {
      renderLikeButton(defaultProps, { isSignedIn: false, isLoaded: true });
      
      const signInButton = screen.getByText('❤️ Sign in to Like');
      fireEvent.click(signInButton);
      
      // Should not make any API calls
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    test('updates like count after successful like', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likeCount: 11 }) });

      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(screen.getByText('❤️ Likes 11')).toBeInTheDocument();
      });
    });

    test('updates like count after successful unlike', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: true }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likeCount: 9 }) });

      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(screen.getByText('❤️ Likes 9')).toBeInTheDocument();
      });
    });

    test('shows active state when tool is liked', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: true }) });

      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      await waitFor(() => {
        const likeButton = screen.getByText('❤️ Likes 10');
        expect(likeButton).toHaveClass('active');
      });
    });
  });

  describe('Loading States', () => {
    test('disables button during API call', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) })
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ likeCount: 11 }) }), 100)));

      renderLikeButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      // Button should be disabled during the API call
      expect(likeButton).toBeDisabled();
      
      await waitFor(() => {
        expect(likeButton).not.toBeDisabled();
      });
    });
  });
}); 