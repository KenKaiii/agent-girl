/**
 * Premium Builder WebSocket Handler
 * Handles real-time premium build progress, quick edits, and preview updates
 */

import type { ServerWebSocket } from "bun";
import { logger } from "../../utils/logger";
import {
  activePremiumBuilds,
  type PremiumBuildState,
} from "../../routes/premium";
import {
  executeEditCommand,
  undo,
  redo,
  type EditCommand,
  type EditResult,
} from "../../utils/premium";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

interface PremiumBuildStartMessage {
  type: 'premium_build_start';
  buildId: string;
  sessionId: string;
}

interface PremiumEditMessage {
  type: 'premium_edit';
  buildId: string;
  command: EditCommand;
}

interface PremiumUndoMessage {
  type: 'premium_undo' | 'premium_redo';
  buildId: string;
}

interface PremiumPreviewMessage {
  type: 'premium_preview_request';
  buildId: string;
}

// Store WebSocket connections per build for progress updates
const buildConnections = new Map<string, Set<ServerWebSocket<ChatWebSocketData>>>();

/**
 * Handle premium_build_start message
 * Starts executing the 100-step build plan with real-time progress
 */
export async function handlePremiumBuildStart(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: PremiumBuildStartMessage,
  _activeQueries: Map<string, unknown>
): Promise<void> {
  const { buildId, sessionId } = data;

  const build = activePremiumBuilds.get(buildId);
  if (!build) {
    ws.send(JSON.stringify({
      type: 'premium_build_error',
      buildId,
      error: 'Build not found',
    }));
    return;
  }

  // Register WebSocket connection for this build
  if (!buildConnections.has(buildId)) {
    buildConnections.set(buildId, new Set());
  }
  buildConnections.get(buildId)!.add(ws);

  logger.info('Premium build started', { buildId, sessionId });

  // Update build status
  build.status = 'building';

  // Send initial status
  sendBuildProgress(buildId, build);

  try {
    // Execute build steps
    await executeBuildSteps(buildId, build);
  } catch (error) {
    build.status = 'error';
    build.error = error instanceof Error ? error.message : 'Build failed';
    logger.error('Premium build failed', { buildId }, error as Error);

    broadcastToBuild(buildId, {
      type: 'premium_build_error',
      buildId,
      error: build.error,
    });
  }
}

// Heartbeat interval to keep WebSocket connections alive during long builds
const KEEPALIVE_INTERVAL_MS = 25000; // 25 seconds (under typical 30s timeout)

/**
 * Execute all build steps with progress updates
 */
async function executeBuildSteps(
  buildId: string,
  build: PremiumBuildState
): Promise<void> {
  if (!build.plan) {
    throw new Error('No build plan available');
  }

  let lastKeepalive = Date.now();

  for (const step of build.plan.steps) {
    // Send keepalive if enough time has passed (prevents WebSocket timeout)
    const now = Date.now();
    if (now - lastKeepalive > KEEPALIVE_INTERVAL_MS) {
      broadcastToBuild(buildId, {
        type: 'premium_keepalive',
        buildId,
        timestamp: now,
      });
      lastKeepalive = now;
    }

    // Update current step
    build.currentStep = step.id;
    build.currentPhase = build.plan.phases.find(
      p => step.id >= p.stepRange[0] && step.id <= p.stepRange[1]
    )?.name;

    // Send progress update
    sendBuildProgress(buildId, build);

    // Simulate step execution (in real implementation, this would execute the step)
    // TODO: Integrate with actual Claude SDK for step execution
    await simulateStep(step.name);

    // Update cost estimates
    build.cost.tokens += step.estimatedTokens;
    build.cost.apiCalls++;
    build.cost.estimatedUSD = build.cost.tokens * 0.00001; // Rough estimate
  }

  // Build complete
  build.status = 'complete';
  build.completedAt = new Date();
  build.previewUrl = `http://localhost:4321`; // Would be actual preview URL

  broadcastToBuild(buildId, {
    type: 'premium_build_complete',
    buildId,
    previewUrl: build.previewUrl,
    projectPath: build.projectPath,
    cost: build.cost,
  });

  logger.info('Premium build complete', {
    buildId,
    steps: build.totalSteps,
    cost: build.cost,
  });
}

/**
 * Send build progress to all connected clients
 */
