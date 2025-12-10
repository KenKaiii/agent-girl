/**
 * Premium Builder WebSocket Handler
 * Handles real-time premium build progress, quick edits, and preview updates
 */

import type { ServerWebSocket } from "bun";
import { logger } from "../../utils/core/logger";
import {
  activePremiumBuilds,
  type PremiumBuildState,
} from "../../routes/premium";
import {
  executeEditCommand,
  undo,
  redo,
  PremiumWebsiteExecutor,
  type EditCommand,
  type EditResult,
  type StepProgress,
  type StepError,
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
 * Execute all build steps with progress updates using real Claude SDK
 */
async function executeBuildSteps(
  buildId: string,
  build: PremiumBuildState
): Promise<void> {
  if (!build.plan) {
    throw new Error('No build plan available');
  }

  if (!build.projectPath) {
    throw new Error('No project path set');
  }

  // Create executor with real Claude SDK integration
  const executor = new PremiumWebsiteExecutor(build.plan, {
    projectPath: build.projectPath,
    businessName: build.businessInfo?.name || build.plan.projectId || 'Premium Website',
    model: 'haiku', // Start with fastest model, escalate on errors
    maxRetries: 7,

    // Real-time progress updates via WebSocket
    onProgress: (progress: StepProgress) => {
      build.currentStep = progress.stepId;
      build.currentPhase = progress.phase;

      // Update cost tracking
      if (progress.tokensUsed) {
        build.cost.tokens += progress.tokensUsed;
        build.cost.apiCalls++;
        build.cost.estimatedUSD = build.cost.tokens * 0.00001;
      }

      broadcastToBuild(buildId, {
        type: 'premium_build_progress',
        buildId,
        progress: {
          currentStep: progress.stepId,
          totalSteps: build.totalSteps,
          percentage: progress.percentage,
          currentPhase: progress.phase,
          currentStepName: progress.stepName,
          status: progress.status,
          filesCreated: progress.filesCreated,
        },
        cost: build.cost,
        status: build.status,
      });
    },

    // Error handling with model escalation info
    onError: (error: StepError) => {
      logger.warn('Premium build step error', {
        buildId,
        stepId: error.stepId,
        stepName: error.stepName,
        error: error.error,
        retryCount: error.retryCount,
        escalatedModel: error.escalatedModel,
      });

      broadcastToBuild(buildId, {
        type: 'premium_build_step_error',
        buildId,
        stepId: error.stepId,
        stepName: error.stepName,
        error: error.error,
        retryCount: error.retryCount,
        canRetry: error.canRetry,
        escalatedModel: error.escalatedModel,
      });
    },

    // Build completion
    onComplete: (result) => {
      build.status = result.success ? 'complete' : 'error';
      build.completedAt = new Date();
      build.previewUrl = `http://localhost:4321`;
      build.cost.tokens = result.totalTokens;
      build.cost.estimatedUSD = result.totalCost;

      if (result.success) {
        broadcastToBuild(buildId, {
          type: 'premium_build_complete',
          buildId,
          previewUrl: build.previewUrl,
          projectPath: build.projectPath,
          cost: build.cost,
          filesCreated: result.filesCreated,
          duration: result.duration,
        });

        logger.info('Premium build complete', {
          buildId,
          steps: result.completedSteps,
          totalSteps: result.totalSteps,
          cost: build.cost,
          duration: result.duration,
        });
      } else {
        build.error = `Build failed: ${result.failedSteps} steps failed`;
        broadcastToBuild(buildId, {
          type: 'premium_build_error',
          buildId,
          error: build.error,
          completedSteps: result.completedSteps,
          failedSteps: result.failedSteps,
          errors: result.errors,
        });

        logger.error('Premium build failed', {
          buildId,
          completedSteps: result.completedSteps,
          failedSteps: result.failedSteps,
          errors: result.errors,
        });
      }
    },
  });

  // Execute the plan with real Claude SDK calls
  await executor.execute();
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
