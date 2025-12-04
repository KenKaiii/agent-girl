/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Advanced Element Selector - Sophisticated DOM selection system
 * Features: Element selection, Text selection, Inline editing, Multi-mode, Smart detection
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  MousePointer2,
  Type,
  Box,
  Image,
  Link2,
  SquareAsterisk,
  Pencil,
  Copy,
  Trash2,
  Sparkles,
  ChevronRight,
  ChevronUp,
  Layers,
  X,
  Check,
} from 'lucide-react';

// Selection modes
export type SelectionMode = 'element' | 'text' | 'component' | 'multi' | 'parent';

// Element types for smart detection
export type ElementType = 'text' | 'heading' | 'image' | 'button' | 'link' | 'input' | 'container' | 'list' | 'unknown';

// Enhanced element info with type detection
export interface SelectedElement {
  id: string;
  tagName: string;
  className: string;
  elementId: string;
  selector: string;
  textContent: string;
  innerHTML: string;
  bounds: { x: number; y: number; width: number; height: number };
  path: string[];
  elementType: ElementType;
  isEditable: boolean;
  selectedText?: string; // For text selection mode
  computedStyles?: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    padding: string;
    margin: string;
  };
}

interface ElementSelectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  enabled: boolean;
  selectionMode: SelectionMode;
  selectedElements: SelectedElement[];
  onSelectionChange: (elements: SelectedElement[]) => void;
  onModeChange: (mode: SelectionMode) => void;
  onOpenPrompt: (element: SelectedElement, position: { x: number; y: number }) => void;
  onInlineEdit: (element: SelectedElement, newText: string) => void;
}

// Detect element type intelligently
function detectElementType(element: Element): ElementType {
  const tag = element.tagName.toLowerCase();

  // Headings
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading';

  // Text elements
  if (['p', 'span', 'label', 'strong', 'em', 'b', 'i', 'small'].includes(tag)) return 'text';

  // Images
  if (tag === 'img' || tag === 'svg' || tag === 'picture') return 'image';

  // Buttons
  if (tag === 'button' || (element as HTMLElement).getAttribute('role') === 'button') return 'button';

  // Links
  if (tag === 'a') return 'link';

  // Inputs
  if (['input', 'textarea', 'select'].includes(tag)) return 'input';

  // Lists
  if (['ul', 'ol', 'li'].includes(tag)) return 'list';

  // Containers
  if (['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside'].includes(tag)) return 'container';

  return 'unknown';
}

// Get element type icon
function getElementTypeIcon(type: ElementType): React.ReactNode {
  const iconProps = { size: 12 };
  switch (type) {
    case 'text': return <Type {...iconProps} />;
    case 'heading': return <Type {...iconProps} />;
    case 'image': return <Image {...iconProps} />;
    case 'button': return <SquareAsterisk {...iconProps} />;
    case 'link': return <Link2 {...iconProps} />;
    case 'input': return <Pencil {...iconProps} />;
    case 'container': return <Box {...iconProps} />;
    default: return <MousePointer2 {...iconProps} />;
  }
}

// Get element type color
function getElementTypeColor(type: ElementType): string {
  switch (type) {
    case 'text': return '#3b82f6'; // blue
    case 'heading': return '#8b5cf6'; // purple
    case 'image': return '#10b981'; // green
    case 'button': return '#f59e0b'; // amber
    case 'link': return '#06b6d4'; // cyan
    case 'input': return '#ec4899'; // pink
    case 'container': return '#6366f1'; // indigo
    case 'list': return '#14b8a6'; // teal
    default: return '#6b7280'; // gray
  }
}

// Build unique CSS selector
function buildSelector(element: Element): string {
  if (element.id) return `#${element.id}`;

  const tag = element.tagName.toLowerCase();
  const classes = Array.from(element.classList).slice(0, 2).join('.');
  const classSelector = classes ? `.${classes}` : '';

  if (classSelector) {
    try {
      const matches = element.ownerDocument.querySelectorAll(`${tag}${classSelector}`);
      if (matches.length === 1) return `${tag}${classSelector}`;
    } catch {
      // Invalid selector
    }
  }

  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(c => c.tagName === element.tagName);
    const index = siblings.indexOf(element) + 1;
    if (siblings.length > 1) {
      return `${tag}${classSelector}:nth-of-type(${index})`;
    }
  }

  return `${tag}${classSelector}` || tag;
}

