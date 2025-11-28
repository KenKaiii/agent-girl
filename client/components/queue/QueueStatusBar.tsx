/**
 * Queue Status Bar - Compact status indicator for header/sidebar
 * Shows quick overview of queue health and task counts
 */

import React, { useState, useEffect } from 'react';

interface QueueStatus {
  total: number;
  pending: number;
  running: number;
  completed: number;
  health: 'healthy' | 'busy' | 'stalled';
}

export function QueueStatusBar({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/queue/stats?sessionId=${sessionId}`);
        const data = await response.json();
        const tq = data.taskQueue;
        const health =
          tq.runningTasks > 0
            ? 'busy'
            : tq.pendingTasks > 10
              ? 'stalled'
              : 'healthy';

        setStatus({
          total: tq.totalTasks,
          pending: tq.pendingTasks,
          running: tq.runningTasks,
          completed: tq.completedTasks,
          health,
        });
      } catch (err) {
        console.error('Failed to fetch queue status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading || !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  const healthColor =
    status.health === 'healthy'
      ? 'bg-green-100 text-green-700'
      : status.health === 'busy'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-red-100 text-red-700';

  const healthIcon =
    status.health === 'healthy'
      ? '✅'
      : status.health === 'busy'
        ? '⚡'
        : '⚠️';

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200">
      <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${healthColor}`}>
        <span>{healthIcon}</span>
        <span>{status.health}</span>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="text-yellow-600 font-medium">{status.pending} pending</span>
        <span className="text-blue-600 font-medium">{status.running} running</span>
        <span className="text-green-600 font-medium">{status.completed} done</span>
      </div>
      {status.total > 0 && (
        <div className="ml-auto text-xs text-gray-500">{status.total} total</div>
      )}
    </div>
  );
}
