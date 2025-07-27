'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import Alert, { AlertProps } from './Alert';
import styled from 'styled-components';

interface AlertItem extends AlertProps {
  id: string;
}

interface AlertContextType {
  showAlert: (props: Omit<AlertProps, 'onClose'>) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: React.ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const showAlert = useCallback((props: Omit<AlertProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: AlertItem = {
      ...props,
      id,
      onClose: () => removeAlert(id)
    };
    
    setAlerts(prev => [...prev, newAlert]);
  }, [removeAlert]);

  const showSuccess = useCallback((message: string) => {
    showAlert({ message, type: 'success' });
  }, [showAlert]);

  const showError = useCallback((message: string) => {
    showAlert({ message, type: 'error' });
  }, [showAlert]);

  const showInfo = useCallback((message: string) => {
    showAlert({ message, type: 'info' });
  }, [showAlert]);

  const showWarning = useCallback((message: string) => {
    showAlert({ message, type: 'warning' });
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{
      showAlert,
      showSuccess,
      showError,
      showInfo,
      showWarning
    }}>
      {children}
      <AlertContainer>
        {alerts.map((alert, index) => (
          <Alert
            key={alert.id}
            {...alert}
            style={{
              bottom: `${20 + (index * 80)}px`
            }}
          />
        ))}
      </AlertContainer>
    </AlertContext.Provider>
  );
};

const AlertContainer = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
`;

export default AlertProvider; 