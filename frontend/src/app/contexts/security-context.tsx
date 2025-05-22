'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SecurityContextType {
  securityDataVersion: number;
  refreshSecurityData: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  // This counter is incremented whenever security data needs to be refreshed
  const [securityDataVersion, setSecurityDataVersion] = useState(0);

  // Function to trigger a refresh of security data
  const refreshSecurityData = () => {
    setSecurityDataVersion(prev => prev + 1);
  };

  return (
    <SecurityContext.Provider value={{ securityDataVersion, refreshSecurityData }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}
