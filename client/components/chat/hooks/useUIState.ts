/**
 * Agent Girl - UI state management hook
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useEffect } from 'react';

export function useUIState() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Restore sidebar state from localStorage
    const saved = localStorage.getItem('agent-girl-sidebar-open');
    return saved === 'true';
  });

  const [displayMode, setDisplayMode] = useState<'full' | 'compact'>('full');
  const [showCode, setShowCode] = useState(true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isBuildWizardOpen, setIsBuildWizardOpen] = useState(false);
  const [buildMode, setBuildMode] = useState<'launcher' | 'wizard'>('launcher');
  const [commandQueue, setCommandQueue] = useState<Array<{
    id: string;
    content: string;
    status: 'pending' | 'running' | 'completed';
  }>>([]);
  const [isWorkingDirPanelCollapsed, setIsWorkingDirPanelCollapsed] = useState(true);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('agent-girl-sidebar-open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Keyboard shortcuts for UI actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Meta (Cmd on Mac) is pressed
      const isMeta = e.metaKey || e.ctrlKey;

      // ⌘ / - Show keyboard shortcuts
      if (isMeta && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }

      // ⌘ E - Toggle code visibility
      if (isMeta && e.key === 'e') {
        e.preventDefault();
        setShowCode(prev => !prev);
      }

      // ⌘ Shift M - Toggle compact/full view
      if (isMeta && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setDisplayMode(prev => prev === 'full' ? 'compact' : 'full');
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchBar]);

  return {
    // State
    isSidebarOpen,
    setIsSidebarOpen,
    displayMode,
    setDisplayMode,
    showCode,
    setShowCode,
    showKeyboardShortcuts,
    setShowKeyboardShortcuts,
    showSearchBar,
    setShowSearchBar,
    searchQuery,
    setSearchQuery,
    searchMatches,
    setSearchMatches,
    currentMatchIndex,
    setCurrentMatchIndex,
    isBuildWizardOpen,
    setIsBuildWizardOpen,
    buildMode,
    setBuildMode,
    commandQueue,
    setCommandQueue,
    isWorkingDirPanelCollapsed,
    setIsWorkingDirPanelCollapsed,
  };
}
