/**
 * CodeVisibilityContext - Provides global code visibility state
 * Allows code blocks throughout the app to respect the global show/hide toggle
 */

import React, { createContext, useContext } from 'react';

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
  return (
    <CodeVisibilityContext.Provider value={{ showCode }}>
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
