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
  Sparkles,
  ChevronRight,
  ChevronUp,
  Layers,
  X,
  MessageSquare,
} from 'lucide-react';

// Selection modes
export type SelectionMode = 'element' | 'text' | 'component' | 'multi' | 'parent' | 'smart';

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

// Find similar siblings for smart selection
function findSimilarSiblings(element: Element): Element[] {
  const parent = element.parentElement;
  if (!parent) return [];

  const tag = element.tagName;
  const elementType = detectElementType(element);
  const classes = Array.from(element.classList);

  // Find siblings with same tag and similar structure
  const siblings = Array.from(parent.children).filter(sibling => {
    if (sibling === element) return false;
    if (sibling.tagName !== tag) return false;

    // Check if they share at least one class
    const siblingClasses = Array.from(sibling.classList);
    const sharedClasses = classes.filter(c => siblingClasses.includes(c));

    // Same element type and at least one shared class = similar
    if (detectElementType(sibling) === elementType && sharedClasses.length > 0) {
      return true;
    }

    // Same tag in a list structure
    if (['LI', 'TR', 'TD', 'TH'].includes(tag)) {
      return true;
    }

    // Cards/items in a grid (div with same first class)
    if (tag === 'DIV' && classes[0] && siblingClasses.includes(classes[0])) {
      return true;
    }

    return false;
  });

  return siblings;
}

// Get parent context info for display (kept for future use)
function _getParentContext(element: Element): { tagName: string; className: string; childCount: number } | null {
  const parent = element.parentElement;
  if (!parent || parent.tagName === 'BODY' || parent.tagName === 'HTML') return null;

  return {
    tagName: parent.tagName.toLowerCase(),
    className: typeof parent.className === 'string' ? parent.className.split(' ')[0] || '' : '',
    childCount: parent.children.length,
  };
}

