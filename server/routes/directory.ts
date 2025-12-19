/**
 * Directory API Routes
 * Handles directory validation and picker endpoints
 */

import { validateDirectory, getDefaultWorkingDirectory } from "../directoryUtils";
import { openDirectoryPicker } from "../directoryPicker";
import { spawn } from 'child_process';
import os from 'os';

/**
 * Handle directory-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleDirectoryRoutes(req: Request, url: URL): Promise<Response | undefined> {

  // POST /api/validate-directory - Validate directory path
  if (url.pathname === '/api/validate-directory' && req.method === 'POST') {
    const body = await req.json() as { directory: string };
    const validation = validateDirectory(body.directory);

    return new Response(JSON.stringify({
      valid: validation.valid,
      expanded: validation.expanded,
      error: validation.error
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/pick-directory - Open directory picker dialog
  if (url.pathname === '/api/pick-directory' && req.method === 'POST') {
    try {
      const selectedPath = await openDirectoryPicker();

      if (selectedPath) {
        return new Response(JSON.stringify({
          success: true,
          path: selectedPath
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          cancelled: true
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Directory picker error:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/open-chat-folder - Open chat folder in system file explorer
  if (url.pathname === '/api/open-chat-folder' && req.method === 'POST') {
    try {
      const chatFolderPath = getDefaultWorkingDirectory();

      // Open the folder in the system file explorer
      const platform = os.platform();

      if (platform === 'darwin') {
        // macOS - use 'open' command
        spawn('open', [chatFolderPath]);
      } else if (platform === 'win32') {
        // Windows - use 'explorer' command
        spawn('explorer', [chatFolderPath]);
      } else if (platform === 'linux') {
        // Linux - use 'xdg-open' command
        spawn('xdg-open', [chatFolderPath]);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      return new Response(JSON.stringify({
        success: true,
        path: chatFolderPath
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to open chat folder:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Route not handled by this module
  return undefined;
}
