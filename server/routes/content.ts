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
import sharp from 'sharp';

const execAsync = promisify(exec);

// Image optimization defaults
const IMAGE_DEFAULTS = {
  maxWidth: 1920,
  quality: 85,
  format: 'webp' as const,
};

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
 * Uses AST-aware pattern matching for reliable updates
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

    // Find the text to replace - escape special regex characters
    const escapedOldText = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Track if we found and replaced the text
    let newContent = content;
    let matched = false;

    if (ext === '.astro' || ext === '.tsx' || ext === '.jsx' || ext === '.vue' || ext === '.svelte') {
      // AST-aware patterns for JSX/Vue/Svelte - ordered by specificity
      const patterns = [
        // 1. Text content between HTML tags: >text<
        new RegExp(`(>\\s*)${escapedOldText}(\\s*<)`, 'g'),

        // 2. Text content with only whitespace around: >  text  </tag>
        new RegExp(`(>)\\s*${escapedOldText}\\s*(</)`, 'g'),

        // 3. JSX expressions: {text} or {"text"} or {'text'}
        new RegExp(`(\\{\\s*["'\`]?)${escapedOldText}(["'\`]?\\s*\\})`, 'g'),

        // 4. Common props: title="text", alt="text", placeholder="text", etc.
        new RegExp(`((?:title|alt|label|placeholder|aria-label|name|content|description|heading|text|value|message|tooltip)\\s*=\\s*["'])${escapedOldText}(["'])`, 'gi'),

        // 5. Children prop: children="text"
        new RegExp(`(children\\s*=\\s*["'])${escapedOldText}(["'])`, 'gi'),

        // 6. String literals in double quotes: "text"
        new RegExp(`(")${escapedOldText}(")`, 'g'),

        // 7. String literals in single quotes: 'text'
        new RegExp(`(')${escapedOldText}(')`, 'g'),

        // 8. Template literals: `...text...`
        new RegExp(`(\`[^\`]*?)${escapedOldText}([^\`]*?\`)`, 'g'),

        // 9. Astro frontmatter variables: const x = "text"
        new RegExp(`(const\\s+\\w+\\s*=\\s*["'])${escapedOldText}(["'])`, 'g'),

        // 10. Object properties: key: "text" or key: 'text'
        new RegExp(`(:\\s*["'])${escapedOldText}(["'])`, 'g'),

        // 11. Array elements: ["text", or ['text',
        new RegExp(`(\\[\\s*["'])${escapedOldText}(["'])`, 'g'),

        // 12. Vue/Svelte bindings: :title="text" or bind:value="text"
        new RegExp(`((?::|bind:)\\w+\\s*=\\s*["'])${escapedOldText}(["'])`, 'gi'),

        // 13. Slot content: <slot>text</slot>
        new RegExp(`(<slot[^>]*>)${escapedOldText}(</slot>)`, 'gi'),
      ];

      for (const p of patterns) {
        // Reset lastIndex for global patterns
        p.lastIndex = 0;
        if (p.test(content)) {
          p.lastIndex = 0;
          newContent = newContent.replace(p, (match) => {
            matched = true;
            return match.replace(oldText, newText);
          });
          if (matched) break;
        }
      }

      // Fallback: simple text replacement if patterns didn't match
      if (!matched && content.includes(oldText)) {
        newContent = content.replace(oldText, newText);
        matched = true;
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

      newContent = content.replace(oldText, newText);
      const lineNumber = content.split('\n').findIndex(line => line.includes(oldText)) + 1;

      await writeFile(filePath, newContent, 'utf-8');
      return { success: true, lineNumber };

    } else if (ext === '.html') {
      // HTML: similar to JSX
      if (!content.includes(oldText)) {
        return { success: false, error: 'Text not found in file' };
      }

      newContent = content.replace(oldText, newText);
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
    } else {
      // Default: simple text replacement
      if (!content.includes(oldText)) {
        return { success: false, error: 'Text not found in file' };
      }

      newContent = content.replace(oldText, newText);
      await writeFile(filePath, newContent, 'utf-8');
      return { success: true };
    }

  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Find which source file contains the given text
 * Uses tiered search: prioritized directories first, then broader search
 */
async function findFileWithText(
  projectPath: string,
  text: string,
  context?: TextEditRequest['context']
): Promise<string | null> {
  // Escape text for grep and limit length
  const escapedText = text.replace(/"/g, '\\"').replace(/\$/g, '\\$').substring(0, 100);

  // All file extensions to search
  const includeFlags = [
    '--include="*.astro"',
    '--include="*.tsx"',
    '--include="*.jsx"',
    '--include="*.ts"',
    '--include="*.js"',
    '--include="*.vue"',
    '--include="*.svelte"',
    '--include="*.html"',
    '--include="*.md"',
    '--include="*.mdx"',
    '--include="*.json"',
  ].join(' ');

  // Tier 1: High-priority content directories (most likely to contain editable content)
  const tier1Dirs = [
    'src/pages',
    'src/components',
    'src/layouts',
    'src/sections',
    'src/content',
    'src/templates',
    'app',
    'pages',
    'components',
    'layouts',
  ];

  // Tier 2: Additional source directories
  const tier2Dirs = [
    'src/views',
    'src/screens',
    'src/partials',
    'src/blocks',
    'src/features',
    'src/modules',
    'src/widgets',
    'views',
    'templates',
    'partials',
    'content',
  ];

  // Tier 3: Data and config (for JSON content, i18n, etc.)
  const tier3Dirs = [
    'src/data',
    'src/config',
    'src/i18n',
    'src/locales',
    'data',
    'config',
    'locales',
    'i18n',
    'public',
  ];

  // Search function for a single directory
  const searchDir = async (dir: string): Promise<string | null> => {
    const dirPath = join(projectPath, dir);
    if (!await fileExists(dirPath)) return null;

    try {
      const { stdout } = await execAsync(
        `grep -rl "${escapedText}" "${dirPath}" ${includeFlags} 2>/dev/null | head -3`,
        { timeout: 5000 }
      );

      const files = stdout.trim().split('\n').filter(Boolean);
      return files.length > 0 ? files[0] : null;
    } catch {
      return null;
    }
  };

  // Search Tier 1 first (parallel for speed)
  const tier1Results = await Promise.all(tier1Dirs.map(searchDir));
  const tier1Match = tier1Results.find(r => r !== null);
  if (tier1Match) return tier1Match;

  // Search Tier 2
  const tier2Results = await Promise.all(tier2Dirs.map(searchDir));
  const tier2Match = tier2Results.find(r => r !== null);
  if (tier2Match) return tier2Match;

  // Search Tier 3
  const tier3Results = await Promise.all(tier3Dirs.map(searchDir));
  const tier3Match = tier3Results.find(r => r !== null);
  if (tier3Match) return tier3Match;

  // Tier 4: Fallback - search entire src directory
  const srcPath = join(projectPath, 'src');
  if (await fileExists(srcPath)) {
    try {
      const { stdout } = await execAsync(
        `grep -rl "${escapedText}" "${srcPath}" ${includeFlags} 2>/dev/null | head -3`,
        { timeout: 10000 }
      );
      const files = stdout.trim().split('\n').filter(Boolean);
      if (files.length > 0) return files[0];
    } catch {
      // Continue to next fallback
    }
  }

  // Tier 5: Last resort - search project root (excluding node_modules, .git, dist)
  try {
    const { stdout } = await execAsync(
      `grep -rl "${escapedText}" "${projectPath}" ${includeFlags} --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=.next --exclude-dir=.astro --exclude-dir=build --exclude-dir=out 2>/dev/null | head -5`,
      { timeout: 15000 }
    );
    const files = stdout.trim().split('\n').filter(Boolean);
    if (files.length > 0) return files[0];
  } catch {
    // No matches found
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
 * Optimize image buffer using Sharp
 * Returns optimized buffer and metadata
 */
async function optimizeImage(
  buffer: Buffer,
  options: ImageUploadRequest['optimize'] = {}
): Promise<{ buffer: Buffer; format: string; width: number; height: number; savings: number }> {
  const format = options.format || IMAGE_DEFAULTS.format;
  const maxWidth = options.maxWidth || IMAGE_DEFAULTS.maxWidth;
  const quality = options.quality || IMAGE_DEFAULTS.quality;

  // Get original size
  const originalSize = buffer.length;

  // Create Sharp pipeline
  let pipeline = sharp(buffer);

  // Get metadata for resizing decision
  const metadata = await pipeline.metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Resize if larger than maxWidth
  if (originalWidth > maxWidth) {
    pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
  }

  // Convert to target format with quality settings
  let outputBuffer: Buffer;
  switch (format) {
    case 'avif':
      outputBuffer = await pipeline.avif({ quality, effort: 4 }).toBuffer();
      break;
    case 'webp':
      outputBuffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
      break;
    case 'jpg':
      outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      break;
    case 'png':
      outputBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      break;
    default:
      outputBuffer = await pipeline.webp({ quality }).toBuffer();
  }

  // Calculate savings
  const savings = Math.round((1 - outputBuffer.length / originalSize) * 100);

  // Get output dimensions
  const outputMeta = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    format,
    width: outputMeta.width || originalWidth,
    height: outputMeta.height || originalHeight,
    savings: Math.max(0, savings),
  };
}

/**
 * Upload and optionally optimize an image
 */
async function uploadImage(req: ImageUploadRequest): Promise<{
  success: boolean;
  path?: string;
  optimized?: boolean;
  originalSize?: number;
  optimizedSize?: number;
  savings?: number;
  dimensions?: { width: number; height: number };
  error?: string;
}> {
  try {
    let buffer: Buffer;

    // Handle base64 image
    if (req.image.startsWith('data:')) {
      const base64Data = req.image.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    }
    // Handle URL (download)
    else if (req.image.startsWith('http')) {
      const response = await fetch(req.image);
      buffer = Buffer.from(await response.arrayBuffer());
    }
    // Handle local file path (read)
    else if (await fileExists(req.image)) {
      buffer = await readFile(req.image);
    }
    else {
      return { success: false, error: 'Invalid image source' };
    }

    const originalSize = buffer.length;
    let finalBuffer = buffer;
    let optimized = false;
    let savings = 0;
    let dimensions = { width: 0, height: 0 };

    // Determine output path - adjust extension if format changes
    let targetPath = req.targetPath;

    // Optimize if requested or by default for large images
    const shouldOptimize = req.optimize !== undefined || originalSize > 100 * 1024; // > 100KB

    if (shouldOptimize) {
      try {
        const optimizeOptions = req.optimize || {};
        const result = await optimizeImage(buffer, optimizeOptions);
        finalBuffer = result.buffer;
        optimized = true;
        savings = result.savings;
        dimensions = { width: result.width, height: result.height };

        // Update file extension if format changed
        const newExt = `.${result.format === 'jpg' ? 'jpg' : result.format}`;
        const currentExt = extname(targetPath).toLowerCase();
        if (currentExt !== newExt && result.format !== 'png') {
          targetPath = targetPath.replace(/\.[^.]+$/, newExt);
        }
      } catch (optError) {
        // If optimization fails, use original buffer
        console.warn('Image optimization failed, using original:', optError);
      }
    }

    // Get dimensions if not optimized
    if (!optimized) {
      try {
        const meta = await sharp(buffer).metadata();
        dimensions = { width: meta.width || 0, height: meta.height || 0 };
      } catch {
        // Ignore metadata errors for non-image files
      }
    }

    // Ensure directory exists and write file
    const fullPath = join(req.projectPath, targetPath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, finalBuffer);

    return {
      success: true,
      path: targetPath,
      optimized,
      originalSize,
      optimizedSize: finalBuffer.length,
      savings,
      dimensions,
    };

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
        originalSize: uploadResult.originalSize,
        optimizedSize: uploadResult.optimizedSize,
        savings: uploadResult.savings,
        dimensions: uploadResult.dimensions,
        message: uploadResult.optimized
          ? `Image optimized and uploaded (${uploadResult.savings}% smaller)`
          : 'Image uploaded successfully',
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
