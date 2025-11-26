/**
 * Command Queue Manager
 * Manages async command execution with queuing support
 * Allows users to send new commands while previous ones are still running
 */

import type { ServerWebSocket } from "bun";

export interface QueuedCommand {
  id: string;
  sessionId: string;
  content: string;
  model: string;
  timezone: string;
  mode?: string;
  timestamp: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

class CommandQueue {
  private queues: Map<string, QueuedCommand[]> = new Map();
  private activeCommands: Map<string, QueuedCommand> = new Map();
  private commandHandlers: Map<string, (command: QueuedCommand, ws: ServerWebSocket) => Promise<void>> = new Map();

  /**
   * Add command to queue for a session
   */
  addCommand(command: Omit<QueuedCommand, 'status' | 'timestamp'>): QueuedCommand {
    const fullCommand: QueuedCommand = {
      ...command,
      timestamp: Date.now(),
      status: 'pending'
    };

    const sessionQueue = this.queues.get(command.sessionId) || [];
    sessionQueue.push(fullCommand);
    this.queues.set(command.sessionId, sessionQueue);

    console.log(`📋 Command queued for session ${command.sessionId}. Queue length: ${sessionQueue.length}`);
    return fullCommand;
  }

  /**
   * Get next pending command for a session
   */
  getNextCommand(sessionId: string): QueuedCommand | null {
    const queue = this.queues.get(sessionId);
    if (!queue || queue.length === 0) return null;

    // Find first pending command
    const nextCommand = queue.find(cmd => cmd.status === 'pending');
    return nextCommand || null;
  }

  /**
   * Mark command as running
   */
  startCommand(commandId: string, sessionId: string): boolean {
    const queue = this.queues.get(sessionId);
    if (!queue) return false;

    const command = queue.find(cmd => cmd.id === commandId);
    if (!command) return false;

    command.status = 'running';
    this.activeCommands.set(sessionId, command);
    console.log(`▶️  Command started for session ${sessionId}: ${commandId}`);
    return true;
  }

  /**
   * Mark command as completed
   */
  completeCommand(commandId: string, sessionId: string): QueuedCommand | null {
    const queue = this.queues.get(sessionId);
    if (!queue) return null;

    const command = queue.find(cmd => cmd.id === commandId);
    if (!command) return null;

    command.status = 'completed';
    this.activeCommands.delete(sessionId);
    console.log(`✅ Command completed for session ${sessionId}: ${commandId}`);
    return command;
  }

  /**
   * Mark command as failed
   */
  failCommand(commandId: string, sessionId: string, error: string): QueuedCommand | null {
    const queue = this.queues.get(sessionId);
    if (!queue) return null;

    const command = queue.find(cmd => cmd.id === commandId);
    if (!command) return null;

    command.status = 'failed';
    command.error = error;
    this.activeCommands.delete(sessionId);
    console.log(`❌ Command failed for session ${sessionId}: ${commandId} - ${error}`);
    return command;
  }

  /**
   * Check if a session has active command
   */
  hasActiveCommand(sessionId: string): boolean {
    return this.activeCommands.has(sessionId);
  }

  /**
   * Get active command for session
   */
  getActiveCommand(sessionId: string): QueuedCommand | null {
    return this.activeCommands.get(sessionId) || null;
  }

  /**
   * Get all pending commands for session
   */
  getPendingCommands(sessionId: string): QueuedCommand[] {
    const queue = this.queues.get(sessionId) || [];
    return queue.filter(cmd => cmd.status === 'pending');
  }

  /**
   * Get queue status for session
   */
  getQueueStatus(sessionId: string): {
    active: QueuedCommand | null;
    pending: QueuedCommand[];
    total: number;
  } {
    const active = this.getActiveCommand(sessionId);
    const pending = this.getPendingCommands(sessionId);
    const queue = this.queues.get(sessionId) || [];
    return {
      active,
      pending,
      total: queue.length
    };
  }

  /**
   * Clear queue for session
   */
  clearQueue(sessionId: string): void {
    this.queues.delete(sessionId);
    this.activeCommands.delete(sessionId);
    console.log(`🗑️  Queue cleared for session ${sessionId}`);
  }

  /**
   * Cancel all pending commands for session
   */
  cancelPendingCommands(sessionId: string): number {
    const queue = this.queues.get(sessionId);
    if (!queue) return 0;

    const pendingCount = queue.filter(cmd => cmd.status === 'pending').length;
    this.queues.set(sessionId, queue.filter(cmd => cmd.status !== 'pending'));
    console.log(`❌ Cancelled ${pendingCount} pending commands for session ${sessionId}`);
    return pendingCount;
  }
}

export const commandQueue = new CommandQueue();
