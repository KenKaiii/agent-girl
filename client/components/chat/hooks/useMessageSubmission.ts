/**
 * Agent Girl - Message submission logic hook
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useCallback } from 'react';
import type { Message, FileAttachment } from '../../message/types';
import { toast } from '../../../utils/toast';
import { showError } from '../../../utils/errorMessages';

interface UseMessageSubmissionProps {
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentSessionMode: React.Dispatch<React.SetStateAction<'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build'>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  selectedModel: string;
  isPlanMode: boolean;
  isAutonomMode: boolean;
  isConnected: boolean;
  isLoading: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSessionLoading: (sessionId: string, loading: boolean) => void;
  setAutonomProgress: React.Dispatch<React.SetStateAction<unknown>>;
  loadSessions: () => Promise<void>;
  loadCommandsLazy: (sessionId: string, workingDirectory?: string) => void;
  sessionAPI: {
    createSession: (workingDirectory?: string, mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => Promise<{ id: string; mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build'; working_directory?: string } | null>;
    updatePermissionMode: (sessionId: string, mode: string) => Promise<{ success: boolean }>;
  };
  sendMessage: (message: unknown) => void;
  stopGeneration: (sessionId: string) => void;
}

export function useMessageSubmission({
  currentSessionId,
  setCurrentSessionId,
  setCurrentSessionMode,
  inputValue,
  setInputValue,
  selectedModel,
  isPlanMode,
  isAutonomMode,
  isConnected,
  isLoading,
  setMessages,
  setSessionLoading,
  setAutonomProgress,
  loadSessions,
  loadCommandsLazy,
  sessionAPI,
  sendMessage,
  stopGeneration,
}: UseMessageSubmissionProps) {
  const handleSubmit = useCallback(async (
    files?: FileAttachment[],
    mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build',
    messageOverride?: string
  ) => {
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
  }, [
    inputValue,
    isConnected,
    isLoading,
    currentSessionId,
    selectedModel,
    isPlanMode,
    isAutonomMode,
    setInputValue,
    setMessages,
    setSessionLoading,
    setAutonomProgress,
    setCurrentSessionId,
    setCurrentSessionMode,
    loadSessions,
    loadCommandsLazy,
    sessionAPI,
    sendMessage
  ]);

  const handleStop = useCallback(() => {
    if (currentSessionId) {
      stopGeneration(currentSessionId);
      setSessionLoading(currentSessionId, false);
    }
  }, [currentSessionId, stopGeneration, setSessionLoading]);

  return {
    handleSubmit,
    handleStop,
  };
}
