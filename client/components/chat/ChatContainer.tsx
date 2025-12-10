/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { NewChatWelcome } from './NewChatWelcome';
import { Sidebar, useSidebarWidth } from '../sidebar/Sidebar';
import { ScrollButton } from './ScrollButton';
import { AutonomProgressTracker } from './AutonomProgressTracker';
import { ChatModals } from './ChatModals';
import { ChatInputSection } from './ChatInputSection';
import type { Question } from '../question/QuestionModal';
import type { Template } from '../preview/BuildLauncher';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WorkingDirectoryContext } from '../../hooks/useWorkingDirectory';
import { GenerationProvider } from '../../context/GenerationContext';
import { useSessionAPI, type Session } from '../../hooks/useSessionAPI';
import { useResponsive } from '../../hooks/useResponsive';
import type { Message } from '../message/types';
import type { SelectedElement } from '../preview/ElementSelector';
import { toast } from '../../utils/toast';
import { showError } from '../../utils/errorMessages';
import type { BackgroundProcess } from '../process/BackgroundProcessMonitor';
import type { SlashCommand } from '../../hooks/useWebSocket';
import { useMessageQueue } from '../../hooks/useMessageQueue';

// Import refactored types and hooks
import type { AIEditRequest, AIProgressState, ActionHistoryEntry, AutonomProgressData, ChatContainerProps } from './types';
import { useWebSocketMessageHandler, useKeyboardShortcuts, FILE_EDIT_TOOLS, getToolDisplayName, useBuildHandlers } from './hooks';
import { createSessionHandlers } from './sessionHandlers';

// Re-export types for backwards compatibility
export type { AIEditRequest, AIProgressState, ActionHistoryEntry };

