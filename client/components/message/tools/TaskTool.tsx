/**
 * Task tool component - Sub-agent execution display with original styling
 */

import React, { useState, useEffect, useRef } from 'react';
import type { ToolUseBlock } from './types';
import { useGeneration } from '../../../context/GenerationContext';

// Timeout threshold for showing "stuck" indicator (30 seconds)
const STUCK_THRESHOLD_MS = 30000;

// Robot icon for agents
const RobotIcon = () => (
  <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 9.75A.75.75 0 1 1 9 8.25.75.75 0 0 1 9 9.75zM15 9.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" fill="currentColor"/>
    <path d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75zM7.5 6h9A2.25 2.25 0 0 1 18.75 8.25v7.5A2.25 2.25 0 0 1 16.5 18h-9a2.25 2.25 0 0 1-2.25-2.25v-7.5A2.25 2.25 0 0 1 7.5 6zM6 19.5h12M8.25 19.5v1.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75v-1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12.75h6a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .75-.75z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Shared chevron icon
const ChevronIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

// Hash tool ID to randomly pick a gradient (1-10)
function getAgentGradientClass(toolId: string): string {
  try {
    let hash = 0;
    for (let i = 0; i < toolId.length; i++) {
      hash = ((hash << 5) - hash) + toolId.charCodeAt(i);
      hash = hash & hash;
    }
    const gradientNum = (Math.abs(hash) % 10) + 1;
    return `agent-gradient-${gradientNum}`;
  } catch {
    return 'agent-gradient-1';
  }
}

// Get a one-line summary of a tool's usage
function getToolSummary(toolUse: ToolUseBlock): string {
  try {
    const input = toolUse.input;
    switch (toolUse.name) {
      case 'Read':
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
        const todos = input.todos as unknown[] || [];
        return `${todos.length} task${todos.length !== 1 ? 's' : ''}`;
      }
      case 'NotebookEdit':
        return String(input.notebook_path || '');
      default: {
        const firstValue = Object.values(input)[0];
        if (typeof firstValue === 'string') return firstValue;
        if (typeof firstValue === 'number' || typeof firstValue === 'boolean') return String(firstValue);
        if (Array.isArray(firstValue)) return `${firstValue.length} items`;
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

// Tool icon based on name
function getToolIcon(toolName: string) {
  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return (
        <svg className="size-3" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'Bash':
    case 'BashOutput':
    case 'KillShell':
      return (
        <svg className="size-3" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
          <path d="M282.88 788.48l-35.84-35.84L486.4 512c-42.24-38.4-142.08-130.56-225.28-215.04L243.2 279.04l35.84-35.84 17.92 17.92c107.52 107.52 241.92 230.4 243.2 231.68 5.12 5.12 7.68 11.52 8.96 17.92 0 6.4-2.56 14.08-7.68 19.2L282.88 788.48zM503.04 733.44h281.6v51.2h-281.6v-51.2z" fill="currentColor" />
        </svg>
      );
    case 'Grep':
    case 'Glob':
      return (
        <svg className="size-3" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return (
        <svg className="size-3" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
  }
}

// Nested tool display (simplified version for tools within Task)
function NestedToolDisplay({ toolUse }: { toolUse: ToolUseBlock }) {
  if (!toolUse || !toolUse.name) {
    return (
      <div className="border border-red-500/30 rounded-lg bg-red-900/20 p-2">
        <div className="text-xs text-red-400">Invalid tool data</div>
      </div>
    );
  }

  return (
    <div className="border border-white/5 rounded-lg bg-white/5 p-2">
      <div className="flex items-center gap-2">
        {getToolIcon(toolUse.name)}
        <span className="text-xs font-medium">{toolUse.name}</span>
        <span className="text-xs text-white/40 truncate">{getToolSummary(toolUse)}</span>
      </div>
    </div>
  );
}

interface TaskToolProps {
  toolUse: ToolUseBlock;
}

export function TaskToolComponent({ toolUse }: TaskToolProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Get generation state from context
  const { isGenerating, onStop } = useGeneration();

  // Parse tool data - compute values that will be used (handle errors gracefully)
  let input: Record<string, unknown> = {};
  let nestedToolsCount = 0;
  let agentName = 'Unknown Agent';
  let gradientClass = 'from-purple-500/20 to-blue-500/20';
  let parseError: Error | null = null;

  try {
    input = toolUse.input || {};
    nestedToolsCount = toolUse.nestedTools?.length || 0;
    agentName = String(input.subagent_type || 'Unknown Agent');
    gradientClass = getAgentGradientClass(toolUse.id || 'default');
  } catch (e) {
    parseError = e as Error;
  }

  // Live timer for elapsed seconds (updates every second while running)
  useEffect(() => {
    const isRunning = nestedToolsCount === 0 && isGenerating;
    if (!isRunning) return;

    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [nestedToolsCount, isGenerating]);

  // Detect stuck state (no nested tools after threshold)
  useEffect(() => {
    if (nestedToolsCount > 0) {
      setIsStuck(false);
      return;
    }

    const timer = setTimeout(() => {
      if (nestedToolsCount === 0 && isGenerating) {
        setIsStuck(true);
      }
    }, STUCK_THRESHOLD_MS);

    return () => clearTimeout(timer);
  }, [nestedToolsCount, isGenerating]);

  // Handle parse error after hooks
  if (parseError) {
    return (
      <div className="w-full border border-red-500/30 rounded-xl my-3 p-4 bg-red-900/20">
        <div className="text-sm text-red-400">
          <strong>Task Tool Error:</strong> {parseError.message}
        </div>
      </div>
    );
  }

  const _isRunning = nestedToolsCount === 0 && isGenerating;

  const summary = nestedToolsCount > 0
    ? `Used ${nestedToolsCount} tool${nestedToolsCount !== 1 ? 's' : ''}`
    : isStuck
      ? `Stuck (${elapsedSeconds}s) - No response`
      : `Running... (${elapsedSeconds}s)`;

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <RobotIcon />
          <span className={`text-sm font-medium leading-6 ${gradientClass}`}>{agentName}</span>
          <div className="bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-white/60">
            {summary}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          {/* Stop button when stuck */}
          {isStuck && (
            <button
              onClick={onStop}
              className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              title="Stop generation"
            >
              Stop
            </button>
          )}
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
          {!!input.subagent_type && (
            <div>
              <span className="text-xs font-semibold text-white/60">Agent Type:</span>
              <div className="text-sm mt-1">{String(input.subagent_type)}</div>
            </div>
          )}
          {!!input.description && (
            <div>
              <span className="text-xs font-semibold text-white/60">Task Description:</span>
              <div className="text-sm mt-1">{String(input.description)}</div>
            </div>
          )}
          {!!input.prompt && (
            <div>
              <span className="text-xs font-semibold text-white/60">Task Prompt:</span>
              <div className="text-sm mt-1 max-h-32 overflow-y-auto bg-black/20 p-2 rounded whitespace-pre-wrap break-words">
                {String(input.prompt).substring(0, 5000)}
                {String(input.prompt).length > 5000 && (
                  <span className="text-xs text-white/40"> (truncated)</span>
                )}
              </div>
            </div>
          )}
          {nestedToolsCount > 0 && (
            <div>
              <span className="text-xs font-semibold text-white/60">Tools Used ({nestedToolsCount}):</span>
              <div className="mt-2 space-y-2">
                {toolUse.nestedTools?.map((nestedTool, index) => (
                  <NestedToolDisplay key={nestedTool.id || index} toolUse={nestedTool} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
