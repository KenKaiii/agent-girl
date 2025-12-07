/**
 * Cost Tracking Utility for AUTONOM MODE
 * Implements token counting, cost estimation, and budget management
 * to prevent overspending during autonomous execution
 */

// Model pricing (per 1M tokens) - December 2025 prices
export const MODEL_PRICING = {
  'claude-opus-4-5-20251101': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
} as const;

export type ModelId = keyof typeof MODEL_PRICING;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
  usage: TokenUsage;
}

export interface BudgetConfig {
  maxCostPerSession: number;      // Max $ per session
  maxCostPerMessage: number;      // Max $ per message
  maxTokensPerSession: number;    // Max tokens per session
  warnThreshold: number;          // % of budget to warn at (0-1)
}

export interface SessionBudget {
  sessionId: string;
  config: BudgetConfig;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  messageCount: number;
  startedAt: Date;
  lastUpdatedAt: Date;
  warnings: string[];
  isExceeded: boolean;
}

// Default budget configuration
export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  maxCostPerSession: 10.0,       // $10 max per session
  maxCostPerMessage: 2.0,        // $2 max per message
  maxTokensPerSession: 500000,   // 500k tokens max
  warnThreshold: 0.75,           // Warn at 75%
};

// Aggressive budget for autonom mode (higher limits for 100-step workflows)
export const AUTONOM_BUDGET_CONFIG: BudgetConfig = {
  maxCostPerSession: 50.0,       // $50 max for full autonomous run
  maxCostPerMessage: 5.0,        // $5 max per message (complex tasks)
  maxTokensPerSession: 2000000,  // 2M tokens for massive tasks
  warnThreshold: 0.50,           // Warn at 50% (earlier warning)
};

// In-memory session budget tracking
const sessionBudgets = new Map<string, SessionBudget>();

/**
 * Get pricing for a model
 */
export function getModelPricing(modelId: string): { input: number; output: number } {
  // Find exact match or closest match
  const exactMatch = MODEL_PRICING[modelId as ModelId];
  if (exactMatch) return exactMatch;

  // Find partial match
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelId.includes(key) || key.includes(modelId)) {
      return pricing;
    }
  }

  // Default to Sonnet pricing if unknown
  return MODEL_PRICING['claude-3-5-sonnet-20241022'];
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(modelId: string, usage: TokenUsage): CostEstimate {
  const pricing = getModelPricing(modelId);

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    model: modelId,
    usage,
  };
}

/**
 * Initialize or get session budget tracker
 */
export function getSessionBudget(
  sessionId: string,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG
): SessionBudget {
  let budget = sessionBudgets.get(sessionId);

  if (!budget) {
    budget = {
      sessionId,
      config,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      messageCount: 0,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      warnings: [],
      isExceeded: false,
    };
    sessionBudgets.set(sessionId, budget);
  }

  return budget;
}

/**
 * Update session budget with new usage
 */
export function updateSessionBudget(
  sessionId: string,
  usage: TokenUsage,
  modelId: string
): { allowed: boolean; warning?: string; budget: SessionBudget } {
  const budget = getSessionBudget(sessionId);
  const cost = calculateCost(modelId, usage);

  // Check per-message limit
  if (cost.totalCost > budget.config.maxCostPerMessage) {
    return {
      allowed: false,
      warning: `Message cost $${cost.totalCost.toFixed(4)} exceeds limit $${budget.config.maxCostPerMessage}`,
      budget,
    };
  }

  // Update totals
  budget.totalInputTokens += usage.inputTokens;
  budget.totalOutputTokens += usage.outputTokens;
  budget.totalCost += cost.totalCost;
  budget.messageCount += 1;
  budget.lastUpdatedAt = new Date();

  // Check token limit
  const totalTokens = budget.totalInputTokens + budget.totalOutputTokens;
  if (totalTokens > budget.config.maxTokensPerSession) {
    budget.isExceeded = true;
    return {
      allowed: false,
      warning: `Token limit exceeded: ${totalTokens.toLocaleString()} > ${budget.config.maxTokensPerSession.toLocaleString()}`,
      budget,
    };
  }

  // Check cost limit
  if (budget.totalCost > budget.config.maxCostPerSession) {
    budget.isExceeded = true;
    return {
      allowed: false,
      warning: `Cost limit exceeded: $${budget.totalCost.toFixed(4)} > $${budget.config.maxCostPerSession}`,
      budget,
    };
  }

  // Check warning threshold
  const costRatio = budget.totalCost / budget.config.maxCostPerSession;
  const tokenRatio = totalTokens / budget.config.maxTokensPerSession;
  const maxRatio = Math.max(costRatio, tokenRatio);

  let warning: string | undefined;
  if (maxRatio >= budget.config.warnThreshold) {
    warning = `Budget usage at ${(maxRatio * 100).toFixed(0)}%: $${budget.totalCost.toFixed(4)}/${budget.config.maxCostPerSession}, ${totalTokens.toLocaleString()}/${budget.config.maxTokensPerSession.toLocaleString()} tokens`;
    if (!budget.warnings.includes(warning)) {
      budget.warnings.push(warning);
    }
  }

  return { allowed: true, warning, budget };
}

