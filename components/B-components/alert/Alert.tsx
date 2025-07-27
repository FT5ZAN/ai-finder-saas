'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

export interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  style?: React.CSSProperties;
}

const Alert: React.FC<AlertProps> = ({ 
  message, 
  type = 'info', 
  duration = 3500,
  onClose,
  style
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const progressTimer = setInterval(() => {
      const currentTime = Date.now();
      const remaining = Math.max(0, endTime - currentTime);
      const newProgress = (remaining / duration) * 100;
      setProgress(newProgress);
      
      if (remaining <= 0) {
        clearInterval(progressTimer);
      }
    }, 16); // ~60fps

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [duration, onClose]);

  return (
    <AlertContainer $isVisible={isVisible} $type={type} style={style}>
      <ProgressBar $progress={progress} $type={type} />
      <AlertContent>
        <AlertIcon $type={type}>
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </AlertIcon>
        <AlertMessage>{message}</AlertMessage>
        <CloseButton onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}>
          ×
        </CloseButton>
      </AlertContent>
    </AlertContainer>
  );
};

const ProgressBar = styled.div.attrs<{ $progress: number; $type: string }>(props => ({
  style: {
    width: `${props.$progress}%`,
  },
}))<{ $progress: number; $type: string }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: ${props => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  }};
  border-radius: 0 0 8px 8px;
  transition: width 0.1s linear;
`;

const AlertContainer = styled.div<{ $isVisible: boolean; $type: string }>`
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  background: #ffffff;
  color: #000000;
  border: 2px solid ${props => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  }};
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: ${props => props.$isVisible ? 'translateX(0)' : 'translateX(100%)'};
  transition: all 0.3s ease-in-out;
`;

const AlertContent = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
`;

const AlertIcon = styled.div<{ $type: string }>`
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${props => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  }};
  color: #ffffff;
`;

const AlertMessage = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: #000000;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #000000;
  }
`;

export default Alert; 