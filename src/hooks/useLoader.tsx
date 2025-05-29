'use client';

import FullPageLoader from '@/components/FullPageLoader';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoaderContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
};

interface LoaderProviderProps {
  children: ReactNode;
}

export const LoaderProvider: React.FC<LoaderProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>('Please wait...');

  const showLoader = (msg?: string) => {
    setMessage(msg);
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      {loading && <FullPageLoader message={message} />}
    </LoaderContext.Provider>
  );
};
