/**
 * Queue Utilities - Helper functions for queue operations
 */

/**
 * Format task status with emoji and readable text
 */
export function formatTaskStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '⏳ Pending',
    running: '▶️ Running',
    paused: '⏸️ Paused',
    completed: '✅ Completed',
    failed: '❌ Failed',
    cancelled: '🚫 Cancelled',
  };
  return statusMap[status] || status;
}

/**
 * Get color class for task status
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'text-yellow-600',
    running: 'text-blue-600',
    paused: 'text-orange-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    cancelled: 'text-gray-600',
  };
  return colorMap[status] || 'text-gray-600';
}

/**
 * Get background color class for status badge
 */
export function getStatusBgColor(status: string): string {
  const bgColorMap: Record<string, string> = {
    pending: 'bg-yellow-100',
    running: 'bg-blue-100',
    paused: 'bg-orange-100',
    completed: 'bg-green-100',
    failed: 'bg-red-100',
    cancelled: 'bg-gray-100',
  };
  return bgColorMap[status] || 'bg-gray-100';
}

/**
 * Format timestamp to human-readable time
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Create task with default values
 */
export function createQueueTaskRequest(
  prompt: string,
  sessionId: string,
  options?: {
    priority?: 'high' | 'normal' | 'low';
    mode?: string;
    model?: string;
    metadata?: Record<string, unknown>;
  }
) {
  return {
    sessionId,
    prompt,
    priority: options?.priority || 'normal',
    mode: options?.mode || 'general',
    model: options?.model || 'claude-3-5-sonnet',
    metadata: options?.metadata,
  };
}

/**
 * Calculate queue health based on stats
 */
export function calculateQueueHealth(stats: {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
}): 'healthy' | 'busy' | 'stalled' {
  if (stats.runningTasks === 0 && stats.pendingTasks === 0) {
    return 'healthy';
  } else if (stats.runningTasks > 0) {
    return 'busy';
  } else if (stats.pendingTasks > 20) {
    return 'stalled';
  }
  return 'healthy';
}

/**
 * Format queue stats for display
 */
export function formatQueueStats(stats: {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
}): string {
  const parts = [];
  if (stats.pendingTasks > 0) parts.push(`${stats.pendingTasks} pending`);
  if (stats.runningTasks > 0) parts.push(`${stats.runningTasks} running`);
  if (stats.failedTasks > 0) parts.push(`${stats.failedTasks} failed`);
  return parts.length > 0 ? parts.join(' • ') : '0 tasks';
}

/**
 * Estimate task completion time (rough estimate)
 */
export function estimateCompletionTime(
  position: number,
  avgTaskDuration: number = 30000
): number {
  return position * avgTaskDuration;
}

/**
 * Format duration in milliseconds to readable time
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
