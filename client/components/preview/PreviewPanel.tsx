/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useRef, useEffect } from 'react';
import { Monitor, Smartphone, RefreshCw, Settings, Home, ArrowRight, X, ExternalLink } from 'lucide-react';

type DeviceMode = 'desktop' | 'mobile';

interface PreviewPanelProps {
  previewUrl: string | null;
  isLoading?: boolean;
  workingDirectory?: string;
  onSettingsClick?: () => void;
  onClose?: () => void;
}

export function PreviewPanel({
  previewUrl,
  isLoading = false,
  workingDirectory,
  onSettingsClick,
  onClose
}: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [currentRoute, setCurrentRoute] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Could implement port detection logic here when workingDirectory is available
  }, [previewUrl, workingDirectory]);

  const refreshPreview = () => {
    if (iframeRef.current && previewUrl) {
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

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (!previewUrl) {
    return (
      <div
        className="h-full w-full flex items-center justify-center"
        style={{ background: 'rgb(var(--bg-secondary))' }}
      >
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🖥️</div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            No Preview Available
          </h3>
          <p
            className="mb-6"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            Start a development server in your working directory to see a live preview.
          </p>
          <div
            className="text-sm rounded-lg p-4 text-left font-mono"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              color: 'rgb(var(--text-secondary))'
            }}
          >
            <div className="mb-2 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Common commands:
            </div>
            <div>• npm run dev</div>
            <div>• bun run dev</div>
            <div>• python -m http.server</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'rgb(var(--bg-secondary))' }}
    >
      {/* Preview Controls */}
      <div
        className="px-4 h-[60px] flex items-center justify-between flex-shrink-0"
        style={{
          background: 'rgb(var(--bg-primary))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Route Navigation */}
          <div
            className="h-9 flex items-center rounded-lg px-3"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Home className="w-3 h-3 mr-2" style={{ color: 'rgb(var(--text-secondary))' }} />
            <span className="text-sm mr-1" style={{ color: 'rgb(var(--text-secondary))' }}>/</span>
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
              className="bg-transparent text-sm outline-none w-32"
              style={{ color: 'rgb(var(--text-primary))' }}
              placeholder="route"
            />
            <button
              onClick={() => navigateToRoute(currentRoute)}
              className="ml-2 transition-colors hover:opacity-80"
              style={{ color: 'rgb(var(--text-secondary))' }}
              title="Navigate"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshPreview}
            className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              color: 'rgb(var(--text-secondary))'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgb(var(--bg-tertiary))';
            }}
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Device Mode Toggle */}
          <div
            className="h-9 flex items-center gap-1 rounded-lg px-1"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              aria-label="Desktop preview"
              className="h-7 w-7 flex items-center justify-center rounded transition-colors"
              style={{
                color: deviceMode === 'desktop' ? 'rgb(var(--blue-accent))' : 'rgb(var(--text-secondary))',
                background: deviceMode === 'desktop' ? 'rgba(59, 130, 246, 0.15)' : 'transparent'
              }}
              onClick={() => setDeviceMode('desktop')}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              aria-label="Mobile preview"
              className="h-7 w-7 flex items-center justify-center rounded transition-colors"
              style={{
                color: deviceMode === 'mobile' ? 'rgb(var(--blue-accent))' : 'rgb(var(--text-secondary))',
                background: deviceMode === 'mobile' ? 'rgba(59, 130, 246, 0.15)' : 'transparent'
              }}
              onClick={() => setDeviceMode('mobile')}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Open in new tab */}
          <button
            onClick={openInNewTab}
            className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              color: 'rgb(var(--text-secondary))'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgb(var(--bg-tertiary))';
            }}
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* URL Display */}
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              color: 'rgb(var(--text-secondary))'
            }}
          >
            {previewUrl}
          </span>

          {/* Settings Button */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
              style={{
                background: 'rgb(var(--bg-tertiary))',
                color: 'rgb(var(--text-secondary))'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgb(var(--bg-tertiary))';
              }}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
              style={{
                background: 'rgb(var(--bg-tertiary))',
                color: 'rgb(var(--text-secondary))'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgb(var(--bg-tertiary))';
                e.currentTarget.style.color = 'rgb(var(--text-secondary))';
              }}
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ background: 'rgb(var(--bg-tertiary))' }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                style={{ borderColor: 'rgb(var(--blue-accent))' }}
              />
              <p style={{ color: 'rgb(var(--text-secondary))' }}>Loading preview...</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div
              className={`bg-white ${
                deviceMode === 'mobile'
                  ? 'w-[375px] h-[667px] rounded-[25px] border-8 border-gray-800 shadow-2xl'
                  : 'w-full h-full rounded-lg shadow-lg'
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
      </div>
    </div>
  );
}
