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
  private batchSize: number = 10; // Process up to 10 tasks per cycle
  private priorityWeights: Record<string, number> = {
    critical: 100,
    high: 75,
    normal: 50,
    low: 25,
  };

  constructor(maxWorkers: number = 50, taskExecutor?: TaskExecutor) {
    super();
    this.maxWorkers = Math.max(1, maxWorkers);
    this.taskExecutor = taskExecutor || this.defaultExecutor;
    this.initializeWorkers();
  }

  /**
   * Sort tasks by priority with starvation prevention
   */
  private sortTasksByPriority(): void {
    const now = Date.now();
    this.taskQueue.sort((a, b) => {
      const aWeight = this.priorityWeights[a.priority] || 50;
      const bWeight = this.priorityWeights[b.priority] || 50;
      // Add wait time bonus (max 50 points for waiting 50+ minutes)
      const aWaitBonus = Math.min((now - a.createdAt) / 60000, 50);
      const bWaitBonus = Math.min((now - b.createdAt) / 60000, 50);
      return (bWeight + bWaitBonus) - (aWeight + aWaitBonus);
    });
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
   * OPTIMIZATION: Batch processing with priority sorting
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.isProcessing) return;

    // PERFORMANCE FIX: Don't spin if queue is empty
    if (this.taskQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Sort tasks by priority before processing
      this.sortTasksByPriority();

      const idleWorkers = this.getIdleWorkers();
      let assigned = 0;

      // Process up to batchSize tasks per cycle
      while (idleWorkers.length > 0 && this.taskQueue.length > 0 && assigned < this.batchSize) {
        const worker = idleWorkers.pop();
        const task = this.taskQueue.shift();

        if (!worker || !task) break;

        // Assign task to worker
        this.assignTaskToWorker(worker, task);
        assigned++;
      }

      if (assigned > 0) {
        this.emit('batch:processed', { assigned, remaining: this.taskQueue.length });
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
   * Get detailed pool metrics for monitoring
   */
  getDetailedMetrics(): {
    workers: {
      total: number;
      idle: number;
      running: number;
      error: number;
    };
    queue: {
      length: number;
      byPriority: Record<string, number>;
    };
    performance: {
      totalProcessed: number;
      totalFailed: number;
      efficiency: number;
      averageTasksPerWorker: number;
    };
  } {
    const stats = this.getStats();

    // Count tasks by priority
    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      normal: 0,
      low: 0,
    };
    for (const task of this.taskQueue) {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    }

    return {
      workers: {
        total: stats.totalWorkers,
        idle: stats.idleWorkers,
        running: stats.runningWorkers,
        error: stats.errorWorkers,
      },
      queue: {
        length: stats.queueLength,
        byPriority,
      },
      performance: {
        totalProcessed: stats.totalProcessed,
        totalFailed: stats.totalFailed,
        efficiency: this.getEfficiency(),
        averageTasksPerWorker: stats.totalWorkers > 0
          ? stats.totalProcessed / stats.totalWorkers
          : 0,
      },
    };
  }

  /**
   * Set batch size for processing
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(size, 50));
    console.log(`⚡ Batch size set to ${this.batchSize}`);
  }

  /**
   * Get current batch size
   */
  getBatchSize(): number {
    return this.batchSize;
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
