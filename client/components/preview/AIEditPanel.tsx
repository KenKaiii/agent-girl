/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * AI Edit Panel - Prompt input for describing edits based on annotations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Sparkles,
  Image,
  Type,
  Palette,
  Layout,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Annotation } from './AnnotationCanvas';

interface LocalDataField {
  id: string;
  label: string;
  value: string;
  placeholder: string;
}

interface AIEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  annotations: Annotation[];
  onSubmit: (prompt: string, localData?: Record<string, string>) => void;
  isLoading?: boolean;
  localDataFields?: LocalDataField[];
  onLocalDataChange?: (id: string, value: string) => void;
}

// Quick action suggestions based on annotation types
const QUICK_ACTIONS = [
  { icon: <Type size={14} />, label: 'Change text', prompt: 'Change the text in the marked area to: ' },
  { icon: <Image size={14} />, label: 'Replace image', prompt: 'Replace the image in the marked area with: ' },
  { icon: <Palette size={14} />, label: 'Change color', prompt: 'Change the color of the marked element to: ' },
  { icon: <Layout size={14} />, label: 'Adjust layout', prompt: 'Adjust the layout of the marked section to: ' },
];

export function AIEditPanel({
  isOpen,
  onClose,
  annotations,
  onSubmit,
  isLoading = false,
  localDataFields = [],
  onLocalDataChange,
}: AIEditPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [showLocalData, setShowLocalData] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;

    // Collect local data values
    const localData: Record<string, string> = {};
    for (const field of localDataFields) {
      if (field.value) {
        localData[field.id] = field.value;
      }
    }

    onSubmit(prompt, Object.keys(localData).length > 0 ? localData : undefined);
    setPrompt('');
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

  const insertQuickAction = (actionPrompt: string) => {
    setPrompt(prev => prev + actionPrompt);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-4 left-4 right-4 rounded-xl shadow-2xl overflow-hidden"
      style={{
        background: 'rgba(17, 17, 20, 0.98)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          <span className="font-medium text-sm text-white">AI Edit</span>
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
          >
            {annotations.length} area{annotations.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Actions */}
      <div
        className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => insertQuickAction(action.prompt)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all hover:bg-white/10"
            style={{ color: '#888', background: 'rgba(255, 255, 255, 0.03)' }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Local Data Section (collapsed by default) */}
      {localDataFields.length > 0 && (
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button
            onClick={() => setShowLocalData(!showLocalData)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-white/5 transition-colors"
            style={{ color: '#888' }}
          >
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-green-500" />
              <span>Local Data (stays private)</span>
            </div>
            {showLocalData ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showLocalData && (
            <div className="px-4 pb-3 space-y-2">
              {localDataFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => onLocalDataChange?.(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/30"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                    }}
                  />
                </div>
              ))}
              <p className="text-xs text-green-500/70 flex items-center gap-1 mt-2">
                <Lock size={10} />
                This data is processed locally and never sent to external servers
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change in the marked areas..."
            rows={1}
            className="w-full px-4 py-3 pr-12 rounded-xl text-sm resize-none outline-none transition-all focus:ring-2 focus:ring-blue-500/30"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              minHeight: '48px',
              maxHeight: '120px',
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 rounded-lg transition-all"
            style={{
              background: prompt.trim() && !isLoading ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
              color: prompt.trim() && !isLoading ? '#fff' : '#3b82f6',
              opacity: !prompt.trim() || isLoading ? 0.5 : 1,
            }}
            title="Send (Cmd+Enter)"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        {/* Hints */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Cmd+Enter to send</span>
          <span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''} will be included</span>
        </div>
      </div>
    </div>
  );
}
