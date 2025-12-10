/**
 * Queue System - Central initialization and export
 * Provides task queue, worker pool, triggers, health monitoring, and AI integration
 */

import { Database } from 'bun:sqlite';
import * as path from 'path';
import * as fs from 'fs';
import { TaskQueue } from './taskQueue';
import { WorkerPool } from './workerPool';
import { TriggerEngine } from './triggerEngine';
import { HealthMonitor } from './healthMonitor';
import { AIIntegration } from './aiIntegration';
import { QueueDatabase } from './queueDatabase';

export interface QueueSystem {
  taskQueue: TaskQueue;
  workerPool: WorkerPool;
  triggerEngine: TriggerEngine;
  healthMonitor: HealthMonitor;
  aiIntegration: AIIntegration;
  db: QueueDatabase;
}

let queueSystemInstance: QueueSystem | null = null;

/**
 * Get the app data directory for storing queue database
 */
function getQueueDbPath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
  const appDataDir = path.join(homeDir, '.agent-girl');

  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }

  return path.join(appDataDir, 'queue.db');
}

/**
 * Initialize the queue system with all components
 */
export function initializeQueueSystem(): QueueSystem {
  if (queueSystemInstance) {
    console.log('⚠️  Queue system already initialized');
    return queueSystemInstance;
  }

  // Create dedicated database for queue system
  const dbPath = getQueueDbPath();
  const sqliteDb = new Database(dbPath, { create: true });

  // Enable WAL mode for better performance
  sqliteDb.run('PRAGMA journal_mode = WAL');
  sqliteDb.run('PRAGMA synchronous = NORMAL');

  // Initialize database layer
  const db = new QueueDatabase(sqliteDb);

  // Initialize core components
  const taskQueue = new TaskQueue(db, 50); // 50 max concurrent tasks
  const workerPool = new WorkerPool(50); // 50 workers
  const triggerEngine = new TriggerEngine(db);
  const healthMonitor = new HealthMonitor(db);
  const aiIntegration = new AIIntegration(db);

  // Set references for health monitor
  healthMonitor.setTaskQueue(taskQueue);
  healthMonitor.setWorkerPool(workerPool);

  // Connect worker pool to task queue - convert Task to AIExecutionContext
  taskQueue.setTaskExecutor(async (task) => {
    const response = await aiIntegration.executeTask({
      taskId: task.id,
      sessionId: task.sessionId,
      prompt: task.prompt,
      mode: task.mode,
      metadata: task.metadata,
    });
    // Convert AIResponse to TaskExecutionResult
    return {
      taskId: task.id,
      success: response.success,
      output: response.output,
      error: response.error,
      executionTime: 0, // Will be calculated by worker
    };
  });

  queueSystemInstance = {
    taskQueue,
    workerPool,
    triggerEngine,
    healthMonitor,
    aiIntegration,
    db,
  };

  console.log('✅ Queue system initialized with database:', dbPath);
  return queueSystemInstance;
}

/**
 * Start the queue system (all components)
 */
export function startQueueSystem(): void {
  if (!queueSystemInstance) {
    console.error('❌ Queue system not initialized');
    return;
  }

  queueSystemInstance.taskQueue.start();
  queueSystemInstance.workerPool.start();
  queueSystemInstance.triggerEngine.start();
  queueSystemInstance.healthMonitor.start();

  console.log('🚀 Queue system started');
}

/**
 * Stop the queue system (all components)
 */
export async function stopQueueSystem(): Promise<void> {
  if (!queueSystemInstance) {
    return;
  }

  queueSystemInstance.taskQueue.stop();
  await queueSystemInstance.workerPool.stop();
  queueSystemInstance.triggerEngine.stop();
  queueSystemInstance.healthMonitor.stop();

  console.log('🛑 Queue system stopped');
}

/**
 * Get the current queue system instance
 */
export function getQueueSystem(): QueueSystem | null {
  return queueSystemInstance;
}

// Re-export types and classes
export { TaskQueue } from './taskQueue';
export { WorkerPool } from './workerPool';
export { TriggerEngine } from './triggerEngine';
export { HealthMonitor } from './healthMonitor';
export { AIIntegration } from './aiIntegration';
export { QueueDatabase } from './queueDatabase';
export * from './types';
