/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * useFileSync - Client-side hook for intelligent file editing
 * Super easy API for direct file manipulation with framework detection
 */

import { useState, useCallback, useEffect } from 'react';

// Types
export type Framework = 'astro' | 'nextjs' | 'react' | 'vue' | 'svelte' | 'unknown';

export interface FrameworkInfo {
  framework: Framework;
  version?: string;
  typescript: boolean;
  styling: 'tailwind' | 'css' | 'scss' | 'styled-components' | 'emotion' | 'unknown';
  router: 'file-based' | 'app-router' | 'pages-router' | 'custom' | 'unknown';
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
  preview: string;
}

export interface FileInfo {
  path: string;
  type: string;
  framework: Framework;
  exports: string[];
  imports: string[];
  components: string[];
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: TreeNode[];
}

// API Base URL
const API_BASE = '/api/files';

// API calls
async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  return res.json();
}

/**
 * Main hook for file sync operations
 */
export function useFileSync(projectPath?: string) {
  const [framework, setFramework] = useState<FrameworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect framework on mount
  useEffect(() => {
    if (projectPath) {
      detectFramework(projectPath).then(setFramework).catch(console.error);
    }
  }, [projectPath]);

  // Detect framework
  const detectFramework = useCallback(async (path: string): Promise<FrameworkInfo> => {
    const result = await api<{ success: boolean; framework: FrameworkInfo }>(
      `/framework?path=${encodeURIComponent(path)}`
    );
    return result.framework;
  }, []);

  // Read file
  const readFile = useCallback(async (filePath: string): Promise<{ content: string; info: FileInfo }> => {
    const result = await api<{ success: boolean; content: string; info: FileInfo }>(
      `/read?path=${encodeURIComponent(filePath)}`
    );
    return { content: result.content, info: result.info };
  }, []);

  // Write file
  const writeFile = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await api<{ success: boolean }>('/write', {
        method: 'POST',
        body: JSON.stringify({ path: filePath, content }),
      });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get file tree
  const getFileTree = useCallback(async (rootPath: string, depth = 3): Promise<TreeNode[]> => {
    const result = await api<{ success: boolean; tree: TreeNode[] }>(
      `/tree?path=${encodeURIComponent(rootPath)}&depth=${depth}`
    );
    return result.tree;
  }, []);

  // Search across files
  const searchFiles = useCallback(async (
    rootPath: string,
    query: string,
    options?: {
      extensions?: string[];
      maxResults?: number;
    }
  ): Promise<SearchResult[]> => {
    const result = await api<{ success: boolean; results: SearchResult[] }>('/search', {
      method: 'POST',
      body: JSON.stringify({ rootPath, query, options }),
    });
    return result.results;
  }, []);

  // Search and replace in single file
  const searchReplace = useCallback(async (
    filePath: string,
    search: string,
    replace: string,
    options?: {
      global?: boolean;
      caseSensitive?: boolean;
      dryRun?: boolean;
    }
  ): Promise<{ changes: number; preview?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api<{ success: boolean; changes: number; preview?: string }>('/replace', {
        method: 'POST',
        body: JSON.stringify({ path: filePath, search, replace, options }),
      });
      return { changes: result.changes, preview: result.preview };
    } catch (err) {
      setError((err as Error).message);
      return { changes: 0 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply style to element
  const applyStyle = useCallback(async (
    filePath: string,
    selector: string,
    styles: Record<string, string>,
    targetFramework?: Framework
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const fw = targetFramework || framework?.framework || 'unknown';
      const result = await api<{ success: boolean }>('/style', {
        method: 'POST',
        body: JSON.stringify({ path: filePath, selector, styles, framework: fw }),
      });
      return result.success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [framework]);

  // Generate component
  const generateComponent = useCallback(async (
    name: string,
    outputPath: string,
    targetFramework?: Framework,
    options?: {
      props?: Record<string, string>;
      children?: boolean;
      styles?: string[];
      typescript?: boolean;
    }
  ): Promise<{ code: string; path: string } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const fw = targetFramework || framework?.framework || 'react';
      const result = await api<{ success: boolean; code: string; path: string }>('/generate', {
        method: 'POST',
        body: JSON.stringify({ name, framework: fw, outputPath, options }),
      });
      return { code: result.code, path: result.path };
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [framework]);

  // Batch replace across files
  const batchReplace = useCallback(async (
    rootPath: string,
    search: string,
    replace: string,
    options?: {
      extensions?: string[];
      dryRun?: boolean;
    }
  ): Promise<{ totalFiles: number; totalChanges: number }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api<{
        success: boolean;
        totalFiles: number;
        totalChanges: number;
      }>('/batch-replace', {
        method: 'POST',
        body: JSON.stringify({ rootPath, search, replace, ...options }),
      });
      return { totalFiles: result.totalFiles, totalChanges: result.totalChanges };
    } catch (err) {
      setError((err as Error).message);
      return { totalFiles: 0, totalChanges: 0 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    framework,
    isLoading,
    error,

    // Operations
    detectFramework,
    readFile,
    writeFile,
    getFileTree,
    searchFiles,
    searchReplace,
    applyStyle,
    generateComponent,
    batchReplace,

    // Utilities
    clearError: () => setError(null),
  };
}

/**
 * Simplified hook for quick style edits
 */
export function useQuickEdit(projectPath?: string) {
  const { applyStyle, searchReplace, framework, isLoading, error } = useFileSync(projectPath);

  // Quick style change - auto-detects framework
  const changeStyle = useCallback(async (
    filePath: string,
    selector: string,
    styles: Record<string, string>
  ) => {
    return applyStyle(filePath, selector, styles);
  }, [applyStyle]);

  // Quick text replace
  const changeText = useCallback(async (
    filePath: string,
    oldText: string,
    newText: string
  ) => {
    return searchReplace(filePath, oldText, newText, { global: false });
  }, [searchReplace]);

  // Quick class change (add/remove Tailwind classes)
  const changeClasses = useCallback(async (
    filePath: string,
    oldClasses: string,
    newClasses: string
  ) => {
    return searchReplace(filePath, oldClasses, newClasses, { global: true });
  }, [searchReplace]);

  return {
    changeStyle,
    changeText,
    changeClasses,
    framework,
    isLoading,
    error,
  };
}

/**
 * Hook for AI-assisted editing
 */
export function useAIEdit(projectPath?: string) {
  const fileSync = useFileSync(projectPath);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);

  // Get AI suggestions for an element
  const getSuggestions = useCallback(async (
    elementType: string,
    currentStyles: Record<string, string>,
    context?: string
  ): Promise<string[]> => {
    // This would call an AI endpoint - for now return mock suggestions
    const suggestions: string[] = [];

    if (elementType === 'heading') {
      suggestions.push('Increase font size for better hierarchy');
      suggestions.push('Add text-shadow for depth');
    }

    if (elementType === 'button') {
      suggestions.push('Add hover animation');
      suggestions.push('Increase padding for better click area');
      suggestions.push('Add subtle shadow for elevation');
    }

    if (elementType === 'container') {
      suggestions.push('Add padding for breathing room');
      suggestions.push('Consider flex layout for children');
    }

    setAISuggestions(suggestions);
    return suggestions;
  }, []);

  return {
    ...fileSync,
    aiSuggestions,
    getSuggestions,
  };
}

export default useFileSync;