// Build element path
function buildPath(element: Element): string[] {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName !== 'HTML' && current.tagName !== 'BODY') {
    path.unshift(buildSelector(current));
    current = current.parentElement;
    if (path.length > 5) break;
  }

  return path;
}

// Create sophisticated highlight styles
function createHighlightStyles(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.id = 'agent-girl-selector-styles';
  style.textContent = `
    /* Base hover state */
    .ag-hover {
      outline: 2px dashed var(--ag-color, #3b82f6) !important;
      outline-offset: 2px !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }

    /* Selected state with glow */
    .ag-selected {
      outline: 2px solid var(--ag-color, #3b82f6) !important;
      outline-offset: 2px !important;
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--ag-color, #3b82f6) 20%, transparent),
        0 4px 12px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.2s ease !important;
    }

    /* Hover on selected */
    .ag-hover.ag-selected {
      outline-width: 3px !important;
      box-shadow:
        0 0 0 6px color-mix(in srgb, var(--ag-color, #3b82f6) 25%, transparent),
        0 8px 24px rgba(0, 0, 0, 0.2) !important;
    }

    /* Text selection mode */
    .ag-text-mode::selection {
      background: color-mix(in srgb, #3b82f6 30%, transparent) !important;
    }

    /* Editable state */
    .ag-editing {
      outline: 2px solid #10b981 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2) !important;
      cursor: text !important;
    }

    /* Selection badge */
    .ag-badge {
      position: absolute;
      top: -10px;
      left: -10px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: var(--ag-color, #3b82f6);
      color: white;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      z-index: 99999;
      pointer-events: none;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      animation: ag-badge-in 0.2s ease;
    }

    @keyframes ag-badge-in {
      from { transform: scale(0.5); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* Floating toolbar */
    .ag-toolbar {
      position: fixed;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 8px;
      background: rgba(17, 17, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      z-index: 99999;
      animation: ag-toolbar-in 0.15s ease;
      font-family: system-ui, -apple-system, sans-serif;
    }

    @keyframes ag-toolbar-in {
      from { transform: translateY(4px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .ag-toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: #888;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .ag-toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .ag-toolbar-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      width: auto;
      padding: 0 12px;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .ag-toolbar-btn.primary:hover {
      filter: brightness(1.1);
    }

    .ag-toolbar-divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 4px;
    }

    /* Breadcrumb path */
    .ag-breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 10px;
      color: #666;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      max-width: 200px;
      overflow: hidden;
    }

    .ag-breadcrumb span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ag-breadcrumb .current {
      color: #3b82f6;
      font-weight: 500;
    }
  `;
  return style;
}

