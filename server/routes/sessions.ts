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
    const { sessions, recreatedDirectories } = sessionDb.getSessions();

    return new Response(JSON.stringify({
      sessions,
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

    const result = sessionDb.renameFolderAndSession(sessionId, body.folderName);

    if (result.success) {
      const session = sessionDb.getSession(sessionId);

      // Clear SDK session ID to prevent resume with old directory path in transcripts
      sessionDb.updateSdkSessionId(sessionId, null);

      // Cleanup SDK stream to force respawn with new cwd on next message
      sessionStreamManager.cleanupSession(sessionId, 'folder_renamed');
      activeQueries.delete(sessionId);

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

  // Route not handled by this module
  return undefined;
}
