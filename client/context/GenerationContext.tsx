/**
 * GenerationContext - Provides generation state to all components
 * Allows nested components like TaskTool to access isGenerating and onStop
 */

import React, { createContext, useContext } from 'react';

interface GenerationContextType {
  isGenerating: boolean;
  onStop: () => void;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({
  children,
  isGenerating,
  onStop,
}: {
  children: React.ReactNode;
  isGenerating: boolean;
  onStop: () => void;
}) {
  return (
    <GenerationContext.Provider value={{ isGenerating, onStop }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    // Return safe defaults if used outside provider
    return { isGenerating: false, onStop: () => {} };
  }
  return context;
}
