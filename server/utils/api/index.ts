/**
 * Agent Girl - API utilities barrel export
 * Cost tracking, rate limiting, file sync, and content generation
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export { calculateCost, getModelPricing, getSessionBudget, updateSessionBudget, getBudgetSummary, MODEL_PRICING, DEFAULT_BUDGET_CONFIG, AUTONOM_BUDGET_CONFIG } from './costTracker';
export type { TokenUsage, CostEstimate, BudgetConfig, SessionBudget, ModelId } from './costTracker';
export { TokenBucketRateLimiter, wsRateLimiter, expensiveOpLimiter, premiumBuildLimiter, premiumEditLimiter } from './rateLimiter';
export { getAutonomState, clearAutonomState, handleAutonomContinuation, recordStepError, markStepAsProblematic, getStepErrorCount, recordStepCompletion, getAutonomSummary } from './autonomChain';
export type { AutonomState } from './autonomChain';
export { generateNicheSuperprompt, getNicheResearchQueries, getNicheCSSVariables, NICHE_PRESETS } from './nicheSuperprompt';
export type { NicheType, ToneType, NicheContext, NichePreset } from './nicheSuperprompt';
export { detectFramework, getFileType, parseFile, searchReplace } from './fileSync';
export type { Framework, FileType, FrameworkInfo, FileInfo, EditOperation, SearchResult } from './fileSync';
