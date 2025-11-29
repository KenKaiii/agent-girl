/**
 * Database Unit Tests
 * Tests for session and message management
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

// Mock database implementation for testing
class TestSessionDb {
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
        mode TEXT DEFAULT 'general',
        context_input_tokens INTEGER DEFAULT 0,
        context_window INTEGER DEFAULT 200000,
        sdk_session_id TEXT
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

  createSession(title: string, workingDirectory: string, mode: string = 'general') {
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

  getAllSessions() {
    return this.db.query('SELECT * FROM sessions ORDER BY updated_at DESC').all() as any[];
  }

  deleteSession(id: string) {
    this.db.run('DELETE FROM messages WHERE session_id = ?', [id]);
    this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
  }

  addMessage(sessionId: string, type: 'user' | 'assistant', content: string) {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    this.db.run(`
      INSERT INTO messages (id, session_id, type, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `, [id, sessionId, type, content, timestamp]);

    // Update session
    this.db.run(`
      UPDATE sessions SET message_count = message_count + 1, updated_at = ? WHERE id = ?
    `, [timestamp, sessionId]);

    return { id, session_id: sessionId, type, content, timestamp };
  }

  getSessionMessages(sessionId: string) {
    return this.db.query('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId) as any[];
  }

  updateSessionMode(sessionId: string, mode: string) {
    this.db.run('UPDATE sessions SET mode = ?, updated_at = ? WHERE id = ?', [mode, new Date().toISOString(), sessionId]);
    return this.getSession(sessionId);
  }

  updateWorkingDirectory(sessionId: string, directory: string) {
    this.db.run('UPDATE sessions SET working_directory = ?, updated_at = ? WHERE id = ?', [directory, new Date().toISOString(), sessionId]);
    return this.getSession(sessionId);
  }

  updatePermissionMode(sessionId: string, mode: string) {
    this.db.run('UPDATE sessions SET permission_mode = ?, updated_at = ? WHERE id = ?', [mode, new Date().toISOString(), sessionId]);
    return this.getSession(sessionId);
  }

  close() {
    this.db.close();
  }
}

let sessionDb: TestSessionDb;

beforeEach(() => {
  sessionDb = new TestSessionDb();
});

afterEach(() => {
  sessionDb.close();
});

describe('Session Management', () => {
  it('should create a new session', () => {
    const session = sessionDb.createSession('Test Chat', '/Users/test', 'general');

    expect(session).toBeDefined();
    expect(session.id).toContain('session-');
    expect(session.title).toBe('Test Chat');
    expect(session.working_directory).toBe('/Users/test');
    expect(session.mode).toBe('general');
    expect(session.message_count).toBe(0);
  });

  it('should create sessions with different modes', () => {
    const generalSession = sessionDb.createSession('General Chat', '/test', 'general');
    const coderSession = sessionDb.createSession('Coder Chat', '/test', 'coder');
    const researchSession = sessionDb.createSession('Research Chat', '/test', 'intense-research');
    const unifiedSession = sessionDb.createSession('Unified Chat', '/test', 'unified');

    expect(generalSession.mode).toBe('general');
    expect(coderSession.mode).toBe('coder');
    expect(researchSession.mode).toBe('intense-research');
    expect(unifiedSession.mode).toBe('unified');
  });

  it('should retrieve a session by ID', () => {
    const created = sessionDb.createSession('Test', '/test', 'general');
    const retrieved = sessionDb.getSession(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.title).toBe('Test');
  });

  it('should list all sessions ordered by updated_at', async () => {
    sessionDb.createSession('First', '/test', 'general');
    await new Promise(resolve => setTimeout(resolve, 10));
    sessionDb.createSession('Second', '/test', 'general');
    await new Promise(resolve => setTimeout(resolve, 10));
    sessionDb.createSession('Third', '/test', 'general');

    const sessions = sessionDb.getAllSessions();

    expect(sessions.length).toBe(3);
    // Most recent first
    expect(sessions[0].title).toBe('Third');
  });

  it('should delete a session and its messages', () => {
    const session = sessionDb.createSession('To Delete', '/test', 'general');
    sessionDb.addMessage(session.id, 'user', 'Hello');
    sessionDb.addMessage(session.id, 'assistant', 'Hi there!');

    sessionDb.deleteSession(session.id);

    const retrieved = sessionDb.getSession(session.id);
    const messages = sessionDb.getSessionMessages(session.id);

    expect(retrieved).toBeNull();
    expect(messages.length).toBe(0);
  });

  it('should update session mode', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');
    const updated = sessionDb.updateSessionMode(session.id, 'coder');

    expect(updated.mode).toBe('coder');
  });

  it('should update working directory', () => {
    const session = sessionDb.createSession('Test', '/old/path', 'general');
    const updated = sessionDb.updateWorkingDirectory(session.id, '/new/path');

    expect(updated.working_directory).toBe('/new/path');
  });

  it('should update permission mode', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');

    const defaultMode = sessionDb.updatePermissionMode(session.id, 'default');
    expect(defaultMode.permission_mode).toBe('default');

    const bypassMode = sessionDb.updatePermissionMode(session.id, 'bypassPermissions');
    expect(bypassMode.permission_mode).toBe('bypassPermissions');

    const acceptEdits = sessionDb.updatePermissionMode(session.id, 'acceptEdits');
    expect(acceptEdits.permission_mode).toBe('acceptEdits');
  });
});

describe('Message Management', () => {
  it('should add a user message', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');
    const message = sessionDb.addMessage(session.id, 'user', 'Hello, Claude!');

    expect(message).toBeDefined();
    expect(message.id).toContain('msg-');
    expect(message.type).toBe('user');
    expect(message.content).toBe('Hello, Claude!');
    expect(message.session_id).toBe(session.id);
  });

  it('should add an assistant message', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');
    const message = sessionDb.addMessage(session.id, 'assistant', 'Hello! How can I help?');

    expect(message.type).toBe('assistant');
    expect(message.content).toBe('Hello! How can I help?');
  });

  it('should increment message count when adding messages', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');

    sessionDb.addMessage(session.id, 'user', 'Message 1');
    sessionDb.addMessage(session.id, 'assistant', 'Message 2');
    sessionDb.addMessage(session.id, 'user', 'Message 3');

    const updated = sessionDb.getSession(session.id);
    expect(updated.message_count).toBe(3);
  });

  it('should retrieve messages in order', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');

    sessionDb.addMessage(session.id, 'user', 'First');
    sessionDb.addMessage(session.id, 'assistant', 'Second');
    sessionDb.addMessage(session.id, 'user', 'Third');

    const messages = sessionDb.getSessionMessages(session.id);

    expect(messages.length).toBe(3);
    expect(messages[0].content).toBe('First');
    expect(messages[1].content).toBe('Second');
    expect(messages[2].content).toBe('Third');
  });

  it('should store complex message content (JSON)', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');

    const complexContent = JSON.stringify([
      { type: 'text', text: 'Hello' },
      { type: 'tool_use', name: 'bash', input: { command: 'ls' } }
    ]);

    const message = sessionDb.addMessage(session.id, 'assistant', complexContent);
    const retrieved = sessionDb.getSessionMessages(session.id)[0];

    expect(retrieved.content).toBe(complexContent);
    const parsed = JSON.parse(retrieved.content);
    expect(parsed[0].type).toBe('text');
    expect(parsed[1].type).toBe('tool_use');
  });

  it('should handle empty messages', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');
    const message = sessionDb.addMessage(session.id, 'user', '');

    expect(message.content).toBe('');
  });

  it('should handle special characters in messages', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');
    const specialContent = "Test with 'quotes' and \"double quotes\" and `backticks` and 日本語";

    const message = sessionDb.addMessage(session.id, 'user', specialContent);
    const retrieved = sessionDb.getSessionMessages(session.id)[0];

    expect(retrieved.content).toBe(specialContent);
  });
});

describe('Session Timestamps', () => {
  it('should set created_at and updated_at on creation', () => {
    const before = new Date().toISOString();
    const session = sessionDb.createSession('Test', '/test', 'general');
    const after = new Date().toISOString();

    expect(session.created_at).toBeDefined();
    expect(session.updated_at).toBeDefined();
    expect(session.created_at >= before).toBe(true);
    expect(session.created_at <= after).toBe(true);
  });

  it('should update updated_at when adding messages', async () => {
    const session = sessionDb.createSession('Test', '/test', 'general');
    const originalUpdatedAt = session.updated_at;

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    sessionDb.addMessage(session.id, 'user', 'Hello');
    const updated = sessionDb.getSession(session.id);

    expect(updated.updated_at > originalUpdatedAt).toBe(true);
  });
});

describe('Edge Cases', () => {
  it('should return null for non-existent session', () => {
    const session = sessionDb.getSession('non-existent-id');
    expect(session).toBeNull();
  });

  it('should return empty array for session with no messages', () => {
    const session = sessionDb.createSession('Empty', '/test', 'general');
    const messages = sessionDb.getSessionMessages(session.id);

    expect(messages).toEqual([]);
  });

  it('should handle very long messages', () => {
    const session = sessionDb.createSession('Test', '/test', 'general');
    const longContent = 'x'.repeat(100000); // 100KB message

    const message = sessionDb.addMessage(session.id, 'assistant', longContent);
    const retrieved = sessionDb.getSessionMessages(session.id)[0];

    expect(retrieved.content.length).toBe(100000);
  });

  it('should handle many sessions', () => {
    for (let i = 0; i < 100; i++) {
      sessionDb.createSession(`Session ${i}`, '/test', 'general');
    }

    const sessions = sessionDb.getAllSessions();
    expect(sessions.length).toBe(100);
  });

  it('should handle many messages in one session', () => {
    const session = sessionDb.createSession('Busy Chat', '/test', 'general');

    for (let i = 0; i < 500; i++) {
      sessionDb.addMessage(session.id, i % 2 === 0 ? 'user' : 'assistant', `Message ${i}`);
    }

    const messages = sessionDb.getSessionMessages(session.id);
    expect(messages.length).toBe(500);

    const updated = sessionDb.getSession(session.id);
    expect(updated.message_count).toBe(500);
  });
});
