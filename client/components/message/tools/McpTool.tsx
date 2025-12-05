/**
 * MCP tool component - Model Context Protocol tools display with original styling
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

// MCP icon
const McpIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Shared chevron icon
const ChevronIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

// Parse MCP tool name: mcp__server-name__tool-name
function parseMcpName(name: string) {
  const parts = name.split('__');
  if (parts.length >= 3 && parts[0] === 'mcp') {
    return {
      server: parts[1],
      tool: parts.slice(2).join('__'),
    };
  }
  return { server: 'unknown', tool: name };
}

export function McpToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;
  const { server, tool } = parseMcpName(toolUse.name);

  const getDisplayName = () => {
    if (server === 'web-search-prime') return 'Web Search';
    return tool.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getMainParam = () => {
    if (input.query) return String(input.query);
    if (input.url) return String(input.url);
    if (input.search_query) return String(input.search_query);
    return JSON.stringify(input);
  };

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {server === 'web-search-prime' ? <GlobeIcon /> : <McpIcon />}
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
            <ChevronIcon />
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
