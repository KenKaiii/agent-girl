/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * File operations API - Direct file editing, search, replace
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import {
  detectFramework,
  searchFiles,
  searchReplace,
  parseFile,
  applyStyleChange,
  generateComponent,
  type Framework,
  type SearchResult,
} from '../utils/fileSync';

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Security: Allowed directories
const ALLOWED_DIRS = [
  '/Users/master/Documents',
  '/Users/master/Projects',
  '/Users/master/agent-girl',
];

function isAllowedPath(path: string): boolean {
  return ALLOWED_DIRS.some(dir => path.startsWith(dir));
}

// File tree node
interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: TreeNode[];
}

/**
 * Handle file routes
 */
export async function handleFilesRoutes(req: Request, url: URL): Promise<Response | null> {
  // Only handle /api/files routes
  if (!url.pathname.startsWith('/api/files')) {
    return null;
  }

  const method = req.method;
  const path = url.pathname.replace('/api/files', '');

  // GET /api/files/framework - Detect framework in project
  if (method === 'GET' && path === '/framework') {
    const projectPath = url.searchParams.get('path');

    if (!projectPath || !isAllowedPath(projectPath)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      const info = await detectFramework(projectPath);
      return jsonResponse({ success: true, framework: info });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // GET /api/files/read - Read file content
  if (method === 'GET' && path === '/read') {
    const filePath = url.searchParams.get('path');

    if (!filePath || !isAllowedPath(filePath)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const info = await parseFile(filePath);

      return jsonResponse({
        success: true,
        content,
        info,
      });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // GET /api/files/tree - Get file tree
  if (method === 'GET' && path === '/tree') {
    const rootPath = url.searchParams.get('path');
    const maxDepth = parseInt(url.searchParams.get('depth') || '3');

    if (!rootPath || !isAllowedPath(rootPath)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    async function buildTree(dirPath: string, depth: number): Promise<TreeNode[]> {
      if (depth <= 0) return [];

      const entries = await readdir(dirPath, { withFileTypes: true });
      const nodes: TreeNode[] = [];

      const excludeDirs = ['node_modules', '.git', 'dist', '.astro', '.next', '.cache'];

      for (const entry of entries) {
        if (excludeDirs.includes(entry.name)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;

        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'directory',
            children: await buildTree(fullPath, depth - 1),
          });
        } else {
          const ext = extname(entry.name);
          if (['.astro', '.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte', '.css', '.scss', '.json', '.md'].includes(ext)) {
            nodes.push({
              name: entry.name,
              path: fullPath,
              type: 'file',
              extension: ext,
            });
          }
        }
      }

      return nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    try {
      const tree = await buildTree(rootPath, maxDepth);
      return jsonResponse({ success: true, tree });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // POST /api/files/write - Write file content
  if (method === 'POST' && path === '/write') {
    const body = await req.json() as { path: string; content: string };

    if (!body.path || !isAllowedPath(body.path)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      await writeFile(body.path, body.content, 'utf-8');
      return jsonResponse({ success: true });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // POST /api/files/search - Search across files
  if (method === 'POST' && path === '/search') {
    const body = await req.json() as {
      rootPath: string;
      query: string;
      options?: {
        caseSensitive?: boolean;
        wholeWord?: boolean;
        regex?: boolean;
        extensions?: string[];
        maxResults?: number;
      };
    };

    if (!body.rootPath || !isAllowedPath(body.rootPath)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      const results = await searchFiles(body.rootPath, body.query, {
        extensions: body.options?.extensions || ['.astro', '.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte'],
        maxResults: body.options?.maxResults || 100,
      });

      return jsonResponse({
        success: true,
        results,
        total: results.length,
      });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // POST /api/files/replace - Search and replace in file
  if (method === 'POST' && path === '/replace') {
    const body = await req.json() as {
      path: string;
      search: string;
      replace: string;
      options?: {
        global?: boolean;
        caseSensitive?: boolean;
        wholeWord?: boolean;
        regex?: boolean;
        dryRun?: boolean;
      };
    };

    if (!body.path || !isAllowedPath(body.path)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      const result = await searchReplace(body.path, body.search, body.replace, body.options);
      return jsonResponse({
        success: result.success,
        changes: result.changes,
        preview: result.preview,
      });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // POST /api/files/style - Apply style changes to component
  if (method === 'POST' && path === '/style') {
    const body = await req.json() as {
      path: string;
      selector: string;
      styles: Record<string, string>;
      framework: Framework;
    };

    if (!body.path || !isAllowedPath(body.path)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      const success = await applyStyleChange(body.path, body.selector, body.styles, body.framework);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // POST /api/files/generate - Generate component code
  if (method === 'POST' && path === '/generate') {
    const body = await req.json() as {
      name: string;
      framework: Framework;
      outputPath: string;
      options?: {
        props?: Record<string, string>;
        children?: boolean;
        styles?: string[];
        typescript?: boolean;
      };
    };

    if (!body.outputPath || !isAllowedPath(body.outputPath)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      const code = generateComponent(body.name, body.framework, body.options);
      await writeFile(body.outputPath, code, 'utf-8');

      return jsonResponse({
        success: true,
        code,
        path: body.outputPath,
      });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // POST /api/files/batch-replace - Replace across multiple files
  if (method === 'POST' && path === '/batch-replace') {
    const body = await req.json() as {
      rootPath: string;
      search: string;
      replace: string;
      extensions?: string[];
      dryRun?: boolean;
    };

    if (!body.rootPath || !isAllowedPath(body.rootPath)) {
      return jsonResponse({ error: 'Invalid or unauthorized path' }, 400);
    }

    try {
      const searchResults = await searchFiles(body.rootPath, body.search, {
        extensions: body.extensions || ['.astro', '.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte'],
      });

      const fileMatches = new Map<string, SearchResult[]>();
      for (const result of searchResults) {
        if (!fileMatches.has(result.file)) {
          fileMatches.set(result.file, []);
        }
        fileMatches.get(result.file)!.push(result);
      }

      const results: { file: string; changes: number }[] = [];

      for (const [file] of fileMatches) {
        const result = await searchReplace(file, body.search, body.replace, {
          global: true,
          dryRun: body.dryRun,
        });
        results.push({ file, changes: result.changes });
      }

      return jsonResponse({
        success: true,
        totalFiles: results.length,
        totalChanges: results.reduce((sum, r) => sum + r.changes, 0),
        results,
      });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // Not a files route
  return null;
}
