/**
 * CLI API Routes
 * Enables external control of Agent Girl via HTTP API
 */

import path from 'path';
import { sessionDb } from '../database';
import { AGENT_REGISTRY } from '../agents';

export interface CLIRequest {
  action: 'chat' | 'summarize' | 'list-agents' | 'list-sessions' | 'create-session';
  prompt?: string;
  sessionId?: string;
  workingDirectory?: string;
  mode?: 'general' | 'coder' | 'intense-research' | 'spark';
  agents?: string[];
  model?: string;
}

export interface CLIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Handle CLI API requests
 */
export async function handleCLIRequest(req: Request): Promise<Response> {
  try {
    const body = await req.json() as CLIRequest;
    const { action } = body;

    switch (action) {
      case 'list-agents':
        return listAgents();

      case 'list-sessions':
        return listSessions(body);

      case 'create-session':
        return createSession(body);

      case 'summarize':
        return summarizeFolder(body);

      case 'chat':
        return handleChat(body);

      default:
        return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

/**
 * List all available agents
 */
function listAgents(): Response {
  const agents = Object.entries(AGENT_REGISTRY).map(([id, def]) => ({
    id,
    description: def.description,
    model: def.model || 'inherit',
  }));

  return jsonResponse({ success: true, data: { agents } });
}

/**
 * List sessions with optional filters
 */
function listSessions(body: CLIRequest): Response {
  const limit = 50;
  const result = sessionDb.getSessionsPaginated({ limit });

  const sessions = result.data.map(s => ({
    id: s.id,
    title: s.title,
    mode: s.mode,
    workingDirectory: s.working_directory,
    messageCount: s.message_count,
    updatedAt: s.updated_at,
  }));

  return jsonResponse({ success: true, data: { sessions, total: result.total } });
}

/**
 * Create a new session with optional folder and mode
 */
function createSession(body: CLIRequest): Response {
  const { workingDirectory, mode = 'general' } = body;

  const session = sessionDb.createSession('New Chat', workingDirectory, mode);

  return jsonResponse({
    success: true,
    data: {
      sessionId: session.id,
      title: session.title,
      mode: session.mode,
      workingDirectory: session.working_directory,
    }
  });
}

/**
 * Generate a summary for a folder's contents
 */
async function summarizeFolder(body: CLIRequest): Promise<Response> {
  const { workingDirectory, sessionId } = body;

  if (!workingDirectory) {
    return jsonResponse({ success: false, error: 'workingDirectory is required' }, 400);
  }

  // Check if folder exists
  const fs = await import('fs');
  if (!fs.existsSync(workingDirectory)) {
    return jsonResponse({ success: false, error: `Directory not found: ${workingDirectory}` }, 404);
  }

  // Get folder structure for summary
  const folderInfo = await getFolderSummary(workingDirectory);

  // Generate a smart title from folder contents
  const title = generateSmartTitle(workingDirectory, folderInfo);

  // If sessionId provided, update that session
  if (sessionId) {
    sessionDb.renameSession(sessionId, title);
    return jsonResponse({
      success: true,
      data: {
        sessionId,
        title,
        folderSummary: folderInfo,
        action: 'updated',
      }
    });
  }

  // Otherwise return just the summary
  return jsonResponse({
    success: true,
    data: {
      title,
      folderSummary: folderInfo,
    }
  });
}

/**
 * Handle a chat request (returns session info, actual chat via WebSocket)
 */
function handleChat(body: CLIRequest): Response {
  const { prompt, sessionId, workingDirectory, mode = 'general', agents } = body;

  if (!prompt) {
    return jsonResponse({ success: false, error: 'prompt is required' }, 400);
  }

  // Return connection info for WebSocket
  return jsonResponse({
    success: true,
    data: {
      message: 'Connect via WebSocket to send chat messages',
      websocketUrl: 'ws://localhost:3001',
      payloadFormat: {
        type: 'chat',
        sessionId: sessionId || '<create new>',
        message: prompt,
        workingDir: workingDirectory,
        mode,
        agents: agents || [],
      },
    }
  });
}

/**
 * Get a summary of folder contents
 */
async function getFolderSummary(dirPath: string): Promise<{
  files: string[];
  folders: string[];
  hasPackageJson: boolean;
  hasReadme: boolean;
  mainLanguage: string | null;
  projectType: string | null;
}> {
  const fs = await import('fs');
  const path = await import('path');

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  const files: string[] = [];
  const folders: string[] = [];
  const extensions: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules') continue;

    if (entry.isDirectory()) {
      folders.push(entry.name);
    } else {
      files.push(entry.name);
      const ext = path.extname(entry.name).toLowerCase();
      if (ext) {
        extensions[ext] = (extensions[ext] || 0) + 1;
      }
    }
  }

  // Detect main language
  const langMap: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.rs': 'Rust', '.go': 'Go',
  };

  let mainLanguage: string | null = null;
  let maxCount = 0;
  for (const [ext, count] of Object.entries(extensions)) {
    if (langMap[ext] && count > maxCount) {
      mainLanguage = langMap[ext];
      maxCount = count;
    }
  }

  // Detect project type
  let projectType: string | null = null;
  if (files.includes('package.json')) {
    projectType = 'Node.js';
    if (files.includes('next.config.js') || files.includes('next.config.mjs')) {
      projectType = 'Next.js';
    } else if (files.includes('astro.config.mjs')) {
      projectType = 'Astro';
    }
  } else if (files.includes('Cargo.toml')) {
    projectType = 'Rust';
  } else if (files.includes('go.mod')) {
    projectType = 'Go';
  } else if (files.includes('pyproject.toml') || files.includes('setup.py')) {
    projectType = 'Python';
  }

  return {
    files: files.slice(0, 20),
    folders: folders.slice(0, 10),
    hasPackageJson: files.includes('package.json'),
    hasReadme: files.some(f => f.toLowerCase().startsWith('readme')),
    mainLanguage,
    projectType,
  };
}

/**
 * Generate a smart title from folder contents
 */
function generateSmartTitle(dirPath: string, info: Awaited<ReturnType<typeof getFolderSummary>>): string {
  const folderName = path.basename(dirPath);

  // If folder name is kebab-case, convert to title case
  if (/^[a-z0-9-]+$/.test(folderName)) {
    const titleCase = folderName
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Add project type if detected
    if (info.projectType && !titleCase.toLowerCase().includes(info.projectType.toLowerCase())) {
      return `${titleCase} (${info.projectType})`;
    }
    return titleCase;
  }

  return folderName;
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(data: CLIResponse, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
