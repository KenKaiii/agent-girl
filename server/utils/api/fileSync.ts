/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * FileSync - Direct file editing for Astro, React, Next.js, Vue
 * Features: Live sync, Search & Replace, Framework detection, AST parsing
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';

// Supported frameworks
export type Framework = 'astro' | 'nextjs' | 'react' | 'vue' | 'svelte' | 'unknown';

// File type mapping
export type FileType = 'component' | 'page' | 'layout' | 'style' | 'config' | 'api' | 'unknown';

// Framework detection result
export interface FrameworkInfo {
  framework: Framework;
  version?: string;
  typescript: boolean;
  styling: 'tailwind' | 'css' | 'scss' | 'styled-components' | 'emotion' | 'unknown';
  router: 'file-based' | 'app-router' | 'pages-router' | 'custom' | 'unknown';
}

// File info
export interface FileInfo {
  path: string;
  type: FileType;
  framework: Framework;
  exports: string[];
  imports: string[];
  components: string[];
}

// Edit operation
export interface EditOperation {
  type: 'replace' | 'insert' | 'delete' | 'wrap' | 'style';
  selector?: string;
  search?: string;
  replace?: string;
  position?: 'before' | 'after' | 'inside-start' | 'inside-end';
  content?: string;
  line?: number;
  column?: number;
}

// Search result
export interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
  preview: string;
}

/**
 * Detect framework from project root
 */
export async function detectFramework(projectPath: string): Promise<FrameworkInfo> {
  const info: FrameworkInfo = {
    framework: 'unknown',
    typescript: false,
    styling: 'unknown',
    router: 'unknown',
  };

  try {
    // Check package.json
    const pkgPath = join(projectPath, 'package.json');
    const pkgContent = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Detect framework
    if (deps['astro']) {
      info.framework = 'astro';
      info.version = deps['astro'];
      info.router = 'file-based';
    } else if (deps['next']) {
      info.framework = 'nextjs';
      info.version = deps['next'];
      // Check for app router
      try {
        await stat(join(projectPath, 'app'));
        info.router = 'app-router';
      } catch {
        info.router = 'pages-router';
      }
    } else if (deps['react']) {
      info.framework = 'react';
      info.version = deps['react'];
      info.router = 'custom';
    } else if (deps['vue']) {
      info.framework = 'vue';
      info.version = deps['vue'];
      info.router = deps['vue-router'] ? 'file-based' : 'custom';
    } else if (deps['svelte']) {
      info.framework = 'svelte';
      info.version = deps['svelte'];
      info.router = deps['@sveltejs/kit'] ? 'file-based' : 'custom';
    }

    // Detect TypeScript
    info.typescript = !!(deps['typescript'] || await fileExists(join(projectPath, 'tsconfig.json')));

    // Detect styling
    if (deps['tailwindcss']) {
      info.styling = 'tailwind';
    } else if (deps['styled-components']) {
      info.styling = 'styled-components';
    } else if (deps['@emotion/react']) {
      info.styling = 'emotion';
    } else if (deps['sass'] || deps['node-sass']) {
      info.styling = 'scss';
    } else {
      info.styling = 'css';
    }
  } catch {
    // Default values already set
  }

  return info;
}

/**
 * Get file type based on path and content
 */
export function getFileType(filePath: string, framework: Framework): FileType {
  const ext = extname(filePath);
  const name = basename(filePath, ext);
  const dir = dirname(filePath);

  // Pages
  if (dir.includes('/pages') || dir.includes('/app') || dir.includes('/routes')) {
    if (name === 'layout' || name === '_layout') return 'layout';
    if (name === 'api' || dir.includes('/api')) return 'api';
    return 'page';
  }

  // Components
  if (dir.includes('/components') || dir.includes('/ui')) {
    return 'component';
  }

  // Layouts
  if (dir.includes('/layouts') || name.includes('layout') || name.includes('Layout')) {
    return 'layout';
  }

  // Styles
  if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
    return 'style';
  }

  // Config
  if (name.match(/^(astro|next|vite|tailwind|postcss)\.config/)) {
    return 'config';
  }

  return 'unknown';
}

