/**
 * Agent Girl - Session management handlers
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { flushSync } from 'react-dom';
import type { Message } from '../../message/types';
import type { Session } from '../../../hooks/useSessionAPI';
import type { SlashCommand } from '../../../hooks/useWebSocket';
import { toast } from '../../../utils/toast';

// SessionAPI is not exported, we need to use the return type of useSessionAPI
type SessionAPI = ReturnType<typeof import('../../../hooks/useSessionAPI').useSessionAPI>;

export interface SessionHandlers {
  handleNewChat: () => void;
  handleSessionSelect: (sessionId: string) => Promise<void>;
  handlePrevChat: () => void;
  handleNextChat: () => void;
  handleBackToRecent: () => void;
  handleChatDelete: (chatId: string) => Promise<void>;
  handleChatRename: (chatId: string, newFolderName: string) => Promise<void>;
  handleChangeDirectory: (sessionId: string, newDirectory: string) => Promise<void>;
}

export function createSessionHandlers({
  sessions,
  currentSessionId,
  setCurrentSessionId,
  setCurrentSessionMode,
  setMessages,
  setInputValue,
  setAvailableCommands,
  setLiveTokenCount,
  setNavigationHistory,
  navigationHistoryRef,
  messageCache,
  sessionAPI,
  loadCommandsLazy,
  loadSessions,
  setIsPlanMode,
  setSessions,
  commandsCache,
}: {
  sessions: Session[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  setCurrentSessionMode: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInputValue: (value: string) => void;
  setAvailableCommands: (commands: SlashCommand[]) => void;
  setLiveTokenCount: (count: number) => void;
  setNavigationHistory: React.Dispatch<React.SetStateAction<string[]>>;
  navigationHistoryRef: React.MutableRefObject<string[]>;
  messageCache: React.MutableRefObject<Map<string, Message[]>>;
  sessionAPI: SessionAPI;
  loadCommandsLazy: (sessionId: string, workingDirectory?: string) => void;
  loadSessions: () => Promise<void>;
  setIsPlanMode: (isPlanMode: boolean) => void;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  commandsCache: React.MutableRefObject<Map<string, SlashCommand[]>>;
}): SessionHandlers {
  const handleNewChat = () => {
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
      setInputValue('');
      setAvailableCommands([]);
      setLiveTokenCount(0);
    });
    // Clear URL hash to prevent loading old session
    window.location.hash = '';
    // Session will be created in handleSubmit when user sends first message
  };

  const handleSessionSelect = async (sessionId: string) => {
    // IMPORTANT: Cache current session's messages BEFORE switching
    if (currentSessionId && typeof setMessages === 'function') {
      // Get current messages through a temporary ref
      let currentMessages: Message[] = [];
      setMessages(prev => {
        currentMessages = prev;
        return prev;
      });

      if (currentMessages.length > 0) {
        messageCache.current.set(currentSessionId, currentMessages);
        console.log(`[Message Cache] Cached ${currentMessages.length} messages for session ${currentSessionId}`);
      }
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
    const convertedMessages: Message[] = sessionMessages.map((msg: any) => {
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
  };

  const handlePrevChat = () => {
    if (sessions.length === 0) return;
    const currentIndex = sessions.findIndex(s => s.id === currentSessionId);
    if (currentIndex > 0) {
      handleSessionSelect(sessions[currentIndex - 1].id);
    } else if (currentIndex === -1 && sessions.length > 0) {
      // If no current session, go to first
      handleSessionSelect(sessions[0].id);
    }
  };

  const handleNextChat = () => {
    if (sessions.length === 0) return;
    const currentIndex = sessions.findIndex(s => s.id === currentSessionId);
    if (currentIndex >= 0 && currentIndex < sessions.length - 1) {
      handleSessionSelect(sessions[currentIndex + 1].id);
    } else if (currentIndex === -1 && sessions.length > 0) {
      // If no current session, go to first
      handleSessionSelect(sessions[0].id);
    }
  };

  const handleBackToRecent = () => {
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
  };

  const handleChatDelete = async (chatId: string) => {
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
  };

  const handleChatRename = async (chatId: string, newFolderName: string) => {
    const result = await sessionAPI.renameSession(chatId, newFolderName);

    if (result.success) {
      await loadSessions();
    } else {
      // Show error to user
      toast.error('Error', {
        description: result.error || 'Failed to rename folder'
      });
    }
  };

  const handleChangeDirectory = async (sessionId: string, newDirectory: string) => {
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
  };

  return {
    handleNewChat,
    handleSessionSelect,
    handlePrevChat,
    handleNextChat,
    handleBackToRecent,
    handleChatDelete,
    handleChatRename,
    handleChangeDirectory,
  };
}
