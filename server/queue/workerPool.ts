/**
 * Worker Pool - Manages concurrent workers for task execution
 * Distributes tasks across workers and monitors health
 */

import { Task, Worker, TaskExecutionResult } from './types';
import EventEmitter from 'events';
import { randomUUID } from 'crypto';

export type TaskExecutor = (task: Task) => Promise<TaskExecutionResult>;

export class WorkerPool extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: Task[] = [];
  private workerTaskAssignment: Map<string, string> = new Map(); // workerId -> taskId
  private taskExecutor: TaskExecutor;
  private maxWorkers: number;
  private isRunning: boolean = false;
  private isProcessing: boolean = false; // PERFORMANCE FIX: Prevent recursive spin loop

  constructor(maxWorkers: number = 50, taskExecutor?: TaskExecutor) {
    super();
    this.maxWorkers = Math.max(1, maxWorkers);
    this.taskExecutor = taskExecutor || this.defaultExecutor;
    this.initializeWorkers();
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const workerId = randomUUID();
      const worker: Worker = {
        id: workerId,
        status: 'idle',
        processedTasks: 0,
        failedTasks: 0,
      };
      this.workers.set(workerId, worker);
    }
    console.log(`👷 Worker pool initialized with ${this.maxWorkers} workers`);
  }

  /**
   * Default task executor (placeholder)
   */
  private async defaultExecutor(task: Task): Promise<TaskExecutionResult> {
    return {
      taskId: task.id,
      success: true,
      output: `Executed: ${task.prompt.substring(0, 50)}...`,
      executionTime: Math.random() * 5000,
    };
  }

  /**
   * Start the worker pool
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️  Worker pool already running');
      return;
    }
    this.isRunning = true;
    console.log('🏃 Worker pool started');
    this.processQueue();
  }

  /**
   * Stop the worker pool
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Worker pool stopped');

    // Wait for running tasks to complete
    let attempts = 0;
    while (this.getRunningWorkers().length > 0 && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  /**
   * Process queue and assign tasks to idle workers
   * PERFORMANCE FIX: Only schedule next iteration if there's work to do
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.isProcessing) return;

    // PERFORMANCE FIX: Don't spin if queue is empty
    if (this.taskQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const idleWorkers = this.getIdleWorkers();
      while (idleWorkers.length > 0 && this.taskQueue.length > 0) {
        const worker = idleWorkers.pop();
        const task = this.taskQueue.shift();

        if (!worker || !task) break;

        // Assign task to worker
        this.assignTaskToWorker(worker, task);
      }
    } finally {
      this.isProcessing = false;
    }

    // PERFORMANCE FIX: Only continue if there are still tasks AND idle workers
    if (this.isRunning && this.taskQueue.length > 0 && this.getIdleWorkers().length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Assign task to worker and execute
   */
  private async assignTaskToWorker(worker: Worker, task: Task): Promise<void> {
    worker.status = 'running';
    worker.currentTaskId = task.id;
    worker.startedAt = Date.now();
    this.workerTaskAssignment.set(worker.id, task.id);

    this.emit('worker:assigned', { workerId: worker.id, taskId: task.id });

    try {
      const startTime = Date.now();
      const result = await this.taskExecutor(task);
      const executionTime = Date.now() - startTime;

      // Update worker
      worker.processedTasks++;
      worker.status = 'idle';
      worker.currentTaskId = undefined;
      worker.startedAt = undefined;

      this.workerTaskAssignment.delete(worker.id);
      this.emit('worker:completed', {
        workerId: worker.id,
        taskId: task.id,
        executionTime,
        success: result.success,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      worker.failedTasks++;
      worker.lastError = errorMessage;
      worker.lastErrorAt = Date.now();
      worker.status = 'error';

      this.workerTaskAssignment.delete(worker.id);
      this.emit('worker:error', { workerId: worker.id, taskId: task.id, error: errorMessage });

      // Mark worker as idle after error and trigger queue processing
      setTimeout(() => {
        worker.status = 'idle';
        // PERFORMANCE FIX: Only process if there are pending tasks
        if (this.taskQueue.length > 0) {
          this.processQueue();
        }
      }, 1000);
    }

    // PERFORMANCE FIX: Only continue if there are pending tasks
    if (this.taskQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Submit task to worker pool
   */
  submitTask(task: Task): void {
    this.taskQueue.push(task);
    this.emit('task:queued', { taskId: task.id, queueLength: this.taskQueue.length });
    this.processQueue();
  }

  /**
   * Submit multiple tasks
   */
  submitTasks(tasks: Task[]): void {
    this.taskQueue.push(...tasks);
    this.emit('tasks:queued', { count: tasks.length, queueLength: this.taskQueue.length });
    this.processQueue();
  }

  /**
   * Get idle workers
   */
  getIdleWorkers(): Worker[] {
    return Array.from(this.workers.values()).filter(w => w.status === 'idle');
  }

  /**
   * Get running workers
   */
  getRunningWorkers(): Worker[] {
    return Array.from(this.workers.values()).filter(w => w.status === 'running');
  }

  /**
   * Get all workers
   */
  getAllWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get worker status
   */
  getWorker(workerId: string): Worker | null {
    return this.workers.get(workerId) || null;
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.taskQueue.length;
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    idleWorkers: number;
    runningWorkers: number;
    errorWorkers: number;
    queueLength: number;
    totalProcessed: number;
    totalFailed: number;
  } {
    const allWorkers = this.getAllWorkers();
    const running = this.getRunningWorkers();
    const idle = this.getIdleWorkers();
    const errors = allWorkers.filter(w => w.status === 'error');

    return {
      totalWorkers: allWorkers.length,
      idleWorkers: idle.length,
      runningWorkers: running.length,
      errorWorkers: errors.length,
      queueLength: this.taskQueue.length,
      totalProcessed: allWorkers.reduce((sum, w) => sum + w.processedTasks, 0),
      totalFailed: allWorkers.reduce((sum, w) => sum + w.failedTasks, 0),
    };
  }

  /**
   * Set custom task executor
   */
  setTaskExecutor(executor: TaskExecutor): void {
    this.taskExecutor = executor;
    console.log('🔧 Custom task executor set');
  }

  /**
   * Recover stalled workers
   */
  recoverStalledWorkers(timeoutMs: number = 60000): number {
    const now = Date.now();
    let recovered = 0;

    for (const worker of this.workers.values()) {
      if (
        worker.status === 'running' &&
        worker.startedAt &&
        now - worker.startedAt > timeoutMs
      ) {
        console.warn(`🔧 Recovering stalled worker: ${worker.id}`);
        worker.status = 'idle';
        worker.currentTaskId = undefined;
        worker.startedAt = undefined;
        recovered++;
      }
    }

    return recovered;
  }

  /**
   * Get total worker efficiency
   */
  getEfficiency(): number {
    const stats = this.getStats();
    if (stats.totalProcessed === 0) return 0;
    return (stats.totalProcessed / (stats.totalProcessed + stats.totalFailed)) * 100;
  }

  /**
   * Clear error state for a worker
   */
  clearWorkerError(workerId: string): boolean {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    if (worker.status === 'error') {
      worker.status = 'idle';
      worker.lastError = undefined;
      worker.lastErrorAt = undefined;
      this.emit('worker:error_cleared', { workerId });
      return true;
    }

    return false;
  }
}
