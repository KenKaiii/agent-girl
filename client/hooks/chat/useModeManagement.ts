/**
 * Agent Girl - Mode management hook (Plan/Autonom modes)
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useCallback } from 'react';
import type { Message } from '../../components/message/types';
import type { Question } from '../../components/question/QuestionModal';

interface UseModeManagementProps {
  currentSessionId: string | null;
  selectedModel: string;
  isSessionLoading: (sessionId: string | null) => boolean;
  setSessionLoading: (sessionId: string, loading: boolean) => void;
  sessionAPI: {
    updatePermissionMode: (sessionId: string, mode: string) => Promise<{ success: boolean }>;
    updateSessionMode: (sessionId: string, mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => Promise<{ success: boolean; error?: string }>;
  };
  sendMessage: (message: unknown) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSessions: React.Dispatch<React.SetStateAction<Array<{ id: string; mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build' }>>>;
}

export function useModeManagement({
  currentSessionId,
  selectedModel,
  isSessionLoading,
  setSessionLoading,
  sessionAPI,
  sendMessage,
  setMessages,
  setSessions,
}: UseModeManagementProps) {
  const [isPlanMode, setIsPlanMode] = useState<boolean>(false);
  const [isAutonomMode, setIsAutonomMode] = useState<boolean>(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<{
    toolId: string;
    questions: Question[];
  } | null>(null);

  // Handle plan mode toggle
  const handleTogglePlanMode = useCallback(async () => {
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
  }, [isPlanMode, currentSessionId, sessionAPI, isSessionLoading, sendMessage]);

  // Handle autonom mode toggle
  const handleToggleAutonomMode = useCallback(async () => {
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
  }, [isAutonomMode, isPlanMode, currentSessionId, sessionAPI, isSessionLoading, sendMessage]);

  // Handle session mode change (general, coder, intense-research, spark, unified, build)
  const handleModeChange = useCallback(async (newMode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => {
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
  }, [currentSessionId, sessionAPI, isSessionLoading, sendMessage, setSessions]);

  // Handle plan approval
  const handleApprovePlan = useCallback(() => {
    if (!currentSessionId) return;

    // Send approval to server to switch mode
    sendMessage({
      type: 'approve_plan',
      sessionId: currentSessionId
    });

    // Close modal
    setPendingPlan(null);

    // Immediately send continuation message to start execution
    setSessionLoading(currentSessionId, true);

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
  }, [currentSessionId, selectedModel, sendMessage, setSessionLoading, setMessages]);

  // Handle plan rejection
  const handleRejectPlan = useCallback(() => {
    setPendingPlan(null);
    if (currentSessionId) setSessionLoading(currentSessionId, false);
  }, [currentSessionId, setSessionLoading]);

  // Handle question submission
  const handleQuestionSubmit = useCallback((toolId: string, answers: Record<string, string>) => {
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
  }, [currentSessionId, sendMessage, setMessages]);

  // Handle question cancel - send cancellation to server
  const handleQuestionCancel = useCallback((toolId: string) => {
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
  }, [currentSessionId, sendMessage, setSessionLoading]);

  return {
    // State
    isPlanMode,
    setIsPlanMode,
    isAutonomMode,
    setIsAutonomMode,
    pendingPlan,
    setPendingPlan,
    pendingQuestion,
    setPendingQuestion,

    // Handlers
    handleTogglePlanMode,
    handleToggleAutonomMode,
    handleModeChange,
    handleApprovePlan,
    handleRejectPlan,
    handleQuestionSubmit,
    handleQuestionCancel,
  };
}
