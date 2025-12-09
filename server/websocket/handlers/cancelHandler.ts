/**
 * Cancel Operations Handler
 * Handles stopping generation and killing background processes
 */

import type { ServerWebSocket } from "bun";
import { backgroundProcessManager } from "../../backgroundProcessManager";
import { sessionStreamManager } from "../../sessionStreamManager";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

export async function handleKillBackgroundProcess(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>
): Promise<void> {
  const { bashId } = data;

  if (!bashId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing bashId' }));
    return;
  }

  try {
    console.log(`🛑 Killing background process: ${bashId}`);

    const success = await backgroundProcessManager.kill(bashId as string);

    if (success) {
      ws.send(JSON.stringify({
        type: 'background_process_killed',
        bashId
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Process not found'
      }));
    }
  } catch (error) {
    console.error('Failed to kill background process:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to kill background process'
    }));
  }
}

export async function handleStopGeneration(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>
): Promise<void> {
  const { sessionId } = data;

  if (!sessionId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId' }));
    return;
  }

  try {
    console.log(`🛑 Stop generation requested for session: ${sessionId.toString().substring(0, 8)}`);

    const success = sessionStreamManager.abortSession(sessionId as string);

    if (success) {
      console.log(`✅ Generation stopped successfully: ${sessionId.toString().substring(0, 8)}`);
      ws.send(JSON.stringify({
        type: 'generation_stopped',
        sessionId: sessionId
      }));
    } else {
      console.warn(`⚠️ Failed to stop generation (session not found): ${sessionId.toString().substring(0, 8)}`);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Session not found or already stopped'
      }));
    }
  } catch (error) {
    console.error('❌ Error stopping generation:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to stop generation'
    }));
  }
}
