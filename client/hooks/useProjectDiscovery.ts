/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * useProjectDiscovery - Auto-discover running projects and map to source files
 * Bridges PreviewIntelligence with VisualEditor for frictionless editing
 */

import { useState, useCallback, useEffect } from 'react';
import { detectFramework, getPossibleSourceFiles, getFilePathContext } from '../components/preview/PreviewIntelligence';
import type { Framework } from './useFileSync';

// Running project info
export interface RunningProject {
  port: number;
  url: string;
  framework: Framework | 'unknown';
  projectPath: string | null;
  name: string;
  status: 'running' | 'stopped' | 'unknown';
}

// Source file match result
export interface SourceMatch {
  path: string;
  confidence: number; // 0-1
  reason: string;
  framework: Framework;
}

// Preview context with resolved paths
export interface ResolvedPreviewContext {
  previewUrl: string;
  projectPath: string | null;
  sourceFile: string | null;
  framework: Framework | null;
  possibleFiles: string[];
  isResolved: boolean;
}

/**
 * Hook for discovering running projects and their paths
 */
export function useProjectDiscovery() {
  const [projects, setProjects] = useState<RunningProject[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scan for running dev servers
  const scanProjects = useCallback(async () => {
    setIsScanning(true);
    setError(null);

    try {
      // Common dev server ports
      const commonPorts = [3000, 3001, 4321, 5173, 5174, 8080, 8000];
      const foundProjects: RunningProject[] = [];

      // Check each port
      for (const port of commonPorts) {
        try {
          const url = `http://localhost:${port}`;
          const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
          });

          // If we get here, something is running on this port
          const framework = detectFramework(url) as Framework || 'unknown';

          // Try to get project path from our API
          let projectPath: string | null = null;
          try {
            const pathRes = await fetch(`/api/preview/project-path?port=${port}`);
            if (pathRes.ok) {
              const data = await pathRes.json();
              projectPath = data.path;
            }
          } catch {
            // API might not exist yet
          }

          foundProjects.push({
            port,
            url,
            framework,
            projectPath,
            name: projectPath?.split('/').pop() || `Port ${port}`,
            status: 'running',
          });
        } catch {
          // Port not responding, skip
        }
      }

      setProjects(foundProjects);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Initial scan
  useEffect(() => {
    scanProjects();
  }, [scanProjects]);

  return {
    projects,
    isScanning,
    error,
    refresh: scanProjects,
  };
}

/**
 * Hook for resolving preview URL to source files
 */
export function useSourceResolver(previewUrl: string | null, projectPath: string | null) {
  const [resolvedContext, setResolvedContext] = useState<ResolvedPreviewContext | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Resolve source file for preview URL
  const resolve = useCallback(async () => {
    if (!previewUrl) {
      setResolvedContext(null);
      return;
    }

    setIsResolving(true);

    try {
      const fileContext = getFilePathContext(previewUrl);
      const possibleFiles = getPossibleSourceFiles(previewUrl);

      let resolvedFile: string | null = null;
      let resolvedPath = projectPath;

      // If we have a project path, verify which files exist
      if (projectPath) {
        for (const file of possibleFiles) {
          const fullPath = `${projectPath}/${file}`;
          try {
            const res = await fetch(`/api/files/read?path=${encodeURIComponent(fullPath)}`);
            if (res.ok) {
              resolvedFile = fullPath;
              break;
            }
          } catch {
            // File doesn't exist, try next
          }
        }
      }

      setResolvedContext({
        previewUrl,
        projectPath: resolvedPath,
        sourceFile: resolvedFile,
        framework: fileContext.framework as Framework | null,
        possibleFiles,
        isResolved: !!resolvedFile,
      });
    } catch (err) {
      console.error('Source resolution failed:', err);
      setResolvedContext({
        previewUrl,
        projectPath,
        sourceFile: null,
        framework: null,
        possibleFiles: [],
        isResolved: false,
      });
    } finally {
      setIsResolving(false);
    }
  }, [previewUrl, projectPath]);

  // Auto-resolve when URL or path changes
  useEffect(() => {
    resolve();
  }, [resolve]);

  return {
    context: resolvedContext,
    isResolving,
    refresh: resolve,
  };
}

/**
 * Hook for element → component mapping
 * Maps a CSS selector to its source component file
 */
export function useComponentMapper(projectPath: string | null) {
  const [componentMap, setComponentMap] = useState<Map<string, string>>(new Map());

  // Search for component that renders given selector
  const findComponent = useCallback(async (
    selector: string,
    tagName: string,
    className: string
  ): Promise<SourceMatch | null> => {
    if (!projectPath) return null;

    try {
      // Search for the selector or class in source files
      const searchQuery = className || tagName;

      const res = await fetch('/api/files/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootPath: projectPath,
          query: searchQuery,
          options: {
            extensions: ['.astro', '.tsx', '.jsx', '.vue', '.svelte'],
            maxResults: 10,
          },
        }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const results = data.results || [];

      if (results.length === 0) return null;

      // Score results by relevance
      const scored = results.map((r: { file: string; line: number; context: string }) => {
        let confidence = 0.5;

        // Higher confidence for component files
        if (r.file.includes('/components/')) confidence += 0.2;
        if (r.file.includes('/pages/')) confidence += 0.15;
        if (r.file.includes('/layouts/')) confidence += 0.1;

        // Lower confidence for utility/config files
        if (r.file.includes('.config.')) confidence -= 0.3;
        if (r.file.includes('node_modules')) confidence -= 0.5;

        // Check if class appears in className or class= attribute
        if (r.context.includes('className=') || r.context.includes('class=')) {
          confidence += 0.2;
        }

        return {
          path: r.file,
          confidence: Math.min(1, Math.max(0, confidence)),
          reason: `Found "${searchQuery}" at line ${r.line}`,
          framework: detectFramework(`http://localhost:${projectPath.includes('astro') ? '4321' : '3000'}`) as Framework || 'react',
        };
      });

      // Return highest confidence match
      scored.sort((a: SourceMatch, b: SourceMatch) => b.confidence - a.confidence);
      return scored[0] || null;
    } catch (err) {
      console.error('Component mapping failed:', err);
      return null;
    }
  }, [projectPath]);

  return { findComponent, componentMap };
}

/**
 * Combined hook for seamless preview editing
 * Provides everything needed for VisualEditor integration
 */
export function usePreviewEditing(previewUrl: string | null) {
  const { projects } = useProjectDiscovery();

  // Find project for this preview URL
  const currentProject = previewUrl
    ? projects.find(p => previewUrl.includes(`:${p.port}`))
    : null;

  const { context, isResolving } = useSourceResolver(
    previewUrl,
    currentProject?.projectPath || null
  );

  const { findComponent } = useComponentMapper(currentProject?.projectPath || null);

  // Resolve element to source component
  const resolveElement = useCallback(async (
    selector: string,
    tagName: string,
    className: string
  ) => {
    const match = await findComponent(selector, tagName, className);
    return match;
  }, [findComponent]);

  return {
    // Project info
    project: currentProject,
    projectPath: currentProject?.projectPath || null,
    framework: context?.framework || currentProject?.framework || null,

    // Source file info
    sourceFile: context?.sourceFile || null,
    possibleFiles: context?.possibleFiles || [],
    isResolved: context?.isResolved || false,

    // Loading state
    isResolving,

    // Element resolution
    resolveElement,

    // All running projects
    allProjects: projects,
  };
}

export default usePreviewEditing;
