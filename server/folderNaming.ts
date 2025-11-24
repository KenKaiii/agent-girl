/**
 * Dynamic Folder Naming
 * Generates folder names based on chat content (like ChatGPT)
 * Includes improved folder detection and name matching
 */

import * as fs from "fs";
import * as path from "path";
import { sessionDb } from "./database";

/**
 * Folder metadata for tracking changes
 */
export interface FolderMetadata {
  path: string;
  name: string;
  created: number;
  modified: number;
  isDefault: boolean; // True if created by the system as 'chat-*'
}

/**
 * In-memory cache of folder metadata for fast change detection
 */
const folderMetadataCache = new Map<string, FolderMetadata>();

/**
 * Generate a folder name from the first message content
 * Takes first 50 characters, removes special characters, converts to kebab-case
 * Improved with better special character handling
 */
export function generateFolderNameFromContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return 'untitled';
  }

  // Remove markdown formatting, code blocks, etc.
  let cleaned = content
    .replace(/[#*`_[\]()]/g, '') // Remove markdown chars
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/~~.*?~~/g, '') // Remove strikethrough
    .replace(/\n+/g, ' ') // Replace newlines with space
    .trim();

  // Take first 50 characters
  cleaned = cleaned.substring(0, 50);

  // Convert to kebab-case: lowercase, replace spaces with hyphens, remove special chars
  const kebabCase = cleaned
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Ensure it's not empty and not too long
  const finalName = kebabCase.substring(0, 40) || 'untitled';

  // Validate the folder name for filesystem compatibility
  return sanitizeFolderName(finalName);
}

/**
 * Sanitize folder name for filesystem compatibility
 * Removes/replaces invalid characters for different operating systems
 */
export function sanitizeFolderName(name: string): string {
  if (!name) {
    return 'untitled';
  }

  // Remove invalid characters across all filesystems
  // Windows: < > : " / \ | ? *
  // Mac/Linux: / \0 (null character)
  let sanitized = name
    .replace(/[<>:"|?*\\/\0]/g, '') // Remove invalid chars
    .replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  // Handle reserved names on Windows
  const reserved = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
  const lowerName = sanitized.toLowerCase();
  if (reserved.includes(lowerName) || reserved.includes(lowerName.split('.')[0])) {
    sanitized = '_' + sanitized;
  }

  // Ensure it's not empty
  return sanitized.substring(0, 255) || 'untitled';
}

/**
 * Check if folder exists and is accessible
 * Returns detailed metadata if it exists
 */
export function detectFolderState(folderPath: string): { exists: boolean; accessible: boolean; metadata?: FolderMetadata; error?: string } {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { exists: false, accessible: false, error: 'Invalid path' };
    }

    if (!fs.existsSync(folderPath)) {
      return { exists: false, accessible: false };
    }

    // Check if it's actually a directory
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      return { exists: false, accessible: false, error: 'Path is not a directory' };
    }

    // Try to access it
    try {
      fs.readdirSync(folderPath);
    } catch {
      return { exists: true, accessible: false, error: 'Directory not accessible' };
    }

    // Get folder name and determine if it's a default folder
    const folderName = path.basename(folderPath);
    const isDefault = folderName.startsWith('chat-');

    // Create metadata
    const metadata: FolderMetadata = {
      path: folderPath,
      name: folderName,
      created: stats.birthtime.getTime(),
      modified: stats.mtime.getTime(),
      isDefault
    };

    return { exists: true, accessible: true, metadata };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { exists: false, accessible: false, error: message };
  }
}

/**
 * Detect if a folder has been modified since last check
 * Uses cached metadata for comparison
 */
export function isFolderModified(folderPath: string): boolean {
  try {
    const current = detectFolderState(folderPath);

    if (!current.exists || !current.accessible || !current.metadata) {
      return false;
    }

    const cached = folderMetadataCache.get(folderPath);
    if (!cached) {
      // First time checking this folder
      folderMetadataCache.set(folderPath, current.metadata);
      return false;
    }

    // Check if modification time has changed
    const isModified = current.metadata.modified !== cached.modified;

    if (isModified) {
      // Update cache
      folderMetadataCache.set(folderPath, current.metadata);
    }

    return isModified;
  } catch {
    return false;
  }
}

/**
 * Check if folder name matches expected pattern (case-insensitive on Windows/Mac)
 * Returns true if folder is a default system-created folder
 */
export function isDefaultFolderName(folderPath: string): boolean {
  try {
    const folderName = path.basename(folderPath);
    // Match 'chat-' prefix (case-insensitive on case-insensitive filesystems)
    const isDefault = folderName.toLowerCase().startsWith('chat-');
    return isDefault;
  } catch {
    return false;
  }
}

/**
 * Compare folder names with proper handling for different filesystems
 * Case-insensitive on Windows/Mac, case-sensitive on Linux
 */
export function compareFolderNames(name1: string, name2: string, caseSensitive: boolean = false): boolean {
  if (!name1 || !name2) {
    return name1 === name2;
  }

  if (caseSensitive) {
    return name1 === name2;
  }

  // Case-insensitive comparison (for Windows/Mac)
  return name1.toLowerCase() === name2.toLowerCase();
}

/**
 * Get unique folder name by appending numbers if needed
 * Improved with proper case-insensitive comparison
 */
