/**
 * Web tool component - WebSearch/WebFetch display with original styling
 */

import React, { useState } from 'react';
import type { ToolUseBlock } from './types';

// Globe icon
const GlobeIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Shared chevron icon
const ChevronIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

export function WebToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <GlobeIcon />
          <span className="text-sm font-medium leading-6">{toolUse.name}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {toolUse.name === 'WebSearch'
              ? String(input.query || '')
              : String(input.url || '')}
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
          {toolUse.name === 'WebSearch' ? (
            <>
              <div>
                <span className="text-xs font-semibold text-white/60">Query:</span>
                <div className="text-sm mt-1">{String(input.query)}</div>
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
                <div className="text-sm mt-1 break-all font-mono">{String(input.url)}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-white/60">Prompt:</span>
                <div className="text-sm mt-1">{String(input.prompt)}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
