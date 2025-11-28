/**
 * InlineQueueWidget - Embed directly in your UI
 * Compact, inline queue management without popups
 */

import React, { useState } from 'react';
import { useQueue } from '../../hooks/useQueue';

interface Task {
  id: string;
  prompt: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
}

interface InlineQueueWidgetProps {
  sessionId: string;
  maxVisible?: number;
}

export function InlineQueueWidget({
  sessionId,
  maxVisible = 3,
}: InlineQueueWidgetProps) {
  const queue = useQueue({ sessionId, autoRefreshMs: 2000 });
  const [prompt, setPrompt] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await queue.addTask(prompt.trim(), 'normal');
    setPrompt('');
  };

  const visibleTasks = queue.tasks.slice(0, maxVisible);
  const hiddenCount = Math.max(0, queue.tasks.length - maxVisible);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* Add Task */}
      <form onSubmit={handleAdd} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="New task..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
          >
            +
          </button>
        </div>
      </form>

      {/* Stats Line */}
      {queue.stats && (
        <div className="text-xs text-gray-600 mb-3 pb-3 border-b border-gray-200">
          <span className="font-medium">
            {queue.stats.pendingTasks} pending • {queue.stats.runningTasks} running •
            {queue.stats.completedTasks} done
          </span>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-1">
        {visibleTasks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">No tasks</p>
        ) : (
          visibleTasks.map((task) => (
            <MiniTaskItem
              key={task.id}
              task={task}
              onCancel={() => queue.cancelTask(task.id)}
            />
          ))
        )}

        {hiddenCount > 0 && (
          <p className="text-xs text-gray-500 text-center py-2">
            +{hiddenCount} more tasks
          </p>
        )}
      </div>
    </div>
  );
}

function MiniTaskItem({
  task,
  onCancel,
}: {
  task: Task;
  onCancel: () => void;
}) {
  const icons: Record<string, string> = {
    pending: '⏳',
    running: '▶️',
    completed: '✅',
    failed: '❌',
    paused: '⏸️',
    cancelled: '🚫',
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 text-xs hover:border-gray-300 transition-colors">
      <span className="text-base">{icons[task.status] || '❓'}</span>
      <span className="flex-1 truncate text-gray-700 font-medium">
        {task.prompt}
      </span>
      {task.status === 'pending' && (
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-red-600 font-bold"
          title="Cancel"
        >
          ✕
        </button>
      )}
    </div>
  );
}
