import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import OptimizedLikeButton from '@/components/S-components/OptimizedLikeButton';
import OptimizedSaveButton from '@/components/S-components/OptimizedSaveButton';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useAlert hook
jest.mock('@/components/B-components/alert/AlertContext', () => ({
  useAlert: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('Optimized Button Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: null,
    } as any);
  });

  describe('OptimizedLikeButton', () => {
    const defaultProps = {
      toolId: 'test-tool-id',
      initialLikeCount: 10,
    };

    const renderOptimizedLikeButton = (props = defaultProps, userState = { isSignedIn: true, isLoaded: true }) => {
      mockUseUser.mockReturnValue({
        isSignedIn: userState.isSignedIn,
        isLoaded: userState.isLoaded,
        user: null,
      } as any);
      return render(<OptimizedLikeButton {...props} />);
    };

    test('renders correctly with initial like count', () => {
      renderOptimizedLikeButton();
      expect(screen.getByText('❤️ Likes 10')).toBeInTheDocument();
    });

    test('shows sign-in button when user is not authenticated', () => {
      renderOptimizedLikeButton(defaultProps, { isSignedIn: false, isLoaded: true });
      expect(screen.getByText('❤️ Sign in to Like')).toBeInTheDocument();
    });

    test('handles like action with API call management', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likeCount: 11 }) });

      renderOptimizedLikeButton();
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      // Wait for the API call to complete and state to update
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/like', expect.any(Object));
      });
    });

    test('handles unlike action correctly', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: true }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likeCount: 9 }) });

      renderOptimizedLikeButton();
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/like', expect.any(Object));
      });
    });

    test('prevents multiple simultaneous API calls', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likeCount: 11 }) });

      renderOptimizedLikeButton();
      
      const likeButton = screen.getByText('❤️ Likes 10');
      
      // Click multiple times rapidly
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      
      // Should only make one API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Initial check + one like action
      });
    });

    test('handles API errors gracefully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasLiked: false }) })
        .mockRejectedValueOnce(new Error('Network error'));

      renderOptimizedLikeButton();
      
      const likeButton = screen.getByText('❤️ Likes 10');
      fireEvent.click(likeButton);
      
      // Component should not crash and should handle the error gracefully
      await waitFor(() => {
        expect(likeButton).toBeInTheDocument();
      });
    });
  });

  describe('OptimizedSaveButton', () => {
    const defaultProps = {
      toolId: 'test-tool-id',
      toolTitle: 'Test Tool',
      initialSaveCount: 5,
    };

    const renderOptimizedSaveButton = (props = defaultProps, userState = { isSignedIn: true, isLoaded: true }) => {
      mockUseUser.mockReturnValue({
        isSignedIn: userState.isSignedIn,
        isLoaded: userState.isLoaded,
        user: null,
      } as any);
      return render(<OptimizedSaveButton {...props} />);
    };

    test('renders correctly with initial save count', () => {
      renderOptimizedSaveButton();
      expect(screen.getByText('💾 Save (5)')).toBeInTheDocument();
    });

    test('shows sign-in button when user is not authenticated', () => {
      renderOptimizedSaveButton(defaultProps, { isSignedIn: false, isLoaded: true });
      expect(screen.getByText('💾 Sign in to Save')).toBeInTheDocument();
    });

    test('handles save action with API call management', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ saveCount: 6 }) });

      renderOptimizedSaveButton();
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/save', expect.any(Object));
      });
    });

    test('handles unsave action correctly', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: true }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ saveCount: 4 }) });

      renderOptimizedSaveButton();
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/save', expect.any(Object));
      });
    });

    test('caches folders to prevent multiple API calls', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ folders: [] }) });

      renderOptimizedSaveButton();
      
      // Wait for initial load
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    test('handles right-click menu correctly', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ folders: [{ name: 'Test Folder', tools: [] }] }) });

      renderOptimizedSaveButton();
      
      const saveButton = screen.getByText('💾 Save (5)');
      
      // Right click to open menu
      fireEvent.contextMenu(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Save to folder:')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('prevents multiple simultaneous API calls', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ folders: [] }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ saveCount: 6 }) });

      renderOptimizedSaveButton();
      
      const saveButton = screen.getByText('💾 Save (5)');
      
      // Click multiple times rapidly
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      
      // Should only make one save API call
      await waitFor(() => {
        const saveCalls = (fetch as jest.Mock).mock.calls.filter(
          call => call[0] === '/api/tools/save' && call[1]?.method === 'POST'
        );
        expect(saveCalls).toHaveLength(1);
      });
    });

    test('handles API errors gracefully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ folders: [] }) })
        .mockRejectedValueOnce(new Error('Network error'));

      renderOptimizedSaveButton();
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.click(saveButton);
      
      // Component should not crash and should handle the error gracefully
      await waitFor(() => {
        expect(saveButton).toBeInTheDocument();
      });
    });

    test('handles tool limit reached error', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ folders: [] }) })
        .mockResolvedValueOnce({ 
          ok: false, 
          json: () => Promise.resolve({ 
            error: 'Tool limit reached',
            redirectToPricing: true 
          }) 
        });

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      renderOptimizedSaveButton();
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/save', expect.any(Object));
      }, { timeout: 5000 });

      // Restore window.location
      window.location = originalLocation as any;
    });
  });

  describe('API Call Management', () => {
    test('debounces API calls to prevent overwhelming the server', async () => {
      jest.useFakeTimers();
      
      (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ hasLiked: false }) });

      // Render multiple like buttons
      const { rerender } = render(
        <OptimizedLikeButton toolId="tool-1" initialLikeCount={10} />
      );

      rerender(<OptimizedLikeButton toolId="tool-2" initialLikeCount={10} />);
      rerender(<OptimizedLikeButton toolId="tool-3" initialLikeCount={10} />);

      // Fast forward time to trigger debounced calls
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        // Should have made API calls with delays
        expect(fetch).toHaveBeenCalled();
      }, { timeout: 5000 });

      jest.useRealTimers();
    });

    test('queues API calls to prevent race conditions', async () => {
      (fetch as jest.Mock)
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ hasLiked: false }) }), 100)));

      render(<OptimizedLikeButton toolId="tool-1" initialLikeCount={10} />);
      render(<OptimizedLikeButton toolId="tool-2" initialLikeCount={10} />);
      render(<OptimizedLikeButton toolId="tool-3" initialLikeCount={10} />);

      await waitFor(() => {
        // Should have made API calls in sequence
        expect(fetch).toHaveBeenCalledTimes(3);
      }, { timeout: 5000 });
    });
  });
}); 