'use client';
import React from 'react';
import styled from 'styled-components';
import { useHistoryTracker } from '@/lib/useHistoryTracker';

interface VisitButtonProps {
  toolId: string;
  toolTitle: string;
  logoUrl: string;
  websiteUrl: string;
  className?: string;
  children?: React.ReactNode;
}

const VisitButton: React.FC<VisitButtonProps> = ({ 
  toolId, 
  toolTitle, 
  logoUrl, 
  websiteUrl, 
  className,
  children = "🌐 Visit"
}) => {
  const { trackToolVisit } = useHistoryTracker();

  const handleVisitClick = () => {
    // Track the tool visit in history
    console.log('Tracking tool visit:', { id: toolId, name: toolTitle, logo: logoUrl, url: websiteUrl });
    trackToolVisit({
      id: toolId,
      name: toolTitle,
      logo: logoUrl,
      url: websiteUrl
    });
    
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <StyledVisitButton 
      className={`action-btn visit-btn ${className || ''}`}
      onClick={handleVisitClick}
    >
      {children}
    </StyledVisitButton>
  );
};

const StyledVisitButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #ffffff;
  border-radius: 6px;
  background: #059669;
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
    background: #10B981;
    border-color: #10B981;
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

export default VisitButton; 