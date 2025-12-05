/**
 * Directory API Routes
 * Handles directory validation and picker endpoints
 * Improved with better folder detection and state tracking
 */

import { validateDirectory, getDefaultWorkingDirectory } from "../directoryUtils";
import { openDirectoryPicker } from "../directoryPicker";
import { detectFolderState } from "../folderNaming";
import { analyzeProject, generateNameSuggestions, quickAnalyzeForChatName } from "../smartNaming";
import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';

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

      // Detect folder state with improved validation
      const folderState = detectFolderState(folderPath);
      if (!folderState.exists) {
        throw new Error(`Folder does not exist: ${folderPath}`);
      }

      if (!folderState.accessible) {
        throw new Error(`Folder not accessible: ${folderState.error || 'Unknown reason'}`);
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
        path: folderPath,
        isDefault: folderState.metadata?.isDefault || false
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

  // POST /api/open-terminal - Open terminal at specified path
  if (url.pathname === '/api/open-terminal' && req.method === 'POST') {
    console.log('💻 API: Opening terminal...');

    try {
      const body = await req.json() as { path: string };
      const folderPath = body.path;

      if (!folderPath) {
        throw new Error('No path provided');
      }

      // Check if folder exists
      if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder does not exist: ${folderPath}`);
      }

      console.log('📁 Opening terminal at:', folderPath);

      const platform = os.platform();

      if (platform === 'darwin') {
        // macOS - open Terminal.app
        spawn('open', ['-a', 'Terminal', folderPath]);
      } else if (platform === 'win32') {
        // Windows - open Command Prompt
        spawn('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${folderPath}"`], { shell: true });
      } else if (platform === 'linux') {
        // Linux - try gnome-terminal, xterm, or konsole
        spawn('x-terminal-emulator', ['--working-directory', folderPath]);
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
      console.error('❌ Failed to open terminal:', errorMessage);
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

      // Validate folder exists and is accessible
      const folderState = detectFolderState(folderPath);
      if (!folderState.exists || !folderState.accessible) {
        throw new Error(`Parent folder not accessible: ${folderState.error || 'Unknown reason'}`);
      }

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
        path: folderPath,
        isDefault: folderState.metadata?.isDefault || false
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

  // GET /api/directory-tree - Get directory structure as a tree
  if (url.pathname === '/api/directory-tree' && req.method === 'POST') {
    try {
      const body = await req.json() as { path: string; depth?: number };
      const dirPath = body.path;
      const maxDepth = body.depth || 3;

      if (!dirPath) {
        throw new Error('No path provided');
      }

      const path = await import('path');

      // Expand home directory
      let expandedPath = dirPath;
      if (expandedPath.startsWith('~/')) {
        expandedPath = path.join(os.homedir(), expandedPath.slice(2));
      }

      // Validate directory exists
      if (!fs.existsSync(expandedPath)) {
        throw new Error(`Directory does not exist: ${expandedPath}`);
      }

      const stats = fs.statSync(expandedPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${expandedPath}`);
      }

      interface FileTreeNode {
        name: string;
        path: string;
        type: 'file' | 'directory';
        size?: number;
        children?: FileTreeNode[];
      }

      // Build the tree recursively
      const buildTree = (dir: string, currentDepth: number): FileTreeNode[] => {
        if (currentDepth > maxDepth) return [];

        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          const nodes: FileTreeNode[] = [];

          // Sort: directories first, then files, alphabetically
          const sorted = entries.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          });

          for (const entry of sorted) {
            // Skip hidden files and common ignored directories
            if (entry.name.startsWith('.') ||
                entry.name === 'node_modules' ||
                entry.name === '__pycache__' ||
                entry.name === 'dist' ||
                entry.name === 'build' ||
                entry.name === '.git') {
              continue;
            }

            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'directory',
                children: buildTree(fullPath, currentDepth + 1),
              });
            } else if (entry.isFile()) {
              const fileStats = fs.statSync(fullPath);
              nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'file',
                size: fileStats.size,
              });
            }
          }

          return nodes;
        } catch {
          return [];
        }
      };

      const tree = buildTree(expandedPath, 1);

      return new Response(JSON.stringify({
        success: true,
        path: expandedPath,
        name: path.basename(expandedPath),
        tree,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to get directory tree:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/open-terminal - Open terminal in folder
  if (url.pathname === '/api/open-terminal' && req.method === 'POST') {
    console.log('💻 API: Opening terminal...');

    try {
      const body = await req.json() as { path: string };
      const folderPath = body.path;

      if (!folderPath) {
        throw new Error('No path provided');
      }

      // Validate folder exists
      if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder does not exist: ${folderPath}`);
      }

      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${folderPath}`);
      }

      console.log('💻 Opening terminal in:', folderPath);

      const platform = os.platform();

      if (platform === 'darwin') {
        // macOS - open Terminal app with cd command
        spawn('osascript', [
          '-e', `tell application "Terminal" to do script "cd '${folderPath}'"`,
          '-e', 'tell application "Terminal" to activate'
        ]);
      } else if (platform === 'win32') {
        // Windows - open cmd in folder
        spawn('cmd', ['/c', 'start', 'cmd', '/K', `cd /d "${folderPath}"`]);
      } else if (platform === 'linux') {
        // Linux - try common terminal emulators
        const terminals = ['gnome-terminal', 'konsole', 'xterm', 'xfce4-terminal'];
        for (const term of terminals) {
          try {
            spawn(term, ['--working-directory', folderPath]);
            break;
          } catch {
            continue;
          }
        }
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
      console.error('❌ Failed to open terminal:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/path-suggestions - Get path suggestions for autocomplete
  if (url.pathname === '/api/path-suggestions' && req.method === 'POST') {
    try {
      const body = await req.json() as { path: string };
      const inputPath = body.path || '';

      // Handle empty input
      if (!inputPath) {
        return new Response(JSON.stringify({
          success: true,
          suggestions: []
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Expand ~ to home directory
      const expandedPath = inputPath.startsWith('~')
        ? inputPath.replace('~', Bun.env.HOME || '/Users')
        : inputPath;

      // Get the directory to search and the prefix to match
      const isDir = expandedPath.endsWith('/');
      const searchDir = isDir ? expandedPath : expandedPath.substring(0, expandedPath.lastIndexOf('/') + 1) || '/';
      const prefix = isDir ? '' : expandedPath.substring(expandedPath.lastIndexOf('/') + 1).toLowerCase();

      const suggestions: string[] = [];

      try {
        const { readdirSync } = await import('fs');
        const entries = readdirSync(searchDir, { withFileTypes: true });

        for (const entry of entries) {
          // Skip hidden files unless user is typing a dot
          if (entry.name.startsWith('.') && !prefix.startsWith('.')) continue;

          const nameLower = entry.name.toLowerCase();
          if (prefix && !nameLower.startsWith(prefix)) continue;

          const fullPath = searchDir + entry.name;

          // Prioritize directories
          if (entry.isDirectory()) {
            suggestions.unshift(fullPath + '/');
          } else {
            suggestions.push(fullPath);
          }

          // Limit suggestions
          if (suggestions.length >= 15) break;
        }

        // Sort: directories first, then alphabetically
        suggestions.sort((a, b) => {
          const aIsDir = a.endsWith('/');
          const bIsDir = b.endsWith('/');
          if (aIsDir && !bIsDir) return -1;
          if (!aIsDir && bIsDir) return 1;
          return a.localeCompare(b);
        });

      } catch {
        // Directory doesn't exist or can't be read
      }

      return new Response(JSON.stringify({
        success: true,
        suggestions: suggestions.slice(0, 8)
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/smart-name - Get smart naming suggestions for a project
  if (url.pathname === '/api/smart-name' && req.method === 'POST') {
    console.log('🧠 API: Smart naming request...');

    try {
      const body = await req.json() as { path: string; count?: number };
      const dirPath = body.path;
      const count = body.count || 5;

      if (!dirPath) {
        throw new Error('No path provided');
      }

      // Expand home directory
      let expandedPath = dirPath;
      if (expandedPath.startsWith('~/')) {
        expandedPath = expandedPath.replace('~', Bun.env.HOME || '/Users');
      }

      // Validate directory exists
      if (!fs.existsSync(expandedPath)) {
        throw new Error(`Directory does not exist: ${expandedPath}`);
      }

      const stats = fs.statSync(expandedPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${expandedPath}`);
      }

      // Analyze project
      const analysis = analyzeProject(expandedPath);
      const suggestions = generateNameSuggestions(expandedPath, count);

      console.log('🧠 Smart naming result:', {
        name: analysis.name,
        framework: analysis.framework,
        language: analysis.language,
        suggested: analysis.suggestedName,
        confidence: analysis.confidence
      });

      return new Response(JSON.stringify({
        success: true,
        analysis,
        suggestions,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Smart naming failed:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/smart-chat-name - Get smart name for chat based on content
  if (url.pathname === '/api/smart-chat-name' && req.method === 'POST') {
    try {
      const body = await req.json() as { content: string; workingDirectory?: string };
      const { content, workingDirectory } = body;

      if (!content) {
        throw new Error('No content provided');
      }

      const suggestedName = quickAnalyzeForChatName(content, workingDirectory);

      return new Response(JSON.stringify({
        success: true,
        suggestedName,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Route not handled by this module
  return undefined;
}
