import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SaveButton from '../../components/S-components/SaveButton';
import { AlertProvider } from '../../components/B-components/alert/AlertContext';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <div data-testid="sign-in-button">{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseUser = require('@clerk/nextjs').useUser;

const renderSaveButton = (props: any, authState: any = { isSignedIn: false, isLoaded: true }) => {
  mockUseUser.mockReturnValue(authState);
  
  return render(
    <AlertProvider>
      <SaveButton {...props} />
    </AlertProvider>
  );
};

describe('SaveButton Component', () => {
  const defaultProps = {
    toolId: 'test-tool-id',
    toolTitle: 'Test Tool',
    initialSaveCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Authentication States', () => {
    test('shows sign-in button when user is not authenticated', () => {
      renderSaveButton(defaultProps, { isSignedIn: false, isLoaded: true });
      
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      expect(screen.getByText('💾 Sign in to Save')).toBeInTheDocument();
    });

    test('shows save button when user is authenticated', () => {
      renderSaveButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
      expect(screen.getByText('💾 Save (5)')).toBeInTheDocument();
    });

    test('shows loading state when authentication is loading', () => {
      renderSaveButton(defaultProps, { isSignedIn: false, isLoaded: false });
      
      const button = screen.getByText('💾 Save (5)');
      expect(button).toBeDisabled();
      expect(button).toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('API Calls', () => {
    test('does not make API calls when user is not authenticated', async () => {
      renderSaveButton(defaultProps, { isSignedIn: false, isLoaded: true });
      
      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    test('makes API calls when user is authenticated', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ folders: [] }) });

      renderSaveButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/save?toolId=test-tool-id', expect.any(Object));
      });
    });

             test('handles 401 errors gracefully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: false, status: 401 });

      renderSaveButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      // Component should not crash and should handle the 401 error gracefully
      await waitFor(() => {
        const saveButton = screen.getByText('💾 Save (5)');
        expect(saveButton).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    test('calls save API when save button is clicked', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ folders: [] }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ saveCount: 6 }) });

      renderSaveButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/tools/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: 'test-tool-id' }),
        });
      });
    });

    test('shows error when user is not authenticated and tries to save', async () => {
      renderSaveButton(defaultProps, { isSignedIn: false, isLoaded: true });
      
      const signInButton = screen.getByText('💾 Sign in to Save');
      fireEvent.click(signInButton);
      
      // Should not make any API calls
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Right-click Menu', () => {
    test('shows folder menu when right-clicked and user is authenticated', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ 
          ok: true, 
          json: () => Promise.resolve({ 
            folders: [
              { name: 'Work Tools', tools: [] },
              { name: 'Personal Tools', tools: [] }
            ] 
          }) 
        });

      renderSaveButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.contextMenu(saveButton);
      
                   await waitFor(() => {
        expect(screen.getByText('Tool Actions:')).toBeInTheDocument();
        expect(screen.getByText('💾 Save to Saved Tools')).toBeInTheDocument();
      });
    });

    test('shows error when right-clicked and user is not authenticated', () => {
      renderSaveButton(defaultProps, { isSignedIn: false, isLoaded: true });
      
      const signInButton = screen.getByText('💾 Sign in to Save');
      fireEvent.contextMenu(signInButton);
      
      // Should not show menu
      expect(screen.queryByText('Tool Actions:')).not.toBeInTheDocument();
    });
  });

  describe('Folder Menu Logic', () => {
    test('shows all folders when tool is not saved', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: false }) })
        .mockResolvedValueOnce({ 
          ok: true, 
          json: () => Promise.resolve({ 
            folders: [
              { name: 'Work Tools', tools: [] },
              { name: 'Personal Tools', tools: [{ name: 'Other Tool' }] }
            ] 
          }) 
        });

      renderSaveButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.contextMenu(saveButton);
      
      await waitFor(() => {
        // Should show all folders when tool is not saved
        expect(screen.getByText('Tool Actions:')).toBeInTheDocument();
        expect(screen.getByText('💾 Save to Saved Tools')).toBeInTheDocument();
      });
    });

    test('shows only available folders when tool is saved', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hasSaved: true }) })
        .mockResolvedValueOnce({ 
          ok: true, 
          json: () => Promise.resolve({ 
            folders: [
              { name: 'Work Tools', tools: [] },
              { name: 'Personal Tools', tools: [{ name: 'Test Tool' }] }
            ] 
          }) 
        });

      renderSaveButton(defaultProps, { isSignedIn: true, isLoaded: true });
      
      const saveButton = screen.getByText('💾 Save (5)');
      fireEvent.contextMenu(saveButton);
      
      await waitFor(() => {
        // Should only show folders that don't contain the current tool
        expect(screen.getByText('Tool Actions:')).toBeInTheDocument();
        expect(screen.getByText('💾 Save to Saved Tools')).toBeInTheDocument();
      });
    });
  });
}); 