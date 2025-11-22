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

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxHighlighter, vscDarkPlus } from '../../utils/syntaxHighlighter';
import { AssistantMessage as AssistantMessageType, ToolUseBlock, TextBlock, TodoItem, LongRunningCommandBlock } from './types';
import { ThinkingBlock } from './ThinkingBlock';
import { CodeBlockWithCopy } from './CodeBlockWithCopy';
import { URLBadge } from './URLBadge';
import { MermaidDiagram } from './MermaidDiagram';
import { Shield, FileText, FolderOpen } from 'lucide-react';
import { showError } from '../../utils/errorMessages';

// Helper to render text with file path detection
function TextWithFilePaths({ children }: { children: React.ReactNode }) {
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  // Helper to convert text with newlines to React nodes
  const textToNodes = (text: string, keyPrefix: string): React.ReactNode[] => {
    if (!text.includes('\n')) return [text];
    return text.split('\n').flatMap((part, i, arr) =>
      i < arr.length - 1 ? [part, <br key={`${keyPrefix}-br-${i}`} />] : [part]
    );
  };

  // Regex to match file paths (Unix absolute, Windows, relative paths, and standalone filenames)
  // Patterns: /Users/..., C:\..., foo/bar/..., FILENAME.ext
  const pathRegex = /((?:\/(?:Users|home|var|tmp|etc|opt|usr|mnt|media|Documents|Desktop|Downloads)[^\s<>"|]*)|(?:[A-Za-z]:\\[^\s<>"|]*)|(?:(?:\.\.?\/)?[\w.-]+\/[\w./@-]+)|(?:[A-Z_][\w_-]*\.(?:md|txt|json|yml|yaml|sh|py|js|ts|jsx|tsx|css|html|xml|toml|ini|cfg|conf|log|env|gitignore|dockerignore)))/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pathRegex.exec(children)) !== null) {
    // Add text before the match (with newline handling)
    if (match.index > lastIndex) {
      const textBefore = children.slice(lastIndex, match.index);
      parts.push(...textToNodes(textBefore, `pre-${match.index}`));
    }

    // Add the path with action buttons
    const filePath = match[1];
    parts.push(
      <span key={match.index} className="inline-flex items-center gap-0.5">
        <span>{filePath}</span>
        <FilePathActions filePath={filePath} />
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text (with newline handling)
  if (lastIndex < children.length) {
    const textAfter = children.slice(lastIndex);
    parts.push(...textToNodes(textAfter, 'post'));
  }

  return parts.length > 0 ? <>{parts}</> : <>{children}</>;
}

// File path action buttons component
function FilePathActions({ filePath }: { filePath: string }) {
  const handleOpenFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!result.success) {
        showError('OPEN_FOLDER', result.error || 'Failed to open file');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('OPEN_FOLDER', errorMsg);
    }
  };

  const handleOpenFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/open-file-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
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

  return (
    <div className="flex gap-0.5 ml-1 shrink-0">
      <button
        onClick={handleOpenFile}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        title="Open file"
      >
        <FileText className="w-3 h-3 text-white/40 hover:text-white/80" />
      </button>
      <button
        onClick={handleOpenFolder}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        title="Show in folder"
      >
        <FolderOpen className="w-3 h-3 text-white/40 hover:text-white/80" />
      </button>
    </div>
  );
}

interface AssistantMessageProps {
  message: AssistantMessageType;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

// Tool icon component based on tool type
function ToolIcon({ toolName }: { toolName: string }) {
  const getIcon = () => {
    // MCP tools (e.g., mcp__web-search-prime__search)
    if (toolName.startsWith('mcp__')) {
      const server = toolName.split('__')[1] || '';
      // Use globe icon for web-search, generic MCP icon for others
      if (server === 'web-search-prime') {
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        );
      }
      return (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      );
    }

    switch (toolName) {
      case 'TodoWrite':
        return (
          <svg className="size-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32" strokeWidth="1.5">
            <path d="M266.304 104.544l-105.408 105.92-41.408-41.6a31.904 31.904 0 0 0-54.496 13.888c-2.88 11.424 0.672 23.552 9.28 31.552l64 64.32a31.904 31.904 0 0 0 45.216 0l128-128.64a32.256 32.256 0 0 0-0.864-44.576 31.904 31.904 0 0 0-44.352-0.864h0.032zM176 384a112 112 0 1 1 0 224 112 112 0 0 1 0-224z m9.376 64.8a48.064 48.064 0 1 0 24.416 81.216 48.064 48.064 0 0 0-24.416-81.216zM928.064 160H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64zM928.064 480H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64zM176 720a112 112 0 1 1 0 224 112 112 0 0 1 0-224z m9.376 64.8a48.064 48.064 0 1 0 24.416 81.216 48.064 48.064 0 0 0-24.416-81.216zM928.064 800H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64z" fill="currentColor" stroke="currentColor"/>
          </svg>
        );
      case 'Read':
      case 'Write':
      case 'Edit':
      case 'MultiEdit':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
        );
      case 'Bash':
      case 'BashOutput':
      case 'KillShell':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M6 8l4 4-4 4M12 16h6"/>
          </svg>
        );
      case 'WebSearch':
      case 'WebFetch':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        );
      case 'Task':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        );
      case 'NotebookEdit':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
    }
  };

  return <div className="flex items-center">{getIcon()}</div>;
}

