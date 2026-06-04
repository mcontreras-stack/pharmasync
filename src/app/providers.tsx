'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { TabProvider } from '@/context/TabContext';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import VirtualMailbox from '@/components/layout/VirtualMailbox';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TabProvider>
          {children}
          <VirtualMailbox />
        </TabProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
