'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { TabProvider } from '@/context/TabContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TabProvider>
        {children}
      </TabProvider>
    </AuthProvider>
  );
}
