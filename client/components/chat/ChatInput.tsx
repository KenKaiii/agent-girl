/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Send, Plus, X, Square, Palette, List } from 'lucide-react';
import type { FileAttachment } from '../message/types';
import type { BackgroundProcess } from '../process/BackgroundProcessMonitor';
import { ModeIndicator } from './ModeIndicator';
import type { SlashCommand } from '../../hooks/useWebSocket';
import { CommandTextRenderer } from '../message/CommandTextRenderer';
import { StyleConfigModal } from './StyleConfigModal';
import { FeaturesModal } from './FeaturesModal';
import { getModelConfig } from '../../config/models';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (files?: FileAttachment[], mode?: 'general' | 'coder' | 'intense-research' | 'spark') => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  isPlanMode?: boolean;
  onTogglePlanMode?: () => void;
  backgroundProcesses?: BackgroundProcess[];
  onKillProcess?: (bashId: string) => void;
  mode?: 'general' | 'coder' | 'intense-research' | 'spark';
  availableCommands?: SlashCommand[];
  contextUsage?: {
    inputTokens: number;
    contextWindow: number;
    contextPercentage: number;
  };
  selectedModel?: string;
}

export function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder, isPlanMode, onTogglePlanMode, backgroundProcesses: _backgroundProcesses = [], onKillProcess: _onKillProcess, mode, availableCommands = [], contextUsage, selectedModel }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [modeIndicatorWidth, setModeIndicatorWidth] = useState(80);
  const [isStyleConfigOpen, setIsStyleConfigOpen] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);

  // Slash command autocomplete state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Detect "/" at start of input for command autocomplete
  useEffect(() => {
    if (value.startsWith('/') && availableCommands.length > 0) {
      const searchTerm = value.slice(1).toLowerCase();
      const filtered = availableCommands.filter(cmd =>
        cmd.name.toLowerCase().includes(searchTerm)
      );
      setFilteredCommands(filtered);
      setShowCommandMenu(filtered.length > 0);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandMenu(false);
    }
  }, [value, availableCommands]);

  // Auto-focus on mount with slight delay to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to recalculate
    textarea.style.height = '72px';

    // Set height based on scrollHeight, capped at max
    const newHeight = Math.min(textarea.scrollHeight, 144);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  // Prevent browser default drag behavior (allows drop zones to work)
  useEffect(() => {
    const preventDragDefaults = (e: DragEvent) => {
      e.preventDefault();
    };

    // Only prevent dragover globally (allows custom drop handlers to work)
    window.addEventListener('dragover', preventDragDefaults);

    return () => {
      window.removeEventListener('dragover', preventDragDefaults);
    };
  }, []);

  // Handle paste events for images (screenshots)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault();

    // Only take the first pasted image (max 1 at a time)
    const item = imageItems[0];
    const file = item.getAsFile();
    if (!file) return;

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: `pasted-image-${Date.now()}.${file.type.split('/')[1]}`,
      size: file.size,
      type: file.type,
    };

    // Read as base64
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle command menu navigation
    if (showCommandMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedCommandIndex];
        if (selectedCommand) {
          const commandWithSlash = `/${selectedCommand.name} `;
          onChange(commandWithSlash);
          setShowCommandMenu(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandMenu(false);
        return;
      }
    }

    // Normal submit handling
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, mode);
        setAttachedFiles([]);
        // Refocus input after submit
        setTimeout(() => textareaRef.current?.focus(), 0);
      }
    }
  };

  const handleSubmit = () => {
    onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, mode);
    setAttachedFiles([]);
    // Refocus input after submit
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Only take the first file (max 1 at a time)
    if (files.length === 0) return;
    const file = files[0];

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Read all files as base64 (for images and documents)
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Only take the first file (max 1 at a time)
    const file = files[0];

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Read all files as base64
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="input-container"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="input-wrapper flex-col">
        {/* Slash Command Autocomplete Menu - Above input */}
        {showCommandMenu && filteredCommands.length > 0 && (
          <div className="mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-[240px] overflow-y-auto scrollbar-hidden py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.name}
                  type="button"
                  onMouseDown={(e) => {
                    // Prevent button from stealing focus from textarea
                    e.preventDefault();
                  }}
                  onClick={() => {
                    onChange(`/${cmd.name} `);
                    setShowCommandMenu(false);
                    // Textarea maintains focus - no need to refocus
                  }}
                  onMouseEnter={() => setSelectedCommandIndex(index)}
                  className={`w-full text-left px-4 py-5 transition-colors cursor-pointer ${
                    index < filteredCommands.length - 1 ? 'border-b border-gray-700' : ''
                  } ${index === selectedCommandIndex ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                >
                  <div className="font-mono text-sm text-blue-400">/{cmd.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{cmd.description}</div>
                  {cmd.argumentHint && (
                    <div className="text-xs text-gray-500 mt-1 font-mono">{cmd.argumentHint}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="flex gap-1.5 w-full" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        {/* Main input container with rounded border */}
        <div className={`input-field-wrapper ${isDraggingOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center mx-2 mt-2.5 -mb-1">
              {attachedFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  className="flex relative gap-1 items-center p-1.5 w-60 max-w-60 text-left bg-gray-800 rounded-2xl border border-gray-700 group"
                >
                  {/* Preview thumbnail */}
                  <div className="flex justify-center items-center">
                    <div className="overflow-hidden relative flex-shrink-0 w-12 h-12 rounded-lg border border-gray-700">
                      {file.preview && file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="rounded-lg w-full h-full object-cover object-center"
                          draggable="false"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-xs font-medium">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File info */}
                  <div className="flex flex-col justify-center px-2.5 -space-y-0.5 flex-1 min-w-0 overflow-hidden">
                    <div className="mb-1 text-sm font-medium text-gray-100 truncate w-full">
                      {file.name}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 line-clamp-1">
                      <span>File</span>
                      <span className="capitalize">{formatFileSize(file.size)}</span>
                    </div>
                  </div>

                  {/* Remove button */}
                  <div className="absolute -top-1 -right-1">
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="invisible text-black bg-white rounded-full border border-white transition group-hover:visible"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className="overflow-hidden relative px-2.5">
            {/* Mode Indicator */}
            {mode && <ModeIndicator mode={mode} onWidthChange={setModeIndicatorWidth} />}

            {/* Command Pill Overlay */}
            {value.match(/(^|\s)(\/([a-z-]+))(?=\s|$)/m) && (
              <div
                className="absolute px-1 pt-3 w-full text-sm pointer-events-none z-10 text-gray-100"
                style={{
                  minHeight: '72px',
                  maxHeight: '144px',
                  overflowY: 'auto',
                  textIndent: mode ? `${modeIndicatorWidth}px` : '0px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                <CommandTextRenderer content={value} />
              </div>
            )}

            <textarea
              ref={textareaRef}
              id="chat-input"
              dir="auto"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder || "Send a Message"}
              className="px-1 pt-3 w-full text-sm bg-transparent resize-none scrollbar-hidden outline-hidden placeholder:text-white/40"
              style={{
                minHeight: '72px',
                maxHeight: '144px',
                overflowY: 'auto',
                textIndent: mode ? `${modeIndicatorWidth}px` : '0px',
                color: value.match(/(^|\s)(\/([a-z-]+))(?=\s|$)/m) ? 'transparent' : 'rgb(243, 244, 246)',
                caretColor: 'rgb(243, 244, 246)',
                position: 'relative',
                zIndex: 20,
              }}
            />
          </div>

          {/* Bottom controls */}
          <div className="input-controls">
            {/* Left side */}
            <div className="input-controls-left">
              {/* Plus button */}
              <div className="flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.html,.md,.txt,.json,.xml,.csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={handleFileClick}
                  className="btn-icon"
                  title="Add attachment"
                  type="button"
                >
                  <Plus size={20} />
                </button>

                {/* Plan Mode toggle button */}
                {onTogglePlanMode && (
                  <button
                    onClick={onTogglePlanMode}
                    className={`${isPlanMode ? 'send-button-active' : 'btn-icon'} rounded-lg`}
                    title={isPlanMode ? "Plan Mode Active - Click to deactivate" : "Activate Plan Mode"}
                    type="button"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      padding: '0.375rem 0.75rem',
                    }}
                  >
                    Plan Mode
                  </button>
                )}

                {/* Style Configuration button - only in Coder mode */}
                {mode === 'coder' && (
                  <button
                    onClick={() => setIsStyleConfigOpen(true)}
                    className="btn-icon rounded-lg"
                    title="Configure styling & design system"
                    type="button"
                  >
                    <Palette size={20} />
                  </button>
                )}

                {/* Features button - only in Coder mode */}
                {mode === 'coder' && (
                  <button
                    onClick={() => setIsFeaturesModalOpen(true)}
                    className="btn-icon rounded-lg"
                    title="Define features to build"
                    type="button"
                  >
                    <List size={20} />
                  </button>
                )}

                {/* Background Process Monitor */}
                {/* TODO: Fix background process display - temporarily disabled */}
                {/* {onKillProcess && (
                  <BackgroundProcessMonitor
                    processes={backgroundProcesses}
                    onKillProcess={onKillProcess}
                  />
                )} */}
              </div>
            </div>

            {/* Right side - Context usage and Send/Stop button */}
            <div className="input-controls-right">
              {/* Enhanced Context Usage Display */}
              {contextUsage && (() => {
                // Check if current model is a Kimi model (Moonshot provider)
                const modelConfig = selectedModel ? getModelConfig(selectedModel) : null;
                const isKimiModel = modelConfig?.provider === 'moonshot';

                if (isKimiModel) {
                  // Show custom message for Kimi models
                  return (
                    <div className="flex items-center gap-2 mr-3 px-3 py-1.5 rounded-lg bg-[#1a1c1e] border border-white/20 shadow-sm">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
                        Kimi doesn&apos;t track tokens
                      </span>
                    </div>
                  );
                }

                // Standard context usage display for other models
                return (
                  <div className="flex items-center gap-3 mr-3 px-3 py-1.5 rounded-lg bg-[#1a1c1e] border border-white/20 shadow-sm">
                    {/* Icon with status color */}
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                      contextUsage.contextPercentage >= 90 ? 'bg-red-500/30' :
                      contextUsage.contextPercentage >= 70 ? 'bg-yellow-500/30' :
                      'bg-emerald-500/30'
                    }`}>
                      <svg
                        className={`w-3 h-3 ${
                          contextUsage.contextPercentage >= 90 ? 'text-red-400' :
                          contextUsage.contextPercentage >= 70 ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>

                    {/* Percentage and bar */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-semibold ${
                          contextUsage.contextPercentage >= 90 ? 'text-red-400' :
                          contextUsage.contextPercentage >= 70 ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}>
                          {contextUsage.contextPercentage}%
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          {contextUsage.inputTokens.toLocaleString()} tokens
                        </span>
                      </div>

                      {/* Enhanced progress bar */}
                      <div className="w-28 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            contextUsage.contextPercentage >= 90 ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                            contextUsage.contextPercentage >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                            'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          }`}
                          style={{ width: `${Math.min(contextUsage.contextPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Status indicator */}
                    {contextUsage.contextPercentage >= 90 && (
                      <div className="flex items-center gap-1 text-[10px] text-red-300 font-semibold">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>High</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {isGenerating ? (
                <button
                  onClick={onStop}
                  className="send-button stop-button-active"
                  title="Stop generating"
                  type="button"
                >
                  <Square size={17} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={disabled || !value.trim()}
                  className={`send-button ${!disabled && value.trim() ? 'send-button-active' : ''}`}
                  title="Send message"
                  type="submit"
                >
                  <Send size={17} />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
      </div>

      {/* Style Configuration Modal */}
      {isStyleConfigOpen && (
        <StyleConfigModal
          onComplete={(prompt) => {
            setIsStyleConfigOpen(false);
            onChange(prompt);
            // Focus textarea after modal closes
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 100);
          }}
          onClose={() => setIsStyleConfigOpen(false)}
        />
      )}

      {/* Features Modal */}
      {isFeaturesModalOpen && (
        <FeaturesModal
          onComplete={(prompt) => {
            setIsFeaturesModalOpen(false);
            onChange(prompt);
            // Focus textarea after modal closes
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 100);
          }}
          onClose={() => setIsFeaturesModalOpen(false)}
        />
      )}
    </div>
  );
}
