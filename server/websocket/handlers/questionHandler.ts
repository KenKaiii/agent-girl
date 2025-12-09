/**
 * Question Handling
 * Handles answer_question and cancel_question operations
 */

import type { ServerWebSocket } from "bun";
import { answerQuestion, cancelQuestion } from "../../mcp/askUserQuestion";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

export async function handleAnswerQuestion(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  _activeQueries: Map<string, unknown>
): Promise<void> {
  const { sessionId, toolId, answers } = data;

  if (!sessionId || !toolId || !answers) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId, toolId, or answers' }));
    return;
  }

  try {
    console.log(`❓ User answered question (toolId: ${toolId}) for session: ${sessionId.toString().substring(0, 8)}`);
    console.log('📝 Answers:', answers);

    // Resolve the pending question promise with the user's answers
    // This unblocks the MCP tool handler and returns answers to Claude
    const answered = answerQuestion(toolId as string, answers as Record<string, string>);

    if (answered) {
      // Confirm to client
      ws.send(JSON.stringify({
        type: 'question_answered',
        toolId: toolId,
        sessionId: sessionId
      }));
    } else {
      console.warn(`⚠️ No pending question found for toolId: ${toolId}`);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Question not found or already answered'
      }));
    }

  } catch (error) {
    console.error('❌ Error handling question answer:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to process answer'
    }));
  }
}

export async function handleCancelQuestion(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>
): Promise<void> {
  const { sessionId, toolId } = data;

  if (!sessionId || !toolId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId or toolId' }));
    return;
  }

  try {
    console.log(`❌ User cancelled question (toolId: ${toolId}) for session: ${sessionId.toString().substring(0, 8)}`);

    // Cancel the pending question - this rejects the promise in the MCP tool
    const cancelled = cancelQuestion(toolId as string);

    if (cancelled) {
      ws.send(JSON.stringify({
        type: 'question_cancelled',
        toolId: toolId,
        sessionId: sessionId
      }));
    } else {
      console.warn(`⚠️ No pending question found to cancel for toolId: ${toolId}`);
    }

  } catch (error) {
    console.error('❌ Error cancelling question:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to cancel question'
    }));
  }
}