export function ChatContainer({
  layoutMode = 'chat-only',
  onLayoutModeChange,
  previewUrl,
  onSetPreviewUrl: _onSetPreviewUrl,
  onDetectPreviewUrl,
  onAIEditRequestHandler,
  onAIProgressChange,
  onInputValueSetter,
  selectedElements = [],
  onClearSelection,
  onBuildPreviewStart,
}: ChatContainerProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState(() => {
    // Restore draft text from localStorage on mount
    const saved = localStorage.getItem('agent-girl-draft-text');
    return saved || '';
  });
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Restore sidebar state from localStorage
    const saved = localStorage.getItem('agent-girl-sidebar-open');
    return saved === 'true';
  });

  // Navigation history for "back to recent" feature
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const navigationHistoryRef = useRef<string[]>([]);

  // Ref for scroll container in MessageList
  const scrollContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Session management
  const [sessions, setSessions] = useState<Session[]>([]);
  const sessionsRef = useRef<Session[]>([]); // Ref to avoid effect dependencies
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null); // Ref for keyboard nav
  const [_isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [currentSessionMode, setCurrentSessionMode] = useState<'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build'>('general');

  // Keep refs in sync with state
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);

  // Pagination state for lazy loading
  const [hasMoreSessions, setHasMoreSessions] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Slash commands available for current session
  const [availableCommands, setAvailableCommands] = useState<SlashCommand[]>([]);

  // Commands cache by working directory (commands are dir-specific)
  const commandsCache = useRef<Map<string, SlashCommand[]>>(new Map());

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
  }, []);

  // Queue management (currently unused - hidden UI)
  useMessageQueue();

  // Display mode for compact/full message rendering
  const [displayMode, setDisplayMode] = useState<'full' | 'compact'>('full');

  // Activity progress state for progress bar
  const [activityProgress, setActivityProgress] = useState<AIProgressState>({
    isActive: false,
    status: 'idle',
  });

  // AUTONOM progress tracker state
  interface AutonomProgressData {
    stepNumber: number;
    maxSteps: number;
    budgetUsed: number;
    budgetRemaining: string;
    tokensRemaining: number;
    totalCost: string;
    maxCost: number;
    stepsCompleted: string[];
    selectedModel?: string;
    errorCount?: number;
    problematicSteps?: string[];
  }
  const [autonomProgress, setAutonomProgress] = useState<AutonomProgressData | null>(null);

  // Handler to update activity progress (wraps both local state and prop callback)
  const handleActivityProgress = useCallback((progress: AIProgressState) => {
    setActivityProgress(progress);
    if (onAIProgressChange) {
      onAIProgressChange(progress);
    }
  }, [onAIProgressChange]);

  // Global code visibility toggle
  const [showCode, setShowCode] = useState(true);

  // Live token count during streaming (for loading indicator)
  const [liveTokenCount, setLiveTokenCount] = useState(0);

  // Context usage tracking (per-session)
  const [contextUsage, setContextUsage] = useState<Map<string, {
    inputTokens: number;
    contextWindow: number;
    contextPercentage: number;
  }>>(new Map());

  // Message cache to preserve streaming state across session switches
  const messageCache = useRef<Map<string, Message[]>>(new Map());

  // Initialization guard to prevent re-running init effect after handleNewChat
  const hasInitialized = useRef(false);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('agent-girl-sidebar-open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Persist draft text to localStorage with debouncing
  // OPTIMIZED: Debounce localStorage writes to avoid blocking on every keystroke
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending write
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }

    // Debounce the localStorage write by 500ms
    draftTimeoutRef.current = setTimeout(() => {
      if (inputValue) {
        localStorage.setItem('agent-girl-draft-text', inputValue);
      } else {
        localStorage.removeItem('agent-girl-draft-text');
      }
    }, 500);

    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, [inputValue]);

  // Automatically cache messages as they update during streaming
  // IMPORTANT: Only depend on messages, NOT currentSessionId
  // (otherwise it fires when session changes with old messages)
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      messageCache.current.set(currentSessionId, messages);
    }
  }, [messages]);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('agent-boy-model') || 'sonnet';
  });

  // Permission mode (simplified to just plan mode on/off)
  const [isPlanMode, setIsPlanMode] = useState<boolean>(false);
  const [isAutonomMode, setIsAutonomMode] = useState<boolean>(false);

  // Plan approval
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  // Question modal state
  const [pendingQuestion, setPendingQuestion] = useState<{
    toolId: string;
    questions: Question[];
  } | null>(null);

  // Background processes (per-session)
  const [backgroundProcesses, setBackgroundProcesses] = useState<Map<string, BackgroundProcess[]>>(new Map());

  // Track active long-running command by bashId for updates
  const activeLongRunningCommandRef = useRef<string | null>(null);

  // Build wizard state
  const [isBuildWizardOpen, setIsBuildWizardOpen] = useState(false);
  const [buildMode, setBuildMode] = useState<'launcher' | 'wizard'>('launcher');

  // Prompt library state
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

  // Command queue state
  const [commandQueue, setCommandQueue] = useState<Array<{ id: string; content: string; status: 'pending' | 'running' | 'completed' }>>(
    []
  );

  // Keyboard shortcuts modal state
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // In-chat search state
  const [showSearchBar, setShowSearchBar] = useState(false);
  const showSearchBarRef = useRef(false); // Ref to avoid effect dependency
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Keep ref in sync with state
  useEffect(() => {
    showSearchBarRef.current = showSearchBar;
  }, [showSearchBar]);

  // Working directory panel state
  const [isWorkingDirPanelCollapsed, setIsWorkingDirPanelCollapsed] = useState(true);

  // Projects panel state
  const [isProjectsPanelCollapsed, setIsProjectsPanelCollapsed] = useState(true);

  const sessionAPI = useSessionAPI();

  // Responsive hooks
  const { isMobile, isTablet: _isTablet } = useResponsive();
  const sidebarWidth = useSidebarWidth(isSidebarOpen);

  // Per-session loading state helpers - memoized to prevent re-renders
  const isSessionLoading = useCallback((sessionId: string | null): boolean => {
    return sessionId ? loadingSessions.has(sessionId) : false;
  }, [loadingSessions]);

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

  // Check if ANY session is loading (global loading state for input disabling)
  const isAnySessionLoading = loadingSessions.size > 0;
  const isLoading = isAnySessionLoading;

  // Check if CURRENT session is loading (for typing indicator)
  const isCurrentSessionLoading = currentSessionId ? loadingSessions.has(currentSessionId) : false;

  // Memoize sidebar chats - only recompute when sessions or currentSessionId changes
  // loadingSessions is handled separately in Sidebar component to avoid re-mapping
  const sidebarChats = useMemo(() => sessions.map(session => {
    const folderName = session.working_directory?.split('/').filter(Boolean).pop() || session.title;
    return {
      id: session.id,
      title: folderName,
      timestamp: new Date(session.updated_at),
      isActive: session.id === currentSessionId,
      workingDirectory: session.working_directory,
    };
  }), [sessions, currentSessionId]);

  // Memoize current session lookup - used multiple times in JSX
  const currentSession = useMemo(() =>
    sessions.find(s => s.id === currentSessionId),
    [sessions, currentSessionId]
  );
  const currentWorkingDirectory = currentSession?.working_directory || null;

  // Simple handlers - memoized to prevent child re-renders
  const handleSidebarToggle = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const handleToggleCompact = useCallback(() => setDisplayMode(prev => prev === 'compact' ? 'full' : 'compact'), []);
  const handleToggleCode = useCallback(() => setShowCode(prev => !prev), []);
  const handleNewChatTab = useCallback(() => window.open(window.location.origin, '_blank'), []);

  // Prompt library handlers
  const handleOpenPromptLibrary = useCallback(() => setIsPromptLibraryOpen(true), []);
  const handleClosePromptLibrary = useCallback(() => setIsPromptLibraryOpen(false), []);

  // Handle prompt selection from library
  const handleSelectPrompt = useCallback((prompt: string, useAutonom?: boolean) => {
    setInputValue(prompt);
    setIsPromptLibraryOpen(false);
    // If autonom mode is recommended and not already active, toggle it
    if (useAutonom && !isAutonomMode) {
      setIsAutonomMode(true);
    }
  }, [isAutonomMode]);

  // Handle prompt editing (just put in input)
  const handleEditPrompt = useCallback((prompt: string) => {
    setInputValue(prompt);
    setIsPromptLibraryOpen(false);
  }, []);

  // Navigation handlers - use refs to avoid dependency on handleSessionSelect/sessions
  const handleSidebarPreviousChat = useCallback(() => {
    if (navigationHistoryRef.current.length > 0) {
      const previousId = navigationHistoryRef.current.pop();
      if (previousId) {
        // Inline session select logic to avoid dependency
        setCurrentSessionId(previousId);
        window.location.hash = previousId;
      }
    }
  }, []);

  const handleSidebarBackToRecent = useCallback(() => {
    if (navigationHistoryRef.current.length > 0) {
      navigationHistoryRef.current = [];
      const firstSession = sessionsRef.current[0];
      if (firstSession) {
        setCurrentSessionId(firstSession.id);
        window.location.hash = firstSession.id;
      }
    }
  }, []);

  // Save model selection to localStorage
  // Supports mid-chat model switching with context handoff - memoized with functional update
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(prev => {
      localStorage.setItem('agent-boy-model', modelId);

      // If switching mid-chat, notify user and prepare context handoff
      // Use messageCache to check if we have messages (avoids messages dependency)
      const hasMessages = messageCache.current.get(currentSessionIdRef.current || '') !== undefined ||
                         (currentSessionIdRef.current && messageCache.current.size > 0);
      if (hasMessages && prev !== modelId) {
        const modelNames: Record<string, string> = {
          'opus': 'Claude Opus 4.5',
          'sonnet': 'Claude Sonnet 4.5',
          'haiku': 'Claude Haiku 4.5',
          'glm-4.6': 'GLM 4.6',
          'kimi-k2-thinking': 'Kimi K2 Thinking',
          'kimi-k2-thinking-turbo': 'Kimi K2 Turbo',
        };
        const newModelName = modelNames[modelId] || modelId;
        toast.info(`Model gewechselt zu ${newModelName}. Der nächste Prompt erhält einen Kontext-Überblick.`);
      }
      return modelId;
    });
  }, []);

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

  // Load sessions on mount and restore from URL
  useEffect(() => {
    // Only initialize once - prevent re-running after handleNewChat
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeApp = async () => {
      setIsLoadingSessions(true);

      // Use paginated loading - load initial batch of 25 sessions for fast first paint
      const result = await sessionAPI.fetchSessionsPaginated(25, true);
      const loadedSessions = result.sessions;
      setSessions(loadedSessions);
      setHasMoreSessions(result.hasMore);
      setTotalSessions(result.total);

      // Show UI immediately
      setIsLoadingSessions(false);

      // Defer context usage initialization to avoid blocking first paint
      const buildContextUsage = () => {
        const newContextUsage = new Map<string, {
          inputTokens: number;
          contextWindow: number;
          contextPercentage: number;
        }>();

        loadedSessions.forEach(session => {
          if (session.context_input_tokens && session.context_window && session.context_percentage !== undefined) {
            newContextUsage.set(session.id, {
              inputTokens: session.context_input_tokens,
              contextWindow: session.context_window,
              contextPercentage: session.context_percentage,
            });
          }
        });

        setContextUsage(newContextUsage);
      };

      // Use requestIdleCallback to defer non-critical work
      if ('requestIdleCallback' in window) {
        (window as typeof window & { requestIdleCallback: (cb: IdleRequestCallback) => number })
          .requestIdleCallback(buildContextUsage);
      } else {
        setTimeout(buildContextUsage, 0);
      }

      // Restore session from URL hash (#session-id-here or #uuid-here)
      let hashSessionId = window.location.hash.slice(1); // Remove '#'

      // Support both formats: "session-uuid" and plain "uuid"
      if (hashSessionId.startsWith('session-')) {
        hashSessionId = hashSessionId.slice(8); // Remove 'session-' prefix
      }

      if (hashSessionId) {
        console.log(`📍 Restoring session from URL: ${hashSessionId}`);

        // Load session details
        const session = loadedSessions.find(s => s.id === hashSessionId);
        if (session) {
          setCurrentSessionId(hashSessionId);
          setIsPlanMode(session.permission_mode === 'plan');
          setCurrentSessionMode(session.mode);

          // Load slash commands lazily (deferred to avoid blocking)
          loadCommandsLazy(hashSessionId, session.working_directory);

          // Load messages from database
          const sessionMessages = await sessionAPI.fetchSessionMessages(hashSessionId);

          // Convert session messages to Message format
          const convertedMessages = sessionMessages.map(msg => {
            if (msg.type === 'user') {
              return {
                id: msg.id,
                type: 'user' as const,
                content: msg.content,
                timestamp: msg.timestamp,
              };
            } else {
              let content;
              try {
                const parsed = JSON.parse(msg.content);
                if (Array.isArray(parsed)) {
                  content = parsed;
                } else {
                  content = [{ type: 'text' as const, text: msg.content }];
                }
              } catch {
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
          messageCache.current.set(hashSessionId, convertedMessages);
          console.log(`✅ Restored ${convertedMessages.length} messages from session`);
        }
      }
    };

    initializeApp();
  }, [sessionAPI, loadCommandsLazy]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Meta (Cmd on Mac) is pressed
      const isMeta = e.metaKey || e.ctrlKey;

      // ⌘ / - Show keyboard shortcuts
      if (isMeta && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }

      // ⌘ K - New chat (inline to avoid dependency)
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        // Track current session before clearing
        if (currentSessionIdRef.current) {
          setNavigationHistory(prev => {
            const newHistory = prev.filter(id => id !== currentSessionIdRef.current);
            newHistory.push(currentSessionIdRef.current!);
            if (newHistory.length > 10) newHistory.shift();
            navigationHistoryRef.current = newHistory;
            return newHistory;
          });
        }
        setCurrentSessionId(null);
        setCurrentSessionMode('general');
        setMessages([]);
        setInputValue('');
        setAvailableCommands([]);
        setLiveTokenCount(0);
        window.location.hash = '';
      }

      // ⌘ T - New chat tab (opens in new browser tab)
      if (isMeta && e.key === 't') {
        e.preventDefault();
        window.open(window.location.origin, '_blank');
      }

      // ⌘ ← (Left arrow) - Navigate history (placeholder)
      if (isMeta && e.key === 'ArrowLeft') {
        e.preventDefault();
        // Navigate to previous session if available - use ref to avoid dependency
        if (navigationHistoryRef.current.length > 1) {
          const prevSessionId = navigationHistoryRef.current[navigationHistoryRef.current.length - 2];
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

      // ⌘ E - Toggle code visibility (functional update to avoid dependency)
      if (isMeta && e.key === 'e') {
        e.preventDefault();
        setShowCode(prev => !prev);
      }

      // ⌘ Shift M - Toggle compact/full view (functional update)
      if (isMeta && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setDisplayMode(prev => prev === 'full' ? 'compact' : 'full');
      }

      // ⌘ O - Open file
      if (isMeta && e.key === 'o') {
        e.preventDefault();
        // This would be handled by a file dialog - placeholder for future
      }

      // ⌘ Shift O - Open chat folder
      if (isMeta && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        // This would open chat folder - placeholder for future
      }

      // ⌘ F - Search in chat
      if (isMeta && e.key === 'f') {
        e.preventDefault();
        setShowSearchBar(prev => !prev);
        // Use ref to check previous state (functional update handles toggle)
        if (!showSearchBarRef.current) {
          setSearchQuery('');
          setSearchMatches([]);
          setCurrentMatchIndex(0);
        }
      }

      // Escape - Close search bar (use ref to avoid dependency)
      if (e.key === 'Escape' && showSearchBarRef.current) {
        e.preventDefault();
        setShowSearchBar(false);
        setSearchQuery('');
        setSearchMatches([]);
      }

      // ⌘ B - Toggle sidebar (already uses functional update)
      if (isMeta && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }

      // ⌘ [ - Navigate to previous chat (inline using refs)
      if (isMeta && e.key === '[') {
        e.preventDefault();
        const sessions = sessionsRef.current;
        if (sessions.length === 0) return;
        const currentIndex = sessions.findIndex(s => s.id === currentSessionIdRef.current);
        if (currentIndex > 0) {
          setCurrentSessionId(sessions[currentIndex - 1].id);
          window.location.hash = sessions[currentIndex - 1].id;
        } else if (currentIndex === -1 && sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
          window.location.hash = sessions[0].id;
        }
      }

      // ⌘ ] - Navigate to next chat (inline using refs)
      if (isMeta && e.key === ']') {
        e.preventDefault();
        const sessions = sessionsRef.current;
        if (sessions.length === 0) return;
        const currentIndex = sessions.findIndex(s => s.id === currentSessionIdRef.current);
        if (currentIndex >= 0 && currentIndex < sessions.length - 1) {
          setCurrentSessionId(sessions[currentIndex + 1].id);
          window.location.hash = sessions[currentIndex + 1].id;
        } else if (currentIndex === -1 && sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
          window.location.hash = sessions[0].id;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // Empty dependencies - all state access uses refs or functional updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // loadSessions is defined above using useCallback with pagination support

  // Handle session switching - memoized to prevent re-renders
  const handleSessionSelect = useCallback(async (sessionId: string) => {
    // IMPORTANT: Cache current session's messages BEFORE switching
    if (currentSessionId && messages.length > 0) {
      messageCache.current.set(currentSessionId, messages);
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
  }, [currentSessionId, messages, sessions, loadCommandsLazy]);

  // Handle new chat creation
  const handleNewChat = async () => {
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

  // Navigate to previous chat in the list
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

  // Navigate to next chat in the list
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

  // Navigate back to the most recently viewed chat
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

  // Handle chat deletion
  const handleChatDelete = async (chatId: string) => {
    const success = await sessionAPI.deleteSession(chatId);

    if (success) {
      // If deleting current session, clear messages and session
      if (chatId === currentSessionId) {
        setCurrentSessionId(null);
        setCurrentSessionMode('general');
        setMessages([]);
      }
      // PERFORMANCE FIX: Update local state instead of refetching all sessions
      setSessions(prev => prev.filter(s => s.id !== chatId));
      setTotalSessions(prev => Math.max(0, prev - 1));
      // Clean up message cache for deleted session
      messageCache.current.delete(chatId);
    }
    // Error already shown by sessionAPI
  };

  // Handle chat rename
  const handleChatRename = async (chatId: string, newFolderName: string) => {
    const result = await sessionAPI.renameSession(chatId, newFolderName);

    if (result.success) {
      // PERFORMANCE FIX: Update local state instead of refetching all sessions
      setSessions(prev => prev.map(s =>
        s.id === chatId
          ? { ...s, title: newFolderName, working_directory: s.working_directory?.replace(/[^/]+$/, newFolderName) }
          : s
      ));
    } else {
      // Show error to user
      toast.error('Error', {
        description: result.error || 'Failed to rename folder'
      });
    }
  };

  // Handle working directory change
  const handleChangeDirectory = async (sessionId: string, newDirectory: string) => {
    const result = await sessionAPI.updateWorkingDirectory(sessionId, newDirectory);

    if (result.success) {
      // PERFORMANCE FIX: Update local state instead of refetching all sessions
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, working_directory: newDirectory }
          : s
      ));

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

  // Handle plan mode toggle
  const handleTogglePlanMode = async () => {
    const newPlanMode = !isPlanMode;
    const mode = newPlanMode ? 'plan' : 'bypassPermissions';

    // Always update local state
    setIsPlanMode(newPlanMode);

    // If session exists, update it in the database
    if (currentSessionId) {
      const result = await sessionAPI.updatePermissionMode(currentSessionId, mode);

      // If query is active, send WebSocket message to switch mode mid-stream
      if (result.success && isSessionLoading(currentSessionId)) {
        sendMessage({
          type: 'set_permission_mode',
          sessionId: currentSessionId,
          mode
        });
      }
    }
    // If no session exists yet, the mode will be applied when session is created
  };

  // Handle autonom mode toggle
  const handleToggleAutonomMode = async () => {
    const newAutonomMode = !isAutonomMode;
    const mode = newAutonomMode ? 'autonom' : 'bypassPermissions';

    // Update local state
    setIsAutonomMode(newAutonomMode);

    // If turning on autonom mode, turn off plan mode
    if (newAutonomMode && isPlanMode) {
      setIsPlanMode(false);
    }

    // If session exists, update it in the database
    if (currentSessionId) {
      const result = await sessionAPI.updatePermissionMode(currentSessionId, mode);

      // If query is active, send WebSocket message to switch mode mid-stream
      if (result.success && isSessionLoading(currentSessionId)) {
        sendMessage({
          type: 'set_permission_mode',
          sessionId: currentSessionId,
          mode
        });
      }
    }
    // If no session exists yet, the mode will be applied when session is created
  };

  // Handle session mode change (general, coder, intense-research, spark, unified, build)
  const handleModeChange = async (newMode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => {
    // Always update local state immediately
    setCurrentSessionMode(newMode);
    console.log('🎭 Mode changed to:', newMode);

    // Also update the session in the sessions list immediately to prevent it from reverting
    setSessions(prev => prev.map(s =>
      s.id === currentSessionId ? { ...s, mode: newMode } : s
    ));

    // If session exists, update it in the database
    if (currentSessionId) {
      const result = await sessionAPI.updateSessionMode(currentSessionId, newMode);

      if (result.success) {
        console.log('✅ Session mode updated in database:', newMode);
        // If query is active, send WebSocket message to switch mode mid-stream
        if (isSessionLoading(currentSessionId)) {
          sendMessage({
            type: 'set_mode',
            sessionId: currentSessionId,
            mode: newMode
          });
        }
      } else {
        console.error('❌ Failed to update session mode:', result.error);
      }
    }
  };

  // Handle plan approval
  const handleApprovePlan = () => {
    if (!currentSessionId) return;

    // Send approval to server to switch mode
    sendMessage({
      type: 'approve_plan',
      sessionId: currentSessionId
    });

    // Close modal
    setPendingPlan(null);

    // Immediately send continuation message to start execution
    if (currentSessionId) setSessionLoading(currentSessionId, true);

    // Add a user message indicating approval
    const approvalMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: 'Approved. Please proceed with the plan.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, approvalMessage]);

    // Send the continuation message to trigger execution
    setTimeout(() => {
      sendMessage({
        type: 'chat',
        content: 'Approved. Please proceed with the plan.',
        sessionId: currentSessionId,
        model: selectedModel,
      });
    }, 100); // Small delay to ensure mode is switched
  };

  // Handle plan rejection
  const handleRejectPlan = () => {
    setPendingPlan(null);
    if (currentSessionId) setSessionLoading(currentSessionId, false);
  };

  // Handle question submission
  const handleQuestionSubmit = (toolId: string, answers: Record<string, string>) => {
    if (!currentSessionId) return;

    // Send answers back to server
    sendMessage({
      type: 'answer_question',
      toolId,
      answers,
      sessionId: currentSessionId,
    });

    // Add user message showing their answers
    const answerText = Object.entries(answers)
      .map(([header, answer]) => `**${header}:** ${answer}`)
      .join('\n');

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: answerText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear modal
    setPendingQuestion(null);
  };

  // Handle question cancel - send cancellation to server
  const handleQuestionCancel = (toolId: string) => {
    if (currentSessionId) {
      // Notify server to cancel the pending question
      sendMessage({
        type: 'cancel_question',
        toolId,
        sessionId: currentSessionId,
      });
      setSessionLoading(currentSessionId, false);
    }
    setPendingQuestion(null);
  };

  // Create WebSocket message handler using the hook
  const handleWebSocketMessage = useWebSocketMessageHandler({
    currentSessionId,
    setMessages,
    setSessionLoading,
    setContextUsage,
    setPendingPlan,
    setPendingQuestion,
    setIsPlanMode,
    setCurrentSessionMode,
    setSessions,
    setBackgroundProcesses,
    setLiveTokenCount,
    handleActivityProgress,
    messageCache,
    activeLongRunningCommandRef,
    setAutonomProgress,
  });

  const { isConnected, sendMessage, stopGeneration } = useWebSocket({
    // Use dynamic URL based on current window location (works on any port)
    url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
    onMessage: handleWebSocketMessage,
  });

  // Handle killing a background process
  const handleKillProcess = (bashId: string) => {
    if (!currentSessionId) return;

    sendMessage({
      type: 'kill_background_process',
      bashId
    });

    // Optimistically remove from UI
    setBackgroundProcesses(prev => {
      const newMap = new Map(prev);
      const processes = newMap.get(currentSessionId) || [];
      newMap.set(currentSessionId, processes.filter(p => p.bashId !== bashId));
      return newMap;
    });
  };

  const handleSubmit = async (files?: import('../message/types').FileAttachment[], mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build', messageOverride?: string) => {
    const messageText = messageOverride || inputValue;
    if (!messageText.trim()) return;

    if (!isConnected) return;

    // Show toast if another chat is in progress
    if (isLoading) {
      toast.info('Another chat is in progress. Wait for it to complete first.');
      return;
    }

    // Reset AUTONOM progress when starting a new message
    setAutonomProgress(null);

    try {
      // Create new session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        const newSession = await sessionAPI.createSession(undefined, mode || 'general');
        if (!newSession) {
          // Error already shown by sessionAPI
          return;
        }

        sessionId = newSession.id;

        // Store mode immediately for UI display
        setCurrentSessionMode(newSession.mode);
        console.log('🎭 Session created with mode:', newSession.mode, '(requested:', mode, ')');

        // Load slash commands lazily for new session
        loadCommandsLazy(sessionId, newSession.working_directory);

        // Apply current permission mode to new session
        const permissionMode = isPlanMode ? 'plan' : 'bypassPermissions';
        await sessionAPI.updatePermissionMode(sessionId, permissionMode);

        // Update state immediately, load sessions in background (non-blocking)
        setCurrentSessionId(sessionId);
        loadSessions(); // Don't await - prevents UI blocking
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: messageText,
        timestamp: new Date().toISOString(),
        attachments: files,
      };

      setMessages((prev) => [...prev, userMessage]);
      setSessionLoading(sessionId, true);

      // Build content: if there are image files, send as array of blocks
      // Otherwise, send as plain string (existing behavior)
      let messageContent: string | Array<Record<string, unknown>> = messageText;

      if (files && files.length > 0) {
        // Convert to content blocks format (text + images)
        const contentBlocks: Array<Record<string, unknown>> = [];

        // Add text block if there's input
        if (messageText.trim()) {
          contentBlocks.push({
            type: 'text',
            text: messageText
          });
        }

        // Add image and file blocks from attachments
        for (const file of files) {
          if (file.preview && file.type.startsWith('image/')) {
            // Extract base64 data from data URL for images
            const base64Match = file.preview.match(/^data:([^;]+);base64,(.+)$/);
            if (base64Match) {
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: base64Match[1],
                  data: base64Match[2]
                }
              });
            }
          } else if (file.preview) {
            // Non-image file (document, PDF, etc.)
            contentBlocks.push({
              type: 'document',
              name: file.name,
              data: file.preview  // Contains base64 data URL
            });
          }
        }

        messageContent = contentBlocks;
      }

      // Detect user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Use local sessionId variable (guaranteed to be set)
      sendMessage({
        type: 'chat',
        content: messageContent,
        sessionId: sessionId,
        model: selectedModel,
        timezone: userTimezone,
        isAutonomMode: isAutonomMode,
      });

      setInputValue('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('SEND_MESSAGE', errorMsg);
      if (currentSessionId) setSessionLoading(currentSessionId, false);
    }
  };

  const handleStop = () => {
    if (currentSessionId) {
      stopGeneration(currentSessionId);
      setSessionLoading(currentSessionId, false);
    }
  };

  // Handle message removal
  const handleRemoveMessage = (messageId: string) => {
    setMessages((prev) => prev.filter(msg => msg.id !== messageId));
  };

  // Build wizard handlers (extracted to useBuildHandlers hook)
  const {
    handleOpenBuildWizard,
    handleCloseBuildWizard,
    handleSelectTemplate,
    handleQuickAction,
    handleBuildComplete,
    handleAIEditRequest,
  } = useBuildHandlers({
    setIsBuildWizardOpen,
    setCurrentSessionId,
    setCurrentSessionMode,
    setMessages,
    onBuildPreviewStart,
    handleSubmit,
  });

  // Register the AI edit handler with the parent
  useEffect(() => {
    if (onAIEditRequestHandler) {
      onAIEditRequestHandler(handleAIEditRequest);
    }
  }, [onAIEditRequestHandler, handleAIEditRequest]);

  // Expose setInputValue to parent for preview selection → chat integration
  useEffect(() => {
    if (onInputValueSetter) {
      onInputValueSetter(setInputValue);
    }
  }, [onInputValueSetter]);

  return (
    <div className={`flex h-screen ${layoutMode === 'split-screen' ? 'relative' : ''}`} style={{ overflow: 'visible' }}>
      {/* Sidebar with integrated resize functionality */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        layoutMode={layoutMode}
        chats={sidebarChats}
        onNewChat={handleNewChat}
        onChatSelect={handleSessionSelect}
        onChatDelete={handleChatDelete}
        onChatRename={handleChatRename}
        showCompact={displayMode === 'compact'}
        onToggleCompact={handleToggleCompact}
        showCode={showCode}
        onToggleCode={handleToggleCode}
        onNewChatTab={handleNewChatTab}
        onPreviousChat={handleSidebarPreviousChat}
        onNextChat={handleNextChat}
        onBackToRecent={handleSidebarBackToRecent}
        canPreviousChat={navigationHistoryRef.current.length > 0}
        canNextChat={false}
        canBackToRecent={navigationHistoryRef.current.length > 0}
        hasMoreChats={hasMoreSessions}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMoreSessions}
        totalChats={totalSessions}
      />

      {/* Main Chat Area - responsive margin based on sidebar width */}
      <div
        className="flex flex-col flex-1 h-screen min-h-0 overflow-hidden"
        style={{
          marginLeft: isMobile || layoutMode === 'split-screen' ? 0 : `${sidebarWidth}px`,
          transition: 'margin-left 0.2s ease-in-out',
        }}
      >
        <ChatHeader
          layoutMode={layoutMode}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          onLayoutModeChange={onLayoutModeChange}
          previewUrl={previewUrl}
          onDetectPreviewUrl={onDetectPreviewUrl}
          sessions={sessions}
          currentSessionId={currentSessionId}
          navigationHistory={navigationHistory}
          selectedModel={selectedModel}
          messages={messages}
          onModelChange={handleModelChange}
          isPlanMode={isPlanMode}
          isConnected={isConnected}
          showCode={showCode}
          displayMode={displayMode}
          showSearchBar={showSearchBar}
          searchQuery={searchQuery}
          searchMatches={searchMatches}
          currentMatchIndex={currentMatchIndex}
          handleNewChat={handleNewChat}
          handlePrevChat={handlePrevChat}
          handleNextChat={handleNextChat}
          handleBackToRecent={handleBackToRecent}
          handleChangeDirectory={handleChangeDirectory}
          setIsSidebarOpen={setIsSidebarOpen}
          setShowCode={setShowCode}
          setDisplayMode={setDisplayMode}
          setShowSearchBar={setShowSearchBar}
          setSearchQuery={setSearchQuery}
          setSearchMatches={setSearchMatches}
          setCurrentMatchIndex={setCurrentMatchIndex}
          scrollContainerRef={scrollContainerRef}
        />

        {messages.length === 0 ? (
          // New Chat Welcome Screen
          <NewChatWelcome
            key={currentSessionId || 'welcome'}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={handleStop}
            disabled={!isConnected || isLoading}
            isGenerating={isLoading}
            isPlanMode={isPlanMode}
            onTogglePlanMode={handleTogglePlanMode}
            isAutonomMode={isAutonomMode}
            onToggleAutonomMode={handleToggleAutonomMode}
            availableCommands={availableCommands}
            onOpenBuildWizard={handleOpenBuildWizard}
            onOpenPromptLibrary={handleOpenPromptLibrary}
            onSelectPrompt={handleEditPrompt}
            mode={currentSessionMode}
            onModeChange={handleModeChange}
          />
        ) : (
          // Chat Interface
          <>
            {/* AUTONOM Progress Tracker */}
            {autonomProgress && (
              <AutonomProgressTracker
                stepNumber={autonomProgress.stepNumber}
                maxSteps={autonomProgress.maxSteps}
                budgetUsed={autonomProgress.budgetUsed}
                budgetRemaining={autonomProgress.budgetRemaining}
                tokensRemaining={autonomProgress.tokensRemaining}
                totalCost={autonomProgress.totalCost}
                maxCost={autonomProgress.maxCost}
                stepsCompleted={autonomProgress.stepsCompleted}
              />
            )}

            {/* Messages */}
            <GenerationProvider isGenerating={isLoading} onStop={handleStop}>
              <WorkingDirectoryContext.Provider value={{ workingDirectory: currentWorkingDirectory }}>
                <MessageList
                  messages={messages}
                  isLoading={isCurrentSessionLoading}
                  liveTokenCount={liveTokenCount}
                  scrollContainerRef={scrollContainerRef}
                  displayMode={displayMode}
                  showCode={showCode}
                  onRemoveMessage={handleRemoveMessage}
                />
              </WorkingDirectoryContext.Provider>
            </GenerationProvider>

            {/* Input Section with Progress Bar and Working Directory */}
            <ChatInputSection
              currentSessionId={currentSessionId}
              sessionWorkingDirectory={currentWorkingDirectory || undefined}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSubmit={handleSubmit}
              onStop={handleStop}
              disabled={!isConnected || isLoading}
              isGenerating={isLoading}
              mode={currentSessionMode}
              onModeChange={handleModeChange}
              isPlanMode={isPlanMode}
              onTogglePlanMode={handleTogglePlanMode}
              isAutonomMode={isAutonomMode}
              onToggleAutonomMode={handleToggleAutonomMode}
              availableCommands={availableCommands}
              contextUsage={currentSessionId ? contextUsage.get(currentSessionId) : undefined}
              selectedModel={selectedModel}
              backgroundProcesses={backgroundProcesses.get(currentSessionId || '') || []}
              onKillProcess={handleKillProcess}
              layoutMode={layoutMode}
              onOpenBuildWizard={handleOpenBuildWizard}
              onOpenPromptLibrary={handleOpenPromptLibrary}
              previewUrl={previewUrl || undefined}
              selectedElements={selectedElements}
              onClearSelection={onClearSelection}
              activityProgress={activityProgress}
              commandQueue={commandQueue}
              onClearQueue={() => {
                setCommandQueue(prev => prev.filter(cmd => cmd.status !== 'completed'));
              }}
              onDirectoryChange={(newPath) => {
                if (currentSessionId) {
                  handleChangeDirectory(currentSessionId, newPath);
                }
              }}
              onInsertText={(text) => {
                setInputValue(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
              }}
              isWorkingDirPanelCollapsed={isWorkingDirPanelCollapsed}
              onToggleWorkingDirCollapse={() => setIsWorkingDirPanelCollapsed(!isWorkingDirPanelCollapsed)}
              projects={currentSession?.projects}
              isProjectsPanelCollapsed={isProjectsPanelCollapsed}
              onToggleProjectsCollapse={() => setIsProjectsPanelCollapsed(!isProjectsPanelCollapsed)}
              onOpenProjectPreview={(url) => {
                // Open preview URL in split screen or external browser
                if (onBuildPreviewStart) {
                  // Use build preview start which handles layout mode switching and URL setting
                  onBuildPreviewStart(url);
                } else if (onLayoutModeChange) {
                  // Fallback: just switch to split-screen mode
                  onLayoutModeChange('split-screen');
                  window.open(url, '_blank');
                } else {
                  // Last resort: open in new tab
                  window.open(url, '_blank');
                }
              }}
            />
          </>
        )}
      </div>

      {/* All Modals */}
      <ChatModals
        pendingPlan={pendingPlan}
        isLoading={isLoading}
        onApprovePlan={handleApprovePlan}
        onRejectPlan={handleRejectPlan}
        pendingQuestion={pendingQuestion}
        onQuestionSubmit={handleQuestionSubmit}
        onQuestionCancel={handleQuestionCancel}
        isBuildWizardOpen={isBuildWizardOpen}
        buildMode={buildMode}
        onBuildModeChange={setBuildMode}
        onSelectTemplate={handleSelectTemplate}
        onQuickAction={handleQuickAction}
        onBuildComplete={handleBuildComplete}
        onCloseBuildWizard={handleCloseBuildWizard}
        showKeyboardShortcuts={showKeyboardShortcuts}
        onCloseKeyboardShortcuts={() => setShowKeyboardShortcuts(false)}
        isPromptLibraryOpen={isPromptLibraryOpen}
        onSelectPrompt={handleSelectPrompt}
        onEditPrompt={handleEditPrompt}
        onClosePromptLibrary={handleClosePromptLibrary}
      />

      {/* Scroll Button - only show when messages exist */}
      {messages.length > 0 && <ScrollButton scrollContainerRef={scrollContainerRef} />}
    </div>
  );
}
