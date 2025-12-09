/**
 * WebSocket Message Handlers - Router
 * Thin router that delegates to specific handler files
 */

import type { ServerWebSocket } from "bun";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

// Re-export the main handler from the handlers directory
export { handleWebSocketMessage } from "./handlers/index";
