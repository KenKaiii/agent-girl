/**
 * Trigger Engine - Manages event-based task execution
 * Handles scheduled tasks, webhooks, conditions, and task chaining
 */

import { QueueDatabase } from './queueDatabase';
import { Trigger, TriggerCondition, Task, TaskStatus } from './types';
import EventEmitter from 'events';

// Simple CRON parser for scheduling
interface CronSchedule {
  minute?: number[];
  hour?: number[];
  dayOfMonth?: number[];
  month?: number[];
  dayOfWeek?: number[];
}

export class TriggerEngine extends EventEmitter {
  private db: QueueDatabase;
  private activeSchedules: Map<string, NodeJS.Timer> = new Map();
  private isRunning: boolean = false;

  constructor(db: QueueDatabase) {
    super();
    this.db = db;
  }

  /**
   * Start the trigger engine
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️  Trigger engine already running');
      return;
    }

    this.isRunning = true;
    console.log('🎯 Trigger engine started');

    // Load and activate all active triggers
    this.loadActiveTriggers();
  }

  /**
   * Stop the trigger engine
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('⚠️  Trigger engine not running');
      return;
    }

    this.isRunning = false;

    // Clear all scheduled timers
    for (const timer of this.activeSchedules.values()) {
      clearInterval(timer);
    }
    this.activeSchedules.clear();

    console.log('🛑 Trigger engine stopped');
  }

  /**
   * Load all active triggers from database
   */
  private loadActiveTriggers(): void {
    // This would load triggers from database for all sessions
    // For now, we'll load them on-demand when processing specific sessions
    console.log('📂 Trigger engine ready to process triggers');
  }

  /**
   * Create a new trigger
   */
  createTrigger(trigger: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'>): Trigger {
    const created = this.db.createTrigger(trigger);

    if (created.isActive && this.isRunning) {
      this.activateTrigger(created.id);
    }

    console.log(`➕ Trigger created: ${created.id} (${created.type})`);
    this.emit('trigger:created', created);

    return created;
  }

  /**
   * Activate a trigger
   */
  activateTrigger(triggerId: string): void {
    const trigger = this.db.getTrigger(triggerId);
    if (!trigger) {
      console.warn(`⚠️  Trigger not found: ${triggerId}`);
      return;
    }

    if (!trigger.isActive) {
      console.warn(`⚠️  Trigger not active: ${triggerId}`);
      return;
    }

    if (this.activeSchedules.has(triggerId)) {
      console.warn(`⚠️  Trigger already scheduled: ${triggerId}`);
      return;
    }

    // Set up trigger based on type
    switch (trigger.type) {
      case 'scheduled':
        this.setupScheduledTrigger(trigger);
        break;
      case 'webhook':
        console.log(`🔗 Webhook trigger activated: ${triggerId}`);
        break;
      case 'time-based':
        this.setupTimedTrigger(trigger);
        break;
      case 'condition-based':
        console.log(`📊 Condition-based trigger activated: ${triggerId}`);
        break;
      case 'chain':
        console.log(`⛓️  Chain trigger activated: ${triggerId}`);
        break;
      case 'ai-generated':
        console.log(`🤖 AI-generated trigger activated: ${triggerId}`);
        break;
      case 'manual':
        console.log(`🖱️  Manual trigger ready: ${triggerId}`);
        break;
    }

    this.emit('trigger:activated', { triggerId });
  }

  /**
   * Set up scheduled trigger (CRON-based)
   */
  private setupScheduledTrigger(trigger: Trigger): void {
    if (!trigger.schedule) {
      console.warn(`⚠️  No schedule provided for scheduled trigger: ${trigger.id}`);
      return;
    }

    // Parse CRON expression
    const schedule = this.parseCronExpression(trigger.schedule);

    // Set up interval to check if trigger should fire
    const timer = setInterval(() => {
      if (this.shouldFireSchedule(schedule)) {
        this.fireTrigger(trigger);
      }
    }, 60000); // Check every minute

    this.activeSchedules.set(trigger.id, timer);
    console.log(`⏰ Scheduled trigger activated: ${trigger.id} (${trigger.schedule})`);
  }

  /**
   * Set up timed trigger (fixed intervals)
   */
  private setupTimedTrigger(trigger: Trigger): void {
    const condition = trigger.condition as TriggerCondition | undefined;
    if (!condition || !condition.delayMs) {
      console.warn(`⚠️  No delay configured for timed trigger: ${trigger.id}`);
      return;
    }

    const timer = setInterval(() => {
      this.fireTrigger(trigger);
    }, condition.delayMs);

    this.activeSchedules.set(trigger.id, timer);
    console.log(`⏱️  Timed trigger activated: ${trigger.id} (interval: ${condition.delayMs}ms)`);
  }

  /**
   * Parse simple CRON expression (minute hour day month dayOfWeek)
   */
  private parseCronExpression(cron: string): CronSchedule {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) {
      console.warn(`⚠️  Invalid CRON expression: ${cron}`);
      return {};
    }

