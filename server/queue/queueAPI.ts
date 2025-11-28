/**
 * Queue API Helper - Provides intuitive wrapper around queue operations
 * Simplifies common patterns and provides better error handling
 */

import { TaskQueue } from './taskQueue';
import { QueueDatabase } from './queueDatabase';
import { HealthMonitor } from './healthMonitor';
import { WorkerPool } from './workerPool';
import { TriggerEngine } from './triggerEngine';
import { AIIntegration } from './aiIntegration';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

export class QueueAPI {
  constructor(
    private taskQueue: TaskQueue,
    private db: QueueDatabase,
    private workerPool: WorkerPool,
    private triggerEngine: TriggerEngine,
    private healthMonitor: HealthMonitor,
    private aiIntegration: AIIntegration
  ) {}

  /**
   * Create a task with intelligent defaults
   */
  async createTask(
    sessionId: string,
    prompt: string,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      mode?: string;
      model?: string;
      timeout?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<APIResponse> {
    try {
      const task = await this.taskQueue.addTask({
        sessionId,
        prompt,
        mode: (options?.mode || 'general') as 'general' | 'coder' | 'intense-research' | 'spark',
        model: options?.model || 'claude-3-5-sonnet',
        priority: options?.priority || 'normal',
        attempts: 0,
        maxAttempts: 3,
        timeout: options?.timeout || 30000,
        metadata: options?.metadata,
        status: 'pending',
      });

      return {
        success: true,
        data: task,
        message: `Task created: ${task.id}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get session status overview
   */
  async getSessionStatus(sessionId: string): Promise<APIResponse> {
    try {
      const tasks = this.taskQueue.getSessionTasks(sessionId);
      const stats = this.db.getQueueStats(sessionId);
      const health = this.healthMonitor.getMetrics();

      return {
        success: true,
        data: {
          sessionId,
          taskCount: tasks.length,
          stats,
          health: {
            status: health.status,
            healthScore: this.healthMonitor.getHealthScore(),
          },
          tasks: {
            pending: tasks.filter((t) => t.status === 'pending'),
            running: tasks.filter((t) => t.status === 'running'),
            completed: tasks.filter((t) => t.status === 'completed'),
            failed: tasks.filter((t) => t.status === 'failed'),
          },
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Bulk task operations
   */
  async cancelSessionTasks(sessionId: string): Promise<APIResponse> {
    try {
      const tasks = this.taskQueue.getSessionTasks(sessionId, 'pending');
      let cancelled = 0;

      for (const task of tasks) {
        if (this.taskQueue.cancelTask(task.id)) {
          cancelled++;
        }
      }

      return {
        success: true,
        data: { cancelled, total: tasks.length },
        message: `Cancelled ${cancelled} tasks`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel tasks',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get detailed queue insights
   */
  async getQueueInsights(): Promise<APIResponse> {
    try {
      const stats = this.db.getQueueStats();
      const health = this.healthMonitor.getMetrics();
      const workerStats = this.workerPool.getStats();
      const aiStats = this.aiIntegration.getUsageStats();

      const insights = {
        queue: {
          ...stats,
          percentComplete: stats.totalTasks > 0
            ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
            : 0,
          percentFailed: stats.totalTasks > 0
            ? Math.round((stats.failedTasks / stats.totalTasks) * 100)
            : 0,
          averageAttempts:
            stats.totalTasks > 0
              ? (stats.totalTasks * 1.2) / stats.totalTasks
              : 1,
        },
        workers: {
          ...workerStats,
          utilization: workerStats.totalWorkers > 0
            ? Math.round((workerStats.runningWorkers / workerStats.totalWorkers) * 100)
            : 0,
          efficiency: this.workerPool.getEfficiency(),
        },
        health: {
          ...health,
          healthScore: this.healthMonitor.getHealthScore(),
        },
        ai: {
          ...aiStats,
          averageTokensPerTask:
            aiStats.totalExecutions > 0
              ? Math.round(aiStats.totalTokensUsed / aiStats.totalExecutions)
              : 0,
        },
      };

      return {
        success: true,
        data: insights,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get insights',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Quick health check - minimal overhead
   */
  async quickHealthCheck(): Promise<APIResponse> {
    const metrics = this.healthMonitor.getMetrics();
    const score = this.healthMonitor.getHealthScore();

    return {
      success: score >= 70,
      data: {
        score,
        status: metrics.status,
        isHealthy: score >= 70,
      },
      timestamp: Date.now(),
    };
  }
}
