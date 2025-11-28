/**
 * Queue Management Hook - Intuitive API for queue operations
 * Provides real-time queue status, task management, and auto-refresh
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface QueueTask {
  id: string;
  sessionId: string;
  prompt: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  priority: 'high' | 'normal' | 'low';
  progress?: number;
  createdAt: number;
  updatedAt: number;
  result?: string;
  error?: string;
}

export interface QueueStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  availableSlots: number;
}

export interface UseQueueOptions {
  sessionId: string;
  autoRefreshMs?: number;
  onTaskChange?: (task: QueueTask) => void;
}

export function useQueue(options: UseQueueOptions) {
  const { sessionId, autoRefreshMs = 2000, onTaskChange } = options;
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/queue/tasks?sessionId=${sessionId}`, {
        method: 'GET',
      });
      const data = await response.json();
      setTasks(data.tasks || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/queue/stats?sessionId=${sessionId}`, {
        method: 'GET',
      });
      const data = await response.json();
      setStats(data.taskQueue || null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [sessionId]);

  const addTask = useCallback(
    async (prompt: string, priority: 'high' | 'normal' | 'low' = 'normal') => {
      try {
        const response = await fetch('/api/queue/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            prompt,
            mode: 'general',
            model: 'claude-3-5-sonnet',
            priority,
          }),
        });

        if (!response.ok) throw new Error('Failed to add task');
        const data = await response.json();
        const newTask = data.task;
        setTasks((prev) => [newTask, ...prev]);
        onTaskChange?.(newTask);
        return newTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    [sessionId, onTaskChange]
  );

  const cancelTask = useCallback(async (taskId: string) => {
    try {
      await fetch(`/api/queue/tasks/${taskId}/cancel`, { method: 'PUT' });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'cancelled' as const } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel task');
    }
  }, []);

  const pauseTask = useCallback(async (taskId: string) => {
    try {
      await fetch(`/api/queue/tasks/${taskId}/pause`, { method: 'PUT' });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'paused' as const } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause task');
    }
  }, []);

  const resumeTask = useCallback(async (taskId: string) => {
    try {
      await fetch(`/api/queue/tasks/${taskId}/resume`, { method: 'PUT' });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'pending' as const } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume task');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Auto-refresh setup
  useEffect(() => {
    fetchTasks();
    fetchStats();

    if (autoRefreshMs > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchTasks();
        fetchStats();
      }, autoRefreshMs);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchTasks, fetchStats, autoRefreshMs]);

  return {
    tasks,
    stats,
    loading,
    error,
    addTask,
    cancelTask,
    pauseTask,
    resumeTask,
    refresh: () => {
      fetchTasks();
      fetchStats();
    },
    clearError,
  };
}
