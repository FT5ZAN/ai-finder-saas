'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the client component with SSR disabled
const SavedToolsClientPage = dynamic(
  () => import('./SavedToolsClientPage'),
  {
    ssr: false
  }
);

const SavedToolsWrapper = () => {
  return (
    <Suspense fallback={null}>
      <SavedToolsClientPage />
    </Suspense>
  );
};

export default SavedToolsWrapper; 