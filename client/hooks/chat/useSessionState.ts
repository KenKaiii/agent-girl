/**
 * Agent Girl - Session state management hook
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import type { Message } from '../../components/message/types';
import type { Session } from '../useSessionAPI';
import type { SlashCommand } from '../useWebSocket';
import { toast } from '../../utils/toast';

interface UseSessionStateProps {
  sessionAPI: {
    fetchSessionsPaginated: (limit: number, reset: boolean) => Promise<{ sessions: Session[]; hasMore: boolean; total: number }>;
    fetchSessionMessages: (sessionId: string) => Promise<Array<{ id: string; type: 'user' | 'assistant'; content: string; timestamp: string }>>;
    deleteSession: (sessionId: string) => Promise<boolean>;
    renameSession: (chatId: string, newFolderName: string) => Promise<{ success: boolean; error?: string }>;
    updateWorkingDirectory: (sessionId: string, newDirectory: string) => Promise<{ success: boolean; error?: string }>;
  };
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsPlanMode: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentSessionMode: React.Dispatch<React.SetStateAction<'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build'>>;
  setAvailableCommands: React.Dispatch<React.SetStateAction<SlashCommand[]>>;
  setLiveTokenCount: React.Dispatch<React.SetStateAction<number>>;
  messageCache: React.MutableRefObject<Map<string, Message[]>>;
}

export function useSessionState({
  sessionAPI,
  setMessages,
  setIsPlanMode,
  setCurrentSessionMode,
  setAvailableCommands,
  setLiveTokenCount,
  messageCache,
}: UseSessionStateProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
  const [hasMoreSessions, setHasMoreSessions] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Navigation history for "back to recent" feature
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const navigationHistoryRef = useRef<string[]>([]);

  // Commands cache by working directory
  const commandsCache = useRef<Map<string, SlashCommand[]>>(new Map());

  // Per-session loading state helpers
  const isSessionLoading = (sessionId: string | null): boolean => {
    return sessionId ? loadingSessions.has(sessionId) : false;
  };

  const setSessionLoading = useCallback((sessionId: string, loading: boolean) => {
    setLoadingSessions(prev => {
      const next = new Set(prev);
      if (loading) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  }, []);

  // Lazy load commands using requestIdleCallback
  const loadCommandsLazy = useCallback((sessionId: string, workingDirectory?: string) => {
    // Check cache first
    if (workingDirectory && commandsCache.current.has(workingDirectory)) {
      setAvailableCommands(commandsCache.current.get(workingDirectory)!);
      return;
    }

    // Use requestIdleCallback to defer loading
    const loadCommands = async () => {
      try {
        const commandsRes = await fetch(`/api/sessions/${sessionId}/commands`);
        if (commandsRes.ok) {
          const commandsData = await commandsRes.json();
          const commands = commandsData.commands || [];
          setAvailableCommands(commands);
          // Cache by working directory
          if (workingDirectory) {
            commandsCache.current.set(workingDirectory, commands);
          }
        }
      } catch (error) {
        console.error('Failed to load slash commands:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      (window as typeof window & { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number })
        .requestIdleCallback(() => loadCommands(), { timeout: 2000 });
    } else {
      setTimeout(loadCommands, 100);
    }
  }, [setAvailableCommands]);

  // Load more sessions for infinite scroll
  const loadMoreSessions = useCallback(async () => {
    if (isLoadingMore || !hasMoreSessions) return;

    setIsLoadingMore(true);
    try {
      const result = await sessionAPI.fetchSessionsPaginated(30, false);
      if (result.sessions.length > 0) {
        // Deduplicate sessions by ID to prevent showing duplicates
        setSessions(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSessions = result.sessions.filter(s => !existingIds.has(s.id));
          return [...prev, ...newSessions];
        });
        setHasMoreSessions(result.hasMore);
      } else {
        setHasMoreSessions(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [sessionAPI, isLoadingMore, hasMoreSessions]);

  // Refresh sessions list (used after creating new session)
  const loadSessions = useCallback(async () => {
    const result = await sessionAPI.fetchSessionsPaginated(50, true);
    setSessions(result.sessions);
    setHasMoreSessions(result.hasMore);
    setTotalSessions(result.total);
  }, [sessionAPI]);

  // Handle session switching
  const handleSessionSelect = useCallback(async (sessionId: string) => {
    // IMPORTANT: Cache current session's messages BEFORE switching
    if (currentSessionId && messageCache.current.has(currentSessionId)) {
      const messages = messageCache.current.get(currentSessionId)!;
      console.log(`[Message Cache] Cached ${messages.length} messages for session ${currentSessionId}`);
    }

    // Track navigation history for "back to recent" feature
    if (currentSessionId && currentSessionId !== sessionId) {
      setNavigationHistory(prev => {
        const newHistory = prev.filter(id => id !== currentSessionId);
        newHistory.push(currentSessionId);
        // Keep only last 10 entries
        if (newHistory.length > 10) newHistory.shift();
        navigationHistoryRef.current = newHistory;
        return newHistory;
      });
    }

    setCurrentSessionId(sessionId);
    // Update URL to include session ID for persistence on refresh
    window.location.hash = sessionId;

    // Use sessions from state instead of fetching again - PERFORMANCE FIX
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setIsPlanMode(session.permission_mode === 'plan');
      setCurrentSessionMode(session.mode);
      console.log('🎭 Session mode loaded:', session.mode, 'for session:', sessionId);
    }

    // Load slash commands lazily (uses cache if same working directory)
    loadCommandsLazy(sessionId, session?.working_directory);

    // Check cache first before loading from database
    const cachedMessages = messageCache.current.get(sessionId);
    if (cachedMessages) {
      console.log(`[Message Cache] Restored ${cachedMessages.length} cached messages for session ${sessionId}`);
      setMessages(cachedMessages);
      return;
    }

    // Load messages from database
    const sessionMessages = await sessionAPI.fetchSessionMessages(sessionId);

    // Convert session messages to Message format
    const convertedMessages: Message[] = sessionMessages.map(msg => {
      if (msg.type === 'user') {
        return {
          id: msg.id,
          type: 'user' as const,
          content: msg.content,
          timestamp: msg.timestamp,
        };
      } else {
        // For assistant messages, try to parse content as JSON
        let content;
        try {
          // Try parsing as JSON (new format with full content blocks)
          const parsed = JSON.parse(msg.content);
          if (Array.isArray(parsed)) {
            content = parsed;
          } else {
            // If not an array, wrap as text block
            content = [{ type: 'text' as const, text: msg.content }];
          }
        } catch {
          // If parse fails, treat as plain text (legacy format)
          content = [{ type: 'text' as const, text: msg.content }];
        }

        return {
          id: msg.id,
          type: 'assistant' as const,
          content,
          timestamp: msg.timestamp,
        };
      }
    });

    setMessages(convertedMessages);
  }, [currentSessionId, sessions, messageCache, setMessages, setIsPlanMode, setCurrentSessionMode, sessionAPI, loadCommandsLazy]);

  // Handle new chat creation
  const handleNewChat = useCallback(() => {
    // Track current session in history before clearing
    if (currentSessionId) {
      setNavigationHistory(prev => {
        const newHistory = prev.filter(id => id !== currentSessionId);
        newHistory.push(currentSessionId);
        if (newHistory.length > 10) newHistory.shift();
        navigationHistoryRef.current = newHistory;
        return newHistory;
      });
    }

    // Use flushSync to ensure state updates happen immediately, preventing UI flicker
    flushSync(() => {
      setCurrentSessionId(null);
      setCurrentSessionMode('general');
      setMessages([]);
      setAvailableCommands([]);
      setLiveTokenCount(0);
    });
    // Clear URL hash to prevent loading old session
    window.location.hash = '';
    // Session will be created in handleSubmit when user sends first message
  }, [currentSessionId, setCurrentSessionMode, setMessages, setAvailableCommands, setLiveTokenCount]);

  // Navigate to previous chat in the list
  const handlePrevChat = useCallback(() => {
    if (sessions.length === 0) return;
    const currentIndex = sessions.findIndex(s => s.id === currentSessionId);
    if (currentIndex > 0) {
      handleSessionSelect(sessions[currentIndex - 1].id);
    } else if (currentIndex === -1 && sessions.length > 0) {
      // If no current session, go to first
      handleSessionSelect(sessions[0].id);
    }
  }, [sessions, currentSessionId, handleSessionSelect]);

  // Navigate to next chat in the list
  const handleNextChat = useCallback(() => {
    if (sessions.length === 0) return;
    const currentIndex = sessions.findIndex(s => s.id === currentSessionId);
    if (currentIndex >= 0 && currentIndex < sessions.length - 1) {
      handleSessionSelect(sessions[currentIndex + 1].id);
    } else if (currentIndex === -1 && sessions.length > 0) {
      // If no current session, go to first
      handleSessionSelect(sessions[0].id);
    }
  }, [sessions, currentSessionId, handleSessionSelect]);

  // Navigate back to the most recently viewed chat
  const handleBackToRecent = useCallback(() => {
    const history = navigationHistoryRef.current;
    if (history.length > 0) {
      const lastSessionId = history[history.length - 1];
      // Remove from history
      setNavigationHistory(prev => {
        const newHistory = prev.slice(0, -1);
        navigationHistoryRef.current = newHistory;
        return newHistory;
      });
      handleSessionSelect(lastSessionId);
    }
  }, [handleSessionSelect]);

  // Handle chat deletion
  const handleChatDelete = useCallback(async (chatId: string) => {
    const success = await sessionAPI.deleteSession(chatId);

    if (success) {
      // If deleting current session, clear messages and session
      if (chatId === currentSessionId) {
        setCurrentSessionId(null);
        setCurrentSessionMode('general');
        setMessages([]);
      }
      await loadSessions(); // Reload sessions to reflect deletion
    }
    // Error already shown by sessionAPI
  }, [sessionAPI, currentSessionId, setCurrentSessionMode, setMessages, loadSessions]);

  // Handle chat rename
  const handleChatRename = useCallback(async (chatId: string, newFolderName: string) => {
    const result = await sessionAPI.renameSession(chatId, newFolderName);

    if (result.success) {
      await loadSessions();
    } else {
      // Show error to user
      toast.error('Error', {
        description: result.error || 'Failed to rename folder'
      });
    }
  }, [sessionAPI, loadSessions]);

  // Handle working directory change
  const handleChangeDirectory = useCallback(async (sessionId: string, newDirectory: string) => {
    const result = await sessionAPI.updateWorkingDirectory(sessionId, newDirectory);

    if (result.success) {
      await loadSessions();

      // Invalidate cache for old directory and load commands for new one
      commandsCache.current.delete(newDirectory);
      loadCommandsLazy(sessionId, newDirectory);

      toast.success('Directory changed', {
        description: 'Context reset - conversation starts fresh'
      });
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to change working directory'
      });
    }
  }, [sessionAPI, loadSessions, loadCommandsLazy]);

  // Keyboard shortcuts effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Meta (Cmd on Mac) is pressed
      const isMeta = e.metaKey || e.ctrlKey;

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
  }, [handlePrevChat, handleNextChat]);

  return {
    // State
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    loadingSessions,
    hasMoreSessions,
    totalSessions,
    isLoadingMore,
    navigationHistory,
    navigationHistoryRef,

    // Helpers
    isSessionLoading,
    setSessionLoading,
    loadCommandsLazy,

    // Handlers
    loadMoreSessions,
    loadSessions,
    handleSessionSelect,
    handleNewChat,
    handlePrevChat,
    handleNextChat,
    handleBackToRecent,
    handleChatDelete,
    handleChatRename,
    handleChangeDirectory,
  };
}
