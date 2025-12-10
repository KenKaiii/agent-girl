/**
 * Session API Routes
 * Handles all session-related REST endpoints
 *
 * Performance: Pre-compiled regex patterns for route matching
 * Performance: Import folders only once per server startup (not every request)
 */

import { sessionDb } from "../database";
import { backgroundProcessManager } from "../backgroundProcessManager";
import { sessionStreamManager } from "../sessionStreamManager";
import { setupSessionCommands } from "../commandSetup";
import { projectRegistry } from "../projectRegistry";

// Track if we've imported existing folders this server session
let hasImportedFolders = false;
const pendingImport: Promise<{ imported: string[] }> | null = null;

// Pre-compiled regex patterns for route matching (compiled once at module load)
const ROUTE_PATTERNS = {
  SESSION_BY_ID: /^\/api\/sessions\/([^/]+)$/,
  SESSION_MESSAGES: /^\/api\/sessions\/([^/]+)\/messages$/,
  SESSION_DIRECTORY: /^\/api\/sessions\/([^/]+)\/directory$/,
  SESSION_MODE: /^\/api\/sessions\/([^/]+)\/mode$/,
  SESSION_CHAT_MODE: /^\/api\/sessions\/([^/]+)\/chat-mode$/,
  SESSION_EXPORT: /^\/api\/sessions\/([^/]+)\/export$/,
  SESSION_EXPORT_MD: /^\/api\/sessions\/([^/]+)\/export\/markdown$/,
  SESSION_EXPORT_SUMMARY: /^\/api\/sessions\/([^/]+)\/export\/summary$/,
  SESSION_STATS: /^\/api\/sessions\/([^/]+)\/stats$/,
} as const;

/**
 * Extract session ID from pathname using pre-compiled pattern
 */
function extractSessionId(pathname: string, pattern: RegExp): string | null {
  const match = pathname.match(pattern);
  return match ? match[1] : null;
}

