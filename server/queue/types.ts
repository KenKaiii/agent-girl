/**
 * Agent Girl - Production Queue System Types
 * Comprehensive type definitions for task queue, triggers, and workflow
 */

/**
 * Task status lifecycle
 */
export type TaskStatus = 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retry' | 'paused';

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Trigger types for event-based execution
 */
export type TriggerType = 'manual' | 'scheduled' | 'webhook' | 'ai-generated' | 'condition-based' | 'chain' | 'time-based';

/**
 * Core Task Interface - Comprehensive task definition
 */
export interface Task {
  // Identity
  id: string;
  sessionId: string;

  // Content and Execution
  prompt: string;
  mode: 'general' | 'coder' | 'intense-research' | 'spark';
  model: string;

  // State Management
  status: TaskStatus;
  priority: TaskPriority;

  // Execution Details
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: number;
  completedAt?: number;

  // Results and Errors
  result?: string;
  error?: string;
  errorStack?: string;

  // Triggering and Chaining
  triggeredBy?: string; // ID of task that triggered this
  triggers?: string[]; // IDs of tasks this triggers

  // Scheduling
  scheduledFor?: number; // Unix timestamp
  recurringRule?: string; // RRULE for recurring tasks

  // Metadata
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;

  // Workflow
  workflowId?: string;
  retryDelay?: number; // Milliseconds
  timeout?: number; // Milliseconds
}

/**
 * Trigger Definition - Event-based task execution
 */
export interface Trigger {
  id: string;
  sessionId: string;

  // Trigger Configuration
  type: TriggerType;
  name: string;
  description?: string;

  // What to Execute
  targetTaskId?: string;
  taskTemplate?: Partial<Task>; // Template for generated tasks

  // Conditions
  condition?: TriggerCondition;

  // Scheduling
  schedule?: string; // CRON format for time-based triggers

  // Webhook Configuration
  webhookUrl?: string;
  webhookSecret?: string;

  // State
  isActive: boolean;
  lastTriggeredAt?: number;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Trigger Condition - Evaluate when trigger should fire
 */
export interface TriggerCondition {
  type: 'task-complete' | 'task-failed' | 'time-based' | 'custom' | 'ai-response' | 'chain';

  // Task-based conditions
  taskIds?: string[];

  // Custom conditions
  evaluator?: string; // JavaScript expression or function reference

  // AI response conditions
  keywords?: string[];
  sentimentThreshold?: number;

  // Time-based conditions
  delayMs?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Workflow - Chain of tasks with triggers
 */
export interface Workflow {
  id: string;
  sessionId: string;

  name: string;
  description?: string;

  // Tasks in workflow
  taskIds: string[];
  triggerIds: string[];

  // Execution Configuration
  maxConcurrent: number;
  timeout: number;

  // Retry Configuration
  retryPolicy: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
  };

  // State
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';

  // Metrics
  completedAt?: number;
  totalDuration?: number;

  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Queue Statistics and Health
 */
export interface QueueStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;

  averageExecutionTime: number;
  successRate: number;

  activeTriggers: number;

  workersActive: number;
  workersIdle: number;

  lastHealthCheck: number;
  uptime: number;
}

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;

  database: {
    connected: boolean;
    responseTime: number;
  };

  queue: {
    size: number;
    oldestTask: number; // Age of oldest pending task
  };

  workers: {
    active: number;
    idle: number;
    stalled: number;
  };

  memory: {
    used: number;
    total: number;
    percentage: number;
  };

  messages?: string[];
}

/**
 * AI Prompt Integration
 */
export interface AIPromptConfig {
  systemPrompt: string;
  temperture?: number;
  maxTokens?: number;
  model: string;
}

/**
 * Task Execution Result
 */
export interface TaskExecutionResult {
  taskId: string;
  success: boolean;

  output?: string;
  error?: string;

  executionTime: number;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };

  metadata?: Record<string, unknown>;
}

/**
 * Queue Configuration
 */
export interface QueueConfig {
  // Worker Configuration
  workerCount: number;
  maxConcurrentTasks: number;

  // Timing
  pollInterval: number; // Ms to poll for new tasks
  taskTimeout: number; // Default task timeout

  // Retry Policy
  maxRetries: number;
  retryBackoffMs: number;
  retryBackoffMultiplier: number;
  maxRetryDelay: number;

  // Health Checks
  healthCheckInterval: number;

  // Cleanup
  completedTaskRetention: number; // Days to keep completed tasks
  failedTaskRetention: number; // Days to keep failed tasks

  // Features
  enablePersistence: boolean;
  enableRecovery: boolean;
  enableMetrics: boolean;
}

/**
 * Worker State
 */
export interface Worker {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'error';

  currentTaskId?: string;
  startedAt?: number;

  processedTasks: number;
  failedTasks: number;

  lastError?: string;
  lastErrorAt?: number;

  metadata?: Record<string, unknown>;
}