export function getUniqueFolderName(baseName: string, baseDir: string): string {
  let folderName = baseName;
  let counter = 1;
  const maxAttempts = 1000;

  while (counter < maxAttempts) {
    const candidatePath = path.join(baseDir, folderName);

    // Check if folder already exists (case-insensitive on applicable systems)
    if (!fs.existsSync(candidatePath)) {
      // Double-check by listing directory and comparing names
      try {
        const entries = fs.readdirSync(baseDir);
        const exists = entries.some(entry =>
          compareFolderNames(entry, folderName, process.platform === 'linux')
        );

        if (!exists) {
          return folderName;
        }
      } catch {
        // If we can't read directory, just use the name we found via existsSync
        return folderName;
      }
    }

    folderName = `${baseName}-${counter}`;
    counter++;
  }

  // Fallback to timestamp-based uniqueness
  return `${baseName}-${Date.now()}`;
}

/**
 * Rename session folder based on first message
 * Called after first message is received in a session
 * Uses improved folder detection with state tracking
 */
export async function renameSessionFolderFromFirstMessage(
  sessionId: string,
  firstMessageContent: string,
  baseDir: string
): Promise<{ success: boolean; newFolderName?: string; oldFolderName?: string; error?: string }> {
  try {
    // Get current session
    const session = sessionDb.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Get current folder path
    const currentPath = session.working_directory;
    if (!currentPath) {
      return { success: false, error: 'Session working directory not set' };
    }

    // Detect current folder state
    const folderState = detectFolderState(currentPath);
    if (!folderState.exists || !folderState.accessible) {
      return { success: false, error: `Session folder not found or not accessible: ${folderState.error}` };
    }

    const oldFolderName = folderState.metadata?.name || path.basename(currentPath);

    // Don't rename if folder has been manually customized (not a default chat-* folder)
    if (!isDefaultFolderName(currentPath)) {
      return { success: false, error: 'Folder already customized, skipping rename' };
    }

    // Generate new folder name from content
    const newFolderBaseName = generateFolderNameFromContent(firstMessageContent);
    const uniqueFolderName = getUniqueFolderName(newFolderBaseName, baseDir);
    const newPath = path.join(baseDir, uniqueFolderName);

    // Verify the new path doesn't already exist
    if (fs.existsSync(newPath)) {
      return { success: false, error: `Target folder already exists: ${uniqueFolderName}` };
    }

    // Rename the folder with error handling
    try {
      fs.renameSync(currentPath, newPath);
      console.log(`📁 Renamed folder: ${oldFolderName} → ${uniqueFolderName}`);
    } catch (renameError) {
      const message = renameError instanceof Error ? renameError.message : 'Unknown error';
      return { success: false, error: `Failed to rename folder: ${message}` };
    }

    // Verify the new folder exists before updating database
    const newFolderState = detectFolderState(newPath);
    if (!newFolderState.exists || !newFolderState.accessible) {
      console.error('⚠️  New folder not accessible after rename, attempting to rollback');
      try {
        fs.renameSync(newPath, currentPath);
        return { success: false, error: 'New folder not accessible, rolled back rename' };
      } catch {
        return { success: false, error: 'Critical: Rename succeeded but new folder not accessible and rollback failed' };
      }
    }

    // Update database
    sessionDb.updateWorkingDirectory(sessionId, newPath);

    return {
      success: true,
      newFolderName: uniqueFolderName,
      oldFolderName
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error renaming session folder:', message);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Update session title from first message
 * Called after first message is received
 */
export async function updateSessionTitleFromFirstMessage(
  sessionId: string,
  firstMessageContent: string
): Promise<{ success: boolean; newTitle?: string; error?: string }> {
  try {
    const session = sessionDb.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Skip if title already set (not the default)
    if (session.title !== 'New Chat') {
      return { success: false, error: 'Title already customized' };
    }

    // Generate title from content
    const newTitle = generateFolderNameFromContent(firstMessageContent)
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .substring(0, 60);

    // Update database
    if (newTitle && newTitle.length > 0) {
      sessionDb.renameSession(sessionId, newTitle);
      console.log(`📝 Updated session title: ${newTitle}`);
      return {
        success: true,
        newTitle
      };
    }

    return { success: false, error: 'Could not generate title' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating session title:', message);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Clear metadata cache for a specific folder
 * Useful when you know a folder has been modified externally
 */
export function clearFolderMetadataCache(folderPath?: string): boolean {
  try {
    if (folderPath) {
      folderMetadataCache.delete(folderPath);
      console.log(`🗑️  Cleared metadata cache for: ${folderPath}`);
    } else {
      folderMetadataCache.clear();
      console.log('🗑️  Cleared all folder metadata cache');
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error clearing metadata cache:', message);
    return false;
  }
}

/**
 * Get current metadata cache size for diagnostics
 */
export function getMetadataCacheSize(): number {
  return folderMetadataCache.size;
}

/**
 * Get all tracked folders from cache
 */
export function getTrackedFolders(): Array<{ path: string; metadata: FolderMetadata }> {
  const tracked: Array<{ path: string; metadata: FolderMetadata }> = [];
  folderMetadataCache.forEach((metadata, path) => {
    tracked.push({ path, metadata });
  });
  return tracked;
}
