/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Preview Intelligence - File detection, live reload, and element inspection
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Common framework file patterns
const FRAMEWORK_PATTERNS: Record<string, {
  routes: (url: string) => string[];
  fileExtensions: string[];
  componentPatterns: string[];
}> = {
  astro: {
    routes: (url) => {
      const path = new URL(url).pathname;
      if (path === '/' || path === '') return ['src/pages/index.astro', 'src/pages/index.md'];
      // Remove trailing slash and extension
      const clean = path.replace(/\/$/, '').replace(/\.[^.]+$/, '');
      return [
        `src/pages${clean}.astro`,
        `src/pages${clean}/index.astro`,
        `src/pages${clean}.md`,
        `src/pages${clean}.mdx`,
      ];
    },
    fileExtensions: ['.astro', '.tsx', '.jsx', '.ts', '.js'],
    componentPatterns: ['src/components/**/*', 'src/layouts/**/*'],
  },
  nextjs: {
    routes: (url) => {
      const path = new URL(url).pathname;
      if (path === '/' || path === '') return ['app/page.tsx', 'app/page.jsx', 'pages/index.tsx', 'pages/index.jsx'];
      const clean = path.replace(/\/$/, '');
      return [
        `app${clean}/page.tsx`,
        `app${clean}/page.jsx`,
        `pages${clean}.tsx`,
        `pages${clean}.jsx`,
        `pages${clean}/index.tsx`,
        `pages${clean}/index.jsx`,
      ];
    },
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
    componentPatterns: ['components/**/*', 'app/**/*', 'src/components/**/*'],
  },
  react: {
    routes: (url) => {
      const path = new URL(url).pathname;
      if (path === '/' || path === '') return ['src/App.tsx', 'src/App.jsx', 'src/pages/Home.tsx'];
      const name = path.split('/').filter(Boolean).pop() || 'Home';
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      return [`src/pages/${capitalized}.tsx`, `src/pages/${capitalized}.jsx`];
    },
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
    componentPatterns: ['src/components/**/*', 'src/**/*'],
  },
  vue: {
    routes: (url) => {
      const path = new URL(url).pathname;
      if (path === '/' || path === '') return ['src/views/Home.vue', 'src/pages/index.vue'];
      const name = path.split('/').filter(Boolean).pop() || 'Home';
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      return [`src/views/${capitalized}.vue`, `src/pages/${name}.vue`];
    },
    fileExtensions: ['.vue', '.ts', '.js'],
    componentPatterns: ['src/components/**/*', 'src/views/**/*'],
  },
};

// Detect framework from URL or known patterns
export function detectFramework(url: string): keyof typeof FRAMEWORK_PATTERNS | null {
  try {
    const urlObj = new URL(url);
    const port = urlObj.port;

    // Port-based heuristics
    if (port === '4321') return 'astro';
    if (port === '3000') return 'nextjs'; // Could also be React, but Next.js more common
    if (port === '5173' || port === '5174') return 'react'; // Vite default
    if (port === '8080') return 'vue';

    return 'react'; // Default fallback
  } catch {
    return null;
  }
}

// Get possible source file paths for a preview URL
export function getPossibleSourceFiles(previewUrl: string): string[] {
  const framework = detectFramework(previewUrl);
  if (!framework) return [];

  const patterns = FRAMEWORK_PATTERNS[framework];
  return patterns.routes(previewUrl);
}

// Element info from click coordinates
export interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  textContent?: string;
  selector: string;
  computedStyles?: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontFamily: string;
  };
  bounds: { x: number; y: number; width: number; height: number };
  path: string[]; // CSS selector path to element
}

// Build CSS selector for element
function buildSelector(element: Element): string {
  if (element.id) return `#${element.id}`;

  const tag = element.tagName.toLowerCase();
  const classes = Array.from(element.classList).slice(0, 2).join('.');
  const classSelector = classes ? `.${classes}` : '';

  // Try to find unique selector
  if (classSelector) {
    const matches = element.ownerDocument.querySelectorAll(`${tag}${classSelector}`);
    if (matches.length === 1) return `${tag}${classSelector}`;
  }

  // Use nth-child as fallback
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

// Build full path to element
function buildPath(element: Element): string[] {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName !== 'HTML') {
    path.unshift(buildSelector(current));
    current = current.parentElement;
  }

  return path;
}

