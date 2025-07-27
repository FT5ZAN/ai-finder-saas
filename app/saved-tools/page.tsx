import React from 'react';
import SavedToolsWrapper from '@/components/saved-tools/SavedToolsWrapper';

export default function SavedToolsPage() {
  return (
    <div className="saved-tools-page">
      {/* <div className="saved-tools-header">
         <div className="container">
          <h1 className="saved-tools-title">My Saved Tools</h1>
        <p className="saved-tools-subtitle">
            Access your favorite AI tools and organize them into custom folders for easy retrieval.
          </p> 
        </div> 
      </div> */}
      <div className="saved-tools-content">
        <div className="container">
          <SavedToolsWrapper />
        </div>
      </div>
    </div>
  );
} 