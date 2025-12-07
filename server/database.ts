/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs";
import { getDefaultWorkingDirectory, expandPath, validateDirectory, getAppDataDirectory } from "./directoryUtils";
import { deleteSessionPictures, deleteSessionFiles } from "./imageUtils";
import { setupSessionCommands } from "./commandSetup";

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  working_directory: string;
  permission_mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'autonom';
  mode: 'general' | 'coder' | 'intense-research' | 'spark';
  sdk_session_id?: string; // SDK's internal session ID for resume functionality
  context_input_tokens?: number;
  context_window?: number;
  context_percentage?: number;
  // Progress tracking for intelligent resume
  progress_summary?: string; // JSON: { filesRead: string[], filesWritten: string[], currentTask: string }
  last_activity?: string; // Last activity type: 'reading', 'writing', 'analyzing', 'idle'
  resume_hint?: string; // Short text hint for model handoff
  last_model?: string; // Last model used in this session
}

export interface SessionMessage {
  id: string;
  session_id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string; // updated_at cursor for cursor-based pagination
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

class SessionDatabase {
  private db: Database;

  constructor(dbPath?: string) {
    // Use app data directory if no path provided
    if (!dbPath) {
      const appDataDir = getAppDataDirectory();
      // Create directory if it doesn't exist
      if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir, { recursive: true });
        console.log('📁 Created app data directory:', appDataDir);
      }
      dbPath = path.join(appDataDir, 'sessions.db');
    }

