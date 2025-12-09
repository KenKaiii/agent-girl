/**
 * Agent Girl - Autonomous Intelligence System
 * Complete autonomous 24h agent harness with intelligent context management
 *
 * Architecture:
 * - Learning Engine: Self-learning preference DB
 * - Parallel Executor: Worker pool with auto-scaling
 * - Goal Decomposer: Breaks goals into executable steps
 * - Session Manager: Context window management with handoff
 * - Validation Engine: Multi-layer validation with regression testing
 * - Autonomous Harness: 10-step agent protocol for continuous execution
 */

// Types
export * from './types';
export type {
  AppSpec,
  Feature,
  FeatureList,
  SessionProgress,
  HarnessConfig,
  ValidationResult as HarnessValidationResult,
} from './autonomousHarness';
export type {
  SessionContext,
  SessionHandoff,
  SessionManagerConfig,
  ContextFile,
  Decision,
  Artifact,
  SessionError,
} from './sessionManager';
export type {
  ValidationResult,
  ValidationStep,
  ValidationError,
  ValidationType,
  ValidationConfig,
  CustomValidator,
  RegressionTest,
  RegressionStep,
} from './validationEngine';
import type { SiteSpec } from './types';
import type { AppSpec } from './autonomousHarness';

// Core Engines
import { LearningEngine } from './learningEngine';
import { ParallelExecutor } from './parallelExecutor';
import { GoalDecomposer } from './goalDecomposer';
import { ProactiveSuggestionsEngine } from './proactiveSuggestions';
import { SiteGenerator, quickSite, site, type GenerationResult, type QuickSiteOptions } from './siteGenerator';
import { RefactoringAssistant } from './refactoringAssistant';
import { DeployManager } from './deployManager';
import { CICDGenerator } from './cicdGenerator';

// Autonomous Harness Components
import { AutonomousHarness, createAutonomousHarness } from './autonomousHarness';
import { SessionManager, createSessionManager } from './sessionManager';
import { ValidationEngine, createValidationEngine } from './validationEngine';

export {
  // Core Intelligence
  LearningEngine,
  ParallelExecutor,
  GoalDecomposer,
  ProactiveSuggestionsEngine,
  SiteGenerator,
  RefactoringAssistant,
  DeployManager,
  CICDGenerator,
  // Autonomous Harness
  AutonomousHarness,
  SessionManager,
  ValidationEngine,
  // Factories
  createAutonomousHarness,
  createSessionManager,
  createValidationEngine,
  // Site Generator Quick Functions
  quickSite,
  site,
};

// Re-export types
export type { GenerationResult, QuickSiteOptions };

// ============================================================
// UNIFIED INTELLIGENCE FACTORY
// ============================================================

/**
 * Create complete intelligence system for a project
 * Includes all engines + autonomous harness capabilities
 */
export function createIntelligenceSystem(projectPath: string) {
  const sessionManager = createSessionManager(projectPath);
  const validationEngine = createValidationEngine(projectPath);
  const harness = createAutonomousHarness(projectPath);

  return {
    // Core Intelligence
    learning: LearningEngine.getInstance(),
    executor: new ParallelExecutor(),
    goals: new GoalDecomposer({ workingDirectory: projectPath }),
    suggestions: new ProactiveSuggestionsEngine(projectPath),
    refactoring: new RefactoringAssistant(projectPath),
    deploy: new DeployManager(projectPath),
    cicd: new CICDGenerator(projectPath),

    // Site Generator (requires spec)
    createSite: (spec: SiteSpec, outputPath?: string) =>
      new SiteGenerator(spec, outputPath || projectPath),

    // Autonomous Harness
    session: sessionManager,
    validation: validationEngine,
    harness,

    // Quick actions
    async runAutonomous(appSpec: AppSpec, onProgress?: (progress: unknown) => void) {
      await harness.initialize(appSpec);
      return harness.runContinuous(onProgress);
    },

    async validate() {
      return validationEngine.runFullValidation();
    },
  };
}

// ============================================================
// SITE GENERATOR FACTORY
// ============================================================

export function createSiteGenerator(spec: SiteSpec, outputPath: string) {
  return new SiteGenerator(spec, outputPath);
}

// ============================================================
// QUICK START HELPERS
// ============================================================

/**
 * Quick setup for autonomous execution
 */
export async function runAutonomousProject(
  projectPath: string,
  appSpec: AppSpec,
  options?: {
    onProgress?: (progress: unknown) => void;
    validateBefore?: boolean;
  }
): Promise<{
  success: boolean;
  totalSessions: number;
  completedFeatures: number;
  duration: number;
}> {
  const system = createIntelligenceSystem(projectPath);

  // Optional pre-validation
  if (options?.validateBefore) {
    const validation = await system.validate();
    if (!validation.passed) {
      console.warn('Pre-validation failed, proceeding anyway...');
    }
  }

  return system.runAutonomous(appSpec, options?.onProgress);
}
