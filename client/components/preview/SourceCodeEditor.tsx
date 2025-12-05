/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * SourceCodeEditor - Direct file editing with live preview sync
 * Features: Search & Replace, Framework-aware editing, AI assistance
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Code,
  Search,
  Replace,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  FileCode,
  Folder,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Undo,
  Redo,
  WrapText,
} from 'lucide-react';

// Framework icons
const FRAMEWORK_ICONS: Record<string, string> = {
  astro: '🚀',
  nextjs: '▲',
  react: '⚛️',
  vue: '💚',
  svelte: '🔥',
  unknown: '📄',
};

// File type colors
const FILE_TYPE_COLORS: Record<string, string> = {
  '.astro': '#ff5a03',
  '.tsx': '#3178c6',
  '.jsx': '#61dafb',
  '.ts': '#3178c6',
  '.js': '#f7df1e',
  '.vue': '#42b883',
  '.svelte': '#ff3e00',
  '.css': '#264de4',
  '.scss': '#cc6699',
};

interface SearchReplaceResult {
  file: string;
  line: number;
  column: number;
  match: string;
  preview: string;
}

interface SourceCodeEditorProps {
  projectPath: string;
  initialFile?: string;
  framework?: string;
  onSave: (filePath: string, content: string) => Promise<void>;
  onSearch: (query: string, options: SearchOptions) => Promise<SearchReplaceResult[]>;
  onReplace: (filePath: string, search: string, replace: string, options: ReplaceOptions) => Promise<{ changes: number }>;
  onAIEdit: (filePath: string, prompt: string, content: string) => Promise<string>;
  onClose: () => void;
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  extensions?: string[];
}

interface ReplaceOptions {
  global: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

// File tree node
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  extension?: string;
}

