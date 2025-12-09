/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Content API - Inline content editing and persistence
 * Enables Framer-style direct editing of generated websites
 */

import { readFile, writeFile, access, mkdir, copyFile } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';

const execAsync = promisify(exec);

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Check if file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// TEXT CONTENT EDITING
// ============================================================================

interface TextEditRequest {
  projectPath: string;
  file: string;
  selector: string;
  oldText: string;
  newText: string;
  context?: {
    tagName?: string;
    className?: string;
    path?: string[];
  };
}

interface TextEditResult {
  success: boolean;
  file: string;
  lineNumber?: number;
  message: string;
  backup?: string;
}

/**
 * Find and replace text content in source file
 * Uses text matching + context for reliable updates
 */
async function editTextInFile(
  filePath: string,
  oldText: string,
  newText: string,
  context?: TextEditRequest['context']
): Promise<{ success: boolean; lineNumber?: number; error?: string }> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();

    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await writeFile(backupPath, content);

    // Find the text to replace
    const escapedOldText = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build context-aware patterns based on file type
    let pattern: RegExp;
    let replacement: string;

    if (ext === '.astro' || ext === '.tsx' || ext === '.jsx') {
      // For Astro/React: look for text in JSX context
      // Match text in: >{text}<  or  "{text}"  or  `{text}`
      const patterns = [
        // Text content between tags: >oldText<
        new RegExp(`(>\\s*)${escapedOldText}(\\s*<)`, 'g'),
        // String literals: "oldText" or 'oldText'
        new RegExp(`(["'])${escapedOldText}\\1`, 'g'),
        // Template literals: `...oldText...`
        new RegExp(`(\`)([^\`]*?)${escapedOldText}([^\`]*?)(\`)`, 'g'),
        // Props: title="oldText" or text="oldText"
        new RegExp(`((?:title|text|label|heading|description|content|alt|placeholder)=["'])${escapedOldText}(["'])`, 'gi'),
      ];

      let newContent = content;
      let matched = false;

      for (const p of patterns) {
        if (p.test(newContent)) {
          newContent = newContent.replace(p, (match, ...groups) => {
            matched = true;
            // Replace only the old text part, keep surrounding syntax
            return match.replace(oldText, newText);
          });
          if (matched) break;
        }
      }

      if (!matched) {
        // Fallback: simple text replacement
        if (content.includes(oldText)) {
          newContent = content.replace(oldText, newText);
          matched = true;
        }
      }

      if (!matched) {
        return { success: false, error: 'Text not found in file' };
      }

      // Find line number of change
      const lines = content.split('\n');
      let lineNumber = 1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(oldText)) {
          lineNumber = i + 1;
          break;
        }
      }

      await writeFile(filePath, newContent, 'utf-8');
      return { success: true, lineNumber };

    } else if (ext === '.md' || ext === '.mdx') {
      // Markdown: direct text replacement
      if (!content.includes(oldText)) {
        return { success: false, error: 'Text not found in file' };
      }

      const newContent = content.replace(oldText, newText);
      const lineNumber = content.split('\n').findIndex(line => line.includes(oldText)) + 1;

      await writeFile(filePath, newContent, 'utf-8');
      return { success: true, lineNumber };

    } else if (ext === '.html') {
      // HTML: similar to JSX
      if (!content.includes(oldText)) {
        return { success: false, error: 'Text not found in file' };
      }

      const newContent = content.replace(oldText, newText);
      const lineNumber = content.split('\n').findIndex(line => line.includes(oldText)) + 1;

      await writeFile(filePath, newContent, 'utf-8');
      return { success: true, lineNumber };

    } else if (ext === '.json') {
      // JSON: value replacement in strings
      try {
        const json = JSON.parse(content);
        const jsonStr = JSON.stringify(json);

        if (!jsonStr.includes(oldText)) {
          return { success: false, error: 'Text not found in JSON' };
        }

        // Replace in stringified version then re-parse to validate
        const newJsonStr = jsonStr.replace(oldText, newText);
        const newJson = JSON.parse(newJsonStr);

        await writeFile(filePath, JSON.stringify(newJson, null, 2), 'utf-8');
        return { success: true };
      } catch {
        return { success: false, error: 'Invalid JSON or text not found' };
      }
    }

    // Default: simple text replacement
    if (!content.includes(oldText)) {
      return { success: false, error: 'Text not found in file' };
    }

    const newContent = content.replace(oldText, newText);
    await writeFile(filePath, newContent, 'utf-8');
    return { success: true };

  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Find which source file contains the given text
 */
