/**
 * Agent Girl - Chat hooks re-export (backward compatibility)
 * DEPRECATED: Use ../../hooks/chat instead
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Re-export from new location for backward compatibility
export { useWebSocketMessageHandler, FILE_EDIT_TOOLS, getToolDisplayName } from '../../hooks/chat/useWebSocketMessageHandler';
export { useKeyboardShortcuts } from '../../hooks/chat/useKeyboardShortcuts';
export { useSessionState } from '../../hooks/chat/useSessionState';
export { useModeManagement } from '../../hooks/chat/useModeManagement';
export { useUIState } from '../../hooks/chat/useUIState';
export { useMessageSubmission } from '../../hooks/chat/useMessageSubmission';
export { useBuildHandlers } from '../../hooks/chat/useBuildHandlers';
