/**
 * Autonomous Chain Manager - Handles AUTONOM mode step-by-step execution
 * Implements intelligent continuation with budget tracking, step counting, and safety checks
 */

import {
  AUTONOM_BUDGET_CONFIG,
  getSessionBudget,
} from './costTracker';
import type { SessionStreamManager } from '../sessionStreamManager';

export interface AutonomState {
  turnCount: number;
  messagesSentInTurn: number;
  lastStepTimestamp: number;
  stepsCompleted: string[]; // Track what was completed
}

const MAX_STEPS_PER_SESSION = 100;
const SAFETY_MARGIN = 0.90; // Stop at 90% to avoid overage
const SESSION_STEP_TIMEOUT_MS = 15 * 60 * 1000; // 15 min per step max

// Track autonomous state per session
const autonomStates = new Map<string, AutonomState>();

/**
 * Get or initialize autonomous state for a session
 */
export function getAutonomState(sessionId: string): AutonomState {
  let state = autonomStates.get(sessionId);
  if (!state) {
    state = {
      turnCount: 0,
      messagesSentInTurn: 0,
      lastStepTimestamp: Date.now(),
      stepsCompleted: [],
    };
    autonomStates.set(sessionId, state);
  }
  return state;
}

/**
 * Clear autonomous state (cleanup)
 */
export function clearAutonomState(sessionId: string): void {
  autonomStates.delete(sessionId);
}

/**
 * Handle AUTONOM mode continuation after response completion
 */