// Bash-specific tool component matching bash.md design
function BashToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Terminal icon */}
          <svg className="size-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" strokeWidth="2">
            <path d="M282.88 788.48l-35.84-35.84L486.4 512c-42.24-38.4-142.08-130.56-225.28-215.04L243.2 279.04l35.84-35.84 17.92 17.92c107.52 107.52 241.92 230.4 243.2 231.68 5.12 5.12 7.68 11.52 8.96 17.92 0 6.4-2.56 14.08-7.68 19.2L282.88 788.48zM503.04 733.44h281.6v51.2h-281.6v-51.2z" fill="currentColor" />
          </svg>
          <span className="text-sm font-medium leading-6">Shell</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.command as string}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Command:</span>
            <div className="font-mono text-sm mt-1 bg-black/20 px-2 py-1 rounded">
              <span className="text-[#2ddc44]">$</span>{' '}
              <span className="text-white">{input.command}</span>
            </div>
          </div>
          {input.description && (
            <div>
              <span className="text-xs font-semibold text-white/60">Description:</span>
              <div className="text-sm mt-1">{input.description as string}</div>
            </div>
          )}
          {input.timeout && (
            <div>
              <span className="text-xs font-semibold text-white/60">Timeout:</span>
              <div className="text-sm mt-1">{input.timeout as number}ms</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// BashOutput tool component for retrieving output from background shells
function BashOutputToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Terminal icon */}
          <svg className="size-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" strokeWidth="2">
            <path d="M282.88 788.48l-35.84-35.84L486.4 512c-42.24-38.4-142.08-130.56-225.28-215.04L243.2 279.04l35.84-35.84 17.92 17.92c107.52 107.52 241.92 230.4 243.2 231.68 5.12 5.12 7.68 11.52 8.96 17.92 0 6.4-2.56 14.08-7.68 19.2L282.88 788.48zM503.04 733.44h281.6v51.2h-281.6v-51.2z" fill="currentColor" />
          </svg>
          <span className="text-sm font-medium leading-6">Shell Output</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.bash_id ? `Shell ${input.bash_id}` : 'Retrieve output'}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Shell ID:</span>
            <div className="font-mono text-sm mt-1 bg-black/20 px-2 py-1 rounded">
              {input.bash_id as string}
            </div>
          </div>
          {input.filter ? (
            <div>
              <span className="text-xs font-semibold text-white/60">Filter:</span>
              <div className="text-sm mt-1 font-mono">{String(input.filter)}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// KillShell tool component for terminating background shells
function KillShellToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Terminal icon with X */}
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M8 9l8 8M16 9l-8 8"/>
          </svg>
          <span className="text-sm font-medium leading-6">Kill Shell</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.shell_id ? `Shell ${input.shell_id}` : 'Terminate shell'}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Shell ID:</span>
            <div className="font-mono text-sm mt-1 bg-black/20 px-2 py-1 rounded">
              {input.shell_id as string}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Web tool component (WebSearch/WebFetch) matching edit-write-update.md design
function WebToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Globe icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium leading-6">{toolUse.name}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {toolUse.name === 'WebSearch'
              ? (input.query as string)
              : (input.url as string)}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          {toolUse.name === 'WebSearch' ? (
            <>
              <div>
                <span className="text-xs font-semibold text-white/60">Query:</span>
                <div className="text-sm mt-1">{input.query as string}</div>
              </div>
              {input.allowed_domains && (input.allowed_domains as string[]).length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-white/60">Allowed Domains:</span>
                  <div className="text-sm mt-1">{(input.allowed_domains as string[]).join(', ')}</div>
                </div>
              )}
              {input.blocked_domains && (input.blocked_domains as string[]).length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-white/60">Blocked Domains:</span>
                  <div className="text-sm mt-1">{(input.blocked_domains as string[]).join(', ')}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <span className="text-xs font-semibold text-white/60">URL:</span>
                <div className="text-sm mt-1 break-all font-mono">{input.url as string}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-white/60">Prompt:</span>
                <div className="text-sm mt-1">{input.prompt as string}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Read tool component
function ReadToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Document icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium leading-6">Read</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.file_path as string}
          </span>
          <FilePathActions filePath={input.file_path as string} />
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">File Path:</span>
            <div className="text-sm mt-1 font-mono flex items-center gap-2">
              {input.file_path as string}
              <FilePathActions filePath={input.file_path as string} />
            </div>
          </div>
          {input.offset && (
            <div>
              <span className="text-xs font-semibold text-white/60">Offset:</span>
              <div className="text-sm mt-1">{input.offset} lines</div>
            </div>
          )}
          {input.limit && (
            <div>
              <span className="text-xs font-semibold text-white/60">Limit:</span>
              <div className="text-sm mt-1">{input.limit} lines</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Grep tool component
function GrepToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Search icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium leading-6">Grep</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.pattern as string}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Pattern:</span>
            <div className="text-sm mt-1 font-mono bg-yellow-500/10 px-2 py-1 rounded">{input.pattern as string}</div>
          </div>
          {input.path && (
            <div>
              <span className="text-xs font-semibold text-white/60">Path:</span>
              <div className="text-sm mt-1 font-mono">{input.path as string}</div>
            </div>
          )}
          {input.glob && (
            <div>
              <span className="text-xs font-semibold text-white/60">Glob:</span>
              <div className="text-sm mt-1 font-mono">{input.glob as string}</div>
            </div>
          )}
          {input.output_mode && (
            <div>
              <span className="text-xs font-semibold text-white/60">Mode:</span>
              <div className="text-sm mt-1">{input.output_mode as string}</div>
            </div>
          )}
          {(input['-i'] || input['-n'] || input.multiline) && (
            <div>
              <span className="text-xs font-semibold text-white/60">Options:</span>
              <div className="flex gap-2 mt-1">
                {input['-i'] && <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded">case-insensitive</span>}
                {input['-n'] && <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded">line-numbers</span>}
                {input.multiline && <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded">multiline</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Glob tool component
function GlobToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Files icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium leading-6">Glob</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.pattern as string}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Pattern:</span>
            <div className="text-sm mt-1 font-mono">{input.pattern as string}</div>
          </div>
          {input.path && (
            <div>
              <span className="text-xs font-semibold text-white/60">Path:</span>
              <div className="text-sm mt-1 font-mono">{input.path as string}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Task tool component
function TaskToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Defensive data access
  let input: Record<string, unknown> | undefined, nestedToolsCount: number | undefined, agentName, gradientClass;

  try {
    input = toolUse.input || {};
    nestedToolsCount = toolUse.nestedTools?.length || 0;

    // Hash tool ID to randomly pick a gradient (1-10) - each spawn gets unique color
    const getAgentGradientClass = (toolId: string): string => {
      try {
        let hash = 0;
        for (let i = 0; i < toolId.length; i++) {
          hash = ((hash << 5) - hash) + toolId.charCodeAt(i);
          hash = hash & hash; // Convert to 32bit integer
        }
        const gradientNum = (Math.abs(hash) % 10) + 1;
        return `agent-gradient-${gradientNum}`;
      } catch {
        return 'agent-gradient-1';
      }
    };

    agentName = String(input.subagent_type || 'Unknown Agent');
    gradientClass = getAgentGradientClass(toolUse.id || 'default');
  } catch (e) {
    setError(e as Error);
  }

  // Error state rendering
  if (error) {
    return (
      <div className="w-full border border-red-500/30 rounded-xl my-3 p-4 bg-red-900/20">
        <div className="text-sm text-red-400">
          <strong>Task Tool Error:</strong> {error.message}
        </div>
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer">View Details</summary>
          <pre className="mt-2 p-2 bg-black/30 rounded overflow-auto max-h-40">
            {error.stack}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Robot icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 9.75A.75.75 0 1 1 9 8.25.75.75 0 0 1 9 9.75zM15 9.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" fill="currentColor"/>
            <path d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75zM7.5 6h9A2.25 2.25 0 0 1 18.75 8.25v7.5A2.25 2.25 0 0 1 16.5 18h-9a2.25 2.25 0 0 1-2.25-2.25v-7.5A2.25 2.25 0 0 1 7.5 6zM6 19.5h12M8.25 19.5v1.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75v-1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12.75h6a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .75-.75z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={`text-sm leading-6 ${gradientClass}`}>{agentName}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {nestedToolsCount && nestedToolsCount > 0 ? `Used ${nestedToolsCount} tool${nestedToolsCount !== 1 ? 's' : ''}` : 'Running...'}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => {
              try {
                setIsExpanded(!isExpanded);
              } catch (e) {
                setError(e as Error);
              }
            }}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-3">
          {(() => {
            try {
              return (
                <>
                  {input?.subagent_type && (
                    <div>
                      <span className="text-xs font-semibold text-white/60">Agent Type:</span>
                      <div className="text-sm mt-1">{String(input.subagent_type)}</div>
                    </div>
                  )}
                  {input?.description && (
                    <div>
                      <span className="text-xs font-semibold text-white/60">Task Description:</span>
                      <div className="text-sm mt-1">{String(input.description)}</div>
                    </div>
                  )}
                  {input?.prompt && (
                    <div>
                      <span className="text-xs font-semibold text-white/60">Task Prompt:</span>
                      <div className="text-sm mt-1 max-h-32 overflow-y-auto bg-white/60 dark:bg-black/20 p-2 rounded whitespace-pre-wrap break-words">
                        {String(input.prompt).substring(0, 5000)}
                        {String(input.prompt).length > 5000 && (
                          <span className="text-xs text-white/40"> (truncated)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Nested tools from spawned agent */}
                  {nestedToolsCount && nestedToolsCount > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-white/60">Tools Used ({nestedToolsCount}):</span>
                      <div className="mt-2 space-y-2">
                        {toolUse.nestedTools?.map((nestedTool, index) => {
                          try {
                            return <NestedToolDisplay key={nestedTool.id || index} toolUse={nestedTool} />;
                          } catch (e) {
                            return (
                              <div key={index} className="text-xs text-red-500 p-2 bg-red-900/20 rounded">
                                Error rendering tool: {(e as Error).message}
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            } catch (e) {
              return (
                <div className="text-sm text-red-400">
                  Error rendering content: {(e as Error).message}
                </div>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}

// Nested tool display (simplified version for tools within Task)
function NestedToolDisplay({ toolUse }: { toolUse: ToolUseBlock }) {
  try {
    if (!toolUse || !toolUse.name) {
      return (
        <div className="border border-red-500/30 rounded-lg bg-red-900/20 p-2">
          <div className="text-xs text-red-400">
            Invalid tool data
          </div>
        </div>
      );
    }

    return (
      <div className="border border-black/5 dark:border-white/5 rounded-lg bg-white/5 p-2">
        <div className="flex items-center gap-2">
          <ToolIcon toolName={toolUse.name} />
          <span className="text-xs font-medium">{toolUse.name}</span>
          <span className="text-xs text-white/40">
            {getToolSummary(toolUse)}
          </span>
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="border border-red-500/30 rounded-lg bg-red-900/20 p-2">
        <div className="text-xs text-red-400">
          Error: {(e as Error).message}
        </div>
      </div>
    );
  }
}

// Get a one-line summary of a tool's usage
function getToolSummary(toolUse: ToolUseBlock): string {
  try {
    const input = toolUse.input;

    switch (toolUse.name) {
      case 'Read':
        return String(input.file_path || '');
      case 'Write':
      case 'Edit':
        return String(input.file_path || '');
      case 'Bash':
        return String(input.command || '').substring(0, 50);
      case 'BashOutput':
        return `Shell ${input.bash_id || 'output'}`;
      case 'KillShell':
        return `Shell ${input.shell_id || 'terminated'}`;
      case 'Grep':
        return `"${input.pattern}" in ${input.path || 'project'}`;
      case 'Glob':
        return String(input.pattern || '');
      case 'WebSearch':
      case 'WebFetch':
        return String(input.query || input.url || '');
      case 'Task':
        return String(input.subagent_type || '');
      case 'TodoWrite': {
        // TodoWrite has an array of todos, show count
        const todos = input.todos as Array<unknown> || [];
        return `${todos.length} task${todos.length !== 1 ? 's' : ''}`;
      }
      case 'NotebookEdit':
        return String(input.notebook_path || '');
      default: {
        // Safely convert any value to string
        const firstValue = Object.values(input)[0];
        if (typeof firstValue === 'string') {
          return firstValue;
        }
        if (typeof firstValue === 'number' || typeof firstValue === 'boolean') {
          return String(firstValue);
        }
        if (Array.isArray(firstValue)) {
          return `${firstValue.length} items`;
        }
        if (typeof firstValue === 'object' && firstValue !== null) {
          return JSON.stringify(firstValue).substring(0, 30);
        }
        return '';
      }
    }
  } catch {
    return '';
  }
}

// MCP tool component (for tools like mcp__web-search-prime__search)
function McpToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  // Parse MCP tool name: mcp__server-name__tool-name -> { server: "server-name", tool: "tool-name" }
  const parseMcpName = (name: string) => {
    const parts = name.split('__');
    if (parts.length >= 3 && parts[0] === 'mcp') {
      return {
        server: parts[1],
        tool: parts.slice(2).join('__'),
      };
    }
    return { server: 'unknown', tool: name };
  };

  const { server, tool } = parseMcpName(toolUse.name);

  // Get display name for tool
  const getDisplayName = () => {
    if (server === 'web-search-prime') return 'Web Search';
    return tool.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get main parameter to display
  const getMainParam = () => {
    if (input.query) return input.query as string;
    if (input.url) return input.url as string;
    if (input.search_query) return input.search_query as string;
    return JSON.stringify(input);
  };

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Globe icon for web search, default icon for others */}
          {server === 'web-search-prime' ? (
            <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span className="text-sm font-medium leading-6">{getDisplayName()}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {getMainParam()}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">MCP Server:</span>
            <div className="text-sm mt-1">{server}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-white/60">Tool:</span>
            <div className="text-sm mt-1">{tool}</div>
          </div>
          {Object.entries(input).map(([key, value]) => (
            <div key={key}>
              <span className="text-xs font-semibold text-white/60">{key}:</span>
              <div className="text-sm mt-1 break-all">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// NotebookEdit tool component
function NotebookEditToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Notebook icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium leading-6">Notebook Edit</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.notebook_path as string}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Notebook Path:</span>
            <div className="text-sm mt-1 font-mono">{input.notebook_path as string}</div>
          </div>
          {input.cell_id && (
            <div>
              <span className="text-xs font-semibold text-white/60">Cell ID:</span>
              <div className="text-sm mt-1 font-mono">{input.cell_id as string}</div>
            </div>
          )}
          <div>
            <span className="text-xs font-semibold text-white/60">Cell Type:</span>
            <div className="text-sm mt-1">{(input.cell_type as string) || 'default'}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-white/60">Edit Mode:</span>
            <div className="text-sm mt-1">{(input.edit_mode as string) || 'replace'}</div>
          </div>
          {input.new_source ? (
            <div>
              <span className="text-xs font-semibold text-white/60">New Source:</span>
              <div className="text-sm mt-1 max-h-32 overflow-y-auto bg-black/20 p-2 rounded font-mono whitespace-pre-wrap">
                {String(input.new_source).substring(0, 500)}
                {(() => {
                  const sourceStr = String(input.new_source);
                  return sourceStr.length > 500 ? (
                    <span className="text-xs text-white/40"> (truncated)</span>
                  ) : null;
                })()}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// TodoWrite tool component matching other tool designs
function TodoToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;
  const todos = input.todos as TodoItem[] || [];

  // Count todos by status
  const completedCount = todos.filter(t => t.status === 'completed').length;
  const inProgressCount = todos.filter(t => t.status === 'in_progress').length;
  const pendingCount = todos.filter(t => t.status === 'pending').length;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Todo list icon */}
          <svg className="size-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32" strokeWidth="1.5">
            <path d="M266.304 104.544l-105.408 105.92-41.408-41.6a31.904 31.904 0 0 0-54.496 13.888c-2.88 11.424 0.672 23.552 9.28 31.552l64 64.32a31.904 31.904 0 0 0 45.216 0l128-128.64a32.256 32.256 0 0 0-0.864-44.576 31.904 31.904 0 0 0-44.352-0.864h0.032zM176 384a112 112 0 1 1 0 224 112 112 0 0 1 0-224z m9.376 64.8a48.064 48.064 0 1 0 24.416 81.216 48.064 48.064 0 0 0-24.416-81.216zM928.064 160H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64zM928.064 480H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64zM176 720a112 112 0 1 1 0 224 112 112 0 0 1 0-224z m9.376 64.8a48.064 48.064 0 1 0 24.416 81.216 48.064 48.064 0 0 0-24.416-81.216zM928.064 800H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64z" fill="currentColor" stroke="currentColor"/>
          </svg>
          <span className="text-sm font-medium leading-6">Task List</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {completedCount}/{todos.length} completed
            {inProgressCount > 0 && ` · ${inProgressCount} in progress`}
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm">
          <div className="space-y-1">
            {todos.map((todo: TodoItem, i: number) => (
              <div key={i} className="flex gap-2 items-center py-1.5 px-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                {/* Status indicator */}
                <div className="flex items-center justify-center size-5 shrink-0">
                  {todo.status === 'completed' ? (
                    // Checkmark for completed
                    <svg className="size-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : todo.status === 'in_progress' ? (
                    // Spinner for in progress
                    <svg className="size-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    // Empty circle for pending
                    <svg className="size-4 text-black/30 dark:text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                </div>

                {/* Task text */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-white/40 mr-1">{i + 1}.</span>
                  <span
                    className={`${
                      todo.status === 'completed'
                        ? 'text-white/40 line-through'
                        : todo.status === 'in_progress'
                        ? 'font-medium text-blue-600 dark:text-blue-400'
                        : 'text-black/70 dark:text-white/70'
                    }`}
                  >
                    {todo.status === 'in_progress' ? todo.activeForm : todo.content}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ExitPlanMode tool component with blue theme and markdown rendering
function ExitPlanModeComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default
  const input = toolUse.input;

  return (
    <div className="w-full plan-border-active rounded-xl my-3 overflow-hidden bg-blue-500/5">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-blue-500/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Shield icon */}
          <Shield size={16} style={{ color: '#DAEEFF' }} />
          <span className="text-sm font-medium leading-6 plan-text-gradient">Implementation Plan</span>
          <div className="shrink-0 min-h-4 w-[1px] h-4 plan-separator" role="separator" aria-orientation="vertical" style={{ width: '1px', height: '16px' }} />
          <span className="flex-1 min-w-0 text-xs truncate plan-text-gradient">
            Review and approve to execute
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
            style={{ color: '#DAEEFF' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Gradient separator */}
      <div className="plan-separator" />

      {/* Plan Content */}
      {isExpanded && (
        <div className="p-4 bg-blue-500/5 text-sm">
          <div className="prose prose-base max-w-none prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                  <URLBadge href={href || '#'}>
                    {children}
                  </URLBadge>
                ),
                code: ({ className, children }: React.HTMLAttributes<HTMLElement> & { className?: string; children?: React.ReactNode }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const inline = !className;

                  // Render mermaid diagrams
                  if (!inline && language === 'mermaid') {
                    return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                  }

                  return !inline ? (
                    <CodeBlockWithCopy
                      code={String(children).replace(/\n$/, '')}
                      language={language}
                      customStyle={{
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        border: 'none',
                        backgroundColor: 'rgba(168, 199, 250, 0.05)',
                      }}
                      wrapperClassName="plan-code-border"
                    />
                  ) : (
                    <code className="px-1.5 py-0.5 text-sm font-mono rounded-md" style={{
                      backgroundColor: 'rgba(168, 199, 250, 0.15)',
                      color: '#DAEEFF',
                      border: '1px solid rgba(168, 199, 250, 0.2)'
                    }}>
                      {children}
                    </code>
                  );
                },
                h1: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <h1 className="text-2xl font-bold mt-6 mb-4 plan-text-gradient" {...props} />
                ),
                h2: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <h2 className="text-xl font-bold mt-5 mb-3 plan-text-gradient" {...props} />
                ),
                h3: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2 plan-text-gradient" {...props} />
                ),
                ul: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <ul className="list-disc pl-6 space-y-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                ol: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <ol className="list-decimal pl-6 space-y-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                li: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <li className="leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                p: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <p className="mb-4 leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                strong: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
                  <strong className="font-bold plan-text-gradient" {...props} />
                ),
              }}
            >
              {input.plan as string || 'No plan provided'}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit/Write tool component matching edit-write-update.md design
function EditToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  // Detect language from file extension
  const getLanguageFromPath = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'tsx',
      'js': 'javascript',
      'jsx': 'jsx',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'sql': 'sql',
    };
    return languageMap[ext || ''] || 'text';
  };

  const language = getLanguageFromPath((input.file_path as string) || '');

  // Calculate stats for Edit
  const calculateStats = () => {
    if (toolUse.name === 'Edit') {
      const oldLines = (input.old_string as string)?.split('\n').length || 0;
      const newLines = (input.new_string as string)?.split('\n').length || 0;
      return {
        added: newLines,
        removed: oldLines,
      };
    } else if (toolUse.name === 'Write') {
      const contentLines = (input.content as string)?.split('\n').length || 0;
      return {
        added: contentLines,
        removed: 0,
      };
    }
    return { added: 0, removed: 0 };
  };

  const stats = calculateStats();

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Code icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_1981_4166)">
              <path d="M5.33398 4.33301L1.33398 8.47707L5.33398 12.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.666 4.33301L14.666 8.47707L10.666 12.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.33333 1.33301L7 14.6663" stroke="currentColor" strokeLinecap="round" />
            </g>
            <defs>
              <clipPath id="clip0_1981_4166">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <span className="text-sm font-medium leading-6">{toolUse.name}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {input.file_path as string}
          </span>
          <FilePathActions filePath={input.file_path as string} />
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <span className="text-green-500">+ {stats.added}</span>
          {' / '}
          <span className="text-red-500">- {stats.removed}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Diff Viewer */}
      {isExpanded && (
        <div className="max-h-[124px] overflow-auto bg-black/30">
          {/* Deleted chunk (old_string) */}
          {input.old_string && (
            <div className="bg-red-500/10 border-l-2 border-red-500">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus as { [key: string]: React.CSSProperties }}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: '0.5rem',
                  background: 'transparent',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                }}
                showLineNumbers={false}
                wrapLines={true}
                lineProps={(_lineNumber) => ({
                  style: {
                    textDecoration: 'line-through',
                    opacity: 0.7,
                    display: 'flex',
                  },
                })}
                codeTagProps={{
                  style: {
                    fontFamily: 'monospace',
                  },
                }}
              >
                {input.old_string as string}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Added/New content (new_string or content) */}
          {(input.new_string || input.content) && (
            <div className="bg-green-500/10 border-l-2 border-green-500">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus as { [key: string]: React.CSSProperties }}
                PreTag="div"
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  padding: '0.5rem',
                  background: 'transparent',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                }}
                lineNumberStyle={{
                  minWidth: '2.5em',
                  paddingRight: '1em',
                  color: '#10b981',
                  userSelect: 'none',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: 'monospace',
                  },
                }}
              >
                {(input.new_string || input.content) as string}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolUseComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  // Use ExitPlanModeComponent for ExitPlanMode tool
  if (toolUse.name === 'ExitPlanMode') {
    return <ExitPlanModeComponent toolUse={toolUse} />;
  }

  // Use McpToolComponent for MCP tools (e.g., mcp__web-search-prime__search)
  if (toolUse.name.startsWith('mcp__')) {
    return <McpToolComponent toolUse={toolUse} />;
  }

  // Use BashToolComponent for Bash tools
  if (toolUse.name === 'Bash') {
    return <BashToolComponent toolUse={toolUse} />;
  }

  // Use BashOutputToolComponent for BashOutput
  if (toolUse.name === 'BashOutput') {
    return <BashOutputToolComponent toolUse={toolUse} />;
  }

  // Use KillShellToolComponent for KillShell
  if (toolUse.name === 'KillShell') {
    return <KillShellToolComponent toolUse={toolUse} />;
  }

  // Use EditToolComponent for Edit/Write tools
  if (toolUse.name === 'Edit' || toolUse.name === 'Write' || toolUse.name === 'MultiEdit') {
    return <EditToolComponent toolUse={toolUse} />;
  }

  // Use WebToolComponent for WebSearch/WebFetch tools
  if (toolUse.name === 'WebSearch' || toolUse.name === 'WebFetch') {
    return <WebToolComponent toolUse={toolUse} />;
  }

  // Use ReadToolComponent for Read tool
  if (toolUse.name === 'Read') {
    return <ReadToolComponent toolUse={toolUse} />;
  }

  // Use GrepToolComponent for Grep tool
  if (toolUse.name === 'Grep') {
    return <GrepToolComponent toolUse={toolUse} />;
  }

  // Use GlobToolComponent for Glob tool
  if (toolUse.name === 'Glob') {
    return <GlobToolComponent toolUse={toolUse} />;
  }

  // Use TaskToolComponent for Task tool
  if (toolUse.name === 'Task') {
    return <TaskToolComponent toolUse={toolUse} />;
  }

  // Use TodoToolComponent for TodoWrite tool
  if (toolUse.name === 'TodoWrite') {
    return <TodoToolComponent toolUse={toolUse} />;
  }

  // Use NotebookEditToolComponent for NotebookEdit tool
  if (toolUse.name === 'NotebookEdit') {
    return <NotebookEditToolComponent toolUse={toolUse} />;
  }

  const [isExpanded, setIsExpanded] = useState(false);

  // Format tool parameters based on tool type
  const formatToolDisplay = () => {
    const input = toolUse.input;

    switch(toolUse.name) {
      case 'Read':
      case 'Write':
      case 'Edit':
      case 'MultiEdit':
      case 'Bash':
      case 'BashOutput':
      case 'KillShell':
      case 'Grep':
      case 'Glob':
      case 'WebSearch':
      case 'WebFetch':
      case 'Task':
      case 'TodoWrite':
      case 'NotebookEdit':
        // These are handled in custom components
        return null;

      default:
        // Fallback to raw JSON for unknown tools
        return (
          <pre className="text-xs bg-black/20 text-white p-2 border border-white/10 overflow-x-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(input, null, 2)}
          </pre>
        );
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col flex-1 bg-[#0C0E10]">
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-white/10">
          <div className="flex gap-2 items-center">
            <ToolIcon toolName={toolUse.name} />
            <div className="text-sm font-medium leading-5">{toolUse.name}</div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex p-1 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 duration-150 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`size-4 transition-all ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="flex gap-2 p-4 w-full text-sm">
            {formatToolDisplay()}
          </div>
        )}
      </div>
    </div>
  );
}

// Long-running command component (matches Bash tool display styling exactly)
function LongRunningCommandComponent({ command }: { command: LongRunningCommandBlock }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = () => {
    switch (command.status) {
      case 'completed':
        return (
          <svg className="size-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="size-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="size-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
    }
  };

  const getToolName = () => {
    const action = command.commandType === 'install' ? 'Install' : command.commandType === 'build' ? 'Build' : 'Test';
    return action;
  };

  const getStatusBadge = () => {
    switch (command.status) {
      case 'completed': return <span className="text-xs text-green-500">(completed)</span>;
      case 'failed': return <span className="text-xs text-red-500">(failed)</span>;
      default: return <span className="text-xs text-blue-400">(running)</span>;
    }
  };

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {getStatusIcon()}
          <span className="text-sm font-medium leading-6">{getToolName()}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {command.command}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 flex p-1 rounded transition-colors hover:bg-gray-700 duration-150 shrink-0"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 bg-[#0C0E10]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/60">Status:</span>
              {getStatusBadge()}
            </div>
            {command.output && (
              <div>
                <div className="text-xs font-semibold text-white/60 mb-2">Output:</div>
                <pre className="text-xs bg-black/20 text-white p-2 border border-white/10 overflow-x-auto whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto rounded">
                  {command.output.slice(-2000)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TextComponent({ text }: { text: TextBlock }) {
  // Check if this is a context cleared message
  const isContextCleared = text.text.includes('--- Context cleared');
  // Check for both manual and auto-compact messages
  const isHistoryCompacted = text.text.includes('--- History compacted') || text.text.includes('--- Auto-compact');

  // Render special divider for context cleared messages
  if (isContextCleared) {
    return (
      <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
        <div className="flex px-4 py-2 w-full text-xs bg-[#0C0E10]">
          <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
            {/* Refresh icon */}
            <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.888 13.5C21.164 18.311 17.013 22 12 22 6.477 22 2 17.523 2 12S6.477 2 12 2c4.1 0 7.625 2.468 9.168 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8h4.4a.6.6 0 0 0 .6-.6V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium leading-6">Context Cleared</span>
            <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
            <span className="flex-1 min-w-0 text-xs truncate text-white/60">
              Previous conversation context has been cleared
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render special divider for history compacted messages
  if (isHistoryCompacted) {
    return (
      <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
        <div className="flex px-4 py-2 w-full text-xs bg-[#0C0E10]">
          <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
            {/* Archive/compress icon */}
            <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6h12M6 10h12M6 14h12M6 18h12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 9.5 2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9.5M2 9.5V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5.5M2 9.5h20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium leading-6">Conversation Compacted</span>
            <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
            <span className="flex-1 min-w-0 text-xs truncate text-white/60">
              Conversation history has been compacted to save tokens
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Memoize components to prevent recreating on every render
  const components = useMemo(() => ({
            // Customize link rendering with URL badges
            a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
              <URLBadge href={href || '#'}>
                {children}
              </URLBadge>
            ),
            // Customize code rendering
            code: ({ className, children }: React.HTMLAttributes<HTMLElement> & { className?: string; children?: React.ReactNode }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const inline = !className;

              // Render mermaid diagrams
              if (!inline && language === 'mermaid') {
                return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
              }

              // For code blocks, check if they contain file paths
              if (!inline) {
                const codeContent = String(children).replace(/\n$/, '');
                // Check if this code block contains file paths (tree structure)
                const hasFilePaths = /(?:\/(?:Users|home|var|tmp|etc|opt|usr|mnt|media|Documents|Desktop|Downloads)[^\s<>"|]*)|(?:[A-Za-z]:\\[^\s<>"|]*)|(?:(?:\.\.?\/)?[\w.-]+\/[\w./-]+)/.test(codeContent);

                // Render with file path detection if paths found and no syntax highlighting needed
                const isPlainText = !language || language === 'text' || language === 'plaintext' || language === 'txt';
                if (hasFilePaths && isPlainText) {
                  // Render as plain text with file path detection
                  const lines = codeContent.split('\n');
                  return (
                    <div className="my-4 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap" style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      {lines.map((line, i) => (
                        <div key={i} className="leading-relaxed flex flex-wrap items-center">
                          <TextWithFilePaths>{line}</TextWithFilePaths>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <CodeBlockWithCopy
                    code={codeContent}
                    language={language}
                    customStyle={{
                      margin: '1rem 0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                );
              }

              // Inline code with file path detection
              const inlineContent = String(children);
              const isFilePath = /^(?:\/(?:Users|home|var|tmp|etc|opt|usr|mnt|media|Documents|Desktop|Downloads)[^\s<>"|]*)|(?:[A-Za-z]:\\[^\s<>"|]*)$/.test(inlineContent);

              if (isFilePath) {
                return (
                  <span className="inline-flex items-center gap-0.5">
                    <code className="px-1.5 py-0.5 text-sm font-mono rounded-md" style={{
                      backgroundColor: 'rgba(168, 199, 250, 0.15)',
                      color: '#DAEEFF',
                      border: '1px solid rgba(168, 199, 250, 0.2)'
                    }}>
                      {children}
                    </code>
                    <FilePathActions filePath={inlineContent} />
                  </span>
                );
              }

              return (
                <code className="px-1.5 py-0.5 text-sm font-mono rounded-md" style={{
                  backgroundColor: 'rgba(168, 199, 250, 0.15)',
                  color: '#DAEEFF',
                  border: '1px solid rgba(168, 199, 250, 0.2)'
                }}>
                  {children}
                </code>
              );
            },
            // Customize heading rendering
            h1: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <h1 className="text-2xl font-bold mt-6 mb-4" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            h2: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <h2 className="text-xl font-bold mt-5 mb-3" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            h3: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            h4: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <h4 className="text-base font-semibold mt-3 mb-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            h5: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <h5 className="text-sm font-semibold mt-3 mb-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            h6: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <h6 className="text-sm font-semibold mt-3 mb-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            // Customize list rendering
            ul: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <ul className="list-disc pl-6 space-y-3 marker:text-gray-400" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            ol: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <ol className="list-decimal pl-6 space-y-3 marker:text-gray-400" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            li: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
              <li className="mb-2 leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }} {...props}>
                {React.Children.map(children, child =>
                  typeof child === 'string' ? <TextWithFilePaths>{child}</TextWithFilePaths> : child
                )}
              </li>
            ),
            // Customize paragraph spacing with file path detection
            p: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
              <p className="mb-4 leading-relaxed first:mt-0 last:mb-0" style={{ color: 'rgb(var(--text-primary))' }} {...props}>
                {React.Children.map(children, child =>
                  typeof child === 'string' ? <TextWithFilePaths>{child}</TextWithFilePaths> : child
                )}
              </p>
            ),
            // Customize blockquote
            blockquote: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <blockquote className="border-l-4 border-gray-500 pl-4 py-2 my-4 italic bg-white/5" style={{ color: 'rgb(var(--text-secondary))' }} {...props} />
            ),
            // Customize horizontal rule
            hr: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <hr className="my-6 border-t border-gray-600" {...props} />
            ),
            // Customize strong/bold
            strong: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <strong className="font-bold" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            // Customize emphasis/italic
            em: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <em className="italic" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            // Customize table
            table: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <div className="my-4 overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-600" {...props} />
              </div>
            ),
            thead: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <thead className="bg-white/10" {...props} />
            ),
            tbody: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <tbody className="divide-y divide-gray-600" {...props} />
            ),
            tr: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <tr className="even:bg-white/5" {...props} />
            ),
            th: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <th className="px-4 py-2 text-left font-semibold border border-gray-600" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            td: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
              <td className="px-4 py-2 border border-gray-600" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
          }) , []); // Empty deps - components never change

  // Check if this is the compacting loading message
  const isCompactingMessage = text.text === 'Compacting conversation...';

  return (
    <div className="text-base" style={{ color: 'rgb(var(--text-primary))' }}>
      {isCompactingMessage ? (
        // Render with shimmer gradient effect
        <div className="text-gradient text-base font-semibold">
          {text.text}
        </div>
      ) : (
        // Normal markdown rendering
        <div className="prose prose-base max-w-none prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {text.text}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract text content from message for copying
  const getTextContent = () => {
    return message.content
      .filter(block => block.type === 'text')
      .map(block => (block as TextBlock).text)
      .join('\n');
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    const text = getTextContent();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      showError('COPY_FAILED', errorMsg);
    }
  };

  return (
    <div className="message-container group">
      <div className="message-assistant-wrapper">
        <div className="message-assistant-content">
          {/* Header with avatar and model name */}
          <div className="message-assistant-header">
            <img
              src="/client/agent-boy.svg"
              className="message-assistant-avatar"
              alt="Agent Girl"
            />
            <div className="message-assistant-name-container">
              <span className="message-assistant-name">
                {message.metadata?.model || 'Agent Girl'}
              </span>
              <span className="message-assistant-timestamp invisible group-hover:visible">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          </div>

          {/* Message body */}
          <div className="message-assistant-body">
            <div className="space-y-4 mt-2">
              {message.content.map((block, index) => {
                if (block.type === 'text') {
                  return <TextComponent key={index} text={block} />;
                } else if (block.type === 'tool_use') {
                  return <ToolUseComponent key={index} toolUse={block} />;
                } else if (block.type === 'thinking') {
                  return <ThinkingBlock key={index} title="Agent Girl's thoughts..." content={block.thinking} />;
                } else if (block.type === 'long_running_command') {
                  return <LongRunningCommandComponent key={index} command={block} />;
                }
                return null;
              })}
            </div>

            {/* Action buttons */}
            <div className="message-assistant-actions">
              <button
                onClick={handleCopy}
                className="message-action-btn"
                aria-label={copied ? "Copied!" : "Copy"}
                title={copied ? "Copied!" : "Copy response"}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.875 4.66161V2.92944C4.875 2.34696 5.3472 1.87476 5.92969 1.87476H15.0703C15.6528 1.87476 16.125 2.34696 16.125 2.92944V12.0701C16.125 12.6526 15.6528 13.1248 15.0703 13.1248H13.3186" />
                    <path strokeLinejoin="round" d="M12.0703 4.87476H2.92969C2.3472 4.87476 1.875 5.34696 1.875 5.92944V15.0701C1.875 15.6526 2.3472 16.1248 2.92969 16.1248H12.0703C12.6528 16.1248 13.125 15.6526 13.125 15.0701V5.92944C13.125 5.34696 12.6528 4.87476 12.0703 4.87476Z" />
                  </svg>
                )}
              </button>
              {message.metadata && (
                <button
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="message-action-btn"
                  aria-label="Metadata"
                  title="Show metadata"
                >
                  <span className="text-xs font-mono">{showMetadata ? '[-]' : '[+]'}</span>
                </button>
              )}
            </div>

            {/* Metadata panel */}
            {message.metadata && showMetadata && (
              <div className="mt-2 p-2 bg-black/5 border border-white/10 rounded text-xs">
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-gray-400">
                  {JSON.stringify(message.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}