/**
 * Parse file and extract structure
 */
export async function parseFile(filePath: string): Promise<FileInfo> {
  const content = await readFile(filePath, 'utf-8');
  const ext = extname(filePath);

  const info: FileInfo = {
    path: filePath,
    type: 'unknown',
    framework: 'unknown',
    exports: [],
    imports: [],
    components: [],
  };

  // Extract imports
  const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    info.imports.push(match[3]);
  }

  // Extract exports
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|let|var)\s+(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    info.exports.push(match[1]);
  }

  // Extract JSX components (PascalCase tags)
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)\s/g;
  while ((match = componentRegex.exec(content)) !== null) {
    if (!info.components.includes(match[1])) {
      info.components.push(match[1]);
    }
  }

  // Detect framework from file extension and content
  if (ext === '.astro') {
    info.framework = 'astro';
  } else if (content.includes('use client') || content.includes('use server')) {
    info.framework = 'nextjs';
  } else if (content.includes('<template>') && content.includes('<script')) {
    info.framework = 'vue';
  } else if (content.includes('svelte')) {
    info.framework = 'svelte';
  } else if (content.includes('React') || content.includes('jsx')) {
    info.framework = 'react';
  }

  return info;
}

/**
 * Search and replace in file
 */
export async function searchReplace(
  filePath: string,
  search: string | RegExp,
  replace: string,
  options: {
    global?: boolean;
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<{ success: boolean; changes: number; preview?: string }> {
  const content = await readFile(filePath, 'utf-8');

  let pattern: RegExp;
  if (options.regex) {
    pattern = typeof search === 'string'
      ? new RegExp(search, options.global ? 'g' : '')
      : search;
  } else {
    const searchStr = typeof search === 'string' ? search : search.source;
    const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = (options.global ? 'g' : '') + (options.caseSensitive ? '' : 'i');
    pattern = new RegExp(options.wholeWord ? `\\b${escaped}\\b` : escaped, flags);
  }

  const matches = content.match(pattern);
  const changes = matches?.length || 0;

  if (changes === 0) {
    return { success: false, changes: 0 };
  }

  const newContent = content.replace(pattern, replace);

  if (!options.dryRun) {
    await writeFile(filePath, newContent, 'utf-8');
  }

  return {
    success: true,
    changes,
    preview: options.dryRun ? newContent : undefined,
  };
}

/**
 * Search across multiple files
 */
export async function searchFiles(
  rootPath: string,
  search: string | RegExp,
  options: {
    extensions?: string[];
    excludeDirs?: string[];
    maxResults?: number;
    contextLines?: number;
  } = {}
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const extensions = options.extensions || ['.astro', '.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte'];
  const excludeDirs = options.excludeDirs || ['node_modules', '.git', 'dist', '.astro', '.next'];
  const maxResults = options.maxResults || 100;
  const contextLines = options.contextLines || 2;

  const pattern = typeof search === 'string'
    ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    : search;

  async function searchDir(dirPath: string): Promise<void> {
    if (results.length >= maxResults) return;

    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= maxResults) return;

      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          await searchDir(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (extensions.includes(ext)) {
          const content = await readFile(fullPath, 'utf-8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            if (results.length >= maxResults) return;

            let match;
            while ((match = pattern.exec(line)) !== null) {
              // Get context lines
              const startLine = Math.max(0, index - contextLines);
              const endLine = Math.min(lines.length - 1, index + contextLines);
              const contextArr = lines.slice(startLine, endLine + 1);

              results.push({
                file: fullPath,
                line: index + 1,
                column: match.index + 1,
                match: match[0],
                context: contextArr.join('\n'),
                preview: line.trim(),
              });
            }
          });
        }
      }
    }
  }

  await searchDir(rootPath);
  return results;
}

