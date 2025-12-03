/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Bolt.new-style integrated layout with chat and preview side-by-side
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatContainer, type AIEditRequest } from '../chat/ChatContainer';
import {
  AnnotationCanvas,
  AnnotationToolbar,
  AIEditPanel,
  LocalDataManager,
  useLocalData,
  useLiveReload,
  buildEnhancedContext,
} from '../preview';
import type { AnnotationTool, Annotation } from '../preview';
import {
  Monitor,
  Smartphone,
  RefreshCw,
  ExternalLink,
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

  // Annotation system state
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('rect');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState('#3b82f6');
  const [isAIEditPanelOpen, setIsAIEditPanelOpen] = useState(false);
  const [isLocalDataManagerOpen, setIsLocalDataManagerOpen] = useState(false);
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([]);
  const { fields: localDataFields, setFields: setLocalDataFields } = useLocalData();

  // AI Edit handler from ChatContainer
  const aiEditHandlerRef = useRef<((request: AIEditRequest) => void) | null>(null);

  // Refs for drag handling - use refs for immediate access without re-renders
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Live reload hook - auto-refresh on file changes
  const { refresh: refreshPreview, isReloading, lastReloadTime } = useLiveReload(
    iframeRef,
    previewUrl,
    () => console.log('HMR update detected')
  );

  // Preview container dimensions for canvas
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Toggle preview
  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

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

  // Open preview in new tab
  const openInNewTab = () => {
    if (previewUrl) window.open(previewUrl, '_blank');
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

  // Annotation handlers
  const handleAnnotationsChange = useCallback((newAnnotations: Annotation[]) => {
    setAnnotationHistory(prev => [...prev, annotations]);
    setAnnotations(newAnnotations);
  }, [annotations]);

  const handleUndoAnnotation = useCallback(() => {
    if (annotationHistory.length > 0) {
      const previous = annotationHistory[annotationHistory.length - 1];
      setAnnotations(previous);
      setAnnotationHistory(prev => prev.slice(0, -1));
    }
  }, [annotationHistory]);

  const handleClearAnnotations = useCallback(() => {
    if (annotations.length > 0) {
      setAnnotationHistory(prev => [...prev, annotations]);
      setAnnotations([]);
      setSelectedAnnotationId(null);
    }
  }, [annotations]);

  const handleSubmitToAI = useCallback(() => {
    setIsAIEditPanelOpen(true);
  }, []);

  // Capture screenshot of annotation area
  const captureAnnotationScreenshot = useCallback(async (): Promise<string | undefined> => {
    if (!previewContentRef.current || annotations.length === 0) return undefined;

    try {
      // Find the bounding box that contains all annotations
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;

      for (const annotation of annotations) {
        if (annotation.bounds) {
          minX = Math.min(minX, annotation.bounds.x);
          minY = Math.min(minY, annotation.bounds.y);
          maxX = Math.max(maxX, annotation.bounds.x + annotation.bounds.width);
          maxY = Math.max(maxY, annotation.bounds.y + annotation.bounds.height);
        } else if (annotation.points.length > 0) {
          for (const point of annotation.points) {
            minX = Math.min(minX, point.x - 20);
            minY = Math.min(minY, point.y - 20);
            maxX = Math.max(maxX, point.x + 20);
            maxY = Math.max(maxY, point.y + 20);
          }
        }
      }

      // Add some padding
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(previewDimensions.width, maxX + padding);
      maxY = Math.min(previewDimensions.height, maxY + padding);

      const width = maxX - minX;
      const height = maxY - minY;

      if (width <= 0 || height <= 0) return undefined;

      // Create a canvas and draw the preview area + annotations
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      // Fill with white background (iframe content)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw annotation indicators on the screenshot
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);

      for (const annotation of annotations) {
        if (annotation.bounds) {
          ctx.strokeRect(
            annotation.bounds.x - minX,
            annotation.bounds.y - minY,
            annotation.bounds.width,
            annotation.bounds.height
          );
        }
      }

      // Add a label showing this is a marked area
      ctx.setLineDash([]);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText('📍 Marked Area', 10, 20);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return undefined;
    }
  }, [annotations, previewDimensions]);

  const handleAIEditSubmit = useCallback(async (prompt: string, localData?: Record<string, string>) => {
    // Build context from annotations
    const annotationContext = annotations.map((a, i) => ({
      id: i + 1,
      type: a.tool,
      area: a.bounds ? `(${Math.round(a.bounds.x)}, ${Math.round(a.bounds.y)}) - ${Math.round(a.bounds.width)}x${Math.round(a.bounds.height)}` : 'freeform',
      note: a.text || undefined,
      bounds: a.bounds,
    }));

    // Capture screenshot of the annotated area
    const screenshot = await captureAnnotationScreenshot();

    // Get enhanced context with file paths and framework info
    const enhancedContext = previewUrl ? buildEnhancedContext(
      previewUrl,
      undefined, // elementInfo - could be added later with inspector
      {
        width: previewDimensions.width,
        height: previewDimensions.height,
        device: previewDevice,
      }
    ) : undefined;

    // Build AI edit request with enhanced context
    const editRequest: AIEditRequest = {
      prompt,
      annotations: annotationContext,
      previewUrl: previewUrl || '',
      screenshot,
      localData,
      // Add file path context to help AI find the right files
      fileContext: enhancedContext?.fileContext,
      viewport: enhancedContext?.viewport,
    };

    // Send to ChatContainer via the handler
    if (aiEditHandlerRef.current) {
      aiEditHandlerRef.current(editRequest);
    } else {
      // Fallback: log to console if handler not available
      console.log('AI Edit Request (handler not connected):', editRequest);
    }

    // Clear annotations after submission
    setAnnotations([]);
    setIsAIEditPanelOpen(false);
    setIsAnnotationMode(false);
  }, [annotations, previewUrl, previewDevice, previewDimensions, captureAnnotationScreenshot]);

  // Toggle annotation mode
  const toggleAnnotationMode = useCallback(() => {
    setIsAnnotationMode(prev => !prev);
    if (isAnnotationMode) {
      // Clear annotations when exiting annotation mode
      setAnnotations([]);
      setSelectedAnnotationId(null);
    }
  }, [isAnnotationMode]);

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

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex overflow-hidden"
      style={{ background: '#0a0a0b' }}
    >
      {/* Chat Panel */}
      <div
        className="h-full flex flex-col overflow-hidden relative"
        style={{
          width: showPreview && !isPreviewMaximized ? `${splitPosition}%` : isPreviewMaximized ? '0%' : '100%',
          minWidth: showPreview && !isPreviewMaximized ? '200px' : isPreviewMaximized ? '0' : undefined,
          transition: isDragging ? 'none' : 'width 0.2s ease-out',
          opacity: isPreviewMaximized ? 0 : 1,
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
            minWidth: isPreviewMaximized ? undefined : '200px',
            transition: isDragging ? 'none' : 'width 0.2s ease-out',
            background: '#111114',
          }}
        >
          {/* Preview Header - Compact */}
          <div
            className="flex items-center justify-between px-3 flex-shrink-0"
            style={{
              height: '44px',
              background: '#0d0d0f',
              borderBottom: '1px solid #222',
            }}
          >
            {/* Left: URL Display */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Globe size={14} className="text-gray-500 flex-shrink-0" />
              <button
                onClick={handleSetPreviewUrl}
                className="text-xs truncate hover:text-gray-300 transition-colors text-left"
                style={{
                  color: '#888',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Click to change URL"
              >
                {previewUrl || 'No URL - Click to set'}
              </button>
            </div>

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
              {/* Annotation Mode Toggle */}
              <button
                onClick={toggleAnnotationMode}
                className="p-1.5 rounded transition-colors"
                style={{
                  background: isAnnotationMode ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: isAnnotationMode ? '#3b82f6' : '#666',
                }}
                title={isAnnotationMode ? 'Exit annotation mode' : 'Annotate preview'}
              >
                <Pencil size={13} />
              </button>
              {/* Local Data Manager */}
              <button
                onClick={() => setIsLocalDataManagerOpen(true)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
                title="Local data (Impressum, etc.)"
              >
                <Database size={13} />
              </button>
              {/* Divider */}
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={refreshPreview}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
                title={lastReloadTime ? `Refresh (last: ${lastReloadTime.toLocaleTimeString()})` : 'Refresh'}
                disabled={isReloading}
              >
                <RefreshCw size={13} className={isReloading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={openInNewTab}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
                title="Open in new tab"
              >
                <ExternalLink size={13} />
              </button>
              <button
                onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
                title={isPreviewMaximized ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isPreviewMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                onClick={togglePreview}
                className="p-1.5 rounded hover:bg-red-500/20 transition-colors text-gray-500 hover:text-red-400"
                title="Close preview"
              >
                <X size={13} />
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

                {/* Annotation Canvas Overlay */}
                {isAnnotationMode && previewDimensions.width > 0 && (
                  <AnnotationCanvas
                    width={previewDimensions.width}
                    height={previewDimensions.height}
                    activeTool={activeTool}
                    annotations={annotations}
                    onAnnotationsChange={handleAnnotationsChange}
                    selectedAnnotationId={selectedAnnotationId}
                    onSelectAnnotation={setSelectedAnnotationId}
                    color={annotationColor}
                    strokeWidth={3}
                  />
                )}
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

            {/* Annotation Toolbar - Floating at bottom */}
            {isAnnotationMode && previewUrl && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <AnnotationToolbar
                  activeTool={activeTool}
                  onToolChange={setActiveTool}
                  annotations={annotations}
                  onClearAll={handleClearAnnotations}
                  onUndo={handleUndoAnnotation}
                  onSubmitToAI={handleSubmitToAI}
                  selectedColor={annotationColor}
                  onColorChange={setAnnotationColor}
                />
              </div>
            )}

            {/* AI Edit Panel */}
            <AIEditPanel
              isOpen={isAIEditPanelOpen}
              onClose={() => setIsAIEditPanelOpen(false)}
              annotations={annotations}
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
