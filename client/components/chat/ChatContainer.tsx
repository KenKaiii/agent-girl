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

import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { NewChatWelcome } from './NewChatWelcome';
import { Sidebar } from '../sidebar/Sidebar';
import { ModelSelector } from '../header/ModelSelector';
import { WorkingDirectoryDisplay } from '../header/WorkingDirectoryDisplay';
import { AboutButton } from '../header/AboutButton';
import { RadioPlayer } from '../header/RadioPlayer';
import { PlanApprovalModal } from '../plan/PlanApprovalModal';
import { BuildWizard } from '../build-wizard/BuildWizard';
import { ScrollButton } from './ScrollButton';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useSessionAPI, type Session } from '../../hooks/useSessionAPI';
import { Menu, Edit3 } from 'lucide-react';
import type { Message } from '../message/types';
import { toast } from '../../utils/toast';
import { showError } from '../../utils/errorMessages';
import type { BackgroundProcess } from '../process/BackgroundProcessMonitor';
import type { SlashCommand } from '../../hooks/useWebSocket';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Ref for scroll container in MessageList
  const scrollContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Session management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [_isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [currentSessionMode, setCurrentSessionMode] = useState<'general' | 'coder' | 'intense-research' | 'spark'>('general');

  // Slash commands available for current session
  const [availableCommands, setAvailableCommands] = useState<SlashCommand[]>([]);

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

  // Plan approval
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  // Background processes (per-session)
  const [backgroundProcesses, setBackgroundProcesses] = useState<Map<string, BackgroundProcess[]>>(new Map());

  // Track active long-running command by bashId for updates
  const activeLongRunningCommandRef = useRef<string | null>(null);

  // Build wizard state
  const [isBuildWizardOpen, setIsBuildWizardOpen] = useState(false);

  const sessionAPI = useSessionAPI();

  // Per-session loading state helpers
  const isSessionLoading = (sessionId: string | null): boolean => {
    return sessionId ? loadingSessions.has(sessionId) : false;
  };

  const setSessionLoading = (sessionId: string, loading: boolean) => {
    setLoadingSessions(prev => {
      const next = new Set(prev);
      if (loading) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  };

  // Check if ANY session is loading (global loading state for input disabling)
  const isAnySessionLoading = loadingSessions.size > 0;
  const isLoading = isAnySessionLoading;

  // Check if CURRENT session is loading (for typing indicator)
  const isCurrentSessionLoading = currentSessionId ? loadingSessions.has(currentSessionId) : false;

  // Save model selection to localStorage
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('agent-boy-model', modelId);
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    const loadedSessions = await sessionAPI.fetchSessions();
    setSessions(loadedSessions);

    // Initialize context usage from loaded sessions
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
    setIsLoadingSessions(false);
  };

  // Handle session switching
  const handleSessionSelect = async (sessionId: string) => {
    // IMPORTANT: Cache current session's messages BEFORE switching
    if (currentSessionId && messages.length > 0) {
      messageCache.current.set(currentSessionId, messages);
      console.log(`[Message Cache] Cached ${messages.length} messages for session ${currentSessionId}`);
    }

    setCurrentSessionId(sessionId);

    // Load session details to get permission mode and mode
    const sessions = await sessionAPI.fetchSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setIsPlanMode(session.permission_mode === 'plan');
      setCurrentSessionMode(session.mode);
      console.log('🎭 Session mode loaded:', session.mode, 'for session:', sessionId);
    }

    // Load slash commands for this session
    try {
      const commandsRes = await fetch(`/api/sessions/${sessionId}/commands`);
      if (commandsRes.ok) {
        const commandsData = await commandsRes.json();
        setAvailableCommands(commandsData.commands || []);
        console.log(`📋 Loaded ${commandsData.commands?.length || 0} slash commands for session`);
      }
    } catch (error) {
      console.error('Failed to load slash commands:', error);
    }

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
  };

  // Handle new chat creation
  const handleNewChat = async () => {
    // Don't create session yet - let handleSubmit create it with the user-selected mode
    setCurrentSessionId(null);
    setCurrentSessionMode('general'); // Reset to default for UI
    setMessages([]);
    setInputValue('');
    // Session will be created in handleSubmit when user sends first message
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
      await loadSessions(); // Reload sessions to reflect deletion
    }
    // Error already shown by sessionAPI
  };

  // Handle chat rename
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

  // Handle working directory change
  const handleChangeDirectory = async (sessionId: string, newDirectory: string) => {
    const result = await sessionAPI.updateWorkingDirectory(sessionId, newDirectory);

    if (result.success) {
      await loadSessions();

      // Reload slash commands for new directory
      try {
        const commandsRes = await fetch(`/api/sessions/${sessionId}/commands`);
        if (commandsRes.ok) {
          const commandsData = await commandsRes.json();
          setAvailableCommands(commandsData.commands || []);
        }
      } catch (error) {
        console.error('Failed to load commands after directory change:', error);
      }

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

  const { isConnected, sendMessage, stopGeneration } = useWebSocket({
    // Use dynamic URL based on current window location (works on any port)
    url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
    onMessage: (message) => {
      // Session isolation: Ignore messages from other sessions
      if (message.sessionId && message.sessionId !== currentSessionId) {
        console.log(`[Session Filter] Ignoring message from session ${message.sessionId} (current: ${currentSessionId})`);

        // Allow certain message types through for background session updates
        if (message.type === 'context_usage') {
          // Process context_usage for any session
          const usageMsg = message as {
            type: 'context_usage';
            inputTokens: number;
            outputTokens: number;
            contextWindow: number;
            contextPercentage: number;
            sessionId?: string;
          };

          const targetSessionId = usageMsg.sessionId || currentSessionId;
          if (targetSessionId) {
            setContextUsage(prev => {
              const newMap = new Map(prev);
              newMap.set(targetSessionId, {
                inputTokens: usageMsg.inputTokens,
                contextWindow: usageMsg.contextWindow,
                contextPercentage: usageMsg.contextPercentage,
              });
              return newMap;
            });

            console.log(`📊 Context usage updated for session ${targetSessionId.substring(0, 8)}: ${usageMsg.contextPercentage}%`);
          }
          return;
        }

        // Clear loading state for filtered session if it's a completion message
        if ((message.type === 'result' || message.type === 'error') && message.sessionId) {
          setSessionLoading(message.sessionId, false);
        }
        return;
      }

      // Handle incoming WebSocket messages
      if (message.type === 'assistant_message' && 'content' in message) {
        const assistantContent = message.content as string;
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          // Reset token count on first assistant message (start of new response)
          if (!lastMessage || lastMessage.type !== 'assistant') {
            setLiveTokenCount(0);
          }

          // If last message is from assistant, append to the last text block
          if (lastMessage && lastMessage.type === 'assistant') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
            const lastBlock = content[content.length - 1];

            // If last block is text, append to it for smooth streaming
            if (lastBlock && lastBlock.type === 'text') {
              const updatedContent = [
                ...content.slice(0, -1),
                { type: 'text' as const, text: lastBlock.text + assistantContent }
              ];
              const updatedMessage = {
                ...lastMessage,
                content: updatedContent
              };
              return [...prev.slice(0, -1), updatedMessage];
            } else {
              // Otherwise add new text block
              const updatedMessage = {
                ...lastMessage,
                content: [...content, { type: 'text' as const, text: assistantContent }]
              };
              return [...prev.slice(0, -1), updatedMessage];
            }
          }

          // Otherwise create new assistant message
          return [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'assistant' as const,
              content: [{ type: 'text' as const, text: assistantContent }],
              timestamp: new Date().toISOString(),
            },
          ];
        });
      } else if (message.type === 'thinking_start') {
        console.log('💭 Thinking block started');
        // Create a new thinking block when thinking starts
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          if (lastMessage && lastMessage.type === 'assistant') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
            const updatedMessage = {
              ...lastMessage,
              content: [...content, { type: 'thinking' as const, thinking: '' }]
            };
            return [...prev.slice(0, -1), updatedMessage];
          }

          // Create new assistant message with thinking block
          return [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'assistant' as const,
              content: [{ type: 'thinking' as const, thinking: '' }],
              timestamp: new Date().toISOString(),
            },
          ];
        });
      } else if (message.type === 'thinking_delta' && 'content' in message) {
        const thinkingContent = message.content as string;
        console.log('💭 Thinking delta:', thinkingContent.slice(0, 50) + (thinkingContent.length > 50 ? '...' : ''));

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          if (lastMessage && lastMessage.type === 'assistant') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
            const lastBlock = content[content.length - 1];

            // If last block is thinking, append to it
            if (lastBlock && lastBlock.type === 'thinking') {
              const updatedContent = [
                ...content.slice(0, -1),
                { type: 'thinking' as const, thinking: lastBlock.thinking + thinkingContent }
              ];
              const updatedMessage = {
                ...lastMessage,
                content: updatedContent
              };
              return [...prev.slice(0, -1), updatedMessage];
            }
          }

          return prev; // No update if not in a thinking block
        });
      } else if (message.type === 'tool_use' && 'toolId' in message && 'toolName' in message && 'toolInput' in message) {
        // Handle tool use messages
        const toolUseMsg = message as { type: 'tool_use'; toolId: string; toolName: string; toolInput: Record<string, unknown> };

        // Use flushSync to prevent React batching from causing tools to be lost
        // When multiple tool_use messages arrive rapidly, React batches setState calls
        // causing all but the last update to be overwritten. flushSync forces synchronous updates.
        flushSync(() => {
          setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          const toolUseBlock = {
            type: 'tool_use' as const,
            id: toolUseMsg.toolId,
            name: toolUseMsg.toolName,
            input: toolUseMsg.toolInput,
            // Initialize nestedTools array for Task tools
            ...(toolUseMsg.toolName === 'Task' ? { nestedTools: [] } : {}),
          };

          // If last message is assistant, check for Task tool nesting
          if (lastMessage && lastMessage.type === 'assistant') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];

            // Check for duplicate tool_use blocks (prevents race condition issues)
            const isDuplicate = content.some(block =>
              block.type === 'tool_use' && block.id === toolUseMsg.toolId
            );

            if (isDuplicate) {
              return prev; // Skip duplicate
            }

            // Find all active Task tools (Tasks without a text block after them)
            const activeTaskIndices: number[] = [];
            let foundTextBlockAfterLastTask = false;

            for (let i = content.length - 1; i >= 0; i--) {
              const block = content[i];
              if (block.type === 'text') {
                foundTextBlockAfterLastTask = true;
              }
              if (block.type === 'tool_use' && block.name === 'Task') {
                if (!foundTextBlockAfterLastTask) {
                  activeTaskIndices.unshift(i); // Add to beginning to maintain order
                } else {
                  break; // Stop looking once we hit a text block context boundary
                }
              }
            }

            // If this is a Task tool OR we found no active Tasks to nest under, add normally
            if (toolUseMsg.toolName === 'Task' || activeTaskIndices.length === 0) {
              const updatedMessage = {
                ...lastMessage,
                content: [...content, toolUseBlock]
              };
              return [...prev.slice(0, -1), updatedMessage];
            }

            // Distribute tools across active Tasks using round-robin
            // Use total nested tool count as a counter for distribution
            const totalNestedTools = activeTaskIndices.reduce((sum, idx) => {
              const block = content[idx];
              return sum + (block.type === 'tool_use' ? (block.nestedTools?.length || 0) : 0);
            }, 0);

            const targetTaskIndex = activeTaskIndices[totalNestedTools % activeTaskIndices.length];

            // Nest this tool under the selected Task
            const updatedContent = content.map((block, index) => {
              if (index === targetTaskIndex && block.type === 'tool_use') {
                // Check for duplicate in nested tools as well
                const isNestedDuplicate = (block.nestedTools || []).some(
                  nested => nested.id === toolUseMsg.toolId
                );

                if (isNestedDuplicate) {
                  return block; // Don't add duplicate
                }

                return {
                  ...block,
                  nestedTools: [...(block.nestedTools || []), toolUseBlock]
                };
              }
              return block;
            });

            const updatedMessage = {
              ...lastMessage,
              content: updatedContent
            };
            return [...prev.slice(0, -1), updatedMessage];
          }

          // Otherwise create new assistant message with tool
          return [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'assistant' as const,
              content: [toolUseBlock],
              timestamp: new Date().toISOString(),
            },
          ];
          });
        });
      } else if (message.type === 'token_update' && 'outputTokens' in message) {
        // Update live token count during streaming
        const tokenUpdate = message as { type: 'token_update'; outputTokens: number };
        setLiveTokenCount(tokenUpdate.outputTokens);
      } else if (message.type === 'result') {
        if (currentSessionId) {
          setSessionLoading(currentSessionId, false);
          // Clear message cache for this session since messages are now saved to DB
          messageCache.current.delete(currentSessionId);
          console.log(`[Message Cache] Cleared cache for session ${currentSessionId} (stream completed)`);
          // Clear live token count when response completes
          setLiveTokenCount(0);
        }
      } else if (message.type === 'timeout_warning') {
        // Handle timeout warning (60s elapsed)
        const warningMsg = message as { type: 'timeout_warning'; message: string; elapsedSeconds: number };
        toast.warning('Still thinking...', {
          description: warningMsg.message || 'The AI is taking longer than usual',
          duration: 5000,
        });
      } else if (message.type === 'retry_attempt') {
        // Handle retry attempt notification
        const retryMsg = message as { type: 'retry_attempt'; attempt: number; maxAttempts: number; message: string; errorType: string };
        toast.info(`Retrying (${retryMsg.attempt}/${retryMsg.maxAttempts})`, {
          description: retryMsg.message || `Attempting to recover from ${retryMsg.errorType}...`,
          duration: 3000,
        });
      } else if (message.type === 'error') {
        // Handle error messages from server
        if (currentSessionId) setSessionLoading(currentSessionId, false);
        // Clear live token count on error
        setLiveTokenCount(0);

        // Get error type and message
        const errorType = 'errorType' in message ? (message.errorType as string) : undefined;
        const errorMsg = 'message' in message ? message.message : ('error' in message ? message.error : undefined);
        const errorMessage = errorMsg || 'An error occurred';

        // Map error type to user-friendly error code
        const errorCodeMap: Record<string, string> = {
          'timeout_error': 'API_TIMEOUT',
          'rate_limit_error': 'API_RATE_LIMIT',
          'overloaded_error': 'API_OVERLOADED',
          'authentication_error': 'API_AUTHENTICATION',
          'permission_error': 'API_PERMISSION',
          'invalid_request_error': 'API_INVALID_REQUEST',
          'request_too_large': 'API_REQUEST_TOO_LARGE',
          'network_error': 'API_NETWORK',
        };

        // Show appropriate toast notification
        if (errorType && errorCodeMap[errorType]) {
          const errorCode = errorCodeMap[errorType] as keyof typeof import('../../utils/errorMessages').ErrorMessages;
          showError(errorCode, errorMessage);
        } else {
          toast.error('Error', {
            description: errorMessage
          });
        }

        // Display error as assistant message
        const errorIcon = errorType === 'timeout_error' ? '⏱️' :
                         errorType === 'rate_limit_error' ? '🚦' :
                         errorType === 'authentication_error' ? '🔑' :
                         errorType === 'network_error' ? '🌐' : '❌';

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant' as const,
            content: [{
              type: 'text' as const,
              text: `${errorIcon} Error: ${errorMessage}`
            }],
            timestamp: new Date().toISOString(),
          },
        ]);
      } else if (message.type === 'user_message') {
        // Echo back user message if needed
      } else if (message.type === 'exit_plan_mode') {
        // Handle plan mode exit - show approval modal and auto-deactivate plan mode
        const planText = 'plan' in message ? message.plan : undefined;
        setPendingPlan(planText || 'No plan provided');
        setIsPlanMode(false); // Auto-deactivate plan mode when ExitPlanMode is triggered
      } else if (message.type === 'permission_mode_changed') {
        // Handle permission mode change confirmation
        const mode = 'mode' in message ? message.mode : undefined;
        setIsPlanMode(mode === 'plan');
      } else if (message.type === 'background_process_started' && 'bashId' in message && 'command' in message && 'description' in message) {
        // Handle background process started
        const sessionId = message.sessionId || currentSessionId;
        if (sessionId) {
          setBackgroundProcesses(prev => {
            const newMap = new Map(prev);
            const processes = newMap.get(sessionId) || [];
            newMap.set(sessionId, [...processes, {
              bashId: message.bashId as string,
              command: message.command as string,
              description: message.description as string,
              startedAt: Date.now()
            }]);
            return newMap;
          });
        }
      } else if (message.type === 'background_process_killed' && 'bashId' in message) {
        // Handle background process killed confirmation
        const sessionId = message.sessionId || currentSessionId;
        if (sessionId) {
          setBackgroundProcesses(prev => {
            const newMap = new Map(prev);
            const processes = newMap.get(sessionId) || [];
            newMap.set(sessionId, processes.filter(p => p.bashId !== message.bashId));
            return newMap;
          });
        }
      } else if (message.type === 'background_process_exited' && 'bashId' in message && 'exitCode' in message) {
        // Handle background process that exited on its own
        const sessionId = message.sessionId || currentSessionId;
        if (sessionId) {
          console.log(`Background process exited: ${message.bashId}, exitCode: ${message.exitCode}`);
          setBackgroundProcesses(prev => {
            const newMap = new Map(prev);
            const processes = newMap.get(sessionId) || [];
            newMap.set(sessionId, processes.filter(p => p.bashId !== message.bashId));
            return newMap;
          });
        }
      } else if (message.type === 'long_running_command_started' && 'bashId' in message && 'command' in message && 'commandType' in message) {
        // Handle long-running command started - add as message block
        const longRunningMsg = message as {
          type: 'long_running_command_started';
          bashId: string;
          command: string;
          commandType: 'install' | 'build' | 'test';
          description?: string;
          startedAt: number;
        };

        activeLongRunningCommandRef.current = longRunningMsg.bashId;

        // Add a new assistant message with the long-running command block
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            type: 'assistant' as const,
            timestamp: new Date().toISOString(),
            content: [{
              type: 'long_running_command' as const,
              bashId: longRunningMsg.bashId,
              command: longRunningMsg.command,
              commandType: longRunningMsg.commandType,
              output: '',
              status: 'running' as const,
              startedAt: longRunningMsg.startedAt,
            }],
          },
        ]);
      } else if (message.type === 'command_output_chunk' && 'bashId' in message && 'output' in message) {
        // Handle streaming output from long-running command - update message block
        const outputMsg = message as { type: 'command_output_chunk'; bashId: string; output: string };

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === 'assistant' && lastMessage.content.length > 0) {
            const lastBlock = lastMessage.content[lastMessage.content.length - 1];
            if (lastBlock.type === 'long_running_command' && lastBlock.bashId === outputMsg.bashId) {
              // Update the output of the last long-running command block
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: [
                    ...lastMessage.content.slice(0, -1),
                    {
                      ...lastBlock,
                      output: lastBlock.output + outputMsg.output,
                    },
                  ],
                },
              ];
            }
          }
          return prev;
        });
      } else if (message.type === 'long_running_command_completed' && 'bashId' in message) {
        // Handle long-running command completion - update message block status
        const completedMsg = message as { type: 'long_running_command_completed'; bashId: string; exitCode: number };

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === 'assistant' && lastMessage.content.length > 0) {
            const lastBlock = lastMessage.content[lastMessage.content.length - 1];
            if (lastBlock.type === 'long_running_command' && lastBlock.bashId === completedMsg.bashId) {
              toast.success('Command completed', {
                description: 'Installation finished successfully',
                duration: 3000,
              });

              activeLongRunningCommandRef.current = null;

              // Update status to completed
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: [
                    ...lastMessage.content.slice(0, -1),
                    {
                      ...lastBlock,
                      status: 'completed' as const,
                    },
                  ],
                },
              ];
            }
          }
          return prev;
        });
      } else if (message.type === 'long_running_command_failed' && 'bashId' in message && 'error' in message) {
        // Handle long-running command failure - update message block status
        const failedMsg = message as { type: 'long_running_command_failed'; bashId: string; error: string };

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === 'assistant' && lastMessage.content.length > 0) {
            const lastBlock = lastMessage.content[lastMessage.content.length - 1];
            if (lastBlock.type === 'long_running_command' && lastBlock.bashId === failedMsg.bashId) {
              toast.error('Command failed', {
                description: failedMsg.error,
                duration: 5000,
              });

              activeLongRunningCommandRef.current = null;

              // Update status to failed
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: [
                    ...lastMessage.content.slice(0, -1),
                    {
                      ...lastBlock,
                      status: 'failed' as const,
                      output: lastBlock.output + '\n\nError: ' + failedMsg.error,
                    },
                  ],
                },
              ];
            }
          }
          return prev;
        });
      } else if (message.type === 'slash_commands_available' && 'commands' in message) {
        // SDK supportedCommands() returns built-in commands only, not custom .md files
        // We ignore this and use REST API instead
      } else if (message.type === 'compact_start' && 'trigger' in message && 'preTokens' in message) {
        // Handle auto-compact notification
        const compactMsg = message as { type: 'compact_start'; trigger: 'auto' | 'manual'; preTokens: number };
        if (compactMsg.trigger === 'auto') {
          const tokenCount = compactMsg.preTokens.toLocaleString();
          toast.info('Auto-compacting conversation...', {
            description: `Context reached limit (${tokenCount} tokens). Summarizing history...`,
            duration: 10000, // Show for 10 seconds (compaction takes time)
          });
        }
      } else if (message.type === 'compact_loading') {
        // Handle /compact loading state - add temporary loading message with shimmer effect
        const targetSessionId = message.sessionId || currentSessionId;
        if (targetSessionId === currentSessionId) {
          const loadingMessage: Message = {
            id: 'compact-loading',
            type: 'assistant',
            content: [{ type: 'text', text: 'Compacting conversation...' }],
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, loadingMessage]);
        }
      } else if (message.type === 'compact_complete' && 'preTokens' in message) {
        // Handle /compact completion - remove loading message and add final divider
        const targetSessionId = message.sessionId || currentSessionId;
        if (targetSessionId === currentSessionId) {
          const compactMsg = message as { type: 'compact_complete'; preTokens: number };
          const tokenCount = compactMsg.preTokens.toLocaleString();

          // Remove loading message
          setMessages((prev) => prev.filter(m => m.id !== 'compact-loading'));

          // Add final divider message
          const dividerMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: [{ type: 'text', text: `--- History compacted. Previous messages were summarized to reduce token usage (${tokenCount} tokens before compact) ---` }],
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, dividerMessage]);
        }
      } else if (message.type === 'context_usage' && 'inputTokens' in message && 'contextWindow' in message && 'contextPercentage' in message) {
        // Handle context usage update (for current session)
        const usageMsg = message as {
          type: 'context_usage';
          inputTokens: number;
          outputTokens: number;
          contextWindow: number;
          contextPercentage: number;
          sessionId?: string;
        };

        const targetSessionId = usageMsg.sessionId || currentSessionId;
        if (targetSessionId) {
          setContextUsage(prev => {
            const newMap = new Map(prev);
            newMap.set(targetSessionId, {
              inputTokens: usageMsg.inputTokens,
              contextWindow: usageMsg.contextWindow,
              contextPercentage: usageMsg.contextPercentage,
            });
            return newMap;
          });

          console.log(`📊 Context usage updated for session ${targetSessionId.substring(0, 8)}: ${usageMsg.contextPercentage}%`);
        }
      } else if (message.type === 'keepalive') {
        // Keepalive messages are sent every 30s to prevent WebSocket idle timeout
        // during long-running operations. No action needed - just acknowledge receipt.
        // Optionally log for debugging (commented out to reduce noise)
        // console.log(`💓 Keepalive received (${message.elapsedSeconds}s elapsed)`);
      }
    },
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

  const handleSubmit = async (files?: import('../message/types').FileAttachment[], mode?: 'general' | 'coder' | 'intense-research' | 'spark', messageOverride?: string) => {
    const messageText = messageOverride || inputValue;
    if (!messageText.trim()) return;

    if (!isConnected) return;

    // Show toast if another chat is in progress
    if (isLoading) {
      toast.info('Another chat is in progress. Wait for it to complete first.');
      return;
    }

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

        // Load slash commands for new session
        try {
          const commandsRes = await fetch(`/api/sessions/${sessionId}/commands`);
          if (commandsRes.ok) {
            const commandsData = await commandsRes.json();
            setAvailableCommands(commandsData.commands || []);
            console.log(`📋 Loaded ${commandsData.commands?.length || 0} commands for new session`);
          }
        } catch (error) {
          console.error('Failed to load commands for new session:', error);
        }

        // Apply current permission mode to new session
        const permissionMode = isPlanMode ? 'plan' : 'bypassPermissions';
        await sessionAPI.updatePermissionMode(sessionId, permissionMode);

        // Update state and load sessions
        setCurrentSessionId(sessionId);
        await loadSessions();
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

  // Build wizard handlers
  const handleOpenBuildWizard = () => {
    setIsBuildWizardOpen(true);
  };

  const handleCloseBuildWizard = () => {
    setIsBuildWizardOpen(false);
  };

  const handleBuildComplete = (prompt: string) => {
    // Close wizard
    setIsBuildWizardOpen(false);

    // Clear current session to force creation of new session with Coder mode
    setCurrentSessionId(null);
    setCurrentSessionMode('coder');
    setMessages([]);

    // Auto-submit immediately with prompt override (no need to wait for state)
    setTimeout(() => {
      handleSubmit(undefined, 'coder', prompt);
    }, 100);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        chats={sessions.map(session => {
          // Extract folder name from working_directory path
          const folderName = session.working_directory?.split('/').filter(Boolean).pop() || session.title;
          return {
            id: session.id,
            title: folderName,
            timestamp: new Date(session.updated_at),
            isActive: session.id === currentSessionId,
            isLoading: loadingSessions.has(session.id),
          };
        })}
        onNewChat={handleNewChat}
        onChatSelect={handleSessionSelect}
        onChatDelete={handleChatDelete}
        onChatRename={handleChatRename}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-screen" style={{ marginLeft: isSidebarOpen ? '260px' : '0', transition: 'margin-left 0.2s ease-in-out' }}>
        {/* Header - Always visible */}
        <nav className="header">
          <div className="header-content">
            <div className="header-inner">
              {/* Left side */}
              <div className="header-left">
                {!isSidebarOpen && (
                  <>
                    {/* Sidebar toggle */}
                    <button className="header-btn" aria-label="Toggle Sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                      <Menu />
                    </button>

                    {/* New chat */}
                    <button className="header-btn" aria-label="New Chat" onClick={handleNewChat}>
                      <Edit3 />
                    </button>
                  </>
                )}
              </div>

            {/* Center - Logo and Model Selector */}
            <div className="header-center">
              <div className="flex flex-col items-start w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    {!isSidebarOpen && (
                      <img
                        src="/client/agent-boy.svg"
                        alt="Agent Girl"
                        className="header-icon"
                        loading="eager"
                        onError={(e) => {
                          console.error('Failed to load agent-boy.svg');
                          // Retry loading
                          setTimeout(() => {
                            e.currentTarget.src = '/client/agent-boy.svg?' + Date.now();
                          }, 100);
                        }}
                      />
                    )}
                    <div className="header-title text-gradient">
                      Agent Girl
                    </div>
                    {/* Model Selector */}
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={handleModelChange}
                      hasMessages={messages.length > 0}
                      disabled={messages.length > 0}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="header-right">
              {/* Radio Player */}
              <RadioPlayer />
              {/* Working Directory Display */}
              {currentSessionId && sessions.find(s => s.id === currentSessionId)?.working_directory && (
                <WorkingDirectoryDisplay
                  directory={sessions.find(s => s.id === currentSessionId)?.working_directory || ''}
                  sessionId={currentSessionId}
                  onChangeDirectory={handleChangeDirectory}
                />
              )}
              {/* About Button */}
              <AboutButton />
            </div>
          </div>
        </div>
      </nav>

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
            availableCommands={availableCommands}
            onOpenBuildWizard={handleOpenBuildWizard}
            mode={currentSessionMode}
          />
        ) : (
          // Chat Interface
          <>
            {/* Messages */}
            <MessageList
              messages={messages}
              isLoading={isCurrentSessionLoading}
              liveTokenCount={liveTokenCount}
              scrollContainerRef={scrollContainerRef}
            />

            {/* Input */}
            <ChatInput
              key={currentSessionId || 'new-chat'}
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              onStop={handleStop}
              disabled={!isConnected || isLoading}
              isGenerating={isLoading}
              isPlanMode={isPlanMode}
              onTogglePlanMode={handleTogglePlanMode}
              backgroundProcesses={backgroundProcesses.get(currentSessionId || '') || []}
              onKillProcess={handleKillProcess}
              mode={currentSessionId ? currentSessionMode : undefined}
              availableCommands={availableCommands}
              contextUsage={currentSessionId ? contextUsage.get(currentSessionId) : undefined}
              selectedModel={selectedModel}
            />
          </>
        )}
      </div>

      {/* Plan Approval Modal */}
      {pendingPlan && (
        <PlanApprovalModal
          plan={pendingPlan}
          onApprove={handleApprovePlan}
          onReject={handleRejectPlan}
          isResponseInProgress={isLoading}
        />
      )}

      {/* Build Wizard */}
      {isBuildWizardOpen && (
        <BuildWizard
          onComplete={handleBuildComplete}
          onClose={handleCloseBuildWizard}
        />
      )}

      {/* Scroll Button - only show when messages exist */}
      {messages.length > 0 && <ScrollButton scrollContainerRef={scrollContainerRef} />}
    </div>
  );
}
