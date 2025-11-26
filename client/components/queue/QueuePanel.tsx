/**
 * QueuePanel Component - Standalone queue management UI
 *
 * This component manages queue display and controls without
 * integrating into ChatContainer's message flow.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useMessageQueue } from '../../hooks/useMessageQueue';
import {
  Play,
  Pause,
  Square,
  Trash2,
  Plus,
  X,
  ListOrdered,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from '../../utils/toast';

interface QueuePanelProps {
  selectedModel?: string;
  sessionId?: string;
}

export function QueuePanel({ selectedModel: _selectedModel = 'sonnet', sessionId: _sessionId }: QueuePanelProps) {
  const {
    queue,
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    startProcessing,
    pauseProcessing,
    stopProcessing,
    isQueueOpen,
    setIsQueueOpen,
  } = useMessageQueue();

  const [newPrompt, setNewPrompt] = useState('');

  const stats = useMemo(() => ({
    pending: queue.items.filter(i => i.status === 'pending').length,
    processing: queue.items.filter(i => i.status === 'processing').length,
    completed: queue.items.filter(i => i.status === 'completed').length,
    failed: queue.items.filter(i => i.status === 'failed').length,
  }), [queue.items]);

  const progressPercent = queue.items.length > 0
    ? Math.round(((stats.completed + stats.failed) / queue.items.length) * 100)
    : 0;

  const handleAddItem = useCallback(() => {
    if (!newPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    addToQueue(newPrompt);
    setNewPrompt('');
    toast.success('Item added to queue');
  }, [newPrompt, addToQueue]);

  const handleAddMultiple = useCallback(() => {
    if (!newPrompt.trim()) {
      toast.error('Please enter prompts');
      return;
    }
    const prompts = newPrompt.split('\n').filter(p => p.trim());
    if (prompts.length === 0) {
      toast.error('No valid prompts found');
      return;
    }
    addMultipleToQueue(prompts);
    setNewPrompt('');
    toast.success(`${prompts.length} items added to queue`);
  }, [newPrompt, addMultipleToQueue]);

  const handleStart = useCallback(() => {
    if (queue.items.length === 0) {
      toast.error('Queue is empty');
      return;
    }
    startProcessing();
    toast.success('Queue processing started');
  }, [queue.items.length, startProcessing]);

  const handleClearQueue = useCallback(() => {
    if (confirm('Are you sure you want to clear the entire queue?')) {
      clearQueue();
      toast.success('Queue cleared');
    }
  }, [clearQueue]);

  if (!isQueueOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 h-screen w-96 bg-background border-l border-border shadow-lg flex flex-col z-40">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5" />
          <h2 className="font-semibold">Message Queue</h2>
        </div>
        <button
          onClick={() => setIsQueueOpen(false)}
          className="p-1 hover:bg-muted rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-blue-500/10 p-2 rounded">
            <div className="text-blue-600 dark:text-blue-400 font-medium">
              {stats.pending}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="bg-green-500/10 p-2 rounded">
            <div className="text-green-600 dark:text-green-400 font-medium">
              {stats.completed}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="bg-yellow-500/10 p-2 rounded">
            <div className="text-yellow-600 dark:text-yellow-400 font-medium">
              {stats.processing}
            </div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
          <div className="bg-red-500/10 p-2 rounded">
            <div className="text-red-600 dark:text-red-400 font-medium">
              {stats.failed}
            </div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Progress Bar */}
        {queue.items.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Progress: {progressPercent}%
            </div>
            <div className="w-full bg-muted rounded h-2">
              <div
                className="bg-blue-500 h-2 rounded transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 border-b border-border space-y-2">
        <textarea
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          placeholder="Enter prompt or multiple prompts (one per line)..."
          className="w-full h-24 p-2 bg-muted border border-border rounded text-sm resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleAddItem}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
          <button
            onClick={handleAddMultiple}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Multiple
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-4 border-b border-border flex gap-2">
        <button
          onClick={handleStart}
          disabled={queue.items.length === 0 || queue.isProcessing}
          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium flex items-center justify-center gap-1"
        >
          <Play className="w-4 h-4" />
          Start
        </button>
        <button
          onClick={() => pauseProcessing()}
          disabled={!queue.isProcessing}
          className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium flex items-center justify-center gap-1"
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>
        <button
          onClick={() => stopProcessing()}
          disabled={!queue.isProcessing}
          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium flex items-center justify-center gap-1"
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {queue.items.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Queue is empty
          </div>
        ) : (
          queue.items.map(item => (
            <div
              key={item.id}
              className={`p-2 rounded border text-sm ${
                item.status === 'completed' ? 'bg-green-500/10 border-green-500/20' :
                item.status === 'failed' ? 'bg-red-500/10 border-red-500/20' :
                item.status === 'processing' ? 'bg-blue-500/10 border-blue-500/20' :
                'bg-muted border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {item.prompt.substring(0, 60)}...
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {item.status === 'processing' && (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">Processing</span>
                      </>
                    )}
                    {item.status === 'completed' && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600 dark:text-green-400">Done</span>
                      </>
                    )}
                    {item.status === 'failed' && (
                      <>
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
                      </>
                    )}
                    {item.status === 'pending' && (
                      <>
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFromQueue(item.id)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <button
          onClick={handleClearQueue}
          disabled={queue.items.length === 0}
          className="w-full px-3 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Clear Queue
        </button>
      </div>
    </div>
  );
}
