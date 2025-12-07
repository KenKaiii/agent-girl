/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * BuildPreviewPanel - The ultimate AI-powered visual page builder
 * Combines: Live preview + Element selection + Visual editing + AI editing
 * Yellow Pencil-style editing + bolt.new-like experience + Agent-Girl AI power
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Settings,
  Home,
  ArrowRight,
  X,
  ExternalLink,
  MousePointer2,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  Zap,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Code,
  Play,
  Pause,
} from 'lucide-react';
import {
  ElementSelector,
  type SelectedElement,
  type SelectionMode,
} from './ElementSelector';
import { VisualEditor, type EditContext } from './VisualEditor';
import { useLiveReload, detectFramework } from './PreviewIntelligence';
import { usePreviewEditing } from '../../hooks/useProjectDiscovery';
import { useFileSync } from '../../hooks/useFileSync';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface BuildPreviewPanelProps {
  previewUrl: string | null;
  isLoading?: boolean;
  workingDirectory?: string;
  onSettingsClick?: () => void;
  onClose?: () => void;
  onAIEdit?: (prompt: string, context: EditContext) => void;
  onDirectEdit?: (selector: string, changes: Record<string, string>) => void;
}

// Device dimensions
const DEVICE_SIZES: Record<DeviceMode, { width: number; height: number; label: string }> = {
  desktop: { width: 1920, height: 1080, label: 'Desktop' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  mobile: { width: 375, height: 667, label: 'Mobile' },
};

export function BuildPreviewPanel({
  previewUrl,
  isLoading = false,
  workingDirectory,
  onSettingsClick,
  onClose,
  onAIEdit,
  onDirectEdit,
}: BuildPreviewPanelProps) {
  // Device and navigation state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [currentRoute, setCurrentRoute] = useState('/');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selection state
  const [selectionEnabled, setSelectionEnabled] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('element');
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editorPosition, setEditorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Source file resolution state
  const [resolvedSourceFile, setResolvedSourceFile] = useState<string | null>(null);

  // Live reload hook
  const { refresh, isReloading, lastReloadTime } = useLiveReload(
    iframeRef,
    previewUrl,
    () => {
      // Optionally re-apply selection after reload
    }
  );

  // Detect framework
  const framework = previewUrl ? detectFramework(previewUrl) : null;

  // Use preview editing hook for intelligent file routing
  const {
    projectPath: resolvedProjectPath,
    sourceFile,
    resolveElement,
    framework: detectedFramework,
  } = usePreviewEditing(previewUrl);

  // Use the resolved or prop-provided project path
  const activeProjectPath = resolvedProjectPath || workingDirectory || null;

  // File sync hook for real file operations
  const {
    searchReplace,
    applyStyle,
    writeFile,
    readFile,
    searchFiles,
    isLoading: isSyncing,
    error: syncError,
  } = useFileSync(activeProjectPath || undefined);

  // Resolve source file when element is selected
  useEffect(() => {
    if (selectedElements.length > 0 && activeProjectPath) {
      const el = selectedElements[0];
      resolveElement(el.selector, el.tagName, el.className || '')
        .then((match) => {
          if (match) {
            setResolvedSourceFile(match.path);
          }
        });
    }
  }, [selectedElements, activeProjectPath, resolveElement]);

  // Handle element selection change
  const handleSelectionChange = useCallback((elements: SelectedElement[]) => {
    setSelectedElements(elements);
    if (elements.length > 0) {
      setShowEditor(true);
      // Dock editor to fixed position on the right side - no repositioning
      // Only set position once, not on every selection change
    }
  }, []);

  // Handle floating prompt open - no longer repositions, editor stays docked
  const handleOpenPrompt = useCallback((_element: SelectedElement, _position: { x: number; y: number }) => {
    setShowEditor(true);
    // Editor stays docked to the right side - no repositioning
  }, []);

  // Handle inline edit
  const handleInlineEdit = useCallback((element: SelectedElement, newText: string) => {
    if (onDirectEdit) {
      onDirectEdit(element.selector, { textContent: newText });
    }
  }, [onDirectEdit]);

  // Handle AI edit
  const handleAIEdit = useCallback((prompt: string, context: EditContext) => {
    if (onAIEdit) {
      onAIEdit(prompt, context);
    }
  }, [onAIEdit]);

  // Handle direct edit - syncs to both preview and source file
  const handleDirectEdit = useCallback(async (selector: string, changes: Record<string, string>) => {
    // Apply to preview immediately via callback
    if (onDirectEdit) {
      onDirectEdit(selector, changes);
    }

    // If we have a source file, sync the change to the actual file
    const targetFile = resolvedSourceFile || sourceFile;
    if (targetFile && activeProjectPath) {
      try {
        // For text content changes
        if (changes.textContent) {
          const oldText = selectedElements[0]?.textContent || '';
          if (oldText) {
            await searchReplace(targetFile, oldText.trim(), changes.textContent.trim());
            // NO HMR trigger for text edits:
            // - DOM already updated via contenteditable
            // - HMR would cause reload and lose visual state
            // - File is saved, framework picks up changes naturally
          }
        }

        // For style changes
        if (Object.keys(changes).some(k => k !== 'textContent' && k !== 'src')) {
          const styleChanges = { ...changes };
          delete styleChanges.textContent;
          delete styleChanges.src;
          if (Object.keys(styleChanges).length > 0) {
            await applyStyle(targetFile, selector, styleChanges);
            // Trigger HMR
            await fetch('/api/preview/hmr-trigger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: targetFile }),
            });
          }
        }
      } catch (err) {
        console.error('Failed to sync edit to file:', err);
      }
    }
  }, [onDirectEdit, resolvedSourceFile, sourceFile, activeProjectPath, selectedElements, searchReplace, applyStyle]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedElements([]);
    setShowEditor(false);
  }, []);

  // Navigate to route
  const navigateToRoute = useCallback((route: string) => {
    if (iframeRef.current && previewUrl) {
      const baseUrl = previewUrl.replace(/\/$/, '');
      const cleanRoute = route.startsWith('/') ? route : `/${route}`;
      iframeRef.current.src = `${baseUrl}${cleanRoute}`;
    }
  }, [previewUrl]);

  // Open in new tab
  const openInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  }, [previewUrl]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to disable selection
      if (e.key === 'Escape') {
        if (showEditor) {
          setShowEditor(false);
        } else if (selectionEnabled) {
          setSelectionEnabled(false);
          clearSelection();
        }
      }
      // V to toggle selection mode
      if (e.key === 'v' && !e.metaKey && !e.ctrlKey) {
        setSelectionEnabled((prev) => !prev);
      }
      // Cmd+R to refresh (prevent default)
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        refresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionEnabled, showEditor, clearSelection, refresh]);

  // No preview URL state
  if (!previewUrl) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full flex items-center justify-center"
        style={{ background: 'rgb(var(--bg-secondary))' }}
      >
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🏗️</div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            Build Mode bereit
          </h3>
          <p
            className="mb-6"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            Starte einen Entwicklungsserver um die Live-Vorschau zu sehen.
          </p>
          <div
            className="text-sm rounded-lg p-4 text-left font-mono"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              color: 'rgb(var(--text-secondary))',
            }}
          >
            <div className="mb-2 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Astro 5 starten:
            </div>
            <div>npm create astro@latest</div>
            <div>npm run dev</div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="mb-1 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                Website klonen:
              </div>
              <div>/clone https://example.com</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col"
      style={{ background: 'rgb(var(--bg-secondary))' }}
    >
      {/* Top Controls Bar */}
      <div
        className="px-3 h-[52px] flex items-center justify-between flex-shrink-0 gap-2"
        style={{
          background: 'rgb(var(--bg-primary))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          {/* Route input */}
          <div
            className="h-8 flex items-center rounded-lg px-2"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Home className="w-3 h-3 mr-1.5" style={{ color: 'rgb(var(--text-secondary))' }} />
            <span className="text-xs mr-1" style={{ color: 'rgb(var(--text-secondary))' }}>
              /
            </span>
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
              className="bg-transparent text-xs outline-none w-24"
              style={{ color: 'rgb(var(--text-primary))' }}
              placeholder="route"
            />
            <button
              onClick={() => navigateToRoute(currentRoute)}
              className="ml-1 transition-colors hover:opacity-80"
              style={{ color: 'rgb(var(--text-secondary))' }}
              title="Navigieren"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={isReloading}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              color: isReloading ? 'rgb(var(--blue-accent))' : 'rgb(var(--text-secondary))',
            }}
            title="Aktualisieren (⌘R)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
          </button>

          {/* Device toggle */}
          <div
            className="h-8 flex items-center gap-0.5 rounded-lg px-1"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((mode) => (
              <button
                key={mode}
                className="h-6 w-6 flex items-center justify-center rounded transition-colors"
                style={{
                  color: deviceMode === mode ? 'rgb(var(--blue-accent))' : 'rgb(var(--text-secondary))',
                  background: deviceMode === mode ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                }}
                onClick={() => setDeviceMode(mode)}
                title={DEVICE_SIZES[mode].label}
              >
                {mode === 'desktop' && <Monitor className="w-3.5 h-3.5" />}
                {mode === 'tablet' && <Tablet className="w-3.5 h-3.5" />}
                {mode === 'mobile' && <Smartphone className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Selection Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectionEnabled(!selectionEnabled);
              if (selectionEnabled) clearSelection();
            }}
            className={`h-8 flex items-center gap-2 px-3 rounded-lg text-xs font-medium transition-all ${
              selectionEnabled
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
            title="Auswahl-Modus (V)"
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            {selectionEnabled ? 'Auswahl aktiv' : 'Auswählen'}
          </button>

          {/* ModeSelector removed - only Smart mode */}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Framework badge */}
          {framework && (
            <span
              className="text-[10px] px-2 py-1 rounded font-medium"
              style={{
                background: framework === 'astro' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: framework === 'astro' ? '#ec4899' : '#3b82f6',
                border: `1px solid ${framework === 'astro' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }}
            >
              {framework.charAt(0).toUpperCase() + framework.slice(1)}
            </span>
          )}

          {/* URL display */}
          <span
            className="text-xs px-2 py-1 rounded truncate max-w-40"
            style={{
              background: 'rgb(var(--bg-tertiary))',
              color: 'rgb(var(--text-secondary))',
            }}
          >
            {previewUrl}
          </span>

          {/* Open in new tab */}
          <button
            onClick={openInNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgb(var(--text-secondary))' }}
            title="In neuem Tab öffnen"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgb(var(--text-secondary))' }}
            title="Vollbild"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'rgb(var(--text-secondary))' }}
              title="Einstellungen"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/15 hover:text-red-500"
              style={{ color: 'rgb(var(--text-secondary))' }}
              title="Schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SelectionToolbar removed - SmartEditToolbar in SplitScreenLayout handles this */}

      {/* Preview Area */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ background: 'rgb(var(--bg-tertiary))' }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3"
                style={{ borderColor: 'rgb(var(--blue-accent))' }}
              />
              <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Lade Vorschau...
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div
              className={`bg-white transition-all duration-300 ${
                deviceMode === 'mobile'
                  ? 'w-[375px] h-[667px] rounded-[30px] border-[8px] border-gray-800 shadow-2xl'
                  : deviceMode === 'tablet'
                  ? 'w-[768px] h-[1024px] max-h-full rounded-[20px] border-[6px] border-gray-800 shadow-2xl'
                  : 'w-full h-full rounded-lg shadow-lg'
              } overflow-hidden relative`}
            >
              <iframe
                ref={iframeRef}
                className="w-full h-full border-none bg-white"
                src={previewUrl}
                title="Live Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                onError={() => {
                  console.error('Preview iframe failed to load');
                }}
              />

              {/* Element Selector Overlay */}
              <ElementSelector
                iframeRef={iframeRef}
                enabled={selectionEnabled}
                selectionMode={selectionMode}
                selectedElements={selectedElements}
                onSelectionChange={handleSelectionChange}
                onModeChange={setSelectionMode}
                onOpenPrompt={handleOpenPrompt}
                onInlineEdit={handleInlineEdit}
              />
            </div>
          </div>
        )}

        {/* Visual Editor Panel - Docked to right side */}
        {showEditor && selectedElements.length > 0 && (
          <div
            className="absolute z-50"
            style={{
              right: 16,
              top: 64,
              maxHeight: 'calc(100% - 80px)',
            }}
          >
            <VisualEditor
              element={selectedElements[0]}
              elements={selectedElements}
              iframeRef={iframeRef}
              selectionMode={selectionMode}
              onModeChange={setSelectionMode}
              onAIEdit={handleAIEdit}
              onDirectEdit={handleDirectEdit}
              onClose={() => setShowEditor(false)}
              position={{ x: 0, y: 0 }}
              projectPath={activeProjectPath || undefined}
              sourceFilePath={resolvedSourceFile || sourceFile || undefined}
              onFileSaved={(filePath) => {
                console.log('File saved:', filePath);
                // Optionally refresh preview
              }}
            />
          </div>
        )}


        {/* Live reload indicator */}
        {lastReloadTime && (
          <div className="absolute top-4 right-4">
            <div
              className="px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
              }}
            >
              <Zap className="w-3 h-3" />
              Live
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
