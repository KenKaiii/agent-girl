/**
 * Task Queue Manager - Orchestrates task execution with database persistence
 * Handles task lifecycle, status transitions, retries, and scheduling
 */

import { QueueDatabase } from './queueDatabase';
import { Task, TaskStatus, TaskExecutionResult } from './types';
import EventEmitter from 'events';

export class TaskQueue extends EventEmitter {
  private db: QueueDatabase;
  private maxConcurrentTasks: number;
  private runningTasks: Set<string> = new Set();
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timer | null = null;
  private pollIntervalMs: number = 1000;
  private processingScheduled: boolean = false;

  constructor(db: QueueDatabase, maxConcurrentTasks: number = 50) {
    super();
    this.db = db;
    this.maxConcurrentTasks = maxConcurrentTasks;
  }

  /**
   * Trigger immediate task processing (event-driven)
   * More efficient than waiting for next poll cycle
   */
  private scheduleProcessing(): void {
    if (this.processingScheduled || !this.isRunning) return;
    this.processingScheduled = true;
    setImmediate(() => {
      this.processingScheduled = false;
      this.processPendingTasks();
    });
  }

  /**
   * Start the queue processor
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️  Task queue already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Task queue started (max concurrent: ${this.maxConcurrentTasks})`);

    // Start polling for pending tasks
    this.pollInterval = setInterval(() => this.processPendingTasks(), this.pollIntervalMs);

    // Process immediately
    this.processPendingTasks();
  }

  /**
   * Stop the queue processor
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('⚠️  Task queue not running');
      return;
    }

    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    console.log('🛑 Task queue stopped');
  }

  /**
   * Process pending and scheduled tasks
   */
  private async processPendingTasks(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Get available worker slots
      const availableSlots = this.maxConcurrentTasks - this.runningTasks.size;
      if (availableSlots <= 0) return;

      // Get pending tasks ordered by priority and creation time
      const tasks = this.db.getPendingTasks(availableSlots);

      for (const task of tasks) {
        // Check if task should be scheduled for later
        if (task.scheduledFor && task.scheduledFor > Date.now()) {
          continue;
        }

        // Execute task
        this.executeTask(task).catch(error => {
          console.error(`❌ Error executing task ${task.id}:`, error);
          this.db.updateTaskStatus(task.id, 'failed');
        });
      }
    } catch (error) {
      console.error('❌ Error processing pending tasks:', error);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task): Promise<void> {
    const taskId = task.id;

    // Check if already running
    if (this.runningTasks.has(taskId)) {
      console.warn(`⚠️  Task ${taskId} already running`);
      return;
    }

    // Mark as running
    this.runningTasks.add(taskId);
    this.db.updateTaskStatus(taskId, 'running');

    console.log(`▶️  Task started: ${taskId}`);

    const startTime = Date.now();
    const timeout = task.timeout || 30000;
    let timeoutHandle: NodeJS.Timeout | null = null;

    try {
      // Set task timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Task timeout after ${timeout}ms`));
        }, timeout);
      });

      // Execute the task with your execution logic
      const result = await Promise.race([
        this.executeTaskLogic(task),
        timeoutPromise,
      ]);

      // Clear timeout
      if (timeoutHandle) clearTimeout(timeoutHandle);

      const executionTime = Date.now() - startTime;

      // Update task with result
      const output = result ? (result.output || '') : '';
      const error = result ? result.error : undefined;
      this.db.updateTaskResult(taskId, output, error);
      this.db.updateTaskStatus(taskId, 'completed');

      console.log(`✅ Task completed: ${taskId} (${executionTime}ms)`);

      this.emit('task:completed', { taskId, executionTime, result });
    } catch (error) {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      const executionTime = Date.now() - startTime;

      console.error(`❌ Task failed: ${taskId} - ${errorMessage}`);

      // Handle retry logic
      const newAttempts = (task.attempts || 0) + 1;
      this.db.incrementAttempts(taskId);

      if (newAttempts < (task.maxAttempts || 3)) {
        // Schedule retry with exponential backoff
        const retryDelay = this.calculateRetryDelay(newAttempts, task.retryDelay || 1000);
        this.db.scheduleRetry(taskId, retryDelay);

        console.log(`🔄 Scheduled retry for ${taskId} in ${retryDelay}ms (attempt ${newAttempts}/${task.maxAttempts})`);

        this.emit('task:retry', { taskId, attempt: newAttempts, maxAttempts: task.maxAttempts, retryDelay });
      } else {
        // Mark as failed
        this.db.updateTaskStatus(taskId, 'failed');
        this.db.updateTaskResult(taskId, '', errorMessage);

        console.error(`💥 Task permanently failed: ${taskId} (max retries exceeded)`);

        this.emit('task:failed', { taskId, executionTime, error: errorMessage, errorStack });
      }
    } finally {
      // Remove from running set
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * Execute task logic - override this or inject handler
   * This is a placeholder that should be connected to your actual task executor
   */
  private async executeTaskLogic(task: Task): Promise<TaskExecutionResult> {
    // TODO: Connect to actual task execution (Claude SDK, bash commands, etc.)
    // For now, return a placeholder
    return {
      taskId: task.id,
      success: true,
      output: `Task executed: ${task.prompt.substring(0, 50)}...`,
      executionTime: 1000,
    };
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const maxDelay = 300000; // 5 minutes max
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Add a task to the queue
   */
  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const createdTask = this.db.createTask(task);
    console.log(`➕ Task added: ${createdTask.id}`);
    this.emit('task:added', createdTask);
    // Trigger immediate processing (event-driven)
    this.scheduleProcessing();
    return createdTask;
  }

  /**
   * Add multiple tasks at once (batch processing)
   * More efficient than individual addTask calls
   */
  async addTasksBatch(tasks: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task[]> {
    if (!tasks || tasks.length === 0) return [];

    const createdTasks: Task[] = [];

    // Use database transaction for batch insert
    this.db.beginTransaction();
    try {
      for (const task of tasks) {
        const createdTask = this.db.createTask(task);
        createdTasks.push(createdTask);
      }
      this.db.commitTransaction();
    } catch (error) {
      this.db.rollbackTransaction();
      throw error;
    }

    console.log(`➕ Batch added: ${createdTasks.length} tasks`);
    this.emit('tasks:batch_added', { count: createdTasks.length, tasks: createdTasks });

    // Trigger immediate processing (event-driven)
    this.scheduleProcessing();

    return createdTasks;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | null {
    return this.db.getTask(taskId);
  }

  /**
   * Get pending tasks for a session
   */
  getSessionTasks(sessionId: string, status?: TaskStatus): Task[] {
    return this.db.getSessionTasks(sessionId, status);
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.db.getTask(taskId);
    if (!task) {
      console.warn(`⚠️  Task not found: ${taskId}`);
      return false;
    }

    if (this.runningTasks.has(taskId)) {
      console.warn(`⚠️  Cannot cancel running task: ${taskId}`);
      return false;
    }

    this.db.updateTaskStatus(taskId, 'cancelled');
    console.log(`⛔ Task cancelled: ${taskId}`);
    this.emit('task:cancelled', taskId);
    return true;
  }

  /**
   * Pause a task
   */
  pauseTask(taskId: string): boolean {
    const task = this.db.getTask(taskId);
    if (!task) {
      console.warn(`⚠️  Task not found: ${taskId}`);
      return false;
    }

    this.db.updateTaskStatus(taskId, 'paused');
    console.log(`⏸️  Task paused: ${taskId}`);
    this.emit('task:paused', taskId);
    return true;
  }

  /**
   * Resume a paused task
   */
  resumeTask(taskId: string): boolean {
    const task = this.db.getTask(taskId);
    if (!task) {
      console.warn(`⚠️  Task not found: ${taskId}`);
      return false;
    }

    if (task.status !== 'paused') {
      console.warn(`⚠️  Task not paused: ${taskId}`);
      return false;
    }

    this.db.updateTaskStatus(taskId, 'pending');
    console.log(`▶️  Task resumed: ${taskId}`);
    this.emit('task:resumed', taskId);
    return true;
  }

  /**
   * Get queue statistics
   */
  getStats(sessionId?: string): Record<string, number> {
    const stats = this.db.getQueueStats(sessionId);
    return {
      ...stats,
      runningTasks: this.runningTasks.size,
      availableSlots: this.maxConcurrentTasks - this.runningTasks.size,
    };
  }

  /**
   * Get running task count
   */
  getRunningCount(): number {
    return this.runningTasks.size;
  }

  /**
   * Check if queue is running
   */
  isQueueRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Set a custom task executor function
   */
  setTaskExecutor(executor: (task: Task) => Promise<TaskExecutionResult>): void {
    // Store executor reference for later use
    // This allows dependency injection of task execution logic
    (this as any).executeTaskLogic = async (task: Task) => executor(task);
  }
}
