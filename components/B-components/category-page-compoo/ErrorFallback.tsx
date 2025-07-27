'use client';

import React from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem',
      color: '#fff',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      margin: '1rem auto',
      maxWidth: '600px'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#ff6b6b' }}>
        Something went wrong
      </h3>
      <p style={{ marginBottom: '1rem', color: '#ccc' }}>
        {error?.message || 'An unexpected error occurred while loading the tools.'}
      </p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorFallback; 