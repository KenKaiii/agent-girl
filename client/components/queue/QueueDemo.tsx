/**
 * Queue Demo - Interactive example of queue usage
 * Shows all major queue features in action
 */

import React, { useState } from 'react';
import { useQueue } from '../../hooks/useQueue';
import {
  formatTaskStatus,
  getStatusColor,
  formatTime,
  formatQueueStats,
} from '../../utils/queueUtils';

export function QueueDemo() {
  const sessionId = 'demo-session-' + Date.now();
  const queue = useQueue({ sessionId, autoRefreshMs: 1000 });
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<
    'high' | 'normal' | 'low'
  >('normal');

  const handleAddTask = async () => {
    if (!inputPrompt.trim()) return;
    try {
      await queue.addTask(inputPrompt, selectedPriority);
      setInputPrompt('');
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const getTaskIcon = (status: string) => {
    const icons: Record<string, string> = {
      pending: '⏳',
      running: '▶️',
      paused: '⏸️',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫',
    };
    return icons[status] || '❓';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Queue System Demo</h1>
        <p className="text-gray-600 mt-2">
          Interactive demonstration of task queue management
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>

        <div className="space-y-3">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Enter task prompt... (e.g., 'Write a poem about AI')"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) =>
                  setSelectedPriority(e.target.value as any)
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">🔴 High</option>
                <option value="normal">🟡 Normal</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <button
              onClick={handleAddTask}
              disabled={!inputPrompt.trim() || queue.loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {queue.loading ? 'Adding...' : '➕ Add Task'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {queue.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{queue.error}</p>
          </div>
          <button
            onClick={queue.clearError}
            className="text-red-600 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {queue.stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon="📊"
            label="Total Tasks"
            value={queue.stats.totalTasks}
          />
          <StatCard
            icon="⏳"
            label="Pending"
            value={queue.stats.pendingTasks}
            highlight={queue.stats.pendingTasks > 0}
          />
          <StatCard
            icon="▶️"
            label="Running"
            value={queue.stats.runningTasks}
            highlight={queue.stats.runningTasks > 0}
          />
          <StatCard
            icon="✅"
            label="Completed"
            value={queue.stats.completedTasks}
          />
          <StatCard
            icon="❌"
            label="Failed"
            value={queue.stats.failedTasks}
            highlight={queue.stats.failedTasks > 0}
          />
          <StatCard
            icon="🎯"
            label="Available Slots"
            value={queue.stats.availableSlots}
          />
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Tasks ({queue.tasks.length})
          </h2>
          <button
            onClick={queue.refresh}
            disabled={queue.loading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
          >
            {queue.loading ? '⟳ Refreshing' : '⟳ Refresh'}
          </button>
        </div>

        {queue.tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">📭 No tasks yet</p>
            <p className="text-sm mt-1">Create a task above to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                icon={getTaskIcon(task.status)}
                onCancel={() => queue.cancelTask(task.id)}
                onPause={() => queue.pauseTask(task.id)}
                onResume={() => queue.resumeTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Queue Health Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Queue Status</h3>
        <p className="text-blue-800 text-sm">
          {queue.stats
            ? formatQueueStats(queue.stats)
            : 'Loading queue status...'}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 text-center transition-colors ${
        highlight
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

interface TaskRowProps {
  task: {
    id: string;
    prompt: string;
    status: string;
    createdAt: number;
  };
  icon: string;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
}

function TaskRow({
  task,
  icon,
  onCancel,
  onPause,
  onResume,
}: TaskRowProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
      <span className="text-lg mt-1">{icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-1 bg-white rounded border border-gray-300">
            {task.status}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(task.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-700 truncate">{task.prompt}</p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        {task.status === 'pending' && (
          <ActionButton
            onClick={onCancel}
            color="red"
            label="Cancel"
          />
        )}
        {task.status === 'running' && (
          <ActionButton
            onClick={onPause}
            color="orange"
            label="Pause"
          />
        )}
        {task.status === 'paused' && (
          <ActionButton
            onClick={onResume}
            color="blue"
            label="Resume"
          />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  color,
  label,
}: {
  onClick: () => void;
  color: string;
  label: string;
}) {
  const colors: Record<string, string> = {
    red: 'bg-red-50 hover:bg-red-100 text-red-700',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${colors[color]}`}
    >
      {label}
    </button>
  );
}
