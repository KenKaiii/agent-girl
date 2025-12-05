/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * StyleEditor - Yellow Pencil-style visual CSS editor
 * Features: Color pickers, Typography, Spacing, Borders, Direct manipulation
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Palette,
  Type,
  Square,
  Box,
  Move,
  Maximize2,
  CornerUpLeft,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { SelectedElement } from './ElementSelector';

interface StyleEditorProps {
  element: SelectedElement;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onStyleChange: (selector: string, styles: Record<string, string>) => void;
  onClose: () => void;
}

// CSS property categories
type StyleCategory = 'colors' | 'typography' | 'spacing' | 'border' | 'size';

interface StyleValue {
  value: string;
  unit?: string;
}

// Parse CSS value into number and unit
function parseValue(value: string): StyleValue {
  const match = value.match(/^(-?\d*\.?\d+)(px|em|rem|%|vh|vw)?$/);
  if (match) {
    return { value: match[1], unit: match[2] || 'px' };
  }
  return { value, unit: undefined };
}

// Color input component with hex picker
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // Convert RGB to hex for color picker
  const toHex = (color: string): string => {
    if (color.startsWith('#')) return color;
    if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
      }
    }
    return '#000000';
  };

  const [hexValue, setHexValue] = useState(toHex(value));

  useEffect(() => {
    setHexValue(toHex(value));
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-20">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => {
            setHexValue(e.target.value);
            onChange(e.target.value);
          }}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={hexValue}
          onChange={(e) => {
            setHexValue(e.target.value);
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="flex-1 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// Number input with slider
function NumberInput({
  label,
  value,
  unit = 'px',
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-20">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1 bg-white/10 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-14 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 text-right"
          />
          <span className="text-xs text-gray-500 w-6">{unit}</span>
        </div>
      </div>
    </div>
  );
}

// Select input
function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-20">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Spacing box model editor
function SpacingEditor({
  margin,
  padding,
  onMarginChange,
  onPaddingChange,
}: {
  margin: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  onMarginChange: (side: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
  onPaddingChange: (side: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
}) {
  const SpacingInput = ({
    value,
    onChange,
    position,
    type,
  }: {
    value: number;
    onChange: (v: number) => void;
    position: 'top' | 'right' | 'bottom' | 'left';
    type: 'margin' | 'padding';
  }) => (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-10 h-5 text-center text-xs rounded bg-transparent border border-transparent hover:border-white/20 focus:border-blue-500/50 outline-none ${type === 'margin' ? 'text-orange-400' : 'text-green-400'}`}
      title={`${type}-${position}`}
    />
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Margin</div>
      <div className="relative w-48 h-32 border border-orange-500/30 rounded bg-orange-500/5">
        {/* Margin inputs */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <SpacingInput value={margin.top} onChange={(v) => onMarginChange('top', v)} position="top" type="margin" />
        </div>
        <div className="absolute top-1/2 -right-1 translate-x-1/2 -translate-y-1/2">
          <SpacingInput value={margin.right} onChange={(v) => onMarginChange('right', v)} position="right" type="margin" />
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2">
          <SpacingInput value={margin.bottom} onChange={(v) => onMarginChange('bottom', v)} position="bottom" type="margin" />
        </div>
        <div className="absolute top-1/2 -left-1 -translate-x-1/2 -translate-y-1/2">
          <SpacingInput value={margin.left} onChange={(v) => onMarginChange('left', v)} position="left" type="margin" />
        </div>

        {/* Padding box */}
        <div className="absolute inset-4 border border-green-500/30 rounded bg-green-500/5 flex items-center justify-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Padding</div>
          {/* Padding inputs */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <SpacingInput value={padding.top} onChange={(v) => onPaddingChange('top', v)} position="top" type="padding" />
          </div>
          <div className="absolute top-1/2 -right-1 translate-x-1/2 -translate-y-1/2">
            <SpacingInput value={padding.right} onChange={(v) => onPaddingChange('right', v)} position="right" type="padding" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2">
            <SpacingInput value={padding.bottom} onChange={(v) => onPaddingChange('bottom', v)} position="bottom" type="padding" />
          </div>
          <div className="absolute top-1/2 -left-1 -translate-x-1/2 -translate-y-1/2">
            <SpacingInput value={padding.left} onChange={(v) => onPaddingChange('left', v)} position="left" type="padding" />
          </div>

          {/* Content indicator */}
          <div className="absolute inset-4 border border-blue-500/20 rounded bg-blue-500/5 flex items-center justify-center">
            <span className="text-[10px] text-gray-600">content</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible section
function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <span className="text-xs font-medium text-white">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
      </button>
      {isOpen && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

export function StyleEditor({ element, iframeRef, onStyleChange, onClose }: StyleEditorProps) {
  const styles = element.computedStyles;

  // Local style state
  const [localStyles, setLocalStyles] = useState({
    color: styles?.color || '#000000',
    backgroundColor: styles?.backgroundColor || 'transparent',
    fontSize: parseInt(styles?.fontSize || '16'),
    fontWeight: styles?.fontWeight || '400',
    fontFamily: styles?.fontFamily?.split(',')[0]?.replace(/['"]/g, '') || 'system-ui',
    marginTop: parseInt(styles?.margin?.split(' ')[0] || '0'),
    marginRight: parseInt(styles?.margin?.split(' ')[1] || styles?.margin?.split(' ')[0] || '0'),
    marginBottom: parseInt(styles?.margin?.split(' ')[2] || styles?.margin?.split(' ')[0] || '0'),
    marginLeft: parseInt(styles?.margin?.split(' ')[3] || styles?.margin?.split(' ')[1] || styles?.margin?.split(' ')[0] || '0'),
    paddingTop: parseInt(styles?.padding?.split(' ')[0] || '0'),
    paddingRight: parseInt(styles?.padding?.split(' ')[1] || styles?.padding?.split(' ')[0] || '0'),
    paddingBottom: parseInt(styles?.padding?.split(' ')[2] || styles?.padding?.split(' ')[0] || '0'),
    paddingLeft: parseInt(styles?.padding?.split(' ')[3] || styles?.padding?.split(' ')[1] || styles?.padding?.split(' ')[0] || '0'),
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: '#000000',
    borderRadius: 0,
    width: 'auto',
    height: 'auto',
  });

  // Apply style to iframe element
  const applyStyle = useCallback(
    (property: string, value: string) => {
      if (!iframeRef.current) return;

      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (!iframeDoc) return;

        const el = iframeDoc.querySelector(element.selector) as HTMLElement;
        if (el) {
          el.style.setProperty(property, value);
          onStyleChange(element.selector, { [property]: value });
        }
      } catch {
        // Cross-origin
      }
    },
    [iframeRef, element.selector, onStyleChange]
  );

  // Handler to update local state and apply to iframe
  const updateStyle = <K extends keyof typeof localStyles>(key: K, value: (typeof localStyles)[K]) => {
    setLocalStyles((prev) => ({ ...prev, [key]: value }));

    // Map to CSS property
    const cssMap: Record<string, string> = {
      color: 'color',
      backgroundColor: 'background-color',
      fontSize: 'font-size',
      fontWeight: 'font-weight',
      fontFamily: 'font-family',
      marginTop: 'margin-top',
      marginRight: 'margin-right',
      marginBottom: 'margin-bottom',
      marginLeft: 'margin-left',
      paddingTop: 'padding-top',
      paddingRight: 'padding-right',
      paddingBottom: 'padding-bottom',
      paddingLeft: 'padding-left',
      borderWidth: 'border-width',
      borderStyle: 'border-style',
      borderColor: 'border-color',
      borderRadius: 'border-radius',
      width: 'width',
      height: 'height',
    };

    const cssProp = cssMap[key];
    if (cssProp) {
      let cssValue = String(value);
      // Add px unit for numeric values
      if (['fontSize', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderWidth', 'borderRadius'].includes(key)) {
        cssValue = `${value}px`;
      }
      applyStyle(cssProp, cssValue);
    }
  };

  return (
    <div
      className="w-72 flex flex-col max-h-[80vh] rounded-xl overflow-hidden"
      style={{
        background: 'rgba(17, 17, 20, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-blue-400" />
          <span className="text-sm font-medium text-white">Style Editor</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Element info */}
      <div className="px-3 py-2 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2 text-xs">
          <code className="text-blue-400">&lt;{element.tagName}&gt;</code>
          {element.className && <span className="text-gray-500 truncate max-w-32">.{element.className.split(' ')[0]}</span>}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Colors */}
        <Section title="Farben" icon={<Palette size={12} />}>
          <ColorInput label="Text" value={localStyles.color} onChange={(v) => updateStyle('color', v)} />
          <ColorInput label="Hintergrund" value={localStyles.backgroundColor} onChange={(v) => updateStyle('backgroundColor', v)} />
        </Section>

        {/* Typography */}
        <Section title="Typografie" icon={<Type size={12} />}>
          <NumberInput label="Größe" value={localStyles.fontSize} min={8} max={72} onChange={(v) => updateStyle('fontSize', v)} />
          <SelectInput
            label="Gewicht"
            value={localStyles.fontWeight}
            options={[
              { value: '100', label: 'Thin' },
              { value: '300', label: 'Light' },
              { value: '400', label: 'Normal' },
              { value: '500', label: 'Medium' },
              { value: '600', label: 'Semibold' },
              { value: '700', label: 'Bold' },
              { value: '900', label: 'Black' },
            ]}
            onChange={(v) => updateStyle('fontWeight', v)}
          />
          <SelectInput
            label="Schrift"
            value={localStyles.fontFamily}
            options={[
              { value: 'system-ui', label: 'System' },
              { value: 'Inter', label: 'Inter' },
              { value: 'Arial', label: 'Arial' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'monospace', label: 'Mono' },
            ]}
            onChange={(v) => updateStyle('fontFamily', v)}
          />
        </Section>

        {/* Spacing */}
        <Section title="Abstände" icon={<Move size={12} />}>
          <SpacingEditor
            margin={{
              top: localStyles.marginTop,
              right: localStyles.marginRight,
              bottom: localStyles.marginBottom,
              left: localStyles.marginLeft,
            }}
            padding={{
              top: localStyles.paddingTop,
              right: localStyles.paddingRight,
              bottom: localStyles.paddingBottom,
              left: localStyles.paddingLeft,
            }}
            onMarginChange={(side, value) => updateStyle(`margin${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof localStyles, value)}
            onPaddingChange={(side, value) => updateStyle(`padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof localStyles, value)}
          />
        </Section>

        {/* Border */}
        <Section title="Rahmen" icon={<Square size={12} />} defaultOpen={false}>
          <NumberInput label="Breite" value={localStyles.borderWidth} min={0} max={20} onChange={(v) => updateStyle('borderWidth', v)} />
          <SelectInput
            label="Stil"
            value={localStyles.borderStyle}
            options={[
              { value: 'none', label: 'Keiner' },
              { value: 'solid', label: 'Durchgezogen' },
              { value: 'dashed', label: 'Gestrichelt' },
              { value: 'dotted', label: 'Gepunktet' },
            ]}
            onChange={(v) => updateStyle('borderStyle', v)}
          />
          <ColorInput label="Farbe" value={localStyles.borderColor} onChange={(v) => updateStyle('borderColor', v)} />
          <NumberInput label="Radius" value={localStyles.borderRadius} min={0} max={100} onChange={(v) => updateStyle('borderRadius', v)} />
        </Section>

        {/* Size */}
        <Section title="Größe" icon={<Maximize2 size={12} />} defaultOpen={false}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-20">Breite</span>
            <input
              type="text"
              value={localStyles.width}
              onChange={(e) => updateStyle('width', e.target.value)}
              className="flex-1 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50"
              placeholder="auto, 100px, 50%"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-20">Höhe</span>
            <input
              type="text"
              value={localStyles.height}
              onChange={(e) => updateStyle('height', e.target.value)}
              className="flex-1 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50"
              placeholder="auto, 100px, 50%"
            />
          </div>
        </Section>
      </div>

      {/* Footer with reset */}
      <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={() => {
            // Reset to original styles
            if (!iframeRef.current) return;
            try {
              const iframeDoc = iframeRef.current.contentDocument;
              if (!iframeDoc) return;
              const el = iframeDoc.querySelector(element.selector) as HTMLElement;
              if (el) {
                el.removeAttribute('style');
              }
            } catch {}
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <CornerUpLeft size={12} />
          Zurücksetzen
        </button>
        <span className="text-[10px] text-gray-600">Live-Vorschau aktiv</span>
      </div>
    </div>
  );
}
