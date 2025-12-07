"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      {children}
    </AuthProvider>
  );
} 