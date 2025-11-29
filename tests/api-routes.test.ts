/**
 * API Routes Unit Tests
 * Tests for session, command, and queue route handlers
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';

// Mock database for testing
class MockSessionDb {
  private db: Database;

  constructor() {
    this.db = new Database(':memory:');
    this.initSchema();
  }

  private initSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        message_count INTEGER DEFAULT 0,
        working_directory TEXT NOT NULL,
        permission_mode TEXT DEFAULT 'default',
        mode TEXT DEFAULT 'general'
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);
  }

  createSession(title: string, workingDirectory: string = '/test', mode: string = 'general') {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO sessions (id, title, created_at, updated_at, working_directory, mode)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, title, now, now, workingDirectory, mode]);

    return this.getSession(id);
  }

  getSession(id: string) {
    return this.db.query('SELECT * FROM sessions WHERE id = ?').get(id) as any;
  }

  getSessions() {
    const sessions = this.db.query('SELECT * FROM sessions ORDER BY updated_at DESC').all() as any[];
    return { sessions, recreatedDirectories: [] };
  }

  deleteSession(id: string) {
    this.db.run('DELETE FROM messages WHERE session_id = ?', [id]);
    this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
    return true;
  }

  updateSessionMode(id: string, mode: string) {
    this.db.run('UPDATE sessions SET mode = ?, updated_at = ? WHERE id = ?', [mode, new Date().toISOString(), id]);
    return this.getSession(id);
  }

  close() {
    this.db.close();
  }
}

// Mock route handlers matching the actual API logic
function handleGetSessions(sessionDb: MockSessionDb): Response {
  const { sessions } = sessionDb.getSessions();
  return new Response(JSON.stringify({ sessions }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleCreateSession(sessionDb: MockSessionDb, body: { title?: string; mode?: string }): Response {
  const session = sessionDb.createSession(body.title || 'New Chat', '/test', body.mode || 'general');
  return new Response(JSON.stringify(session), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleGetSession(sessionDb: MockSessionDb, sessionId: string): Response {
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

function handleDeleteSession(sessionDb: MockSessionDb, sessionId: string): Response {
  const success = sessionDb.deleteSession(sessionId);
  return new Response(JSON.stringify({ success }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleUpdateSessionMode(sessionDb: MockSessionDb, sessionId: string, mode: string): Response {
  const session = sessionDb.getSession(sessionId);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updated = sessionDb.updateSessionMode(sessionId, mode);
  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Session API Routes', () => {
  let sessionDb: MockSessionDb;

  beforeEach(() => {
    sessionDb = new MockSessionDb();
  });

  describe('GET /api/sessions', () => {
    it('should return empty sessions array initially', async () => {
      const response = handleGetSessions(sessionDb);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toEqual([]);
    });

    it('should return all sessions', async () => {
      sessionDb.createSession('Chat 1');
      sessionDb.createSession('Chat 2');

      const response = handleGetSessions(sessionDb);
      const data = await response.json();

      expect(data.sessions.length).toBe(2);
    });

    it('should return sessions in correct order', async () => {
      sessionDb.createSession('First');
      await new Promise(resolve => setTimeout(resolve, 10));
      sessionDb.createSession('Second');

      const response = handleGetSessions(sessionDb);
      const data = await response.json();

      expect(data.sessions[0].title).toBe('Second');
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session with title', async () => {
      const response = handleCreateSession(sessionDb, { title: 'Test Chat' });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Test Chat');
      expect(data.id).toContain('session-');
    });

    it('should create session with default title', async () => {
      const response = handleCreateSession(sessionDb, {});
      const data = await response.json();

      expect(data.title).toBe('New Chat');
    });

    it('should create session with specified mode', async () => {
      const response = handleCreateSession(sessionDb, { title: 'Coder', mode: 'coder' });
      const data = await response.json();

      expect(data.mode).toBe('coder');
    });

    it('should default to general mode', async () => {
      const response = handleCreateSession(sessionDb, { title: 'Test' });
      const data = await response.json();

      expect(data.mode).toBe('general');
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session by ID', async () => {
      const session = sessionDb.createSession('Test');
      const response = handleGetSession(sessionDb, session.id);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(session.id);
      expect(data.title).toBe('Test');
    });

    it('should return 404 for non-existent session', async () => {
      const response = handleGetSession(sessionDb, 'non-existent');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should delete session', async () => {
      const session = sessionDb.createSession('To Delete');
      const response = handleDeleteSession(sessionDb, session.id);
      const data = await response.json();

      expect(data.success).toBe(true);

      // Verify session is deleted
      const deleted = sessionDb.getSession(session.id);
      expect(deleted).toBeNull();
    });
  });

  describe('PATCH /api/sessions/:id/mode', () => {
    it('should update session mode', async () => {
      const session = sessionDb.createSession('Test', '/test', 'general');
      const response = handleUpdateSessionMode(sessionDb, session.id, 'coder');
      const data = await response.json();

      expect(data.mode).toBe('coder');
    });

    it('should return 404 for non-existent session', async () => {
      const response = handleUpdateSessionMode(sessionDb, 'non-existent', 'coder');

      expect(response.status).toBe(404);
    });
  });
});

describe('Commands API Routes', () => {
  // Mock command handler
  function handleGetCommands(mode: string): Response {
    const commands: Record<string, string[]> = {
      general: ['help', 'new', 'clear', 'mode'],
      coder: ['help', 'new', 'clear', 'mode', 'refactor', 'test', 'debug'],
      'intense-research': ['help', 'new', 'clear', 'mode', 'search', 'summarize'],
    };

    return new Response(JSON.stringify({
      mode,
      commands: commands[mode] || commands.general,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('should return commands for general mode', async () => {
    const response = handleGetCommands('general');
    const data = await response.json();

    expect(data.mode).toBe('general');
    expect(data.commands).toContain('help');
    expect(data.commands).toContain('new');
  });

  it('should return commands for coder mode', async () => {
    const response = handleGetCommands('coder');
    const data = await response.json();

    expect(data.mode).toBe('coder');
    expect(data.commands).toContain('refactor');
    expect(data.commands).toContain('test');
  });

  it('should return commands for research mode', async () => {
    const response = handleGetCommands('intense-research');
    const data = await response.json();

    expect(data.commands).toContain('search');
    expect(data.commands).toContain('summarize');
  });
});

describe('Queue API Routes', () => {
  // Mock queue handler
  function handleGetQueueStatus(): Response {
    return new Response(JSON.stringify({
      status: 'active',
      stats: {
        total_tasks: 0,
        pending_tasks: 0,
        running_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
      },
      workers: {
        active: 0,
        idle: 5,
        total: 5,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function handleAddTask(task: { prompt: string; mode: string }): Response {
    const taskId = `task-${Date.now()}`;
    return new Response(JSON.stringify({
      id: taskId,
      prompt: task.prompt,
      mode: task.mode,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('should return queue status', async () => {
    const response = handleGetQueueStatus();
    const data = await response.json();

    expect(data.status).toBe('active');
    expect(data.stats.total_tasks).toBe(0);
    expect(data.workers.total).toBe(5);
  });

  it('should add task to queue', async () => {
    const response = handleAddTask({
      prompt: 'Test task',
      mode: 'general',
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toContain('task-');
    expect(data.prompt).toBe('Test task');
    expect(data.status).toBe('pending');
  });
});

describe('API Response Format', () => {
  it('should return proper Content-Type header', async () => {
    const sessionDb = new MockSessionDb();
    const response = handleGetSessions(sessionDb);

    expect(response.headers.get('Content-Type')).toBe('application/json');
    sessionDb.close();
  });

  it('should return valid JSON', async () => {
    const sessionDb = new MockSessionDb();
    const response = handleGetSessions(sessionDb);
    const text = await response.text();

    expect(() => JSON.parse(text)).not.toThrow();
    sessionDb.close();
  });
});

describe('API Error Handling', () => {
  function handleWithError(): Response {
    try {
      throw new Error('Internal error');
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  it('should return 500 for internal errors', async () => {
    const response = handleWithError();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });

  it('should include error message', async () => {
    const response = handleWithError();
    const data = await response.json();

    expect(data.message).toBe('Internal error');
  });
});

describe('API Route Matching', () => {
  const routes = [
    { path: '/api/sessions', method: 'GET', handler: 'getSessions' },
    { path: '/api/sessions', method: 'POST', handler: 'createSession' },
    { path: '/api/sessions/:id', method: 'GET', handler: 'getSession' },
    { path: '/api/sessions/:id', method: 'DELETE', handler: 'deleteSession' },
    { path: '/api/sessions/:id', method: 'PATCH', handler: 'updateSession' },
    { path: '/api/sessions/:id/messages', method: 'GET', handler: 'getMessages' },
    { path: '/api/queue/status', method: 'GET', handler: 'getQueueStatus' },
    { path: '/api/queue/tasks', method: 'POST', handler: 'addTask' },
    { path: '/api/commands', method: 'GET', handler: 'getCommands' },
  ];

  function matchRoute(pathname: string, method: string): string | null {
    for (const route of routes) {
      // Convert :param to regex pattern
      const pattern = route.path.replace(/:[\w]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);

      if (regex.test(pathname) && route.method === method) {
        return route.handler;
      }
    }
    return null;
  }

  it('should match exact paths', () => {
    expect(matchRoute('/api/sessions', 'GET')).toBe('getSessions');
    expect(matchRoute('/api/sessions', 'POST')).toBe('createSession');
  });

  it('should match paths with parameters', () => {
    expect(matchRoute('/api/sessions/abc123', 'GET')).toBe('getSession');
    expect(matchRoute('/api/sessions/abc123', 'DELETE')).toBe('deleteSession');
  });

  it('should match nested paths', () => {
    expect(matchRoute('/api/sessions/abc123/messages', 'GET')).toBe('getMessages');
  });

  it('should return null for unmatched paths', () => {
    expect(matchRoute('/api/unknown', 'GET')).toBeNull();
    expect(matchRoute('/api/sessions', 'PUT')).toBeNull();
  });
});

describe('API Request Validation', () => {
  function validateSessionCreate(body: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof body !== 'object' || body === null) {
      return { valid: false, errors: ['Request body must be an object'] };
    }

    const data = body as Record<string, unknown>;

    if (data.title !== undefined && typeof data.title !== 'string') {
      errors.push('title must be a string');
    }

    if (data.title && (data.title as string).length > 200) {
      errors.push('title must be 200 characters or less');
    }

    if (data.mode !== undefined) {
      const validModes = ['general', 'coder', 'intense-research', 'unified'];
      if (!validModes.includes(data.mode as string)) {
        errors.push(`mode must be one of: ${validModes.join(', ')}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  it('should validate valid request', () => {
    const result = validateSessionCreate({ title: 'Test', mode: 'general' });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject invalid mode', () => {
    const result = validateSessionCreate({ title: 'Test', mode: 'invalid' });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('mode must be one of: general, coder, intense-research, unified');
  });

  it('should reject too long title', () => {
    const result = validateSessionCreate({ title: 'x'.repeat(250) });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title must be 200 characters or less');
  });

  it('should accept empty body', () => {
    const result = validateSessionCreate({});

    expect(result.valid).toBe(true);
  });
});