export function ElementSelector({
  iframeRef,
  enabled,
  selectionMode,
  selectedElements,
  onSelectionChange,
  onModeChange,
  onOpenPrompt,
  onInlineEdit,
}: ElementSelectorProps) {
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [editingElement, setEditingElement] = useState<SelectedElement | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Get element info
  const getElementInfo = useCallback((element: Element, index: number, selectedText?: string): SelectedElement => {
    const rect = element.getBoundingClientRect();
    const computedStyle = element.ownerDocument.defaultView?.getComputedStyle(element);
    const elementType = detectElementType(element);
    const isEditable = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'label', 'li'].includes(element.tagName.toLowerCase());

    return {
      id: `el-${Date.now()}-${index}`,
      tagName: element.tagName.toLowerCase(),
      className: typeof element.className === 'string' ? element.className : '',
      elementId: element.id || '',
      selector: buildSelector(element),
      textContent: element.textContent?.slice(0, 200).trim() || '',
      innerHTML: element.innerHTML?.slice(0, 500) || '',
      bounds: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
      path: buildPath(element),
      elementType,
      isEditable,
      selectedText,
      computedStyles: computedStyle ? {
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        fontSize: computedStyle.fontSize,
        fontFamily: computedStyle.fontFamily,
        fontWeight: computedStyle.fontWeight,
        padding: computedStyle.padding,
        margin: computedStyle.margin,
      } : undefined,
    };
  }, []);

  // Setup iframe listeners
  useEffect(() => {
    if (!enabled || !iframeRef.current) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setToolbarPosition(null);
      return;
    }

    const iframe = iframeRef.current;

    const setupListeners = () => {
      try {
        const iframeDoc = iframe.contentDocument;
        const iframeWin = iframe.contentWindow;
        if (!iframeDoc || !iframeWin) return;

        // Remove existing styles
        const existing = iframeDoc.getElementById('agent-girl-selector-styles');
        if (existing) existing.remove();

        // Add styles
        const style = createHighlightStyles(iframeDoc);
        iframeDoc.head.appendChild(style);

        let lastHovered: Element | null = null;
        let toolbar: HTMLDivElement | null = null;

        // Remove toolbar
        const removeToolbar = () => {
          if (toolbar) {
            toolbar.remove();
            toolbar = null;
          }
        };

        // Create floating toolbar
        const createToolbar = (element: Element, rect: DOMRect) => {
          removeToolbar();

          toolbar = iframeDoc.createElement('div');
          toolbar.className = 'ag-toolbar';

          const iframeRect = iframe.getBoundingClientRect();
          const x = Math.min(rect.left, iframeWin.innerWidth - 200);
          const y = rect.bottom + 8;

          toolbar.style.left = `${x}px`;
          toolbar.style.top = `${y}px`;

          const elementType = detectElementType(element);
          const color = getElementTypeColor(elementType);

          toolbar.innerHTML = `
            <button class="ag-toolbar-btn" data-action="edit" title="Inline bearbeiten">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="ag-toolbar-btn" data-action="copy" title="Selector kopieren">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="ag-toolbar-btn" data-action="remove" title="Auswahl entfernen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div class="ag-toolbar-divider"></div>
            <button class="ag-toolbar-btn primary" data-action="ai" style="background: linear-gradient(135deg, ${color} 0%, #8b5cf6 100%)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
              </svg>
              KI Edit
            </button>
          `;

          iframeDoc.body.appendChild(toolbar);

          // Handle toolbar clicks
          toolbar.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('[data-action]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const selectedEl = selectedElements.find(el => el.selector === buildSelector(element));

            if (action === 'ai' && selectedEl) {
              const pos = { x: rect.left + iframeRect.left, y: rect.bottom + iframeRect.top + 8 };
              onOpenPrompt(selectedEl, pos);
            } else if (action === 'copy') {
              navigator.clipboard.writeText(buildSelector(element));
            } else if (action === 'remove') {
              element.classList.remove('ag-selected');
              onSelectionChange(selectedElements.filter(el => el.selector !== buildSelector(element)));
              removeToolbar();
            } else if (action === 'edit' && selectedEl?.isEditable) {
              element.setAttribute('contenteditable', 'true');
              element.classList.add('ag-editing');
              (element as HTMLElement).focus();
              setEditingElement(selectedEl);
            }
          });
        };

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
          const target = e.target as Element;
          if (!target || target === lastHovered) return;
          if (target.closest('.ag-toolbar')) return;

          if (lastHovered) {
            lastHovered.classList.remove('ag-hover');
            (lastHovered as HTMLElement).style.removeProperty('--ag-color');
          }

          const skip = ['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'HTML'];
          if (skip.includes(target.tagName)) return;

          const elementType = detectElementType(target);
          const color = getElementTypeColor(elementType);

          target.classList.add('ag-hover');
          (target as HTMLElement).style.setProperty('--ag-color', color);
          lastHovered = target;
          setHoveredElement(target);
        };

        // Mouse leave handler
        const handleMouseLeave = () => {
          if (lastHovered) {
            lastHovered.classList.remove('ag-hover');
            (lastHovered as HTMLElement).style.removeProperty('--ag-color');
            lastHovered = null;
          }
          setHoveredElement(null);
        };

        // Click handler
        const handleClick = (e: MouseEvent) => {
          let target = e.target as Element;
          if (!target) return;
          if (target.closest('.ag-toolbar')) return;

          e.preventDefault();
          e.stopPropagation();

          const skip = ['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'HTML'];
          if (skip.includes(target.tagName)) return;

          // Parent mode: navigate up the DOM tree
          if (selectionMode === 'parent' && target.parentElement) {
            const parent = target.parentElement;
            if (!skip.includes(parent.tagName) && parent.tagName !== 'BODY') {
              target = parent;
            }
          }

          const isShift = e.shiftKey;
          const isMultiMode = selectionMode === 'multi';
          const selector = buildSelector(target);
          const elementType = detectElementType(target);
          const color = getElementTypeColor(elementType);

          // Check if already selected
          const existingIndex = selectedElements.findIndex(el => el.selector === selector);

          if (existingIndex >= 0) {
            // Deselect
            target.classList.remove('ag-selected');
            (target as HTMLElement).style.removeProperty('--ag-color');
            const newSelection = [...selectedElements];
            newSelection.splice(existingIndex, 1);
            onSelectionChange(newSelection);
            removeToolbar();
          } else {
            // Select
            target.classList.add('ag-selected');
            (target as HTMLElement).style.setProperty('--ag-color', color);

            // Get selected text if in text mode
            let selectedText: string | undefined;
            if (selectionMode === 'text') {
              const selection = iframeWin.getSelection();
              if (selection && selection.toString().trim()) {
                selectedText = selection.toString().trim();
              }
            }

            const newElement = getElementInfo(target, selectedElements.length, selectedText);

            // Multi mode or Shift: always add to selection
            if (isShift || isMultiMode) {
              onSelectionChange([...selectedElements, newElement]);
            } else {
              // Clear others
              iframeDoc.querySelectorAll('.ag-selected').forEach(el => {
                if (el !== target) {
                  el.classList.remove('ag-selected');
                  (el as HTMLElement).style.removeProperty('--ag-color');
                }
              });
              onSelectionChange([newElement]);
            }

            // Show toolbar
            const rect = target.getBoundingClientRect();
            createToolbar(target, rect);
          }
        };

        // Prevent link/button navigation
        const handleClickCapture = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.ag-toolbar')) return;
          if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
            e.preventDefault();
          }
        };

        // Handle blur for inline editing
        const handleBlur = (e: FocusEvent) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('ag-editing')) {
            target.removeAttribute('contenteditable');
            target.classList.remove('ag-editing');

            if (editingElement) {
              onInlineEdit(editingElement, target.textContent || '');
              setEditingElement(null);
            }
          }
        };

        // Add listeners
        iframeDoc.addEventListener('mousemove', handleMouseMove);
        iframeDoc.addEventListener('mouseleave', handleMouseLeave);
        iframeDoc.addEventListener('click', handleClick, true);
        iframeDoc.addEventListener('click', handleClickCapture, true);
        iframeDoc.addEventListener('blur', handleBlur, true);

        // Restore selection state
        for (const selected of selectedElements) {
          try {
            const el = iframeDoc.querySelector(selected.selector);
            if (el) {
              const color = getElementTypeColor(selected.elementType);
              el.classList.add('ag-selected');
              (el as HTMLElement).style.setProperty('--ag-color', color);
            }
          } catch {
            // Invalid selector
          }
        }

        // Cleanup
        cleanupRef.current = () => {
          try {
            iframeDoc.removeEventListener('mousemove', handleMouseMove);
            iframeDoc.removeEventListener('mouseleave', handleMouseLeave);
            iframeDoc.removeEventListener('click', handleClick, true);
            iframeDoc.removeEventListener('click', handleClickCapture, true);
            iframeDoc.removeEventListener('blur', handleBlur, true);

            iframeDoc.querySelectorAll('.ag-hover, .ag-selected, .ag-editing').forEach(el => {
              el.classList.remove('ag-hover', 'ag-selected', 'ag-editing');
              (el as HTMLElement).style.removeProperty('--ag-color');
              el.removeAttribute('contenteditable');
            });

            removeToolbar();

            const styleEl = iframeDoc.getElementById('agent-girl-selector-styles');
            if (styleEl) styleEl.remove();
          } catch {
            // Iframe gone
          }
        };
      } catch {
        console.log('Element selector: Cross-origin iframe - selection disabled');
      }
    };

    iframe.addEventListener('load', setupListeners);
    setupListeners();

    return () => {
      iframe.removeEventListener('load', setupListeners);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [enabled, iframeRef, selectionMode, selectedElements, onSelectionChange, onOpenPrompt, onInlineEdit, getElementInfo, editingElement]);

  if (!enabled) return null;

  return null; // Toolbar is rendered in iframe
}