function sendBuildProgress(buildId: string, build: PremiumBuildState): void {
  broadcastToBuild(buildId, {
    type: 'premium_build_progress',
    buildId,
    progress: {
      currentStep: build.currentStep,
      totalSteps: build.totalSteps,
      percentage: Math.round((build.currentStep / build.totalSteps) * 100),
      currentPhase: build.currentPhase,
      currentStepName: build.plan?.steps[build.currentStep - 1]?.name,
    },
    cost: build.cost,
    status: build.status,
  });
}

/**
 * Handle premium_edit message
 * Execute quick edit command with real-time feedback
 */
export async function handlePremiumEdit(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: PremiumEditMessage
): Promise<void> {
  const { buildId, command } = data;

  const build = activePremiumBuilds.get(buildId);
  if (!build) {
    ws.send(JSON.stringify({
      type: 'premium_edit_error',
      buildId,
      error: 'Build not found',
    }));
    return;
  }

  if (!build.projectPath) {
    ws.send(JSON.stringify({
      type: 'premium_edit_error',
      buildId,
      error: 'Project not built yet',
    }));
    return;
  }

  try {
    // Execute the edit command
    const result: EditResult = await executeEditCommand(command, build.projectPath);

    // Update cost tracking
    build.cost.apiCalls++;

    // Send result
    ws.send(JSON.stringify({
      type: 'premium_edit_result',
      buildId,
      success: result.success,
      appliedChanges: result.appliedChanges,
      preview: result.preview,
      message: result.message,
      canUndo: true,
    }));

    // Notify preview to refresh
    broadcastToBuild(buildId, {
      type: 'premium_preview_refresh',
      buildId,
    });

    logger.info('Premium edit executed', {
      buildId,
      commandType: command.type,
    });
  } catch (error) {
    logger.error('Premium edit failed', { buildId }, error as Error);
    ws.send(JSON.stringify({
      type: 'premium_edit_error',
      buildId,
      error: error instanceof Error ? error.message : 'Edit failed',
    }));
  }
}

/**
 * Handle premium_undo message
 */
export async function handlePremiumUndo(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: PremiumUndoMessage
): Promise<void> {
  const { buildId, type } = data;

  const build = activePremiumBuilds.get(buildId);
  if (!build || !build.projectPath) {
    ws.send(JSON.stringify({
      type: 'premium_undo_error',
      buildId,
      error: 'Build not found',
    }));
    return;
  }

  try {
    const result = type === 'premium_undo'
      ? undo(build.projectPath)
      : redo(build.projectPath);

    if (result) {
      ws.send(JSON.stringify({
        type: 'premium_undo_result',
        buildId,
        success: true,
        result,
      }));

      // Notify preview to refresh
      broadcastToBuild(buildId, {
        type: 'premium_preview_refresh',
        buildId,
      });
    } else {
      ws.send(JSON.stringify({
        type: 'premium_undo_result',
        buildId,
        success: false,
        error: type === 'premium_undo' ? 'Nothing to undo' : 'Nothing to redo',
      }));
    }
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'premium_undo_error',
      buildId,
      error: error instanceof Error ? error.message : 'Undo/redo failed',
    }));
  }
}

/**
 * Handle premium_preview_request message
 */
export async function handlePremiumPreviewRequest(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: PremiumPreviewMessage
): Promise<void> {
  const { buildId } = data;

  const build = activePremiumBuilds.get(buildId);
  if (!build) {
    ws.send(JSON.stringify({
      type: 'premium_preview_error',
      buildId,
      error: 'Build not found',
    }));
    return;
  }

  ws.send(JSON.stringify({
    type: 'premium_preview_ready',
    buildId,
    previewUrl: build.previewUrl || null,
    projectPath: build.projectPath,
    status: build.status,
  }));
}

/**
 * Broadcast message to all connections for a build
 */
function broadcastToBuild(buildId: string, message: unknown): void {
  const connections = buildConnections.get(buildId);
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
 * Simulate step execution (placeholder for actual implementation)
 */
async function simulateStep(stepName: string): Promise<void> {
  // Simulate varying execution times based on step complexity
  const baseTime = 100; // ms
  const variability = Math.random() * 200;
  await new Promise(resolve => setTimeout(resolve, baseTime + variability));
}

/**
 * Clean up connections for a build
 */
export function cleanupBuildConnections(buildId: string): void {
  buildConnections.delete(buildId);
}

/**
 * Remove a WebSocket from all build connections
 */
export function removeWebSocketFromBuilds(ws: ServerWebSocket<ChatWebSocketData>): void {
  for (const [_buildId, connections] of buildConnections) {
    connections.delete(ws);
  }
}
