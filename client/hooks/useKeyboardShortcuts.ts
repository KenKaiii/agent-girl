/**
 * Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts for Agent-Girl DevTools and features.
 * Handles Cmd/Ctrl+K patterns for quick access to features.
 */

import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
  // DevTools
  onToggleDevTools?: () => void;
  onToggleGitPanel?: () => void;
  onToggleDeployPanel?: () => void;

  // Features
  onOpenComponentGenerator?: () => void;
  onOpenTemplateWizard?: () => void;

  // Help
  onShowShortcuts?: () => void;

  // Navigation
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
}

interface KeyboardShortcutsOptions {
  enabled?: boolean;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  options: KeyboardShortcutsOptions = {}
): void {
  const { enabled = true } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Skip if user is typing in an input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow some shortcuts even in input
      if (event.key !== 'Escape') {
        return;
      }
    }

    const modKey = isMac ? event.metaKey : event.ctrlKey;

    // Cmd/Ctrl + Shift combinations
    if (modKey && event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case 'd':
          // Cmd+Shift+D: Toggle DevTools
          event.preventDefault();
          handlers.onToggleDevTools?.();
          break;
        case 'g':
          // Cmd+Shift+G: Toggle Git Panel
          event.preventDefault();
          handlers.onToggleGitPanel?.();
          break;
        case 'p':
          // Cmd+Shift+P: Toggle Deploy Panel
          event.preventDefault();
          handlers.onToggleDeployPanel?.();
          break;
        case 'c':
          // Cmd+Shift+C: Open Component Generator
          event.preventDefault();
          handlers.onOpenComponentGenerator?.();
          break;
        case 't':
          // Cmd+Shift+T: Open Template Wizard
          event.preventDefault();
          handlers.onOpenTemplateWizard?.();
          break;
      }
      return;
    }

    // Cmd/Ctrl combinations (no shift)
    if (modKey && !event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case '/':
        case '?':
          // Cmd+/: Show Shortcuts
          event.preventDefault();
          handlers.onShowShortcuts?.();
          break;
        case 'k':
          // Cmd+K: New Chat (standard)
          event.preventDefault();
          handlers.onNewChat?.();
          break;
        case 'b':
          // Cmd+B: Toggle Sidebar
          event.preventDefault();
          handlers.onToggleSidebar?.();
          break;
        case 'f':
          // Cmd+F: Search
          event.preventDefault();
          handlers.onSearch?.();
          break;
      }
      return;
    }

    // No modifier keys
    switch (event.key) {
      case 'Escape':
        // Close any open panels
        handlers.onToggleDevTools?.();
        break;
    }
  }, [enabled, handlers]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

// Shortcut definitions for display
export const SHORTCUTS_CONFIG = {
  devTools: [
    { keys: ['⌘', 'Shift', 'D'], description: 'DevTools öffnen/schließen' },
    { keys: ['⌘', 'Shift', 'G'], description: 'Git Panel' },
    { keys: ['⌘', 'Shift', 'P'], description: 'Deploy Panel' },
  ],
  features: [
    { keys: ['⌘', 'Shift', 'C'], description: 'Component Generator' },
    { keys: ['⌘', 'Shift', 'T'], description: 'Template Wizard' },
  ],
  navigation: [
    { keys: ['⌘', 'K'], description: 'Neuer Chat' },
    { keys: ['⌘', 'B'], description: 'Sidebar ein/ausblenden' },
    { keys: ['⌘', 'F'], description: 'Suche' },
    { keys: ['⌘', '/'], description: 'Shortcuts anzeigen' },
  ],
  general: [
    { keys: ['Esc'], description: 'Panel schließen' },
  ],
};

export default useKeyboardShortcuts;
