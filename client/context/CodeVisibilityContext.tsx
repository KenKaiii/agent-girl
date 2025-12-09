/**
 * CodeVisibilityContext - Provides global code visibility state
 * Allows code blocks throughout the app to respect the global show/hide toggle
 *
 * PERFORMANCE: Uses useMemo to prevent unnecessary re-renders of consumers
 */

import React, { createContext, useContext, useMemo } from 'react';

interface CodeVisibilityContextType {
  showCode: boolean;
}

const CodeVisibilityContext = createContext<CodeVisibilityContextType | undefined>(undefined);

export function CodeVisibilityProvider({
  children,
  showCode
}: {
  children: React.ReactNode;
  showCode: boolean;
}) {
  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ showCode }), [showCode]);

  return (
    <CodeVisibilityContext.Provider value={value}>
      {children}
    </CodeVisibilityContext.Provider>
  );
}

export function useCodeVisibility() {
  const context = useContext(CodeVisibilityContext);
  if (!context) {
    return { showCode: true };
  }
  return context;
}