export function SourceCodeEditor({
  projectPath,
  initialFile,
  framework = 'unknown',
  onSave,
  onSearch,
  onReplace,
  onAIEdit,
  onClose,
}: SourceCodeEditorProps) {
  // State
  const [activeFile, setActiveFile] = useState<string | null>(initialFile || null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Replace state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchReplaceResult[]>([]);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  const [isSearching, setIsSearching] = useState(false);

  // AI state
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Editor state
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(13);

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // History for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setFileContent(newContent);
    setIsDirty(newContent !== originalContent);

    // Add to history
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newContent]);
    setHistoryIndex(prev => prev + 1);
  }, [originalContent, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFileContent(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setFileContent(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Save file
  const handleSave = useCallback(async () => {
    if (!activeFile || !isDirty) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(activeFile, fileContent);
      setOriginalContent(fileContent);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, fileContent, isDirty, onSave]);

  // Search files
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await onSearch(searchQuery, searchOptions);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchOptions, onSearch]);

  // Replace in file
  const handleReplace = useCallback(async (all: boolean) => {
    if (!activeFile || !searchQuery) return;

    try {
      const result = await onReplace(activeFile, searchQuery, replaceQuery, {
        ...searchOptions,
        global: all,
      });

      if (result.changes > 0) {
        // Refresh content
        const newContent = fileContent.replace(
          new RegExp(searchQuery, all ? 'g' : ''),
          replaceQuery
        );
        handleContentChange(newContent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed');
    }
  }, [activeFile, searchQuery, replaceQuery, searchOptions, fileContent, handleContentChange, onReplace]);

  // AI edit
  const handleAIEdit = useCallback(async () => {
    if (!activeFile || !aiPrompt.trim()) return;

    setIsAIProcessing(true);
    try {
      const newContent = await onAIEdit(activeFile, aiPrompt, fileContent);
      handleContentChange(newContent);
      setAiPrompt('');
      setShowAI(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI edit failed');
    } finally {
      setIsAIProcessing(false);
    }
  }, [activeFile, aiPrompt, fileContent, handleContentChange, onAIEdit]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            setTimeout(() => searchInputRef.current?.focus(), 100);
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
        }
      }

      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowAI(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Get file extension color
  const getFileColor = (ext: string) => FILE_TYPE_COLORS[ext] || '#6b7280';

  // Line numbers
  const lineCount = fileContent.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        background: 'rgba(17, 17, 20, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">{FRAMEWORK_ICONS[framework]}</span>
          <div>
            <span className="text-sm font-medium text-white">Source Editor</span>
            {activeFile && (
              <span className="text-xs text-gray-500 ml-2">
                {activeFile.split('/').pop()}
                {isDirty && <span className="text-yellow-400 ml-1">●</span>}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Rückgängig (⌘Z)"
          >
            <Undo size={14} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Wiederholen (⌘⇧Z)"
          >
            <Redo size={14} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded transition-colors ${showSearch ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Suchen (⌘F)"
          >
            <Search size={14} />
          </button>

          {/* AI */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={`p-1.5 rounded transition-colors ${showAI ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="KI Bearbeitung"
          >
            <Sparkles size={14} />
          </button>

          {/* Word wrap */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-1.5 rounded transition-colors ${wordWrap ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Zeilenumbruch"
          >
            <WrapText size={14} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isDirty ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            Speichern
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search & Replace panel */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Suchen..."
                className="w-full pl-8 pr-3 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOptions(prev => ({ ...prev, caseSensitive: !prev.caseSensitive }))}
                className={`px-2 py-1 rounded text-[10px] ${searchOptions.caseSensitive ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                title="Groß-/Kleinschreibung"
              >
                Aa
              </button>
              <button
                onClick={() => setSearchOptions(prev => ({ ...prev, wholeWord: !prev.wholeWord }))}
                className={`px-2 py-1 rounded text-[10px] ${searchOptions.wholeWord ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                title="Ganzes Wort"
              >
                ab
              </button>
              <button
                onClick={() => setSearchOptions(prev => ({ ...prev, regex: !prev.regex }))}
                className={`px-2 py-1 rounded text-[10px] ${searchOptions.regex ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                title="Regex"
              >
                .*
              </button>
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-3 py-1.5 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            >
              {isSearching ? <RefreshCw size={12} className="animate-spin" /> : 'Suchen'}
            </button>
          </div>

          {/* Replace */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Replace size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Ersetzen mit..."
                className="w-full pl-8 pr-3 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleReplace(false)}
              className="px-3 py-1.5 rounded text-xs bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            >
              Ersetzen
            </button>
            <button
              onClick={() => handleReplace(true)}
              className="px-3 py-1.5 rounded text-xs bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            >
              Alle ersetzen
            </button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFile(result.file)}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-white/5"
                >
                  <FileCode size={12} className="text-gray-500" />
                  <span className="text-[10px] text-gray-400">{result.file.split('/').pop()}</span>
                  <span className="text-[10px] text-gray-600">:{result.line}</span>
                  <span className="flex-1 text-[10px] text-gray-300 truncate">{result.preview}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI panel */}
      {showAI && (
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Beschreibe die gewünschte Änderung... (z.B. 'Füge Dark Mode Support hinzu' oder 'Optimiere für SEO')"
              rows={2}
              className="flex-1 px-3 py-2 rounded text-xs resize-none bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
            />
            <button
              onClick={handleAIEdit}
              disabled={isAIProcessing || !aiPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed h-full"
              style={{
                background: aiPrompt.trim() ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
              }}
            >
              {isAIProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Mit KI bearbeiten
            </button>
          </div>

          {/* Quick AI actions */}
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: 'TypeScript hinzufügen', prompt: 'Convert this file to TypeScript with proper types' },
              { label: 'Tailwind optimieren', prompt: 'Optimize Tailwind classes, remove duplicates, use modern utilities' },
              { label: 'Accessibility', prompt: 'Add WCAG 2.1 AA accessibility: aria labels, keyboard navigation, contrast' },
              { label: 'Performance', prompt: 'Optimize for performance: lazy loading, code splitting, caching' },
              { label: 'SEO', prompt: 'Add SEO best practices: meta tags, structured data, semantic HTML' },
              { label: 'Responsive', prompt: 'Make fully responsive with mobile-first breakpoints' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setAiPrompt(action.prompt)}
                className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-white/10 rounded">
            <X size={12} className="text-red-400" />
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        {showLineNumbers && (
          <div className="w-12 flex-shrink-0 bg-white/[0.02] border-r border-white/5 overflow-hidden">
            <div className="p-2 text-right select-none">
              {lineNumbers.map((num) => (
                <div key={num} className="text-[11px] text-gray-600 leading-5">
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code editor */}
        <div className="flex-1 overflow-auto">
          <textarea
            ref={editorRef}
            value={fileContent}
            onChange={(e) => handleContentChange(e.target.value)}
            spellCheck={false}
            className="w-full h-full p-2 bg-transparent text-white font-mono outline-none resize-none"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: '20px',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              tabSize: 2,
            }}
            placeholder={activeFile ? 'Datei wird geladen...' : 'Wähle eine Datei zum Bearbeiten'}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-600">
        <div className="flex items-center gap-3">
          <span>{lineCount} Zeilen</span>
          <span>{fileContent.length} Zeichen</span>
          {activeFile && (
            <span style={{ color: getFileColor(activeFile.slice(activeFile.lastIndexOf('.'))) }}>
              {activeFile.slice(activeFile.lastIndexOf('.'))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>UTF-8</span>
          <span>LF</span>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-transparent border-none outline-none cursor-pointer"
          >
            {[11, 12, 13, 14, 16, 18].map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
