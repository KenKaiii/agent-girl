/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Bolt.new-style integrated layout with chat and preview side-by-side
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatContainer, type AIEditRequest, type AIProgressState, type ActionHistoryEntry } from '../chat/ChatContainer';
import {
  ElementSelector,
  ModeSelector,
  SelectionToolbar,
  FloatingPrompt,
  AIEditPanel,
  LocalDataManager,
  useLocalData,
  useLiveReload,
  buildEnhancedContext,
  PortFinder,
} from '../preview';
import type { SelectedElement, SelectionMode } from '../preview';
import {
  Monitor,
  Smartphone,
  X,
  GripVertical,
  Maximize2,
  Minimize2,
  Globe,
  Tablet,
  Pencil,
  Database,
  Laptop,
  ChevronDown,
  Loader2,
  Zap,
  Check,
  AlertCircle,
  FileEdit,
  Clock,
  History,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// Extended device types with real device presets
type PreviewDevice =
  | 'desktop'
  | 'laptop'
  | 'tablet-landscape'
  | 'tablet-portrait'
  | 'ipad-pro'
  | 'iphone-15-pro'
  | 'iphone-se'
  | 'android-large'
  | 'android-small';

interface DevicePreset {
  id: PreviewDevice;
  name: string;
  width: number;
  height: number;
  category: 'desktop' | 'tablet' | 'mobile';
  icon: 'monitor' | 'laptop' | 'tablet' | 'smartphone';
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'desktop', name: 'Desktop (1920×1080)', width: 1920, height: 1080, category: 'desktop', icon: 'monitor' },
  { id: 'laptop', name: 'Laptop (1440×900)', width: 1440, height: 900, category: 'desktop', icon: 'laptop' },
  { id: 'ipad-pro', name: 'iPad Pro (1024×1366)', width: 1024, height: 1366, category: 'tablet', icon: 'tablet' },
  { id: 'tablet-landscape', name: 'Tablet Landscape (1024×768)', width: 1024, height: 768, category: 'tablet', icon: 'tablet' },
  { id: 'tablet-portrait', name: 'Tablet Portrait (768×1024)', width: 768, height: 1024, category: 'tablet', icon: 'tablet' },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro (393×852)', width: 393, height: 852, category: 'mobile', icon: 'smartphone' },
  { id: 'iphone-se', name: 'iPhone SE (375×667)', width: 375, height: 667, category: 'mobile', icon: 'smartphone' },
  { id: 'android-large', name: 'Android Large (412×915)', width: 412, height: 915, category: 'mobile', icon: 'smartphone' },
  { id: 'android-small', name: 'Android Small (360×640)', width: 360, height: 640, category: 'mobile', icon: 'smartphone' },
];

