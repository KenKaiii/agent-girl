/**
 * Clone WebSocket Handler
 * Handles real-time website cloning progress and preview updates
 */

import type { ServerWebSocket } from "bun";
import { logger } from "../../utils/logger";
import { cloneService } from "../../modules/clone/service";
import type { CloneOptions } from "../../modules/clone/types";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

interface CloneStartMessage {
  type: 'clone_start';
  sessionId: string;
  url: string;
  options?: Partial<CloneOptions>;
}

interface CloneQuickMessage {
  type: 'clone_quick';
  sessionId: string;
  url: string;
  port?: number;
}

interface CloneStatusMessage {
  type: 'clone_status';
  sessionId: string;
  jobId: string;
}

interface CloneStopServerMessage {
  type: 'clone_stop_server';
  sessionId: string;
  pid: number;
}

// Store WebSocket connections per clone job for progress updates
const cloneConnections = new Map<string, Set<ServerWebSocket<ChatWebSocketData>>>();

/**
 * Handle clone_start message
 * Starts a new clone job with real-time progress
 */
export async function handleCloneStart(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: CloneStartMessage
): Promise<void> {
  const { sessionId, url, options } = data;

  if (!url) {
    ws.send(JSON.stringify({
      type: 'clone_error',
      sessionId,
      error: 'URL is required',
    }));
    return;
  }

  logger.info('Clone started via WebSocket', { sessionId, url });

  try {
    // Start the clone job
    const job = await cloneService.clone({
      url,
      ...options,
    });

    // Register WebSocket connection for this job
    if (!cloneConnections.has(job.id)) {
      cloneConnections.set(job.id, new Set());
    }
    cloneConnections.get(job.id)!.add(ws);

    // Send initial status
    ws.send(JSON.stringify({
      type: 'clone_started',
      sessionId,
      jobId: job.id,
      url: job.url,
      status: job.status,
    }));

    // Subscribe to job events
    cloneService.subscribe(job.id, (event) => {
      broadcastToClone(job.id, {
        type: `clone_${event.type}`,
        sessionId,
        jobId: job.id,
        ...event.data,
      });

      // If complete or error, include preview action
      if (event.type === 'complete' && event.data?.server) {
        broadcastToClone(job.id, {
          type: 'clone_complete',
          sessionId,
          jobId: job.id,
          result: event.data,
          previewUrl: event.data.server.url,
          previewAction: `<preview-action type="open" url="${event.data.server.url}" />`,
        });
      }
    });
  } catch (error) {
    logger.error('Clone start failed', { sessionId, url }, error as Error);
    ws.send(JSON.stringify({
      type: 'clone_error',
      sessionId,
      error: error instanceof Error ? error.message : 'Clone failed to start',
    }));
  }
}

/**
 * Handle clone_quick message
 * Quick clone and serve with single response
 */
export async function handleCloneQuick(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: CloneQuickMessage
): Promise<void> {
  const { sessionId, url, port } = data;

  if (!url) {
    ws.send(JSON.stringify({
      type: 'clone_error',
      sessionId,
      error: 'URL is required',
    }));
    return;
  }

  logger.info('Quick clone started via WebSocket', { sessionId, url, port });

  // Send progress update
  ws.send(JSON.stringify({
    type: 'clone_progress',
    sessionId,
    status: 'cloning',
    message: `Cloning ${url}...`,
  }));

  try {
    const result = await cloneService.quickClone(url, port || 4321);

    ws.send(JSON.stringify({
      type: 'clone_complete',
      sessionId,
      success: true,
      htmlDir: result.htmlDir,
      previewUrl: result.server.url,
      server: result.server,
      previewAction: `<preview-action type="open" url="${result.server.url}" />`,
    }));

    logger.info('Quick clone complete', { sessionId, url, previewUrl: result.server.url });
  } catch (error) {
    logger.error('Quick clone failed', { sessionId, url }, error as Error);
    ws.send(JSON.stringify({
      type: 'clone_error',
      sessionId,
      error: error instanceof Error ? error.message : 'Quick clone failed',
    }));
  }
}

/**
 * Handle clone_status message
 * Get current status of a clone job
 */
export async function handleCloneStatus(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: CloneStatusMessage
): Promise<void> {
  const { sessionId, jobId } = data;

  const job = cloneService.getJob(jobId);
  if (!job) {
    ws.send(JSON.stringify({
      type: 'clone_error',
      sessionId,
      jobId,
      error: 'Job not found',
    }));
    return;
  }

  ws.send(JSON.stringify({
    type: 'clone_status_response',
    sessionId,
    job,
  }));
}

/**
 * Handle clone_stop_server message
 * Stop a preview server
 */
export async function handleCloneStopServer(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: CloneStopServerMessage
): Promise<void> {
  const { sessionId, pid } = data;

  try {
    await cloneService.stopServer(pid);
    ws.send(JSON.stringify({
      type: 'clone_server_stopped',
      sessionId,
      pid,
      success: true,
    }));
    logger.info('Clone server stopped', { sessionId, pid });
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'clone_error',
      sessionId,
      error: error instanceof Error ? error.message : 'Failed to stop server',
    }));
  }
}

/**
 * Broadcast message to all connections for a clone job
 */
function broadcastToClone(jobId: string, message: unknown): void {
  const connections = cloneConnections.get(jobId);
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  for (const ws of connections) {
    try {
      ws.send(messageStr);
    } catch {
      // Remove dead connection
      connections.delete(ws);
    }
  }
}

/**
 * Clean up connections for a clone job
 */
export function cleanupCloneConnections(jobId: string): void {
  cloneConnections.delete(jobId);
}

/**
 * Remove a WebSocket from all clone connections
 */
export function removeWebSocketFromClones(ws: ServerWebSocket<ChatWebSocketData>): void {
  for (const [_jobId, connections] of cloneConnections) {
    connections.delete(ws);
  }
}
