/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { ChatContainer } from '../chat/ChatContainer';
import { PreviewPanel } from '../preview/PreviewPanel';
import { toast } from '../../utils/toast';

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

  // Working directory from session (reserved for future use)
  const [workingDirectory] = useState<string | null>(null);

  // Auto-detect preview URL and auto-switch to split-screen when dev server detected
  useEffect(() => {
    const autoDetect = async () => {
      // Try to detect dev server
      const detected = await detectPreviewUrl();

      // If dev server detected and we're in chat-only mode, auto-switch to split-screen
      if (detected && layoutMode === 'chat-only') {
        console.log('🎨 Web dev server detected - auto-switching to split-screen mode');
        setLayoutMode('split-screen');
        toast.success('Preview detected!', {
          description: `Found dev server at ${previewUrl} - switched to split-screen mode`,
          duration: 5000,
        });
      }
    };

    // Run detection every 5 seconds when in chat-only mode
    if (layoutMode === 'chat-only') {
      const interval = setInterval(autoDetect, 5000);
      autoDetect(); // Run immediately too
      return () => clearInterval(interval);
    } else if (!previewUrl) {
      // If in split-screen mode but no URL, try to detect once
      detectPreviewUrl();
    }
  }, [layoutMode, previewUrl]);

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

  const detectPreviewUrl = async (): Promise<boolean> => {
    // Try common dev server ports (skip 3001 as that's our app)
    const commonPorts = [3000, 4000, 5000, 5173, 8080, 8000];

    for (const port of commonPorts) {
      try {
        const url = `http://localhost:${port}`;
        // Try to fetch - if it works, server is running
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        await fetch(url, {
          method: 'HEAD',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        // If we get here without error, the server is running
        setPreviewUrl(url);
        console.log(`✅ Detected dev server at ${url}`);
        return true; // Return true when detected
      } catch {
        // Port not available or request failed, try next
        continue;
      }
    }

    console.log('ℹ️ No dev server detected on common ports');
    return false; // Return false when not detected
  };

  const handleManualPreviewUrl = () => {
    const url = prompt('Enter preview URL (e.g., http://localhost:3000):', previewUrl || 'http://localhost:3000');
    if (url) {
      setPreviewUrl(url);
      setLayoutMode('split-screen');
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {layoutMode === 'chat-only' ? (
        /* Chat Only Mode - Full Width */
        <div className="w-full h-full">
          <ChatContainer
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
            previewUrl={previewUrl}
            onSetPreviewUrl={handleManualPreviewUrl}
            onDetectPreviewUrl={detectPreviewUrl}
          />
        </div>
      ) : (
        /* Split Screen Mode - Chat Left (40%), Preview Right (60%) */
        <>
          {/* Chat Panel */}
          <div className="h-full border-r border-gray-200" style={{ width: '40%' }}>
            <ChatContainer
              layoutMode={layoutMode}
              onLayoutModeChange={setLayoutMode}
              previewUrl={previewUrl}
              onSetPreviewUrl={handleManualPreviewUrl}
              onDetectPreviewUrl={detectPreviewUrl}
            />
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
  );
}
