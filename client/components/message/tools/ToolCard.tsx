/**
 * Generic tool card component with header, expand/collapse
 * Shared by all tool components to reduce duplication
 */

import React, { useState, ReactNode } from 'react';

interface ToolCardProps {
  icon: ReactNode;
  title: ReactNode;
  summary: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function ToolCard({ icon, title, summary, children, actions }: ToolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <div className="size-4 shrink-0">{icon}</div>
          <span className="text-sm font-medium leading-6">{title}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">{summary}</span>
          {actions}
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
      {isExpanded && children && (
        <div className="p-4 bg-black/30 text-sm space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

// Common field display component
export function ToolField({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs font-semibold text-white/60">{label}:</span>
      <div className={`text-sm mt-1 ${mono ? 'font-mono bg-black/20 px-2 py-1 rounded' : ''}`}>
        {children}
      </div>
    </div>
  );
}
