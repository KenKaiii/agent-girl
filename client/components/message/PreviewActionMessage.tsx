/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Preview Action Message - Shows preview edit context in chat
 * Displays element selection, framework detection, and AI progress
 */

import React, { useState, memo } from 'react';

export interface PreviewActionData {
  type: 'preview_action';
  action: 'element_select' | 'style_change' | 'content_edit' | 'ai_request';
  previewUrl: string;
  elements: Array<{
    id: number;
    tagName: string;
    selector: string;
    textContent?: string;
    className?: string;
    styles?: {
      color?: string;
      backgroundColor?: string;
      fontSize?: string;
    };
  }>;
  fileContext?: {
    framework: string;
    routePattern?: string;
    possibleFiles: string[];
    resolvedFile?: string;
    componentHints?: string[];
  };
  viewport?: {
    device: string;
    width: number;
    height: number;
  };
  screenshot?: string;
  timestamp: string;
}

interface PreviewActionMessageProps {
  data: PreviewActionData;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

const actionLabels: Record<PreviewActionData['action'], { label: string; icon: string; color: string }> = {
  element_select: { label: 'Element Selected', icon: '🎯', color: 'blue' },
  style_change: { label: 'Style Change', icon: '🎨', color: 'purple' },
  content_edit: { label: 'Content Edit', icon: '✏️', color: 'orange' },
  ai_request: { label: 'AI Edit Request', icon: '✨', color: 'pink' },
};

const frameworkIcons: Record<string, string> = {
  astro: '🚀',
  nextjs: '▲',
  react: '⚛️',
  vue: '💚',
  svelte: '🔥',
  vite: '⚡',
  unknown: '📦',
};

export const PreviewActionMessage = memo(function PreviewActionMessage({ data }: PreviewActionMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);

  const actionInfo = actionLabels[data.action];
  const frameworkIcon = data.fileContext?.framework
    ? frameworkIcons[data.fileContext.framework] || frameworkIcons.unknown
    : null;

  return (
    <div className="mb-4 overflow-hidden">
      {/* Gradient border container */}
      <div
        className="p-[1px] rounded-xl"
        style={{
          background: data.action === 'ai_request'
            ? 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)'
            : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{actionInfo.icon}</span>
              <span className={`text-sm font-semibold text-${actionInfo.color}-600 dark:text-${actionInfo.color}-400`}>
                {actionInfo.label}
              </span>
              {frameworkIcon && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-1">
                  <span>{frameworkIcon}</span>
                  <span className="capitalize">{data.fileContext?.framework}</span>
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {formatTimestamp(data.timestamp)}
            </span>
          </div>

          {/* Preview URL */}
          <div className="mb-3 text-xs">
            <span className="text-gray-500">Preview: </span>
            <a
              href={data.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline font-mono"
            >
              {data.previewUrl}
            </a>
          </div>

          {/* Elements List */}
          {data.elements.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <span>📍</span>
                <span>Selected Elements ({data.elements.length})</span>
              </div>
              <div className="space-y-1.5">
                {data.elements.slice(0, isExpanded ? undefined : 3).map((el) => (
                  <div
                    key={el.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs"
                  >
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded text-xs font-bold">
                      {el.id}
                    </span>
                    <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                      &lt;{el.tagName.toLowerCase()}&gt;
                    </code>
                    {el.className && (
                      <span className="text-gray-400 truncate max-w-[150px]" title={el.className}>
                        .{el.className.split(' ')[0]}
                      </span>
                    )}
                    {el.textContent && (
                      <span className="text-gray-500 truncate max-w-[200px]" title={el.textContent}>
                        "{el.textContent.slice(0, 40)}{el.textContent.length > 40 ? '...' : ''}"
                      </span>
                    )}
                    {el.styles && (
                      <div className="flex items-center gap-1 ml-auto">
                        {el.styles.color && (
                          <span
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: el.styles.color }}
                            title={`Color: ${el.styles.color}`}
                          />
                        )}
                        {el.styles.backgroundColor && el.styles.backgroundColor !== 'transparent' && (
                          <span
                            className="w-3 h-3 rounded border border-gray-300"
                            style={{ backgroundColor: el.styles.backgroundColor }}
                            title={`Background: ${el.styles.backgroundColor}`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {data.elements.length > 3 && !isExpanded && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    +{data.elements.length - 3} more elements
                  </button>
                )}
              </div>
            </div>
          )}

          {/* File Context */}
          {data.fileContext && (
            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <span>📁</span>
                <span>Source Detection</span>
              </div>

              {data.fileContext.resolvedFile ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-500">✓</span>
                  <code className="text-green-600 dark:text-green-400 font-mono">
                    {data.fileContext.resolvedFile}
                  </code>
                </div>
              ) : data.fileContext.possibleFiles.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Possible source files:</span>
                  </div>
                  {data.fileContext.possibleFiles.slice(0, 3).map((file, i) => (
                    <code key={i} className="block text-xs text-gray-600 dark:text-gray-400 font-mono pl-4">
                      • {file}
                    </code>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  No source files detected
                </div>
              )}

              {data.fileContext.routePattern && (
                <div className="mt-2 text-xs text-gray-500">
                  Route: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{data.fileContext.routePattern}</code>
                </div>
              )}
            </div>
          )}

          {/* Viewport */}
          {data.viewport && (
            <div className="text-xs text-gray-500 flex items-center gap-2 mb-3">
              <span>📱</span>
              <span>{data.viewport.device}</span>
              <span className="text-gray-400">
                ({data.viewport.width}×{data.viewport.height})
              </span>
            </div>
          )}

          {/* Screenshot Preview */}
          {data.screenshot && (
            <div className="mt-3">
              <button
                onClick={() => setShowScreenshot(!showScreenshot)}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                <span>📷</span>
                <span>{showScreenshot ? 'Hide' : 'Show'} Screenshot</span>
              </button>
              {showScreenshot && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={data.screenshot}
                    alt="Preview screenshot"
                    className="w-full h-auto max-h-64 object-contain bg-gray-100 dark:bg-gray-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* AI Progress Indicator (for ai_request action) */}
          {data.action === 'ai_request' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                <span className="text-pink-600 dark:text-pink-400 font-medium">
                  AI is analyzing and editing...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