// Hook for element inspection from iframe (limited by cross-origin)
export function useElementInspector(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  enabled: boolean
) {
  const [hoveredElement, setHoveredElement] = useState<ElementInfo | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);

  const getElementInfo = useCallback((element: Element, rect: DOMRect): ElementInfo => {
    return {
      tagName: element.tagName.toLowerCase(),
      className: element.className || '',
      id: element.id || '',
      textContent: element.textContent?.slice(0, 100) || undefined,
      selector: buildSelector(element),
      bounds: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
      path: buildPath(element),
    };
  }, []);

  // For same-origin iframes, we can actually inspect elements
  useEffect(() => {
    if (!enabled || !iframeRef.current) return;

    const iframe = iframeRef.current;

    const handleLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) return; // Cross-origin blocked

        const handleMouseMove = (e: MouseEvent) => {
          const target = e.target as Element;
          if (target) {
            const rect = target.getBoundingClientRect();
            setHoveredElement(getElementInfo(target, rect));
          }
        };

        const handleClick = (e: MouseEvent) => {
          e.preventDefault();
          const target = e.target as Element;
          if (target) {
            const rect = target.getBoundingClientRect();
            setSelectedElement(getElementInfo(target, rect));
          }
        };

        iframeDoc.addEventListener('mousemove', handleMouseMove);
        iframeDoc.addEventListener('click', handleClick);

        return () => {
          iframeDoc.removeEventListener('mousemove', handleMouseMove);
          iframeDoc.removeEventListener('click', handleClick);
        };
      } catch {
        // Cross-origin - can't access iframe content
        console.log('Cross-origin iframe - element inspection disabled');
      }
    };

    iframe.addEventListener('load', handleLoad);
    // Also try immediately in case already loaded
    handleLoad();

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [enabled, iframeRef, getElementInfo]);

  return { hoveredElement, selectedElement, clearSelection: () => setSelectedElement(null) };
}

// Hook for live reload detection
export function useLiveReload(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  previewUrl: string | null,
  onReloadDetected?: () => void
) {
  const lastUrlRef = useRef<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [lastReloadTime, setLastReloadTime] = useState<Date | null>(null);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (!iframeRef.current || !previewUrl) return;

    setIsReloading(true);
    const src = iframeRef.current.src;
    iframeRef.current.src = 'about:blank';

    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.src = src;
      }
    }, 50);
  }, [iframeRef, previewUrl]);

  // Listen for HMR/live reload signals
  useEffect(() => {
    if (!previewUrl) return;

    // Try to connect to common dev server WebSocket ports
    const wsUrls = [
      previewUrl.replace(/^http/, 'ws') + '/__vite_hmr',
      previewUrl.replace(/^http/, 'ws') + '/_next/webpack-hmr',
      previewUrl.replace(/^http/, 'ws') + '/ws',
    ];

    const sockets: WebSocket[] = [];

    for (const wsUrl of wsUrls) {
      try {
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Vite HMR update
            if (data.type === 'full-reload' || data.type === 'update') {
              setLastReloadTime(new Date());
              onReloadDetected?.();
            }
            // Next.js HMR
            if (data.action === 'building' || data.action === 'built') {
              setLastReloadTime(new Date());
              onReloadDetected?.();
            }
          } catch {
            // Not JSON, ignore
          }
        };

        ws.onopen = () => {
          console.log(`Connected to HMR at ${wsUrl}`);
        };

        sockets.push(ws);
      } catch {
        // Failed to connect, try next
      }
    }

    return () => {
      for (const ws of sockets) {
        ws.close();
      }
    };
  }, [previewUrl, onReloadDetected]);

  // Handle iframe load complete
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsReloading(false);
      if (lastUrlRef.current !== previewUrl) {
        lastUrlRef.current = previewUrl;
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeRef, previewUrl]);

  return { refresh, isReloading, lastReloadTime };
}

// File path context for AI
export interface FilePathContext {
  framework: string | null;
  possibleFiles: string[];
  componentHints: string[];
  routePattern: string;
}

export function getFilePathContext(previewUrl: string): FilePathContext {
  const framework = detectFramework(previewUrl);
  const possibleFiles = getPossibleSourceFiles(previewUrl);

  let componentHints: string[] = [];
  let routePattern = '';

  if (framework && FRAMEWORK_PATTERNS[framework]) {
    componentHints = FRAMEWORK_PATTERNS[framework].componentPatterns;
    routePattern = `${framework} file-based routing`;
  }

  return {
    framework,
    possibleFiles,
    componentHints,
    routePattern,
  };
}

// Enhanced context for AI edit requests
export interface EnhancedEditContext {
  fileContext: FilePathContext;
  elementInfo?: ElementInfo;
  viewport: { width: number; height: number; device: string };
  timestamp: string;
}

export function buildEnhancedContext(
  previewUrl: string,
  elementInfo?: ElementInfo,
  viewport?: { width: number; height: number; device: string }
): EnhancedEditContext {
  return {
    fileContext: getFilePathContext(previewUrl),
    elementInfo,
    viewport: viewport || { width: 0, height: 0, device: 'unknown' },
    timestamp: new Date().toISOString(),
  };
}
