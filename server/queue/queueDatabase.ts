/**
 * Queue Database - SQLite schema and operations for tasks, triggers, workflows
 * Handles persistence, recovery, and query operations
 */

import { Database } from 'bun:sqlite';
import { Task, Trigger, Workflow, TaskStatus } from './types';
import { randomUUID } from 'crypto';

export class QueueDatabase {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
    this.initializeSchema();
  }

  /**
   * Initialize database schema for queue system
   */
  private initializeSchema(): void {
    // Tasks Table - Core task definitions and state
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue_tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,

        prompt TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'general',
        model TEXT NOT NULL,

        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'normal',

        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        last_attempt_at INTEGER,
        completed_at INTEGER,

        result TEXT,
        error TEXT,
        error_stack TEXT,

        triggered_by TEXT,
        retry_delay INTEGER,
        timeout INTEGER DEFAULT 30000,

        scheduled_for INTEGER,
        recurring_rule TEXT,

        workflow_id TEXT,
        metadata JSON,
        tags JSON,

        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER,

        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (workflow_id) REFERENCES queue_workflows(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_queue_tasks_session ON queue_tasks(session_id);
      CREATE INDEX IF NOT EXISTS idx_queue_tasks_status ON queue_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_queue_tasks_priority ON queue_tasks(priority, status);
      CREATE INDEX IF NOT EXISTS idx_queue_tasks_scheduled ON queue_tasks(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_queue_tasks_created ON queue_tasks(created_at DESC);
    `);

    // Triggers Table - Event-based task triggers
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue_triggers (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,

        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,

        target_task_id TEXT,
        task_template JSON,

        condition_type TEXT,
        condition_data JSON,

        schedule TEXT,
        webhook_url TEXT,
        webhook_secret TEXT,

        is_active INTEGER DEFAULT 1,
        last_triggered_at INTEGER,

        metadata JSON,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,

        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_queue_triggers_session ON queue_triggers(session_id);
      CREATE INDEX IF NOT EXISTS idx_queue_triggers_active ON queue_triggers(is_active);
      CREATE INDEX IF NOT EXISTS idx_queue_triggers_type ON queue_triggers(type);
    `);

    // Workflows Table - Task workflows and chains
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue_workflows (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,

        name TEXT NOT NULL,
        description TEXT,

        task_ids JSON,
        trigger_ids JSON,

        max_concurrent INTEGER DEFAULT 2,
        timeout INTEGER DEFAULT 300000,

        retry_policy JSON,

        status TEXT NOT NULL DEFAULT 'draft',
        completed_at INTEGER,
        total_duration INTEGER,

        metadata JSON,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,

        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_queue_workflows_session ON queue_workflows(session_id);
      CREATE INDEX IF NOT EXISTS idx_queue_workflows_status ON queue_workflows(status);
    `);

    // Task Dependencies Table - Track task relationships
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue_task_dependencies (
        id TEXT PRIMARY KEY,
        from_task_id TEXT NOT NULL,
        to_task_id TEXT NOT NULL,

        dependency_type TEXT NOT NULL DEFAULT 'sequential',

        created_at INTEGER NOT NULL,

        FOREIGN KEY (from_task_id) REFERENCES queue_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (to_task_id) REFERENCES queue_tasks(id) ON DELETE CASCADE,

        UNIQUE(from_task_id, to_task_id)
      );

      CREATE INDEX IF NOT EXISTS idx_task_deps_from ON queue_task_dependencies(from_task_id);
      CREATE INDEX IF NOT EXISTS idx_task_deps_to ON queue_task_dependencies(to_task_id);
    `);

    // Execution History Table - Track execution metrics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue_execution_history (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,

        status TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,

        execution_time INTEGER,
        input_tokens INTEGER,
        output_tokens INTEGER,
        total_tokens INTEGER,

        error TEXT,
        metadata JSON,

        created_at INTEGER NOT NULL,

        FOREIGN KEY (task_id) REFERENCES queue_tasks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_execution_task ON queue_execution_history(task_id);
      CREATE INDEX IF NOT EXISTS idx_execution_time ON queue_execution_history(start_time DESC);
    `);

    // Queue Metrics Table - System health and performance
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue_metrics (
        id TEXT PRIMARY KEY,

        timestamp INTEGER NOT NULL,

        total_tasks INTEGER,
        pending_tasks INTEGER,
        running_tasks INTEGER,
        completed_tasks INTEGER,
        failed_tasks INTEGER,

        avg_execution_time REAL,
        success_rate REAL,

        active_workers INTEGER,
        queue_depth INTEGER,

        memory_used INTEGER,
        memory_total INTEGER,

        metadata JSON,

        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON queue_metrics(timestamp DESC);
    `);

    console.log('✅ Queue database schema initialized');
  }

  // ==================== TASK OPERATIONS ====================

  /**
   * Create a new task
   */
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const id = randomUUID();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO queue_tasks (
        id, session_id, prompt, mode, model, status, priority,
        attempts, max_attempts, retry_delay, timeout, workflow_id,
        metadata, tags, created_at, updated_at, scheduled_for, recurring_rule
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const bindings: (string | number | null)[] = [
      id,
      task.sessionId,
      task.prompt,
      task.mode,
      task.model,
      task.status,
      task.priority,
      task.attempts || 0,
      task.maxAttempts || 3,
      task.retryDelay || 0,
      task.timeout || 30000,
      task.workflowId || null,
      task.metadata ? JSON.stringify(task.metadata) : null,
      task.tags ? JSON.stringify(task.tags) : null,
      now,
      now,
      task.scheduledFor || null,
      task.recurringRule || null
    ];

    stmt.run(...bindings);

    return this.getTask(id) as Task;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | null {
    const stmt = this.db.prepare('SELECT * FROM queue_tasks WHERE id = ?');
    const row = stmt.get(taskId) as any;

    if (!row) return null;

    return this.parseTaskRow(row);
  }

  /**
   * Get pending tasks for execution
   */
  getPendingTasks(limit: number = 50): Task[] {
    const stmt = this.db.prepare(`
      SELECT * FROM queue_tasks
      WHERE status = 'pending'
      AND (scheduled_for IS NULL OR scheduled_for <= ?)
      ORDER BY priority = 'critical' DESC, priority = 'high' DESC, created_at ASC
      LIMIT ?
    `);

    const rows = stmt.all(Date.now(), limit) as any[];
    return rows.map(row => this.parseTaskRow(row));
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: TaskStatus, metadata?: Record<string, unknown>): void {
    const updates: string[] = ['status = ?', 'updated_at = ?'];
    const values: any[] = [status, Date.now()];

    if (metadata) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(metadata));
    }

    if (status === 'running') {
      updates.push('last_attempt_at = ?');
      values.push(Date.now());
    }

    if (status === 'completed') {
      updates.push('completed_at = ?');
      values.push(Date.now());
    }

    values.push(taskId);

    const stmt = this.db.prepare(`
      UPDATE queue_tasks SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
  }

  /**
   * Update task with result
   */
  updateTaskResult(taskId: string, result: string, error?: string): void {
    const stmt = this.db.prepare(`
      UPDATE queue_tasks
      SET result = ?, error = ?, status = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      result,
      error || null,
      error ? 'failed' : 'completed',
      Date.now(),
      Date.now(),
      taskId
    );
  }

  /**
   * Increment task attempt counter
   */
  incrementAttempts(taskId: string): void {
    const stmt = this.db.prepare(`
      UPDATE queue_tasks
      SET attempts = attempts + 1, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), taskId);
  }

  /**
   * Schedule task for retry
   */
  scheduleRetry(taskId: string, delayMs: number): void {
    const stmt = this.db.prepare(`
      UPDATE queue_tasks
      SET status = 'retry', scheduled_for = ?, retry_delay = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(Date.now() + delayMs, delayMs, Date.now(), taskId);
  }

  /**
   * Get tasks by session
   */
  getSessionTasks(sessionId: string, status?: TaskStatus): Task[] {
    let query = 'SELECT * FROM queue_tasks WHERE session_id = ?';
    const params: any[] = [sessionId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 1000';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.parseTaskRow(row));
  }

  // ==================== TRIGGER OPERATIONS ====================

  /**
   * Create a new trigger
   */
  createTrigger(trigger: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'>): Trigger {
    const id = randomUUID();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO queue_triggers (
        id, session_id, type, name, description, target_task_id,
        task_template, condition_type, condition_data, schedule,
        webhook_url, webhook_secret, is_active, metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      trigger.sessionId,
      trigger.type,
      trigger.name,
      trigger.description || null,
      trigger.targetTaskId || null,
      trigger.taskTemplate ? JSON.stringify(trigger.taskTemplate) : null,
      trigger.condition?.type || null,
      trigger.condition ? JSON.stringify(trigger.condition) : null,
      trigger.schedule || null,
      trigger.webhookUrl || null,
      trigger.webhookSecret || null,
      trigger.isActive ? 1 : 0,
      trigger.metadata ? JSON.stringify(trigger.metadata) : null,
      now,
      now
    );

    return this.getTrigger(id) as Trigger;
  }

  /**
   * Get trigger by ID
   */
  getTrigger(triggerId: string): Trigger | null {
    const stmt = this.db.prepare('SELECT * FROM queue_triggers WHERE id = ?');
    const row = stmt.get(triggerId) as any;

    if (!row) return null;

    return this.parseTriggerRow(row);
  }

  /**
   * Get active triggers for session
   */
  getActiveTriggers(sessionId: string): Trigger[] {
    const stmt = this.db.prepare(`
      SELECT * FROM queue_triggers
      WHERE session_id = ? AND is_active = 1
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(sessionId) as any[];
    return rows.map(row => this.parseTriggerRow(row));
  }

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * Create a new workflow
   */
  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Workflow {
    const id = randomUUID();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO queue_workflows (
        id, session_id, name, description, task_ids, trigger_ids,
        max_concurrent, timeout, retry_policy, status, metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      workflow.sessionId,
      workflow.name,
      workflow.description || null,
      JSON.stringify(workflow.taskIds),
      JSON.stringify(workflow.triggerIds),
      workflow.maxConcurrent,
      workflow.timeout,
      JSON.stringify(workflow.retryPolicy),
      workflow.status,
      workflow.metadata ? JSON.stringify(workflow.metadata) : null,
      now,
      now
    );

    return this.getWorkflow(id) as Workflow;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | null {
    const stmt = this.db.prepare('SELECT * FROM queue_workflows WHERE id = ?');
    const row = stmt.get(workflowId) as any;

    if (!row) return null;

    return this.parseWorkflowRow(row);
  }

  // ==================== STATISTICS OPERATIONS ====================

  /**
   * Get queue statistics
   */
  getQueueStats(sessionId?: string): Record<string, number> {
    let where = '';
    const params: any[] = [];

    if (sessionId) {
      where = 'WHERE session_id = ?';
      params.push(sessionId);
    }

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_tasks,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_tasks,
        COALESCE(SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END), 0) as running_tasks,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_tasks,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed_tasks
      FROM queue_tasks
      ${where}
    `);

    const row = stmt.get(...params) as Record<string, number | null>;
    // Ensure all values are numbers (not null)
    return {
      total_tasks: row?.total_tasks ?? 0,
      pending_tasks: row?.pending_tasks ?? 0,
      running_tasks: row?.running_tasks ?? 0,
      completed_tasks: row?.completed_tasks ?? 0,
      failed_tasks: row?.failed_tasks ?? 0,
    };
  }

  /**
   * Cleanup old completed and failed tasks
   */
  cleanupOldTasks(retentionDays: number): number {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    const stmt = this.db.prepare(`
      DELETE FROM queue_tasks
      WHERE (status IN ('completed', 'failed'))
      AND updated_at < ?
    `);

    const result = stmt.run(cutoffTime);
    console.log(`🗑️  Cleaned up ${result.changes} old tasks`);
    return result.changes || 0;
  }

  // ==================== TRANSACTION SUPPORT ====================

  /**
   * Begin a database transaction for batch operations
   */
  beginTransaction(): void {
    this.db.exec('BEGIN TRANSACTION');
  }

  /**
   * Commit the current transaction
   */
  commitTransaction(): void {
    this.db.exec('COMMIT');
  }

  /**
   * Rollback the current transaction
   */
  rollbackTransaction(): void {
    this.db.exec('ROLLBACK');
  }

  /**
   * Update task priority
   */
  updateTaskPriority(taskId: string, priority: 'critical' | 'high' | 'normal' | 'low'): void {
    const stmt = this.db.prepare(`
      UPDATE queue_tasks
      SET priority = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(priority, Date.now(), taskId);
  }

  /**
   * Get pending tasks with weighted priority scoring
   * Critical = 100, High = 75, Normal = 50, Low = 25
   * Also considers wait time to prevent starvation
   */
  getPendingTasksWeighted(limit: number = 50): Task[] {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT *,
        CASE priority
          WHEN 'critical' THEN 100
          WHEN 'high' THEN 75
          WHEN 'normal' THEN 50
          WHEN 'low' THEN 25
          ELSE 50
        END +
        MIN((? - created_at) / 60000, 50) as priority_score
      FROM queue_tasks
      WHERE status IN ('pending', 'retry')
      AND (scheduled_for IS NULL OR scheduled_for <= ?)
      ORDER BY priority_score DESC, created_at ASC
      LIMIT ?
    `);

    const rows = stmt.all(now, now, limit) as any[];
    return rows.map(row => this.parseTaskRow(row));
  }

  /**
   * Batch update task statuses
   */
  updateTasksBatch(taskIds: string[], status: TaskStatus): number {
    if (taskIds.length === 0) return 0;

    const placeholders = taskIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      UPDATE queue_tasks
      SET status = ?, updated_at = ?
      WHERE id IN (${placeholders})
    `);

    const result = stmt.run(status, Date.now(), ...taskIds);
    return result.changes || 0;
  }

  /**
   * Get queue statistics with average attempts
   */
  getQueueStatsExtended(sessionId?: string): Record<string, number> {
    let where = '';
    const params: any[] = [];

    if (sessionId) {
      where = 'WHERE session_id = ?';
      params.push(sessionId);
    }

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalTasks,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pendingTasks,
        COALESCE(SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END), 0) as runningTasks,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completedTasks,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failedTasks,
        COALESCE(AVG(attempts), 1) as averageAttempts,
        COALESCE(SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END), 0) as criticalTasks,
        COALESCE(SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END), 0) as highPriorityTasks
      FROM queue_tasks
      ${where}
    `);

    const row = stmt.get(...params) as Record<string, number | null>;
    return {
      totalTasks: row?.totalTasks ?? 0,
      pendingTasks: row?.pendingTasks ?? 0,
      runningTasks: row?.runningTasks ?? 0,
      completedTasks: row?.completedTasks ?? 0,
      failedTasks: row?.failedTasks ?? 0,
      averageAttempts: row?.averageAttempts ?? 1,
      criticalTasks: row?.criticalTasks ?? 0,
      highPriorityTasks: row?.highPriorityTasks ?? 0,
    };
  }

  // ==================== HELPER METHODS ====================

  private parseTaskRow(row: any): Task {
    return {
      id: row.id,
      sessionId: row.session_id,
      prompt: row.prompt,
      mode: row.mode,
      model: row.model,
      status: row.status,
      priority: row.priority,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      lastAttemptAt: row.last_attempt_at,
      completedAt: row.completed_at,
      result: row.result,
      error: row.error,
      errorStack: row.error_stack,
      triggeredBy: row.triggered_by,
      retryDelay: row.retry_delay,
      timeout: row.timeout,
      scheduledFor: row.scheduled_for,
      recurringRule: row.recurring_rule,
      workflowId: row.workflow_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    };
  }

  private parseTriggerRow(row: any): Trigger {
    return {
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      name: row.name,
      description: row.description,
      targetTaskId: row.target_task_id,
      taskTemplate: row.task_template ? JSON.parse(row.task_template) : undefined,
      condition: row.condition_data ? JSON.parse(row.condition_data) : undefined,
      schedule: row.schedule,
      webhookUrl: row.webhook_url,
      webhookSecret: row.webhook_secret,
      isActive: row.is_active === 1,
      lastTriggeredAt: row.last_triggered_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private parseWorkflowRow(row: any): Workflow {
    return {
      id: row.id,
      sessionId: row.session_id,
      name: row.name,
      description: row.description,
      taskIds: JSON.parse(row.task_ids),
      triggerIds: JSON.parse(row.trigger_ids),
      maxConcurrent: row.max_concurrent,
      timeout: row.timeout,
      retryPolicy: JSON.parse(row.retry_policy),
      status: row.status,
      completedAt: row.completed_at,
      totalDuration: row.total_duration,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
