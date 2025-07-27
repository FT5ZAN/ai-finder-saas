'use client';
import React, { useState } from 'react';
import styled from 'styled-components';

interface AboutButtonProps {
  toolTitle: string;
  about?: string;
  className?: string;
}

const AboutButton: React.FC<AboutButtonProps> = ({ toolTitle, about, className }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleAboutClick = () => {
    setIsVisible(!isVisible);
  };

  const handleBackClick = () => {
    setIsVisible(false);
  };

  return (
    <>
      <StyledAboutButton 
        className={`action-btn about-btn ${className || ''}`}
        onClick={handleAboutClick}
      >
        ℹ️ About
      </StyledAboutButton>
      
      {isVisible && (
        <AboutOverlay onClick={handleBackClick}>
          <div className="about-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="tool-title">{toolTitle}</h3>
            <p className="tool-description">
              {about || 'No description available for this tool.'}
            </p>
            <button 
              className="action-btn back-btn"
              onClick={handleBackClick}
            >
              ← Back
            </button>
          </div>
        </AboutOverlay>
      )}
    </>
  );
};

const StyledAboutButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #ffffff;
  border-radius: 6px;
  background: #1E3A8A;
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
    background: #2563EB;
    border-color: #2563EB;
    transform: translateY(-1px);
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

const AboutOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .about-content {
    background: rgb(7, 7, 7);
    border: 1px solid rgb(254, 253, 253);
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .tool-title {
    margin: 0 0 16px 0;
    font-size: 20px;
    color: rgb(255, 255, 255);
    font-weight: bold;
  }

  .tool-description {
    margin: 0 0 20px 0;
    font-size: 16px;
    color: rgb(255, 255, 255);
    line-height: 1.6;
  }

  .back-btn {
    padding: 8px 16px;
    border: 1px solid #ffffff;
    border-radius: 6px;
    background: #374151;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;

    &:hover {
      background: #4B5563;
    }
  }
`;

export default AboutButton; 