export function SplitScreenLayout() {
  // Preview panel state
  const [showPreview, setShowPreview] = useState(() => {
    const saved = localStorage.getItem('agent-girl-show-preview');
    return saved === 'true';
  });

  // Split position (percentage for chat panel)
  const [splitPosition, setSplitPosition] = useState(() => {
    const saved = localStorage.getItem('agent-girl-split-position');
    return saved ? parseFloat(saved) : 55;
  });

  // Preview URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    return localStorage.getItem('agent-girl-preview-url') || null;
  });

  // Preview device mode
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const devicePickerRef = useRef<HTMLDivElement>(null);

  // Is preview maximized (full width)
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);

  // Element selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('element');
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
  const [isAIEditPanelOpen, setIsAIEditPanelOpen] = useState(false);
  const [isLocalDataManagerOpen, setIsLocalDataManagerOpen] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);
  const [floatingPromptPosition, setFloatingPromptPosition] = useState({ x: 0, y: 0 });
  const { fields: localDataFields, setFields: setLocalDataFields } = useLocalData();

  // AI Edit handler from ChatContainer
  const aiEditHandlerRef = useRef<((request: AIEditRequest) => void) | null>(null);

  // AI progress state for showing tool usage in preview header
  const [aiProgress, setAIProgress] = useState<AIProgressState>({
    isActive: false,
    status: 'idle',
  });

  // Track if we should auto-refresh after file edit
  const pendingRefreshRef = useRef(false);
  const editedFilesCountRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Action history for showing recent tool operations
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [showActionHistory, setShowActionHistory] = useState(false);
  const actionHistoryRef = useRef<HTMLDivElement>(null);

  // Refs for drag handling - use refs for immediate access without re-renders
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Live reload hook - auto-refresh on file changes
  const { refresh: refreshPreview, isReloading } = useLiveReload(
    iframeRef,
    previewUrl,
    () => console.log('HMR update detected')
  );

  // Handle AI progress changes - auto-refresh after file edits complete
  const handleAIProgressChange = useCallback((progress: AIProgressState & { newAction?: ActionHistoryEntry }) => {
    // Clear any pending completion timeout
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    // Track start time on first activity
    if (progress.isActive && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      editedFilesCountRef.current = 0;
    }

    // Count edited files
    if (progress.isFileEdit) {
      editedFilesCountRef.current += 1;
      pendingRefreshRef.current = true;
    }

    // Handle new action from tool_use - add to history
    if (progress.newAction) {
      setActionHistory(prev => {
        // Mark previous running action as success (if exists)
        const updated = prev.map(a =>
          a.status === 'running'
            ? { ...a, status: 'success' as const, duration: Date.now() - a.timestamp }
            : a
        );
        // Add new action (keep last 20)
        return [...updated, progress.newAction!].slice(-20);
      });
    }

    // Update state with tracked values
    setAIProgress({
      ...progress,
      editedFilesCount: editedFilesCountRef.current,
      startTime: startTimeRef.current || undefined,
      actionHistory, // Include current history
    });

    // Handle completion
    if (progress.status === 'completed' || progress.status === 'error') {
      // Mark any running actions as completed/error
      setActionHistory(prev =>
        prev.map(a =>
          a.status === 'running'
            ? {
                ...a,
                status: progress.status === 'error' ? 'error' : 'success',
                duration: Date.now() - a.timestamp,
              }
            : a
        )
      );

      // Trigger refresh if we have pending edits
      if (pendingRefreshRef.current && progress.status === 'completed') {
        pendingRefreshRef.current = false;
        setTimeout(() => {
          refreshPreview();
        }, 500);
      }

      // Show completion briefly then hide
      completionTimeoutRef.current = setTimeout(() => {
        setAIProgress({
          isActive: false,
          status: 'idle',
        });
        startTimeRef.current = null;
        editedFilesCountRef.current = 0;
      }, 2500);
    }
  }, [refreshPreview, actionHistory]);

  // Live elapsed time state (updates every second while active)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Update elapsed time every second while AI is active
  useEffect(() => {
    if (!aiProgress.isActive || !aiProgress.startTime) {
      return;
    }

    // Initial calculation
    setElapsedSeconds(Math.round((Date.now() - aiProgress.startTime) / 1000));

    // Update every second
    const interval = setInterval(() => {
      if (aiProgress.startTime) {
        setElapsedSeconds(Math.round((Date.now() - aiProgress.startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [aiProgress.isActive, aiProgress.startTime]);

  // Preview container dimensions for canvas
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Toggle preview
  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  // Keyboard shortcuts for preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + P to toggle preview
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        togglePreview();
      }
      // Cmd/Ctrl + Shift + R to refresh preview
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r' && showPreview) {
        e.preventDefault();
        refreshPreview();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePreview, showPreview, refreshPreview]);

  // Auto-detect preview URL on common ports
  const detectPreviewUrl = useCallback(async (): Promise<boolean> => {
    const commonPorts = [3000, 4000, 5000, 5173, 8080, 8000, 4321, 3002, 3003];

    for (const port of commonPorts) {
      // Skip our own port
      if (port === parseInt(window.location.port)) continue;

      try {
        const url = `http://localhost:${port}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500);

        await fetch(url, { method: 'HEAD', signal: controller.signal, mode: 'no-cors' });
        clearTimeout(timeoutId);

        setPreviewUrl(url);
        console.log(`Detected dev server at ${url}`);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem('agent-girl-show-preview', String(showPreview));
  }, [showPreview]);

  useEffect(() => {
    localStorage.setItem('agent-girl-split-position', String(splitPosition));
  }, [splitPosition]);

  useEffect(() => {
    if (previewUrl) {
      localStorage.setItem('agent-girl-preview-url', previewUrl);
    }
  }, [previewUrl]);

  // Auto-detect preview when opening
  useEffect(() => {
    if (showPreview && !previewUrl) {
      detectPreviewUrl();
    }
  }, [showPreview, previewUrl, detectPreviewUrl]);

  // Fixed drag handling - attach listeners to document
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Clamp between 10% and 90% for more flexibility
      const clampedPosition = Math.min(Math.max(newPosition, 10), 90);
      setSplitPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Re-enable pointer events on iframe
        if (iframeRef.current) {
          iframeRef.current.style.pointerEvents = 'auto';
        }
      }
    };

    // Always attach listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Keyboard shortcuts - Escape to exit selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Exit selection mode
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedElements([]);
          setShowFloatingPrompt(false);
        }
        // Close floating prompt if open
        if (showFloatingPrompt) {
          setShowFloatingPrompt(false);
        }
        // Close device picker if open
        if (showDevicePicker) {
          setShowDevicePicker(false);
        }
        // Close AI Edit panel if open
        if (isAIEditPanelOpen) {
          setIsAIEditPanelOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, showFloatingPrompt, showDevicePicker, isAIEditPanelOpen]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    // Disable pointer events on iframe during drag
    if (iframeRef.current) {
      iframeRef.current.style.pointerEvents = 'none';
    }
  };

  // Update preview dimensions when container size changes
  useEffect(() => {
    if (!previewContentRef.current) return;

    const updateDimensions = () => {
      if (previewContentRef.current) {
        setPreviewDimensions({
          width: previewContentRef.current.clientWidth,
          height: previewContentRef.current.clientHeight,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(previewContentRef.current);

    return () => resizeObserver.disconnect();
  }, [showPreview, previewDevice]);

  // Selection handlers
  const handleSelectionChange = useCallback((elements: SelectedElement[]) => {
    setSelectedElements(elements);

    // Position floating prompt next to last selected element
    if (elements.length > 0 && previewContentRef.current) {
      const lastElement = elements[elements.length - 1];
      const containerRect = previewContentRef.current.getBoundingClientRect();

      // Calculate position relative to container
      const x = Math.min(lastElement.bounds.x + lastElement.bounds.width + 20, containerRect.width - 320);
      const y = Math.max(lastElement.bounds.y, 60);

      setFloatingPromptPosition({ x: Math.max(20, x), y });
      setShowFloatingPrompt(true);
    } else {
      setShowFloatingPrompt(false);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedElements([]);
    setShowFloatingPrompt(false);
  }, []);

  const handleSubmitToAI = useCallback(() => {
    setShowFloatingPrompt(false);
    setIsAIEditPanelOpen(true);
  }, []);

  // Handle floating prompt submission
  const handleFloatingPromptSubmit = useCallback((prompt: string) => {
    // Build context and submit
    const elementContext = selectedElements.map((el, i) => ({
      id: i + 1,
      tagName: el.tagName,
      selector: el.selector,
      className: el.className,
      elementId: el.elementId,
      textContent: el.textContent,
      path: el.path.join(' > '),
      bounds: el.bounds,
      styles: el.computedStyles,
    }));

    const enhancedContext = previewUrl ? buildEnhancedContext(
      previewUrl,
      undefined,
      {
        width: previewDimensions.width,
        height: previewDimensions.height,
        device: previewDevice,
      }
    ) : undefined;

    const editRequest: AIEditRequest = {
      prompt,
      elements: elementContext,
      previewUrl: previewUrl || '',
      fileContext: enhancedContext?.fileContext,
      viewport: enhancedContext?.viewport,
    };

    if (aiEditHandlerRef.current) {
      aiEditHandlerRef.current(editRequest);
    }

    // Clear state
    setSelectedElements([]);
    setShowFloatingPrompt(false);
    setIsSelectionMode(false);
  }, [selectedElements, previewUrl, previewDimensions, previewDevice]);

  // Handle AI edit submission with selected elements
  const handleAIEditSubmit = useCallback(async (prompt: string, localData?: Record<string, string>) => {
    // Build context from selected elements
    const elementContext = selectedElements.map((el, i) => ({
      id: i + 1,
      tagName: el.tagName,
      selector: el.selector,
      className: el.className,
      elementId: el.elementId,
      textContent: el.textContent,
      path: el.path.join(' > '),
      bounds: el.bounds,
      styles: el.computedStyles,
    }));

    // Get enhanced context with file paths and framework info
    const enhancedContext = previewUrl ? buildEnhancedContext(
      previewUrl,
      undefined,
      {
        width: previewDimensions.width,
        height: previewDimensions.height,
        device: previewDevice,
      }
    ) : undefined;

    // Build AI edit request with element context
    const editRequest: AIEditRequest = {
      prompt,
      elements: elementContext,
      previewUrl: previewUrl || '',
      localData,
      fileContext: enhancedContext?.fileContext,
      viewport: enhancedContext?.viewport,
    };

    // Send to ChatContainer via the handler
    if (aiEditHandlerRef.current) {
      aiEditHandlerRef.current(editRequest);
    } else {
      console.log('AI Edit Request (handler not connected):', editRequest);
    }

    // Clear selection after submission
    setSelectedElements([]);
    setIsAIEditPanelOpen(false);
    setIsSelectionMode(false);
  }, [selectedElements, previewUrl, previewDevice, previewDimensions]);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      // Clear selection when exiting
      setSelectedElements([]);
    }
  }, [isSelectionMode]);

  // Set preview URL manually
  const handleSetPreviewUrl = () => {
    const url = prompt('Enter preview URL:', previewUrl || 'http://localhost:3000');
    if (url) {
      setPreviewUrl(url);
      if (!showPreview) setShowPreview(true);
    }
  };

  // Calculate dynamic scale based on available space
  const calculateDeviceScale = useCallback((deviceWidth: number, deviceHeight: number): number => {
    if (previewDimensions.width === 0 || previewDimensions.height === 0) return 0.5;

    // Available space with padding
    const availableWidth = previewDimensions.width - 32;
    const availableHeight = previewDimensions.height - 32;

    // Calculate scale to fit both dimensions
    const scaleX = availableWidth / deviceWidth;
    const scaleY = availableHeight / deviceHeight;

    // Use the smaller scale to ensure it fits, with min 0.2 and max 1
    return Math.max(0.2, Math.min(1, Math.min(scaleX, scaleY)));
  }, [previewDimensions]);

  // Device dimensions with dynamic scaling using presets
  const getDeviceDimensions = useCallback((device: PreviewDevice) => {
    const preset = DEVICE_PRESETS.find(p => p.id === device);

    if (!preset || preset.category === 'desktop') {
      return { width: '100%', height: '100%', scale: undefined, preset };
    }

    const scale = calculateDeviceScale(preset.width, preset.height);

    return {
      width: `${preset.width}px`,
      height: `${preset.height}px`,
      scale,
      preset,
    };
  }, [calculateDeviceScale]);

  const currentDeviceDimensions = getDeviceDimensions(previewDevice);
  const currentPreset = DEVICE_PRESETS.find(p => p.id === previewDevice);

  // Close device picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (devicePickerRef.current && !devicePickerRef.current.contains(e.target as Node)) {
        setShowDevicePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to get icon component
  const getDeviceIcon = (iconType: string, size = 13) => {
    switch (iconType) {
      case 'monitor': return <Monitor size={size} />;
      case 'laptop': return <Laptop size={size} />;
      case 'tablet': return <Tablet size={size} />;
      case 'smartphone': return <Smartphone size={size} />;
      default: return <Monitor size={size} />;
    }
  };

  // Close action history when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionHistoryRef.current && !actionHistoryRef.current.contains(e.target as Node)) {
        setShowActionHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts - Escape to exit selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Exit selection mode
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedElements([]);
          setShowFloatingPrompt(false);
        }
        // Close floating prompt if open
        if (showFloatingPrompt) {
          setShowFloatingPrompt(false);
        }
        // Close device picker if open
        if (showDevicePicker) {
          setShowDevicePicker(false);
        }
        // Close action history if open
        if (showActionHistory) {
          setShowActionHistory(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, showFloatingPrompt, showDevicePicker, showActionHistory]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex"
      style={{ background: '#0a0a0b', overflowY: 'hidden', overflowX: 'clip' }}
    >
      {/* Chat Panel - Responsive min/max widths for tablets and small screens */}
      <div
        className="h-full min-h-0 flex flex-col relative"
        style={{
          width: showPreview && !isPreviewMaximized ? `${splitPosition}%` : isPreviewMaximized ? '0%' : '100%',
          minWidth: showPreview && !isPreviewMaximized ? '320px' : isPreviewMaximized ? '0' : undefined,
          maxWidth: showPreview && !isPreviewMaximized ? 'calc(100% - 320px)' : undefined,
          transition: isDragging ? 'none' : 'width 0.2s ease-out',
          opacity: isPreviewMaximized ? 0 : 1,
          overflow: 'visible', // Allow sidebar resize handle to show
        }}
      >
        <ChatContainer
          layoutMode={showPreview ? 'split-screen' : 'chat-only'}
          onLayoutModeChange={(mode) => {
            if (mode === 'split-screen') {
              setShowPreview(true);
              if (!previewUrl) detectPreviewUrl();
            } else {
              setShowPreview(false);
            }
          }}
          previewUrl={previewUrl}
          onSetPreviewUrl={handleSetPreviewUrl}
          onDetectPreviewUrl={detectPreviewUrl}
          onAIEditRequestHandler={(handler) => {
            aiEditHandlerRef.current = handler;
          }}
          onAIProgressChange={handleAIProgressChange}
        />
      </div>

      {/* Resizable Divider */}
      {showPreview && !isPreviewMaximized && (
        <div
          className="h-full flex-shrink-0 flex items-center justify-center group relative z-50"
          style={{
            width: '8px',
            background: isDragging
              ? 'linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)'
              : '#1e1e22',
            cursor: 'col-resize',
            transition: isDragging ? 'none' : 'background 0.15s ease',
          }}
          onMouseDown={handleDragStart}
          onDoubleClick={() => setSplitPosition(55)}
          title="Drag to resize"
        >
          {/* Grip icon */}
          <div
            className="opacity-30 group-hover:opacity-100 transition-opacity duration-150"
            style={{
              color: isDragging ? '#fff' : '#888',
            }}
          >
            <GripVertical size={14} />
          </div>

          {/* Wider hit area */}
          <div
            className="absolute inset-y-0 -left-2 -right-2"
            style={{ cursor: 'col-resize' }}
          />
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && (
        <div
          className="h-full flex flex-col overflow-hidden"
          style={{
            width: isPreviewMaximized ? '100%' : `${100 - splitPosition}%`,
            minWidth: isPreviewMaximized ? undefined : '320px',
            maxWidth: isPreviewMaximized ? undefined : 'calc(100% - 320px)',
            transition: isDragging ? 'none' : 'width 0.2s ease-out',
            background: '#111114',
          }}
        >
          {/* Preview Header - Browser-Style */}
          <div
            className="flex items-center gap-2 px-3 flex-shrink-0"
            style={{
              height: '48px',
              background: '#0d0d0f',
              borderBottom: '1px solid #222',
            }}
          >
            {/* URL Bar with Port Finder */}
            <PortFinder
              currentUrl={previewUrl}
              onUrlChange={setPreviewUrl}
              onRefresh={refreshPreview}
              isReloading={isReloading}
            />

            {/* Center: Device Picker + Dimensions */}
            <div className="flex items-center gap-2 mx-2" ref={devicePickerRef}>
              {/* Quick Category Buttons */}
              <div
                className="flex items-center gap-0.5 p-0.5 rounded-md"
                style={{ background: '#1a1a1e' }}
              >
                {(['desktop', 'tablet', 'mobile'] as const).map((category) => {
                  const Icon = category === 'desktop' ? Monitor : category === 'tablet' ? Tablet : Smartphone;
                  const isActive = currentPreset?.category === category;
                  const defaultDevice = category === 'desktop' ? 'desktop' : category === 'tablet' ? 'tablet-portrait' : 'iphone-15-pro';
                  return (
                    <button
                      key={category}
                      onClick={() => setPreviewDevice(defaultDevice as PreviewDevice)}
                      className="p-1.5 rounded transition-all"
                      style={{
                        background: isActive ? '#3b82f6' : 'transparent',
                        color: isActive ? '#fff' : '#666',
                      }}
                      title={category.charAt(0).toUpperCase() + category.slice(1)}
                    >
                      <Icon size={13} />
                    </button>
                  );
                })}
              </div>

              {/* Device Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setShowDevicePicker(!showDevicePicker)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded transition-all"
                  style={{
                    background: '#1a1a1e',
                    color: '#888',
                    fontSize: '10px',
                    border: showDevicePicker ? '1px solid #3b82f6' : '1px solid transparent',
                  }}
                  title="Select device preset"
                >
                  {currentPreset && getDeviceIcon(currentPreset.icon, 11)}
                  <span className="font-mono">{currentPreset?.width || '100%'} × {currentPreset?.height || '100%'}</span>
                  <ChevronDown size={10} style={{ opacity: 0.6 }} />
                </button>

                {/* Device Picker Dropdown */}
                {showDevicePicker && (
                  <div
                    className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50"
                    style={{
                      background: '#1a1a1e',
                      border: '1px solid #333',
                      minWidth: '200px',
                    }}
                  >
                    {/* Desktop Category */}
                    <div className="px-2 py-1 text-xs font-semibold" style={{ color: '#666' }}>Desktop</div>
                    {DEVICE_PRESETS.filter(p => p.category === 'desktop').map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => { setPreviewDevice(preset.id); setShowDevicePicker(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 transition-colors text-left"
                        style={{ color: previewDevice === preset.id ? '#3b82f6' : '#ccc', fontSize: '11px' }}
                      >
                        {getDeviceIcon(preset.icon, 12)}
                        <span>{preset.name}</span>
                      </button>
                    ))}

                    <div className="border-t border-white/10 my-1" />

                    {/* Tablet Category */}
                    <div className="px-2 py-1 text-xs font-semibold" style={{ color: '#666' }}>Tablet</div>
                    {DEVICE_PRESETS.filter(p => p.category === 'tablet').map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => { setPreviewDevice(preset.id); setShowDevicePicker(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 transition-colors text-left"
                        style={{ color: previewDevice === preset.id ? '#3b82f6' : '#ccc', fontSize: '11px' }}
                      >
                        {getDeviceIcon(preset.icon, 12)}
                        <span>{preset.name}</span>
                      </button>
                    ))}

                    <div className="border-t border-white/10 my-1" />

                    {/* Mobile Category */}
                    <div className="px-2 py-1 text-xs font-semibold" style={{ color: '#666' }}>Mobile</div>
                    {DEVICE_PRESETS.filter(p => p.category === 'mobile').map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => { setPreviewDevice(preset.id); setShowDevicePicker(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 transition-colors text-left"
                        style={{ color: previewDevice === preset.id ? '#3b82f6' : '#ccc', fontSize: '11px' }}
                      >
                        {getDeviceIcon(preset.icon, 12)}
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pixel Dimensions Display */}
              {previewDimensions.width > 0 && currentDeviceDimensions.scale && (
                <div
                  className="text-xs font-mono px-2 py-1 rounded"
                  style={{
                    background: '#1a1a1e',
                    color: '#888',
                    fontSize: '10px',
                    letterSpacing: '0.02em',
                  }}
                  title="Actual rendered size"
                >
                  {Math.round(previewDimensions.width)} × {Math.round(previewDimensions.height)}px
                  <span style={{ color: '#666', marginLeft: '4px' }}>
                    ({Math.round(currentDeviceDimensions.scale * 100)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-0.5">
              {/* Selection Mode Selector - Only show when selection is active */}
              {isSelectionMode && (
                <ModeSelector
                  mode={selectionMode}
                  onModeChange={setSelectionMode}
                />
              )}

              {/* Selection Mode Toggle */}
              <button
                onClick={toggleSelectionMode}
                className="p-1.5 rounded transition-all"
                style={{
                  background: isSelectionMode ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: isSelectionMode ? '#3b82f6' : '#666',
                  boxShadow: isSelectionMode ? '0 0 0 1px rgba(59, 130, 246, 0.3)' : 'none',
                }}
                title={isSelectionMode ? 'Auswahl beenden (Esc)' : 'Elemente auswählen'}
              >
                <Pencil size={14} />
              </button>

              {/* Local Data Manager */}
              <button
                onClick={() => setIsLocalDataManagerOpen(true)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
                title="Local data (Impressum, etc.)"
              >
                <Database size={14} />
              </button>

              {/* AI Progress Indicator */}
              {(aiProgress.isActive || aiProgress.status === 'completed' || aiProgress.status === 'error') && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md ml-1 transition-all duration-300"
                  style={{
                    background: aiProgress.status === 'completed'
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))'
                      : aiProgress.status === 'error'
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))'
                        : aiProgress.status === 'thinking'
                          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))'
                          : aiProgress.isFileEdit
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))'
                            : 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.15))',
                    border: aiProgress.status === 'completed'
                      ? '1px solid rgba(34, 197, 94, 0.4)'
                      : aiProgress.status === 'error'
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : aiProgress.status === 'thinking'
                          ? '1px solid rgba(251, 191, 36, 0.3)'
                          : aiProgress.isFileEdit
                            ? '1px solid rgba(34, 197, 94, 0.3)'
                            : '1px solid rgba(236, 72, 153, 0.3)',
                  }}
                >
                  {/* Icon based on status */}
                  {aiProgress.status === 'completed' ? (
                    <Check size={12} style={{ color: '#22c55e' }} />
                  ) : aiProgress.status === 'error' ? (
                    <AlertCircle size={12} style={{ color: '#ef4444' }} />
                  ) : aiProgress.status === 'thinking' ? (
                    <Zap size={12} className="animate-pulse" style={{ color: '#fbbf24' }} />
                  ) : (
                    <Loader2 size={12} className="animate-spin" style={{ color: aiProgress.isFileEdit ? '#22c55e' : '#ec4899' }} />
                  )}

                  {/* Status text */}
                  <span className="text-xs font-medium" style={{
                    color: aiProgress.status === 'completed' ? '#86efac'
                      : aiProgress.status === 'error' ? '#fca5a5'
                        : aiProgress.status === 'thinking' ? '#fcd34d'
                          : aiProgress.isFileEdit ? '#86efac' : '#f9a8d4'
                  }}>
                    {aiProgress.status === 'completed'
                      ? 'Done!'
                      : aiProgress.status === 'error'
                        ? 'Error'
                        : aiProgress.toolDisplayName || aiProgress.currentTool || 'Processing...'}
                  </span>

                  {/* Current file (only when active) */}
                  {aiProgress.isActive && aiProgress.currentFile && (
                    <span className="text-xs font-mono truncate max-w-[100px]" style={{ color: '#a78bfa' }}>
                      {aiProgress.currentFile.split('/').pop()}
                    </span>
                  )}

                  {/* Edited files count */}
                  {aiProgress.editedFilesCount && aiProgress.editedFilesCount > 0 && (
                    <div className="flex items-center gap-0.5" style={{ color: '#86efac' }}>
                      <FileEdit size={10} />
                      <span className="text-xs">{aiProgress.editedFilesCount}</span>
                    </div>
                  )}

                  {/* Elapsed time (show while active or completed) */}
                  {(aiProgress.isActive || aiProgress.status === 'completed') && elapsedSeconds > 0 && (
                    <div className="flex items-center gap-0.5" style={{ color: '#9ca3af' }}>
                      <Clock size={10} />
                      <span className="text-xs font-mono">
                        {elapsedSeconds >= 60
                          ? `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
                          : `${elapsedSeconds}s`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action History Button + Dropdown */}
              <div className="relative" ref={actionHistoryRef}>
                <button
                  onClick={() => setShowActionHistory(!showActionHistory)}
                  className="p-1.5 rounded transition-all relative"
                  style={{
                    background: showActionHistory ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: actionHistory.length > 0 ? '#a78bfa' : '#666',
                  }}
                  title="Action history"
                >
                  <History size={14} />
                  {actionHistory.length > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[8px] font-bold flex items-center justify-center"
                      style={{ background: '#8b5cf6', color: '#fff' }}
                    >
                      {actionHistory.length > 9 ? '9+' : actionHistory.length}
                    </span>
                  )}
                </button>

                {/* Action History Dropdown */}
                {showActionHistory && (
                  <div
                    className="absolute top-full right-0 mt-1 py-2 rounded-lg shadow-xl z-50 overflow-hidden"
                    style={{
                      background: '#1a1a1e',
                      border: '1px solid #333',
                      width: '320px',
                      maxHeight: '400px',
                    }}
                  >
                    <div className="flex items-center justify-between px-3 pb-2 border-b border-white/10">
                      <span className="text-xs font-semibold" style={{ color: '#888' }}>Action History</span>
                      {actionHistory.length > 0 && (
                        <button
                          onClick={() => setActionHistory([])}
                          className="text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                          style={{ color: '#666' }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                      {actionHistory.length === 0 ? (
                        <div className="px-3 py-6 text-center" style={{ color: '#666' }}>
                          <History size={24} className="mx-auto mb-2 opacity-30" />
                          <p className="text-xs">No actions yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {[...actionHistory].reverse().map((action) => (
                            <div
                              key={action.id}
                              className="px-3 py-2 hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {/* Status icon */}
                                {action.status === 'running' ? (
                                  <Loader2 size={12} className="animate-spin" style={{ color: '#ec4899' }} />
                                ) : action.status === 'success' ? (
                                  <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                                ) : (
                                  <XCircle size={12} style={{ color: '#ef4444' }} />
                                )}

                                {/* Tool name */}
                                <span className="text-xs font-medium" style={{ color: '#ddd' }}>
                                  {action.toolDisplayName}
                                </span>

                                {/* File name */}
                                {action.file && (
                                  <>
                                    <ChevronRight size={10} style={{ color: '#555' }} />
                                    <span className="text-xs font-mono truncate" style={{ color: '#a78bfa', maxWidth: '120px' }}>
                                      {action.file.split('/').pop()}
                                    </span>
                                  </>
                                )}

                                {/* Duration */}
                                {action.duration !== undefined && (
                                  <span className="text-xs font-mono ml-auto" style={{ color: '#666' }}>
                                    {action.duration < 1000
                                      ? `${action.duration}ms`
                                      : `${(action.duration / 1000).toFixed(1)}s`}
                                  </span>
                                )}
                              </div>

                              {/* Full file path on hover */}
                              {action.file && (
                                <div
                                  className="text-xs font-mono mt-1 truncate"
                                  style={{ color: '#555', fontSize: '10px' }}
                                >
                                  {action.file}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-4 bg-white/10 mx-1" />

              {/* Window Controls */}
              <button
                onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
                title={isPreviewMaximized ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isPreviewMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={togglePreview}
                className="p-1.5 rounded hover:bg-red-500/20 transition-colors text-gray-500 hover:text-red-400"
                title="Close preview"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div
            ref={previewContentRef}
            className="flex-1 relative overflow-hidden flex items-center justify-center"
            style={{
              background: previewDevice === 'desktop'
                ? '#0a0a0a'
                : 'linear-gradient(145deg, #141418 0%, #0a0a0c 100%)',
              padding: previewDevice === 'desktop' ? 0 : '1rem',
            }}
          >
            {previewUrl ? (
              <div
                className="relative overflow-hidden"
                style={{
                  width: currentDeviceDimensions.width,
                  height: currentDeviceDimensions.height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: previewDevice !== 'desktop' ? '24px' : '0',
                  boxShadow: previewDevice !== 'desktop'
                    ? '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                    : 'none',
                  background: '#fff',
                  transform: currentDeviceDimensions.scale
                    ? `scale(${currentDeviceDimensions.scale})`
                    : undefined,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
              >
                {/* Device frame for mobile (notch) */}
                {DEVICE_PRESETS.find(d => d.id === previewDevice)?.category === 'mobile' && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
                    style={{
                      width: '120px',
                      height: '28px',
                      background: '#111',
                      borderRadius: '0 0 16px 16px',
                    }}
                  />
                )}

                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full border-none"
                  style={{ background: '#fff' }}
                  title="Preview"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />

                {/* Element Selector Overlay */}
                <ElementSelector
                  iframeRef={iframeRef}
                  enabled={isSelectionMode}
                  selectionMode={selectionMode}
                  selectedElements={selectedElements}
                  onSelectionChange={handleSelectionChange}
                  onModeChange={setSelectionMode}
                  onOpenPrompt={(element, pos) => {
                    setFloatingPromptPosition(pos);
                    setShowFloatingPrompt(true);
                  }}
                  onInlineEdit={(element, newText) => {
                    console.log('Inline edit:', element.selector, newText);
                    // Handle inline edit - could trigger AI or direct update
                  }}
                />
              </div>
            ) : (
              /* Empty state */
              <div className="text-center p-8 max-w-sm">
                <div
                  className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(59, 130, 246, 0.15)' }}
                >
                  <Globe size={28} className="text-blue-500" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-gray-200">
                  No Preview URL
                </h3>
                <p className="text-sm mb-5 text-gray-500">
                  Start a dev server or enter a URL to preview your app.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => detectPreviewUrl()}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    Auto-detect
                  </button>
                  <button
                    onClick={handleSetPreviewUrl}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white/10 hover:bg-white/15 text-gray-300"
                  >
                    Enter URL
                  </button>
                </div>
              </div>
            )}

            {/* Selection Toolbar - Floating at bottom */}
            {isSelectionMode && previewUrl && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <SelectionToolbar
                  selectedElements={selectedElements}
                  selectionMode={selectionMode}
                  onModeChange={setSelectionMode}
                  onClearSelection={handleClearSelection}
                  onSubmitToAI={handleSubmitToAI}
                />
              </div>
            )}

            {/* Floating Prompt - Next to selection */}
            {showFloatingPrompt && selectedElements.length > 0 && (
              <FloatingPrompt
                element={selectedElements[selectedElements.length - 1]}
                position={floatingPromptPosition}
                onSubmit={handleFloatingPromptSubmit}
                onClose={() => setShowFloatingPrompt(false)}
              />
            )}

            {/* AI Edit Panel */}
            <AIEditPanel
              isOpen={isAIEditPanelOpen}
              onClose={() => setIsAIEditPanelOpen(false)}
              selectedElements={selectedElements}
              onSubmit={handleAIEditSubmit}
              localDataFields={localDataFields}
              onLocalDataChange={(id, value) => {
                setLocalDataFields(localDataFields.map(f =>
                  f.id === id ? { ...f, value } : f
                ));
              }}
            />
          </div>
        </div>
      )}

      {/* Local Data Manager Modal */}
      <LocalDataManager
        isOpen={isLocalDataManagerOpen}
        onClose={() => setIsLocalDataManagerOpen(false)}
        fields={localDataFields}
        onFieldsChange={setLocalDataFields}
      />
    </div>
  );
}