// Create sophisticated highlight styles with beautiful animated borders
function createHighlightStyles(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.id = 'agent-girl-selector-styles';
  style.textContent = `
    /* Marching ants animation for hover */
    @keyframes ag-march {
      0% { background-position: 0 0, 100% 100%, 0 100%, 100% 0; }
      100% { background-position: 20px 0, calc(100% - 20px) 100%, 0 calc(100% - 20px), 100% 20px; }
    }

    /* Beautiful gradient glow animation */
    @keyframes ag-glow-rotate {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }

    /* Pulse animation for selected */
    @keyframes ag-pulse-border {
      0%, 100% {
        box-shadow: 0 0 0 2px var(--ag-color, #3b82f6),
                    0 0 10px var(--ag-color, #3b82f6),
                    0 0 20px rgba(59, 130, 246, 0.3);
      }
      50% {
        box-shadow: 0 0 0 3px var(--ag-color, #3b82f6),
                    0 0 20px var(--ag-color, #3b82f6),
                    0 0 40px rgba(59, 130, 246, 0.4);
      }
    }

    /* Base hover state - marching ants style */
    .ag-hover {
      position: relative !important;
      cursor: pointer !important;
      background-image:
        linear-gradient(90deg, var(--ag-color, #3b82f6) 50%, transparent 50%),
        linear-gradient(90deg, var(--ag-color, #3b82f6) 50%, transparent 50%),
        linear-gradient(0deg, var(--ag-color, #3b82f6) 50%, transparent 50%),
        linear-gradient(0deg, var(--ag-color, #3b82f6) 50%, transparent 50%) !important;
      background-repeat: repeat-x, repeat-x, repeat-y, repeat-y !important;
      background-size: 10px 2px, 10px 2px, 2px 10px, 2px 10px !important;
      background-position: 0 0, 100% 100%, 0 100%, 100% 0 !important;
      animation: ag-march 0.4s linear infinite !important;
      padding: 2px !important;
      margin: -2px !important;
    }

    /* Selected state with beautiful glow */
    .ag-selected {
      position: relative !important;
      outline: none !important;
      border-radius: 4px !important;
      animation: ag-pulse-border 1.5s ease-in-out infinite !important;
      box-shadow:
        0 0 0 2px var(--ag-color, #3b82f6),
        0 0 15px var(--ag-color, #3b82f6),
        0 0 30px rgba(59, 130, 246, 0.3),
        inset 0 0 20px rgba(59, 130, 246, 0.05) !important;
    }

    /* Hover on selected - intensify */
    .ag-hover.ag-selected {
      box-shadow:
        0 0 0 3px var(--ag-color, #3b82f6),
        0 0 25px var(--ag-color, #3b82f6),
        0 0 50px rgba(59, 130, 246, 0.4),
        inset 0 0 30px rgba(59, 130, 246, 0.1) !important;
    }

    /* Multi-selected elements get numbered badges */
    .ag-selected::before {
      content: attr(data-ag-index);
      position: absolute;
      top: -12px;
      left: -12px;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      background: linear-gradient(135deg, var(--ag-color, #3b82f6) 0%, #8b5cf6 100%);
      color: white;
      border-radius: 11px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      pointer-events: none;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      animation: ag-badge-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes ag-badge-pop {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Image elements get special treatment */
    img.ag-hover, img.ag-selected {
      filter: brightness(1.05) !important;
    }

    /* Text selection mode */
    .ag-text-mode::selection {
      background: rgba(59, 130, 246, 0.3) !important;
    }

    /* Editable state - green glow */
    .ag-editing {
      outline: none !important;
      box-shadow:
        0 0 0 2px #10b981,
        0 0 15px #10b981,
        0 0 30px rgba(16, 185, 129, 0.3) !important;
      cursor: text !important;
      animation: none !important;
    }

    /* Floating toolbar */
    .ag-toolbar {
      position: fixed;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 10px;
      background: rgba(17, 17, 20, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      z-index: 99999;
      animation: ag-toolbar-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      font-family: system-ui, -apple-system, sans-serif;
    }

    @keyframes ag-toolbar-in {
      from { transform: translateY(8px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    .ag-toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: #888;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .ag-toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      transform: scale(1.05);
    }

    .ag-toolbar-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      width: auto;
      padding: 0 14px;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
    }

    .ag-toolbar-btn.primary:hover {
      filter: brightness(1.15);
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
    }

    .ag-toolbar-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 6px;
    }

    /* Element info tag */
    .ag-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 10px;
      color: #999;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      font-family: ui-monospace, monospace;
    }

    .ag-tag-name {
      color: var(--ag-color, #3b82f6);
      font-weight: 600;
    }

    /* Suggested siblings - subtle dashed */
    .ag-suggested {
      position: relative !important;
      outline: 2px dashed rgba(251, 191, 36, 0.5) !important;
      outline-offset: 3px !important;
      transition: all 0.2s ease !important;
    }

    .ag-suggested:hover {
      outline-color: #fbbf24 !important;
      box-shadow: 0 0 15px rgba(251, 191, 36, 0.3) !important;
    }

    /* Toolbar button groups */
    .ag-toolbar-group {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    /* Danger button (remove) */
    .ag-toolbar-btn.danger {
      color: #ef4444;
    }

    .ag-toolbar-btn.danger:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    /* Highlight button (select all similar) */
    .ag-toolbar-btn.highlight {
      color: #fbbf24;
    }

    .ag-toolbar-btn.highlight:hover {
      background: rgba(251, 191, 36, 0.15);
      color: #fcd34d;
    }

    /* Toast notification */
    .ag-toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background: rgba(17, 17, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #10b981;
      font-size: 13px;
      font-weight: 500;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      z-index: 999999;
      animation: ag-toast-in 0.3s ease, ag-toast-out 0.3s ease 1.7s forwards;
    }

    @keyframes ag-toast-in {
      from { transform: translateX(-50%) translateY(20px); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }

    @keyframes ag-toast-out {
      from { transform: translateX(-50%) translateY(0); opacity: 1; }
      to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    }

    /* Keyboard hint badge */
    .ag-toolbar-btn[title]:hover::after {
      content: attr(data-key);
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 4px;
      font-size: 9px;
      color: #888;
      white-space: nowrap;
      pointer-events: none;
    }

    /* ============================================
       SLIM FLOATING EDITOR - Minimal AI-Powered
       ============================================ */
    .ag-editor-panel {
      position: fixed;
      width: 280px;
      background: rgba(10, 10, 12, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(16px);
      z-index: 2147483647;
      animation: ag-slide-in 0.2s ease-out;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: visible;
      pointer-events: auto;
    }

    .ag-editor-panel.dragging {
      opacity: 0.9;
      cursor: grabbing;
    }

    @keyframes ag-slide-in {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Drag Handle Header */
    .ag-drag-handle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      cursor: grab;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      user-select: none;
    }

    .ag-drag-handle:active { cursor: grabbing; }

    .ag-drag-dots {
      display: flex;
      gap: 3px;
      opacity: 0.3;
    }

    .ag-drag-dot {
      width: 4px;
      height: 4px;
      background: #666;
      border-radius: 50%;
    }

    .ag-element-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      font-size: 11px;
      color: #888;
    }

    .ag-element-badge-tag {
      color: var(--ag-color, #3b82f6);
      font-weight: 600;
      font-family: ui-monospace, monospace;
    }

    .ag-panel-close {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: #555;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .ag-panel-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    /* Live Text Editor - Main Focus */
    .ag-text-editor {
      padding: 12px;
    }

    .ag-text-area {
      width: 100%;
      min-height: 60px;
      max-height: 120px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #fff;
      font-size: 13px;
      line-height: 1.5;
      font-family: inherit;
      resize: vertical;
      outline: none;
      transition: all 0.15s;
    }

    .ag-text-area:focus {
      border-color: rgba(59, 130, 246, 0.4);
      background: rgba(255, 255, 255, 0.05);
    }

    .ag-text-area::placeholder { color: #444; }

    .ag-text-hint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 10px;
      color: #555;
    }

    .ag-text-hint-key {
      padding: 2px 5px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
      font-family: ui-monospace, monospace;
      color: #666;
    }

    /* AI Prompt Section */
    .ag-ai-section {
      padding: 0 12px 12px;
    }

    .ag-ai-input-wrap {
      display: flex;
      gap: 6px;
    }

    .ag-ai-input {
      flex: 1;
      padding: 8px 10px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 12px;
      outline: none;
      transition: all 0.15s;
    }

    .ag-ai-input:focus {
      border-color: rgba(139, 92, 246, 0.4);
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
    }

    .ag-ai-input::placeholder { color: #666; }

    .ag-ai-btn {
      padding: 8px 12px;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }

    .ag-ai-btn:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    /* Section Selector */
    .ag-sections {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      overflow-x: auto;
      scrollbar-width: none;
    }

    .ag-sections::-webkit-scrollbar { display: none; }

    .ag-section-chip {
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.04);
      border: none;
      border-radius: 12px;
      color: #666;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .ag-section-chip:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #999;
    }

    .ag-section-chip.active {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }

    /* Quick Actions Row */
    .ag-quick-row {
      display: flex;
      gap: 2px;
      padding: 8px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .ag-mini-btn {
      flex: 1;
      padding: 6px;
      background: transparent;
      border: none;
      color: #555;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .ag-mini-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #999;
    }

    .ag-mini-btn.danger:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
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
  onModeChange: _onModeChange,
  onOpenPrompt,
  onInlineEdit,
}: ElementSelectorProps) {
  const [_hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [editingElement, setEditingElement] = useState<SelectedElement | null>(null);
  const [_toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
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

        // Select all similar elements
        const selectAllSimilar = (element: Element) => {
          const siblings = findSimilarSiblings(element);
          const elementType = detectElementType(element);
          const color = getElementTypeColor(elementType);

          // Add original if not already selected
          const selector = buildSelector(element);
          const newSelection = [...selectedElements];

          if (!newSelection.find(el => el.selector === selector)) {
            element.classList.add('ag-selected');
            element.setAttribute('data-ag-index', '1');
            (element as HTMLElement).style.setProperty('--ag-color', color);
            newSelection.push(getElementInfo(element, 0));
          }

          // Add all siblings
          siblings.forEach((sibling, _i) => {
            const sibSelector = buildSelector(sibling);
            if (!newSelection.find(el => el.selector === sibSelector)) {
              sibling.classList.add('ag-selected');
              sibling.classList.remove('ag-suggested');
              sibling.setAttribute('data-ag-index', String(newSelection.length + 1));
              (sibling as HTMLElement).style.setProperty('--ag-color', color);
              newSelection.push(getElementInfo(sibling, newSelection.length));
            }
          });

          onSelectionChange(newSelection);
        };

        // Navigate to parent element
        const selectParent = (element: Element) => {
          const parent = element.parentElement;
          if (!parent || parent.tagName === 'BODY' || parent.tagName === 'HTML') return;

          // Clear current selection
          iframeDoc.querySelectorAll('.ag-selected, .ag-suggested').forEach(el => {
            el.classList.remove('ag-selected', 'ag-suggested');
            el.removeAttribute('data-ag-index');
            (el as HTMLElement).style.removeProperty('--ag-color');
          });

          const elementType = detectElementType(parent);
          const color = getElementTypeColor(elementType);
          parent.classList.add('ag-selected');
          parent.setAttribute('data-ag-index', '1');
          (parent as HTMLElement).style.setProperty('--ag-color', color);

          const siblings = findSimilarSiblings(parent);
          siblings.forEach(sibling => sibling.classList.add('ag-suggested'));

          onSelectionChange([getElementInfo(parent, 0)]);

          const rect = parent.getBoundingClientRect();
          createToolbar(parent, rect);
        };

        // Navigate to first child
        const selectChild = (element: Element) => {
          const firstChild = Array.from(element.children).find(
            c => !['SCRIPT', 'STYLE', 'LINK', 'META'].includes(c.tagName)
          );
          if (!firstChild) return;

          // Clear current selection
          iframeDoc.querySelectorAll('.ag-selected, .ag-suggested').forEach(el => {
            el.classList.remove('ag-selected', 'ag-suggested');
            el.removeAttribute('data-ag-index');
            (el as HTMLElement).style.removeProperty('--ag-color');
          });

          const elementType = detectElementType(firstChild);
          const color = getElementTypeColor(elementType);
          firstChild.classList.add('ag-selected');
          firstChild.setAttribute('data-ag-index', '1');
          (firstChild as HTMLElement).style.setProperty('--ag-color', color);

          const siblings = findSimilarSiblings(firstChild);
          siblings.forEach(sibling => sibling.classList.add('ag-suggested'));

          onSelectionChange([getElementInfo(firstChild, 0)]);

          const rect = firstChild.getBoundingClientRect();
          createToolbar(firstChild, rect);
        };

        // Copy HTML of element
        const copyHTML = (element: Element) => {
          navigator.clipboard.writeText(element.outerHTML);
          showToast('HTML kopiert!');
        };

        // Show toast notification
        const showToast = (message: string) => {
          const toast = iframeDoc.createElement('div');
          toast.className = 'ag-toast';
          toast.textContent = message;
          iframeDoc.body.appendChild(toast);
          setTimeout(() => toast.remove(), 2000);
        };

        // Create slim floating editor panel - minimal, draggable, AI-focused
        const createToolbar = (element: Element, rect: DOMRect) => {
          removeToolbar();

          toolbar = iframeDoc.createElement('div');
          toolbar.className = 'ag-editor-panel';

          const iframeRect = iframe.getBoundingClientRect();

          // Position panel away from element - bottom right corner by default
          const panelWidth = 280;
          let x = Math.min(rect.right + 16, iframeWin.innerWidth - panelWidth - 16);
          let y = Math.max(16, rect.top);

          // If not enough space on right, position on left
          if (rect.right + panelWidth + 32 > iframeWin.innerWidth) {
            x = Math.max(16, rect.left - panelWidth - 16);
          }

          // Keep in viewport vertically
          if (y + 280 > iframeWin.innerHeight) {
            y = Math.max(16, iframeWin.innerHeight - 300);
          }

          toolbar.style.left = `${x}px`;
          toolbar.style.top = `${y}px`;

          const elementType = detectElementType(element);
          const color = getElementTypeColor(elementType);
          const isEditable = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LABEL', 'LI', 'TD', 'TH'].includes(element.tagName);
          const hasParent = element.parentElement && !['BODY', 'HTML'].includes(element.parentElement.tagName);
          const hasChildren = Array.from(element.children).some(c => !['SCRIPT', 'STYLE'].includes(c.tagName));

          const tagName = element.tagName.toLowerCase();
          const textContent = element.textContent?.trim() || '';

          toolbar.style.setProperty('--ag-color', color);

          toolbar.innerHTML = `
            <!-- Draggable Header -->
            <div class="ag-drag-handle" data-drag="true">
              <div class="ag-drag-dots">
                <span class="ag-drag-dot"></span>
                <span class="ag-drag-dot"></span>
                <span class="ag-drag-dot"></span>
              </div>
              <div class="ag-element-badge">
                <span class="ag-element-badge-tag">${tagName}</span>
              </div>
              <button class="ag-panel-close" data-action="close">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            ${isEditable ? `
            <!-- Live Text Editor -->
            <div class="ag-text-editor">
              <textarea class="ag-text-area" data-input="text" placeholder="Text hier eingeben...">${textContent}</textarea>
              <div class="ag-text-hint">
                <span>Live-Vorschau</span>
                <span><span class="ag-text-hint-key">⌘</span> + <span class="ag-text-hint-key">↵</span> speichern</span>
              </div>
            </div>
            ` : ''}

            <!-- AI Prompt -->
            <div class="ag-ai-section">
              <div class="ag-ai-input-wrap">
                <input type="text" class="ag-ai-input" data-input="ai" placeholder="Was soll ich ändern?">
                <button class="ag-ai-btn" data-action="ai">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>
                  </svg>
                  KI
                </button>
              </div>
            </div>

            <!-- Section Chips -->
            <div class="ag-sections">
              <button class="ag-section-chip active" data-section="text">Text</button>
              ${hasParent ? '<button class="ag-section-chip" data-action="parent">Parent</button>' : ''}
              ${hasChildren ? '<button class="ag-section-chip" data-action="child">Child</button>' : ''}
            </div>

            <!-- Quick Actions -->
            <div class="ag-quick-row">
              <button class="ag-mini-btn" data-action="copy-selector" title="Selector kopieren">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="ag-mini-btn" data-action="copy-html" title="HTML kopieren">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
              </button>
              <button class="ag-mini-btn" data-action="find-code" title="Im Code finden">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
              <button class="ag-mini-btn danger" data-action="remove" title="Entfernen">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          `;

          iframeDoc.body.appendChild(toolbar);

          // === DRAG FUNCTIONALITY ===
          let isDragging = false;
          let dragStartX = 0;
          let dragStartY = 0;
          let panelStartX = 0;
          let panelStartY = 0;

          const dragHandle = toolbar.querySelector('[data-drag="true"]');
          if (dragHandle) {
            dragHandle.addEventListener('mousedown', (e: Event) => {
              const me = e as MouseEvent;
              if ((me.target as HTMLElement).closest('[data-action]')) return;

              isDragging = true;
              dragStartX = me.clientX;
              dragStartY = me.clientY;
              panelStartX = parseInt(toolbar!.style.left) || 0;
              panelStartY = parseInt(toolbar!.style.top) || 0;
              toolbar!.classList.add('dragging');
              me.preventDefault();
            });
          }

          const handleDragMove = (e: MouseEvent) => {
            if (!isDragging || !toolbar) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            toolbar.style.left = `${Math.max(0, Math.min(panelStartX + dx, iframeWin.innerWidth - panelWidth))}px`;
            toolbar.style.top = `${Math.max(0, panelStartY + dy)}px`;
          };

          const handleDragEnd = () => {
            if (isDragging && toolbar) {
              isDragging = false;
              toolbar.classList.remove('dragging');
            }
          };

          iframeDoc.addEventListener('mousemove', handleDragMove);
          iframeDoc.addEventListener('mouseup', handleDragEnd);

          // === TEXT INPUT - LIVE PREVIEW ===
          const textInput = toolbar.querySelector('[data-input="text"]') as HTMLTextAreaElement;
          if (textInput) {
            textInput.addEventListener('input', () => {
              (element as HTMLElement).textContent = textInput.value;
            });
            textInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                const selectedEl = selectedElements.find(el => el.selector === buildSelector(element));
                if (selectedEl) {
                  onInlineEdit(selectedEl, textInput.value);
                  showToast('Gespeichert!');
                }
              }
            });
            // Focus on open
            setTimeout(() => textInput.focus(), 100);
          }

          // === AI INPUT ===
          const aiInput = toolbar.querySelector('[data-input="ai"]') as HTMLInputElement;
          if (aiInput) {
            aiInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const selectedEl = selectedElements.find(el => el.selector === buildSelector(element));
                if (selectedEl && aiInput.value.trim()) {
                  const pos = { x: rect.left + iframeRect.left, y: rect.bottom + iframeRect.top + 8 };
                  // Pass the AI prompt as part of the element
                  selectedEl.selectedText = aiInput.value.trim();
                  onOpenPrompt(selectedEl, pos);
                }
              }
            });
          }

          // === CLICK HANDLERS ===
          toolbar.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('[data-action]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const selectedEl = selectedElements.find(el => el.selector === buildSelector(element));

            switch (action) {
              case 'close':
                removeToolbar();
                break;
              case 'remove':
                element.classList.remove('ag-selected');
                element.removeAttribute('data-ag-index');
                onSelectionChange(selectedElements.filter(el => el.selector !== buildSelector(element)));
                removeToolbar();
                break;
              case 'ai':
                if (selectedEl) {
                  const aiVal = aiInput?.value.trim();
                  if (aiVal) selectedEl.selectedText = aiVal;
                  const pos = { x: rect.left + iframeRect.left, y: rect.bottom + iframeRect.top + 8 };
                  onOpenPrompt(selectedEl, pos);
                }
                break;
              case 'find-code':
                if (selectedEl) {
                  const pos = { x: rect.left + iframeRect.left, y: rect.bottom + iframeRect.top + 8 };
                  onOpenPrompt(selectedEl, pos);
                }
                break;
              case 'copy-selector':
                navigator.clipboard.writeText(buildSelector(element));
                showToast('Selector kopiert!');
                break;
              case 'copy-html':
                copyHTML(element);
                break;
              case 'parent':
                selectParent(element);
                break;
              case 'child':
                selectChild(element);
                break;
            }
          });
        };

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
          const target = e.target as Element;
          if (!target || target === lastHovered) return;
          if (target.closest('.ag-toolbar') || target.closest('.ag-editor-panel')) return;

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

        // Click handler - Smart mode with Shift+Click for multi-select
        const handleClick = (e: MouseEvent) => {
          const target = e.target as Element;
          if (!target) return;
          // Skip clicks inside the editor panel or toolbar
          if (target.closest('.ag-toolbar') || target.closest('.ag-editor-panel')) return;

          e.preventDefault();
          e.stopPropagation();

          const skip = ['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'HTML', 'BODY'];
          if (skip.includes(target.tagName)) return;

          const isShift = e.shiftKey;
          const selector = buildSelector(target);
          const elementType = detectElementType(target);
          const color = getElementTypeColor(elementType);

          // Check if already selected
          const existingIndex = selectedElements.findIndex(el => el.selector === selector);

          if (existingIndex >= 0) {
            // Deselect - remove from selection
            target.classList.remove('ag-selected');
            target.removeAttribute('data-ag-index');
            (target as HTMLElement).style.removeProperty('--ag-color');

            const newSelection = [...selectedElements];
            newSelection.splice(existingIndex, 1);

            // Re-index remaining elements
            newSelection.forEach((el, i) => {
              try {
                const elem = iframeDoc.querySelector(el.selector);
                if (elem) {
                  elem.setAttribute('data-ag-index', String(i + 1));
                }
              } catch { /* ignore */ }
            });

            onSelectionChange(newSelection);
            if (newSelection.length === 0) removeToolbar();
          } else {
            // Select element
            const newElement = getElementInfo(target, selectedElements.length);

            if (isShift) {
              // Shift+Click: Add to multi-selection
              const newIndex = selectedElements.length + 1;
              target.classList.add('ag-selected');
              target.setAttribute('data-ag-index', String(newIndex));
              (target as HTMLElement).style.setProperty('--ag-color', color);

              onSelectionChange([...selectedElements, newElement]);
            } else {
              // Normal click: Clear previous and select new
              // Clear all previous selections
              iframeDoc.querySelectorAll('.ag-selected, .ag-suggested').forEach(el => {
                el.classList.remove('ag-selected', 'ag-suggested');
                el.removeAttribute('data-ag-index');
                (el as HTMLElement).style.removeProperty('--ag-color');
              });

              // Select new element
              target.classList.add('ag-selected');
              target.setAttribute('data-ag-index', '1');
              (target as HTMLElement).style.setProperty('--ag-color', color);

              // Find and show similar siblings as suggestions
              const siblings = findSimilarSiblings(target);
              siblings.forEach(sibling => {
                sibling.classList.add('ag-suggested');
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

        // Handle double-click for inline editing
        const handleDblClick = (e: MouseEvent) => {
          const target = e.target as Element;
          if (!target || target.closest('.ag-toolbar')) return;

          const isEditable = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LABEL', 'LI'].includes(target.tagName);
          if (isEditable) {
            e.preventDefault();
            e.stopPropagation();
            target.setAttribute('contenteditable', 'true');
            target.classList.add('ag-editing');
            (target as HTMLElement).focus();

            const selectedEl = selectedElements.find(el => el.selector === buildSelector(target));
            if (selectedEl) {
              setEditingElement(selectedEl);
            }
          }
        };

        // Keyboard shortcuts handler
        const handleKeyDown = (e: KeyboardEvent) => {
          // Skip if editing
          const activeEl = iframeDoc.activeElement;
          if (activeEl?.classList.contains('ag-editing')) return;

          // Get first selected element
          const selectedEl = iframeDoc.querySelector('.ag-selected');
          if (!selectedEl) return;

          const key = e.key.toLowerCase();

          switch (key) {
            case 'escape':
              // Clear all selections
              iframeDoc.querySelectorAll('.ag-selected, .ag-suggested').forEach(el => {
                el.classList.remove('ag-selected', 'ag-suggested');
                el.removeAttribute('data-ag-index');
                (el as HTMLElement).style.removeProperty('--ag-color');
              });
              onSelectionChange([]);
              removeToolbar();
              break;

            case 'c':
              // Copy selector
              if (!e.metaKey && !e.ctrlKey) {
                navigator.clipboard.writeText(buildSelector(selectedEl));
                showToast('Selector kopiert!');
              }
              break;

            case 'h':
              // Copy HTML
              copyHTML(selectedEl);
              break;

            case 'p':
              // Parent navigation
              selectParent(selectedEl);
              break;

            case 'k':
              // Child navigation
              selectChild(selectedEl);
              break;

            case 'a':
              // Select all similar (only without modifier)
              if (!e.metaKey && !e.ctrlKey) {
                selectAllSimilar(selectedEl);
              }
              break;

            case 'e':
            case 'enter': {
              // Edit text
              const isEditable = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LABEL', 'LI'].includes(selectedEl.tagName);
              if (isEditable) {
                e.preventDefault();
                selectedEl.setAttribute('contenteditable', 'true');
                selectedEl.classList.add('ag-editing');
                (selectedEl as HTMLElement).focus();
                const selectedInfo = selectedElements.find(el => el.selector === buildSelector(selectedEl));
                if (selectedInfo) setEditingElement(selectedInfo);
              }
              break;
            }

            case 'delete':
            case 'backspace':
              // Remove from selection (like clicking again)
              if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                selectedEl.classList.remove('ag-selected');
                selectedEl.removeAttribute('data-ag-index');
                (selectedEl as HTMLElement).style.removeProperty('--ag-color');
                onSelectionChange(selectedElements.filter(el => el.selector !== buildSelector(selectedEl)));
                removeToolbar();
              }
              break;

            case 'arrowup':
              // Navigate to parent
              e.preventDefault();
              selectParent(selectedEl);
              break;

            case 'arrowdown':
              // Navigate to child
              e.preventDefault();
              selectChild(selectedEl);
              break;
          }
        };

        // Add listeners
        iframeDoc.addEventListener('mousemove', handleMouseMove);
        iframeDoc.addEventListener('mouseleave', handleMouseLeave);
        iframeDoc.addEventListener('click', handleClick, true);
        iframeDoc.addEventListener('click', handleClickCapture, true);
        iframeDoc.addEventListener('blur', handleBlur, true);
        iframeDoc.addEventListener('dblclick', handleDblClick, true);
        iframeDoc.addEventListener('keydown', handleKeyDown, true);

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
            iframeDoc.removeEventListener('dblclick', handleDblClick, true);
            iframeDoc.removeEventListener('keydown', handleKeyDown, true);

            iframeDoc.querySelectorAll('.ag-hover, .ag-selected, .ag-editing, .ag-suggested').forEach(el => {
              el.classList.remove('ag-hover', 'ag-selected', 'ag-editing', 'ag-suggested');
              (el as HTMLElement).style.removeProperty('--ag-color');
              el.removeAttribute('contenteditable');
              el.removeAttribute('data-ag-index');
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
  smart: { bg: 'rgba(251, 191, 36, 0.2)', border: '#fbbf24', text: '#fcd34d' },
};

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes: { id: SelectionMode; icon: React.ReactNode; label: string }[] = [
    { id: 'element', icon: <MousePointer2 size={14} />, label: 'Element' },
    { id: 'smart', icon: <Sparkles size={14} />, label: 'Smart' },
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
  onLoadToChat?: () => void;
}

export function SelectionToolbar({
  selectedElements,
  selectionMode,
  onModeChange,
  onClearSelection,
  onSubmitToAI,
  onLoadToChat,
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
          {selectionMode === 'smart' && 'Klicke - ähnliche Elemente werden erkannt'}
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

          {/* Load to Chat button */}
          {onLoadToChat && (
            <button
              onClick={onLoadToChat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/10"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
              title="Auswahl ins Chat laden"
            >
              <MessageSquare size={14} />
              Ins Chat
            </button>
          )}

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