async function findFileWithText(
  projectPath: string,
  text: string,
  context?: TextEditRequest['context']
): Promise<string | null> {
  // Common source directories to search
  const searchDirs = [
    'src/pages',
    'src/components',
    'src/layouts',
    'src/sections',
    'app',
    'pages',
    'components',
  ];

  // File extensions to check
  const extensions = ['.astro', '.tsx', '.jsx', '.vue', '.svelte', '.html', '.md', '.mdx'];

  for (const dir of searchDirs) {
    const dirPath = join(projectPath, dir);
    if (!await fileExists(dirPath)) continue;

    try {
      // Use grep for fast text search
      const { stdout } = await execAsync(
        `grep -rl "${text.replace(/"/g, '\\"').substring(0, 100)}" "${dirPath}" --include="*.astro" --include="*.tsx" --include="*.jsx" --include="*.html" --include="*.md" 2>/dev/null | head -5`
      );

      const files = stdout.trim().split('\n').filter(Boolean);
      if (files.length > 0) {
        return files[0];
      }
    } catch {
      // grep found nothing or errored
    }
  }

  return null;
}

// ============================================================================
// IMAGE HANDLING
// ============================================================================

interface ImageUploadRequest {
  projectPath: string;
  targetPath: string;           // e.g., "public/images/hero.jpg"
  image: string;                // Base64 encoded image or URL
  optimize?: {
    format?: 'avif' | 'webp' | 'jpg' | 'png';
    maxWidth?: number;
    quality?: number;
  };
}

interface ImageGenerateRequest {
  projectPath: string;
  prompt: string;
  style?: 'photo' | 'illustration' | 'icon' | 'abstract';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16' | '3:2';
  targetPath?: string;
}

/**
 * Upload and optionally optimize an image
 */
