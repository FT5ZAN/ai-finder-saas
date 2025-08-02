'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import Loader from './Loader';

interface LoaderWrapperProps {
  children: React.ReactNode;
}

const LoaderWrapper = ({ children }: LoaderWrapperProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Show loader on every route change
    setIsLoading(true);
    
    // Show loader for a minimum time to ensure smooth experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show loader for 2 seconds minimum

    return () => clearTimeout(timer);
  }, [pathname]); // Re-trigger on pathname change

  if (isLoading) {
    return (
      <LoaderOverlay>
        <Loader />
      </LoaderOverlay>
    );
  }

  return <>{children}</>;
};

const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,rgb(0, 0, 0)rgb(0, 0, 0)293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
`;

export default LoaderWrapper; 