// Mode Selector Component
interface ModeSelectorProps {
  mode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
}

// Mode colors for visual distinction
const MODE_COLORS: Record<SelectionMode, { bg: string; border: string; text: string }> = {
  element: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#60a5fa' },
  text: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e', text: '#4ade80' },
  component: { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7', text: '#c084fc' },
  multi: { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#fb923c' },
  parent: { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899', text: '#f472b6' },
};

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes: { id: SelectionMode; icon: React.ReactNode; label: string }[] = [
    { id: 'element', icon: <MousePointer2 size={14} />, label: 'Element' },
    { id: 'text', icon: <Type size={14} />, label: 'Text' },
    { id: 'component', icon: <Box size={14} />, label: 'Komponente' },
    { id: 'multi', icon: <Layers size={14} />, label: 'Multi' },
    { id: 'parent', icon: <ChevronUp size={14} />, label: 'Parent' },
  ];

  const currentColor = MODE_COLORS[mode];

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg transition-all duration-200"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        boxShadow: `0 0 0 1px ${currentColor.border}40`,
      }}
    >
      {modes.map(m => {
        const isActive = mode === m.id;
        const color = MODE_COLORS[m.id];
        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
            style={{
              background: isActive ? color.bg : 'transparent',
              color: isActive ? color.text : '#6b7280',
              boxShadow: isActive ? `0 0 0 1px ${color.border}60, 0 0 8px ${color.border}30` : 'none',
            }}
            title={`${m.label} Modus`}
          >
            {m.icon}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// Advanced Selection Toolbar
interface SelectionToolbarProps {
  selectedElements: SelectedElement[];
  selectionMode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
  onClearSelection: () => void;
  onSubmitToAI: () => void;
}

export function SelectionToolbar({
  selectedElements,
  selectionMode,
  onModeChange,
  onClearSelection,
  onSubmitToAI,
}: SelectionToolbarProps) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{
        background: 'rgba(17, 17, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Mode Selector */}
      <ModeSelector mode={selectionMode} onModeChange={onModeChange} />

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Selection Info */}
      {selectedElements.length === 0 ? (
        <span className="text-sm text-gray-400">
          {selectionMode === 'element' && 'Klicke auf Elemente zum Auswählen'}
          {selectionMode === 'text' && 'Wähle Text zum Bearbeiten'}
          {selectionMode === 'component' && 'Wähle Komponenten aus'}
          {selectionMode === 'multi' && 'Klicke um mehrere Elemente auszuwählen'}
          {selectionMode === 'parent' && 'Klicke um Parent-Elemente zu wählen'}
        </span>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {/* Element type badges */}
            <div className="flex items-center -space-x-1">
              {selectedElements.slice(0, 3).map((el, i) => (
                <div
                  key={el.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{
                    background: getElementTypeColor(el.elementType),
                    zIndex: 3 - i,
                    border: '2px solid rgba(17, 17, 20, 0.95)',
                  }}
                >
                  {getElementTypeIcon(el.elementType)}
                </div>
              ))}
              {selectedElements.length > 3 && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: '#6b7280',
                    border: '2px solid rgba(17, 17, 20, 0.95)',
                  }}
                >
                  +{selectedElements.length - 3}
                </div>
              )}
            </div>

            <div className="text-sm">
              <span className="text-white font-medium">
                {selectedElements.length} {selectedElements.length === 1 ? 'Element' : 'Elemente'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={onClearSelection}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Auswahl zurücksetzen"
          >
            <X size={16} />
          </button>

          <button
            onClick={onSubmitToAI}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Sparkles size={14} />
            Mit KI bearbeiten
          </button>
        </>
      )}
    </div>
  );
}

