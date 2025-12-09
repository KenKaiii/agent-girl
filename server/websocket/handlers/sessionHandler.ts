/**
 * Session Management Handlers
 * Handles permission mode changes and plan approvals
 */

import type { ServerWebSocket } from "bun";
import { sessionDb } from "../../database";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

export async function handleApprovePlan(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  activeQueries: Map<string, unknown>
): Promise<void> {
  const { sessionId } = data;

  if (!sessionId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId' }));
    return;
  }

  const activeQuery = activeQueries.get(sessionId as string);

  try {
    console.log('✅ Plan approved, switching to bypassPermissions mode');

    // Switch SDK back to bypassPermissions (was in plan mode)
    if (activeQuery) {
      console.log(`🔄 Switching SDK permission mode: plan → bypassPermissions`);
      await (activeQuery as { setPermissionMode: (mode: string) => Promise<void> }).setPermissionMode('bypassPermissions');
    }

    // Update database to bypassPermissions mode
    sessionDb.updatePermissionMode(sessionId as string, 'bypassPermissions');

    // Send confirmation to client
    ws.send(JSON.stringify({
      type: 'permission_mode_changed',
      mode: 'bypassPermissions'
    }));

    // Send a continuation message to the user to trigger execution
    ws.send(JSON.stringify({
      type: 'plan_approved_continue',
      message: 'Plan approved. Proceeding with implementation...'
    }));

    console.log('✅ Plan approved, SDK switched to bypassPermissions');
  } catch (error) {
    console.error('Failed to handle plan approval:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to approve plan'
    }));
  }
}

export async function handleSetPermissionMode(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  activeQueries: Map<string, unknown>
): Promise<void> {
  const { sessionId, mode } = data;

  if (!sessionId || !mode) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId or mode' }));
    return;
  }

  const activeQuery = activeQueries.get(sessionId as string);

  try {
    // If there's an active query, update it mid-stream
    if (activeQuery) {
      console.log(`🔄 Switching permission mode mid-stream: ${mode}`);
      await (activeQuery as { setPermissionMode: (mode: string) => Promise<void> }).setPermissionMode(mode as string);
    }

    // Always update database
    sessionDb.updatePermissionMode(sessionId as string, mode as 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'autonom');

    ws.send(JSON.stringify({
      type: 'permission_mode_changed',
      mode
    }));
  } catch (error) {
    console.error('Failed to update permission mode:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to update permission mode'
    }));
  }
}
