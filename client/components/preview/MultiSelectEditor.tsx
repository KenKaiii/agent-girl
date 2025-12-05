/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * MultiSelectEditor - Batch editing for multiple selected elements
 * Features: Bulk style changes, AI batch editing, element grouping
 */

import React, { useState, useCallback } from 'react';
import {
  Layers,
  Palette,
  Type,
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Move,
  Maximize,
  Grid3x3,
} from 'lucide-react';
import type { SelectedElement } from './ElementSelector';

interface MultiSelectEditorProps {
  elements: SelectedElement[];
  onBatchEdit: (selectors: string[], changes: Record<string, string>) => void;
  onBatchAIEdit: (prompt: string, elements: SelectedElement[]) => void;
  onClearSelection: () => void;
  onClose: () => void;
}

// Quick batch actions
const BATCH_ACTIONS: { id: string; icon: React.ReactNode; label: string; style: Record<string, string> }[] = [
  { id: 'align-left', icon: <AlignLeft size={14} />, label: 'Links', style: { textAlign: 'left' } },
  { id: 'align-center', icon: <AlignCenter size={14} />, label: 'Mitte', style: { textAlign: 'center' } },
  { id: 'align-right', icon: <AlignRight size={14} />, label: 'Rechts', style: { textAlign: 'right' } },
  { id: 'bold', icon: <Bold size={14} />, label: 'Fett', style: { fontWeight: '700' } },
  { id: 'italic', icon: <Italic size={14} />, label: 'Kursiv', style: { fontStyle: 'italic' } },
  { id: 'underline', icon: <Underline size={14} />, label: 'Unterstrichen', style: { textDecoration: 'underline' } },
];

// Spacing presets
const SPACING_PRESETS = [
  { label: 'Kompakt', padding: '0.5rem', margin: '0.25rem', gap: '0.5rem' },
  { label: 'Normal', padding: '1rem', margin: '0.5rem', gap: '1rem' },
  { label: 'Komfortabel', padding: '1.5rem', margin: '1rem', gap: '1.5rem' },
  { label: 'Grosszügig', padding: '2rem', margin: '1.5rem', gap: '2rem' },
];

// Color presets
const COLOR_PRESETS = [
  { name: 'Primary', bg: '#3b82f6', text: '#ffffff' },
  { name: 'Secondary', bg: '#6366f1', text: '#ffffff' },
  { name: 'Success', bg: '#10b981', text: '#ffffff' },
  { name: 'Warning', bg: '#f59e0b', text: '#000000' },
  { name: 'Danger', bg: '#ef4444', text: '#ffffff' },
  { name: 'Dark', bg: '#1f2937', text: '#ffffff' },
  { name: 'Light', bg: '#f3f4f6', text: '#1f2937' },
  { name: 'Transparent', bg: 'transparent', text: 'inherit' },
];

// AI batch prompts
const AI_BATCH_PROMPTS = [
  { label: 'Einheitlicher Stil', prompt: 'Apply consistent styling to all selected elements: matching colors, fonts, and spacing' },
  { label: 'Lesbarkeit verbessern', prompt: 'Improve readability of all selected elements: better contrast, font sizes, line heights' },
  { label: 'Modern gestalten', prompt: 'Apply modern design to all elements: soft shadows, rounded corners, subtle gradients' },
  { label: 'Responsiv machen', prompt: 'Make all selected elements fully responsive with proper breakpoints' },
  { label: 'Accessibility', prompt: 'Improve accessibility: WCAG AA compliant colors, focus states, aria labels' },
];

