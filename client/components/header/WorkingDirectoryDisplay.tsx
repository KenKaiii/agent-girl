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

import React, { useState, useRef } from 'react';
import { FolderOpen, Copy, Check } from 'lucide-react';
import { showError } from '../../utils/errorMessages';

interface WorkingDirectoryDisplayProps {
  directory: string;
  sessionId?: string;
  onChangeDirectory?: (sessionId: string, newDirectory: string) => Promise<void>;
}

export function WorkingDirectoryDisplay({ directory, sessionId, onChangeDirectory }: WorkingDirectoryDisplayProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract just the chat folder name (e.g., "chat-a1b2c3d4")
  const getFolderName = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1];
  };

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
      <span
        className="font-mono"
        style={{ color: 'rgb(var(--text-secondary))' }}
      >
        {getFolderName(directory)}
      </span>
      <div className="flex gap-1">
        {sessionId && onChangeDirectory && (
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
        <button
          onClick={handleOpenFolder}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Open project folder"
          title="Open in Finder"
        >
          <FolderOpen className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
        </button>
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
      </div>
    </div>
  );
}
