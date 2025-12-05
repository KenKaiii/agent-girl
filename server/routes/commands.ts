/**
 * Commands API Routes
 * Handles loading slash commands from .claude/commands directory
 *
 * Performance: In-memory caching with TTL and file watcher invalidation
 */

import * as fs from 'fs';
import * as path from 'path';
import { watch, type FSWatcher } from 'fs';
import { sessionDb } from "../database";

interface SlashCommand {
  name: string;
  description: string;
  argumentHint: string;
}

// Cache configuration
const CACHE_TTL_MS = 60_000; // 1 minute TTL

interface CacheEntry {
  commands: SlashCommand[];
  timestamp: number;
  watcher?: FSWatcher;
}

// In-memory cache: workingDir -> cached commands
const commandsCache = new Map<string, CacheEntry>();

/**
 * Invalidate cache for a specific directory
 */
function invalidateCache(workingDir: string): void {
  const entry = commandsCache.get(workingDir);
  if (entry?.watcher) {
    entry.watcher.close();
  }
  commandsCache.delete(workingDir);
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Built-in Claude Code commands that are passed through to the SDK
 * These commands are handled internally by the SDK and don't require .md files
 */
const BUILT_IN_COMMANDS: SlashCommand[] = [
  {
    name: 'clear',
    description: 'Clear conversation history and start fresh',
    argumentHint: '',
  },
  {
    name: 'compact',
    description: 'Compact conversation history to reduce token usage',
    argumentHint: '',
  },
];

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content: string): { description: string; argumentHint: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { description: '', argumentHint: '' };
  }

  const frontmatter = frontmatterMatch[1];
  const descMatch = frontmatter.match(/description:\s*(.+)/);
  const argMatch = frontmatter.match(/argument-hint:\s*(.+)/);

  return {
    description: descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, '') : '',
    argumentHint: argMatch ? argMatch[1].trim().replace(/^["']|["']$/g, '') : '',
  };
}

/**
 * Load commands from disk (internal helper)
 */
function loadCommandsFromDisk(commandsDir: string): SlashCommand[] {
  const commands: SlashCommand[] = [];
  const files = fs.readdirSync(commandsDir);

  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(commandsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { description, argumentHint } = parseFrontmatter(content);

      commands.push({
        name: file.replace('.md', ''),
        description,
        argumentHint,
      });
    }
  }

  return commands;
}

/**
 * Load commands from session's .claude/commands directory
 * Uses in-memory cache with file watcher invalidation
 */
async function loadSessionCommands(workingDir: string, mode: string): Promise<SlashCommand[]> {
  // Check cache first
  const cached = commandsCache.get(workingDir);
  if (cached && isCacheValid(cached)) {
    return cached.commands;
  }

  const commandsDir = path.join(workingDir, '.claude', 'commands');

  // If commands don't exist yet (old session), set them up now
  if (!fs.existsSync(commandsDir)) {
    console.log(`📋 Commands not found, setting up for: ${workingDir.split('/').pop()}`);
    // Dynamic import to avoid circular dependency
    const commandSetup = await import('../commandSetup');
    commandSetup.setupSessionCommands(workingDir, mode);
  }

  // Load from disk
  const commands = loadCommandsFromDisk(commandsDir);

  // Set up file watcher for cache invalidation
  let watcher: FSWatcher | undefined;
  try {
    watcher = watch(commandsDir, { persistent: false }, () => {
      invalidateCache(workingDir);
    });
  } catch {
    // Watcher setup failed - cache will use TTL only
  }

  // Store in cache
  commandsCache.set(workingDir, {
    commands,
    timestamp: Date.now(),
    watcher,
  });

  return commands;
}

/**
 * Handle command-related API routes
 */
export async function handleCommandRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {

  // GET /api/sessions/:id/commands - Get slash commands for session
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/commands$/) && req.method === 'GET') {
    const sessionId = url.pathname.split('/')[3];
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customCommands = await loadSessionCommands(session.working_directory, session.mode);

    // Merge built-in commands with custom commands
    const commands = [...BUILT_IN_COMMANDS, ...customCommands];

    return new Response(JSON.stringify({ commands }), {
      headers: {
        'Content-Type': 'application/json',
        // Cache for 30 seconds - commands don't change often
        'Cache-Control': 'private, max-age=30',
      },
    });
  }

  return undefined;
}
