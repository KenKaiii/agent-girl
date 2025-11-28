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

import { useState, useCallback } from 'react';
import { toast } from '../utils/toast';
import { showError } from '../utils/errorMessages';

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  working_directory: string;
  permission_mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
  mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified';
  context_input_tokens?: number;
  context_window?: number;
  context_percentage?: number;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Use dynamic URL based on current window location (works on any port)
const API_BASE = `${window.location.protocol}//${window.location.host}/api`;

export function useSessionAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all sessions
   */
  const fetchSessions = useCallback(async (): Promise<Session[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as { sessions: Session[]; warning?: string };

      // Show warning if directories were recreated
      if (data.warning) {
        console.warn('⚠️  Directory warning:', data.warning);
        // Show toast notification to user
        toast.success(`${data.warning}`, {
          description: 'Some chat folders were missing and have been recreated.',
          duration: 5000,
        });
      }

      return data.sessions;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMsg);
      showError('LOAD_CHATS', errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch messages for a specific session
   */
  const fetchSessionMessages = useCallback(async (sessionId: string): Promise<SessionMessage[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const messages = await response.json() as SessionMessage[];
      return messages;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMsg);
      showError('LOAD_MESSAGES', errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new session
   */
  const createSession = useCallback(async (title?: string, mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified'): Promise<Session | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title || 'New Chat', mode: mode || 'general' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const session = await response.json() as Session;
      return session;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMsg);
      showError('CREATE_CHAT', errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMsg);
      showError('DELETE_CHAT', errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Rename a session folder (and title)
   */
  const renameSession = useCallback(async (sessionId: string, newFolderName: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName: newFolderName }),
      });

      const result = await response.json() as { success: boolean; error?: string; session?: Session };

      if (!response.ok || !result.success) {
        const errorMsg = result.error || `HTTP error! status: ${response.status}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to rename session';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update working directory for a session
   */
  const updateWorkingDirectory = useCallback(async (sessionId: string, directory: string): Promise<{ success: boolean; session?: Session; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/directory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workingDirectory: directory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { success: boolean; session?: Session; error?: string };
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update working directory';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate a directory path
   */
  const validateDirectory = useCallback(async (directory: string): Promise<{ valid: boolean; error?: string; expanded?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/validate-directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { valid: boolean; error?: string; expanded?: string };
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to validate directory';
      setError(errorMsg);
      showError('INVALID_DIRECTORY', errorMsg);
      return { valid: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update permission mode for a session
   */
  const updatePermissionMode = useCallback(async (
    sessionId: string,
    mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'
  ): Promise<{ success: boolean; session?: Session; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/mode`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { success: boolean; session?: Session; error?: string };
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update permission mode';
      setError(errorMsg);
      showError('UPDATE_MODE', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update session chat mode (general, coder, intense-research, spark, unified)
   */
  const updateSessionMode = useCallback(async (
    sessionId: string,
    mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified'
  ): Promise<{ success: boolean; session?: Session; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/chat-mode`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { success: boolean; session?: Session; error?: string };
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update session mode';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchSessions,
    fetchSessionMessages,
    createSession,
    deleteSession,
    renameSession,
    updateWorkingDirectory,
    validateDirectory,
    updatePermissionMode,
    updateSessionMode,
  };
}
