/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * QuickToolbar - Floating toolbar for quick element editing
 * Appears near selected elements for fast direct manipulation
 */

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import type { SelectedElement } from './ElementSelector';

interface QuickToolbarProps {
  element: SelectedElement;
  position: { x: number; y: number };
  onStyleChange: (selector: string, styles: Record<string, string>) => void;
  onAIEdit: (prompt: string) => void;
  onOpenFullEditor: () => void;
}

// Font size options
const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px', '64px'];

// Color palette
const COLORS = [
  '#000000', '#ffffff', '#374151', '#6b7280',
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

export function QuickToolbar({
  element,
  position,
  onStyleChange,
  onAIEdit,
  onOpenFullEditor,
}: QuickToolbarProps) {
  const [showFontSize, setShowFontSize] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [activeColor, setActiveColor] = useState<'text' | 'bg'>('text');

  // Apply style helper
  const applyStyle = (style: Record<string, string>) => {
    onStyleChange(element.selector, style);
  };

  // Check if element has text styles applied
  const currentStyles = (element.computedStyles || {}) as Record<string, string>;
  const isBold = currentStyles['fontWeight'] === '700' || currentStyles['fontWeight'] === 'bold';
  const isItalic = currentStyles['fontStyle'] === 'italic';
  const isUnderline = currentStyles['textDecoration']?.includes('underline');
  const textAlign = currentStyles['textAlign'] || 'left';

  // Adjusted position to stay in viewport
  const adjustedPosition = {
    x: Math.max(10, Math.min(position.x - 150, window.innerWidth - 320)),
    y: Math.max(10, position.y - 50),
  };

  return (
    <div
      className="fixed z-[99999] flex items-center gap-0.5 p-1 rounded-lg"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        background: 'rgba(24, 24, 28, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Text formatting */}
      <div className="flex items-center gap-0.5 pr-1 border-r border-white/10">
        <button
          onClick={() => applyStyle({ fontWeight: isBold ? 'normal' : '700' })}
          className={`p-1.5 rounded transition-colors ${
            isBold ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Fett (⌘B)"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => applyStyle({ fontStyle: isItalic ? 'normal' : 'italic' })}
          className={`p-1.5 rounded transition-colors ${
            isItalic ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Kursiv (⌘I)"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => applyStyle({ textDecoration: isUnderline ? 'none' : 'underline' })}
          className={`p-1.5 rounded transition-colors ${
            isUnderline ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Unterstrichen (⌘U)"
        >
          <Underline size={14} />
        </button>
      </div>

      {/* Text alignment */}
      <div className="flex items-center gap-0.5 px-1 border-r border-white/10">
        <button
          onClick={() => applyStyle({ textAlign: 'left' })}
          className={`p-1.5 rounded transition-colors ${
            textAlign === 'left' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Links"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => applyStyle({ textAlign: 'center' })}
          className={`p-1.5 rounded transition-colors ${
            textAlign === 'center' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Zentriert"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => applyStyle({ textAlign: 'right' })}
          className={`p-1.5 rounded transition-colors ${
            textAlign === 'right' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Rechts"
        >
          <AlignRight size={14} />
        </button>
      </div>

      {/* Font size dropdown */}
      <div className="relative px-1 border-r border-white/10">
        <button
          onClick={() => {
            setShowFontSize(!showFontSize);
            setShowColors(false);
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Schriftgröße"
        >
          <Type size={14} />
          <span className="text-[10px]">{currentStyles['fontSize'] || '16px'}</span>
          <ChevronDown size={10} />
        </button>

        {showFontSize && (
          <div
            className="absolute top-full left-0 mt-1 py-1 rounded-lg min-w-[80px] max-h-48 overflow-y-auto"
            style={{
              background: 'rgba(24, 24, 28, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => {
                  applyStyle({ fontSize: size });
                  setShowFontSize(false);
                }}
                className={`w-full px-3 py-1 text-xs text-left transition-colors ${
                  currentStyles['fontSize'] === size
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color picker */}
      <div className="relative px-1 border-r border-white/10">
        <button
          onClick={() => {
            setShowColors(!showColors);
            setShowFontSize(false);
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Farben"
        >
          <Palette size={14} />
          <ChevronDown size={10} />
        </button>

        {showColors && (
          <div
            className="absolute top-full left-0 mt-1 p-2 rounded-lg"
            style={{
              background: 'rgba(24, 24, 28, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Color type toggle */}
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={() => setActiveColor('text')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeColor === 'text' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setActiveColor('bg')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeColor === 'bg' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                Hintergrund
              </button>
            </div>

            {/* Color grid */}
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    applyStyle(activeColor === 'text' ? { color } : { backgroundColor: color });
                    setShowColors(false);
                  }}
                  className="w-6 h-6 rounded border border-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Custom color input */}
            <input
              type="color"
              className="w-full h-6 mt-2 rounded cursor-pointer"
              onChange={(e) => {
                applyStyle(activeColor === 'text' ? { color: e.target.value } : { backgroundColor: e.target.value });
              }}
            />
          </div>
        )}
      </div>

      {/* AI Edit button */}
      <button
        onClick={() => onAIEdit('Verbessere dieses Element')}
        className="flex items-center gap-1 px-2 py-1.5 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
        title="Mit KI bearbeiten"
      >
        <Sparkles size={14} />
      </button>

      {/* More options */}
      <button
        onClick={onOpenFullEditor}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Mehr Optionen"
      >
        <MoreHorizontal size={14} />
      </button>
    </div>
  );
}
