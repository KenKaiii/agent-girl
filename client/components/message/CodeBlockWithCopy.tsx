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

import React, { useState, memo, useCallback } from 'react';
import { SyntaxHighlighter, vscDarkPlus } from '../../utils/syntaxHighlighter';
import { showError } from '../../utils/errorMessages';
import { FileText, FolderOpen, Copy } from 'lucide-react';
import { useWorkingDirectory } from '../../hooks/useWorkingDirectory';
import { useCodeVisibility } from '../../context/CodeVisibilityContext';

// File path action buttons for code blocks
function CodeBlockFilePathActions({ filePath }: { filePath: string }) {
  const { workingDirectory } = useWorkingDirectory();

  const handleOpenFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, workingDirectory }),
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
        body: JSON.stringify({ path: filePath, workingDirectory }),
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

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(filePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('COPY_FAILED', errorMsg);
    }
  };

  return (
    <div className="flex gap-0.5 ml-1 shrink-0">
      <button
        onClick={handleOpenFile}
        className="w-5 h-5 flex items-center justify-center p-0 hover:bg-white/10 rounded transition-colors flex-shrink-0"
        title="Open file"
      >
        <FileText className="w-3 h-3 text-white/40 hover:text-white/80" aria-hidden="true" />
      </button>
      <button
        onClick={handleOpenFolder}
        className="w-5 h-5 flex items-center justify-center p-0 hover:bg-white/10 rounded transition-colors flex-shrink-0"
        title="Reveal in Finder"
      >
        <FolderOpen className="w-3 h-3 text-white/40 hover:text-white/80" aria-hidden="true" />
      </button>
      <button
        onClick={handleCopyPath}
        className="w-5 h-5 flex items-center justify-center p-0 hover:bg-white/10 rounded transition-colors flex-shrink-0"
        title="Copy path"
      >
        <Copy className="w-3 h-3 text-white/40 hover:text-white/80" aria-hidden="true" />
      </button>
    </div>
  );
}

// Render code with file path detection for plain text blocks
function CodeWithFilePaths({ code }: { code: string }) {
  // Regex to match file paths (Unix absolute, Windows, relative, home dir ~, and standalone filenames)
  const pathRegex = /((?:~\/[\w\s./-]+)|(?:\/(?:Users|home|var|tmp|etc|opt|usr|mnt|media|Documents|Desktop|Downloads)\/[\w\s.-]+(?:\/[\w\s.-]+)*)|(?:[A-Za-z]:\\[\w\\\s.-]+)|(?:\.\.?\/[\w\s.-]+(?:\/[\w\s.-]+)*)|(?:[\w\s_-]+\.(?:md|txt|json|yml|yaml|sh|py|js|ts|jsx|tsx|css|html|xml|toml|ini|cfg|conf|log|env|gitignore|dockerignore|rs|go|java|c|cpp|h|hpp|rb|php|swift|kt|scala|sql|vue|svelte|command)))/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pathRegex.exec(code)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(code.slice(lastIndex, match.index));
    }

    // Add the path with action buttons
    const filePath = match[1];
    parts.push(
      <span key={match.index} className="inline-flex items-center gap-0.5 flex-wrap-0">
        <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">{filePath}</span>
        <CodeBlockFilePathActions filePath={filePath} />
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < code.length) {
    parts.push(code.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : code}</>;
}

interface CodeBlockWithCopyProps {
  code: string;
  language: string;
  customStyle?: React.CSSProperties;
  wrapperClassName?: string;
}

export const CodeBlockWithCopy = memo(function CodeBlockWithCopy({ code, language, customStyle, wrapperClassName }: CodeBlockWithCopyProps) {
  const { showCode } = useCodeVisibility();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      showError('COPY_FAILED', errorMsg);
    }
  }, [code]);

  // If code visibility is disabled globally, don't render the code block
  if (!showCode) {
    return null;
  }

  const codeStyle: { [key: string]: React.CSSProperties } = vscDarkPlus as unknown as { [key: string]: React.CSSProperties };

  return (
    <div className={`flex flex-col bg-[#0C0E10] border border-white/10 rounded-xl overflow-hidden my-3 ${wrapperClassName || ''}`} dir="ltr">
      {/* Title bar - matching tool display style */}
      <div className="flex justify-between items-center px-4 py-2 w-full text-xs border-b border-white/10">
        {/* Left side: icon + language label */}
        <div className="flex gap-2 items-center">
          {/* Code icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-4 text-white/80"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
          <div className="text-sm font-medium leading-6 text-white">{language}</div>
        </div>

        {/* Right side: copy button - CSS-only hover, no state */}
        <button
          onClick={handleCopy}
          className="px-1.5 py-0.5 rounded-md border-none transition-colors copy-code-button text-xs cursor-pointer text-white bg-white/10 hover:bg-white/15"
          aria-label={copied ? "Copied!" : "Copy code"}
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code content */}
      {/* Use plain text rendering with file path detection for text/plain blocks */}
      {(!language || language === 'text' || language === 'plaintext') ? (
        <div
          className="p-4 font-mono text-sm whitespace-pre-wrap"
          style={{
            ...customStyle,
            margin: 0,
            marginTop: 0,
            paddingTop: '1rem',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
          }}
        >
          <CodeWithFilePaths code={code} />
        </div>
      ) : (
        <SyntaxHighlighter
          style={codeStyle}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            ...customStyle,
            margin: 0,
            marginTop: 0,
            paddingTop: '1rem',
            borderRadius: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
});
