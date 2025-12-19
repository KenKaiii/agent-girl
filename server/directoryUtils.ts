/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Get the default working directory for agent operations
 * Cross-platform: ~/Documents/agent-girl (Mac/Linux) or C:\Users\{user}\Documents\agent-girl (Windows)
 */
export function getDefaultWorkingDirectory(): string {
  const homeDir = os.homedir();
  const defaultDir = path.join(homeDir, 'Documents', 'agent-girl');

  // Startup logs are now consolidated in server.ts
  // console.log('🏠 Platform:', os.platform());
  // console.log('🏠 Home directory:', homeDir);
  // console.log('🏠 Default working directory:', defaultDir);

  return defaultDir;
}

/**
 * Get the app data directory for storing database and app files
 * Cross-platform: ~/Documents/agent-girl-app
 */
export function getAppDataDirectory(): string {
  const homeDir = os.homedir();
  const appDataDir = path.join(homeDir, 'Documents', 'agent-girl-app');

  return appDataDir;
}

/**
 * Expand tilde (~) in path to actual home directory
 * Works cross-platform
 */
export function expandPath(dirPath: string): string {
  if (!dirPath) return dirPath;

  // If path starts with ~, replace with home directory
  if (dirPath.startsWith('~/') || dirPath === '~') {
    const homeDir = os.homedir();
    const expanded = dirPath === '~'
      ? homeDir
      : path.join(homeDir, dirPath.slice(2));

    return expanded;
  }

  // Return absolute path as-is
  return path.resolve(dirPath);
}

/**
 * Validate that a directory exists and is accessible
 */
export function validateDirectory(dirPath: string): { valid: boolean; error?: string; expanded?: string } {
  try {
    // Expand path first
    const expanded = expandPath(dirPath);

    // Check if path exists
    if (!fs.existsSync(expanded)) {
      console.warn('⚠️  Directory does not exist:', expanded);
      return {
        valid: false,
        error: 'Directory does not exist',
        expanded
      };
    }

    // Check if it's actually a directory (follows symlinks)
    const stats = fs.statSync(expanded);
    if (!stats.isDirectory()) {
      console.warn('⚠️  Path is not a directory:', expanded);
      return {
        valid: false,
        error: 'Path is not a directory',
        expanded
      };
    }

    // Symbolic links are allowed - the statSync above already followed the link

    // Check read/write permissions by attempting to access
    try {
      fs.accessSync(expanded, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      console.warn('⚠️  No read/write permissions:', expanded);
      return {
        valid: false,
        error: 'No read/write permissions',
        expanded
      };
    }

    // Additional safety check: ensure directory is accessible
    try {
      fs.readdirSync(expanded);
    } catch {
      console.warn('⚠️  Directory not accessible:', expanded);
      return {
        valid: false,
        error: 'Directory not accessible (may be deleted or moved)',
        expanded
      };
    }

    // Silent success - only log errors
    return {
      valid: true,
      expanded
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Directory validation error:', errorMessage);
    return {
      valid: false,
      error: errorMessage
    };
  }
}

/**
 * Create directory if it doesn't exist (including parent directories)
 */
export function ensureDirectory(dirPath: string): boolean {
  try {
    const expanded = expandPath(dirPath);

    if (fs.existsSync(expanded)) {
      return true;
    }

    // Create directory recursively
    fs.mkdirSync(expanded, { recursive: true });
    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to create directory:', errorMessage);
    return false;
  }
}

/**
 * Get platform-specific information for diagnostic logging
 */
export function getPlatformInfo(): {
  os: string;
  platform: string;
  home: string;
  arch: string;
  version: string;
} {
  const info = {
    os: os.type(),
    platform: os.platform(),
    home: os.homedir(),
    arch: os.arch(),
    version: os.release()
  };

  // Startup logs are now consolidated in server.ts
  // console.log('💻 Platform info:', info);
  return info;
}