export function MultiSelectEditor({
  elements,
  onBatchEdit,
  onBatchAIEdit,
  onClearSelection,
  onClose,
}: MultiSelectEditorProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'style' | 'spacing' | 'ai'>('quick');
  const [expandedElements, setExpandedElements] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const selectors = elements.map(el => el.selector);

  // Group elements by type
  const groupedElements = elements.reduce((acc, el) => {
    const type = el.elementType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(el);
    return acc;
  }, {} as Record<string, SelectedElement[]>);

  // Apply batch style change
  const handleBatchStyle = useCallback((style: Record<string, string>) => {
    onBatchEdit(selectors, style);
  }, [selectors, onBatchEdit]);

  // Apply color preset
  const handleColorPreset = useCallback((preset: typeof COLOR_PRESETS[0]) => {
    onBatchEdit(selectors, {
      backgroundColor: preset.bg,
      color: preset.text,
    });
  }, [selectors, onBatchEdit]);

  // Apply spacing preset
  const handleSpacingPreset = useCallback((preset: typeof SPACING_PRESETS[0]) => {
    onBatchEdit(selectors, {
      padding: preset.padding,
      margin: preset.margin,
      gap: preset.gap,
    });
  }, [selectors, onBatchEdit]);

  // Apply AI batch edit
  const handleAIBatch = useCallback((prompt: string) => {
    onBatchAIEdit(prompt, elements);
  }, [elements, onBatchAIEdit]);

  return (
    <div
      className="w-80 flex flex-col rounded-xl overflow-hidden"
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
          <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <Layers size={14} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-white">{elements.length} Elemente</span>
            <span className="text-[10px] text-gray-500 ml-1">ausgewählt</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClearSelection}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Auswahl aufheben"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Selected elements summary */}
      <div className="px-3 py-2 border-b border-white/5">
        <button
          onClick={() => setExpandedElements(!expandedElements)}
          className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white"
        >
          <span>Ausgewählte Elemente</span>
          {expandedElements ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {expandedElements && (
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(groupedElements).map(([type, els]) => (
              <div key={type} className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-500">{type}:</span>
                <span className="text-gray-300">{els.length}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {[
          { id: 'quick', label: 'Schnell', icon: <Grid3x3 size={12} /> },
          { id: 'style', label: 'Farben', icon: <Palette size={12} /> },
          { id: 'spacing', label: 'Abstand', icon: <Move size={12} /> },
          { id: 'ai', label: 'KI', icon: <Sparkles size={12} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-3 space-y-3 max-h-[50vh] overflow-y-auto">
        {/* Quick actions */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Text</div>
              <div className="flex flex-wrap gap-1">
                {BATCH_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleBatchStyle(action.style as Record<string, string>)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Layout</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBatchStyle({ display: 'flex', flexDirection: 'row', alignItems: 'center' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  Horizontal
                </button>
                <button
                  onClick={() => handleBatchStyle({ display: 'flex', flexDirection: 'column' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  Vertikal
                </button>
                <button
                  onClick={() => handleBatchStyle({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  2-Spalten Grid
                </button>
                <button
                  onClick={() => handleBatchStyle({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  3-Spalten Grid
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Effekte</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBatchStyle({ borderRadius: '0.75rem' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  Abgerundet
                </button>
                <button
                  onClick={() => handleBatchStyle({ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  Soft Shadow
                </button>
                <button
                  onClick={() => handleBatchStyle({ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.6)' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  Glassmorphism
                </button>
                <button
                  onClick={() => handleBatchStyle({ transition: 'all 0.2s ease' })}
                  className="p-2 rounded-lg text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  Smooth Transition
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Color presets */}
        {activeTab === 'style' && (
          <div className="space-y-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Farbpresets</div>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleColorPreset(preset)}
                  className="group flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-all"
                  title={preset.name}
                >
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: preset.bg }}
                  />
                  <span className="text-[9px] text-gray-500 group-hover:text-white">{preset.name}</span>
                </button>
              ))}
            </div>

            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Eigene Farben</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Hintergrund</label>
                  <input
                    type="color"
                    defaultValue="#ffffff"
                    onChange={(e) => handleBatchStyle({ backgroundColor: e.target.value })}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Text</label>
                  <input
                    type="color"
                    defaultValue="#000000"
                    onChange={(e) => handleBatchStyle({ color: e.target.value })}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spacing presets */}
        {activeTab === 'spacing' && (
          <div className="space-y-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Abstand-Presets</div>
            <div className="space-y-2">
              {SPACING_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleSpacingPreset(preset)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left"
                >
                  <div>
                    <div className="text-xs text-white font-medium">{preset.label}</div>
                    <div className="text-[10px] text-gray-500">
                      P: {preset.padding} • M: {preset.margin} • Gap: {preset.gap}
                    </div>
                  </div>
                  <Check size={14} className="text-gray-600" />
                </button>
              ))}
            </div>

            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Eigene Werte</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Padding</label>
                  <input
                    type="text"
                    placeholder="1rem"
                    className="w-full px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white"
                    onBlur={(e) => e.target.value && handleBatchStyle({ padding: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Margin</label>
                  <input
                    type="text"
                    placeholder="0.5rem"
                    className="w-full px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white"
                    onBlur={(e) => e.target.value && handleBatchStyle({ margin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Gap</label>
                  <input
                    type="text"
                    placeholder="1rem"
                    className="w-full px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white"
                    onBlur={(e) => e.target.value && handleBatchStyle({ gap: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI batch editing */}
        {activeTab === 'ai' && (
          <div className="space-y-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">KI Batch-Aktionen</div>
            <div className="space-y-2">
              {AI_BATCH_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleAIBatch(prompt.prompt)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all text-left group"
                >
                  <Sparkles size={14} className="text-blue-400 group-hover:text-blue-300" />
                  <span className="text-xs text-gray-300 group-hover:text-white">{prompt.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Eigener Prompt</div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={`Beschreibe was mit allen ${elements.length} Elementen passieren soll...`}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-xs resize-none bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
              <button
                onClick={() => customPrompt && handleAIBatch(customPrompt)}
                disabled={!customPrompt}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: customPrompt
                    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                }}
              >
                <Sparkles size={14} />
                Alle {elements.length} Elemente mit KI bearbeiten
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 text-center">
        <span className="text-[10px] text-gray-600">
          Shift+Klick für Multi-Select • Strg+A für Alle
        </span>
      </div>
    </div>
  );
}
