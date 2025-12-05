/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Preview API - Project discovery and source file resolution
 */

import { readFile, readdir, stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Common project directories to search
const PROJECT_DIRS = [
  '/Users/master/Documents',
  '/Users/master/Projects',
  '/Users/master/agent-girl',
];

// Dev server port → framework mapping
const PORT_FRAMEWORK_MAP: Record<number, string> = {
  3000: 'nextjs',
  3001: 'agent-girl',
  4321: 'astro',
  5173: 'vite',
  5174: 'vite',
  8080: 'generic',
  8000: 'python',
};

interface RunningProcess {
  pid: number;
  cwd: string;
  command: string;
}

/**
 * Find project path from port by checking running processes
 */
async function findProjectFromPort(port: number): Promise<string | null> {
  try {
    // Find PID listening on port
    const { stdout: lsofOutput } = await execAsync(`lsof -i :${port} -t 2>/dev/null | head -1`);
    const pid = lsofOutput.trim();

    if (!pid) return null;

    // Get working directory of the process
    const { stdout: cwdOutput } = await execAsync(`lsof -p ${pid} | grep cwd | awk '{print $NF}'`);
    const cwd = cwdOutput.trim();

    if (cwd && await fileExists(join(cwd, 'package.json'))) {
      return cwd;
    }

    // Fallback: check /proc on Linux or pwdx
    try {
      const { stdout: pwdOutput } = await execAsync(`pwdx ${pid} 2>/dev/null`);
      const pwdPath = pwdOutput.split(':')[1]?.trim();
      if (pwdPath && await fileExists(join(pwdPath, 'package.json'))) {
        return pwdPath;
      }
    } catch {
      // pwdx not available on macOS
    }

    return cwd || null;
  } catch {
    return null;
  }
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect framework from package.json
 */
async function detectFrameworkFromPackage(projectPath: string): Promise<string> {
  try {
    const pkgPath = join(projectPath, 'package.json');
    const content = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['astro']) return 'astro';
    if (deps['next']) return 'nextjs';
    if (deps['@sveltejs/kit'] || deps['svelte']) return 'svelte';
    if (deps['vue'] || deps['nuxt']) return 'vue';
    if (deps['react']) return 'react';
    if (deps['vite']) return 'vite';

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Scan for projects with dev servers running
 */
async function scanRunningProjects(): Promise<Array<{
  port: number;
  path: string | null;
  framework: string;
  name: string;
}>> {
  const commonPorts = [3000, 3001, 4321, 5173, 5174, 8080, 8000];
  const results = [];

  for (const port of commonPorts) {
    try {
      // Check if port is in use
      const { stdout } = await execAsync(`lsof -i :${port} -t 2>/dev/null | head -1`);
      if (!stdout.trim()) continue;

      const projectPath = await findProjectFromPort(port);
      const framework = projectPath
        ? await detectFrameworkFromPackage(projectPath)
        : PORT_FRAMEWORK_MAP[port] || 'unknown';

      results.push({
        port,
        path: projectPath,
        framework,
        name: projectPath ? dirname(projectPath).split('/').pop() || `Port ${port}` : `Port ${port}`,
      });
    } catch {
      // Port not in use or error checking
    }
  }

  return results;
}

/**
 * Find source files that might match a URL path
 */
function getPossibleSourceFiles(urlPath: string, framework: string): string[] {
  // Clean path
  const cleanPath = urlPath.replace(/^\//, '').replace(/\/$/, '') || 'index';
  const files: string[] = [];

  // Framework-specific paths
  switch (framework) {
    case 'astro':
      files.push(
        `src/pages/${cleanPath}.astro`,
        `src/pages/${cleanPath}/index.astro`,
        `src/pages/${cleanPath}.md`,
        `src/pages/${cleanPath}.mdx`,
      );
      break;
    case 'nextjs':
      files.push(
        `app/${cleanPath}/page.tsx`,
        `app/${cleanPath}/page.jsx`,
        `pages/${cleanPath}.tsx`,
        `pages/${cleanPath}.jsx`,
        `pages/${cleanPath}/index.tsx`,
      );
      break;
    case 'react':
    case 'vite':
      files.push(
        `src/pages/${cleanPath}.tsx`,
        `src/pages/${cleanPath}.jsx`,
        `src/routes/${cleanPath}.tsx`,
        `src/${cleanPath}.tsx`,
      );
      break;
    case 'vue':
      files.push(
        `src/pages/${cleanPath}.vue`,
        `pages/${cleanPath}.vue`,
        `src/views/${cleanPath}.vue`,
      );
      break;
    case 'svelte':
      files.push(
        `src/routes/${cleanPath}/+page.svelte`,
        `src/routes/${cleanPath}.svelte`,
      );
      break;
    default:
      files.push(
        `src/pages/${cleanPath}.tsx`,
        `src/pages/${cleanPath}.jsx`,
        `pages/${cleanPath}.tsx`,
      );
  }

  return files;
}

/**
 * Verify which source files actually exist
 */
async function resolveSourceFiles(
  projectPath: string,
  possibleFiles: string[]
): Promise<string[]> {
  const existing: string[] = [];

  for (const file of possibleFiles) {
    const fullPath = join(projectPath, file);
    if (await fileExists(fullPath)) {
      existing.push(fullPath);
    }
  }

  return existing;
}

/**
 * Handle preview routes
 */
export async function handlePreviewRoutes(req: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

  // GET /api/preview/project-path - Find project from port
  if (path === '/api/preview/project-path' && req.method === 'GET') {
    const port = parseInt(url.searchParams.get('port') || '0');

    if (!port) {
      return jsonResponse({ error: 'Port required' }, 400);
    }

    const projectPath = await findProjectFromPort(port);
    const framework = projectPath
      ? await detectFrameworkFromPackage(projectPath)
      : PORT_FRAMEWORK_MAP[port] || 'unknown';

    return jsonResponse({
      success: true,
      port,
      path: projectPath,
      framework,
    });
  }

  // GET /api/preview/running-projects - List all running dev servers
  if (path === '/api/preview/running-projects' && req.method === 'GET') {
    const projects = await scanRunningProjects();

    return jsonResponse({
      success: true,
      projects,
    });
  }

  // POST /api/preview/resolve-source - Find source file for URL
  if (path === '/api/preview/resolve-source' && req.method === 'POST') {
    try {
      const body = await req.json();
      const { projectPath, urlPath, framework } = body;

      if (!projectPath || !urlPath) {
        return jsonResponse({ error: 'projectPath and urlPath required' }, 400);
      }

      const fw = framework || await detectFrameworkFromPackage(projectPath);
      const possibleFiles = getPossibleSourceFiles(urlPath, fw);
      const existingFiles = await resolveSourceFiles(projectPath, possibleFiles);

      return jsonResponse({
        success: true,
        framework: fw,
        possibleFiles,
        existingFiles,
        resolvedFile: existingFiles[0] || null,
      });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // POST /api/preview/hmr-trigger - Force HMR reload
  if (path === '/api/preview/hmr-trigger' && req.method === 'POST') {
    try {
      const body = await req.json();
      const { filePath } = body;

      if (!filePath) {
        return jsonResponse({ error: 'filePath required' }, 400);
      }

      // Touch the file to trigger HMR
      const now = new Date();
      await execAsync(`touch "${filePath}"`);

      return jsonResponse({
        success: true,
        message: 'HMR triggered',
        filePath,
        timestamp: now.toISOString(),
      });
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  return null;
}
