/**
 * NotebookEdit tool component - Jupyter notebook editing display with original styling
 */

import React, { useState } from 'react';
import type { ToolUseBlock } from './types';

// Notebook icon
const NotebookIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Shared chevron icon
const ChevronIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

export function NotebookEditToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;
  const notebookPath = String(input.notebook_path || '');

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <NotebookIcon />
          <span className="text-sm font-medium leading-6">Notebook Edit</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {notebookPath}
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
            <span className="text-xs font-semibold text-white/60">Notebook Path:</span>
            <div className="text-sm mt-1 font-mono">{notebookPath}</div>
          </div>
          {!!input.cell_id && (
            <div>
              <span className="text-xs font-semibold text-white/60">Cell ID:</span>
              <div className="text-sm mt-1 font-mono">{String(input.cell_id)}</div>
            </div>
          )}
          <div>
            <span className="text-xs font-semibold text-white/60">Cell Type:</span>
            <div className="text-sm mt-1">{String(input.cell_type || 'default')}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-white/60">Edit Mode:</span>
            <div className="text-sm mt-1">{String(input.edit_mode || 'replace')}</div>
          </div>
          {!!input.new_source && (
            <div>
              <span className="text-xs font-semibold text-white/60">New Source:</span>
              <div className="text-sm mt-1 max-h-32 overflow-y-auto bg-black/20 p-2 rounded font-mono whitespace-pre-wrap">
                {String(input.new_source).substring(0, 500)}
                {String(input.new_source).length > 500 && (
                  <span className="text-xs text-white/40"> (truncated)</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
