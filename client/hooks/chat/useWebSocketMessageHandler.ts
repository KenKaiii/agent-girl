/**
 * Agent Girl - WebSocket message handler hook
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { Message } from '../../components/message/types';
import type { Question } from '../../components/question/QuestionModal';
import type { Session } from '../useSessionAPI';
import type { AIProgressState, ActionHistoryEntry } from '../types';
import type { BackgroundProcess } from '../../components/process/BackgroundProcessMonitor';
import { toast } from '../../utils/toast';
import { showError } from '../../utils/errorMessages';

// Tools that modify files (should trigger preview refresh)
export const FILE_EDIT_TOOLS = ['Edit', 'Write', 'NotebookEdit'];

// Human-readable tool names for display
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  // File operations
  Read: 'Reading',
  Edit: 'Editing',
  Write: 'Writing',
  Glob: 'Finding files',
  Grep: 'Searching code',
  // Shell & system
  Bash: 'Running command',
  BashOutput: 'Reading output',
  KillShell: 'Stopping process',
  // Navigation & research
  Task: 'Spawning agent',
  WebFetch: 'Fetching URL',
  WebSearch: 'Searching web',
  // Project management
  TodoWrite: 'Updating tasks',
  NotebookEdit: 'Editing notebook',
  // User interaction
  AskUserQuestion: 'Asking question',
  // MCP tools (common prefixes)
  mcp__github: 'GitHub',
  mcp__browser: 'Browser',
  mcp__lancedb: 'Vector DB',
  mcp__session: 'Session',
};

// Get display name for a tool (handles MCP prefixes)
export const getToolDisplayName = (toolName: string): string => {
  // Direct match
  if (TOOL_DISPLAY_NAMES[toolName]) {
    return TOOL_DISPLAY_NAMES[toolName];
  }
  // Check MCP prefixes
  for (const [prefix, name] of Object.entries(TOOL_DISPLAY_NAMES)) {
    if (toolName.startsWith(prefix)) {
      return name;
    }
  }
  // Fallback: clean up tool name
  return toolName.replace(/^mcp__\w+__/, '').replace(/_/g, ' ');
};

interface UseWebSocketMessageHandlerProps {
  currentSessionId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSessionLoading: (sessionId: string, loading: boolean) => void;
  setContextUsage: React.Dispatch<React.SetStateAction<Map<string, {
    inputTokens: number;
    contextWindow: number;
    contextPercentage: number;
  }>>>;
  setPendingPlan: (plan: string | null) => void;
  setPendingQuestion: (question: { toolId: string; questions: Question[] } | null) => void;
  setIsPlanMode: (isPlanMode: boolean) => void;
  setCurrentSessionMode: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => void;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  setBackgroundProcesses: React.Dispatch<React.SetStateAction<Map<string, BackgroundProcess[]>>>;
  setLiveTokenCount: (count: number) => void;
  handleActivityProgress: (progress: AIProgressState) => void;
  messageCache: React.MutableRefObject<Map<string, Message[]>>;
  activeLongRunningCommandRef: React.MutableRefObject<string | null>;
  setAutonomProgress?: (progress: any) => void;
}

export function useWebSocketMessageHandler({
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
}: UseWebSocketMessageHandlerProps) {
  return useCallback((message: any) => {
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
      // Report writing state to preview (only on first message)
      handleActivityProgress({
        isActive: true,
        status: 'writing',
        toolDisplayName: 'Responding...',
      });
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
      // Report thinking state to progress bar and preview
      handleActivityProgress({
        isActive: true,
        status: 'thinking',
        toolDisplayName: 'Thinking...',
      });
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

      // Report AI progress to progress bar and preview panel
      const filePath = (toolUseMsg.toolInput.file_path as string) || (toolUseMsg.toolInput.path as string);
      const toolName = toolUseMsg.toolName;
      const isFileEdit = FILE_EDIT_TOOLS.includes(toolName);
      const displayName = getToolDisplayName(toolName);

      // Extract additional context based on tool type
      let contextInfo = filePath;
      if (toolName === 'Bash' && toolUseMsg.toolInput.command) {
        // Show first part of command
        const cmd = String(toolUseMsg.toolInput.command);
        contextInfo = cmd.length > 50 ? cmd.substring(0, 47) + '...' : cmd;
      } else if (toolName === 'WebFetch' && toolUseMsg.toolInput.url) {
        contextInfo = String(toolUseMsg.toolInput.url);
      } else if (toolName === 'WebSearch' && toolUseMsg.toolInput.query) {
        contextInfo = String(toolUseMsg.toolInput.query);
      } else if (toolName === 'Grep' && toolUseMsg.toolInput.pattern) {
        contextInfo = `/${toolUseMsg.toolInput.pattern}/`;
      }

      // Create new action history entry
      const newAction: ActionHistoryEntry = {
        id: toolUseMsg.toolId,
        timestamp: Date.now(),
        tool: toolName,
        toolDisplayName: displayName,
        file: contextInfo,
        status: 'running',
      };

      handleActivityProgress({
        isActive: true,
        currentTool: toolName,
        currentFile: filePath,
        status: 'tool_use',
        toolDisplayName: displayName,
        isFileEdit,
        currentToolId: toolUseMsg.toolId,
        newAction, // Signal to add this action to history
      } as AIProgressState & { newAction: ActionHistoryEntry });

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
        // Reset AI progress for progress bar and preview panel
        handleActivityProgress({
          isActive: false,
          status: 'completed',
        });
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
      // Reset AI progress for progress bar and preview panel with error status
      handleActivityProgress({
        isActive: false,
        status: 'error',
      });

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
        const errorCode = errorCodeMap[errorType] as keyof typeof import('../../../utils/errorMessages').ErrorMessages;
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
    } else if (message.type === 'session_title_updated' && 'newTitle' in message) {
      // Handle session title update from server
      console.log(`📝 Session title updated to: ${message.newTitle}`);
      // Update only the specific session instead of reloading all (prevents UI flash)
      const updatedSessionId = 'sessionId' in message ? message.sessionId : currentSessionId;
      if (updatedSessionId && message.newTitle) {
        setSessions(prev => prev.map(s =>
          s.id === updatedSessionId ? { ...s, title: message.newTitle as string } : s
        ));
      }
    } else if (message.type === 'mode_changed' && 'mode' in message) {
      // Handle session mode change confirmation from server
      const newMode = message.mode as 'general' | 'coder' | 'intense-research' | 'spark';
      console.log(`✅ Mode changed confirmed: ${newMode}`);
      // Update local state to match confirmed mode
      setCurrentSessionMode(newMode);
      // Update sessions list to reflect the mode change
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId ? { ...s, mode: newMode } : s
      ));
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
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];

        const commandBlock = {
          type: 'long_running_command' as const,
          bashId: longRunningMsg.bashId,
          command: longRunningMsg.command,
          commandType: longRunningMsg.commandType,
          description: longRunningMsg.description || longRunningMsg.command,
          startedAt: longRunningMsg.startedAt,
          updates: [] as Array<{ timestamp: number; content: string; isError?: boolean }>,
        };

        // If last message is from assistant, append command block to it
        if (lastMessage && lastMessage.type === 'assistant') {
          const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
          const updatedMessage = {
            ...lastMessage,
            content: [...content, commandBlock]
          };
          return [...prev.slice(0, -1), updatedMessage];
        }

        // Otherwise create new assistant message with command block
        return [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant' as const,
            content: [commandBlock],
            timestamp: new Date().toISOString(),
          },
        ];
      });
    } else if (message.type === 'long_running_command_output' && 'bashId' in message && 'content' in message) {
      // Handle output updates for long-running commands
      const outputMsg = message as {
        type: 'long_running_command_output';
        bashId: string;
        content: string;
        isError?: boolean;
      };

      // Only update if this is the active long-running command
      if (activeLongRunningCommandRef.current === outputMsg.bashId) {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          if (lastMessage && lastMessage.type === 'assistant') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];

            // Find the long_running_command block with matching bashId
            const commandBlockIndex = content.findIndex(
              block => block.type === 'long_running_command' && block.bashId === outputMsg.bashId
            );

            if (commandBlockIndex !== -1) {
              const commandBlock = content[commandBlockIndex];
              if (commandBlock.type === 'long_running_command') {
                // Add new update to the updates array
                const updatedBlock = {
                  ...commandBlock,
                  updates: [...(commandBlock.updates || []), {
                    timestamp: Date.now(),
                    content: outputMsg.content,
                    isError: outputMsg.isError || false,
                  }],
                };

                const updatedContent = [
                  ...content.slice(0, commandBlockIndex),
                  updatedBlock,
                  ...content.slice(commandBlockIndex + 1),
                ];

                const updatedMessage = {
                  ...lastMessage,
                  content: updatedContent,
                };

                return [...prev.slice(0, -1), updatedMessage];
              }
            }
          }

          return prev;
        });
      }
    } else if (message.type === 'long_running_command_completed' && 'bashId' in message) {
      // Handle long-running command completion
      const completedMsg = message as {
        type: 'long_running_command_completed';
        bashId: string;
        exitCode?: number;
      };

      // Clear active command reference if this was the active one
      if (activeLongRunningCommandRef.current === completedMsg.bashId) {
        activeLongRunningCommandRef.current = null;
      }

      // Mark the command as completed in the message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];

        if (lastMessage && lastMessage.type === 'assistant') {
          const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];

          // Find the long_running_command block with matching bashId
          const commandBlockIndex = content.findIndex(
            block => block.type === 'long_running_command' && block.bashId === completedMsg.bashId
          );

          if (commandBlockIndex !== -1) {
            const commandBlock = content[commandBlockIndex];
            if (commandBlock.type === 'long_running_command') {
              // Mark as completed
              const updatedBlock = {
                ...commandBlock,
                completed: true,
                completedAt: Date.now(),
                exitCode: completedMsg.exitCode,
              };

              const updatedContent = [
                ...content.slice(0, commandBlockIndex),
                updatedBlock,
                ...content.slice(commandBlockIndex + 1),
              ];

              const updatedMessage = {
                ...lastMessage,
                content: updatedContent,
              };

              return [...prev.slice(0, -1), updatedMessage];
            }
          }
        }

        return prev;
      });
    } else if (message.type === 'tool_result' && 'toolId' in message && 'result' in message) {
      // Handle tool result messages
      const toolResultMsg = message as { type: 'tool_result'; toolId: string; result: string | Record<string, unknown> | null; isError?: boolean };

      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];

        const toolResultBlock = {
          type: 'tool_result' as const,
          tool_use_id: toolResultMsg.toolId,
          content: typeof toolResultMsg.result === 'string' ? toolResultMsg.result : JSON.stringify(toolResultMsg.result, null, 2),
          is_error: toolResultMsg.isError || false,
        };

        // If last message is assistant, append result to it
        if (lastMessage && lastMessage.type === 'assistant') {
          const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
          const updatedMessage = {
            ...lastMessage,
            content: [...content, toolResultBlock]
          };
          return [...prev.slice(0, -1), updatedMessage];
        }

        // Otherwise create new assistant message with result
        return [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant' as const,
            content: [toolResultBlock],
            timestamp: new Date().toISOString(),
          },
        ];
      });
    } else if (message.type === 'ask_question' && 'toolId' in message && 'questions' in message) {
      // Handle question modal display
      const questionMsg = message as { type: 'ask_question'; toolId: string; questions: Question[] };
      setPendingQuestion({
        toolId: questionMsg.toolId,
        questions: questionMsg.questions,
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
    } else if (message.type === 'ask_user_question' && 'toolId' in message && 'questions' in message) {
      // Handle AskUserQuestion tool - show modal to get user's answers
      const questionMsg = message as {
        type: 'ask_user_question';
        toolId: string;
        questions: Question[];
        sessionId?: string;
      };
      console.log('❓ Received question from Claude:', questionMsg.questions);
      setPendingQuestion({
        toolId: questionMsg.toolId,
        questions: questionMsg.questions,
      });
    } else if (message.type === 'question_answered') {
      // Clear the question modal when answer is confirmed
      setPendingQuestion(null);
    } else if (message.type === 'autonom_progress' && setAutonomProgress) {
      // Handle AUTONOM progress updates (including model selection and error tracking)
      const progressMsg = message as {
        type: 'autonom_progress';
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
      };
      console.log(`🤖 AUTONOM Progress: Step ${progressMsg.stepNumber}/${progressMsg.maxSteps}, Model: ${progressMsg.selectedModel || 'haiku'}, Errors: ${progressMsg.errorCount || 0}, Budget: ${(progressMsg.budgetUsed * 100).toFixed(1)}%`);
      setAutonomProgress({
        stepNumber: progressMsg.stepNumber,
        maxSteps: progressMsg.maxSteps,
        budgetUsed: progressMsg.budgetUsed,
        budgetRemaining: progressMsg.budgetRemaining,
        tokensRemaining: progressMsg.tokensRemaining,
        totalCost: progressMsg.totalCost,
        maxCost: progressMsg.maxCost,
        stepsCompleted: progressMsg.stepsCompleted,
        selectedModel: progressMsg.selectedModel || 'haiku',
        errorCount: progressMsg.errorCount || 0,
        problematicSteps: progressMsg.problematicSteps || [],
      });
    } else if (message.type === 'keepalive') {
      // Keepalive messages are sent every 30s to prevent WebSocket idle timeout
      // during long-running operations. No action needed - just acknowledge receipt.
      // Optionally log for debugging (commented out to reduce noise)
      // console.log(`💓 Keepalive received (${message.elapsedSeconds}s elapsed)`);
    }
  }, [
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
  ]);
}