/**
 * Get budget summary for display
 */
export function getBudgetSummary(sessionId: string): string {
  const budget = sessionBudgets.get(sessionId);
  if (!budget) {
    return 'No budget tracking for this session';
  }

  const totalTokens = budget.totalInputTokens + budget.totalOutputTokens;
  const costRatio = budget.totalCost / budget.config.maxCostPerSession;
  const tokenRatio = totalTokens / budget.config.maxTokensPerSession;

  return `
Budget Status:
  Messages: ${budget.messageCount}
  Tokens: ${totalTokens.toLocaleString()} / ${budget.config.maxTokensPerSession.toLocaleString()} (${(tokenRatio * 100).toFixed(1)}%)
  Cost: $${budget.totalCost.toFixed(4)} / $${budget.config.maxCostPerSession} (${(costRatio * 100).toFixed(1)}%)
  Duration: ${Math.round((Date.now() - budget.startedAt.getTime()) / 1000)}s
  Status: ${budget.isExceeded ? 'EXCEEDED' : 'OK'}
`.trim();
}

/**
 * Estimate tokens from text (rough approximation)
 * Claude uses ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost before making API call
 */
export function estimateCostBeforeCall(
  prompt: string,
  modelId: string,
  expectedOutputRatio: number = 2 // Assume output is 2x input by default
): { estimatedCost: number; estimatedTokens: number } {
  const inputTokens = estimateTokens(prompt);
  const outputTokens = Math.ceil(inputTokens * expectedOutputRatio);
  const cost = calculateCost(modelId, { inputTokens, outputTokens });

  return {
    estimatedCost: cost.totalCost,
    estimatedTokens: inputTokens + outputTokens,
  };
}

/**
 * Check if budget allows for estimated call
 */
export function canAffordCall(
  sessionId: string,
  prompt: string,
  modelId: string,
  expectedOutputRatio: number = 2
): { allowed: boolean; reason?: string } {
  const budget = getSessionBudget(sessionId);
  const estimate = estimateCostBeforeCall(prompt, modelId, expectedOutputRatio);

  // Check if adding this call would exceed limits
  const projectedCost = budget.totalCost + estimate.estimatedCost;
  const projectedTokens = budget.totalInputTokens + budget.totalOutputTokens + estimate.estimatedTokens;

  if (projectedCost > budget.config.maxCostPerSession) {
    return {
      allowed: false,
      reason: `Projected cost $${projectedCost.toFixed(4)} would exceed limit $${budget.config.maxCostPerSession}`,
    };
  }

  if (projectedTokens > budget.config.maxTokensPerSession) {
    return {
      allowed: false,
      reason: `Projected tokens ${projectedTokens.toLocaleString()} would exceed limit ${budget.config.maxTokensPerSession.toLocaleString()}`,
    };
  }

  return { allowed: true };
}

/**
 * Reset session budget (for new autonomous run)
 */
export function resetSessionBudget(sessionId: string, config?: BudgetConfig): void {
  sessionBudgets.delete(sessionId);
  if (config) {
    getSessionBudget(sessionId, config);
  }
}

/**
 * Get efficiency metrics for a session
 */
export function getEfficiencyMetrics(sessionId: string): {
  tokensPerMessage: number;
  costPerMessage: number;
  inputOutputRatio: number;
  efficiency: 'high' | 'medium' | 'low';
} {
  const budget = sessionBudgets.get(sessionId);
  if (!budget || budget.messageCount === 0) {
    return {
      tokensPerMessage: 0,
      costPerMessage: 0,
      inputOutputRatio: 0,
      efficiency: 'high',
    };
  }

  const tokensPerMessage = (budget.totalInputTokens + budget.totalOutputTokens) / budget.messageCount;
  const costPerMessage = budget.totalCost / budget.messageCount;
  const inputOutputRatio = budget.totalInputTokens > 0
    ? budget.totalOutputTokens / budget.totalInputTokens
    : 0;

  // Efficiency rating based on cost per message
  let efficiency: 'high' | 'medium' | 'low';
  if (costPerMessage < 0.05) efficiency = 'high';
  else if (costPerMessage < 0.20) efficiency = 'medium';
  else efficiency = 'low';

  return {
    tokensPerMessage,
    costPerMessage,
    inputOutputRatio,
    efficiency,
  };
}

export default {
  MODEL_PRICING,
  DEFAULT_BUDGET_CONFIG,
  AUTONOM_BUDGET_CONFIG,
  getModelPricing,
  calculateCost,
  getSessionBudget,
  updateSessionBudget,
  getBudgetSummary,
  estimateTokens,
  estimateCostBeforeCall,
  canAffordCall,
  resetSessionBudget,
  getEfficiencyMetrics,
};
