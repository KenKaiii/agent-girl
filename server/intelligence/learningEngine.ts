/**
 * Agent Girl - Self-Learning Preference Engine
 * Learns from user corrections, approvals, and explicit preferences
 * Applies learned preferences automatically in future interactions
 */

import { Database } from 'bun:sqlite';
import type {
  UserPreference,
  PreferenceCategory,
  LearningEvent,
  ExecutionContext,
} from './types';

// Singleton instance
let instance: LearningEngine | null = null;

export class LearningEngine {
  private db: Database;
  private cache: Map<string, UserPreference[]> = new Map();
  private readonly CONFIDENCE_DECAY = 0.95; // Per month
  private readonly MIN_CONFIDENCE = 0.3;
  private readonly MAX_CONFIDENCE = 0.99;

  private constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
    this.loadCache();
  }

  static getInstance(dbPath = './data/learning.db'): LearningEngine {
    if (!instance) {
      instance = new LearningEngine(dbPath);
    }
    return instance;
  }

  private initSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS preferences (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        category TEXT NOT NULL,
        preference TEXT NOT NULL,
        anti_preference TEXT,
        confidence REAL DEFAULT 0.5,
        reinforcements INTEGER DEFAULT 1,
        last_used INTEGER NOT NULL,
        context TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS learning_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        original TEXT,
        corrected TEXT,
        context TEXT,
        timestamp INTEGER NOT NULL,
        processed INTEGER DEFAULT 0
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_preferences_category
      ON preferences(category)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_preferences_pattern
      ON preferences(pattern)
    `);
  }

  private loadCache(): void {
    const prefs = this.db.query(`
      SELECT * FROM preferences
      WHERE confidence >= ?
      ORDER BY confidence DESC
    `).all(this.MIN_CONFIDENCE) as UserPreference[];

    // Group by category for fast lookup
    for (const pref of prefs) {
      const key = pref.category;
      if (!this.cache.has(key)) {
        this.cache.set(key, []);
      }
      this.cache.get(key)!.push({
        ...pref,
        context: pref.context ? JSON.parse(pref.context as unknown as string) : undefined,
      });
    }
  }

  // ============================================================
  // LEARNING FROM EVENTS
  // ============================================================

  /**
   * Learn from a user correction
   * "Nein, benutze lieber X statt Y"
   */
  async learnFromCorrection(
    original: string,
    corrected: string,
    context: ExecutionContext
  ): Promise<void> {
    const event: LearningEvent = {
      type: 'correction',
      original,
      corrected,
      context,
      timestamp: Date.now(),
    };

    // Extract preference from correction
    const preference = await this.extractPreference(event);
    if (preference) {
      await this.storePreference(preference);
    }

    // Store event for batch learning
    this.storeEvent(event);
  }

  /**
   * Learn from explicit user statement
   * "Ich bevorzuge immer TypeScript strict mode"
   */
  async learnExplicit(
    statement: string,
    category: PreferenceCategory,
    context: ExecutionContext
  ): Promise<void> {
    const preference: UserPreference = {
      id: this.generateId(),
      pattern: this.extractPattern(statement),
      category,
      preference: statement,
      confidence: 0.9, // High confidence for explicit statements
      reinforcements: 1,
      lastUsed: Date.now(),
      context: this.extractContextTags(context),
    };

    await this.storePreference(preference);
  }

  /**
   * Reinforce existing preference when user approves
   */
  async reinforcePreference(preferenceId: string): Promise<void> {
    const pref = this.db.query(`
      SELECT * FROM preferences WHERE id = ?
    `).get(preferenceId) as UserPreference | null;

    if (pref) {
      const newConfidence = Math.min(
        pref.confidence * 1.1,
        this.MAX_CONFIDENCE
      );
      const newReinforcements = pref.reinforcements + 1;

      this.db.run(`
        UPDATE preferences
        SET confidence = ?, reinforcements = ?, last_used = ?
        WHERE id = ?
      `, [newConfidence, newReinforcements, Date.now(), preferenceId]);

      this.invalidateCache(pref.category);
    }
  }

  /**
   * Weaken preference when user rejects suggestion
   */
  async weakenPreference(preferenceId: string): Promise<void> {
    const pref = this.db.query(`
      SELECT * FROM preferences WHERE id = ?
    `).get(preferenceId) as UserPreference | null;

    if (pref) {
      const newConfidence = pref.confidence * 0.7;

      if (newConfidence < this.MIN_CONFIDENCE) {
        this.db.run(`DELETE FROM preferences WHERE id = ?`, [preferenceId]);
      } else {
        this.db.run(`
          UPDATE preferences SET confidence = ? WHERE id = ?
        `, [newConfidence, preferenceId]);
      }

      this.invalidateCache(pref.category);
    }
  }

  // ============================================================
  // PREFERENCE RETRIEVAL
  // ============================================================

  /**
   * Get all preferences for a category, sorted by confidence
   */
  getPreferences(category: PreferenceCategory): UserPreference[] {
    return this.cache.get(category) || [];
  }

  /**
   * Get preferences matching a context
   */
  getContextualPreferences(
    category: PreferenceCategory,
    context: ExecutionContext
  ): UserPreference[] {
    const prefs = this.getPreferences(category);
    const contextTags = this.extractContextTags(context);

    return prefs.filter(pref => {
      if (!pref.context || pref.context.length === 0) return true;
      return pref.context.some(tag => contextTags.includes(tag));
    });
  }

  /**
   * Check if a specific preference exists
   */
  hasPreference(pattern: string, category: PreferenceCategory): UserPreference | null {
    const prefs = this.getPreferences(category);
    return prefs.find(p =>
      p.pattern.toLowerCase().includes(pattern.toLowerCase()) ||
      pattern.toLowerCase().includes(p.pattern.toLowerCase())
    ) || null;
  }

  /**
   * Apply preferences to a prompt/response
   * Returns modified content with preferences applied
   */
  applyPreferences(
    content: string,
    category: PreferenceCategory,
    context: ExecutionContext
  ): { content: string; appliedPreferences: string[] } {
    const prefs = this.getContextualPreferences(category, context);
    const applied: string[] = [];
    let modified = content;

    for (const pref of prefs) {
      if (pref.confidence >= 0.7) {
        // High confidence: apply automatically
        if (pref.antiPreference && modified.includes(pref.antiPreference)) {
          modified = modified.replace(
            new RegExp(this.escapeRegex(pref.antiPreference), 'g'),
            pref.preference
          );
          applied.push(pref.id);
        }
      }
    }

    // Update last used for applied preferences
    for (const id of applied) {
      this.db.run(`UPDATE preferences SET last_used = ? WHERE id = ?`, [Date.now(), id]);
    }

    return { content: modified, appliedPreferences: applied };
  }

  /**
   * Get preference summary for system prompt injection
   */
  getPreferenceSummary(context: ExecutionContext): string {
    const categories: PreferenceCategory[] = [
      'code_style', 'architecture', 'tooling', 'workflow'
    ];

    const summaries: string[] = [];

    for (const cat of categories) {
      const prefs = this.getContextualPreferences(cat, context)
        .filter(p => p.confidence >= 0.7)
        .slice(0, 5); // Top 5 per category

      if (prefs.length > 0) {
        const items = prefs.map(p => `- ${p.preference}`).join('\n');
        summaries.push(`**${cat}:**\n${items}`);
      }
    }

    if (summaries.length === 0) return '';

    return `\n## User Preferences (Auto-Learned)\n${summaries.join('\n\n')}\n`;
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private async extractPreference(event: LearningEvent): Promise<UserPreference | null> {
    if (event.type !== 'correction' || !event.corrected) return null;

    // Pattern extraction from correction
    const category = this.inferCategory(event.original, event.corrected);
    const pattern = this.extractPattern(event.corrected);

    return {
      id: this.generateId(),
      pattern,
      category,
      preference: event.corrected,
      antiPreference: event.original,
      confidence: 0.6, // Start medium, increase with reinforcement
      reinforcements: 1,
      lastUsed: Date.now(),
      context: this.extractContextTags(event.context),
    };
  }

  private inferCategory(original: string, corrected: string): PreferenceCategory {
    const lower = (original + corrected).toLowerCase();

    if (/\b(const|let|var|function|class|interface|type)\b/.test(lower)) {
      return 'code_style';
    }
    if (/\b(folder|directory|structure|file|module)\b/.test(lower)) {
      return 'architecture';
    }
    if (/\b(library|package|framework|dependency)\b/.test(lower)) {
      return 'tooling';
    }
    if (/\b(git|commit|deploy|test|ci|cd)\b/.test(lower)) {
      return 'workflow';
    }
    if (/\b(fast|slow|optimize|performance|cache)\b/.test(lower)) {
      return 'performance';
    }
    if (/\b(auth|encrypt|password|token|secret)\b/.test(lower)) {
      return 'security';
    }

    return 'code_style'; // Default
  }

  private extractPattern(text: string): string {
    // Extract key terms (nouns, technical terms)
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Return unique meaningful words
    return [...new Set(words)].slice(0, 10).join(' ');
  }

  private extractContextTags(context: ExecutionContext): string[] {
    const tags: string[] = [];

    if (context.framework) tags.push(context.framework.toLowerCase());
    if (context.language) tags.push(context.language.toLowerCase());
    if (context.projectType) tags.push(context.projectType.toLowerCase());
    if (context.environment) tags.push(context.environment);

    // Extract from dependencies
    const importantDeps = ['react', 'vue', 'svelte', 'astro', 'next', 'nuxt', 'express', 'fastify'];
    for (const dep of context.dependencies || []) {
      if (importantDeps.includes(dep.toLowerCase())) {
        tags.push(dep.toLowerCase());
      }
    }

    return [...new Set(tags)];
  }

  private async storePreference(pref: UserPreference): Promise<void> {
    // Check for existing similar preference
    const existing = this.db.query(`
      SELECT * FROM preferences
      WHERE pattern = ? AND category = ?
    `).get(pref.pattern, pref.category) as UserPreference | null;

    if (existing) {
      // Merge: increase confidence
      const newConfidence = Math.min(
        existing.confidence + 0.1,
        this.MAX_CONFIDENCE
      );
      this.db.run(`
        UPDATE preferences
        SET confidence = ?, reinforcements = reinforcements + 1, last_used = ?
        WHERE id = ?
      `, [newConfidence, Date.now(), existing.id]);
    } else {
      // Insert new
      this.db.run(`
        INSERT INTO preferences
        (id, pattern, category, preference, anti_preference, confidence, reinforcements, last_used, context, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pref.id,
        pref.pattern,
        pref.category,
        pref.preference,
        pref.antiPreference || null,
        pref.confidence,
        pref.reinforcements,
        pref.lastUsed,
        pref.context ? JSON.stringify(pref.context) : null,
        Date.now(),
      ]);
    }

    this.invalidateCache(pref.category);
  }

  private storeEvent(event: LearningEvent): void {
    this.db.run(`
      INSERT INTO learning_events (type, original, corrected, context, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `, [
      event.type,
      event.original,
      event.corrected || null,
      JSON.stringify(event.context),
      event.timestamp,
    ]);
  }

  private invalidateCache(category: PreferenceCategory): void {
    this.cache.delete(category);
    // Reload this category
    const prefs = this.db.query(`
      SELECT * FROM preferences
      WHERE category = ? AND confidence >= ?
      ORDER BY confidence DESC
    `).all(category, this.MIN_CONFIDENCE) as UserPreference[];

    this.cache.set(category, prefs.map(p => ({
      ...p,
      context: p.context ? JSON.parse(p.context as unknown as string) : undefined,
    })));
  }

  private generateId(): string {
    return `pref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ============================================================
  // MAINTENANCE
  // ============================================================

  /**
   * Decay old preferences (run monthly)
   */
  decayPreferences(): void {
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    this.db.run(`
      UPDATE preferences
      SET confidence = confidence * ?
      WHERE last_used < ?
    `, [this.CONFIDENCE_DECAY, oneMonthAgo]);

    // Remove very low confidence
    this.db.run(`
      DELETE FROM preferences WHERE confidence < ?
    `, [this.MIN_CONFIDENCE]);

    // Reload cache
    this.cache.clear();
    this.loadCache();
  }

  /**
   * Export preferences for backup
   */
  exportPreferences(): UserPreference[] {
    return this.db.query(`SELECT * FROM preferences`).all() as UserPreference[];
  }

  /**
   * Import preferences from backup
   */
  importPreferences(prefs: UserPreference[]): void {
    for (const pref of prefs) {
      this.storePreference(pref);
    }
  }
}

// Export singleton getter
export const getLearningEngine = LearningEngine.getInstance;
