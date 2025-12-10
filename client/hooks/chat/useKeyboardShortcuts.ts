/**
 * Agent Girl - Keyboard shortcuts hook
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  handleNewChat: () => void;
  handlePrevChat: () => void;
  handleNextChat: () => void;
  navigationHistory: string[];
  setCurrentSessionId: (sessionId: string | null) => void;
  setShowCode: (show: boolean) => void;
  showCode: boolean;
  setDisplayMode: (mode: 'full' | 'compact') => void;
  displayMode: 'full' | 'compact';
  setShowSearchBar: (show: boolean | ((prev: boolean) => boolean)) => void;
  showSearchBar: boolean;
  setSearchQuery: (query: string) => void;
  setSearchMatches: (matches: number[]) => void;
  setCurrentMatchIndex: (index: number) => void;
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
}

export function useKeyboardShortcuts({
  handleNewChat,
  handlePrevChat,
  handleNextChat,
  navigationHistory,
  setCurrentSessionId,
  setShowCode,
  showCode,
  setDisplayMode,
  displayMode,
  setShowSearchBar,
  showSearchBar,
  setSearchQuery,
  setSearchMatches,
  setCurrentMatchIndex,
  setIsSidebarOpen,
  setShowKeyboardShortcuts,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Meta (Cmd on Mac) or Ctrl is pressed
      const isMeta = e.metaKey || e.ctrlKey;

      // ⌘ / - Show keyboard shortcuts
      if (isMeta && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }

      // ⌘ K - New chat
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }

      // ⌘ T - New chat tab (alias for new chat)
      if (isMeta && e.key === 't') {
        e.preventDefault();
        handleNewChat();
      }

      // ⌘ ← (Left arrow) - Navigate history
      if (isMeta && e.key === 'ArrowLeft') {
        e.preventDefault();
        // Navigate to previous session if available
        if (navigationHistory.length > 1) {
          const prevSessionId = navigationHistory[navigationHistory.length - 2];
          if (prevSessionId) setCurrentSessionId(prevSessionId);
        }
      }

      // ⌘ → (Right arrow) - Navigate forward (placeholder)
      if (isMeta && e.key === 'ArrowRight') {
        e.preventDefault();
        // Navigate to next session - would need additional state tracking
      }

      // ⌘ H - Go to home (clear current session)
      if (isMeta && e.key === 'h') {
        e.preventDefault();
        setCurrentSessionId(null);
      }

      // ⌘ E - Toggle code visibility
      if (isMeta && e.key === 'e') {
        e.preventDefault();
        setShowCode(!showCode);
      }

      // ⌘ Shift M - Toggle compact/full view
      if (isMeta && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setDisplayMode(displayMode === 'full' ? 'compact' : 'full');
      }

      // ⌘ O - Open file (placeholder for future)
      if (isMeta && e.key === 'o') {
        e.preventDefault();
        // This would be handled by a file dialog - placeholder for future
      }

      // ⌘ Shift O - Open chat folder (placeholder for future)
      if (isMeta && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        // This would open chat folder - placeholder for future
      }

      // ⌘ F - Search in chat
      if (isMeta && e.key === 'f') {
        e.preventDefault();
        setShowSearchBar(prev => !prev);
        if (!showSearchBar) {
          setSearchQuery('');
          setSearchMatches([]);
          setCurrentMatchIndex(0);
        }
      }

      // Escape - Close search bar
      if (e.key === 'Escape' && showSearchBar) {
        e.preventDefault();
        setShowSearchBar(false);
        setSearchQuery('');
        setSearchMatches([]);
      }

      // ⌘ B - Toggle sidebar
      if (isMeta && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }

      // ⌘ [ - Navigate to previous chat
      if (isMeta && e.key === '[') {
        e.preventDefault();
        handlePrevChat();
      }

      // ⌘ ] - Navigate to next chat
      if (isMeta && e.key === ']') {
        e.preventDefault();
        handleNextChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNewChat,
    handlePrevChat,
    handleNextChat,
    navigationHistory,
    setCurrentSessionId,
    setShowCode,
    showCode,
    setDisplayMode,
    displayMode,
    setShowSearchBar,
    showSearchBar,
    setSearchQuery,
    setSearchMatches,
    setCurrentMatchIndex,
    setIsSidebarOpen,
    setShowKeyboardShortcuts,
  ]);
}
