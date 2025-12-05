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

import React, { useRef, useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Send, Plus, X, Square, Hammer } from 'lucide-react';
import type { FileAttachment } from '../message/types';
import { ModeIndicator } from './ModeIndicator';
import type { SlashCommand } from '../../hooks/useWebSocket';
import { CommandTextRenderer } from '../message/CommandTextRenderer';

interface NewChatWelcomeProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (files?: FileAttachment[], mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified') => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isPlanMode?: boolean;
  onTogglePlanMode?: () => void;
  availableCommands?: SlashCommand[];
  onOpenBuildWizard?: () => void;
  mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified';
  onModeChange?: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified') => void;
}

const CAPABILITIES = [
  "I can build websites for you",
  "I can research anything you want",
  "I can debug and fix your code",
  "I can automate repetitive tasks",
  "I can analyze data and files"
];

// Memoized file attachment component for performance
const FileAttachmentPreview = memo(function FileAttachmentPreview({
  file,
  onRemove,
  formatFileSize,
}: {
  file: FileAttachment;
  onRemove: (id: string) => void;
  formatFileSize: (bytes: number) => string;
}) {
  return (
    <button
      type="button"
      className="flex relative gap-1 items-center p-1.5 w-full max-w-60 text-left bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 group hover:border-gray-600 transition-all duration-200"
    >
      <div className="flex justify-center items-center">
        <div className="overflow-hidden relative flex-shrink-0 w-12 h-12 rounded-lg border border-gray-700/50">
          {file.preview && file.type.startsWith('image/') ? (
            <img
              src={file.preview}
              alt={file.name}
              className="rounded-lg w-full h-full object-cover object-center"
              draggable="false"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-xs font-medium">
              {file.name.split('.').pop()?.toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-center px-2.5 -space-y-0.5 flex-1 min-w-0 overflow-hidden">
        <div className="mb-1 text-sm font-medium text-gray-100 truncate w-full">{file.name}</div>
        <div className="flex justify-between text-xs text-gray-500 line-clamp-1">
          <span>File</span>
          <span className="capitalize">{formatFileSize(file.size)}</span>
        </div>
      </div>
      <div className="absolute -top-1 -right-1">
        <button
          onClick={() => onRemove(file.id)}
          className="invisible text-black bg-white rounded-full border border-white transition-all group-hover:visible hover:scale-110"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </button>
  );
});

export const NewChatWelcome = memo(function NewChatWelcome({ inputValue, onInputChange, onSubmit, onStop, disabled, isGenerating, isPlanMode, onTogglePlanMode, availableCommands = [], onOpenBuildWizard, mode, onModeChange }: NewChatWelcomeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Mode selection state (synchronized with parent via props)
  const [selectedMode, setSelectedMode] = useState<'general' | 'coder' | 'intense-research' | 'spark' | 'unified'>(mode || 'general');

  // Sync local mode state with prop when it changes
  useEffect(() => {
    if (mode) {
      setSelectedMode(mode);
    }
  }, [mode]);

  // Handle mode change from indicator - memoized
  const handleModeIndicatorChange = useCallback((newMode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified') => {
    setSelectedMode(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  const [modeIndicatorWidth, setModeIndicatorWidth] = useState(80);

  // Slash command autocomplete state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Detect "/" at start of input for command autocomplete
  useEffect(() => {
    if (inputValue.startsWith('/') && availableCommands.length > 0) {
      const searchTerm = inputValue.slice(1).toLowerCase();
      const filtered = availableCommands.filter(cmd =>
        cmd.name.toLowerCase().includes(searchTerm)
      );
      setFilteredCommands(filtered);
      setShowCommandMenu(filtered.length > 0);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandMenu(false);
    }
  }, [inputValue, availableCommands]);

  // Typewriter effect state
  const [currentCapabilityIndex, setCurrentCapabilityIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // User config state
  const [userName, setUserName] = useState<string | null>(null);

  // Load user config on mount
  useEffect(() => {
    fetch('/api/user-config')
      .then(res => res.json())
      .then(data => {
        if (data.displayName) {
          setUserName(data.displayName);
        }
      })
      .catch(err => {
        console.error('Failed to load user config:', err);
      });
  }, []);

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
  }, [inputValue]);

  // Typewriter effect
  useEffect(() => {
    const currentText = CAPABILITIES[currentCapabilityIndex];

    if (isTyping) {
      if (displayedText.length < currentText.length) {
        const timer = setTimeout(() => {
          setDisplayedText(currentText.slice(0, displayedText.length + 1));
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Finished typing, wait before erasing
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      // Erasing
      if (displayedText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timer);
      } else {
        // Finished erasing, move to next capability
        setCurrentCapabilityIndex((prev) => (prev + 1) % CAPABILITIES.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, currentCapabilityIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
          onInputChange(commandWithSlash);
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
      onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, selectedMode);
      setAttachedFiles([]);
    }
  };

  const handleSubmit = () => {
    onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, selectedMode);
    setAttachedFiles([]);
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

  // Memoized formatFileSize function
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // Memoized input container styles for performance
  const inputContainerStyle = useMemo(() => ({
    backgroundColor: 'rgb(38, 40, 42)',
    boxShadow: isFocused
      ? '0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 40px rgba(59, 130, 246, 0.1)'
      : isDraggingOver
        ? '0 0 0 2px rgba(59, 130, 246, 0.5), 0 4px 24px rgba(0, 0, 0, 0.4)'
        : '0 4px 16px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease-out',
  }), [isFocused, isDraggingOver]);

  return (
    <div
      className="flex-1 flex items-center justify-center w-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="w-full max-w-full sm:max-w-3xl md:max-w-4xl px-2 sm:px-4">
        {/* Greeting */}
        <div className="flex flex-col gap-1 justify-center items-center mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-row justify-center gap-3 w-full px-2 sm:px-5">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-[40px] font-semibold text-center text-gradient leading-tight">
              {userName ? `Hi, ${userName}. I'm Agent girl` : "Hi. I'm Agent girl"}
            </div>
          </div>

          {/* Typewriter capabilities */}
          <div className="flex justify-center items-center mt-1 sm:mt-2 h-6 sm:h-8 px-2">
            <div className="text-sm sm:text-base md:text-lg text-gray-400 font-medium flex items-center text-center">
              <span className="break-words">{displayedText}</span>
              <span className="inline-block w-[2px] sm:w-[3px] h-[14px] sm:h-[18px] bg-gray-400 ml-0.5 animate-blink"></span>
            </div>
          </div>
        </div>

        {/* Input Container */}
        <div className="w-full max-w-full sm:max-w-[640px] md:max-w-[800px] lg:max-w-[960px] mx-auto">
          {/* Slash Command Autocomplete Menu - Above input */}
          {showCommandMenu && filteredCommands.length > 0 && (
            <div className="mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[240px] overflow-y-auto scrollbar-hidden py-2">
                {filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.name}
                    type="button"
                    onClick={() => {
                      onInputChange(`/${cmd.name} `);
                      setShowCommandMenu(false);
                      textareaRef.current?.focus();
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

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-1.5 w-full relative">
            <div
              className="flex-1 flex flex-col relative w-full rounded-xl border border-white/10 hover:border-white/20"
              style={inputContainerStyle}
            >
              {/* File attachments preview - using memoized component */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center mx-2 mt-2.5 -mb-1">
                  {attachedFiles.map((file) => (
                    <FileAttachmentPreview
                      key={file.id}
                      file={file}
                      onRemove={handleRemoveFile}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </div>
              )}

              {/* Textarea */}
              <div className="relative px-2.5" style={{ overflow: 'visible' }}>
                {/* Mode Indicator */}
                <ModeIndicator mode={selectedMode} onWidthChange={setModeIndicatorWidth} onModeChange={handleModeIndicatorChange} />

                {/* Command Pill Overlay */}
                {inputValue.match(/(^|\s)(\/([a-z-]+))(?=\s|$)/m) && (
                  <div
                    className="absolute px-1 pt-3 w-full text-sm pointer-events-none z-10 text-gray-100"
                    style={{
                      minHeight: '72px',
                      maxHeight: '144px',
                      overflowY: 'auto',
                      textIndent: `${modeIndicatorWidth}px`,
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                    }}
                  >
                    <CommandTextRenderer content={inputValue} />
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  dir="auto"
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="How can I help you today?"
                  className="px-1 pt-3 w-full text-sm bg-transparent resize-none scrollbar-hidden outline-hidden placeholder:text-white/40"
                  style={{
                    minHeight: '72px',
                    maxHeight: '144px',
                    overflowY: 'auto',
                    textIndent: `${modeIndicatorWidth}px`,
                    color: inputValue.match(/(^|\s)(\/([a-z-]+))(?=\s|$)/m) ? 'transparent' : 'rgb(243, 244, 246)',
                    caretColor: 'rgb(243, 244, 246)',
                  }}
                  disabled={disabled}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mx-2 sm:mx-3.5 mt-1 sm:mt-1.5 mb-2 sm:mb-3.5 max-w-full">
                <div className="self-end flex items-center gap-1 sm:gap-1.5">
                  {/* File Upload */}
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
                      type="button"
                      className="border rounded-md sm:rounded-lg border-white/10 bg-transparent transition p-1 sm:p-1.5 outline-none focus:outline-none text-white hover:bg-gray-800"
                      aria-label="Upload files"
                    >
                      <Plus className="size-4 sm:size-5" />
                    </button>

                    {/* Plan Mode toggle button */}
                    {onTogglePlanMode && (
                      <button
                        onClick={onTogglePlanMode}
                        type="button"
                        className={`${isPlanMode ? 'send-button-active' : 'border border-white/10 bg-transparent text-white hover:bg-gray-800'} rounded-md sm:rounded-lg transition outline-none focus:outline-none text-[10px] sm:text-xs font-medium px-1.5 py-1 sm:px-3 sm:py-1.5`}
                        title={isPlanMode ? "Plan Mode Active - Click to deactivate" : "Activate Plan Mode"}
                        aria-label={isPlanMode ? "Deactivate Plan Mode" : "Activate Plan Mode"}
                      >
                        <span className="hidden sm:inline">Plan Mode</span>
                        <span className="sm:hidden">Plan</span>
                      </button>
                    )}

                    {/* Build Wizard button */}
                    {onOpenBuildWizard && (
                      <button
                        onClick={onOpenBuildWizard}
                        type="button"
                        className="flex items-center gap-1.5 rounded-md sm:rounded-lg transition outline-none focus:outline-none text-[10px] sm:text-xs font-medium px-1.5 py-1 sm:px-3 sm:py-1.5"
                        style={{
                          background: 'linear-gradient(90deg, rgba(255, 199, 168, 0.15) 0%, rgba(255, 228, 218, 0.15) 100%)',
                          border: '1px solid rgba(255, 199, 168, 0.3)',
                          color: '#ffc7a8',
                        }}
                        title="Open Build Wizard - Create projects with guided setup"
                        aria-label="Open Build Wizard"
                      >
                        <Hammer className="size-3.5 sm:size-4" />
                        <span className="hidden sm:inline">Build</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Send/Stop Button */}
                <div className="flex self-end space-x-1 shrink-0">
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={onStop}
                      className="stop-button-active transition rounded-md sm:rounded-lg p-1.5 sm:p-2 self-center"
                      aria-label="Stop Generating"
                    >
                      <Square className="size-3.5 sm:size-4" fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={disabled || !inputValue.trim()}
                      className={`transition rounded-md sm:rounded-lg p-1.5 sm:p-2 self-center ${
                        !disabled && inputValue.trim()
                          ? 'send-button-active'
                          : 'bg-gray-500 text-white/40 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600'
                      }`}
                      aria-label="Send Message"
                    >
                      <Send className="size-3.5 sm:size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
});
