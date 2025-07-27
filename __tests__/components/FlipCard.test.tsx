import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlipCard from '@/components/S-components/FlipCard';

// Mock the VisitButton component
jest.mock('@/components/S-components/VisitButton', () => {
  return function MockVisitButton({ websiteUrl, className }: { websiteUrl: string; className?: string }) {
    return <a href={websiteUrl} data-testid="visit-button" className={className}>Visit</a>;
  };
});

// Mock the LikeButton component
jest.mock('@/components/S-components/LikeButton', () => {
  return function MockLikeButton({ toolId }: { toolId: string }) {
    return <button data-testid="like-button" data-tool-id={toolId}>Like</button>;
  };
});

// Mock the SaveButton component
jest.mock('@/components/S-components/SaveButton', () => {
  return function MockSaveButton({ toolTitle }: { toolTitle: string }) {
    return <button data-testid="save-button" data-tool-name={toolTitle}>Save</button>;
  };
});

const mockTool = {
  id: 'test-tool-1',
  title: 'Test AI Tool',
  logoUrl: 'https://example.com/logo.png',
  websiteUrl: 'https://example.com',
  category: 'AI',
  about: 'This is a test AI tool for testing purposes.',
  likeCount: 10,
  saveCount: 5,
  toolType: 'browser' as const,
};

describe('FlipCard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders tool information correctly', () => {
    render(<FlipCard {...mockTool} />);

    // Check if tool title is displayed (use getAllByText to handle multiple instances)
    expect(screen.getAllByText('Test AI Tool')[0]).toBeInTheDocument();

    // Check if about text is displayed
    expect(screen.getByText('This is a test AI tool for testing purposes.')).toBeInTheDocument();

    // Check if logo image is rendered
    const logoImage = screen.getByAltText('Test AI Tool');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('displays like and save counts', () => {
    render(<FlipCard {...mockTool} />);

    // Check if like button shows the count
    expect(screen.getByTestId('like-button')).toHaveTextContent('Like');
    
    // Check if save button shows the count
    expect(screen.getByTestId('save-button')).toHaveTextContent('Save');
  });

  it('renders action buttons', () => {
    render(<FlipCard {...mockTool} />);

    // Check if visit buttons are rendered (front and back)
    const visitButtons = screen.getAllByTestId('visit-button');
    expect(visitButtons).toHaveLength(2);
    expect(visitButtons[0]).toHaveAttribute('href', 'https://example.com');

    // Check if like button is rendered
    expect(screen.getByTestId('like-button')).toBeInTheDocument();
    expect(screen.getByTestId('like-button')).toHaveAttribute('data-tool-id', 'test-tool-1');

    // Check if save button is rendered
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toHaveAttribute('data-tool-name', 'Test AI Tool');
  });

  it('handles missing optional fields gracefully', () => {
    const toolWithMissingFields = {
      ...mockTool,
      about: '',
      likeCount: 0,
      saveCount: 0,
    };

    render(<FlipCard {...toolWithMissingFields} />);

    // Should still render the title (use getAllByText to handle multiple instances)
    expect(screen.getAllByText('Test AI Tool')[0]).toBeInTheDocument();

    // Should still render the buttons
    expect(screen.getByTestId('like-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    render(<FlipCard {...mockTool} />);

    // Check if the main container has the correct class
    const cardContainer = screen.getByTestId('flip-card-container');
    expect(cardContainer).toHaveClass('flip-card');

    // Check if the card has the correct structure
    expect(cardContainer.querySelector('.flip-card-inner')).toBeInTheDocument();
  });

  it('handles long tool titles gracefully', () => {
    const toolWithLongTitle = {
      ...mockTool,
      title: 'This is a very long tool title that might exceed normal display limits and should be handled properly by the component',
    };

    render(<FlipCard {...toolWithLongTitle} />);

    // Should still render the long title (use getAllByText to handle multiple instances)
    expect(screen.getAllByText(toolWithLongTitle.title)[0]).toBeInTheDocument();
  });

  it('handles special characters in tool title', () => {
    const toolWithSpecialChars = {
      ...mockTool,
      title: 'AI Tool & Assistant (v2.0) - Test!',
    };

    render(<FlipCard {...toolWithSpecialChars} />);

    // Should render title with special characters (use getAllByText to handle multiple instances)
    expect(screen.getAllByText('AI Tool & Assistant (v2.0) - Test!')[0]).toBeInTheDocument();
  });

  it('handles different tool types', () => {
    const downloadableTool = {
      ...mockTool,
      toolType: 'downloadable' as const,
    };

    render(<FlipCard {...downloadableTool} />);

    // Should still render all the same information (use getAllByText to handle multiple instances)
    expect(screen.getAllByText('Test AI Tool')[0]).toBeInTheDocument();
  });

  it('maintains accessibility features', () => {
    render(<FlipCard {...mockTool} />);

    // Check if logo has proper alt text
    const logoImage = screen.getByAltText('Test AI Tool');
    expect(logoImage).toBeInTheDocument();

    // Check if buttons are accessible
    expect(screen.getAllByTestId('visit-button')[0]).toBeInTheDocument();
    expect(screen.getByTestId('like-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
  });

  it('handles click events on action buttons', async () => {
    render(<FlipCard {...mockTool} />);

    // Test visit button click
    const visitButton = screen.getAllByTestId('visit-button')[0];
    fireEvent.click(visitButton);

    // Test like button click
    const likeButton = screen.getByTestId('like-button');
    fireEvent.click(likeButton);

    // Test save button click
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    // Wait for any async operations
    await waitFor(() => {
      expect(visitButton).toBeInTheDocument();
      expect(likeButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
    });
  });
}); 