/**
 * Handle session-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleSessionRoutes(
  req: Request,
  url: URL,
  activeQueries: Map<string, unknown>
): Promise<Response | undefined> {
  const { pathname } = url;
  const { method } = req;

  // Fast path: Skip if not an API route
  if (!pathname.startsWith('/api/sessions')) {
    return undefined;
  }

  // GET /api/sessions - List all sessions (with optional pagination)
  if (pathname === '/api/sessions' && method === 'GET') {
    // Import existing folders only once per server session (non-blocking for subsequent requests)
    let imported: string[] = [];

    if (!hasImportedFolders) {
      // First request: do synchronous import (one-time cost)
      if (!pendingImport) {
        hasImportedFolders = true;
        const result = sessionDb.importExistingFolders();
        imported = result.imported;
      }
    }
    // Subsequent requests skip import entirely for faster response

    // Check for pagination params
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const cursor = url.searchParams.get('cursor');

    // Use paginated endpoint if any pagination param is provided
    if (limit || offset || cursor) {
      const result = sessionDb.getSessionsPaginated({
        limit: limit ? parseInt(limit, 10) : 30,
        offset: offset ? parseInt(offset, 10) : 0,
        cursor: cursor || undefined,
      });

      // Strip large fields for list view - keep essential UI data + working_directory
      const lightSessions = result.data.map(s => ({
        id: s.id,
        title: s.title,
        created_at: s.created_at,
        updated_at: s.updated_at,
        mode: s.mode,
        message_count: s.message_count,
        context_percentage: s.context_percentage,
        working_directory: s.working_directory,
        permission_mode: s.permission_mode,
      }));

      return new Response(JSON.stringify({
        sessions: lightSessions,
        total: result.total,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
        imported: imported.length > 0 ? imported : undefined,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default: return all sessions (skip directory validation for speed)
    const { sessions } = sessionDb.getSessions(true);

    // Strip large fields for list view - only keep essential UI data
    const lightSessions = sessions.map(s => ({
      id: s.id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.updated_at,
      mode: s.mode,
      message_count: s.message_count,
      context_percentage: s.context_percentage,
    }));

    return new Response(JSON.stringify({
      sessions: lightSessions,
      imported: imported.length > 0 ? imported : undefined,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/sessions - Create new session
  if (pathname === '/api/sessions' && method === 'POST') {
    const body = await req.json() as { title?: string; workingDirectory?: string; mode?: 'general' | 'coder' | 'intense-research' | 'spark' };
    const session = sessionDb.createSession(body.title || 'New Chat', body.workingDirectory, body.mode || 'general');
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/sessions/cleanup - Clean up empty folders
  if (pathname === '/api/sessions/cleanup' && method === 'POST') {
    const result = sessionDb.cleanupEmptyFolders();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /api/sessions/:id - Get session by ID
  const getSessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_BY_ID);
  if (getSessionId && method === 'GET') {
    const sessionId = getSessionId;
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auto-match projects if session has a working directory
    let projects = projectRegistry.getProjectsBySession(sessionId);

    if (session.working_directory) {
      // Try to match additional projects by directory
      const matched = projectRegistry.autoMatchForSession(sessionId, session.working_directory);
      if (matched.length > 0) {
        // Merge matched with existing, avoiding duplicates
        const existingIds = new Set(projects.map(p => p.id));
        for (const project of matched) {
          if (!existingIds.has(project.id)) {
            projects.push(project);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      ...session,
      projects, // Include linked projects in response
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // DELETE /api/sessions/:id - Delete session
  if (getSessionId && method === 'DELETE') {
    const sessionId = getSessionId;

    // Clean up background processes for this session before deleting
    await backgroundProcessManager.cleanupSession(sessionId);

    // Clean up SDK stream (aborts subprocess, completes message queue)
    sessionStreamManager.cleanupSession(sessionId, 'session_deleted');

    // Also delete the query
    activeQueries.delete(sessionId);

    const success = sessionDb.deleteSession(sessionId);

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PATCH /api/sessions/:id - Rename session folder
  if (getSessionId && method === 'PATCH') {
    const sessionId = getSessionId;
    const body = await req.json() as { folderName: string };

    console.log('📝 API: Rename folder request:', {
      sessionId,
      folderName: body.folderName
    });

    const result = sessionDb.renameFolderAndSession(sessionId, body.folderName);

    if (result.success) {
      const session = sessionDb.getSession(sessionId);

      // Clear SDK session ID to prevent resume with old directory path in transcripts
      sessionDb.updateSdkSessionId(sessionId, null);

      // Cleanup SDK stream to force respawn with new cwd on next message
      sessionStreamManager.cleanupSession(sessionId, 'folder_renamed');
      activeQueries.delete(sessionId);

      console.log(`🔄 SDK subprocess will restart with new folder path on next message (no resume)`);

      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/sessions/:id/messages - Get session messages
  const messagesSessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_MESSAGES);
  if (messagesSessionId && method === 'GET') {
    const sessionId = messagesSessionId;
    const messages = sessionDb.getSessionMessages(sessionId);

    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PATCH /api/sessions/:id/directory - Update working directory
  const directorySessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_DIRECTORY);
  if (directorySessionId && method === 'PATCH') {
    const sessionId = directorySessionId;
    const body = await req.json() as { workingDirectory: string };

    console.log('📁 API: Update working directory request:', {
      sessionId,
      directory: body.workingDirectory
    });

    const success = sessionDb.updateWorkingDirectory(sessionId, body.workingDirectory);

    if (success) {
      // Get updated session to retrieve mode
      const session = sessionDb.getSession(sessionId);

      if (session) {
        // Setup slash commands in the new directory
        setupSessionCommands(session.working_directory, session.mode);
      }

      // Clear SDK session ID to prevent resume with old directory's transcript files
      sessionDb.updateSdkSessionId(sessionId, null);

      // Cleanup SDK stream to force respawn with new cwd on next message
      sessionStreamManager.cleanupSession(sessionId, 'directory_changed');
      activeQueries.delete(sessionId);

      console.log(`🔄 SDK subprocess will restart with new cwd on next message (no resume)`);

      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid directory or session not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // PATCH /api/sessions/:id/mode - Update permission mode
  const modeSessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_MODE);
  if (modeSessionId && method === 'PATCH') {
    const sessionId = modeSessionId;
    const body = await req.json() as { mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'autonom' };

    const success = sessionDb.updatePermissionMode(sessionId, body.mode);

    if (success) {
      const session = sessionDb.getSession(sessionId);
      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // PATCH /api/sessions/:id/chat-mode - Update session chat mode (general, coder, etc)
  const chatModeSessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_CHAT_MODE);
  if (chatModeSessionId && method === 'PATCH') {
    const sessionId = chatModeSessionId;
    const body = await req.json() as { mode: 'general' | 'coder' | 'intense-research' | 'spark' };

    const success = sessionDb.updateSessionMode(sessionId, body.mode);

    if (success) {
      const session = sessionDb.getSession(sessionId);
      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/sessions/:id/export - Export session with all messages
  const exportSessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_EXPORT);
  if (exportSessionId && method === 'GET') {
    const sessionId = exportSessionId;
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = sessionDb.getSessionMessages(sessionId);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session: {
        title: session.title,
        mode: session.mode,
        permissionMode: session.permission_mode,
        createdAt: session.created_at,
        messageCount: session.message_count,
      },
      messages: messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    };

    const filename = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // GET /api/sessions/:id/export/markdown - Export session as Markdown
  const exportMdSessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_EXPORT_MD);
  if (exportMdSessionId && method === 'GET') {
    const sessionId = exportMdSessionId;
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = sessionDb.getSessionMessages(sessionId);
    const exportDate = new Date().toISOString().split('T')[0];

    // Build markdown content
    let markdown = `# ${session.title}\n\n`;
    markdown += `> **Mode:** ${session.mode || 'general'} | **Created:** ${new Date(session.created_at).toLocaleString()} | **Messages:** ${session.message_count}\n\n`;
    markdown += `---\n\n`;

    for (const msg of messages) {
      const time = new Date(msg.timestamp).toLocaleTimeString();

      if (msg.type === 'user') {
        markdown += `## 👤 User (${time})\n\n`;
        markdown += `${msg.content}\n\n`;
      } else {
        markdown += `## 🤖 Assistant (${time})\n\n`;
        // Parse content if it's JSON (assistant messages store structured content)
        try {
          const content = JSON.parse(msg.content);
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text') {
                markdown += `${block.text}\n\n`;
              } else if (block.type === 'tool_use') {
                markdown += `<details>\n<summary>🔧 Tool: ${block.name}</summary>\n\n\`\`\`json\n${JSON.stringify(block.input, null, 2)}\n\`\`\`\n</details>\n\n`;
              } else if (block.type === 'thinking') {
                markdown += `<details>\n<summary>💭 Thinking</summary>\n\n${block.thinking}\n</details>\n\n`;
              }
            }
          } else {
            markdown += `${msg.content}\n\n`;
          }
        } catch {
          markdown += `${msg.content}\n\n`;
        }
      }
      markdown += `---\n\n`;
    }

    markdown += `\n*Exported from Agent Girl on ${exportDate}*\n`;

    const filename = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${exportDate}.md`;

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // GET /api/sessions/:id/export/summary - Export summary (text-only, no code/tools)
  const exportSummarySessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_EXPORT_SUMMARY);
  if (exportSummarySessionId && method === 'GET') {
    const sessionId = exportSummarySessionId;
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = sessionDb.getSessionMessages(sessionId);
    const exportDate = new Date().toISOString().split('T')[0];

    // Build summary - text only, no code blocks or tool outputs
    let summary = `# ${session.title} - Summary\n\n`;
    summary += `**Date:** ${new Date(session.created_at).toLocaleDateString()}\n`;
    summary += `**Mode:** ${session.mode || 'general'}\n`;
    summary += `**Messages:** ${session.message_count}\n\n`;
    summary += `---\n\n`;

    for (const msg of messages) {
      if (msg.type === 'user') {
        summary += `**User:** ${msg.content}\n\n`;
      } else {
        // Extract only text content from assistant messages
        try {
          const content = JSON.parse(msg.content);
          if (Array.isArray(content)) {
            const textBlocks = content.filter(b => b.type === 'text').map(b => b.text);
            if (textBlocks.length > 0) {
              // Remove code blocks from text
              const cleanText = textBlocks.join('\n').replace(/```[\s\S]*?```/g, '[code block]').trim();
              if (cleanText) {
                summary += `**Assistant:** ${cleanText}\n\n`;
              }
            }
          } else {
            summary += `**Assistant:** ${msg.content.replace(/```[\s\S]*?```/g, '[code block]')}\n\n`;
          }
        } catch {
          summary += `**Assistant:** ${msg.content.replace(/```[\s\S]*?```/g, '[code block]')}\n\n`;
        }
      }
    }

    const filename = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_summary_${exportDate}.md`;

    return new Response(summary, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // GET /api/sessions/:id/stats - Get session statistics
  const statsSessionId = extractSessionId(pathname, ROUTE_PATTERNS.SESSION_STATS);
  if (statsSessionId && method === 'GET') {
    const sessionId = statsSessionId;
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = sessionDb.getSessionMessages(sessionId);

    // Calculate statistics
    let userMessages = 0;
    let assistantMessages = 0;
    let totalChars = 0;
    let toolUseCount = 0;
    let codeBlockCount = 0;
    const toolTypes: Record<string, number> = {};

    for (const msg of messages) {
      if (msg.type === 'user') {
        userMessages++;
        totalChars += msg.content.length;
      } else {
        assistantMessages++;
        try {
          const content = JSON.parse(msg.content);
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text') {
                totalChars += block.text?.length || 0;
                // Count code blocks in text
                const codeMatches = block.text?.match(/```/g);
                if (codeMatches) codeBlockCount += codeMatches.length / 2;
              } else if (block.type === 'tool_use') {
                toolUseCount++;
                const toolName = block.name || 'unknown';
                toolTypes[toolName] = (toolTypes[toolName] || 0) + 1;
              }
            }
          }
        } catch {
          totalChars += msg.content.length;
        }
      }
    }

    // Estimate tokens (rough: 1 token ≈ 4 chars)
    const estimatedTokens = Math.round(totalChars / 4);

    // Calculate duration
    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];
    const duration = firstMsg && lastMsg
      ? new Date(lastMsg.timestamp).getTime() - new Date(firstMsg.timestamp).getTime()
      : 0;

    const stats = {
      session: {
        id: session.id,
        title: session.title,
        mode: session.mode,
        createdAt: session.created_at,
      },
      messages: {
        total: messages.length,
        user: userMessages,
        assistant: assistantMessages,
      },
      content: {
        totalChars,
        estimatedTokens,
        codeBlocks: Math.floor(codeBlockCount),
        toolUses: toolUseCount,
        toolBreakdown: toolTypes,
      },
      timing: {
        durationMs: duration,
        durationMinutes: Math.round(duration / 60000),
        firstMessage: firstMsg?.timestamp,
        lastMessage: lastMsg?.timestamp,
      },
    };

    return new Response(JSON.stringify(stats, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/sessions/import - Import session from JSON
  if (pathname === '/api/sessions/import' && method === 'POST') {
    try {
      const importData = await req.json() as {
        version?: string;
        session: {
          title: string;
          mode?: string;
          permissionMode?: string;
        };
        messages: Array<{
          type: 'user' | 'assistant';
          content: string;
          timestamp?: string;
        }>;
      };

      // Validate import data
      if (!importData.session || !importData.messages) {
        return new Response(JSON.stringify({ error: 'Invalid import format: missing session or messages' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create new session
      const session = sessionDb.createSession(
        `${importData.session.title} (imported)`,
        undefined,
        (importData.session.mode as 'general' | 'coder' | 'intense-research') || 'general'
      );

      // Import messages
      let importedCount = 0;
      for (const msg of importData.messages) {
        if (msg.type === 'user' || msg.type === 'assistant') {
          sessionDb.addMessage(session.id, msg.type, msg.content);
          importedCount++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        session,
        importedMessages: importedCount,
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to parse import data',
        details: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/sessions/search - Search messages across all sessions
  if (pathname === '/api/sessions/search' && method === 'GET') {
    const query = url.searchParams.get('q') || '';
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    if (!query.trim()) {
      return new Response(JSON.stringify({ results: [], query: '' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = sessionDb.searchMessages(query, sessionId, limit);

    return new Response(JSON.stringify({
      results,
      query,
      count: results.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Route not handled by this module
  return undefined;
}