export async function handleAutonomContinuation(
  sessionId: string,
  sessionStreamManager: SessionStreamManager,
  costTracker: any,
): Promise<boolean> {
  // ✅ FIX #7: Verify subprocess is still alive
  const isStreamActive = sessionStreamManager.hasStream(sessionId);
  if (!isStreamActive) {
    console.warn(
      `⚠️  Cannot continue: SDK subprocess closed for session ${sessionId.substring(0, 8)}`
    );
    sessionStreamManager.safeSend(
      sessionId,
      JSON.stringify({
        type: 'autonom_stream_closed',
        message: 'Autonomous execution stopped: SDK subprocess disconnected',
        sessionId: sessionId,
      })
    );
    clearAutonomState(sessionId);
    return false;
  }

  const autonState = getAutonomState(sessionId);
  autonState.turnCount++;

  // ✅ FIX #6: Add max iterations check
  if (autonState.turnCount > MAX_STEPS_PER_SESSION) {
    console.log(
      `🛑 AUTONOM STOP: Max steps (${MAX_STEPS_PER_SESSION}) reached`
    );
    sessionStreamManager.safeSend(
      sessionId,
      JSON.stringify({
        type: 'autonom_max_steps_reached',
        steps: autonState.turnCount,
        maxSteps: MAX_STEPS_PER_SESSION,
        stepsCompleted: autonState.stepsCompleted,
        sessionId: sessionId,
      })
    );
    clearAutonomState(sessionId);
    sessionStreamManager.abortSession(sessionId);
    return false;
  }

  // ✅ FIX #6b: Check for step timeout
  const timeSinceLastStep = Date.now() - autonState.lastStepTimestamp;
  if (timeSinceLastStep > SESSION_STEP_TIMEOUT_MS) {
    console.log(
      `🛑 AUTONOM STOP: Step timeout (${(timeSinceLastStep / 1000 / 60).toFixed(1)} min)`
    );
    sessionStreamManager.safeSend(
      sessionId,
      JSON.stringify({
        type: 'autonom_step_timeout',
        stepNumber: autonState.turnCount,
        timeoutMs: SESSION_STEP_TIMEOUT_MS,
        elapsedMs: timeSinceLastStep,
        sessionId: sessionId,
      })
    );
    clearAutonomState(sessionId);
    sessionStreamManager.abortSession(sessionId);
    return false;
  }

  const stepNumber = autonState.turnCount;

  // ✅ Get budget with correct config
  const budget = getSessionBudget(sessionId, AUTONOM_BUDGET_CONFIG);
  const totalTokensUsed = budget.totalInputTokens + budget.totalOutputTokens;
  const budgetRemaining = budget.config.maxCostPerSession - budget.totalCost;
  const tokensRemaining = budget.config.maxTokensPerSession - totalTokensUsed;
  const budgetPercentUsed = budget.totalCost / budget.config.maxCostPerSession;

  // ✅ FIX #2: Add 90% safety margin
  const isBudgetCritical = budgetPercentUsed >= SAFETY_MARGIN;

  // ✅ FIX #1: Use > instead of >= for precision
  const budgetExhausted =
    budget.totalCost > budget.config.maxCostPerSession ||
    totalTokensUsed > budget.config.maxTokensPerSession;

  if (budgetExhausted || isBudgetCritical) {
    const reason = budgetExhausted ? 'exhausted' : 'critical';
    console.log(
      `🛑 AUTONOM STOP: Budget ${reason} (${(budgetPercentUsed * 100).toFixed(1)}% used)`
    );

    // ✅ FIX #3: Gracefully shutdown subprocess
    sessionStreamManager.abortSession(sessionId);
    clearAutonomState(sessionId);

    sessionStreamManager.safeSend(
      sessionId,
      JSON.stringify({
        type: 'autonom_budget_critical',
        percentUsed: (budgetPercentUsed * 100).toFixed(1),
        totalCost: budget.totalCost.toFixed(4),
        maxCost: budget.config.maxCostPerSession,
        tokensUsed: totalTokensUsed,
        maxTokens: budget.config.maxTokensPerSession,
        reason: reason,
        stepsCompleted: autonState.stepsCompleted,
        sessionId: sessionId,
      })
    );
    return false;
  }

  // ✅ FIX #5: Better step number calculation
  const contextSummary =
    stepNumber > 1
      ? `You have completed ${stepNumber - 1} step${stepNumber !== 2 ? 's' : ''}. Continue with step ${stepNumber}.`
      : `Beginning autonomous execution of step ${stepNumber}.`;

  const continuationPrompt = `
[AUTONOM MODE - STEP ${stepNumber}/${MAX_STEPS_PER_SESSION}]

${contextSummary}

**YOUR TASK FOR THIS STEP:**
1. **PLAN**: Decide the next action based on previous progress
2. **EXECUTE**: Implement the action (code, files, commands, etc.)
3. **VALIDATE**: Confirm success (tests pass, no errors, etc.)
4. **SELF-CHECK**:
   - Does output match requirements?
   - Are there edge cases to handle?
   - Is there cleanup needed?
5. **REPORT**: Explain what you did and why

**BUDGET REMAINING:**
💰 Cost: $${budgetRemaining.toFixed(2)}/$${budget.config.maxCostPerSession} | Tokens: ${tokensRemaining.toLocaleString()}/${budget.config.maxTokensPerSession.toLocaleString()} (${(budgetPercentUsed * 100).toFixed(1)}% used)

⏱️ Progress: ${stepNumber}/${MAX_STEPS_PER_SESSION}

Proceed with step ${stepNumber}. Work efficiently and report your progress.`;

  // ✅ Send progress update to client before continuation
  sessionStreamManager.safeSend(
    sessionId,
    JSON.stringify({
      type: 'autonom_progress',
      stepNumber: stepNumber,
      maxSteps: MAX_STEPS_PER_SESSION,
      budgetUsed: budgetPercentUsed,
      budgetRemaining: budgetRemaining.toFixed(2),
      tokensRemaining: tokensRemaining,
      totalCost: budget.totalCost.toFixed(4),
      maxCost: budget.config.maxCostPerSession,
      sessionId: sessionId,
      stepsCompleted: autonState.stepsCompleted,
    })
  );

  // ✅ FIX #8: Add error handling for message send
  try {
    sessionStreamManager.sendMessage(sessionId, continuationPrompt);

    autonState.lastStepTimestamp = Date.now();
    autonState.messagesSentInTurn++;

    console.log(
      `🔄 AUTONOM STEP ${stepNumber}: Auto-chaining (${stepNumber}/${MAX_STEPS_PER_SESSION})`
    );
    console.log(
      `💰 Budget: ${(budgetPercentUsed * 100).toFixed(1)}% used (${tokensRemaining.toLocaleString()} tokens remaining)`
    );
    console.log(`✅ Continuation message sent successfully`);

    return true;
  } catch (error) {
    console.error(
      `❌ Failed to send continuation for step ${stepNumber}:`,
      error
    );

    // ✅ Cleanup on failure
    clearAutonomState(sessionId);
    sessionStreamManager.abortSession(sessionId);

    sessionStreamManager.safeSend(
      sessionId,
      JSON.stringify({
        type: 'autonom_error',
        message: `Failed to continue autonomous execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        step: stepNumber,
        stepsCompleted: autonState.stepsCompleted,
        sessionId: sessionId,
      })
    );

    return false;
  }
}

/**
 * Record a step completion
 */
export function recordStepCompletion(
  sessionId: string,
  stepDescription: string
): void {
  const state = getAutonomState(sessionId);
  state.stepsCompleted.push(`Step ${state.turnCount}: ${stepDescription}`);
}

/**
 * Get autonomous session summary
 */
export function getAutonomSummary(sessionId: string): {
  stepCount: number;
  stepsCompleted: string[];
  elapsedTime: number;
} {
  const state = getAutonomState(sessionId);
  const elapsedTime = Date.now() - state.lastStepTimestamp;
  return {
    stepCount: state.turnCount,
    stepsCompleted: state.stepsCompleted,
    elapsedTime,
  };
}