/**
 * Apply style changes to component
 */
export async function applyStyleChange(
  filePath: string,
  selector: string,
  styles: Record<string, string>,
  framework: Framework
): Promise<boolean> {
  const content = await readFile(filePath, 'utf-8');
  let newContent = content;

  // Convert styles to appropriate format
  if (framework === 'astro') {
    // Astro: Look for class or style attribute
    newContent = applyAstroStyles(content, selector, styles);
  } else if (framework === 'nextjs' || framework === 'react') {
    // React/Next: Look for className or style prop
    newContent = applyReactStyles(content, selector, styles);
  } else if (framework === 'vue') {
    // Vue: Look for :style or :class bindings
    newContent = applyVueStyles(content, selector, styles);
  }

  if (newContent !== content) {
    await writeFile(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

/**
 * Apply styles in Astro file
 */
function applyAstroStyles(content: string, selector: string, styles: Record<string, string>): string {
  // Convert to Tailwind classes if possible
  const tailwindClasses = stylesToTailwind(styles);

  if (tailwindClasses.length > 0) {
    // Try to find element and add classes
    const classRegex = new RegExp(`(class=["'][^"']*)["']`, 'g');
    const elementRegex = new RegExp(`(<${selector}[^>]*)(>)`, 'gi');

    // If element has class attribute, append
    if (content.match(new RegExp(`<${selector}[^>]*class=`))) {
      return content.replace(classRegex, `$1 ${tailwindClasses.join(' ')}"'`);
    }

    // Otherwise add class attribute
    return content.replace(elementRegex, `$1 class="${tailwindClasses.join(' ')}"$2`);
  }

  // Fallback: Add inline style
  const styleString = Object.entries(styles)
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
    .join('; ');

  const elementRegex = new RegExp(`(<${selector}[^>]*)(>)`, 'gi');
  return content.replace(elementRegex, `$1 style="${styleString}"$2`);
}

/**
 * Apply styles in React/Next.js file
 */
function applyReactStyles(content: string, selector: string, styles: Record<string, string>): string {
  // Try Tailwind first
  const tailwindClasses = stylesToTailwind(styles);

  if (tailwindClasses.length > 0) {
    const classNameRegex = new RegExp(`(className=["'][^"']*)["']`, 'g');
    return content.replace(classNameRegex, `$1 ${tailwindClasses.join(' ')}"'`);
  }

  // Add to style prop
  const styleObj = JSON.stringify(styles);
  const elementRegex = new RegExp(`(<${selector}[^>]*)(>)`, 'gi');
  return content.replace(elementRegex, `$1 style={${styleObj}}$2`);
}

/**
 * Apply styles in Vue file
 */
function applyVueStyles(content: string, selector: string, styles: Record<string, string>): string {
  const tailwindClasses = stylesToTailwind(styles);

  if (tailwindClasses.length > 0) {
    const classRegex = /class="([^"]*)"/g;
    return content.replace(classRegex, `class="$1 ${tailwindClasses.join(' ')}"`);
  }

  const styleObj = JSON.stringify(styles);
  const elementRegex = new RegExp(`(<${selector}[^>]*)(>)`, 'gi');
  return content.replace(elementRegex, `$1 :style="${styleObj}"$2`);
}

/**
 * Convert CSS styles to Tailwind classes
 */
function stylesToTailwind(styles: Record<string, string>): string[] {
  const classes: string[] = [];

  const mappings: Record<string, (v: string) => string | null> = {
    display: (v) => v === 'flex' ? 'flex' : v === 'grid' ? 'grid' : v === 'none' ? 'hidden' : null,
    flexDirection: (v) => v === 'column' ? 'flex-col' : v === 'row' ? 'flex-row' : null,
    alignItems: (v) => v === 'center' ? 'items-center' : v === 'start' ? 'items-start' : v === 'end' ? 'items-end' : null,
    justifyContent: (v) => v === 'center' ? 'justify-center' : v === 'between' ? 'justify-between' : v === 'around' ? 'justify-around' : null,
    textAlign: (v) => v === 'center' ? 'text-center' : v === 'left' ? 'text-left' : v === 'right' ? 'text-right' : null,
    fontWeight: (v) => v === '700' || v === 'bold' ? 'font-bold' : v === '600' ? 'font-semibold' : v === '500' ? 'font-medium' : null,
    fontStyle: (v) => v === 'italic' ? 'italic' : null,
    textDecoration: (v) => v === 'underline' ? 'underline' : v === 'line-through' ? 'line-through' : null,
    borderRadius: (v) => v === '0' ? 'rounded-none' : v.includes('9999') || v === '50%' ? 'rounded-full' : 'rounded-lg',
  };

  for (const [prop, value] of Object.entries(styles)) {
    const mapping = mappings[prop];
    if (mapping) {
      const className = mapping(value);
      if (className) classes.push(className);
    }
  }

  return classes;
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate component code for framework
 */
export function generateComponent(
  name: string,
  framework: Framework,
  options: {
    props?: Record<string, string>;
    children?: boolean;
    styles?: string[];
    typescript?: boolean;
  } = {}
): string {
  const { props = {}, children = true, styles = [], typescript = true } = options;
  const propsType = Object.entries(props)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');

  switch (framework) {
    case 'astro':
      return `---
${typescript ? `interface Props {
  ${propsType}
}

const { ${Object.keys(props).join(', ')} } = Astro.props;` : ''}
---

<div class="${styles.join(' ')}">
  ${children ? '<slot />' : ''}
</div>

<style>
  /* Component styles */
</style>`;

    case 'nextjs':
    case 'react':
      return `${typescript ? `interface ${name}Props {
  ${propsType}
  ${children ? 'children?: React.ReactNode;' : ''}
}

export function ${name}({ ${Object.keys(props).join(', ')}${children ? ', children' : ''} }: ${name}Props) {` : `export function ${name}({ ${Object.keys(props).join(', ')}${children ? ', children' : ''} }) {`}
  return (
    <div className="${styles.join(' ')}">
      ${children ? '{children}' : ''}
    </div>
  );
}`;

    case 'vue':
      return `<script setup${typescript ? ' lang="ts"' : ''}>
${typescript ? `interface Props {
  ${propsType}
}

defineProps<Props>();` : `defineProps(['${Object.keys(props).join("', '")}'])`}
</script>

<template>
  <div class="${styles.join(' ')}">
    ${children ? '<slot />' : ''}
  </div>
</template>

<style scoped>
/* Component styles */
</style>`;

    case 'svelte':
      return `<script${typescript ? ' lang="ts"' : ''}>
  ${Object.entries(props).map(([k, v]) => `export let ${k}${typescript ? `: ${v}` : ''};`).join('\n  ')}
</script>

<div class="${styles.join(' ')}">
  ${children ? '<slot />' : ''}
</div>

<style>
  /* Component styles */
</style>`;

    default:
      return '';
  }
}

/**
 * Live sync manager - tracks file changes and syncs with preview
 */
export class LiveSyncManager {
  private watchers = new Map<string, NodeJS.Timeout>();
  private callbacks = new Map<string, (content: string) => void>();

  watch(filePath: string, callback: (content: string) => void): void {
    this.callbacks.set(filePath, callback);
  }

  unwatch(filePath: string): void {
    const watcher = this.watchers.get(filePath);
    if (watcher) {
      clearInterval(watcher);
      this.watchers.delete(filePath);
    }
    this.callbacks.delete(filePath);
  }

  async syncToFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, 'utf-8');
    const callback = this.callbacks.get(filePath);
    if (callback) {
      callback(content);
    }
  }

  destroy(): void {
    for (const watcher of this.watchers.values()) {
      clearInterval(watcher);
    }
    this.watchers.clear();
    this.callbacks.clear();
  }
}
