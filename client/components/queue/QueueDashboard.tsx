/**
 * Queue Dashboard - Intuitive real-time queue monitoring
 * Shows task status, statistics, and management controls
 */

import React from 'react';
import { useQueue, QueueTask } from '../../hooks/useQueue';

interface QueueDashboardProps {
  sessionId: string;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  paused: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, string> = {
  pending: '⏳',
  running: '▶️',
  paused: '⏸️',
  completed: '✅',
  failed: '❌',
  cancelled: '🚫',
};

function StatsCard({ label, value, unit = '' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-2">
        {value}
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function TaskItem({ task, onCancel, onPause, onResume }: {
  task: QueueTask;
  onCancel: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{statusIcons[task.status]}</span>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>
            {task.status}
          </span>
          <span className="text-xs text-gray-500 ml-auto">
            {new Date(task.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-gray-700 truncate">{task.prompt}</p>
      </div>
      <div className="flex gap-1">
        {task.status === 'pending' && (
          <button
            onClick={() => onCancel(task.id)}
            className="px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded transition-colors"
            title="Cancel task"
          >
            Cancel
          </button>
        )}
        {task.status === 'running' && (
          <button
            onClick={() => onPause(task.id)}
            className="px-2 py-1 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 rounded transition-colors"
            title="Pause task"
          >
            Pause
          </button>
        )}
        {task.status === 'paused' && (
          <button
            onClick={() => onResume(task.id)}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors"
            title="Resume task"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
}

export function QueueDashboard({ sessionId, compact = false }: QueueDashboardProps) {
  const queue = useQueue({ sessionId, autoRefreshMs: 2000 });

  if (compact) {
    return (
      <div className="flex gap-2 items-center">
        {queue.stats && (
          <>
            <div className="text-sm font-medium text-gray-700">
              {queue.stats.pendingTasks} pending
            </div>
            <div className="text-sm text-blue-600 font-medium">
              {queue.stats.runningTasks} running
            </div>
            <div className="text-sm text-green-600 font-medium">
              {queue.stats.completedTasks} done
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Task Queue</h2>
        <button
          onClick={queue.refresh}
          disabled={queue.loading}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {queue.loading ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {/* Error Alert */}
      {queue.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-700">{queue.error}</span>
          <button
            onClick={queue.clearError}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {queue.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <StatsCard label="Total" value={queue.stats.totalTasks} />
          <StatsCard label="Pending" value={queue.stats.pendingTasks} />
          <StatsCard label="Running" value={queue.stats.runningTasks} />
          <StatsCard label="Completed" value={queue.stats.completedTasks} />
          <StatsCard label="Failed" value={queue.stats.failedTasks} />
          <StatsCard label="Available Slots" value={queue.stats.availableSlots} />
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Tasks ({queue.tasks.length})
        </h3>

        {queue.tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">📭 No tasks yet</p>
            <p className="text-sm mt-1">Create a task to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onCancel={queue.cancelTask}
                onPause={queue.pauseTask}
                onResume={queue.resumeTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