    return {
      minute: this.parseCronPart(parts[0], 0, 59),
      hour: this.parseCronPart(parts[1], 0, 23),
      dayOfMonth: this.parseCronPart(parts[2], 1, 31),
      month: this.parseCronPart(parts[3], 1, 12),
      dayOfWeek: this.parseCronPart(parts[4], 0, 6),
    };
  }

  /**
   * Parse individual CRON part (e.g., "0", "*", "0-5", "0,15,30,45")
   */
  private parseCronPart(part: string, min: number, max: number): number[] {
    if (part === '*') {
      return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }

    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      return Array.from({ length: end - start + 1 }, (_, i) => i + start);
    }

    if (part.includes(',')) {
      return part.split(',').map(Number);
    }

    return [Number(part)];
  }

  /**
   * Check if schedule should fire based on current time
   */
  private shouldFireSchedule(schedule: CronSchedule): boolean {
    const now = new Date();

    if (schedule.minute && !schedule.minute.includes(now.getMinutes())) {
      return false;
    }
    if (schedule.hour && !schedule.hour.includes(now.getHours())) {
      return false;
    }
    if (schedule.dayOfMonth && !schedule.dayOfMonth.includes(now.getDate())) {
      return false;
    }
    if (schedule.month && !schedule.month.includes(now.getMonth() + 1)) {
      return false;
    }
    if (schedule.dayOfWeek && !schedule.dayOfWeek.includes(now.getDay())) {
      return false;
    }

    return true;
  }

  /**
   * Fire a trigger and create task
   */
  async fireTrigger(trigger: Trigger): Promise<Task | null> {
    console.log(`🔥 Firing trigger: ${trigger.id} (${trigger.type})`);

    // Update last triggered time
    const now = Date.now();

    // If target task ID is specified, schedule that task
    if (trigger.targetTaskId) {
      const task = this.db.getTask(trigger.targetTaskId);
      if (task) {
        // Create a new task or update existing one
        console.log(`📋 Task triggered: ${trigger.targetTaskId}`);
        this.emit('trigger:fired', { triggerId: trigger.id, taskId: trigger.targetTaskId });
        return task;
      }
    }

    // If task template is provided, create new task from it
    if (trigger.taskTemplate) {
      const newTask = this.db.createTask({
        sessionId: trigger.sessionId,
        prompt: trigger.taskTemplate.prompt || 'Trigger-based task',
        mode: trigger.taskTemplate.mode || 'general',
        model: trigger.taskTemplate.model || 'claude-3-5-sonnet',
        status: 'pending' as TaskStatus,
        priority: trigger.taskTemplate.priority || 'normal',
        attempts: 0,
        maxAttempts: 3,
        triggeredBy: trigger.id,
      });

      console.log(`✨ Task created from trigger: ${newTask.id}`);
      this.emit('trigger:fired', { triggerId: trigger.id, taskId: newTask.id });
      return newTask;
    }

    // No task to execute
    console.warn(`⚠️  No task template or target for trigger: ${trigger.id}`);
    return null;
  }

  /**
   * Evaluate condition-based triggers
   */
  evaluateConditions(sessionId: string): void {
    // This would check all condition-based triggers for a session
    // and fire them if their conditions are met
    // For now, this is a placeholder for future implementation
  }

  /**
   * Handle task completion and fire chain triggers
   */
  handleTaskCompletion(taskId: string): void {
    const task = this.db.getTask(taskId);
    if (!task) return;

    // Check if this task is in any trigger chains
    // Fire dependent tasks if they exist
    console.log(`📍 Task completion detected: ${taskId}`);
    this.emit('task:completed', { taskId });
  }

  /**
   * Handle task failure and fire error triggers
   */
  handleTaskFailure(taskId: string, error: string): void {
    const task = this.db.getTask(taskId);
    if (!task) return;

    // Fire any error recovery triggers
    console.log(`⚠️  Task failure detected: ${taskId} - ${error}`);
    this.emit('task:failed', { taskId, error });
  }

  /**
   * Get active triggers for a session
   */
  getActiveTriggers(sessionId: string): Trigger[] {
    return this.db.getActiveTriggers(sessionId);
  }

  /**
   * Disable a trigger
   */
  disableTrigger(triggerId: string): boolean {
    const timer = this.activeSchedules.get(triggerId);
    if (timer) {
      clearInterval(timer);
      this.activeSchedules.delete(triggerId);
    }

    console.log(`⛔ Trigger disabled: ${triggerId}`);
    return true;
  }

  /**
   * Get trigger statistics
   */
  getStats(): {
    activeSchedules: number;
    totalTriggers: number;
  } {
    return {
      activeSchedules: this.activeSchedules.size,
      totalTriggers: this.activeSchedules.size,
    };
  }

  /**
   * Fire trigger manually
   */
  manuallyFireTrigger(triggerId: string): Promise<Task | null> {
    const trigger = this.db.getTrigger(triggerId);
    if (!trigger) {
      console.warn(`⚠️  Trigger not found: ${triggerId}`);
      return Promise.resolve(null);
    }

    return this.fireTrigger(trigger);
  }
}
