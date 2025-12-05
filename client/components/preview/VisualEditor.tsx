/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * VisualEditor - Unified AI + Direct manipulation editor
 * The best of both worlds: Yellow Pencil-style editing + AI power
 * Features: Smart mode switching, AI suggestions, direct edits, seamless UX
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Sparkles,
  MousePointer2,
  Wand2,
  Palette,
  Type,
  Image,
  Code,
  Zap,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Copy,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Pencil,
  Move,
  Box,
  MoreHorizontal,
  FileCode,
  Search,
} from 'lucide-react';
import type { SelectedElement, SelectionMode } from './ElementSelector';
import { StyleEditor } from './StyleEditor';
import { ImageEditor } from './ImageEditor';
import { SourceCodeEditor } from './SourceCodeEditor';
import { useQuickEdit } from '../../hooks/useFileSync';
import { usePreviewEditing } from '../../hooks/useProjectDiscovery';

// HMR trigger helper - forces reload after file save
async function triggerHMR(filePath: string): Promise<void> {
  try {
    await fetch('/api/preview/hmr-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
  } catch {
    // HMR trigger is optional, don't fail on error
  }
}

// Edit modes
export type EditMode = 'direct' | 'ai' | 'hybrid';

// AI suggestion type
export interface AISuggestion {
  id: string;
  type: 'style' | 'content' | 'structure' | 'image';
  title: string;
  description: string;
  preview?: string;
  confidence: number;
}

interface VisualEditorProps {
  element: SelectedElement;
  elements: SelectedElement[];
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  selectionMode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
  onAIEdit: (prompt: string, context: EditContext) => void;
  onDirectEdit: (selector: string, changes: Record<string, string>) => void;
  onClose: () => void;
  position?: { x: number; y: number };
  // File sync props
  projectPath?: string;
  sourceFilePath?: string;
  onFileSaved?: (filePath: string) => void;
}

// Context for AI editing
export interface EditContext {
  element: SelectedElement;
  elements: SelectedElement[];
  editType: 'style' | 'content' | 'structure' | 'image' | 'general';
  currentStyles?: Record<string, string>;
  suggestion?: AISuggestion;
}

// Quick AI actions based on element type
const QUICK_AI_ACTIONS: Record<string, { icon: React.ReactNode; label: string; prompt: string }[]> = {
  text: [
    { icon: <Wand2 size={12} />, label: 'Verbessern', prompt: 'Verbessere diesen Text für mehr Klarheit und Wirkung' },
    { icon: <Type size={12} />, label: 'Kürzen', prompt: 'Kürze diesen Text auf das Wesentliche' },
    { icon: <Sparkles size={12} />, label: 'Übersetzen', prompt: 'Übersetze diesen Text ins Englische' },
  ],
  heading: [
    { icon: <Wand2 size={12} />, label: 'Optimieren', prompt: 'Optimiere diese Überschrift für mehr Aufmerksamkeit' },
    { icon: <Zap size={12} />, label: 'Kürzer', prompt: 'Mache diese Überschrift prägnanter' },
    { icon: <Sparkles size={12} />, label: 'SEO', prompt: 'Optimiere diese Überschrift für SEO' },
  ],
  button: [
    { icon: <Wand2 size={12} />, label: 'CTA verbessern', prompt: 'Verbessere diesen Call-to-Action für mehr Klicks' },
    { icon: <Palette size={12} />, label: 'Stil', prompt: 'Mache diesen Button auffälliger' },
  ],
  image: [
    { icon: <Image size={12} />, label: 'Alt-Text', prompt: 'Generiere einen SEO-optimierten Alt-Text für dieses Bild' },
    { icon: <Sparkles size={12} />, label: 'Optimieren', prompt: 'Optimiere dieses Bild für bessere Performance' },
  ],
  container: [
    { icon: <Box size={12} />, label: 'Layout', prompt: 'Verbessere das Layout dieses Containers' },
    { icon: <Palette size={12} />, label: 'Styling', prompt: 'Verbessere das visuelle Styling dieses Bereichs' },
  ],
  link: [
    { icon: <Wand2 size={12} />, label: 'Verbessern', prompt: 'Verbessere diesen Link-Text' },
  ],
};

// Niche-specific AI actions for sections
type NicheType = 'healthcare' | 'fintech' | 'ecommerce' | 'creative' | 'saas' | 'education' | 'realestate' | 'restaurant';

const NICHE_AI_ACTIONS: Record<NicheType, { label: string; prompt: string; effects: string }[]> = {
  healthcare: [
    { label: 'Healthcare Stil', prompt: 'Apply healthcare industry best practices: calming blue/green colors, minimal animations, WCAG AAA accessibility, professional trust signals', effects: 'minimal' },
    { label: 'Trust-Elemente', prompt: 'Add healthcare trust signals: certifications, testimonials, team credentials, patient reviews', effects: 'soft-shadows' },
    { label: 'HIPAA-Check', prompt: 'Ensure HIPAA compliance: no patient data exposure, secure forms, privacy notices', effects: 'minimal' },
  ],
  fintech: [
    { label: 'Fintech Stil', prompt: 'Apply fintech best practices: navy/gold colors, glassmorphism effects, security badges, professional trust indicators', effects: 'glassmorphism' },
    { label: 'Security UI', prompt: 'Add security-focused UI elements: encryption badges, compliance seals (PCI-DSS, GDPR), secure checkout indicators', effects: 'modern-glass' },
    { label: 'Stats anzeigen', prompt: 'Add impressive statistics section with animated counters and trust-building numbers', effects: 'soft-shadows' },
  ],
  ecommerce: [
    { label: 'E-Commerce Stil', prompt: 'Apply e-commerce conversion optimization: prominent CTAs, urgency elements, social proof, trust badges', effects: 'soft-shadows' },
    { label: 'Conversion-Boost', prompt: 'Add conversion elements: urgency timers, stock indicators, free shipping badges, customer reviews', effects: 'moderate' },
    { label: 'Produkt-Grid', prompt: 'Create optimized product grid with hover effects, quick-view, add-to-cart buttons', effects: 'soft-shadows' },
  ],
  creative: [
    { label: 'Creative Stil', prompt: 'Apply creative agency style: vibrant gradients, expressive animations, bold typography, portfolio showcase', effects: 'full-animations' },
    { label: 'Portfolio', prompt: 'Add portfolio section with case studies, before/after, client logos, awards', effects: 'full-animations' },
    { label: 'Animation', prompt: 'Add expressive animations: scroll-triggered effects, parallax, smooth transitions, micro-interactions', effects: 'expressive' },
  ],
  saas: [
    { label: 'SaaS Stil', prompt: 'Apply SaaS best practices: purple/blue gradients, modern glass effects, feature grids, integration logos', effects: 'modern-glass' },
    { label: 'Feature-Grid', prompt: 'Add feature comparison grid with icons, descriptions, and tier highlighting', effects: 'glassmorphism' },
    { label: 'Pricing', prompt: 'Create optimized pricing table with recommended plan highlight, annual/monthly toggle, feature comparison', effects: 'soft-shadows' },
  ],
  education: [
    { label: 'Education Stil', prompt: 'Apply education best practices: blue/orange colors, approachable design, accreditation badges, success stories', effects: 'soft-shadows' },
    { label: 'Kurse', prompt: 'Add course catalog with progress indicators, instructor profiles, student reviews', effects: 'moderate' },
    { label: 'Success Stories', prompt: 'Add student success stories section with testimonials, outcomes, and statistics', effects: 'soft-shadows' },
  ],
  realestate: [
    { label: 'Real Estate Stil', prompt: 'Apply real estate best practices: navy/gold elegant design, property galleries, agent profiles, trust signals', effects: 'soft-shadows' },
    { label: 'Property Grid', prompt: 'Create property listing grid with image galleries, key features, virtual tour links', effects: 'elegant' },
    { label: 'Agent Profile', prompt: 'Add agent profile section with credentials, testimonials, contact form', effects: 'soft-shadows' },
  ],
  restaurant: [
    { label: 'Restaurant Stil', prompt: 'Apply restaurant best practices: warm colors, appetizing imagery, menu highlights, reservation CTA', effects: 'minimal' },
    { label: 'Menu', prompt: 'Create appetizing menu section with food photography, descriptions, dietary icons', effects: 'warm' },
    { label: 'Reservierung', prompt: 'Add reservation widget with date/time picker, party size, special requests', effects: 'minimal' },
  ],
};

// Get niche-specific actions for current context
function getNicheActions(niche: NicheType | null): { label: string; prompt: string }[] {
  if (!niche) return [];
  return NICHE_AI_ACTIONS[niche] || [];
}

// Mode toggle button
function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: EditMode;
  onModeChange: (mode: EditMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
      <button
        onClick={() => onModeChange('direct')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === 'direct'
            ? 'bg-green-500/20 text-green-400 shadow-sm shadow-green-500/10'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Direkt bearbeiten"
      >
        <MousePointer2 size={12} />
        Direkt
      </button>
      <button
        onClick={() => onModeChange('ai')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === 'ai'
            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 shadow-sm shadow-blue-500/10'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Mit KI bearbeiten"
      >
        <Sparkles size={12} />
        KI
      </button>
      <button
        onClick={() => onModeChange('hybrid')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === 'hybrid'
            ? 'bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Hybrid: Direkt + KI Vorschläge"
      >
        <Zap size={12} />
        Hybrid
      </button>
    </div>
  );
}

// AI Quick Actions panel
function QuickAIActions({
  element,
  onAction,
}: {
  element: SelectedElement;
  onAction: (prompt: string) => void;
}) {
  const actions = QUICK_AI_ACTIONS[element.elementType] || QUICK_AI_ACTIONS['text'];

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider px-1">Schnellaktionen</div>
      <div className="flex flex-wrap gap-1">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => onAction(action.prompt)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// AI Prompt input
function AIPromptInput({
  onSubmit,
  placeholder,
}: {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
}) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={inputRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder || 'Beschreibe die Änderung...'}
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none transition-all focus:ring-2 focus:ring-blue-500/30 bg-white/5 border border-white/10 text-white placeholder-gray-600"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600">⌘+Enter</span>
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: prompt.trim()
              ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
          }}
        >
          <Sparkles size={12} />
          Mit KI ändern
        </button>
      </div>
    </div>
  );
}

