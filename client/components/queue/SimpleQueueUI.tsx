/**
 * SimpleQueueUI - Ultra-clean, minimal queue management interface
 * Focus: simplicity + effectiveness
 */

import React, { useState } from 'react';
import { useQueue } from '../../hooks/useQueue';

interface Task {
  id: string;
  prompt: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
}

interface SimpleQueueUIProps {
  sessionId: string;
}

export function SimpleQueueUI({ sessionId }: SimpleQueueUIProps) {
  const queue = useQueue({ sessionId, autoRefreshMs: 1500 });
  const [prompt, setPrompt] = useState('');
  const [showAll, setShowAll] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    try {
      await queue.addTask(prompt.trim(), 'normal');
      setPrompt('');
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const displayTasks = showAll ? queue.tasks : queue.tasks.slice(0, 5);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header with Stats */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">
            {queue.stats
              ? `${queue.stats.totalTasks} total • ${queue.stats.pendingTasks} pending • ${queue.stats.runningTasks} running`
              : 'Loading...'}
          </p>
        </div>
        {queue.loading && <span className="text-gray-400 text-sm">⟳ Updating...</span>}
      </div>

      {/* Quick Add Task - Ultra Simple */}
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What do you need to do?"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || queue.loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 whitespace-nowrap"
          >
            Add
          </button>
        </div>
        {queue.error && (
          <div className="mt-2 text-sm text-red-600 flex justify-between items-center">
            <span>{queue.error}</span>
            <button
              type="button"
              onClick={queue.clearError}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              ✕
            </button>
          </div>
        )}
      </form>

      {/* Tasks List - Super Clean */}
      <div className="space-y-2">
        {queue.tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">✨ No tasks yet</p>
            <p className="text-sm mt-1">Add one above to get started</p>
          </div>
        ) : (
          <>
            {displayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onCancel={() => queue.cancelTask(task.id)}
                onPause={() => queue.pauseTask(task.id)}
                onResume={() => queue.resumeTask(task.id)}
              />
            ))}

            {/* Show More / Show Less */}
            {queue.tasks.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors font-medium"
              >
                {showAll ? '▲ Show less' : `▼ Show all (${queue.tasks.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Quick Stats Bar */}
      {queue.stats && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
          <span>💾 {queue.stats.completedTasks} completed</span>
          <span>❌ {queue.stats.failedTasks} failed</span>
          <span>🎯 {queue.stats.availableSlots} slots</span>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onCancel,
  onPause,
  onResume,
}: {
  task: Task;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    running: '▶️',
    paused: '⏸️',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫',
  };

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-600',
    running: 'text-blue-600',
    paused: 'text-orange-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    cancelled: 'text-gray-600',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm group">
      {/* Status Emoji */}
      <span className="text-lg flex-shrink-0">{statusEmoji[task.status] || '❓'}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate font-medium">{task.prompt}</p>
        <p className={`text-xs ${statusColor[task.status] || 'text-gray-600'} font-medium mt-0.5`}>{task.status}</p>
      </div>

      {/* Quick Actions - Only show on hover */}
      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status === 'pending' && (
          <QuickButton onClick={onCancel} color="red" label="✕" title="Cancel" />
        )}
        {task.status === 'running' && (
          <QuickButton onClick={onPause} color="orange" label="⏸" title="Pause" />
        )}
        {task.status === 'paused' && (
          <QuickButton onClick={onResume} color="blue" label="▶" title="Resume" />
        )}
      </div>
    </div>
  );
}

function QuickButton({
  onClick,
  color,
  label,
  title,
}: {
  onClick: () => void;
  color: 'red' | 'orange' | 'blue';
  label: string;
  title: string;
}) {
  const colors = {
    red: 'bg-red-50 hover:bg-red-100 text-red-600',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-600',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded flex items-center justify-center font-bold transition-colors ${colors[color]}`}
    >
      {label}
    </button>
  );
}
