/**
 * WebSocket Message Router
 * Dispatches incoming WebSocket messages to specific handlers
 */

import type { ServerWebSocket } from "bun";
import { wsRateLimiter } from "../../utils/rateLimiter";
import { logger } from "../../utils/logger";
import { handleChatMessage } from "./chatHandler";
import { handleApprovePlan, handleSetPermissionMode } from "./sessionHandler";
import { handleKillBackgroundProcess, handleStopGeneration } from "./cancelHandler";
import { handleAnswerQuestion, handleCancelQuestion } from "./questionHandler";
import {
  handlePremiumBuildStart,
  handlePremiumEdit,
  handlePremiumUndo,
  handlePremiumPreviewRequest,
  removeWebSocketFromBuilds,
} from "./premiumHandler";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

export async function handleWebSocketMessage(
  ws: ServerWebSocket<ChatWebSocketData>,
  message: string,
  activeQueries: Map<string, unknown>
): Promise<void> {
  if (ws.data?.type === 'hot-reload') return;

  // Get client identifier for rate limiting (use session ID or remote address)
  const clientId = ws.data?.sessionId || 'anonymous';

  // Check rate limit
  if (!wsRateLimiter.canProceed(clientId)) {
    const retryAfter = wsRateLimiter.getBlockedTimeRemaining(clientId);
    logger.warn('Rate limit exceeded', { clientId, retryAfter });

    ws.send(JSON.stringify({
      type: 'error',
      error: 'Rate limit exceeded. Please slow down.',
      retryAfter,
    }));
    return;
  }

  try {
    const data = JSON.parse(message);

    // Log incoming message (without sensitive content)
    logger.debug('WebSocket message received', {
      type: data.type,
      sessionId: data.sessionId,
      clientId,
    });

    if (data.type === 'chat') {
      await handleChatMessage(ws, data, activeQueries);
    } else if (data.type === 'approve_plan') {
      await handleApprovePlan(ws, data, activeQueries);
    } else if (data.type === 'set_permission_mode') {
      await handleSetPermissionMode(ws, data, activeQueries);
    } else if (data.type === 'kill_background_process') {
      await handleKillBackgroundProcess(ws, data);
    } else if (data.type === 'stop_generation') {
      await handleStopGeneration(ws, data);
    } else if (data.type === 'answer_question') {
      await handleAnswerQuestion(ws, data, activeQueries);
    } else if (data.type === 'cancel_question') {
      await handleCancelQuestion(ws, data);
    } else if (data.type === 'premium_build_start') {
      await handlePremiumBuildStart(ws, data, activeQueries);
    } else if (data.type === 'premium_edit') {
      await handlePremiumEdit(ws, data);
    } else if (data.type === 'premium_undo' || data.type === 'premium_redo') {
      await handlePremiumUndo(ws, data);
    } else if (data.type === 'premium_preview_request') {
      await handlePremiumPreviewRequest(ws, data);
    } else {
      logger.warn('Unknown message type', { type: data.type });
    }
  } catch (error) {
    logger.error('WebSocket message error', { clientId }, error as Error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Invalid message format'
    }));
  }
}
