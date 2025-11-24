/**
 * Health Monitor - Tracks queue system health and performance metrics
 * Monitors workers, task execution, and system resources
 */

import { QueueDatabase } from './queueDatabase';
import { TaskQueue } from './taskQueue';
import { WorkerPool } from './workerPool';
import { HealthCheckResult } from './types';
import EventEmitter from 'events';

export class HealthMonitor extends EventEmitter {
  private db: QueueDatabase;
  private taskQueue?: TaskQueue;
  private workerPool?: WorkerPool;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timer | null = null;
  private checkIntervalMs: number = 60000; // Check every minute
  private lastHealthCheck: HealthCheckResult | null = null;
  private memoryWarningThreshold: number = 0.8; // 80%
  private taskTimeoutMs: number = 60000; // 1 minute

  constructor(db: QueueDatabase) {
    super();
    this.db = db;
  }

  /**
   * Set task queue reference
   */
  setTaskQueue(taskQueue: TaskQueue): void {
    this.taskQueue = taskQueue;
  }

  /**
   * Set worker pool reference
   */
  setWorkerPool(workerPool: WorkerPool): void {
    this.workerPool = workerPool;
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️  Health monitor already running');
      return;
    }

    this.isRunning = true;
    console.log('💚 Health monitor started');

    // Run health check immediately
    this.performHealthCheck();

