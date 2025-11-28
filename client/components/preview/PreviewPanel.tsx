/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useRef, useEffect } from 'react';
import { Monitor, Smartphone, RefreshCw, Settings, Home, ArrowRight } from 'lucide-react';

type DeviceMode = 'desktop' | 'mobile';

interface PreviewPanelProps {
  previewUrl: string | null;
  isLoading?: boolean;
  workingDirectory?: string;
  onSettingsClick?: () => void;
}

export function PreviewPanel({
  previewUrl,
  isLoading = false,
  workingDirectory,
  onSettingsClick
}: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [currentRoute, setCurrentRoute] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reserved for future auto-detection from workingDirectory
  useEffect(() => {
    // Could implement port detection logic here when workingDirectory is available
  }, [previewUrl, workingDirectory]);

  const refreshPreview = () => {
    if (iframeRef.current && previewUrl) {
      // Force iframe reload by temporarily clearing src then restoring it
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 10);
    }
  };

  const navigateToRoute = (route: string) => {
    if (iframeRef.current && previewUrl) {
      const baseUrl = previewUrl.replace(/\/$/, '');
      const cleanRoute = route.startsWith('/') ? route : `/${route}`;
      iframeRef.current.src = `${baseUrl}${cleanRoute}`;
    }
  };

  if (!previewUrl) {
    return (
      <div className="h-full w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🖥️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Preview Available
          </h3>
          <p className="text-gray-600 mb-6">
            Start a development server in your working directory to see a live preview.
          </p>
          <div className="text-sm text-gray-500 bg-gray-100 rounded-lg p-4 text-left font-mono">
            <div className="mb-2 font-semibold text-gray-700">Common commands:</div>
            <div>• npm run dev</div>
            <div>• bun run dev</div>
            <div>• python -m http.server</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Controls */}
      <div className="bg-white border-b border-gray-200 px-4 h-[60px] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Route Navigation */}
          <div className="h-9 flex items-center bg-gray-100 rounded-lg px-3 border border-gray-200">
            <Home className="w-3 h-3 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500 mr-1">/</span>
            <input
              type="text"
              value={currentRoute.startsWith('/') ? currentRoute.slice(1) : currentRoute}
              onChange={(e) => {
                const value = e.target.value;
                setCurrentRoute(value ? `/${value}` : '/');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateToRoute(currentRoute);
                }
              }}
              className="bg-transparent text-sm text-gray-700 outline-none w-40"
              placeholder="route"
            />
            <button
              onClick={() => navigateToRoute(currentRoute)}
              className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Navigate"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshPreview}
            className="h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Device Mode Toggle */}
          <div className="h-9 flex items-center gap-1 bg-gray-100 rounded-lg px-1 border border-gray-200">
            <button
              aria-label="Desktop preview"
              className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                deviceMode === 'desktop'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setDeviceMode('desktop')}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              aria-label="Mobile preview"
              className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                deviceMode === 'mobile'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setDeviceMode('mobile')}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Button */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative bg-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading preview...</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className={`bg-white ${
                deviceMode === 'mobile'
                  ? 'w-[375px] h-[667px] rounded-[25px] border-8 border-gray-800 shadow-2xl'
                  : 'w-full h-full'
              } overflow-hidden`}
            >
              <iframe
                ref={iframeRef}
                className="w-full h-full border-none bg-white"
                src={previewUrl}
                title="App Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                onError={() => {
                  console.error('Preview iframe failed to load');
                }}
              />
            </div>
          </div>
        )}

        {/* Error Overlay (hidden by default) */}
        <div
          id="preview-error-overlay"
          className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10 hidden"
        >
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Connection Issue
            </h3>
            <p className="text-gray-600 mb-4">
              The preview couldn&apos;t load properly. Try clicking the refresh button to reload the page.
            </p>
            <button
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              onClick={refreshPreview}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
