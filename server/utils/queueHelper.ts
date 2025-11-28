/**
 * Queue Helper - Utility functions for queue management
 */

/**
 * Generate human-readable task progress message
 */
export function getTaskProgressMessage(task: {
  status: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
}): string {
  const messages: Record<string, string> = {
    pending: `Waiting in queue (attempt ${task.attempts}/${task.maxAttempts})`,
    running: `Processing... (attempt ${task.attempts}/${task.maxAttempts})`,
    paused: `Paused (attempt ${task.attempts}/${task.maxAttempts})`,
    completed: 'Task completed successfully',
    failed: task.error ? `Failed: ${task.error}` : 'Task failed',
    cancelled: 'Task cancelled by user',
  };
  return messages[task.status] || task.status;
}

/**
 * Get recommended action based on task state
 */
export function getRecommendedAction(task: {
  status: string;
  attempts: number;
  maxAttempts: number;
}): string | null {
  if (task.status === 'paused') return 'resume';
  if (task.status === 'pending' && task.attempts === 0) return 'wait';
  if (task.status === 'failed' && task.attempts < task.maxAttempts) return 'retry';
  if (task.status === 'pending' || task.status === 'running') return 'cancel';
  return null;
}

/**
 * Calculate task priority weight for scheduling
 */
export function calculatePriorityWeight(priority: string): number {
  const weights: Record<string, number> = {
    high: 3,
    normal: 2,
    low: 1,
  };
  return weights[priority] || 2;
}

/**
 * Format stats for human reading
 */
export function formatQueueStatusMessage(stats: {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
}): string {
  const parts = [];
  parts.push(`Total: ${stats.totalTasks}`);
  if (stats.pendingTasks > 0) parts.push(`⏳ ${stats.pendingTasks} pending`);
  if (stats.runningTasks > 0) parts.push(`▶️ ${stats.runningTasks} running`);
  if (stats.completedTasks > 0) parts.push(`✅ ${stats.completedTasks} done`);
  if (stats.failedTasks > 0) parts.push(`❌ ${stats.failedTasks} failed`);
  return parts.join(' | ');
}

/**
 * Determine if queue needs attention
 */
export function isQueueNeedingAttention(
  stats: Record<string, number>,
  health: { status: string }
): boolean {
  return (
    health.status !== 'healthy' ||
    (stats.failedTasks ? stats.failedTasks > 0 : false) ||
    (stats.pendingTasks ? stats.pendingTasks > 50 : false)
  );
}

/**
 * Generate queue report
 */
export function generateQueueReport(data: {
  stats: Record<string, number>;
  workers: { totalWorkers: number; idleWorkers: number; runningWorkers: number };
  health: { status: string };
  aiStats: { totalTokensUsed: number; totalExecutions: number };
}): string {
  const utilization = data.workers.totalWorkers > 0
    ? Math.round((data.workers.runningWorkers / data.workers.totalWorkers) * 100)
    : 0;

  return `Queue Report:
  Status: ${data.health.status}
  Tasks: ${data.stats.totalTasks} total | ${data.stats.pendingTasks} pending | ${data.stats.runningTasks} running
  Workers: ${data.workers.runningWorkers}/${data.workers.totalWorkers} active (${utilization}%)
  AI Usage: ${data.aiStats.totalTokensUsed} tokens | ${data.aiStats.totalExecutions} executions`;
}
