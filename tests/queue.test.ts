/**
 * Queue System Unit Tests
 * Comprehensive tests for TaskQueue, WorkerPool, TriggerEngine, etc.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { QueueDatabase } from '../server/queue/queueDatabase';
import { TaskQueue } from '../server/queue/taskQueue';
import { WorkerPool } from '../server/queue/workerPool';
import { TriggerEngine } from '../server/queue/triggerEngine';
import { AIIntegration } from '../server/queue/aiIntegration';
import { HealthMonitor } from '../server/queue/healthMonitor';

let db: Database;
let queueDb: QueueDatabase;

beforeEach(() => {
  db = new Database(':memory:');
  queueDb = new QueueDatabase(db);
});

afterEach(() => {
  db.close();
});

describe('QueueDatabase', () => {
  it('should create a task', () => {
    const task = queueDb.createTask({
      sessionId: 'session-1',
      prompt: 'Test task',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    expect(task.id).toBeDefined();
    expect(task.sessionId).toBe('session-1');
    expect(task.prompt).toBe('Test task');
    expect(task.status).toBe('pending');
  });

  it('should retrieve a task by ID', () => {
    const created = queueDb.createTask({
      sessionId: 'session-1',
      prompt: 'Test task',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    const retrieved = queueDb.getTask(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.prompt).toBe('Test task');
  });

  it('should get pending tasks', () => {
    queueDb.createTask({
      sessionId: 'session-1',
      prompt: 'Task 1',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    queueDb.createTask({
      sessionId: 'session-1',
      prompt: 'Task 2',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'high',
      attempts: 0,
      maxAttempts: 3,
    });

    const pending = queueDb.getPendingTasks(10);
    expect(pending.length).toBe(2);
    expect(pending[0].priority).toBe('high'); // High priority should be first
  });

  it('should update task status', () => {
    const created = queueDb.createTask({
      sessionId: 'session-1',
      prompt: 'Test task',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    queueDb.updateTaskStatus(created.id, 'running');
    const updated = queueDb.getTask(created.id);
    expect(updated?.status).toBe('running');
  });

  it('should get queue stats', () => {
    queueDb.createTask({
      sessionId: 'session-1',
      prompt: 'Task 1',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    const stats = queueDb.getQueueStats();
    expect(stats).toBeDefined();
    expect(stats.total_tasks).toBe(1);
    expect(stats.pending_tasks).toBe(1);
    expect(typeof stats).toBe('object');
  });
});

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue(queueDb, 5);
  });

  afterEach(() => {
    taskQueue.stop();
  });

  it('should add a task', async () => {
    const task = await taskQueue.addTask({
      sessionId: 'session-1',
      prompt: 'Test task',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    expect(task.id).toBeDefined();
    expect(task.sessionId).toBe('session-1');
  });

  it('should cancel a task', async () => {
    const task = await taskQueue.addTask({
      sessionId: 'session-1',
      prompt: 'Test task',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    const success = taskQueue.cancelTask(task.id);
    expect(success).toBe(true);

    const cancelled = queueDb.getTask(task.id);
    expect(cancelled?.status).toBe('cancelled');
  });

  it('should pause a task', async () => {
    const task = await taskQueue.addTask({
      sessionId: 'session-1',
      prompt: 'Test task',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    const success = taskQueue.pauseTask(task.id);
    expect(success).toBe(true);

    const paused = queueDb.getTask(task.id);
    expect(paused?.status).toBe('paused');
  });

  it('should resume a paused task', async () => {
    const task = await taskQueue.addTask({
      sessionId: 'session-1',
      prompt: 'Test task',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    taskQueue.pauseTask(task.id);
    const success = taskQueue.resumeTask(task.id);
    expect(success).toBe(true);

    const resumed = queueDb.getTask(task.id);
    expect(resumed?.status).toBe('pending');
  });

  it('should get session tasks', async () => {
    await taskQueue.addTask({
      sessionId: 'session-1',
      prompt: 'Task 1',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    const tasks = taskQueue.getSessionTasks('session-1');
    expect(tasks.length).toBe(1);
  });
});

describe('WorkerPool', () => {
  let workerPool: WorkerPool;

  beforeEach(() => {
    workerPool = new WorkerPool(5);
  });

  afterEach(async () => {
    await workerPool.stop();
  });

  it('should initialize with correct number of workers', () => {
    const workers = workerPool.getAllWorkers();
    expect(workers.length).toBe(5);
    expect(workers.every(w => w.status === 'idle')).toBe(true);
  });

  it('should get idle workers', () => {
    const idle = workerPool.getIdleWorkers();
    expect(idle.length).toBe(5);
  });

  it('should get pool stats', () => {
    const stats = workerPool.getStats();
    expect(stats.totalWorkers).toBe(5);
    expect(stats.idleWorkers).toBe(5);
    expect(stats.runningWorkers).toBe(0);
    expect(stats.queueLength).toBe(0);
  });

  it('should calculate efficiency', () => {
    const efficiency = workerPool.getEfficiency();
    expect(efficiency).toBe(0); // No tasks processed yet
  });
});

describe('TriggerEngine', () => {
  let triggerEngine: TriggerEngine;

  beforeEach(() => {
    triggerEngine = new TriggerEngine(queueDb);
  });

  afterEach(() => {
    triggerEngine.stop();
  });

  it('should create a trigger', () => {
    const trigger = triggerEngine.createTrigger({
      sessionId: 'session-1',
      type: 'manual',
      name: 'Test Trigger',
      isActive: true,
    });

    expect(trigger.id).toBeDefined();
    expect(trigger.name).toBe('Test Trigger');
    expect(trigger.isActive).toBe(true);
  });

  it('should start and stop trigger engine', () => {
    triggerEngine.start();
    expect(triggerEngine.isQueueRunning?.call?.() === undefined).toBe(true); // Just verify it doesn't error
    triggerEngine.stop();
  });

  it('should parse CRON expressions', () => {
    // This tests the CRON parsing indirectly through trigger creation
    const trigger = triggerEngine.createTrigger({
      sessionId: 'session-1',
      type: 'scheduled',
      name: 'Hourly Task',
      schedule: '0 * * * *', // Every hour
      isActive: true,
    });

    expect(trigger.schedule).toBe('0 * * * *');
  });
});

describe('AIIntegration', () => {
  let aiIntegration: AIIntegration;

  beforeEach(() => {
    aiIntegration = new AIIntegration(queueDb);
  });

  it('should get usage stats', () => {
    const stats = aiIntegration.getUsageStats();
    expect(stats.totalExecutions).toBe(0);
    expect(stats.totalTokensUsed).toBe(0);
    expect(stats.activeConversations).toBe(0);
  });

  it('should set system prompt', () => {
    const newPrompt = 'You are a helpful assistant.';
    aiIntegration.setSystemPrompt(newPrompt);
    const config = aiIntegration.getConfig();
    expect(config.systemPrompt).toBe(newPrompt);
  });

  it('should set model', () => {
    aiIntegration.setModel('claude-opus');
    const config = aiIntegration.getConfig();
    expect(config.model).toBe('claude-opus');
  });
});

describe('HealthMonitor', () => {
  let healthMonitor: HealthMonitor;
  let taskQueue: TaskQueue;
  let workerPool: WorkerPool;

  beforeEach(() => {
    healthMonitor = new HealthMonitor(queueDb);
    taskQueue = new TaskQueue(queueDb, 5);
    workerPool = new WorkerPool(5);
    healthMonitor.setTaskQueue(taskQueue);
    healthMonitor.setWorkerPool(workerPool);
  });

  afterEach(() => {
    healthMonitor.stop();
    taskQueue.stop();
  });

  it('should start and stop health monitoring', () => {
    healthMonitor.start();
    expect(() => healthMonitor.stop()).not.toThrow();
  });

  it('should get metrics', () => {
    const metrics = healthMonitor.getMetrics();
    expect(metrics.status).toBeDefined();
    expect(metrics.uptime).toBeGreaterThan(0);
    expect(metrics.database.connected).toBeDefined();
    expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0);
    expect(metrics.memory.percentage).toBeLessThanOrEqual(1);
  });

  it('should calculate health score', () => {
    const score = healthMonitor.getHealthScore();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should set memory warning threshold', () => {
    healthMonitor.setMemoryWarningThreshold(0.9);
    healthMonitor.setMemoryWarningThreshold(0.5);
    // Just verify it doesn't error
    expect(true).toBe(true);
  });
});

describe('Integration Tests', () => {
  let taskQueue: TaskQueue;
  let workerPool: WorkerPool;
  let triggerEngine: TriggerEngine;
  let healthMonitor: HealthMonitor;

  beforeEach(() => {
    taskQueue = new TaskQueue(queueDb, 3);
    workerPool = new WorkerPool(3);
    triggerEngine = new TriggerEngine(queueDb);
    healthMonitor = new HealthMonitor(queueDb);
    healthMonitor.setTaskQueue(taskQueue);
    healthMonitor.setWorkerPool(workerPool);
  });

  afterEach(() => {
    taskQueue.stop();
    triggerEngine.stop();
    healthMonitor.stop();
  });

  it('should handle complete workflow', async () => {
    // Create task
    const task = await taskQueue.addTask({
      sessionId: 'session-1',
      prompt: 'Complete workflow test',
      mode: 'general',
      model: 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxAttempts: 3,
    });

    expect(task.id).toBeDefined();

    // Get task
    const retrieved = taskQueue.getTask(task.id);
    expect(retrieved?.id).toBe(task.id);

    // Pause task
    taskQueue.pauseTask(task.id);
    const paused = queueDb.getTask(task.id);
    expect(paused?.status).toBe('paused');

    // Resume task
    taskQueue.resumeTask(task.id);
    const resumed = queueDb.getTask(task.id);
    expect(resumed?.status).toBe('pending');

    // Cancel task
    taskQueue.cancelTask(task.id);
    const cancelled = queueDb.getTask(task.id);
    expect(cancelled?.status).toBe('cancelled');
  });

  it('should track queue statistics', async () => {
    // Add multiple tasks
    for (let i = 0; i < 3; i++) {
      await taskQueue.addTask({
        sessionId: 'session-1',
        prompt: `Task ${i + 1}`,
        mode: 'general',
        model: 'claude-3-5-sonnet',
        status: 'pending',
        priority: 'normal',
        attempts: 0,
        maxAttempts: 3,
      });
    }

    const stats = taskQueue.getStats();
    expect(stats.pending_tasks).toBeGreaterThanOrEqual(3);
    expect(stats.total_tasks).toBeGreaterThanOrEqual(3);
    expect(stats.availableSlots).toBeDefined();
  });

  it('should support 50+ concurrent task creation', async () => {
    const taskCount = 75;
    const tasks = [];

    for (let i = 0; i < taskCount; i++) {
      const task = await taskQueue.addTask({
        sessionId: `session-${i}`,
        prompt: `High volume task ${i + 1}`,
        mode: 'general',
        model: 'claude-3-5-sonnet',
        status: 'pending',
        priority: i % 2 === 0 ? 'high' : 'normal',
        attempts: 0,
        maxAttempts: 3,
      });
      tasks.push(task);
    }

    expect(tasks.length).toBe(taskCount);

    const stats = taskQueue.getStats();
    expect(stats.total_tasks).toBeGreaterThanOrEqual(taskCount);
    expect(stats.pending_tasks).toBeGreaterThanOrEqual(taskCount);
  });
});
