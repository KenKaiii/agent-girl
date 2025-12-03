/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Annotation Toolbar - Tool selection for preview annotations
 */

import React from 'react';
import {
  MousePointer2,
  Square,
  ArrowUpRight,
  Pencil,
  Type,
  Trash2,
  Send,
  Undo,
} from 'lucide-react';
import type { AnnotationTool, Annotation } from './AnnotationCanvas';

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  annotations: Annotation[];
  onClearAll: () => void;
  onUndo: () => void;
  onSubmitToAI: () => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

const TOOLS: { id: AnnotationTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select', icon: <MousePointer2 size={16} />, label: 'Select', shortcut: 'V' },
  { id: 'rect', icon: <Square size={16} />, label: 'Rectangle', shortcut: 'R' },
  { id: 'arrow', icon: <ArrowUpRight size={16} />, label: 'Arrow', shortcut: 'A' },
  { id: 'freehand', icon: <Pencil size={16} />, label: 'Freehand', shortcut: 'P' },
  { id: 'text', icon: <Type size={16} />, label: 'Text Note', shortcut: 'T' },
];

const COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#8b5cf6', label: 'Purple' },
];

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  annotations,
  onClearAll,
  onUndo,
  onSubmitToAI,
  selectedColor,
  onColorChange,
  disabled = false,
}: AnnotationToolbarProps) {
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      const tool = TOOLS.find(t => t.shortcut === key);
      if (tool) {
        e.preventDefault();
        onToolChange(tool.id);
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onToolChange, onUndo]);

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl"
      style={{
        background: 'rgba(17, 17, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            disabled={disabled}
            className="relative p-2 rounded-lg transition-all group"
            style={{
              background: activeTool === tool.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: activeTool === tool.id ? '#3b82f6' : '#888',
              opacity: disabled ? 0.5 : 1,
            }}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            {/* Active indicator */}
            {activeTool === tool.id && (
              <div
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                style={{ background: '#3b82f6' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            disabled={disabled}
            className="w-5 h-5 rounded-full transition-transform hover:scale-110"
            style={{
              background: color.value,
              boxShadow: selectedColor === color.value
                ? `0 0 0 2px #111, 0 0 0 3px ${color.value}`
                : 'none',
              opacity: disabled ? 0.5 : 1,
            }}
            title={color.label}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={disabled || annotations.length === 0}
          className="p-2 rounded-lg transition-all hover:bg-white/10"
          style={{
            color: '#888',
            opacity: disabled || annotations.length === 0 ? 0.3 : 1,
          }}
          title="Undo (Cmd+Z)"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={onClearAll}
          disabled={disabled || annotations.length === 0}
          className="p-2 rounded-lg transition-all hover:bg-red-500/20"
          style={{
            color: '#ef4444',
            opacity: disabled || annotations.length === 0 ? 0.3 : 1,
          }}
          title="Clear all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Submit to AI */}
      <button
        onClick={onSubmitToAI}
        disabled={disabled || annotations.length === 0}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all"
        style={{
          background: annotations.length > 0 ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
          color: annotations.length > 0 ? '#fff' : '#3b82f6',
          opacity: disabled || annotations.length === 0 ? 0.5 : 1,
        }}
        title="Send annotations to AI for editing"
      >
        <Send size={14} />
        <span>Edit with AI</span>
        {annotations.length > 0 && (
          <span
            className="px-1.5 py-0.5 text-xs rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.2)' }}
          >
            {annotations.length}
          </span>
        )}
      </button>
    </div>
  );
}
