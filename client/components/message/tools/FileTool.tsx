/**
 * File tools - Read, Grep, Glob display components with original styling
 */

import React, { useState } from 'react';
import type { ToolUseBlock } from './types';
import { FilePathActions } from '../FilePathActions';

// Document icon
const DocumentIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Search icon
const SearchIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Files icon
const FilesIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Shared chevron icon
const ChevronIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

export function ReadToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;
  const filePath = String(input.file_path || '');

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <DocumentIcon />
          <span className="text-sm font-medium leading-6">Read</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {filePath}
          </span>
          <FilePathActions filePath={filePath} />
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <ChevronIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">File Path:</span>
            <div className="text-sm mt-1 font-mono flex items-center gap-2">
              {filePath}
              <FilePathActions filePath={filePath} />
            </div>
          </div>
          {!!input.offset && (
            <div>
              <span className="text-xs font-semibold text-white/60">Offset:</span>
              <div className="text-sm mt-1">{String(input.offset)} lines</div>
            </div>
          )}
          {!!input.limit && (
            <div>
              <span className="text-xs font-semibold text-white/60">Limit:</span>
              <div className="text-sm mt-1">{String(input.limit)} lines</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GrepToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;
  const pattern = String(input.pattern || '');

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <SearchIcon />
          <span className="text-sm font-medium leading-6">Grep</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {pattern}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <ChevronIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Pattern:</span>
            <div className="text-sm mt-1 font-mono bg-yellow-500/10 px-2 py-1 rounded">{pattern}</div>
          </div>
          {!!input.path && (
            <div>
              <span className="text-xs font-semibold text-white/60">Path:</span>
              <div className="text-sm mt-1 font-mono">{String(input.path)}</div>
            </div>
          )}
          {!!input.glob && (
            <div>
              <span className="text-xs font-semibold text-white/60">Glob:</span>
              <div className="text-sm mt-1 font-mono">{String(input.glob)}</div>
            </div>
          )}
          {!!input.output_mode && (
            <div>
              <span className="text-xs font-semibold text-white/60">Mode:</span>
              <div className="text-sm mt-1">{String(input.output_mode)}</div>
            </div>
          )}
          {(!!input['-i'] || !!input['-n'] || !!input.multiline) && (
            <div>
              <span className="text-xs font-semibold text-white/60">Options:</span>
              <div className="flex gap-2 mt-1">
                {!!input['-i'] && <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded">case-insensitive</span>}
                {!!input['-n'] && <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded">line-numbers</span>}
                {!!input.multiline && <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded">multiline</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GlobToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;
  const pattern = String(input.pattern || '');

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <FilesIcon />
          <span className="text-sm font-medium leading-6">Glob</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {pattern}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <ChevronIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          <div>
            <span className="text-xs font-semibold text-white/60">Pattern:</span>
            <div className="text-sm mt-1 font-mono">{pattern}</div>
          </div>
          {!!input.path && (
            <div>
              <span className="text-xs font-semibold text-white/60">Path:</span>
              <div className="text-sm mt-1 font-mono">{String(input.path)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
