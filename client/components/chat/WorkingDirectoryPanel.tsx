/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  FolderInput,
  Home,
  Code2,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Terminal,
  GripVertical,
  FileText,
  Image,
  FileJson,
  Settings,
  Package,
  Navigation,
  CornerDownLeft,
} from 'lucide-react';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
}

interface WorkingDirectoryPanelProps {
  workingDirectory: string | null;
  chatFolder?: string;
  onDirectoryChange?: (newPath: string) => void;
  onInsertText?: (text: string) => void;
  sessionId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// File icon based on extension - memoized
const FileIcon = memo(function FileIconInner({ filename }: { filename: string }): React.ReactElement {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconClass = "w-4 h-4 flex-shrink-0";

  const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'swift', 'kt'];
  if (codeExtensions.includes(ext || '')) {
    return <Code2 className={`${iconClass} text-blue-400`} />;
  }

  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext || '')) {
    return <FileJson className={`${iconClass} text-yellow-400`} />;
  }

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext || '')) {
    return <Image className={`${iconClass} text-purple-400`} />;
  }

  if (['md', 'txt', 'doc', 'docx', 'pdf'].includes(ext || '')) {
    return <FileText className={`${iconClass} text-green-400`} />;
  }

  if (filename.startsWith('.') || ['config', 'rc', 'env'].some(s => filename.includes(s))) {
    return <Settings className={`${iconClass} text-gray-400`} />;
  }

  if (['package.json', 'package-lock.json', 'yarn.lock', 'bun.lockb', 'Cargo.toml', 'go.mod'].includes(filename)) {
    return <Package className={`${iconClass} text-orange-400`} />;
  }

  return <File className={`${iconClass} text-white/40`} />;
});

// Format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Idle callback hook for non-blocking deferred work
function useIdleCallback(callback: () => void, deps: React.DependencyList): void {
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout with delay
    if ('requestIdleCallback' in window) {
      const id = (window as typeof window & { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback(() => callback(), { timeout: 2000 });
      return () => (window as typeof window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 100);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Tree node component - memoized for performance
const TreeNode = memo(function TreeNode({
  node,
  depth,
  expandedPaths,
  onToggle,
  onCopyPath,
  onOpenInFinder,
  onOpenFile,
  onInsertToChat,
  onNavigate,
  selectedPath,
  onSelect,
}: {
  node: FileTreeNode;
  depth: number;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onCopyPath: (path: string) => void;
  onOpenInFinder: (path: string) => void;
  onOpenFile: (path: string) => void;
  onInsertToChat: (path: string, type: 'file' | 'directory') => void;
  onNavigate: (path: string) => void;
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
}) {
  const isExpanded = expandedPaths.has(node.path);
  const isDirectory = node.type === 'directory';
  const hasChildren = isDirectory && node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      // Toggle directory expand/collapse
      onToggle(node.path);
    }
    // Select the item to show action menu
    onSelect(isSelected ? null : node.path);
  }, [isDirectory, node.path, onToggle, onSelect, isSelected]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.path);
    e.dataTransfer.setData('application/x-agent-girl-path', JSON.stringify({ path: node.path, type: node.type }));
    e.dataTransfer.effectAllowed = 'copy';
    // Add a drag image
    const dragEl = e.currentTarget as HTMLElement;
    if (dragEl) {
      e.dataTransfer.setDragImage(dragEl, 10, 10);
    }
  }, [node.path, node.type]);

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-0.5 px-2 rounded cursor-pointer transition-colors group select-none ${
          isSelected ? 'bg-blue-500/20' : 'hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        draggable
        onDragStart={handleDragStart}
        onClick={handleClick}
      >
        {/* Drag handle */}
        <GripVertical className="w-3 h-3 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />

        {/* Expand/collapse chevron */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-white/40" />
            ) : (
              <ChevronRight className="w-3 h-3 text-white/40" />
            )
          ) : (
            <span className="w-3" />
          )}
        </div>

        {/* File/folder icon */}
        {isDirectory ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-400/70 flex-shrink-0" />
          )
        ) : (
          <FileIcon filename={node.name} />
        )}

        {/* Name */}
        <span className={`text-xs truncate flex-1 ${isDirectory ? 'text-white/80' : 'text-white/60'}`}>
          {node.name}
        </span>

        {/* File size */}
        {!isDirectory && node.size !== undefined && !isSelected && (
          <span className="text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatSize(node.size)}
          </span>
        )}

        {/* Action buttons - show on hover or when selected */}
        <div className={`flex items-center gap-0.5 ml-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onCopyPath(node.path); }}
            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            title="Copy path"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenInFinder(node.path); }}
            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            title={isDirectory ? "Open in Finder" : "Reveal in Finder"}
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          {!isDirectory && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenFile(node.path); }}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
              title="Open file"
            >
              <File className="w-3 h-3" />
            </button>
          )}
          {isDirectory && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(node.path); }}
              className="p-1 rounded hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors"
              title="Navigate into folder"
            >
              <CornerDownLeft className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onInsertToChat(node.path, node.type); }}
            className="p-1 rounded hover:bg-white/10 text-green-400 hover:text-green-300 transition-colors"
            title="Insert to chat"
          >
            <MessageSquare className="w-3 h-3" />
          </button>
        </div>
      </div>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
              onCopyPath={onCopyPath}
              onOpenInFinder={onOpenInFinder}
              onOpenFile={onOpenFile}
              onInsertToChat={onInsertToChat}
              onNavigate={onNavigate}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Action button component
const ActionButton = memo(function ActionButton({
  icon: Icon,
  title,
  onClick,
  disabled,
  active,
  variant = 'default',
}: {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'default' | 'primary' | 'success';
}) {
  const variantClasses = {
    default: 'text-white/40 hover:text-white/70 hover:bg-white/10',
    primary: 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10',
    success: 'text-green-400 hover:text-green-300 hover:bg-green-500/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-white/10 text-white/80' : variantClasses[variant]} disabled:opacity-30 disabled:cursor-not-allowed`}
      title={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
});

