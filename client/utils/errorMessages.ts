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

import { toast } from './toast';

/**
 * Centralized error messages: user-friendly + developer-identifiable
 * Format: Brief title + clear description
 */
export const ErrorMessages = {
  // Session/Chat Management
  LOAD_CHATS: {
    title: 'Failed to load chats',
    description: 'Could not retrieve your chat history',
    code: 'E001',
  },
  LOAD_MESSAGES: {
    title: 'Failed to load messages',
    description: 'Could not retrieve chat messages',
    code: 'E002',
  },
  CREATE_CHAT: {
    title: 'Failed to create chat',
    description: 'Could not start a new chat session',
    code: 'E003',
  },
  DELETE_CHAT: {
    title: 'Failed to delete chat',
    description: 'Could not remove the chat',
    code: 'E004',
  },
  RENAME_CHAT: {
    title: 'Failed to rename chat',
    description: 'Could not update chat name',
    code: 'E005',
  },

  // Directory Operations
  CHANGE_DIRECTORY: {
    title: 'Failed to change directory',
    description: 'Could not update working directory',
    code: 'E006',
  },
  INVALID_DIRECTORY: {
    title: 'Invalid directory',
    description: 'Directory does not exist or is inaccessible',
    code: 'E007',
  },
  DIRECTORY_PICKER: {
    title: 'Failed to open directory picker',
    description: 'Could not browse for folders',
    code: 'E008',
  },
  OPEN_FOLDER: {
    title: 'Failed to open folder',
    description: 'Could not open the project folder',
    code: 'E025',
  },
  COPY_PATH: {
    title: 'Failed to copy path',
    description: 'Could not copy the path to clipboard',
    code: 'E026',
  },
  RENAME_FOLDER: {
    title: 'Failed to rename folder',
    description: 'Could not rename the project folder',
    code: 'E027',
  },

  // Permission & Mode
  UPDATE_MODE: {
    title: 'Failed to update mode',
    description: 'Could not change permission settings',
    code: 'E009',
  },

  // WebSocket & Connection
  WEBSOCKET_PARSE: {
    title: 'Message error',
    description: 'Received invalid data from server',
    code: 'E010',
  },
  WEBSOCKET_DISCONNECT: {
    title: 'Connection lost',
    description: 'Reconnecting to server...',
    code: 'E011',
  },
  SEND_MESSAGE: {
    title: 'Failed to send message',
    description: 'Could not send your message',
    code: 'E012',
  },

  // Copy Operations
  COPY_FAILED: {
    title: 'Failed to copy',
    description: 'Could not copy to clipboard',
    code: 'E013',
  },

  // Server Errors (from WebSocket)
  SESSION_NOT_FOUND: {
    title: 'Chat not found',
    description: 'This chat session no longer exists',
    code: 'E014',
  },
  PROVIDER_ERROR: {
    title: 'Configuration error',
    description: 'AI provider setup is incorrect',
    code: 'E015',
  },
  AI_ERROR: {
    title: 'AI request failed',
    description: 'Could not get AI response',
    code: 'E016',
  },

  // API-Specific Errors
  API_TIMEOUT: {
    title: 'Request timed out',
    description: 'The AI didn\'t respond in time. Try again or simplify your request.',
    code: 'E017',
  },
  API_RATE_LIMIT: {
    title: 'Rate limit exceeded',
    description: 'You\'ve sent too many requests. Please wait a moment.',
    code: 'E018',
  },
  API_OVERLOADED: {
    title: 'Service overloaded',
    description: 'Claude\'s servers are busy. Retrying automatically...',
    code: 'E019',
  },
  API_AUTHENTICATION: {
    title: 'Invalid API key',
    description: 'Please check your API key configuration.',
    code: 'E020',
  },
  API_PERMISSION: {
    title: 'Permission denied',
    description: 'Your API key cannot access this model.',
    code: 'E021',
  },
  API_INVALID_REQUEST: {
    title: 'Invalid request',
    description: 'There\'s an issue with the request format.',
    code: 'E022',
  },
  API_REQUEST_TOO_LARGE: {
    title: 'Request too large',
    description: 'Your message or attachments exceed 32 MB.',
    code: 'E023',
  },
  API_NETWORK: {
    title: 'Network error',
    description: 'Connection failed. Check your internet.',
    code: 'E024',
  },
};

/**
 * Show error toast with consistent formatting
 * @param error - Error key from ErrorMessages
 * @param details - Optional technical details for developer (shown in console)
 */
export function showError(
  error: keyof typeof ErrorMessages,
  details?: string
) {
  const { title, description, code } = ErrorMessages[error];

  // Show user-friendly toast
  toast.error(title, { description });

  // Log technical details for developer
  if (details) {
    console.error(`[${code}] ${title}:`, details);
  } else {
    console.error(`[${code}] ${title}`);
  }
}

/**
 * Show generic error with custom message
 */
export function showGenericError(title: string, description?: string, code?: string) {
  toast.error(title, { description });
  console.error(`[${code || 'E999'}] ${title}:`, description);
}
