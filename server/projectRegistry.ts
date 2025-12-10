/**
 * Project Registry Service
 * Links projects (clones, builds) to sessions for context restoration
 */

import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import { getAppDataDirectory, getDefaultWorkingDirectory } from "./directoryUtils";

export type ProjectType = 'clone' | 'build' | 'custom' | 'astro' | 'next' | 'react';
export type ProjectStatus = 'creating' | 'ready' | 'building' | 'serving' | 'error';

export interface Project {
  id: string;
  session_id: string | null;  // Linked session (null = orphaned)
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  path: string;               // Absolute path to project
  source_url?: string;        // Original URL for clones
  preview_url?: string;       // Preview server URL
  preview_port?: number;      // Preview server port
  created_at: string;
  updated_at: string;
  metadata?: string;          // JSON: template, features, etc.
}

export interface ProjectMetadata {
  template?: string;
  features?: string[];
  originalDomain?: string;
  cloneJobId?: string;
  buildConfig?: Record<string, unknown>;
  duplicatedFrom?: string;
}

class ProjectRegistry {
  private db: Database;

  constructor() {
    const appDataDir = getAppDataDirectory();
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }

    const dbPath = path.join(appDataDir, 'projects.db');
    this.db = new Database(dbPath, { create: true });
    this.initialize();
  }

  private initialize() {
    this.db.run("PRAGMA journal_mode = WAL");
    this.db.run("PRAGMA synchronous = NORMAL");

    // Create projects table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'custom',
        status TEXT NOT NULL DEFAULT 'creating',
        path TEXT NOT NULL UNIQUE,
        source_url TEXT,
        preview_url TEXT,
        preview_port INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        metadata TEXT
      )
    `);

    // Indexes for common queries
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_projects_session ON projects(session_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC)`);

    console.log('✅ Project registry initialized');
  }

  /**
   * Register a new project
   */
  registerProject(data: {
    sessionId?: string;
    name: string;
    type: ProjectType;
    path: string;
    sourceUrl?: string;
    metadata?: ProjectMetadata;
  }): Project {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO projects (id, session_id, name, type, status, path, source_url, created_at, updated_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.sessionId || null,
        data.name,
        data.type,
        'creating',
        data.path,
        data.sourceUrl || null,
        now,
        now,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    console.log('📦 Registered project:', { id: id.substring(0, 8), name: data.name, type: data.type });

    return {
      id,
      session_id: data.sessionId || null,
      name: data.name,
      type: data.type,
      status: 'creating',
      path: data.path,
      source_url: data.sourceUrl,
      created_at: now,
      updated_at: now,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    };
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): Project | null {
    return this.db.query<Project, [string]>(
      'SELECT * FROM projects WHERE id = ?'
    ).get(projectId) || null;
  }

  /**
   * Get project by path
   */
  getProjectByPath(projectPath: string): Project | null {
    return this.db.query<Project, [string]>(
      'SELECT * FROM projects WHERE path = ?'
    ).get(projectPath) || null;
  }

  /**
   * Get all projects for a session
   */
  getProjectsBySession(sessionId: string): Project[] {
    return this.db.query<Project, [string]>(
      'SELECT * FROM projects WHERE session_id = ? ORDER BY updated_at DESC'
    ).all(sessionId);
  }

  /**
   * Get all projects (with optional filters)
   */
  getAllProjects(filters?: { type?: ProjectType; status?: ProjectStatus; limit?: number }): Project[] {
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters?.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY updated_at DESC';

    if (filters?.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.query(sql).all(...params) as Project[];
  }

  /**
   * Update project status
   */
  updateStatus(projectId: string, status: ProjectStatus, previewUrl?: string, previewPort?: number): boolean {
    const result = this.db.run(
      `UPDATE projects SET status = ?, preview_url = COALESCE(?, preview_url), preview_port = COALESCE(?, preview_port), updated_at = ? WHERE id = ?`,
      [status, previewUrl || null, previewPort || null, new Date().toISOString(), projectId]
    );
    return result.changes > 0;
  }

  /**
   * Link project to session
   */
  linkToSession(projectId: string, sessionId: string): boolean {
    const result = this.db.run(
      'UPDATE projects SET session_id = ?, updated_at = ? WHERE id = ?',
      [sessionId, new Date().toISOString(), projectId]
    );

    if (result.changes > 0) {
      console.log('🔗 Linked project to session:', { projectId: projectId.substring(0, 8), sessionId: sessionId.substring(0, 8) });
    }

    return result.changes > 0;
  }

  /**
   * Unlink project from session (make orphan)
   */
  unlinkFromSession(projectId: string): boolean {
    const result = this.db.run(
      'UPDATE projects SET session_id = NULL, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), projectId]
    );
    return result.changes > 0;
  }

  /**
   * Auto-match projects by working directory
   * Scans session's working_directory and links matching projects
   */
  autoMatchForSession(sessionId: string, workingDirectory: string): Project[] {
    const matched: Project[] = [];

    // Check if working_directory itself is a registered project
    const directProject = this.getProjectByPath(workingDirectory);
    if (directProject && directProject.session_id !== sessionId) {
      this.linkToSession(directProject.id, sessionId);
      matched.push({ ...directProject, session_id: sessionId });
    } else if (directProject) {
      matched.push(directProject);
    }

    // Also check for projects inside the working directory (subprojects)
    const allProjects = this.getAllProjects();
    for (const project of allProjects) {
      if (project.path.startsWith(workingDirectory + '/') && project.session_id !== sessionId) {
        this.linkToSession(project.id, sessionId);
        matched.push({ ...project, session_id: sessionId });
      } else if (project.path.startsWith(workingDirectory + '/')) {
        matched.push(project);
      }
    }

    return matched;
  }

  /**
   * Scan filesystem and auto-discover projects
   * Looks for common project markers (package.json, astro.config, etc.)
   */
  async discoverProjects(baseDir?: string): Promise<{ discovered: Project[]; errors: string[] }> {
    const scanDir = baseDir || getDefaultWorkingDirectory();
    const discovered: Project[] = [];
    const errors: string[] = [];

    try {
      const entries = await fsPromises.readdir(scanDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const projectPath = path.join(scanDir, entry.name);

        // Skip if already registered
        if (this.getProjectByPath(projectPath)) continue;

        try {
          const projectType = await this.detectProjectType(projectPath);
          if (projectType) {
            const project = this.registerProject({
              name: entry.name,
              type: projectType,
              path: projectPath,
            });
            this.updateStatus(project.id, 'ready');
            discovered.push(project);
          }
        } catch (err) {
          errors.push(`Failed to scan ${entry.name}: ${err}`);
        }
      }

      // Also scan clones directory
      const clonesDir = path.join(getAppDataDirectory(), 'clones');
      if (fs.existsSync(clonesDir)) {
        const cloneEntries = await fsPromises.readdir(clonesDir, { withFileTypes: true });

        for (const entry of cloneEntries) {
          if (!entry.isDirectory()) continue;

          const clonePath = path.join(clonesDir, entry.name);

          // Skip if already registered
          if (this.getProjectByPath(clonePath)) continue;

          const project = this.registerProject({
            name: entry.name,
            type: 'clone',
            path: clonePath,
            sourceUrl: `https://${entry.name}`,
            metadata: { originalDomain: entry.name },
          });
          this.updateStatus(project.id, 'ready');
          discovered.push(project);
        }
      }

      if (discovered.length > 0) {
        console.log(`🔍 Discovered ${discovered.length} projects`);
      }
    } catch (err) {
      errors.push(`Failed to scan directory: ${err}`);
    }

    return { discovered, errors };
  }

  /**
   * Detect project type from filesystem markers
   */
  private async detectProjectType(projectPath: string): Promise<ProjectType | null> {
    try {
      // Check for package.json first
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const content = await fsPromises.readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);

        // Check dependencies for framework detection
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps['astro'] || deps['@astrojs/starlight']) return 'astro';
        if (deps['next']) return 'next';
        if (deps['react'] && !deps['next'] && !deps['astro']) return 'react';

        return 'build';
      }

      // Check for astro.config.* files
      const astroConfigFiles = ['astro.config.mjs', 'astro.config.ts', 'astro.config.js'];
      for (const configFile of astroConfigFiles) {
        if (fs.existsSync(path.join(projectPath, configFile))) {
          return 'astro';
        }
      }

      // Check for next.config.*
      if (fs.existsSync(path.join(projectPath, 'next.config.js')) ||
          fs.existsSync(path.join(projectPath, 'next.config.mjs'))) {
        return 'next';
      }

      // Check for index.html (static/clone)
      if (fs.existsSync(path.join(projectPath, 'index.html'))) {
        return 'clone';
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(projectId: string, newName?: string, targetSessionId?: string): Promise<Project | null> {
    const original = this.getProject(projectId);
    if (!original) return null;

    const baseName = newName || `${original.name}-copy`;
    const baseDir = path.dirname(original.path);

    // Find unique name
    let newPath = path.join(baseDir, baseName);
    let counter = 1;
    while (fs.existsSync(newPath)) {
      newPath = path.join(baseDir, `${baseName}-${counter}`);
      counter++;
    }

    const finalName = path.basename(newPath);

    try {
      // Copy directory recursively
      await fsPromises.cp(original.path, newPath, { recursive: true });

      // Register new project
      const metadata: ProjectMetadata = original.metadata
        ? JSON.parse(original.metadata)
        : {};

      const newProject = this.registerProject({
        sessionId: targetSessionId || original.session_id || undefined,
        name: finalName,
        type: original.type,
        path: newPath,
        sourceUrl: original.source_url,
        metadata: {
          ...metadata,
          duplicatedFrom: original.id,
        },
      });

      this.updateStatus(newProject.id, 'ready');

      console.log('📋 Duplicated project:', { from: original.name, to: finalName });

      return newProject;
    } catch (err) {
      console.error('❌ Failed to duplicate project:', err);
      return null;
    }
  }

  /**
   * Delete a project (and optionally its files)
   */
  async deleteProject(projectId: string, deleteFiles = false): Promise<boolean> {
    const project = this.getProject(projectId);
    if (!project) return false;

    if (deleteFiles && fs.existsSync(project.path)) {
      try {
        await fsPromises.rm(project.path, { recursive: true, force: true });
        console.log('🗑️ Deleted project files:', project.path);
      } catch (err) {
        console.error('❌ Failed to delete project files:', err);
        return false;
      }
    }

    const result = this.db.run('DELETE FROM projects WHERE id = ?', [projectId]);
    return result.changes > 0;
  }

  /**
   * Get orphaned projects (not linked to any session)
   */
  getOrphanedProjects(): Project[] {
    return this.db.query<Project, []>(
      'SELECT * FROM projects WHERE session_id IS NULL ORDER BY updated_at DESC'
    ).all();
  }

  /**
   * Clean up projects with missing directories
   */
  async cleanupMissing(): Promise<{ removed: string[]; errors: string[] }> {
    const removed: string[] = [];
    const errors: string[] = [];

    const allProjects = this.getAllProjects();

    for (const project of allProjects) {
      if (!fs.existsSync(project.path)) {
        try {
          this.db.run('DELETE FROM projects WHERE id = ?', [project.id]);
          removed.push(project.name);
          console.log('🧹 Removed missing project:', project.name);
        } catch (err) {
          errors.push(`Failed to remove ${project.name}: ${err}`);
        }
      }
    }

    return { removed, errors };
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
export const projectRegistry = new ProjectRegistry();
