/**
 * Integration Tests
 * End-to-end workflow tests for agent-girl
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';

// Full integration database with all tables
class IntegrationDb {
  public db: Database;

  constructor() {
    this.db = new Database(':memory:');
    this.initSchema();
  }

  private initSchema() {
    // Sessions table
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

    // Messages table
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

    // Queue tasks table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS queue_tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        mode TEXT DEFAULT 'general',
        model TEXT DEFAULT 'claude-3-5-sonnet',
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        result TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
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

  getAllSessions() {
    return this.db.query('SELECT * FROM sessions ORDER BY updated_at DESC').all() as any[];
  }

  deleteSession(id: string) {
    this.db.run('DELETE FROM messages WHERE session_id = ?', [id]);
    this.db.run('DELETE FROM queue_tasks WHERE session_id = ?', [id]);
    this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
  }

  addMessage(sessionId: string, type: 'user' | 'assistant', content: string) {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    this.db.run(`
      INSERT INTO messages (id, session_id, type, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `, [id, sessionId, type, content, timestamp]);

    this.db.run(`
      UPDATE sessions SET message_count = message_count + 1, updated_at = ? WHERE id = ?
    `, [timestamp, sessionId]);

    return { id, session_id: sessionId, type, content, timestamp };
  }

  getSessionMessages(sessionId: string) {
    return this.db.query('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId) as any[];
  }

  searchMessages(query: string, sessionId?: string, limit: number = 50) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    const sql = sessionId
      ? `SELECT m.id, m.session_id, s.title as session_title, m.type, m.content, m.timestamp
         FROM messages m
         JOIN sessions s ON m.session_id = s.id
         WHERE m.session_id = ? AND LOWER(m.content) LIKE ?
         ORDER BY m.timestamp DESC
         LIMIT ?`
      : `SELECT m.id, m.session_id, s.title as session_title, m.type, m.content, m.timestamp
         FROM messages m
         JOIN sessions s ON m.session_id = s.id
         WHERE LOWER(m.content) LIKE ?
         ORDER BY m.timestamp DESC
         LIMIT ?`;

    const params = sessionId
      ? [sessionId, searchTerm, limit]
      : [searchTerm, limit];

    const results = this.db.query(sql).all(...params) as any[];

    return results.map(row => {
      const lowerContent = row.content.toLowerCase();
      const matchIndex = lowerContent.indexOf(query.toLowerCase());

      let match_preview = '';
      if (matchIndex !== -1) {
        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(row.content.length, matchIndex + query.length + 40);
        match_preview = (start > 0 ? '...' : '') +
          row.content.slice(start, end) +
          (end < row.content.length ? '...' : '');
      } else {
        match_preview = row.content.slice(0, 80) + (row.content.length > 80 ? '...' : '');
      }

      return { ...row, match_preview };
    });
  }

  exportSession(sessionId: string) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const messages = this.getSessionMessages(sessionId);

    return {
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
  }

  importSession(importData: any) {
    if (!importData.session || !importData.messages) {
      throw new Error('Invalid import format');
    }

    const session = this.createSession(
      `${importData.session.title} (imported)`,
      '/test',
      importData.session.mode || 'general'
    );

    let importedCount = 0;
    for (const msg of importData.messages) {
      if (msg.type === 'user' || msg.type === 'assistant') {
        this.addMessage(session.id, msg.type, msg.content);
        importedCount++;
      }
    }

    return { session, importedMessages: importedCount };
  }

  createQueueTask(sessionId: string, prompt: string, priority: string = 'normal') {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO queue_tasks (id, session_id, prompt, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, sessionId, prompt, priority, now, now]);

    return this.db.query('SELECT * FROM queue_tasks WHERE id = ?').get(id) as any;
  }

  getQueueTasks(sessionId?: string) {
    if (sessionId) {
      return this.db.query('SELECT * FROM queue_tasks WHERE session_id = ? ORDER BY created_at DESC').all(sessionId) as any[];
    }
    return this.db.query('SELECT * FROM queue_tasks ORDER BY created_at DESC').all() as any[];
  }

  close() {
    this.db.close();
  }
}

describe('Full Workflow Integration', () => {
  let db: IntegrationDb;

  beforeEach(() => {
    db = new IntegrationDb();
  });

  afterEach(() => {
    db.close();
  });

  it('should complete create → message → search workflow', () => {
    // Create session
    const session = db.createSession('Test Workflow', '/Users/test/project', 'coder');
    expect(session.id).toBeDefined();
    expect(session.title).toBe('Test Workflow');
    expect(session.mode).toBe('coder');

    // Add conversation
    db.addMessage(session.id, 'user', 'Help me build a REST API');
    db.addMessage(session.id, 'assistant', 'I can help you build a REST API. Let me create the server.ts file...');
    db.addMessage(session.id, 'user', 'Thanks! Can you add authentication?');
    db.addMessage(session.id, 'assistant', 'Sure! I will add JWT authentication middleware...');

    // Verify messages
    const messages = db.getSessionMessages(session.id);
    expect(messages.length).toBe(4);

    // Search for content
    const searchResults = db.searchMessages('REST API');
    expect(searchResults.length).toBe(2);
    expect(searchResults.every(r => r.content.toLowerCase().includes('rest api'))).toBe(true);

    // Search for authentication
    const authResults = db.searchMessages('authentication');
    expect(authResults.length).toBe(2);
  });

  it('should complete export → import workflow', () => {
    // Create and populate session
    const session = db.createSession('Export Test', '/test', 'general');
    db.addMessage(session.id, 'user', 'Hello!');
    db.addMessage(session.id, 'assistant', 'Hi there! How can I help?');
    db.addMessage(session.id, 'user', 'What is TypeScript?');
    db.addMessage(session.id, 'assistant', 'TypeScript is a typed superset of JavaScript...');

    // Export
    const exportData = db.exportSession(session.id);
    expect(exportData).not.toBeNull();
    expect(exportData!.version).toBe('1.0');
    expect(exportData!.session.title).toBe('Export Test');
    expect(exportData!.messages.length).toBe(4);

    // Import (simulates importing into fresh database)
    const importResult = db.importSession(exportData);
    expect(importResult.importedMessages).toBe(4);
    expect(importResult.session.title).toBe('Export Test (imported)');

    // Verify imported data
    const importedMessages = db.getSessionMessages(importResult.session.id);
    expect(importedMessages.length).toBe(4);
    expect(importedMessages[0].content).toBe('Hello!');
    expect(importedMessages[3].content).toBe('TypeScript is a typed superset of JavaScript...');
  });

  it('should handle multi-session search correctly', () => {
    // Create multiple sessions with different topics
    const session1 = db.createSession('React Project');
    const session2 = db.createSession('Python Script');
    const session3 = db.createSession('Database Design');

    db.addMessage(session1.id, 'user', 'How do I use React hooks?');
    db.addMessage(session1.id, 'assistant', 'React hooks like useState and useEffect...');

    db.addMessage(session2.id, 'user', 'Write a Python script');
    db.addMessage(session2.id, 'assistant', 'Here is a Python script using asyncio...');

    db.addMessage(session3.id, 'user', 'Design a database schema');
    db.addMessage(session3.id, 'assistant', 'For database design, consider normalization...');

    // Global search
    const reactResults = db.searchMessages('React');
    expect(reactResults.length).toBe(2);
    expect(reactResults.every(r => r.session_title === 'React Project')).toBe(true);

    const pythonResults = db.searchMessages('Python');
    expect(pythonResults.length).toBe(2);
    expect(pythonResults.every(r => r.session_title === 'Python Script')).toBe(true);

    // Session-specific search (both user and assistant mention hooks)
    const session1Results = db.searchMessages('hooks', session1.id);
    expect(session1Results.length).toBe(2);
    expect(session1Results.every(r => r.session_id === session1.id)).toBe(true);
  });

  it('should maintain data integrity across operations', () => {
    const session = db.createSession('Integrity Test');

    // Add many messages
    for (let i = 0; i < 50; i++) {
      const type = i % 2 === 0 ? 'user' : 'assistant';
      db.addMessage(session.id, type, `Message ${i}: ${type === 'user' ? 'User query' : 'Assistant response'}`);
    }

    // Verify message count
    const updatedSession = db.getSession(session.id);
    expect(updatedSession.message_count).toBe(50);

    // Export and verify
    const exported = db.exportSession(session.id);
    expect(exported!.messages.length).toBe(50);

    // Delete session
    db.deleteSession(session.id);

    // Verify deletion
    expect(db.getSession(session.id)).toBeNull();
    expect(db.getSessionMessages(session.id).length).toBe(0);
  });

  it('should handle queue integration', () => {
    const session = db.createSession('Queue Test');

    // Create tasks
    const task1 = db.createQueueTask(session.id, 'Build user authentication', 'high');
    const task2 = db.createQueueTask(session.id, 'Create API endpoints', 'normal');
    const task3 = db.createQueueTask(session.id, 'Write tests', 'low');

    expect(task1.priority).toBe('high');
    expect(task2.priority).toBe('normal');
    expect(task3.priority).toBe('low');

    // Get session tasks
    const sessionTasks = db.getQueueTasks(session.id);
    expect(sessionTasks.length).toBe(3);

    // All tasks should be pending
    expect(sessionTasks.every(t => t.status === 'pending')).toBe(true);
  });

  it('should handle session mode changes', () => {
    const session = db.createSession('Mode Test', '/test', 'general');
    expect(session.mode).toBe('general');

    // Update mode
    db.db.run('UPDATE sessions SET mode = ? WHERE id = ?', ['coder', session.id]);
    const updated = db.getSession(session.id);
    expect(updated.mode).toBe('coder');

    // Update to research mode
    db.db.run('UPDATE sessions SET mode = ? WHERE id = ?', ['intense-research', session.id]);
    const research = db.getSession(session.id);
    expect(research.mode).toBe('intense-research');
  });
});

describe('Edge Cases and Error Handling', () => {
  let db: IntegrationDb;

  beforeEach(() => {
    db = new IntegrationDb();
  });

  afterEach(() => {
    db.close();
  });

  it('should handle empty search gracefully', () => {
    const results = db.searchMessages('');
    expect(results).toEqual([]);

    const whitespaceResults = db.searchMessages('   ');
    expect(whitespaceResults).toEqual([]);
  });

  it('should handle search with no matches', () => {
    const session = db.createSession('Test');
    db.addMessage(session.id, 'user', 'Hello world');

    const results = db.searchMessages('nonexistent-query-xyz');
    expect(results.length).toBe(0);
  });

  it('should handle special characters in search', () => {
    const session = db.createSession('Special Chars');
    db.addMessage(session.id, 'user', 'Use @decorator and $variable');
    db.addMessage(session.id, 'assistant', 'The function() returns { key: value }');

    const atResults = db.searchMessages('@decorator');
    expect(atResults.length).toBe(1);

    const dollarResults = db.searchMessages('$variable');
    expect(dollarResults.length).toBe(1);
  });

  it('should handle Unicode content', () => {
    const session = db.createSession('Unicode Test');
    db.addMessage(session.id, 'user', 'こんにちは世界');
    db.addMessage(session.id, 'assistant', 'Grüß Gott! Привет мир!');

    const japaneseResults = db.searchMessages('こんにちは');
    expect(japaneseResults.length).toBe(1);

    const germanResults = db.searchMessages('Grüß');
    expect(germanResults.length).toBe(1);
  });

  it('should handle very long messages', () => {
    const session = db.createSession('Long Message Test');
    const longContent = 'keyword ' + 'x'.repeat(10000) + ' keyword';
    db.addMessage(session.id, 'assistant', longContent);

    const results = db.searchMessages('keyword');
    expect(results.length).toBe(1);
    expect(results[0].match_preview.length).toBeLessThan(200);
  });

  it('should handle invalid import data', () => {
    expect(() => db.importSession({})).toThrow('Invalid import format');
    expect(() => db.importSession({ session: {} })).toThrow('Invalid import format');
    expect(() => db.importSession({ messages: [] })).toThrow('Invalid import format');
  });

  it('should export non-existent session as null', () => {
    const result = db.exportSession('non-existent-id');
    expect(result).toBeNull();
  });

  it('should handle concurrent session operations', async () => {
    // Create multiple sessions concurrently
    const sessions = await Promise.all([
      Promise.resolve(db.createSession('Session A')),
      Promise.resolve(db.createSession('Session B')),
      Promise.resolve(db.createSession('Session C')),
    ]);

    expect(sessions.length).toBe(3);
    expect(new Set(sessions.map(s => s.id)).size).toBe(3); // All unique IDs

    // Add messages to all sessions concurrently
    await Promise.all(sessions.map((s, i) =>
      Promise.resolve(db.addMessage(s.id, 'user', `Message for session ${i}`))
    ));

    // Verify each session has exactly one message
    for (const session of sessions) {
      const messages = db.getSessionMessages(session.id);
      expect(messages.length).toBe(1);
    }
  });
});

describe('Performance Tests', () => {
  let db: IntegrationDb;

  beforeEach(() => {
    db = new IntegrationDb();
  });

  afterEach(() => {
    db.close();
  });

  it('should handle 100+ sessions efficiently', () => {
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      const session = db.createSession(`Session ${i}`);
      db.addMessage(session.id, 'user', `Hello from session ${i}`);
      db.addMessage(session.id, 'assistant', `Response for session ${i}`);
    }

    const allSessions = db.getAllSessions();
    expect(allSessions.length).toBe(100);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  it('should search across 500+ messages efficiently', () => {
    const session = db.createSession('Performance Test');

    // Add 500 messages
    for (let i = 0; i < 250; i++) {
      db.addMessage(session.id, 'user', `User query ${i} about programming`);
      db.addMessage(session.id, 'assistant', `Response ${i} about code and development`);
    }

    const start = Date.now();
    const results = db.searchMessages('programming', undefined, 50);
    const elapsed = Date.now() - start;

    expect(results.length).toBe(50);
    expect(elapsed).toBeLessThan(500); // Should complete in under 500ms
  });
});
