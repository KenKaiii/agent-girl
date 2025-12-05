/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * ContextMenu - Right-click context menu for quick element actions
 */

import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Trash2,
  Palette,
  Type,
  Image,
  Sparkles,
  Code,
  Layers,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  Lock,
  Unlock,
  ChevronRight,
} from 'lucide-react';
import type { SelectedElement } from './ElementSelector';

interface ContextMenuProps {
  element: SelectedElement;
  position: { x: number; y: number };
  onAction: (action: string, element: SelectedElement) => void;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  submenu?: MenuItem[];
  dividerAfter?: boolean;
}

// Menu items
const MENU_ITEMS: MenuItem[] = [
  {
    id: 'edit-style',
    label: 'Stil bearbeiten',
    icon: <Palette size={14} />,
    shortcut: 'S',
  },
  {
    id: 'edit-text',
    label: 'Text bearbeiten',
    icon: <Type size={14} />,
    shortcut: 'T',
  },
  {
    id: 'edit-ai',
    label: 'Mit KI bearbeiten',
    icon: <Sparkles size={14} />,
    shortcut: 'K',
    dividerAfter: true,
  },
  {
    id: 'copy',
    label: 'Kopieren',
    icon: <Copy size={14} />,
    shortcut: '⌘C',
  },
  {
    id: 'duplicate',
    label: 'Duplizieren',
    icon: <Layers size={14} />,
    shortcut: '⌘D',
  },
  {
    id: 'view-code',
    label: 'Code anzeigen',
    icon: <Code size={14} />,
    shortcut: '⌘I',
    dividerAfter: true,
  },
  {
    id: 'visibility',
    label: 'Sichtbarkeit',
    icon: <Eye size={14} />,
    submenu: [
      { id: 'show', label: 'Anzeigen', icon: <Eye size={12} /> },
      { id: 'hide', label: 'Ausblenden', icon: <EyeOff size={12} /> },
    ],
  },
  {
    id: 'order',
    label: 'Reihenfolge',
    icon: <ArrowUp size={14} />,
    submenu: [
      { id: 'move-up', label: 'Nach oben', icon: <ArrowUp size={12} />, shortcut: '⌘↑' },
      { id: 'move-down', label: 'Nach unten', icon: <ArrowDown size={12} />, shortcut: '⌘↓' },
      { id: 'move-top', label: 'Ganz nach oben', icon: <Maximize size={12} /> },
      { id: 'move-bottom', label: 'Ganz nach unten', icon: <Minimize size={12} /> },
    ],
  },
  {
    id: 'lock',
    label: 'Sperren',
    icon: <Lock size={14} />,
    shortcut: '⌘L',
    dividerAfter: true,
  },
  {
    id: 'delete',
    label: 'Löschen',
    icon: <Trash2 size={14} />,
    shortcut: '⌫',
    danger: true,
  },
];

// AI Quick actions based on element type
const AI_ACTIONS: Record<string, MenuItem[]> = {
  text: [
    { id: 'ai-improve', label: 'Text verbessern', icon: <Sparkles size={12} /> },
    { id: 'ai-shorten', label: 'Kürzen', icon: <Sparkles size={12} /> },
    { id: 'ai-translate', label: 'Übersetzen', icon: <Sparkles size={12} /> },
  ],
  heading: [
    { id: 'ai-optimize', label: 'Optimieren', icon: <Sparkles size={12} /> },
    { id: 'ai-seo', label: 'SEO optimieren', icon: <Sparkles size={12} /> },
  ],
  button: [
    { id: 'ai-cta', label: 'CTA verbessern', icon: <Sparkles size={12} /> },
    { id: 'ai-style', label: 'Auffälliger machen', icon: <Sparkles size={12} /> },
  ],
  image: [
    { id: 'ai-alt', label: 'Alt-Text generieren', icon: <Sparkles size={12} /> },
    { id: 'ai-optimize-img', label: 'Bild optimieren', icon: <Sparkles size={12} /> },
  ],
  container: [
    { id: 'ai-layout', label: 'Layout verbessern', icon: <Sparkles size={12} /> },
    { id: 'ai-responsive', label: 'Responsiv machen', icon: <Sparkles size={12} /> },
  ],
};

export function ContextMenu({ element, position, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 220),
    y: Math.min(position.y, window.innerHeight - 400),
  };

  // Get element-specific AI actions
  const aiActions = AI_ACTIONS[element.elementType] || AI_ACTIONS.text;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100000] min-w-[200px] py-1 rounded-xl overflow-hidden"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        background: 'rgba(24, 24, 28, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Element info */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <code className="text-[10px] text-blue-400">&lt;{element.tagName}&gt;</code>
          {element.textContent && (
            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
              {element.textContent.slice(0, 20)}...
            </span>
          )}
        </div>
      </div>

      {/* AI Quick actions */}
      <div className="py-1 border-b border-white/5">
        <div className="px-3 py-1 text-[9px] text-gray-600 uppercase tracking-wider">KI Aktionen</div>
        {aiActions.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onAction(item.id, element);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-500/10 transition-colors group"
          >
            <span className="text-blue-400 group-hover:text-blue-300">{item.icon}</span>
            <span className="flex-1 text-xs text-gray-300 group-hover:text-white">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main menu items */}
      <div className="py-1">
        {MENU_ITEMS.map((item) => (
          <React.Fragment key={item.id}>
            {item.submenu ? (
              <div
                className="relative"
                onMouseEnter={() => setActiveSubmenu(item.id)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors group"
                >
                  <span className="text-gray-400 group-hover:text-white">{item.icon}</span>
                  <span className="flex-1 text-xs text-gray-300 group-hover:text-white">{item.label}</span>
                  <ChevronRight size={12} className="text-gray-600" />
                </button>

                {/* Submenu */}
                {activeSubmenu === item.id && (
                  <div
                    className="absolute left-full top-0 ml-1 min-w-[160px] py-1 rounded-lg"
                    style={{
                      background: 'rgba(24, 24, 28, 0.98)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          onAction(subItem.id, element);
                          onClose();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors group"
                      >
                        <span className="text-gray-400 group-hover:text-white">{subItem.icon}</span>
                        <span className="flex-1 text-xs text-gray-300 group-hover:text-white">{subItem.label}</span>
                        {subItem.shortcut && (
                          <span className="text-[10px] text-gray-600">{subItem.shortcut}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  onAction(item.id, element);
                  onClose();
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors group ${
                  item.danger ? 'hover:bg-red-500/10' : ''
                }`}
              >
                <span className={`${item.danger ? 'text-red-400 group-hover:text-red-300' : 'text-gray-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span className={`flex-1 text-xs ${item.danger ? 'text-red-400 group-hover:text-red-300' : 'text-gray-300 group-hover:text-white'}`}>
                  {item.label}
                </span>
                {item.shortcut && (
                  <span className="text-[10px] text-gray-600">{item.shortcut}</span>
                )}
              </button>
            )}

            {item.dividerAfter && <div className="my-1 border-t border-white/5" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
