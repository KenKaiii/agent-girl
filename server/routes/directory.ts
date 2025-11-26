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

    console.log('🔍 API: Validate directory request:', body.directory);

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
    console.log('📂 API: Opening directory picker dialog...');

    try {
      const selectedPath = await openDirectoryPicker();

      if (selectedPath) {
        console.log('✅ Directory selected:', selectedPath);
        return new Response(JSON.stringify({
          success: true,
          path: selectedPath
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        console.log('⚠️  Directory picker cancelled');
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
    console.log('📂 API: Opening chat folder...');

    try {
      const chatFolderPath = getDefaultWorkingDirectory();
      console.log('📁 Opening folder:', chatFolderPath);

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

  // POST /api/open-folder - Open any folder in system file explorer
  if (url.pathname === '/api/open-folder' && req.method === 'POST') {
    console.log('📂 API: Opening custom folder...');

    try {
      const body = await req.json() as { path: string };
      const folderPath = body.path;

      if (!folderPath) {
        throw new Error('No path provided');
      }

      console.log('📁 Opening folder:', folderPath);

      // Open the folder in the system file explorer
      const platform = os.platform();

      if (platform === 'darwin') {
        // macOS - use 'open' command
        spawn('open', [folderPath]);
      } else if (platform === 'win32') {
        // Windows - use 'explorer' command
        spawn('explorer', [folderPath]);
      } else if (platform === 'linux') {
        // Linux - use 'xdg-open' command
        spawn('xdg-open', [folderPath]);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      return new Response(JSON.stringify({
        success: true,
        path: folderPath
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to open folder:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/open-file - Open a file in default application
  if (url.pathname === '/api/open-file' && req.method === 'POST') {
    console.log('📄 API: Opening file...');

    try {
      const body = await req.json() as { path: string; workingDirectory?: string };
      let filePath = body.path;
      const workingDir = body.workingDirectory;

      if (!filePath) {
        throw new Error('No path provided');
      }

      const fs = await import('fs');
      const path = await import('path');

      // Expand home directory if needed
      if (filePath.startsWith('~/')) {
        filePath = path.join(os.homedir(), filePath.slice(2));
      }

      // If it's just a filename (no path separators), search for it
      if (!filePath.includes('/') && !filePath.includes('\\')) {
        // First try the working directory if provided
        const baseDir = workingDir || getDefaultWorkingDirectory();

        // Search recursively in the base directory
        const findFile = (dir: string, filename: string): string | null => {
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isFile() && entry.name === filename) {
                return fullPath;
              }
              if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                const found = findFile(fullPath, filename);
                if (found) return found;
              }
            }
          } catch {
            // Ignore permission errors
          }
          return null;
        };

        const foundPath = findFile(baseDir, filePath);
        if (foundPath) {
          filePath = foundPath;
          console.log('📄 Found file at:', filePath);
        } else {
          throw new Error(`File not found: ${filePath}`);
        }
      }

      // Validate that the file actually exists before trying to open it
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // Verify it's a file, not a directory
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      console.log('📄 Opening file:', filePath);

      // Open the file in the default application
      const platform = os.platform();

      if (platform === 'darwin') {
        // macOS - use 'open' command
        spawn('open', [filePath]);
      } else if (platform === 'win32') {
        // Windows - use 'start' command via cmd
        spawn('cmd', ['/c', 'start', '', filePath]);
      } else if (platform === 'linux') {
        // Linux - use 'xdg-open' command
        spawn('xdg-open', [filePath]);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      return new Response(JSON.stringify({
        success: true,
        path: filePath
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to open file:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/open-file-folder - Open the folder containing a file
  if (url.pathname === '/api/open-file-folder' && req.method === 'POST') {
    console.log('📂 API: Opening file folder...');

    try {
      const body = await req.json() as { path: string; workingDirectory?: string };
      let filePath = body.path;
      const workingDir = body.workingDirectory;

      if (!filePath) {
        throw new Error('No path provided');
      }

      const fs = await import('fs');
      const path = await import('path');

      // Expand home directory if needed
      if (filePath.startsWith('~/')) {
        filePath = path.join(os.homedir(), filePath.slice(2));
      }

      // If it's just a filename (no path separators), search for it
      if (!filePath.includes('/') && !filePath.includes('\\')) {
        const baseDir = workingDir || getDefaultWorkingDirectory();

        const findFile = (dir: string, filename: string): string | null => {
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isFile() && entry.name === filename) {
                return fullPath;
              }
              if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                const found = findFile(fullPath, filename);
                if (found) return found;
              }
            }
          } catch {
            // Ignore permission errors
          }
          return null;
        };

        const foundPath = findFile(baseDir, filePath);
        if (foundPath) {
          filePath = foundPath;
        } else {
          throw new Error(`File not found: ${filePath}`);
        }
      }

      // Validate that the file actually exists before trying to open it
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // Verify it's a file, not a directory
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      // Get the parent directory of the file
      const folderPath = path.dirname(filePath);

      console.log('📁 Opening folder:', folderPath);

      // Open the folder in the system file explorer
      const platform = os.platform();

      if (platform === 'darwin') {
        // macOS - use 'open' command with -R to reveal in Finder
        spawn('open', ['-R', filePath]);
      } else if (platform === 'win32') {
        // Windows - use 'explorer' with /select to highlight the file
        spawn('explorer', ['/select,', filePath]);
      } else if (platform === 'linux') {
        // Linux - use 'xdg-open' on the parent folder
        spawn('xdg-open', [folderPath]);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      return new Response(JSON.stringify({
        success: true,
        path: folderPath
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to open file folder:', errorMessage);
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