// Floating Prompt Panel (appears next to selection)
interface FloatingPromptProps {
  element: SelectedElement;
  position: { x: number; y: number };
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function FloatingPrompt({ element, position, onSubmit, onClose }: FloatingPromptProps) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const color = getElementTypeColor(element.elementType);

  return (
    <div
      className="fixed z-50 w-80 rounded-xl overflow-hidden"
      style={{
        left: Math.min(position.x, window.innerWidth - 340),
        top: Math.min(position.y, window.innerHeight - 200),
        background: 'rgba(17, 17, 20, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-white"
            style={{ background: color }}
          >
            {getElementTypeIcon(element.elementType)}
          </div>
          <span className="text-xs font-medium text-white">
            &lt;{element.tagName}&gt;
          </span>
          {element.selectedText && (
            <span className="text-xs text-gray-500 truncate max-w-24">
              "{element.selectedText.slice(0, 20)}..."
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="px-3 py-1.5 flex items-center gap-1 text-xs text-gray-500 overflow-x-auto">
        {element.path.slice(-3).map((p, i, arr) => (
          <React.Fragment key={i}>
            <span className={i === arr.length - 1 ? 'text-blue-400' : ''}>
              {p.split(':')[0]}
            </span>
            {i < arr.length - 1 && <ChevronRight size={10} />}
          </React.Fragment>
        ))}
      </div>

      {/* Input */}
      <div className="p-3">
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Was soll geändert werden?"
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none transition-all focus:ring-2 focus:ring-blue-500/30"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">⌘+Enter zum Senden</span>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{
              background: prompt.trim() ? color : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            <Sparkles size={12} />
            Ändern
          </button>
        </div>
      </div>
    </div>
  );
}