// Path input component for quick navigation
const PathInput = memo(function PathInput({
  currentPath,
  onNavigate,
  onClose,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(currentPath);
  const [isValidating, setIsValidating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Validate and fetch suggestions
  const debouncedValue = useDebounce(value, 150);

  useEffect(() => {
    if (!debouncedValue || debouncedValue === currentPath) {
      setSuggestions([]);
      return;
    }

    // Expand ~ to home directory
    const expandedPath = debouncedValue.startsWith('~')
      ? '/Users/master' + debouncedValue.slice(1)
      : debouncedValue;

    const fetchSuggestions = async () => {
      setIsValidating(true);
      try {
        const response = await fetch('/api/path-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: expandedPath }),
        });
        const data = await response.json();
        if (data.success && data.suggestions) {
          setSuggestions(data.suggestions.slice(0, 8));
          setShowSuggestions(data.suggestions.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsValidating(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue, currentPath]);

  const handleSubmit = useCallback((path?: string) => {
    const targetPath = path || value;
    const expandedPath = targetPath.startsWith('~')
      ? '/Users/master' + targetPath.slice(1)
      : targetPath;

    if (expandedPath && expandedPath !== currentPath) {
      onNavigate(expandedPath);
    }
    onClose();
  }, [value, currentPath, onNavigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (showSuggestions && selectedIndex >= 0) {
        handleSubmit(suggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      // Auto-complete with first suggestion
      const suggestion = suggestions[selectedIndex >= 0 ? selectedIndex : 0];
      if (suggestion) {
        setValue(suggestion);
        setShowSuggestions(false);
      }
    }
  }, [onClose, handleSubmit, showSuggestions, selectedIndex, suggestions]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#161b22] border border-white/20 rounded">
        <Navigation className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="flex-1 bg-transparent text-xs text-white/90 outline-none placeholder:text-white/30"
          placeholder="Enter path or paste (use ~ for home)..."
          spellCheck={false}
        />
        {isValidating && (
          <RefreshCw className="w-3 h-3 text-white/30 animate-spin" />
        )}
        <button
          onClick={() => handleSubmit()}
          className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
          title="Go (Enter)"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c2128] border border-white/10 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const displayPath = suggestion.startsWith('/Users/master')
              ? '~' + suggestion.slice(13)
              : suggestion;
            return (
              <button
                key={suggestion}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                  index === selectedIndex ? 'bg-blue-500/20 text-white' : 'text-white/70 hover:bg-white/5'
                }`}
                onClick={() => handleSubmit(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Folder className="w-3.5 h-3.5 text-yellow-400/70 flex-shrink-0" />
                <span className="truncate">{displayPath}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export function WorkingDirectoryPanel({
  workingDirectory,
  chatFolder = '/Users/master/Documents/agent-girl',
  onDirectoryChange,
  onInsertText,
  sessionId: _sessionId,
  isCollapsed = true,
  onToggleCollapse,
}: WorkingDirectoryPanelProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directoryHistory, setDirectoryHistory] = useState<string[]>([]);
  const [showPathInput, setShowPathInput] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const historyIndexRef = useRef(-1);
  const treeCache = useRef<Map<string, FileTreeNode[]>>(new Map());

  // Track directory changes for history
  useEffect(() => {
    if (workingDirectory && workingDirectory !== directoryHistory[historyIndexRef.current]) {
      const newHistory = [...directoryHistory.slice(0, historyIndexRef.current + 1), workingDirectory];
      setDirectoryHistory(newHistory);
      historyIndexRef.current = newHistory.length - 1;
    }
  }, [workingDirectory, directoryHistory]);

  const canGoBack = historyIndexRef.current > 0;
  const canGoForward = historyIndexRef.current < directoryHistory.length - 1;

  const displayPath = useMemo(() => {
    if (!workingDirectory) return 'No directory selected';
    const homedir = '/Users/master';
    if (workingDirectory.startsWith(homedir)) {
      return '~' + workingDirectory.slice(homedir.length);
    }
    return workingDirectory;
  }, [workingDirectory]);

  const folderName = useMemo(() => {
    if (!workingDirectory) return '';
    return workingDirectory.split('/').pop() || workingDirectory;
  }, [workingDirectory]);

  const isInChatFolder = workingDirectory === chatFolder;

  // Track if we've loaded the deep tree
  const hasDeepTree = useRef(false);

  // Fetch directory tree with progressive loading (shallow first, deep in background)
  const fetchTree = useCallback(async (forceRefresh = false, depth = 2) => {
    if (!workingDirectory) return;

    const cacheKey = `${workingDirectory}:${depth}`;

    // Check cache first (use deep cache if available)
    if (!forceRefresh) {
      const deepKey = `${workingDirectory}:4`;
      if (treeCache.current.has(deepKey)) {
        setTree(treeCache.current.get(deepKey)!);
        return;
      }
      if (treeCache.current.has(cacheKey)) {
        setTree(treeCache.current.get(cacheKey)!);
        return;
      }
    }

    // Only show loading for initial shallow fetch
    if (depth <= 2) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/directory-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: workingDirectory, depth }),
      });

      const data = await response.json();

      if (data.success) {
        setTree(data.tree);
        // Cache the result
        treeCache.current.set(cacheKey, data.tree);
        // Limit cache size
        if (treeCache.current.size > 30) {
          const firstKey = treeCache.current.keys().next().value;
          if (firstKey) treeCache.current.delete(firstKey);
        }
        // Auto-expand first level only on initial load
        if (depth <= 2) {
          const firstLevelDirs = data.tree
            .filter((n: FileTreeNode) => n.type === 'directory')
            .map((n: FileTreeNode) => n.path);
          setExpandedPaths(new Set(firstLevelDirs));
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to load directory');
    } finally {
      if (depth <= 2) {
        setIsLoading(false);
      }
    }
  }, [workingDirectory]);

  // Load shallow tree immediately when expanded, deep tree deferred
  useEffect(() => {
    if (!isCollapsed && workingDirectory) {
      hasDeepTree.current = false;
      // Shallow fetch first (fast, blocks render briefly)
      fetchTree(false, 2);
    }
  }, [workingDirectory, isCollapsed, fetchTree]);

  // Deferred deep tree loading using idle callback
  useIdleCallback(() => {
    if (!isCollapsed && workingDirectory && !hasDeepTree.current) {
      hasDeepTree.current = true;
      // Deep fetch in background (non-blocking)
      fetchTree(false, 4);
    }
  }, [isCollapsed, workingDirectory, fetchTree]);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const copyPath = useCallback(async () => {
    if (!workingDirectory) return;
    await navigator.clipboard.writeText(workingDirectory);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [workingDirectory]);

  const openFolder = useCallback(async () => {
    if (!workingDirectory) return;
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: workingDirectory }),
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  }, [workingDirectory]);

  const openTerminal = useCallback(async () => {
    if (!workingDirectory) return;
    try {
      await fetch('/api/open-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: workingDirectory }),
      });
    } catch (err) {
      console.error('Failed to open terminal:', err);
    }
  }, [workingDirectory]);

  const openFile = useCallback(async (filePath: string) => {
    try {
      await fetch('/api/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, []);

  // Copy individual item path
  const copyItemPath = useCallback(async (path: string) => {
    await navigator.clipboard.writeText(path);
    setSelectedPath(null);
  }, []);

  // Open item in Finder (reveal for files, open for directories)
  const openItemInFinder = useCallback(async (path: string) => {
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, reveal: true }),
      });
    } catch (err) {
      console.error('Failed to open in Finder:', err);
    }
    setSelectedPath(null);
  }, []);

  const pickDirectory = useCallback(async () => {
    try {
      const response = await fetch('/api/pick-directory', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success && data.path && onDirectoryChange) {
        onDirectoryChange(data.path);
      }
    } catch (err) {
      console.error('Failed to pick directory:', err);
    }
  }, [onDirectoryChange]);

  const goHome = useCallback(() => {
    if (onDirectoryChange) {
      onDirectoryChange('/Users/master');
    }
  }, [onDirectoryChange]);

  const goToChatFolder = useCallback(() => {
    if (onDirectoryChange) {
      onDirectoryChange(chatFolder);
    }
  }, [onDirectoryChange, chatFolder]);

  const goBack = useCallback(() => {
    if (canGoBack && onDirectoryChange) {
      historyIndexRef.current -= 1;
      onDirectoryChange(directoryHistory[historyIndexRef.current]);
    }
  }, [canGoBack, onDirectoryChange, directoryHistory]);

  const goForward = useCallback(() => {
    if (canGoForward && onDirectoryChange) {
      historyIndexRef.current += 1;
      onDirectoryChange(directoryHistory[historyIndexRef.current]);
    }
  }, [canGoForward, onDirectoryChange, directoryHistory]);

  // Navigate to a directory
  const navigateToPath = useCallback((path: string) => {
    if (onDirectoryChange) {
      onDirectoryChange(path);
    }
  }, [onDirectoryChange]);

  // Insert path to chat
  const insertPathToChat = useCallback((path: string, type: 'file' | 'directory') => {
    if (onInsertText) {
      const relativePath = workingDirectory && path.startsWith(workingDirectory)
        ? path.slice(workingDirectory.length + 1)
        : path;

      const prefix = type === 'file' ? 'File: ' : 'Folder: ';
      onInsertText(`${prefix}\`${relativePath}\` `);
    }
  }, [onInsertText, workingDirectory]);

  // Keyboard shortcut: Cmd+G to open path input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !isCollapsed) {
        e.preventDefault();
        setShowPathInput(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  if (!workingDirectory) {
    return (
      <div className="border-t border-white/10 bg-[#0d1117]">
        <button
          onClick={pickDirectory}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <FolderInput className="w-4 h-4" />
          <span>Select working directory...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 bg-[#0d1117]">
      {/* Top Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/5">
        {/* Navigation: Back/Forward */}
        <div className="flex items-center gap-0.5">
          <ActionButton
            icon={ArrowLeft}
            title="Go back"
            onClick={goBack}
            disabled={!canGoBack}
          />
          <ActionButton
            icon={ArrowRight}
            title="Go forward"
            onClick={goForward}
            disabled={!canGoForward}
          />
        </div>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Quick navigation: Home, Chat folder, Go to path */}
        <div className="flex items-center gap-0.5">
          <ActionButton
            icon={Home}
            title="Go to home (~)"
            onClick={goHome}
          />
          <ActionButton
            icon={MessageSquare}
            title="Go to chat folder"
            onClick={goToChatFolder}
            active={isInChatFolder}
            variant="primary"
          />
          <ActionButton
            icon={Navigation}
            title="Go to path (Cmd+G)"
            onClick={() => setShowPathInput(true)}
            variant="primary"
          />
          <ActionButton
            icon={FolderInput}
            title="Browse & select directory"
            onClick={pickDirectory}
          />
        </div>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Actions: Finder, Terminal, Copy, Refresh */}
        <div className="flex items-center gap-0.5">
          <ActionButton
            icon={ExternalLink}
            title="Open in Finder"
            onClick={openFolder}
          />
          <ActionButton
            icon={Terminal}
            title="Open terminal here"
            onClick={openTerminal}
          />
          <ActionButton
            icon={copied ? Check : Copy}
            title="Copy path"
            onClick={copyPath}
            variant={copied ? 'success' : 'default'}
          />
          <ActionButton
            icon={RefreshCw}
            title="Refresh file tree"
            onClick={() => fetchTree(true, 4)}
            disabled={isLoading}
          />
        </div>

        <div className="flex-1" />

        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 cursor-pointer hover:bg-white/10 transition-colors max-w-[200px]"
          onClick={onToggleCollapse}
          title={workingDirectory}
        >
          <Folder className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
          <span className="text-[11px] text-white/70 truncate font-medium">
            {folderName}
          </span>
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-white/40 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Expanded file tree */}
      {!isCollapsed && (
        <div className="border-t border-white/5">
          {/* Path input or breadcrumb */}
          <div className="px-3 py-1.5 bg-white/[0.02] border-b border-white/5">
            {showPathInput ? (
              <PathInput
                currentPath={workingDirectory}
                onNavigate={navigateToPath}
                onClose={() => setShowPathInput(false)}
              />
            ) : (
              <div
                className="text-[10px] text-white/40 truncate cursor-pointer hover:text-white/60 transition-colors"
                title={`${workingDirectory} (click to edit, Cmd+G)`}
                onClick={() => setShowPathInput(true)}
              >
                {displayPath}
              </div>
            )}
          </div>

          {/* Tree content */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />
              </div>
            ) : error ? (
              <div className="px-3 py-2 text-xs text-red-400">{error}</div>
            ) : tree.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/40">Empty directory</div>
            ) : (
              <div className="py-1" onClick={() => setSelectedPath(null)}>
                {tree.map((node) => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    expandedPaths={expandedPaths}
                    onToggle={togglePath}
                    onCopyPath={copyItemPath}
                    onOpenInFinder={openItemInFinder}
                    onOpenFile={openFile}
                    onInsertToChat={insertPathToChat}
                    onNavigate={navigateToPath}
                    selectedPath={selectedPath}
                    onSelect={setSelectedPath}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Help hint */}
          <div className="px-3 py-1.5 bg-white/[0.02] border-t border-white/5">
            <div className="text-[10px] text-white/30 flex items-center gap-1.5">
              <GripVertical className="w-3 h-3" />
              <span>Click to select & show actions | Drag to chat</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkingDirectoryPanel;