    try {
      this.db = new Database(dbPath, { create: true });
      this.initialize();
    } catch (error) {
      // Handle SQLITE_AUTH error (usually from corruption)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_AUTH') {
        console.error('❌ Database authorization failed (likely corruption)');
        console.log('🔄 Attempting recovery by backing up and recreating database...');

        // Backup corrupted database
        const backupPath = `${dbPath}.corrupted.${Date.now()}`;
        try {
          fs.renameSync(dbPath, backupPath);
          console.log(`✅ Backed up corrupted database to: ${backupPath}`);
        } catch (backupError) {
          console.error('⚠️  Could not backup corrupted database:', backupError);
          // Try deleting instead
          try {
            fs.unlinkSync(dbPath);
            console.log('✅ Deleted corrupted database file');
          } catch (deleteError) {
            console.error('❌ Could not delete corrupted database:', deleteError);
            throw new Error('Database is corrupted and cannot be recovered. Please manually delete: ' + dbPath);
          }
        }

        // Retry with fresh database
        try {
          this.db = new Database(dbPath, { create: true });
          this.initialize();
          console.log('✅ Successfully created fresh database');
        } catch (retryError) {
          console.error('❌ Failed to create fresh database:', retryError);
          throw retryError;
        }
      } else {
        // Other errors - rethrow
        throw error;
      }
    }
  }

  private initialize() {
    // Enable WAL mode for better concurrent read/write performance
    this.db.run("PRAGMA journal_mode = WAL");
    this.db.run("PRAGMA synchronous = NORMAL"); // Faster writes, still safe with WAL

    // Create sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create messages table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for faster queries
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_id
      ON messages(session_id)
    `);

    // Compound index for message queries (filter by session, sort by timestamp)
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_timestamp
      ON messages(session_id, timestamp)
    `);

    // Index for session sorting by updated_at (most common query)
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_sessions_updated_at
      ON sessions(updated_at DESC)
    `);

    // Unified migration: Check all columns in single PRAGMA query
    this.runUnifiedMigrations();
  }

  /**
   * Unified migration method - performs ONE PRAGMA query and all necessary migrations
   * This replaces 5 separate migration methods that each queried PRAGMA table_info
   */
  private runUnifiedMigrations() {
    try {
      // Single PRAGMA query to get all column info
      const columns = this.db.query<{ name: string; type: string }, []>(
        "PRAGMA table_info(sessions)"
      ).all();

      const columnNames = new Set(columns.map(col => col.name));
      const migrationsNeeded: string[] = [];

      // Check which migrations are needed
      const requiredColumns = [
        { name: 'working_directory', sql: `ALTER TABLE sessions ADD COLUMN working_directory TEXT NOT NULL DEFAULT ''`, postAction: 'updateWorkingDirectory' },
        { name: 'permission_mode', sql: `ALTER TABLE sessions ADD COLUMN permission_mode TEXT NOT NULL DEFAULT 'bypassPermissions'` },
        { name: 'mode', sql: `ALTER TABLE sessions ADD COLUMN mode TEXT NOT NULL DEFAULT 'general'` },
        { name: 'sdk_session_id', sql: `ALTER TABLE sessions ADD COLUMN sdk_session_id TEXT` },
        { name: 'context_input_tokens', sql: `ALTER TABLE sessions ADD COLUMN context_input_tokens INTEGER` },
        { name: 'context_window', sql: `ALTER TABLE sessions ADD COLUMN context_window INTEGER` },
        { name: 'context_percentage', sql: `ALTER TABLE sessions ADD COLUMN context_percentage REAL` },
        // Progress tracking for intelligent resume
        { name: 'progress_summary', sql: `ALTER TABLE sessions ADD COLUMN progress_summary TEXT` },
        { name: 'last_activity', sql: `ALTER TABLE sessions ADD COLUMN last_activity TEXT` },
        { name: 'resume_hint', sql: `ALTER TABLE sessions ADD COLUMN resume_hint TEXT` },
        { name: 'last_model', sql: `ALTER TABLE sessions ADD COLUMN last_model TEXT` },
      ];

      // Perform migrations
      for (const col of requiredColumns) {
        if (!columnNames.has(col.name)) {
          migrationsNeeded.push(col.name);
          console.log(`📦 Migrating database: Adding ${col.name} column`);
          this.db.run(col.sql);

          // Special post-action for working_directory
          if (col.postAction === 'updateWorkingDirectory') {
            const defaultDir = getDefaultWorkingDirectory();
            console.log('📦 Setting default working directory for existing sessions:', defaultDir);
            this.db.run(
              "UPDATE sessions SET working_directory = ? WHERE working_directory = ''",
              [defaultDir]
            );
          }
        }
      }

      // Check context_percentage type fix (rare edge case)
      const contextPercentageCol = columns.find(col => col.name === 'context_percentage');
      if (contextPercentageCol && contextPercentageCol.type === 'INTEGER') {
        console.log('⚠️  context_percentage is INTEGER but will work with decimals in SQLite');
      }

      if (migrationsNeeded.length > 0) {
        console.log(`✅ Database migration completed: ${migrationsNeeded.join(', ')}`);
      } else {
        console.log('✅ Database schema up to date');
      }
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  // Session operations
  createSession(title: string = "New Chat", workingDirectory?: string, mode: 'general' | 'coder' | 'intense-research' | 'spark' = 'general'): Session {
    const id = randomUUID();
    const now = new Date().toISOString();

    let finalWorkingDir: string;

    if (workingDirectory) {
      // User provided a custom directory
      const expandedPath = expandPath(workingDirectory);
      const validation = validateDirectory(expandedPath);

      if (!validation.valid) {
        console.warn('⚠️  Invalid working directory provided:', validation.error);
        // Fall back to auto-generated chat folder
        finalWorkingDir = this.createChatDirectory(id);
      } else {
        finalWorkingDir = expandedPath;
      }
    } else {
      // Auto-generate chat folder: ~/Documents/agent-girl/chat-{short-id}/
      finalWorkingDir = this.createChatDirectory(id);
    }

    this.db.run(
      "INSERT INTO sessions (id, title, created_at, updated_at, working_directory, permission_mode, mode) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, title, now, now, finalWorkingDir, 'bypassPermissions', mode]
    );

    // Setup slash commands for this session
    setupSessionCommands(finalWorkingDir, mode);

    return {
      id,
      title,
      created_at: now,
      updated_at: now,
      message_count: 0,
      working_directory: finalWorkingDir,
      permission_mode: 'bypassPermissions',
      mode,
    };
  }

  private createChatDirectory(sessionId: string): string {
    // Create unique chat folder: ~/Documents/agent-girl/chat-{first-8-chars}/
    const shortId = sessionId.substring(0, 8);
    const baseDir = getDefaultWorkingDirectory();
    const chatDir = path.join(baseDir, `chat-${shortId}`);

    try {
      if (!fs.existsSync(chatDir)) {
        fs.mkdirSync(chatDir, { recursive: true });
        console.log('✅ Created chat directory:', chatDir);
      } else {
        console.log('📁 Chat directory already exists:', chatDir);
      }
    } catch (error) {
      console.error('❌ Failed to create chat directory:', error);
      // Fall back to base directory if creation fails
      return baseDir;
    }

    return chatDir;
  }

  /**
   * Check if a folder has meaningful content (not just CLAUDE.md, .claude, or empty)
   * A folder is considered "meaningful" if it has:
   * - Any files other than CLAUDE.md and .DS_Store
   * - Any subdirectories other than .claude and hidden folders
   */
  private folderHasMeaningfulContent(folderPath: string): boolean {
    try {
      if (!fs.existsSync(folderPath)) return false;

      const entries = fs.readdirSync(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip system files
        if (entry.name === '.DS_Store') continue;

        if (entry.isFile()) {
          // Any file other than CLAUDE.md is meaningful
          if (entry.name !== 'CLAUDE.md') return true;
        } else if (entry.isDirectory()) {
          // Skip .claude and hidden folders
          if (entry.name === '.claude' || entry.name.startsWith('.')) continue;
          // Any other directory is meaningful
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get all sessions with optional directory validation
   * @param skipDirectoryValidation - Skip expensive directory existence checks (default: false)
   */
  getSessions(skipDirectoryValidation = false): { sessions: Session[]; recreatedDirectories: string[] } {
    const sessions = this.db
      .query<Session, []>(
        `SELECT
          s.id,
          s.title,
          s.created_at,
          s.updated_at,
          s.working_directory,
          s.permission_mode,
          s.mode,
          s.sdk_session_id,
          s.context_input_tokens,
          s.context_window,
          s.context_percentage,
          s.progress_summary,
          s.last_activity,
          s.resume_hint,
          s.last_model,
          COUNT(m.id) as message_count
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        GROUP BY s.id
        ORDER BY s.updated_at DESC`
      )
      .all();

    // Skip directory validation if requested (faster response for session list)
    if (skipDirectoryValidation) {
      return { sessions, recreatedDirectories: [] };
    }

    // Validate directories - only recreate for sessions with actual messages
    const recreatedDirectories: string[] = [];

    for (const session of sessions) {
      if (session.working_directory && !fs.existsSync(session.working_directory)) {
        // Only recreate if session has messages (actual chat content)
        if (session.message_count > 0) {
          console.warn(`⚠️  Missing directory for session with ${session.message_count} messages: ${session.working_directory}`);
          try {
            fs.mkdirSync(session.working_directory, { recursive: true });
            console.log(`✅ Recreated directory: ${session.working_directory}`);
            recreatedDirectories.push(session.working_directory);
          } catch (error) {
            console.error(`❌ Failed to recreate directory: ${session.working_directory}`, error);
          }
        }
        // Empty sessions without messages - don't recreate, let them be cleaned up
      }
    }

    return { sessions, recreatedDirectories };
  }

  /**
   * Get sessions with pagination support
   * Supports both offset-based and cursor-based pagination
   */
  getSessionsPaginated(options: PaginationOptions = {}): PaginatedResult<Session> {
    const { limit = 20, offset = 0, cursor } = options;

    // Get total count
    const countResult = this.db.query<{ count: number }, []>(
      'SELECT COUNT(*) as count FROM sessions'
    ).get();
    const total = countResult?.count ?? 0;

    // Build query based on pagination type
    let sessions: Session[];

    if (cursor) {
      // Cursor-based pagination (more efficient for large datasets)
      sessions = this.db
        .query<Session, [string, number]>(
          `SELECT
            s.id,
            s.title,
            s.created_at,
            s.updated_at,
            s.working_directory,
            s.permission_mode,
            s.mode,
            s.sdk_session_id,
            s.context_input_tokens,
            s.context_window,
            s.context_percentage,
            s.progress_summary,
            s.last_activity,
            s.resume_hint,
            s.last_model,
            COUNT(m.id) as message_count
          FROM sessions s
          LEFT JOIN messages m ON s.id = m.session_id
          WHERE s.updated_at < ?
          GROUP BY s.id
          ORDER BY s.updated_at DESC
          LIMIT ?`
        )
        .all(cursor, limit + 1); // Fetch one extra to check if there's more
    } else {
      // Offset-based pagination
      sessions = this.db
        .query<Session, [number, number]>(
          `SELECT
            s.id,
            s.title,
            s.created_at,
            s.updated_at,
            s.working_directory,
            s.permission_mode,
            s.mode,
            s.sdk_session_id,
            s.context_input_tokens,
            s.context_window,
            s.context_percentage,
            s.progress_summary,
            s.last_activity,
            s.resume_hint,
            s.last_model,
            COUNT(m.id) as message_count
          FROM sessions s
          LEFT JOIN messages m ON s.id = m.session_id
          GROUP BY s.id
          ORDER BY s.updated_at DESC
          LIMIT ? OFFSET ?`
        )
        .all(limit + 1, offset); // Fetch one extra to check if there's more
    }

    // Determine if there are more results
    const hasMore = sessions.length > limit;
    if (hasMore) {
      sessions = sessions.slice(0, limit);
    }

    // Get next cursor from last item
    const nextCursor = hasMore && sessions.length > 0
      ? sessions[sessions.length - 1].updated_at
      : undefined;

    return {
      data: sessions,
      total,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Get session count (efficient single query)
   */
  getSessionCount(): number {
    const result = this.db.query<{ count: number }, []>(
      'SELECT COUNT(*) as count FROM sessions'
    ).get();
    return result?.count ?? 0;
  }

  // Import existing folders from the agent-girl directory that aren't in the database
  importExistingFolders(): { imported: string[]; skipped: string[] } {
    const baseDir = getDefaultWorkingDirectory();
    const imported: string[] = [];
    const skipped: string[] = [];

    // Get all existing working directories from database
    const existingDirs = new Set(
      this.db.query<{ working_directory: string }, []>(
        'SELECT working_directory FROM sessions WHERE working_directory IS NOT NULL'
      ).all().map(row => row.working_directory)
    );

    // Scan the base directory for folders
    if (!fs.existsSync(baseDir)) {
      console.log('📁 Base directory does not exist:', baseDir);
      return { imported, skipped };
    }

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const folderPath = path.join(baseDir, entry.name);

      // Skip if already in database
      if (existingDirs.has(folderPath)) {
        skipped.push(entry.name);
        continue;
      }

      // Skip hidden folders and system folders
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      // Skip empty folders - only import folders with meaningful content
      if (!this.folderHasMeaningfulContent(folderPath)) {
        console.log(`📭 Skipping empty folder: ${entry.name}`);
        continue;
      }

      try {
        // Get folder modification time for the timestamp
        const stats = fs.statSync(folderPath);
        const timestamp = stats.mtime.toISOString();

        // Create a new session for this folder
        const sessionId = randomUUID();
        const title = entry.name;

        this.db.run(
          `INSERT INTO sessions (id, title, created_at, updated_at, working_directory, permission_mode, mode)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [sessionId, title, timestamp, timestamp, folderPath, 'default', 'general']
        );

        imported.push(entry.name);
        console.log(`✅ Imported folder: ${entry.name}`);
      } catch (error) {
        console.error(`❌ Failed to import folder ${entry.name}:`, error);
      }
    }

    if (imported.length > 0) {
      console.log(`📁 Imported ${imported.length} folders`);
    }

    return { imported, skipped };
  }

  getSession(sessionId: string): Session | null {
    const session = this.db
      .query<Session, [string]>(
        `SELECT
          s.id,
          s.title,
          s.created_at,
          s.updated_at,
          s.working_directory,
          s.permission_mode,
          s.mode,
          s.sdk_session_id,
          s.context_input_tokens,
          s.context_window,
          s.context_percentage,
          s.progress_summary,
          s.last_activity,
          s.resume_hint,
          s.last_model,
          COUNT(m.id) as message_count
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.id = ?
        GROUP BY s.id`
      )
      .get(sessionId);

    return session || null;
  }

  updateWorkingDirectory(sessionId: string, directory: string): boolean {
    try {
      // Expand and validate path
      const expandedPath = expandPath(directory);
      const validation = validateDirectory(expandedPath);

      if (!validation.valid) {
        console.error('❌ Invalid working directory:', validation.error);
        return false;
      }

      console.log('📁 Updating working directory:', {
        session: sessionId,
        directory: expandedPath
      });

      const result = this.db.run(
        "UPDATE sessions SET working_directory = ?, updated_at = ? WHERE id = ?",
        [expandedPath, new Date().toISOString(), sessionId]
      );

      const success = result.changes > 0;
      if (success) {
        console.log('✅ Working directory updated successfully');
      } else {
        console.warn('⚠️  No session found to update');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to update working directory:', error);
      return false;
    }
  }

  updatePermissionMode(sessionId: string, mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'autonom'): boolean {
    try {
      const result = this.db.run(
        "UPDATE sessions SET permission_mode = ?, updated_at = ? WHERE id = ?",
        [mode, new Date().toISOString(), sessionId]
      );

      const success = result.changes > 0;
      if (!success) {
        console.warn('⚠️  No session found to update');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to update permission mode:', error);
      return false;
    }
  }

  updateSessionMode(sessionId: string, mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build'): boolean {
    try {
      const result = this.db.run(
        "UPDATE sessions SET mode = ?, updated_at = ? WHERE id = ?",
        [mode, new Date().toISOString(), sessionId]
      );

      const success = result.changes > 0;
      if (!success) {
        console.warn('⚠️  No session found to update');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to update session mode:', error);
      return false;
    }
  }

  updateSdkSessionId(sessionId: string, sdkSessionId: string | null): boolean {
    try {
      const result = this.db.run(
        "UPDATE sessions SET sdk_session_id = ?, updated_at = ? WHERE id = ?",
        [sdkSessionId, new Date().toISOString(), sessionId]
      );

      const success = result.changes > 0;
      if (!success) {
        console.warn('⚠️  No session found to update');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to update SDK session ID:', error);
      return false;
    }
  }

  updateContextUsage(sessionId: string, inputTokens: number, contextWindow: number, contextPercentage: number): boolean {
    try {
      // Use SDK's reported inputTokens directly (it includes full context)
      const result = this.db.run(
        "UPDATE sessions SET context_input_tokens = ?, context_window = ?, context_percentage = ?, updated_at = ? WHERE id = ?",
        [inputTokens, contextWindow, contextPercentage, new Date().toISOString(), sessionId]
      );

      const success = result.changes > 0;
      if (!success) {
        console.warn('⚠️  No session found to update context usage');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to update context usage:', error);
      return false;
    }
  }

  /**
   * Update progress tracking for intelligent model handoff and resume
   * @param sessionId - Session to update
   * @param progress - Progress data including files read/written, current task, and resume hint
   */
  updateProgress(sessionId: string, progress: {
    filesRead?: string[];
    filesWritten?: string[];
    currentTask?: string;
    lastActivity?: 'reading' | 'writing' | 'analyzing' | 'idle';
    resumeHint?: string;
    model?: string;
  }): boolean {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        console.warn('⚠️  No session found for progress update');
        return false;
      }

      // Merge with existing progress summary
      let existingSummary: { filesRead: string[]; filesWritten: string[]; currentTask: string } = {
        filesRead: [],
        filesWritten: [],
        currentTask: '',
      };

      if (session.progress_summary) {
        try {
          existingSummary = JSON.parse(session.progress_summary);
        } catch {
          // Keep defaults if parse fails
        }
      }

      // Update fields
      if (progress.filesRead) {
        existingSummary.filesRead = [...new Set([...existingSummary.filesRead, ...progress.filesRead])];
      }
      if (progress.filesWritten) {
        existingSummary.filesWritten = [...new Set([...existingSummary.filesWritten, ...progress.filesWritten])];
      }
      if (progress.currentTask) {
        existingSummary.currentTask = progress.currentTask;
      }

      const result = this.db.run(
        `UPDATE sessions SET
          progress_summary = ?,
          last_activity = COALESCE(?, last_activity),
          resume_hint = COALESCE(?, resume_hint),
          last_model = COALESCE(?, last_model),
          updated_at = ?
        WHERE id = ?`,
        [
          JSON.stringify(existingSummary),
          progress.lastActivity || null,
          progress.resumeHint || null,
          progress.model || null,
          new Date().toISOString(),
          sessionId,
        ]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
      return false;
    }
  }

  /**
   * Generate context summary for model handoff
   * Returns a concise summary suitable for prepending to the next prompt
   */
  getContextSummary(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const parts: string[] = [];

    // Parse progress summary
    if (session.progress_summary) {
      try {
        const progress = JSON.parse(session.progress_summary);
        if (progress.filesRead?.length > 0) {
          parts.push(`Dateien gelesen: ${progress.filesRead.slice(-5).join(', ')}${progress.filesRead.length > 5 ? ` (+${progress.filesRead.length - 5} weitere)` : ''}`);
        }
        if (progress.filesWritten?.length > 0) {
          parts.push(`Dateien bearbeitet: ${progress.filesWritten.join(', ')}`);
        }
        if (progress.currentTask) {
          parts.push(`Aktuelle Aufgabe: ${progress.currentTask}`);
        }
      } catch {
        // Ignore parse errors
      }
    }

    if (session.resume_hint) {
      parts.push(`Fortschritt: ${session.resume_hint}`);
    }

    if (session.last_model) {
      parts.push(`Vorheriges Model: ${session.last_model}`);
    }

    if (parts.length === 0) return null;

    return `[Kontext-Übergabe]\n${parts.join('\n')}`;
  }

  deleteSession(sessionId: string): boolean {
    // Get session to access working directory before deletion
    const session = this.getSession(sessionId);

    // Delete pictures and files folders if session exists
    if (session && session.working_directory) {
      deleteSessionPictures(session.working_directory);
      deleteSessionFiles(session.working_directory);
    }

    const result = this.db.run("DELETE FROM sessions WHERE id = ?", [sessionId]);
    return result.changes > 0;
  }

  renameSession(sessionId: string, newTitle: string): boolean {
    const now = new Date().toISOString();
    const result = this.db.run(
      "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
      [newTitle, now, sessionId]
    );
    return result.changes > 0;
  }

  renameFolderAndSession(sessionId: string, newFolderName: string): { success: boolean; error?: string; newPath?: string } {
    try {
      // Validate folder name (max 42 chars, lowercase + dashes only)
      if (newFolderName.length > 42) {
        return { success: false, error: 'Folder name must be 42 characters or less' };
      }
      if (!/^[a-z0-9-]+$/.test(newFolderName)) {
        return { success: false, error: 'Only lowercase letters, numbers, and dashes allowed' };
      }

      // Get current session
      const session = this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const oldPath = session.working_directory;
      const baseDir = getDefaultWorkingDirectory();
      const newPath = path.join(baseDir, newFolderName);

      // Check if new path already exists
      if (fs.existsSync(newPath) && newPath !== oldPath) {
        return { success: false, error: 'Folder name already exists' };
      }

      // Rename the directory
      if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
        console.log('✅ Renamed folder:', { from: oldPath, to: newPath });
      }

      // Update database
      const now = new Date().toISOString();
      const result = this.db.run(
        "UPDATE sessions SET title = ?, working_directory = ?, updated_at = ? WHERE id = ?",
        [newFolderName, newPath, now, sessionId]
      );

      if (result.changes > 0) {
        console.log('✅ Updated session in database');
        return { success: true, newPath };
      } else {
        // Rollback folder rename if database update failed
        if (oldPath !== newPath && fs.existsSync(newPath)) {
          fs.renameSync(newPath, oldPath);
        }
        return { success: false, error: 'Failed to update database' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to rename folder:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Message operations
  addMessage(
    sessionId: string,
    type: 'user' | 'assistant',
    content: string
  ): SessionMessage {
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    this.db.run(
      "INSERT INTO messages (id, session_id, type, content, timestamp) VALUES (?, ?, ?, ?, ?)",
      [id, sessionId, type, content, timestamp]
    );

    // Auto-generate title from first user message
    if (type === 'user') {
      const session = this.getSession(sessionId);
      if (session && session.title === 'New Chat') {
        // Generate title from first user message (max 60 chars)
        let title = content.trim().substring(0, 60);
        if (content.length > 60) {
          title += '...';
        }
        this.renameSession(sessionId, title);
      }
    }

    // Update session's updated_at
    this.db.run("UPDATE sessions SET updated_at = ? WHERE id = ?", [
      timestamp,
      sessionId,
    ]);

    return {
      id,
      session_id: sessionId,
      type,
      content,
      timestamp,
    };
  }

  updateMessage(messageId: string, content: string): void {
    const timestamp = new Date().toISOString();
    this.db.run(
      "UPDATE messages SET content = ?, timestamp = ? WHERE id = ?",
      [content, timestamp, messageId]
    );
  }

  getSessionMessages(sessionId: string): SessionMessage[] {
    const messages = this.db
      .query<SessionMessage, [string]>(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC"
      )
      .all(sessionId);

    return messages;
  }

  /**
   * Get message count for a session (efficient COUNT query instead of fetching all)
   * Use this when you only need to know the number of messages
   */
  getMessageCount(sessionId: string): number {
    const result = this.db.query<{ count: number }, [string]>(
      'SELECT COUNT(*) as count FROM messages WHERE session_id = ?'
    ).get(sessionId);
    return result?.count ?? 0;
  }

  /**
   * Search messages across all sessions or within a specific session
   * Returns messages with context preview around the match
   */
  searchMessages(query: string, sessionId?: string, limit: number = 50): Array<{
    id: string;
    session_id: string;
    session_title: string;
    type: string;
    content: string;
    timestamp: string;
    match_preview: string;
  }> {
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

    const results = this.db.query(sql).all(...params) as Array<{
      id: string;
      session_id: string;
      session_title: string;
      type: string;
      content: string;
      timestamp: string;
    }>;

    // Generate match preview with context
    return results.map(row => {
      const lowerContent = row.content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const matchIndex = lowerContent.indexOf(lowerQuery);

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

  clearSessionMessages(sessionId: string): boolean {
    try {
      console.log('🧹 Clearing all messages for session:', sessionId.substring(0, 8));

      const result = this.db.run(
        "DELETE FROM messages WHERE session_id = ?",
        [sessionId]
      );

      const success = result.changes > 0;
      if (success) {
        console.log(`✅ Cleared ${result.changes} messages from session`);
      } else {
        console.log('⚠️  No messages found to clear');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to clear session messages:', error);
      return false;
    }
  }

  /**
   * Clean up empty folders in the agent-girl directory
   * Removes folders that have no meaningful content (only CLAUDE.md, .claude, or empty)
   * Also deletes corresponding sessions from the database
   * @returns Object with arrays of deleted folders and sessions
   */
  cleanupEmptyFolders(): { deletedFolders: string[]; deletedSessions: string[]; errors: string[] } {
    const baseDir = getDefaultWorkingDirectory();
    const deletedFolders: string[] = [];
    const deletedSessions: string[] = [];
    const errors: string[] = [];

    if (!fs.existsSync(baseDir)) {
      return { deletedFolders, deletedSessions, errors };
    }

    console.log('🧹 Starting cleanup of empty folders...');

    // Get all sessions with their message counts
    const sessions = this.db.query<{ id: string; working_directory: string; message_count: number }, []>(
      `SELECT s.id, s.working_directory, COUNT(m.id) as message_count
       FROM sessions s
       LEFT JOIN messages m ON s.id = m.session_id
       GROUP BY s.id`
    ).all();

    // Create a map for quick lookup
    const sessionsByDir = new Map(sessions.map(s => [s.working_directory, s]));

    // Scan the base directory
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const folderPath = path.join(baseDir, entry.name);

      // Check if folder has meaningful content
      if (!this.folderHasMeaningfulContent(folderPath)) {
        const session = sessionsByDir.get(folderPath);

        // Only delete if session has no messages OR no session exists
        if (!session || session.message_count === 0) {
          try {
            // Delete the folder recursively
            fs.rmSync(folderPath, { recursive: true, force: true });
            deletedFolders.push(entry.name);
            console.log(`🗑️  Deleted empty folder: ${entry.name}`);

            // Delete session from database if exists
            if (session) {
              this.db.run('DELETE FROM sessions WHERE id = ?', [session.id]);
              deletedSessions.push(session.id);
              console.log(`🗑️  Deleted session: ${session.id.substring(0, 8)}`);
            }
          } catch (error) {
            const errorMsg = `Failed to delete ${entry.name}: ${error}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }
      }
    }

    console.log(`✅ Cleanup complete: ${deletedFolders.length} folders, ${deletedSessions.length} sessions deleted`);
    return { deletedFolders, deletedSessions, errors };
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
export const sessionDb = new SessionDatabase();
