/**
 * Tool icons - shared icon component for tool cards
 */

import React from 'react';

export function ToolIcon({ toolName }: { toolName: string }) {
  const getIcon = () => {
    // MCP tools (e.g., mcp__web-search-prime__search)
    if (toolName.startsWith('mcp__')) {
      const server = toolName.split('__')[1] || '';
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

// Terminal icon SVG (shared by Bash tools)
export const TerminalIcon = () => (
  <svg className="size-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" strokeWidth="2">
    <path d="M282.88 788.48l-35.84-35.84L486.4 512c-42.24-38.4-142.08-130.56-225.28-215.04L243.2 279.04l35.84-35.84 17.92 17.92c107.52 107.52 241.92 230.4 243.2 231.68 5.12 5.12 7.68 11.52 8.96 17.92 0 6.4-2.56 14.08-7.68 19.2L282.88 788.48zM503.04 733.44h281.6v51.2h-281.6v-51.2z" fill="currentColor" />
  </svg>
);

// Globe icon SVG (shared by Web tools)
export const GlobeIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Expand/collapse chevron
export const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="3.5"
    stroke="currentColor"
    className={`size-3 transition-transform ${expanded ? '' : '-rotate-180'}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);