async function uploadImage(req: ImageUploadRequest): Promise<{
  success: boolean;
  path?: string;
  optimized?: boolean;
  error?: string;
}> {
  try {
    const fullPath = join(req.projectPath, req.targetPath);
    const dir = dirname(fullPath);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Handle base64 image
    if (req.image.startsWith('data:')) {
      const base64Data = req.image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // TODO: Add Sharp optimization if requested
      await writeFile(fullPath, buffer);

      return { success: true, path: req.targetPath, optimized: false };
    }

    // Handle URL (download)
    if (req.image.startsWith('http')) {
      const response = await fetch(req.image);
      const buffer = Buffer.from(await response.arrayBuffer());

      await writeFile(fullPath, buffer);
      return { success: true, path: req.targetPath, optimized: false };
    }

    // Handle local file path (copy)
    if (await fileExists(req.image)) {
      await copyFile(req.image, fullPath);
      return { success: true, path: req.targetPath, optimized: false };
    }

    return { success: false, error: 'Invalid image source' };

  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Replace image reference in source file
 */
async function replaceImageInFile(
  filePath: string,
  oldSrc: string,
  newSrc: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Find image references
    const escapedOldSrc = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      // src="..." or src='...'
      new RegExp(`(src=["'])${escapedOldSrc}(["'])`, 'g'),
      // background: url(...)
      new RegExp(`(url\\(["']?)${escapedOldSrc}(["']?\\))`, 'g'),
      // Image component: src={...}
      new RegExp(`(src=\\{["'\`])${escapedOldSrc}(["'\`]\\})`, 'g'),
    ];

    let newContent = content;
    let matched = false;

    for (const p of patterns) {
      if (p.test(newContent)) {
        newContent = newContent.replace(p, `$1${newSrc}$2`);
        matched = true;
      }
    }

    if (!matched) {
      return { success: false, error: 'Image reference not found in file' };
    }

    await writeFile(filePath, newContent, 'utf-8');
    return { success: true };

  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============================================================================
// AI CONTENT GENERATION
// ============================================================================

interface AIGenerateRequest {
  context: {
    currentText: string;
    surroundingText?: string;
    pageType?: string;
    siteDescription?: string;
    targetLanguage?: string;
  };
  action: 'rewrite' | 'expand' | 'shorten' | 'translate' | 'improve' | 'custom';
  customPrompt?: string;
  targetLanguage?: string;
}

// Note: AI generation is handled via the existing chat/agent system
// This endpoint prepares the context for AI processing

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function handleContentRoutes(req: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

  // -------------------------------------------------------------------------
  // POST /api/content/save - Save text content changes
  // -------------------------------------------------------------------------
  if (path === '/api/content/save' && req.method === 'POST') {
    try {
      const body = await req.json() as TextEditRequest;
      const { projectPath, file, selector, oldText, newText, context } = body;

      if (!projectPath || !oldText || !newText) {
        return jsonResponse({ error: 'projectPath, oldText and newText required' }, 400);
      }

      // If specific file provided, edit it directly
      if (file) {
        const filePath = file.startsWith('/') ? file : join(projectPath, file);

        if (!await fileExists(filePath)) {
          return jsonResponse({ error: `File not found: ${file}` }, 404);
        }

        const result = await editTextInFile(filePath, oldText, newText, context);

        if (result.success) {
          // Trigger HMR
          await execAsync(`touch "${filePath}"`);

          return jsonResponse({
            success: true,
            file: filePath,
            lineNumber: result.lineNumber,
            message: 'Content updated successfully',
          });
        } else {
          return jsonResponse({
            success: false,
            error: result.error || 'Failed to update content',
          }, 400);
        }
      }

      // Auto-find file containing the text
      const foundFile = await findFileWithText(projectPath, oldText, context);

      if (!foundFile) {
        return jsonResponse({
          success: false,
          error: 'Could not find text in any source file',
        }, 404);
      }

      const result = await editTextInFile(foundFile, oldText, newText, context);

      if (result.success) {
        // Trigger HMR
        await execAsync(`touch "${foundFile}"`);

        return jsonResponse({
          success: true,
          file: foundFile,
          lineNumber: result.lineNumber,
          message: 'Content updated successfully',
        });
      } else {
        return jsonResponse({
          success: false,
          file: foundFile,
          error: result.error || 'Failed to update content',
        }, 400);
      }

    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // -------------------------------------------------------------------------
  // POST /api/content/image - Upload or replace image
  // -------------------------------------------------------------------------
  if (path === '/api/content/image' && req.method === 'POST') {
    try {
      const body = await req.json() as ImageUploadRequest & {
        sourceFile?: string;
        oldSrc?: string;
      };

      const { projectPath, targetPath, image, optimize, sourceFile, oldSrc } = body;

      if (!projectPath || !targetPath || !image) {
        return jsonResponse({ error: 'projectPath, targetPath and image required' }, 400);
      }

      // Upload the new image
      const uploadResult = await uploadImage({ projectPath, targetPath, image, optimize });

      if (!uploadResult.success) {
        return jsonResponse({ error: uploadResult.error }, 500);
      }

      // If source file and old src provided, update the reference
      if (sourceFile && oldSrc) {
        const filePath = sourceFile.startsWith('/') ? sourceFile : join(projectPath, sourceFile);
        const replaceResult = await replaceImageInFile(filePath, oldSrc, targetPath);

        if (replaceResult.success) {
          // Trigger HMR
          await execAsync(`touch "${filePath}"`);
        }
      }

      return jsonResponse({
        success: true,
        path: uploadResult.path,
        optimized: uploadResult.optimized,
        message: 'Image uploaded successfully',
      });

    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // -------------------------------------------------------------------------
  // POST /api/content/ai-generate - Prepare AI content generation context
  // -------------------------------------------------------------------------
  if (path === '/api/content/ai-generate' && req.method === 'POST') {
    try {
      const body = await req.json() as AIGenerateRequest;
      const { context, action, customPrompt, targetLanguage } = body;

      if (!context?.currentText || !action) {
        return jsonResponse({ error: 'context.currentText and action required' }, 400);
      }

      // Build AI prompt based on action
      let prompt: string;

      switch (action) {
        case 'rewrite':
          prompt = `Schreibe diesen Text neu, behalte die Bedeutung aber verbessere den Stil:\n\n"${context.currentText}"`;
          break;
        case 'expand':
          prompt = `Erweitere diesen Text mit mehr Details und Informationen:\n\n"${context.currentText}"`;
          break;
        case 'shorten':
          prompt = `Kürze diesen Text auf das Wesentliche:\n\n"${context.currentText}"`;
          break;
        case 'translate':
          const lang = targetLanguage || context.targetLanguage || 'English';
          prompt = `Übersetze diesen Text nach ${lang}:\n\n"${context.currentText}"`;
          break;
        case 'improve':
          prompt = `Verbessere diesen Text für bessere Lesbarkeit und Wirkung:\n\n"${context.currentText}"`;
          break;
        case 'custom':
          prompt = customPrompt || `Bearbeite diesen Text:\n\n"${context.currentText}"`;
          break;
        default:
          prompt = `Bearbeite diesen Text:\n\n"${context.currentText}"`;
      }

      // Add context if available
      if (context.pageType) {
        prompt += `\n\nDie Seite ist: ${context.pageType}`;
      }
      if (context.siteDescription) {
        prompt += `\n\nWebsite-Beschreibung: ${context.siteDescription}`;
      }

      return jsonResponse({
        success: true,
        prompt,
        action,
        originalText: context.currentText,
        // This will be picked up by the chat interface for streaming AI response
      });

    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // -------------------------------------------------------------------------
  // POST /api/content/find-source - Find source file for text
  // -------------------------------------------------------------------------
  if (path === '/api/content/find-source' && req.method === 'POST') {
    try {
      const body = await req.json();
      const { projectPath, text, context } = body;

      if (!projectPath || !text) {
        return jsonResponse({ error: 'projectPath and text required' }, 400);
      }

      const foundFile = await findFileWithText(projectPath, text, context);

      if (foundFile) {
        const content = await readFile(foundFile, 'utf-8');
        const lines = content.split('\n');
        const lineNumber = lines.findIndex(line => line.includes(text)) + 1;

        return jsonResponse({
          success: true,
          file: foundFile,
          lineNumber,
        });
      } else {
        return jsonResponse({
          success: false,
          error: 'Text not found in any source file',
        }, 404);
      }

    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  // -------------------------------------------------------------------------
  // GET /api/content/history - Get edit history (for undo)
  // -------------------------------------------------------------------------
  if (path === '/api/content/history' && req.method === 'GET') {
    const projectPath = url.searchParams.get('projectPath');

    if (!projectPath) {
      return jsonResponse({ error: 'projectPath required' }, 400);
    }

    // Check for backup files
    try {
      const { stdout } = await execAsync(
        `find "${projectPath}" -name "*.backup-*" -type f -mtime -1 2>/dev/null | head -20`
      );

      const backups = stdout.trim().split('\n').filter(Boolean).map(path => {
        const match = path.match(/\.backup-(\d+)$/);
        return {
          path,
          originalFile: path.replace(/\.backup-\d+$/, ''),
          timestamp: match ? parseInt(match[1]) : 0,
        };
      }).sort((a, b) => b.timestamp - a.timestamp);

      return jsonResponse({
        success: true,
        backups,
      });
    } catch {
      return jsonResponse({ success: true, backups: [] });
    }
  }

  // -------------------------------------------------------------------------
  // POST /api/content/restore - Restore from backup
  // -------------------------------------------------------------------------
  if (path === '/api/content/restore' && req.method === 'POST') {
    try {
      const body = await req.json();
      const { backupPath, targetPath } = body;

      if (!backupPath) {
        return jsonResponse({ error: 'backupPath required' }, 400);
      }

      const target = targetPath || backupPath.replace(/\.backup-\d+$/, '');

      await copyFile(backupPath, target);
      await execAsync(`touch "${target}"`);

      return jsonResponse({
        success: true,
        file: target,
        message: 'File restored from backup',
      });

    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500);
    }
  }

  return null;
}
