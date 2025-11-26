/**
 * Command Queue Display Component
 * Shows queued commands and their status
 */

import React from 'react';
import { Clock, CheckCircle2, Trash2 } from 'lucide-react';

interface QueuedCommand {
  id: string;
  content: string;
  status: 'pending' | 'running' | 'completed';
}

interface CommandQueueDisplayProps {
  queue: QueuedCommand[];
  onClearQueue: () => void;
}

export function CommandQueueDisplay({ queue, onClearQueue }: CommandQueueDisplayProps) {
  if (queue.length === 0) {
    return null;
  }

  const runningCommand = queue.find(cmd => cmd.status === 'running');
  const pendingCommands = queue.filter(cmd => cmd.status === 'pending');
  const completedCount = queue.filter(cmd => cmd.status === 'completed').length;

  return (
    <div className="border-t border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Command Queue ({queue.length})</span>
        </div>
        {completedCount > 0 && (
          <button
            onClick={onClearQueue}
            className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground"
            title="Clear completed commands"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {runningCommand && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 flex items-start gap-2">
          <div className="animate-spin">
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Running</p>
            <p className="text-xs text-muted-foreground truncate">
              {runningCommand.content.substring(0, 60)}...
            </p>
          </div>
        </div>
      )}

      {pendingCommands.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Pending ({pendingCommands.length})
          </p>
          {pendingCommands.slice(0, 3).map((cmd) => (
            <div key={cmd.id} className="text-xs text-muted-foreground pl-2 truncate">
              • {cmd.content.substring(0, 55)}...
            </div>
          ))}
          {pendingCommands.length > 3 && (
            <div className="text-xs text-muted-foreground pl-2">
              +{pendingCommands.length - 3} more
            </div>
          )}
        </div>
      )}

      {completedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{completedCount} completed</span>
        </div>
      )}
    </div>
  );
}
