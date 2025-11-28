/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { ChatContainer } from '../chat/ChatContainer';
import { PreviewPanel } from '../preview/PreviewPanel';
import { Monitor, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';

type LayoutMode = 'chat-only' | 'split-screen';

export function SplitScreenLayout() {
  // Layout mode: chat-only or split-screen with preview
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('agent-girl-layout-mode');
    return (saved as LayoutMode) || 'chat-only';
  });

  // Preview URL (auto-detected or manually set)
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    const saved = localStorage.getItem('agent-girl-preview-url');
    return saved || null;
  });

  // Working directory from session
  const [workingDirectory, setWorkingDirectory] = useState<string | null>(null);

  // Auto-detect preview URL from common dev server ports
  useEffect(() => {
    if (!previewUrl && layoutMode === 'split-screen') {
      detectPreviewUrl();
    }
  }, [layoutMode]);

  // Persist layout mode
  useEffect(() => {
    localStorage.setItem('agent-girl-layout-mode', layoutMode);
  }, [layoutMode]);

  // Persist preview URL
  useEffect(() => {
    if (previewUrl) {
      localStorage.setItem('agent-girl-preview-url', previewUrl);
    }
  }, [previewUrl]);

  const detectPreviewUrl = async () => {
    // Try common dev server ports
    const commonPorts = [3000, 3001, 4000, 5000, 5173, 8080, 8000];

    for (const port of commonPorts) {
      try {
        const url = `http://localhost:${port}`;
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        // If we get here, the server is running
        setPreviewUrl(url);
        console.log(`✅ Detected dev server at ${url}`);
        return;
      } catch (error) {
        // Port not available, try next
        continue;
      }
    }

    console.log('ℹ️ No dev server detected on common ports');
  };

  const toggleLayout = () => {
    setLayoutMode(prev => prev === 'chat-only' ? 'split-screen' : 'chat-only');

    // If switching to split-screen and no preview URL, try to detect one
    if (layoutMode === 'chat-only' && !previewUrl) {
      detectPreviewUrl();
    }
  };

  const handleManualPreviewUrl = () => {
    const url = prompt('Enter preview URL (e.g., http://localhost:3000):', previewUrl || 'http://localhost:3000');
    if (url) {
      setPreviewUrl(url);
      setLayoutMode('split-screen');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar with Layout Toggle */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Agent Girl</span>
          <span className="text-xs text-gray-400">v9.1.0</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview URL Input */}
          {layoutMode === 'split-screen' && (
            <button
              onClick={handleManualPreviewUrl}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              title="Set preview URL"
            >
              {previewUrl ? 'Change URL' : 'Set URL'}
            </button>
          )}

          {/* Layout Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLayoutMode('chat-only')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                layoutMode === 'chat-only'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Chat only"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => {
                setLayoutMode('split-screen');
                if (!previewUrl) detectPreviewUrl();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                layoutMode === 'split-screen'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Split screen with preview"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleLayout}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title={layoutMode === 'chat-only' ? 'Show preview' : 'Hide preview'}
          >
            {layoutMode === 'chat-only' ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {layoutMode === 'chat-only' ? (
          /* Chat Only Mode - Full Width */
          <div className="w-full h-full">
            <ChatContainer />
          </div>
        ) : (
          /* Split Screen Mode - Chat Left (40%), Preview Right (60%) */
          <>
            {/* Chat Panel */}
            <div className="h-full border-r border-gray-200" style={{ width: '40%' }}>
              <ChatContainer />
            </div>

            {/* Preview Panel */}
            <div className="h-full" style={{ width: '60%' }}>
              <PreviewPanel
                previewUrl={previewUrl}
                workingDirectory={workingDirectory || undefined}
                onSettingsClick={() => {
                  // Could open settings modal here
                  console.log('Settings clicked');
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
