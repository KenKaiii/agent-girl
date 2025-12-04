/**
 * Path Security Utilities
 * Prevents path traversal attacks and validates file paths
 */

import { resolve, normalize, relative, isAbsolute } from 'path';
import { existsSync, statSync, realpathSync } from 'fs';
import { homedir } from 'os';

export interface PathValidationResult {
  valid: boolean;
  resolved?: string;
  error?: string;
}

/**
 * Sanitize a path by removing traversal attempts
 * Returns null if path is unsafe
 */
export function sanitizePath(requestedPath: string, allowedBase: string): string | null {
  try {
    // Normalize the base path
    const normalizedBase = resolve(allowedBase);

    // Handle relative paths
    const fullPath = isAbsolute(requestedPath)
      ? requestedPath
      : resolve(normalizedBase, requestedPath);

    // Normalize to remove any .. or . components
    const normalizedPath = normalize(fullPath);

    // Resolve to get the real absolute path
    const resolvedPath = resolve(normalizedPath);

    // Check if resolved path starts with the allowed base
    const resolvedBase = resolve(normalizedBase);
    if (!resolvedPath.startsWith(resolvedBase + '/') && resolvedPath !== resolvedBase) {
      return null; // Path traversal attempt
    }

    return resolvedPath;
  } catch {
    return null;
  }
}

/**
 * Check if a path is safe within multiple allowed bases
 */
export function isPathSafe(targetPath: string, allowedBases: string[]): boolean {
  try {
    const resolved = resolve(targetPath);

    for (const base of allowedBases) {
      const resolvedBase = resolve(base);
      if (resolved.startsWith(resolvedBase + '/') || resolved === resolvedBase) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Validate a directory path with comprehensive checks
 */
export function validateDirectoryPath(
  dirPath: string,
  options: {
    mustExist?: boolean;
    allowedBases?: string[];
    maxDepth?: number;
  } = {}
): PathValidationResult {
  const { mustExist = true, allowedBases, maxDepth = 50 } = options;

  try {
    // Check for null bytes (injection attack)
    if (dirPath.includes('\0')) {
      return { valid: false, error: 'Path contains null bytes' };
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /\.\.[/\\]/,            // Path traversal
      /^[/\\]{2,}/,           // UNC paths on Windows
      /[:*?"<>|]/,            // Invalid Windows characters
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1f\x7f]/,      // Control characters
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(dirPath)) {
        return { valid: false, error: 'Path contains dangerous characters' };
      }
    }

    // Expand home directory
    let expandedPath = dirPath;
    if (expandedPath.startsWith('~')) {
      expandedPath = expandedPath.replace(/^~/, homedir());
    }

    // Resolve to absolute path
    const resolvedPath = resolve(expandedPath);

    // Check path depth
    const depth = resolvedPath.split('/').filter(Boolean).length;
    if (depth > maxDepth) {
      return { valid: false, error: 'Path exceeds maximum depth' };
    }

    // Check against allowed bases if specified
    if (allowedBases && allowedBases.length > 0) {
      if (!isPathSafe(resolvedPath, allowedBases)) {
        return { valid: false, error: 'Path is outside allowed directories' };
      }
    }

    // Check existence if required
    if (mustExist) {
      if (!existsSync(resolvedPath)) {
        return { valid: false, error: 'Path does not exist' };
      }

      // Follow symlinks and validate real path
      const realPath = realpathSync(resolvedPath);

      // Re-check allowed bases for symlink target
      if (allowedBases && allowedBases.length > 0) {
        if (!isPathSafe(realPath, allowedBases)) {
          return { valid: false, error: 'Symlink target is outside allowed directories' };
        }
      }

      // Verify it's a directory
      const stats = statSync(realPath);
      if (!stats.isDirectory()) {
        return { valid: false, error: 'Path is not a directory' };
      }

      return { valid: true, resolved: realPath };
    }

    return { valid: true, resolved: resolvedPath };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Path validation failed',
    };
  }
}

/**
 * Validate a file path for safe operations
 */
export function validateFilePath(
  filePath: string,
  options: {
    mustExist?: boolean;
    allowedExtensions?: string[];
    allowedBases?: string[];
    maxSize?: number;
  } = {}
): PathValidationResult {
  const { mustExist = false, allowedExtensions, allowedBases, maxSize } = options;

  try {
    // Check for null bytes
    if (filePath.includes('\0')) {
      return { valid: false, error: 'Path contains null bytes' };
    }

    // Expand home directory
    let expandedPath = filePath;
    if (expandedPath.startsWith('~')) {
      expandedPath = expandedPath.replace(/^~/, homedir());
    }

    // Resolve to absolute
    const resolvedPath = resolve(expandedPath);

    // Check against allowed bases
    if (allowedBases && allowedBases.length > 0) {
      if (!isPathSafe(resolvedPath, allowedBases)) {
        return { valid: false, error: 'File path is outside allowed directories' };
      }
    }

    // Check extension whitelist
    if (allowedExtensions && allowedExtensions.length > 0) {
      const ext = resolvedPath.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(`.${ext}`)) {
        return { valid: false, error: `File extension not allowed: .${ext}` };
      }
    }

    if (mustExist) {
      if (!existsSync(resolvedPath)) {
        return { valid: false, error: 'File does not exist' };
      }

      const realPath = realpathSync(resolvedPath);
      const stats = statSync(realPath);

      if (!stats.isFile()) {
        return { valid: false, error: 'Path is not a file' };
      }

      if (maxSize && stats.size > maxSize) {
        return { valid: false, error: `File exceeds maximum size: ${stats.size} > ${maxSize}` };
      }

      // Re-check allowed bases for symlink target
      if (allowedBases && allowedBases.length > 0) {
        if (!isPathSafe(realPath, allowedBases)) {
          return { valid: false, error: 'Symlink target is outside allowed directories' };
        }
      }

      return { valid: true, resolved: realPath };
    }

    return { valid: true, resolved: resolvedPath };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'File path validation failed',
    };
  }
}

/**
 * Get safe relative path between two paths
 * Returns null if resulting path would escape base
 */
export function getSafeRelativePath(from: string, to: string): string | null {
  try {
    const fromResolved = resolve(from);
    const toResolved = resolve(to);

    // Ensure 'to' is within or equal to 'from'
    if (!toResolved.startsWith(fromResolved)) {
      return null;
    }

    return relative(fromResolved, toResolved) || '.';
  } catch {
    return null;
  }
}

/**
 * Clean a filename of dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove path separators
    .replace(/[/\\]/g, '-')
    // Remove Windows invalid chars
    .replace(/[:*?"<>|]/g, '')
    // Remove control characters
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, '')
    // Remove leading/trailing dots and spaces
    .replace(/^[\s.]+|[\s.]+$/g, '')
    // Limit length
    .slice(0, 255);
}

/**
 * Default allowed directories for the application
 */
export function getDefaultAllowedBases(): string[] {
  return [
    homedir(),
    '/tmp',
    process.cwd(),
  ];
}
