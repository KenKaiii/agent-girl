/**
 * Dynamic Folder Naming
 * Generates folder names based on chat content (like ChatGPT)
 */

import * as fs from "fs";
import * as path from "path";
import { sessionDb } from "./database";

/**
 * Generate a folder name from the first message content
 * Takes first 30 characters, removes special characters, converts to kebab-case
 */
export function generateFolderNameFromContent(content: string): string {
  // Remove markdown formatting, code blocks, etc.
  let cleaned = content
    .replace(/[#*`_[\]()]/g, '') // Remove markdown chars
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
  return kebabCase.substring(0, 40) || 'untitled';
}

/**
 * Get unique folder name by appending numbers if needed
 */
export function getUniqueFolderName(baseName: string, baseDir: string): string {
  let folderName = baseName;
  let counter = 1;

  while (fs.existsSync(path.join(baseDir, folderName))) {
    folderName = `${baseName}-${counter}`;
    counter++;
  }

  return folderName;
}

/**
 * Rename session folder based on first message
 * Called after first message is received in a session
 */
export async function renameSessionFolderFromFirstMessage(
  sessionId: string,
  firstMessageContent: string,
  baseDir: string
): Promise<{ success: boolean; newFolderName?: string; error?: string }> {
  try {
    // Get current session
    const session = sessionDb.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Get current folder path
    const currentPath = session.working_directory;
    if (!currentPath || !fs.existsSync(currentPath)) {
      return { success: false, error: 'Session folder not found' };
    }

    // Don't rename if folder has been manually customized (not a default chat-* folder)
    const folderName = path.basename(currentPath);
    if (!folderName.startsWith('chat-')) {
      return { success: false, error: 'Folder already customized, skipping rename' };
    }

    // Generate new folder name from content
    const newFolderBaseName = generateFolderNameFromContent(firstMessageContent);
    const uniqueFolderName = getUniqueFolderName(newFolderBaseName, baseDir);
    const newPath = path.join(baseDir, uniqueFolderName);

    // Rename the folder
    fs.renameSync(currentPath, newPath);
    console.log(`📁 Renamed folder: ${folderName} → ${uniqueFolderName}`);

    // Update database
    sessionDb.updateWorkingDirectory(sessionId, newPath);

    return {
      success: true,
      newFolderName: uniqueFolderName
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