// Direct edit action buttons
function DirectEditActions({
  element,
  onStyleEdit,
  onImageEdit,
  onTextEdit,
}: {
  element: SelectedElement;
  onStyleEdit: () => void;
  onImageEdit: () => void;
  onTextEdit: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={onStyleEdit}
        className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
      >
        <Palette size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] text-gray-400 group-hover:text-white">Stil</span>
      </button>
      <button
        onClick={onTextEdit}
        disabled={!element.isEditable}
        className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Pencil size={16} className="text-green-400 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] text-gray-400 group-hover:text-white">Text</span>
      </button>
      <button
        onClick={onImageEdit}
        disabled={element.elementType !== 'image'}
        className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] text-gray-400 group-hover:text-white">Bild</span>
      </button>
    </div>
  );
}

// AI Suggestions panel (for hybrid mode)
function AISuggestions({
  suggestions,
  onApply,
  isLoading,
}: {
  suggestions: AISuggestion[];
  onApply: (suggestion: AISuggestion) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <RefreshCw size={16} className="text-blue-400 animate-spin" />
        <span className="ml-2 text-xs text-gray-400">KI analysiert...</span>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-gray-500">
        <Lightbulb size={16} className="mx-auto mb-1 opacity-50" />
        Keine Vorschläge verfügbar
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider px-1 flex items-center gap-1">
        <Lightbulb size={10} />
        KI-Vorschläge
      </div>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onApply(suggestion)}
          className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
                {suggestion.title}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                {suggestion.description}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-600">{Math.round(suggestion.confidence * 100)}%</span>
              <ArrowRight size={12} className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Main Visual Editor component
export function VisualEditor({
  element,
  elements,
  iframeRef,
  selectionMode,
  onModeChange,
  onAIEdit,
  onDirectEdit,
  onClose,
  position,
  projectPath,
  sourceFilePath,
  onFileSaved,
}: VisualEditorProps) {
  const [editMode, setEditMode] = useState<EditMode>('hybrid');
  const [activePanel, setActivePanel] = useState<'main' | 'style' | 'image' | 'source' | null>('main');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [fileSyncStatus, setFileSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // File sync hook
  const { changeStyle, changeText, framework, isLoading: isSyncing, error: syncError } = useQuickEdit(projectPath);

  // Keyboard shortcut: ⌘+. to jump to source
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        if (sourceFilePath) {
          setActivePanel('source');
        }
      }
      // ⌘+Esc to close
      if (e.key === 'Escape') {
        if (activePanel !== 'main') {
          setActivePanel('main');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sourceFilePath, activePanel, onClose]);

  // Generate AI suggestions when in hybrid mode
  useEffect(() => {
    if (editMode === 'hybrid' && element) {
      setIsLoadingSuggestions(true);
      // Simulate AI suggestions (in real implementation, this would call the backend)
      setTimeout(() => {
        const mockSuggestions: AISuggestion[] = [];

        // Add suggestions based on element type
        if (element.elementType === 'text' || element.elementType === 'heading') {
          mockSuggestions.push({
            id: '1',
            type: 'content',
            title: 'Text verbessern',
            description: 'Optimiere für bessere Lesbarkeit und SEO',
            confidence: 0.85,
          });
        }

        if (element.computedStyles) {
          mockSuggestions.push({
            id: '2',
            type: 'style',
            title: 'Kontrast erhöhen',
            description: 'Verbessere die Lesbarkeit durch höheren Kontrast',
            confidence: 0.72,
          });
        }

        if (element.elementType === 'button') {
          mockSuggestions.push({
            id: '3',
            type: 'style',
            title: 'Button auffälliger',
            description: 'Mache den CTA-Button prominent',
            confidence: 0.9,
          });
        }

        setSuggestions(mockSuggestions);
        setIsLoadingSuggestions(false);
      }, 800);
    }
  }, [editMode, element]);

  // Handle AI edit
  const handleAIEdit = useCallback(
    (prompt: string) => {
      onAIEdit(prompt, {
        element,
        elements,
        editType: 'general',
        currentStyles: element.computedStyles,
      });
    },
    [element, elements, onAIEdit]
  );

  // Handle applying AI suggestion
  const handleApplySuggestion = useCallback(
    (suggestion: AISuggestion) => {
      onAIEdit(suggestion.description, {
        element,
        elements,
        editType: suggestion.type,
        currentStyles: element.computedStyles,
        suggestion,
      });
    },
    [element, elements, onAIEdit]
  );

  // Handle style change - syncs to both preview and source file
  const handleStyleChange = useCallback(
    async (selector: string, styles: Record<string, string>) => {
      // Apply to preview immediately
      onDirectEdit(selector, styles);

      // Sync to source file if path is available
      if (sourceFilePath && projectPath) {
        setFileSyncStatus('saving');
        try {
          const success = await changeStyle(sourceFilePath, selector, styles);
          if (success) {
            setFileSyncStatus('saved');
            onFileSaved?.(sourceFilePath);
            // Trigger HMR for instant reload
            await triggerHMR(sourceFilePath);
            // Reset status after 2 seconds
            setTimeout(() => setFileSyncStatus('idle'), 2000);
          } else {
            setFileSyncStatus('error');
          }
        } catch {
          setFileSyncStatus('error');
        }
      }
    },
    [onDirectEdit, sourceFilePath, projectPath, changeStyle, onFileSaved]
  );

  // Handle image change
  const handleImageChange = useCallback(
    (selector: string, newSrc: string) => {
      onDirectEdit(selector, { src: newSrc });
    },
    [onDirectEdit]
  );

  // Enable inline text editing
  const handleTextEdit = useCallback(() => {
    if (!iframeRef.current || !element.isEditable) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;

      const el = iframeDoc.querySelector(element.selector) as HTMLElement;
      if (el) {
        el.setAttribute('contenteditable', 'true');
        el.focus();

        // Select all text
        const range = iframeDoc.createRange();
        range.selectNodeContents(el);
        const selection = iframeDoc.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } catch {
      // Cross-origin
    }
  }, [iframeRef, element]);

  // Render sub-panels
  if (activePanel === 'style') {
    return (
      <StyleEditor
        element={element}
        iframeRef={iframeRef}
        onStyleChange={handleStyleChange}
        onClose={() => setActivePanel('main')}
      />
    );
  }

  if (activePanel === 'image') {
    return (
      <ImageEditor
        element={element}
        iframeRef={iframeRef}
        onImageChange={handleImageChange}
        onClose={() => setActivePanel('main')}
      />
    );
  }

  if (activePanel === 'source' && sourceFilePath && projectPath) {
    return (
      <SourceCodeEditor
        projectPath={projectPath}
        initialFile={sourceFilePath}
        framework={framework?.framework}
        onSave={async (filePath, content) => {
          // Save to file via API
          try {
            const res = await fetch('/api/files/write', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: filePath, content }),
            });
            if (!res.ok) throw new Error('Save failed');
            onFileSaved?.(filePath);
            // Trigger HMR for instant reload
            await triggerHMR(filePath);
            setFileSyncStatus('saved');
            setTimeout(() => setFileSyncStatus('idle'), 2000);
          } catch (err) {
            setFileSyncStatus('error');
            throw err;
          }
        }}
        onSearch={async (query, options) => {
          const res = await fetch('/api/files/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rootPath: projectPath, query, options }),
          });
          const data = await res.json();
          return data.results || [];
        }}
        onReplace={async (filePath, search, replace, options) => {
          const res = await fetch('/api/files/replace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath, search, replace, options }),
          });
          const data = await res.json();
          return { changes: data.changes || 0 };
        }}
        onAIEdit={async (filePath, prompt, content) => {
          // For now, trigger AI edit via the existing handler
          handleAIEdit(`Bearbeite ${filePath.split('/').pop()}: ${prompt}`);
          // Return original content - actual AI response would come via WebSocket
          return content;
        }}
        onClose={() => setActivePanel('main')}
      />
    );
  }

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
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{
              background:
                element.elementType === 'text'
                  ? '#3b82f6'
                  : element.elementType === 'heading'
                  ? '#8b5cf6'
                  : element.elementType === 'image'
                  ? '#10b981'
                  : element.elementType === 'button'
                  ? '#f59e0b'
                  : '#6366f1',
            }}
          >
            {element.elementType === 'text' && <Type size={12} className="text-white" />}
            {element.elementType === 'heading' && <Type size={12} className="text-white" />}
            {element.elementType === 'image' && <Image size={12} className="text-white" />}
            {element.elementType === 'button' && <Box size={12} className="text-white" />}
            {!['text', 'heading', 'image', 'button'].includes(element.elementType) && (
              <Code size={12} className="text-white" />
            )}
          </div>
          <div>
            <code className="text-xs text-white">&lt;{element.tagName}&gt;</code>
            {element.textContent && (
              <span className="text-[10px] text-gray-500 ml-1 truncate max-w-24 inline-block align-middle">
                {element.textContent.slice(0, 20)}...
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="px-3 py-2 border-b border-white/5">
        <ModeToggle mode={editMode} onModeChange={setEditMode} />
      </div>

      {/* Content based on mode */}
      <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Direct mode: Show edit action buttons */}
        {(editMode === 'direct' || editMode === 'hybrid') && (
          <DirectEditActions
            element={element}
            onStyleEdit={() => setActivePanel('style')}
            onImageEdit={() => setActivePanel('image')}
            onTextEdit={handleTextEdit}
          />
        )}

        {/* AI mode or Hybrid: Show quick actions and prompt */}
        {(editMode === 'ai' || editMode === 'hybrid') && (
          <>
            <QuickAIActions element={element} onAction={handleAIEdit} />

            {editMode === 'ai' && (
              <div className="pt-2 border-t border-white/5">
                <AIPromptInput
                  onSubmit={handleAIEdit}
                  placeholder={`Was soll mit <${element.tagName}> passieren?`}
                />
              </div>
            )}
          </>
        )}

        {/* Hybrid mode: Show AI suggestions */}
        {editMode === 'hybrid' && (
          <div className="pt-2 border-t border-white/5">
            <AISuggestions
              suggestions={suggestions}
              onApply={handleApplySuggestion}
              isLoading={isLoadingSuggestions}
            />
          </div>
        )}
      </div>

      {/* Footer with element info and sync status */}
      <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span>{element.path.slice(-2).join(' > ')}</span>
          {/* Sync status indicator */}
          {fileSyncStatus === 'saving' && (
            <span className="flex items-center gap-1 text-yellow-400">
              <RefreshCw size={10} className="animate-spin" />
              Syncing...
            </span>
          )}
          {fileSyncStatus === 'saved' && (
            <span className="flex items-center gap-1 text-green-400">
              <Check size={10} />
              Saved
            </span>
          )}
          {fileSyncStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-400">
              <X size={10} />
              Error
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {elements.length > 1 && (
            <span className="text-[10px] text-gray-500">
              +{elements.length - 1} weitere
            </span>
          )}
          {/* Source code button with ⌘. shortcut */}
          {sourceFilePath && (
            <button
              onClick={() => setActivePanel('source')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Source Code bearbeiten (⌘.)"
            >
              <FileCode size={12} />
              Source
              <span className="text-[8px] text-gray-600 ml-0.5">⌘.</span>
            </button>
          )}
          {/* Framework badge */}
          {framework && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
              {framework.framework}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