    // Schedule periodic health checks
    this.checkInterval = setInterval(
      () => this.performHealthCheck(),
      this.checkIntervalMs
    );
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('⚠️  Health monitor not running');
      return;
    }

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('🛑 Health monitor stopped');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: Date.now(),
      database: await this.checkDatabase(),
      queue: this.checkQueue(),
      workers: this.checkWorkers(),
      memory: this.checkMemory(),
      messages: [],
    };

    // Determine overall status
    if (result.queue.oldestTask > 30000 || result.workers.stalled > 0) {
      result.status = 'degraded';
      result.messages?.push('⚠️  Queue processing degraded');
    }

    if (result.memory.percentage > 0.9) {
      result.status = 'unhealthy';
      result.messages?.push('❌ Critical memory usage');
    }

    if (!result.database.connected) {
      result.status = 'unhealthy';
      result.messages?.push('❌ Database unavailable');
    }

    this.lastHealthCheck = result;
    this.emit('health:check', result);

    this.logHealthCheck(result);

    return result;
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckResult['database']> {
    const startTime = Date.now();

    try {
      // Try to query a simple stat
      this.db.getQueueStats();
      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        responseTime,
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        connected: false,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check queue health
   */
  private checkQueue(): HealthCheckResult['queue'] {
    const stats = this.taskQueue?.getStats() || {};
    const pendingTasks = (stats as any).pendingTasks || 0;

    return {
      size: pendingTasks,
      oldestTask: 0, // Would need to track actual oldest pending task
    };
  }

  /**
   * Check workers health
   */
  private checkWorkers(): HealthCheckResult['workers'] {
    if (!this.workerPool) {
      return { active: 0, idle: 0, stalled: 0 };
    }

    const stats = this.workerPool.getStats();
    const workers = this.workerPool.getAllWorkers();

    // Check for stalled workers
    const now = Date.now();
    const stalledCount = workers.filter(w => {
      if (w.status === 'running' && w.startedAt) {
        return now - w.startedAt > this.taskTimeoutMs;
      }
      return false;
    }).length;

    // Try to recover stalled workers
    if (stalledCount > 0) {
      const recovered = this.workerPool.recoverStalledWorkers(this.taskTimeoutMs);
      if (recovered > 0) {
        console.log(`🔧 Recovered ${recovered} stalled workers`);
      }
    }

    return {
      active: stats.runningWorkers,
      idle: stats.idleWorkers,
      stalled: stalledCount,
    };
  }

  /**
   * Check system memory
   */
  private checkMemory(): HealthCheckResult['memory'] {
    const memUsage = process.memoryUsage();
    const used = memUsage.heapUsed;
    const total = memUsage.heapTotal;
    const percentage = used / total;

    if (percentage > this.memoryWarningThreshold) {
      console.warn(`⚠️  High memory usage: ${(percentage * 100).toFixed(1)}%`);
    }

    return {
      used,
      total,
      percentage,
    };
  }

  /**
   * Log health check results
   */
  private logHealthCheck(result: HealthCheckResult): void {
    const statusEmoji =
      result.status === 'healthy' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌';

    console.log(`${statusEmoji} Health: ${result.status}`);
    console.log(`   Database: ${result.database.connected ? '✅ Connected' : '❌ Offline'} (${result.database.responseTime}ms)`);
    console.log(`   Queue: ${result.queue.size} pending, oldest ${result.queue.oldestTask}ms`);
    console.log(`   Workers: ${result.workers.active} active, ${result.workers.idle} idle, ${result.workers.stalled} stalled`);
    console.log(`   Memory: ${(result.memory.percentage * 100).toFixed(1)}% (${formatBytes(result.memory.used)}/${formatBytes(result.memory.total)})`);

    if (result.messages && result.messages.length > 0) {
      console.log(`   Messages: ${result.messages.join(', ')}`);
    }
  }

  /**
   * Get last health check
   */
  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  /**
   * Get system metrics for dashboard
   */
  getMetrics(): {
    uptime: number;
    lastCheck: number;
    status: string;
    database: HealthCheckResult['database'];
    queue: HealthCheckResult['queue'];
    workers: HealthCheckResult['workers'];
    memory: HealthCheckResult['memory'];
  } {
    if (!this.lastHealthCheck) {
      return {
        uptime: process.uptime(),
        lastCheck: 0,
        status: 'unknown',
        database: { connected: false, responseTime: 0 },
        queue: { size: 0, oldestTask: 0 },
        workers: { active: 0, idle: 0, stalled: 0 },
        memory: { used: 0, total: 0, percentage: 0 },
      };
    }

    return {
      uptime: process.uptime(),
      lastCheck: Date.now() - this.lastHealthCheck.timestamp,
      status: this.lastHealthCheck.status,
      database: this.lastHealthCheck.database,
      queue: this.lastHealthCheck.queue,
      workers: this.lastHealthCheck.workers,
      memory: this.lastHealthCheck.memory,
    };
  }

  /**
   * Set health check interval
   */
  setCheckInterval(intervalMs: number): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkIntervalMs = intervalMs;

    if (this.isRunning) {
      this.checkInterval = setInterval(
        () => this.performHealthCheck(),
        this.checkIntervalMs
      );
    }
  }

  /**
   * Set memory warning threshold
   */
  setMemoryWarningThreshold(percentage: number): void {
    this.memoryWarningThreshold = Math.max(0, Math.min(1, percentage));
  }

  /**
   * Alert handlers for critical conditions
   */
  onCriticalMemory(callback: () => void): void {
    this.on('memory:critical', callback);
  }

  onDatabaseDown(callback: () => void): void {
    this.on('database:down', callback);
  }

  onQueueStalled(callback: () => void): void {
    this.on('queue:stalled', callback);
  }

  /**
   * Get system health status as percentage
   */
  getHealthScore(): number {
    if (!this.lastHealthCheck) return 0;

    let score = 100;

    // Deduct for memory usage
    if (this.lastHealthCheck.memory.percentage > 0.9) {
      score -= 40;
    } else if (this.lastHealthCheck.memory.percentage > 0.75) {
      score -= 20;
    }

    // Deduct for stalled workers
    score -= this.lastHealthCheck.workers.stalled * 10;

    // Deduct for queue backlog
    if (this.lastHealthCheck.queue.oldestTask > 60000) {
      score -= 20;
    }

    // Deduct if database is slow
    if (this.lastHealthCheck.database.responseTime > 500) {
      score -= 15;
    }

    return Math.max(0, score);
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
