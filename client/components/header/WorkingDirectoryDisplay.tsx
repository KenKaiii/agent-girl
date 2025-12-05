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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FolderOpen, Copy, Check, Pencil, X as XIcon, CheckCircle } from 'lucide-react';
import { showError } from '../../utils/errorMessages';

interface WorkingDirectoryDisplayProps {
  directory: string;
  sessionId?: string;
  onChangeDirectory?: (sessionId: string, newDirectory: string) => Promise<void>;
  onRenameFolder?: (sessionId: string, newName: string) => Promise<void>;
}

export function WorkingDirectoryDisplay({ directory, sessionId, onChangeDirectory, onRenameFolder }: WorkingDirectoryDisplayProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract just the chat folder name (e.g., "chat-a1b2c3d4")
  const getFolderName = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1];
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Start editing
  const handleStartEdit = useCallback(() => {
    setEditName(getFolderName(directory));
    setIsEditing(true);
  }, [directory]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditName('');
  }, []);

  // Handle rename
  const handleRename = useCallback(async () => {
    if (!sessionId || !editName.trim() || isRenaming) return;

    const trimmedName = editName.trim();
    const currentName = getFolderName(directory);

    // Don't rename if name hasn't changed
    if (trimmedName === currentName) {
      handleCancelEdit();
      return;
    }

    setIsRenaming(true);
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.host}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: trimmedName }),
      });

      const result = await response.json() as { success: boolean; error?: string };

      if (result.success) {
        setIsEditing(false);
        setEditName('');
        // Call callback if provided
        if (onRenameFolder) {
          await onRenameFolder(sessionId, trimmedName);
        }
      } else {
        showError('RENAME_FOLDER', result.error || 'Failed to rename folder');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('RENAME_FOLDER', errorMsg);
    } finally {
      setIsRenaming(false);
    }
  }, [sessionId, editName, directory, isRenaming, handleCancelEdit, onRenameFolder]);

  // Handle keyboard events in edit mode
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleRename, handleCancelEdit]);

  const handleChangeDirectory = async () => {
    if (!sessionId || !onChangeDirectory) return;

    setIsChanging(true);
    try {
      // Call server to open native directory picker (dynamic URL works on any port)
      const response = await fetch(`${window.location.protocol}//${window.location.host}/api/pick-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json() as { success: boolean; path?: string; cancelled?: boolean; error?: string };

      if (result.success && result.path) {
        // User selected a directory
        await onChangeDirectory(sessionId, result.path);
      } else if (result.cancelled) {
        // User cancelled the dialog - do nothing
        console.log('Directory picker cancelled');
      } else {
        // Error occurred
        showError('DIRECTORY_PICKER', result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('DIRECTORY_PICKER', errorMsg);
    } finally {
      setIsChanging(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.host}/api/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: directory }),
      });

      const result = await response.json() as { success: boolean; error?: string };

      if (!result.success) {
        showError('OPEN_FOLDER', result.error || 'Failed to open folder');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('OPEN_FOLDER', errorMsg);
    }
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(directory);
      setCopied(true);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to copy';
      showError('COPY_PATH', errorMsg);
    }
  };

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowTooltip(false);
  };

  return (
    <div className="flex items-center gap-2 py-2 text-xs group relative" title={directory}>
      {/* Folder name - editable or static */}
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCancelEdit}
            disabled={isRenaming}
            className="font-mono bg-transparent border border-blue-500/50 rounded px-1 py-0.5 text-xs outline-none focus:border-blue-500"
            style={{
              color: 'rgb(var(--text-primary))',
              minWidth: '100px',
              maxWidth: '200px',
            }}
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleRename}
            disabled={isRenaming || !editName.trim()}
            className="p-0.5 hover:bg-green-500/20 rounded transition-colors"
            title="Confirm rename"
          >
            <CheckCircle className="w-3 h-3" style={{ color: isRenaming ? 'rgb(var(--text-secondary))' : 'rgb(34, 197, 94)' }} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCancelEdit}
            disabled={isRenaming}
            className="p-0.5 hover:bg-red-500/20 rounded transition-colors"
            title="Cancel"
          >
            <XIcon className="w-3 h-3" style={{ color: 'rgb(239, 68, 68)' }} />
          </button>
        </div>
      ) : (
        <span
          className="font-mono cursor-pointer hover:text-blue-400 transition-colors"
          style={{ color: 'rgb(var(--text-secondary))' }}
          onClick={sessionId ? handleStartEdit : undefined}
          title={sessionId ? 'Click to rename' : undefined}
        >
          {getFolderName(directory)}
        </span>
      )}
      <div className="flex gap-1">
        {/* Rename button - only show when not editing */}
        {sessionId && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Rename folder"
            title="Rename folder"
          >
            <Pencil className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
          </button>
        )}
        {sessionId && onChangeDirectory && !isEditing && (
          <button
            onClick={handleChangeDirectory}
            disabled={isChanging}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Change working directory"
            title="Select custom directory"
          >
            <FolderOpen className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
          </button>
        )}
        {!isEditing && (
          <button
            onClick={handleOpenFolder}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Open project folder"
            title="Open in Finder"
          >
            <FolderOpen className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
          </button>
        )}
        {!isEditing && (
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={handleCopyPath}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Copy project path"
              title={copied ? 'Copied!' : 'Copy path'}
            >
              {copied ? (
                <Check className="w-3 h-3" style={{ color: 'rgb(34, 197, 94)' }} />
              ) : (
                <Copy className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
              )}
            </button>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                Click to copy path
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
