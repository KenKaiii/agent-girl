/**
 * GenerationContext - Provides generation state to all components
 * Allows nested components like TaskTool to access isGenerating and onStop
 *
 * PERFORMANCE: Uses useMemo to prevent unnecessary re-renders of consumers
 */

import React, { createContext, useContext, useMemo } from 'react';

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
  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  // Only creates new object when isGenerating or onStop actually change
  const value = useMemo(
    () => ({ isGenerating, onStop }),
    [isGenerating, onStop]
  );

  return (
    <GenerationContext.Provider value={value}>
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
