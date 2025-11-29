/**
 * Session API Routes
 * Handles all session-related REST endpoints
 */

import { sessionDb } from "../database";
import { backgroundProcessManager } from "../backgroundProcessManager";
import { sessionStreamManager } from "../sessionStreamManager";
import { setupSessionCommands } from "../commandSetup";

/**
 * Handle session-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleSessionRoutes(
  req: Request,
  url: URL,
  activeQueries: Map<string, unknown>
): Promise<Response | undefined> {

  // GET /api/sessions - List all sessions
  if (url.pathname === '/api/sessions' && req.method === 'GET') {
    // Import any existing folders not in the database
    const { imported } = sessionDb.importExistingFolders();

    const { sessions, recreatedDirectories } = sessionDb.getSessions();

    return new Response(JSON.stringify({
      sessions,
      imported: imported.length > 0 ? imported : undefined,
      warning: recreatedDirectories.length > 0
        ? `Recreated ${recreatedDirectories.length} missing director${recreatedDirectories.length === 1 ? 'y' : 'ies'}`
        : undefined
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/sessions - Create new session
  if (url.pathname === '/api/sessions' && req.method === 'POST') {
    const body = await req.json() as { title?: string; workingDirectory?: string; mode?: 'general' | 'coder' | 'intense-research' | 'spark' };
    const session = sessionDb.createSession(body.title || 'New Chat', body.workingDirectory, body.mode || 'general');
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /api/sessions/:id - Get session by ID
  if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'GET') {
    const sessionId = url.pathname.split('/').pop()!;
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // DELETE /api/sessions/:id - Delete session
  if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'DELETE') {
    const sessionId = url.pathname.split('/').pop()!;

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
  if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'PATCH') {
    const sessionId = url.pathname.split('/').pop()!;
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
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/messages$/) && req.method === 'GET') {
    const sessionId = url.pathname.split('/')[3];
    const messages = sessionDb.getSessionMessages(sessionId);

    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PATCH /api/sessions/:id/directory - Update working directory
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/directory$/) && req.method === 'PATCH') {
    const sessionId = url.pathname.split('/')[3];
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
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/mode$/) && req.method === 'PATCH') {
    const sessionId = url.pathname.split('/')[3];
    const body = await req.json() as { mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' };

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
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/chat-mode$/) && req.method === 'PATCH') {
    const sessionId = url.pathname.split('/')[3];
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
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/export$/) && req.method === 'GET') {
    const sessionId = url.pathname.split('/')[3];
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

  // POST /api/sessions/import - Import session from JSON
  if (url.pathname === '/api/sessions/import' && req.method === 'POST') {
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
  if (url.pathname === '/api/sessions/search' && req.method === 'GET') {
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
