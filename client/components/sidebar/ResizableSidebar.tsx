/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * ResizableSidebar - Wrapper component that adds drag-to-resize functionality
 */

import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResizableSidebarProps {
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;

export function ResizableSidebar({
  children,
  isOpen,
  onToggle,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
  storageKey = 'agent-girl-sidebar-width',
}: ResizableSidebarProps) {
  // Initialize width from localStorage
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Math.min(Math.max(parseInt(saved, 10), minWidth), maxWidth) : defaultWidth;
  });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isMobile, isTablet } = useResponsive();

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      onToggle();
    }
  }, [isMobile]);

  // Persist width to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, String(width));
  }, [width, storageKey]);

  // Handle drag events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const newWidth = e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minWidth, maxWidth]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleDoubleClick = useCallback(() => {
    setWidth(defaultWidth);
  }, [defaultWidth]);

  // Mobile: Full-screen overlay mode
  if (isMobile) {
    return (
      <>
        {/* Mobile overlay backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={onToggle}
          />
        )}

        {/* Mobile sidebar - slides from left */}
        <div
          ref={containerRef}
          className="fixed inset-y-0 left-0 z-50 flex"
          style={{
            width: isOpen ? `${Math.min(width, 320)}px` : '0px',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease-out, width 0.25s ease-out',
          }}
        >
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </>
    );
  }

  // Tablet: Smaller default, still resizable
  const tabletWidth = isTablet ? Math.min(width, 320) : width;

  // Desktop: Resizable sidebar with drag handle
  return (
    <div
      ref={containerRef}
      className="fixed inset-y-0 left-0 z-40 flex"
      style={{
        width: isOpen ? `${tabletWidth}px` : '0px',
        transition: isDragging ? 'none' : 'width 0.2s ease-out',
      }}
    >
      {/* Sidebar content */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
        }}
      >
        {children}
      </div>

      {/* Resize handle */}
      {isOpen && (
        <div
          className="flex-shrink-0 flex items-center justify-center group cursor-col-resize relative"
          style={{
            width: '10px',
            background: isDragging
              ? 'linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)'
              : 'transparent',
            transition: isDragging ? 'none' : 'all 0.2s ease',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
          }}
          onMouseDown={handleDragStart}
          onDoubleClick={handleDoubleClick}
          title="Drag to resize • Double-click to reset"
        >
          {/* Hover line indicator */}
          <div
            className="absolute inset-y-0 left-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background: isDragging
                ? 'transparent'
                : 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.5) 20%, rgba(139, 92, 246, 0.5) 80%, transparent 100%)',
            }}
          />

          {/* Grip icon - centered */}
          <div
            className="opacity-0 group-hover:opacity-60 transition-opacity duration-200"
            style={{
              color: isDragging ? '#fff' : 'rgb(var(--text-secondary))',
              transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.15s ease, opacity 0.2s ease',
            }}
          >
            <GripVertical size={12} />
          </div>

          {/* Wider hit area for easier dragging */}
          <div
            className="absolute inset-y-0 -left-2 -right-2"
            style={{ cursor: 'col-resize' }}
          />

          {/* Active drag glow */}
          {isDragging && (
            <div
              className="absolute inset-y-0 left-0 w-1"
              style={{
                background: 'linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)',
                boxShadow: '0 0 12px rgba(59, 130, 246, 0.6), 0 0 24px rgba(139, 92, 246, 0.4)',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Export hook for getting current sidebar width
export function useSidebarWidth(
  isOpen: boolean,
  storageKey = 'agent-girl-sidebar-width'
): number {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem(storageKey);
      if (saved) setWidth(parseInt(saved, 10));
    };

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', handleStorage);

    // Also poll for changes in same tab (localStorage doesn't fire events for same-tab changes)
    const interval = setInterval(() => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const newWidth = parseInt(saved, 10);
        if (newWidth !== width) setWidth(newWidth);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [storageKey, width]);

  return isOpen ? width : 0;
}
