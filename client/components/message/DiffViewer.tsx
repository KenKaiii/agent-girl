/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Columns2, AlignJustify, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  lineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface DiffViewerProps {
  filePath: string;
  oldContent: string | null;
  newContent: string;
  language: string;
  startLine?: number; // Starting line number in the original file
  maxHeight?: number;
}

// Compute diff between old and new content
function computeDiff(oldContent: string | null, newContent: string, startLine: number = 1): DiffLine[] {
  const lines: DiffLine[] = [];

  if (!oldContent) {
    // Pure addition (Write tool)
    const newLines = newContent.split('\n');
    newLines.forEach((line, idx) => {
      lines.push({
        type: 'added',
        lineNumber: null,
        newLineNumber: startLine + idx,
        content: line,
      });
    });
    return lines;
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Simple LCS-based diff algorithm
  const lcs = computeLCS(oldLines, newLines);

  let oldIdx = 0;
  let newIdx = 0;
  let lineNum = startLine;
  let newLineNum = startLine;

  for (const match of lcs) {
    // Handle removed lines
    while (oldIdx < match.oldIndex) {
      lines.push({
        type: 'removed',
        lineNumber: lineNum++,
        newLineNumber: null,
        content: oldLines[oldIdx++],
      });
    }

    // Handle added lines
    while (newIdx < match.newIndex) {
      lines.push({
        type: 'added',
        lineNumber: null,
        newLineNumber: newLineNum++,
        content: newLines[newIdx++],
      });
    }

    // Handle matched line
    lines.push({
      type: 'unchanged',
      lineNumber: lineNum++,
      newLineNumber: newLineNum++,
      content: oldLines[oldIdx++],
    });
    newIdx++;
  }

  // Handle remaining removed lines
  while (oldIdx < oldLines.length) {
    lines.push({
      type: 'removed',
      lineNumber: lineNum++,
      newLineNumber: null,
      content: oldLines[oldIdx++],
    });
  }

  // Handle remaining added lines
  while (newIdx < newLines.length) {
    lines.push({
      type: 'added',
      lineNumber: null,
      newLineNumber: newLineNum++,
      content: newLines[newIdx++],
    });
  }

  return lines;
}

interface LCSMatch {
  oldIndex: number;
  newIndex: number;
}

function computeLCS(oldLines: string[], newLines: string[]): LCSMatch[] {
  const m = oldLines.length;
  const n = newLines.length;

  // DP table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matches
  const matches: LCSMatch[] = [];
  let i = m, j = n;

  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      matches.unshift({ oldIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return matches;
}

// Format file path for display
function formatFilePath(filePath: string): { dir: string; file: string } {
  const parts = filePath.split('/');
  const file = parts.pop() || '';
  const dir = parts.slice(-2).join('/'); // Show last 2 dirs
  return { dir: dir ? dir + '/' : '', file };
}

export function DiffViewer({
  filePath,
  oldContent,
  newContent,
  language,
  startLine = 1,
  maxHeight = 300
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedLine, setCopiedLine] = useState<number | null>(null);

  const diffLines = useMemo(() =>
    computeDiff(oldContent, newContent, startLine),
    [oldContent, newContent, startLine]
  );

  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    return { added, removed };
  }, [diffLines]);

  const { dir, file } = formatFilePath(filePath);

  const copyLineReference = useCallback((lineNum: number) => {
    const reference = `${filePath}:${lineNum}`;
    navigator.clipboard.writeText(reference);
    setCopiedLine(lineNum);
    setTimeout(() => setCopiedLine(null), 2000);
  }, [filePath]);

  const openInEditor = useCallback(() => {
    // VSCode URI scheme
    window.open(`vscode://file${filePath}:${startLine}`, '_blank');
  }, [filePath, startLine]);

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden bg-[#0d1117]">
      {/* Header - bolt.new style */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {/* File icon */}
          <div className="flex-shrink-0 w-4 h-4 text-blue-400">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"/>
            </svg>
          </div>

          {/* File path with hierarchy */}
          <div className="flex items-center gap-1 text-sm overflow-hidden">
            <span className="text-white/40 truncate">{dir}</span>
            <span className="text-white font-medium truncate">{file}</span>
          </div>

          {/* Line range indicator */}
          {startLine > 1 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
              L{startLine}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-green-400">+{stats.added}</span>
            <span className="text-white/30">/</span>
            <span className="text-red-400">-{stats.removed}</span>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-white/5 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('unified')}
              className={`p-1 rounded transition-colors ${viewMode === 'unified' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              title="Unified view"
            >
              <AlignJustify size={14} />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1 rounded transition-colors ${viewMode === 'split' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              title="Split view"
            >
              <Columns2 size={14} />
            </button>
          </div>

          {/* Open in editor */}
          <button
            onClick={openInEditor}
            className="p-1 text-white/40 hover:text-white/60 transition-colors"
            title="Open in VS Code"
          >
            <ExternalLink size={14} />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-white/40 hover:text-white/60 transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Diff content */}
      {isExpanded && (
        <div
          className="overflow-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {viewMode === 'unified' ? (
            <UnifiedDiffView
              lines={diffLines}
              language={language}
              onCopyLine={copyLineReference}
              copiedLine={copiedLine}
              filePath={filePath}
            />
          ) : (
            <SplitDiffView
              lines={diffLines}
              language={language}
              onCopyLine={copyLineReference}
              copiedLine={copiedLine}
              filePath={filePath}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface DiffViewProps {
  lines: DiffLine[];
  language: string;
  onCopyLine: (line: number) => void;
  copiedLine: number | null;
  filePath: string;
}

function UnifiedDiffView({ lines, language, onCopyLine, copiedLine, filePath }: DiffViewProps) {
  return (
    <div className="font-mono text-xs">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`flex group ${
            line.type === 'added' ? 'bg-green-500/10' :
            line.type === 'removed' ? 'bg-red-500/10' :
            'bg-transparent hover:bg-white/5'
          }`}
        >
          {/* Line numbers */}
          <div className="flex-shrink-0 select-none flex">
            {/* Old line number */}
            <div
              className={`w-10 px-2 text-right cursor-pointer transition-colors ${
                line.type === 'removed' ? 'text-red-400/60 hover:text-red-400' :
                line.type === 'added' ? 'text-transparent' :
                'text-white/30 hover:text-white/50'
              }`}
              onClick={() => line.lineNumber && onCopyLine(line.lineNumber)}
              title={line.lineNumber ? `Copy ${filePath}:${line.lineNumber}` : undefined}
            >
              {copiedLine === line.lineNumber ? (
                <Check size={12} className="inline text-green-400" />
              ) : (
                line.lineNumber || ''
              )}
            </div>

            {/* New line number */}
            <div
              className={`w-10 px-2 text-right cursor-pointer transition-colors ${
                line.type === 'added' ? 'text-green-400/60 hover:text-green-400' :
                line.type === 'removed' ? 'text-transparent' :
                'text-white/30 hover:text-white/50'
              }`}
              onClick={() => line.newLineNumber && onCopyLine(line.newLineNumber)}
              title={line.newLineNumber ? `Copy ${filePath}:${line.newLineNumber}` : undefined}
            >
              {copiedLine === line.newLineNumber ? (
                <Check size={12} className="inline text-green-400" />
              ) : (
                line.newLineNumber || ''
              )}
            </div>
          </div>

          {/* Change indicator */}
          <div className={`w-5 flex-shrink-0 text-center select-none ${
            line.type === 'added' ? 'text-green-400' :
            line.type === 'removed' ? 'text-red-400' :
            'text-white/20'
          }`}>
            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
          </div>

          {/* Code content */}
          <div className={`flex-1 pr-4 ${
            line.type === 'removed' ? 'line-through opacity-70' : ''
          }`}>
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus as { [key: string]: React.CSSProperties }}
              customStyle={{
                margin: 0,
                padding: '0 4px',
                background: 'transparent',
                fontSize: 'inherit',
                lineHeight: '1.5',
              }}
              PreTag="span"
              codeTagProps={{ style: { fontFamily: 'inherit' } }}
            >
              {line.content || ' '}
            </SyntaxHighlighter>
          </div>

          {/* Copy button on hover */}
          <button
            onClick={() => navigator.clipboard.writeText(line.content)}
            className="opacity-0 group-hover:opacity-100 px-2 text-white/40 hover:text-white/60 transition-opacity"
            title="Copy line"
          >
            <Copy size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function SplitDiffView({ lines, language, onCopyLine, copiedLine, filePath: _filePath }: DiffViewProps) {
  // Pair up removed/added lines for side-by-side display
  const pairs: Array<{ left: DiffLine | null; right: DiffLine | null }> = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === 'unchanged') {
      pairs.push({ left: line, right: line });
      i++;
    } else if (line.type === 'removed') {
      // Look ahead for a matching added line
      let j = i + 1;
      while (j < lines.length && lines[j].type === 'removed') j++;

      const removedLines = lines.slice(i, j);
      const addedStart = j;

      while (j < lines.length && lines[j].type === 'added') j++;
      const addedLines = lines.slice(addedStart, j);

      // Pair them up
      const maxLen = Math.max(removedLines.length, addedLines.length);
      for (let k = 0; k < maxLen; k++) {
        pairs.push({
          left: removedLines[k] || null,
          right: addedLines[k] || null,
        });
      }
      i = j;
    } else if (line.type === 'added') {
      pairs.push({ left: null, right: line });
      i++;
    } else {
      i++;
    }
  }

  return (
    <div className="font-mono text-xs flex">
      {/* Left side (old) */}
      <div className="flex-1 border-r border-white/10">
        {pairs.map((pair, idx) => (
          <div
            key={`left-${idx}`}
            className={`flex group ${
              pair.left?.type === 'removed' ? 'bg-red-500/10' :
              !pair.left ? 'bg-transparent' :
              'bg-transparent hover:bg-white/5'
            }`}
          >
            <div
              className={`w-10 px-2 text-right select-none cursor-pointer ${
                pair.left?.type === 'removed' ? 'text-red-400/60' :
                pair.left ? 'text-white/30' : 'text-transparent'
              }`}
              onClick={() => pair.left?.lineNumber && onCopyLine(pair.left.lineNumber)}
            >
              {copiedLine === pair.left?.lineNumber ? (
                <Check size={12} className="inline text-green-400" />
              ) : (
                pair.left?.lineNumber || ''
              )}
            </div>
            <div className={`flex-1 pr-2 min-h-[1.5em] ${
              pair.left?.type === 'removed' ? 'line-through opacity-70' : ''
            }`}>
              {pair.left && (
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus as { [key: string]: React.CSSProperties }}
                  customStyle={{
                    margin: 0,
                    padding: '0 4px',
                    background: 'transparent',
                    fontSize: 'inherit',
                    lineHeight: '1.5',
                  }}
                  PreTag="span"
                  codeTagProps={{ style: { fontFamily: 'inherit' } }}
                >
                  {pair.left.content || ' '}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Right side (new) */}
      <div className="flex-1">
        {pairs.map((pair, idx) => (
          <div
            key={`right-${idx}`}
            className={`flex group ${
              pair.right?.type === 'added' ? 'bg-green-500/10' :
              !pair.right ? 'bg-transparent' :
              'bg-transparent hover:bg-white/5'
            }`}
          >
            <div
              className={`w-10 px-2 text-right select-none cursor-pointer ${
                pair.right?.type === 'added' ? 'text-green-400/60' :
                pair.right ? 'text-white/30' : 'text-transparent'
              }`}
              onClick={() => pair.right?.newLineNumber && onCopyLine(pair.right.newLineNumber)}
            >
              {copiedLine === pair.right?.newLineNumber ? (
                <Check size={12} className="inline text-green-400" />
              ) : (
                pair.right?.newLineNumber || ''
              )}
            </div>
            <div className="flex-1 pr-2 min-h-[1.5em]">
              {pair.right && (
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus as { [key: string]: React.CSSProperties }}
                  customStyle={{
                    margin: 0,
                    padding: '0 4px',
                    background: 'transparent',
                    fontSize: 'inherit',
                    lineHeight: '1.5',
                  }}
                  PreTag="span"
                  codeTagProps={{ style: { fontFamily: 'inherit' } }}
                >
                  {pair.right.content || ' '}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiffViewer;
