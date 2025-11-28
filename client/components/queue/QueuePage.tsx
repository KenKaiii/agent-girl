/**
 * QueuePage - Dedicated full-page queue management
 * Clean, simple, effective layout
 */

import React from 'react';
import { SimpleQueueUI } from './SimpleQueueUI';
import { useQueue } from '../../hooks/useQueue';

interface QueuePageProps {
  sessionId: string;
}

export function QueuePage({ sessionId }: QueuePageProps) {
  const queue = useQueue({ sessionId, autoRefreshMs: 1500 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Queue Management</h1>
              <p className="text-gray-600 mt-2">
                Create, manage, and monitor your tasks efficiently
              </p>
            </div>

            {/* Quick Stats */}
            {queue.stats && (
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {queue.stats.totalTasks}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total tasks</p>
                <div className="mt-4 flex gap-4 justify-end text-sm">
                  <div>
                    <p className="font-bold text-yellow-600">
                      {queue.stats.pendingTasks}
                    </p>
                    <p className="text-gray-600">Pending</p>
                  </div>
                  <div>
                    <p className="font-bold text-blue-600">
                      {queue.stats.runningTasks}
                    </p>
                    <p className="text-gray-600">Running</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-600">
                      {queue.stats.completedTasks}
                    </p>
                    <p className="text-gray-600">Done</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <SimpleQueueUI sessionId={sessionId} />
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
        <p>Auto-refreshing every 1.5 seconds • All tasks saved automatically</p>
      </div>
    </div>
  );
}
