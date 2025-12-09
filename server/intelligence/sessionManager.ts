/**
 * Agent Girl - Session Manager with Intelligent Context Handoff
 * Manages context window limits and ensures smooth transitions between sessions
 *
 * Key Insight: LLMs hallucinate at ~100k tokens. Solution = controlled resets + smart handoff.
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// ============================================================
// TYPES
// ============================================================

export interface SessionContext {
  id: string;
  number: number;
  startedAt: number;
  endedAt?: number;

  // Token tracking
  tokensUsed: number;
  maxTokens: number;
  warningThreshold: number;

  // Context state
  files: ContextFile[];
  decisions: Decision[];
  artifacts: Artifact[];
  errors: SessionError[];

  // Handoff data
  handoff?: SessionHandoff;
}

export interface ContextFile {
  path: string;
  lastRead: number;
  relevance: 'critical' | 'high' | 'medium' | 'low';
  tokens: number;
  summary?: string;
}

export interface Decision {
  id: string;
  timestamp: number;
  description: string;
  reasoning: string;
  outcome: 'success' | 'failure' | 'pending';
  reversible: boolean;
}

export interface Artifact {
  id: string;
  type: 'code' | 'config' | 'doc' | 'test' | 'other';
  path: string;
  description: string;
  createdAt: number;
  tokens: number;
}

export interface SessionError {
  timestamp: number;
  type: 'typescript' | 'runtime' | 'test' | 'build' | 'validation' | 'other';
  message: string;
  file?: string;
  line?: number;
  resolved: boolean;
  resolution?: string;
}

export interface SessionHandoff {
  // What was accomplished
  completedTasks: string[];
  partialTasks: string[];

  // State snapshot
  appState: Record<string, unknown>;
  environmentState: {
    servicesRunning: string[];
    databaseState: string;
    gitBranch: string;
    lastCommit: string;
  };

  // Critical context for next session
  criticalFiles: Array<{ path: string; summary: string }>;
  activeErrors: SessionError[];
  pendingDecisions: string[];

  // Instructions
  nextSteps: string[];
  warnings: string[];
  recommendations: string[];

  // Compressed knowledge
  learnedPatterns: string[];
  avoidPatterns: string[];
}

export interface SessionManagerConfig {
  projectPath: string;
  maxTokens: number;
  warningThreshold: number;
  autoSaveInterval: number;
  maxSessions: number;
  compressionLevel: 'minimal' | 'balanced' | 'aggressive';
}

// ============================================================
// TOKEN ESTIMATION
// ============================================================

const TOKEN_ESTIMATES = {
  charPerToken: 4,
  codeMultiplier: 1.3,
  jsonMultiplier: 1.5,
  markdownMultiplier: 1.1,
};

function estimateTokens(content: string, type: 'code' | 'json' | 'markdown' | 'text' = 'text'): number {
  const base = Math.ceil(content.length / TOKEN_ESTIMATES.charPerToken);

  switch (type) {
    case 'code':
      return Math.ceil(base * TOKEN_ESTIMATES.codeMultiplier);
    case 'json':
      return Math.ceil(base * TOKEN_ESTIMATES.jsonMultiplier);
    case 'markdown':
      return Math.ceil(base * TOKEN_ESTIMATES.markdownMultiplier);
    default:
      return base;
  }
}

// ============================================================
// SESSION MANAGER
// ============================================================

export class SessionManager {
  private config: SessionManagerConfig;
  private currentSession: SessionContext | null = null;
  private sessionHistory: SessionContext[] = [];
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<SessionManagerConfig> & { projectPath: string }) {
    this.config = {
      projectPath: config.projectPath,
      maxTokens: config.maxTokens ?? 100000,
      warningThreshold: config.warningThreshold ?? 0.8,
      autoSaveInterval: config.autoSaveInterval ?? 60000,
      maxSessions: config.maxSessions ?? 100,
      compressionLevel: config.compressionLevel ?? 'balanced',
    };
  }

  // ============================================================
  // SESSION LIFECYCLE
  // ============================================================

  /**
   * Start new session with optional handoff from previous
   */
  async startSession(previousHandoff?: SessionHandoff): Promise<SessionContext> {
    // Load history
    await this.loadHistory();

    const sessionNumber = this.sessionHistory.length + 1;

    this.currentSession = {
      id: `session_${Date.now()}_${sessionNumber}`,
      number: sessionNumber,
      startedAt: Date.now(),
      tokensUsed: 0,
      maxTokens: this.config.maxTokens,
      warningThreshold: this.config.warningThreshold,
      files: [],
      decisions: [],
      artifacts: [],
      errors: [],
    };

    // Apply handoff context if available
    if (previousHandoff) {
      await this.applyHandoff(previousHandoff);
    }

    // Start auto-save
    this.startAutoSave();

    return this.currentSession;
  }

  /**
   * End current session and generate handoff
   */
  async endSession(): Promise<SessionHandoff> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.stopAutoSave();

    // Generate handoff
    const handoff = this.generateHandoff();
    this.currentSession.handoff = handoff;
    this.currentSession.endedAt = Date.now();

    // Save to history
    this.sessionHistory.push(this.currentSession);
    await this.saveHistory();

    // Save handoff document
    await this.saveHandoff(handoff);

    const result = handoff;
    this.currentSession = null;

    return result;
  }

  /**
   * Force session reset when approaching token limit
   */
  async forceReset(reason: string): Promise<SessionHandoff> {
    if (!this.currentSession) {
      throw new Error('No active session to reset');
    }

    // Add warning to handoff
    const handoff = this.generateHandoff();
    handoff.warnings.push(`Forced reset: ${reason}`);

    // End and restart
    await this.endSession();
    await this.startSession(handoff);

    return handoff;
  }

  // ============================================================
  // CONTEXT TRACKING
  // ============================================================

  /**
   * Track file read for context management
   */
  trackFileRead(path: string, content: string, relevance: ContextFile['relevance'] = 'medium'): void {
    if (!this.currentSession) return;

    const tokens = estimateTokens(content, this.getFileType(path));

    // Check for existing entry
    const existing = this.currentSession.files.find(f => f.path === path);
    if (existing) {
      existing.lastRead = Date.now();
      existing.relevance = relevance;
      existing.tokens = tokens;
    } else {
      this.currentSession.files.push({
        path,
        lastRead: Date.now(),
        relevance,
        tokens,
      });
    }

    this.currentSession.tokensUsed += tokens;
    this.checkTokenLimit();
  }

  /**
   * Track decision for context preservation
   */
  trackDecision(description: string, reasoning: string, reversible = true): string {
    if (!this.currentSession) return '';

    const decision: Decision = {
      id: `decision_${Date.now()}`,
      timestamp: Date.now(),
      description,
      reasoning,
      outcome: 'pending',
      reversible,
    };

    this.currentSession.decisions.push(decision);
    this.currentSession.tokensUsed += estimateTokens(description + reasoning);

    return decision.id;
  }

  /**
   * Update decision outcome
   */
  updateDecision(id: string, outcome: Decision['outcome']): void {
    if (!this.currentSession) return;

    const decision = this.currentSession.decisions.find(d => d.id === id);
    if (decision) {
      decision.outcome = outcome;
    }
  }

  /**
   * Track created artifact
   */
  trackArtifact(type: Artifact['type'], path: string, description: string): void {
    if (!this.currentSession) return;

    this.currentSession.artifacts.push({
      id: `artifact_${Date.now()}`,
      type,
      path,
      description,
      createdAt: Date.now(),
      tokens: estimateTokens(description),
    });
  }

  /**
   * Track error for handoff
   */
  trackError(
    type: SessionError['type'],
    message: string,
    file?: string,
    line?: number
  ): void {
    if (!this.currentSession) return;

    this.currentSession.errors.push({
      timestamp: Date.now(),
      type,
      message,
      file,
      line,
      resolved: false,
    });
  }

  /**
   * Mark error as resolved
   */
  resolveError(message: string, resolution: string): void {
    if (!this.currentSession) return;

    const error = this.currentSession.errors.find(
      e => e.message === message && !e.resolved
    );
    if (error) {
      error.resolved = true;
      error.resolution = resolution;
    }
  }

  // ============================================================
  // HANDOFF GENERATION
  // ============================================================

  /**
   * Generate comprehensive handoff for next session
   */
  private generateHandoff(): SessionHandoff {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const session = this.currentSession;

    // Categorize tasks
    const completedTasks = session.decisions
      .filter(d => d.outcome === 'success')
      .map(d => d.description);

    const partialTasks = session.decisions
      .filter(d => d.outcome === 'pending')
      .map(d => d.description);

    // Get critical files (high relevance, recently read)
    const criticalFiles = session.files
      .filter(f => f.relevance === 'critical' || f.relevance === 'high')
      .sort((a, b) => b.lastRead - a.lastRead)
      .slice(0, 10)
      .map(f => ({
        path: f.path,
        summary: f.summary || `${f.tokens} tokens`,
      }));

    // Active (unresolved) errors
    const activeErrors = session.errors.filter(e => !e.resolved);

    // Generate recommendations based on session analysis
    const recommendations = this.generateRecommendations();

    // Extract learned patterns
    const { learnedPatterns, avoidPatterns } = this.extractPatterns();

    return {
      completedTasks,
      partialTasks,
      appState: {},
      environmentState: {
        servicesRunning: [],
        databaseState: 'unknown',
        gitBranch: 'main',
        lastCommit: '',
      },
      criticalFiles,
      activeErrors,
      pendingDecisions: partialTasks,
      nextSteps: this.suggestNextSteps(),
      warnings: activeErrors.map(e => `Unresolved: ${e.message}`),
      recommendations,
      learnedPatterns,
      avoidPatterns,
    };
  }

  /**
   * Apply handoff from previous session
   */
  private async applyHandoff(handoff: SessionHandoff): Promise<void> {
    if (!this.currentSession) return;

    // Restore critical file references
    for (const file of handoff.criticalFiles) {
      this.currentSession.files.push({
        path: file.path,
        lastRead: Date.now(),
        relevance: 'high',
        tokens: 0,
        summary: file.summary,
      });
    }

    // Restore active errors
    for (const error of handoff.activeErrors) {
      this.currentSession.errors.push({ ...error });
    }

    // Create decisions for pending tasks
    for (const task of handoff.partialTasks) {
      this.trackDecision(task, 'Continued from previous session', true);
    }
  }

  // ============================================================
  // INTELLIGENT ANALYSIS
  // ============================================================

  /**
   * Generate recommendations based on session patterns
   */
  private generateRecommendations(): string[] {
    if (!this.currentSession) return [];

    const recommendations: string[] = [];
    const session = this.currentSession;

    // High error rate
    const errorRate = session.errors.length / Math.max(session.decisions.length, 1);
    if (errorRate > 0.3) {
      recommendations.push('High error rate detected. Consider smaller, incremental changes.');
    }

    // Too many files
    if (session.files.length > 20) {
      recommendations.push('Many files accessed. Focus on fewer files per session.');
    }

    // Token usage
    const tokenUsage = session.tokensUsed / session.maxTokens;
    if (tokenUsage > 0.7) {
      recommendations.push('High token usage. Consider session reset soon.');
    }

    // Unresolved errors
    const unresolvedCount = session.errors.filter(e => !e.resolved).length;
    if (unresolvedCount > 3) {
      recommendations.push(`${unresolvedCount} unresolved errors. Prioritize fixing these.`);
    }

    return recommendations;
  }

  /**
   * Extract patterns from session for learning
   */
  private extractPatterns(): { learnedPatterns: string[]; avoidPatterns: string[] } {
    if (!this.currentSession) {
      return { learnedPatterns: [], avoidPatterns: [] };
    }

    const learnedPatterns: string[] = [];
    const avoidPatterns: string[] = [];

    // Successful decisions = learned patterns
    for (const decision of this.currentSession.decisions) {
      if (decision.outcome === 'success') {
        learnedPatterns.push(decision.description);
      } else if (decision.outcome === 'failure') {
        avoidPatterns.push(decision.description);
      }
    }

    // Common error types = avoid patterns
    const errorTypes = new Map<string, number>();
    for (const error of this.currentSession.errors) {
      const count = errorTypes.get(error.type) || 0;
      errorTypes.set(error.type, count + 1);
    }

    for (const [type, count] of errorTypes) {
      if (count >= 2) {
        avoidPatterns.push(`Recurring ${type} errors`);
      }
    }

    return { learnedPatterns, avoidPatterns };
  }

  /**
   * Suggest next steps based on session state
   */
  private suggestNextSteps(): string[] {
    if (!this.currentSession) return [];

    const steps: string[] = [];
    const session = this.currentSession;

    // Priority 1: Unresolved errors
    const unresolvedErrors = session.errors.filter(e => !e.resolved);
    if (unresolvedErrors.length > 0) {
      steps.push(`Fix ${unresolvedErrors.length} unresolved error(s)`);
    }

    // Priority 2: Pending decisions
    const pendingDecisions = session.decisions.filter(d => d.outcome === 'pending');
    if (pendingDecisions.length > 0) {
      steps.push(`Complete: ${pendingDecisions[0].description}`);
    }

    // Priority 3: Validation
    if (session.artifacts.length > 0) {
      steps.push('Validate recent changes');
    }

    return steps;
  }

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================

  /**
   * Check if approaching token limit
   */
  private checkTokenLimit(): void {
    if (!this.currentSession) return;

    const usage = this.currentSession.tokensUsed / this.currentSession.maxTokens;

    if (usage >= 1.0) {
      // Force reset
      this.forceReset('Token limit exceeded');
    } else if (usage >= this.config.warningThreshold) {
      // Add warning
      console.warn(
        `[SessionManager] Token usage at ${Math.round(usage * 100)}% - consider session reset`
      );
    }
  }

  /**
   * Get current token usage
   */
  getTokenUsage(): { used: number; max: number; percentage: number } {
    if (!this.currentSession) {
      return { used: 0, max: this.config.maxTokens, percentage: 0 };
    }

    return {
      used: this.currentSession.tokensUsed,
      max: this.currentSession.maxTokens,
      percentage: Math.round((this.currentSession.tokensUsed / this.currentSession.maxTokens) * 100),
    };
  }

  /**
   * Compress context to free tokens
   */
  async compressContext(): Promise<number> {
    if (!this.currentSession) return 0;

    let freedTokens = 0;

    // Remove low-relevance files
    const toRemove = this.currentSession.files.filter(f => f.relevance === 'low');
    for (const file of toRemove) {
      freedTokens += file.tokens;
    }
    this.currentSession.files = this.currentSession.files.filter(f => f.relevance !== 'low');

    // Summarize old decisions
    const oldDecisions = this.currentSession.decisions.filter(
      d => Date.now() - d.timestamp > 30 * 60 * 1000 // 30 minutes old
    );

    for (const decision of oldDecisions) {
      const originalTokens = estimateTokens(decision.description + decision.reasoning);
      decision.reasoning = 'Compressed'; // Reduce reasoning to save tokens
      freedTokens += originalTokens - estimateTokens(decision.description + decision.reasoning);
    }

    this.currentSession.tokensUsed -= freedTokens;

    return freedTokens;
  }

  // ============================================================
  // PERSISTENCE
  // ============================================================

  private async loadHistory(): Promise<void> {
    const historyPath = join(this.config.projectPath, '.harness', 'session_history.json');

    if (existsSync(historyPath)) {
      const content = await readFile(historyPath, 'utf-8');
      this.sessionHistory = JSON.parse(content);
    }
  }

  private async saveHistory(): Promise<void> {
    const harnessDir = join(this.config.projectPath, '.harness');
    if (!existsSync(harnessDir)) {
      await mkdir(harnessDir, { recursive: true });
    }

    const historyPath = join(harnessDir, 'session_history.json');

    // Keep only maxSessions
    if (this.sessionHistory.length > this.config.maxSessions) {
      this.sessionHistory = this.sessionHistory.slice(-this.config.maxSessions);
    }

    await writeFile(historyPath, JSON.stringify(this.sessionHistory, null, 2));
  }

  private async saveHandoff(handoff: SessionHandoff): Promise<void> {
    const harnessDir = join(this.config.projectPath, '.harness');
    if (!existsSync(harnessDir)) {
      await mkdir(harnessDir, { recursive: true });
    }

    // JSON format for programmatic access
    const jsonPath = join(harnessDir, 'latest_handoff.json');
    await writeFile(jsonPath, JSON.stringify(handoff, null, 2));

    // Markdown format for human/AI reading (claude_progress.txt pattern)
    const mdPath = join(this.config.projectPath, 'claude_progress.txt');
    await writeFile(mdPath, this.handoffToMarkdown(handoff));
  }

  private handoffToMarkdown(handoff: SessionHandoff): string {
    const lines: string[] = [
      '# Session Handoff Document',
      '',
      '## Completed Tasks',
      ...handoff.completedTasks.map(t => `- [x] ${t}`),
      '',
      '## Partial/Pending Tasks',
      ...handoff.partialTasks.map(t => `- [ ] ${t}`),
      '',
      '## Current State',
      `- Git Branch: ${handoff.environmentState.gitBranch}`,
      `- Last Commit: ${handoff.environmentState.lastCommit}`,
      `- Database: ${handoff.environmentState.databaseState}`,
      `- Running Services: ${handoff.environmentState.servicesRunning.join(', ') || 'None'}`,
      '',
      '## Critical Files',
      ...handoff.criticalFiles.map(f => `- \`${f.path}\`: ${f.summary}`),
      '',
    ];

    if (handoff.activeErrors.length > 0) {
      lines.push('## ⚠️ Active Errors');
      for (const error of handoff.activeErrors) {
        lines.push(`- **${error.type}**: ${error.message}`);
        if (error.file) lines.push(`  - File: ${error.file}:${error.line || '?'}`);
      }
      lines.push('');
    }

    lines.push(
      '## Next Steps',
      ...handoff.nextSteps.map((s, i) => `${i + 1}. ${s}`),
      ''
    );

    if (handoff.warnings.length > 0) {
      lines.push('## Warnings', ...handoff.warnings.map(w => `- ⚠️ ${w}`), '');
    }

    if (handoff.recommendations.length > 0) {
      lines.push('## Recommendations', ...handoff.recommendations.map(r => `- 💡 ${r}`), '');
    }

    if (handoff.learnedPatterns.length > 0) {
      lines.push(
        '## Learned Patterns (What Worked)',
        ...handoff.learnedPatterns.map(p => `- ✅ ${p}`),
        ''
      );
    }

    if (handoff.avoidPatterns.length > 0) {
      lines.push(
        '## Avoid Patterns (What Failed)',
        ...handoff.avoidPatterns.map(p => `- ❌ ${p}`),
        ''
      );
    }

    return lines.join('\n');
  }

  // ============================================================
  // AUTO-SAVE
  // ============================================================

  private startAutoSave(): void {
    this.stopAutoSave();

    this.autoSaveTimer = setInterval(async () => {
      if (this.currentSession) {
        await this.saveCurrentSession();
      }
    }, this.config.autoSaveInterval);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private async saveCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    const sessionPath = join(
      this.config.projectPath,
      '.harness',
      `session_${this.currentSession.number}_current.json`
    );

    await writeFile(sessionPath, JSON.stringify(this.currentSession, null, 2));
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  private getFileType(path: string): 'code' | 'json' | 'markdown' | 'text' {
    const ext = path.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
      case 'py':
      case 'go':
      case 'rs':
      case 'java':
      case 'c':
      case 'cpp':
      case 'cs':
        return 'code';
      case 'json':
        return 'json';
      case 'md':
      case 'mdx':
        return 'markdown';
      default:
        return 'text';
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  getStatus(): {
    hasActiveSession: boolean;
    sessionNumber: number;
    tokenUsage: ReturnType<SessionManager['getTokenUsage']>;
    filesTracked: number;
    decisionsTracked: number;
    errorsActive: number;
  } {
    return {
      hasActiveSession: this.currentSession !== null,
      sessionNumber: this.currentSession?.number || 0,
      tokenUsage: this.getTokenUsage(),
      filesTracked: this.currentSession?.files.length || 0,
      decisionsTracked: this.currentSession?.decisions.length || 0,
      errorsActive: this.currentSession?.errors.filter(e => !e.resolved).length || 0,
    };
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createSessionManager(
  projectPath: string,
  config?: Partial<SessionManagerConfig>
): SessionManager {
  return new SessionManager({ projectPath, ...config });
}
