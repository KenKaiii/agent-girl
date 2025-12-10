/**
 * Agent Girl - Unified Autonomous Intelligence System Types
 * Self-learning, self-planning, multi-iterative execution
 */

// ============================================================
// LEARNING ENGINE TYPES
// ============================================================

export interface UserPreference {
  id: string;
  pattern: string;           // What triggered this learning
  category: PreferenceCategory;
  preference: string;        // What the user prefers
  antiPreference?: string;   // What to avoid
  confidence: number;        // 0-1, increases with reinforcement
  reinforcements: number;    // Times this was confirmed
  lastUsed: number;          // Timestamp
  context?: string[];        // When to apply (e.g., ["react", "typescript"])
}

export type PreferenceCategory =
  | 'code_style'        // Formatting, naming, patterns
  | 'architecture'      // File structure, patterns
  | 'tooling'           // Libraries, frameworks
  | 'workflow'          // Git, deploy, test
  | 'communication'     // Response style, verbosity
  | 'performance'       // Optimization preferences
  | 'security';         // Security patterns

export interface LearningEvent {
  type: 'correction' | 'approval' | 'rejection' | 'explicit';
  original: string;
  corrected?: string;
  context: ExecutionContext;
  timestamp: number;
}

// ============================================================
// GOAL DECOMPOSITION TYPES
// ============================================================

export interface Goal {
  id: string;
  description: string;
  type: GoalType;
  complexity: 'trivial' | 'simple' | 'medium' | 'complex' | 'epic';
  estimatedSteps: number;
  constraints: Constraint[];
  successCriteria: SuccessCriterion[];
  subgoals?: Goal[];
  dependencies?: string[];   // Goal IDs this depends on
  parallelizable: boolean;
}

export type GoalType =
  | 'build'           // Create something new
  | 'modify'          // Change existing
  | 'fix'             // Debug/repair
  | 'optimize'        // Improve performance
  | 'research'        // Find information
  | 'deploy'          // Ship to production
  | 'test'            // Verify functionality
  | 'document';       // Create docs

export interface Constraint {
  type: 'budget' | 'time' | 'technology' | 'compatibility' | 'security';
  value: string | number;
  hard: boolean;      // Hard = must satisfy, Soft = try to satisfy
}

export interface SuccessCriterion {
  description: string;
  validator: ValidatorType;
  expected: string | number | boolean;
  weight: number;     // Importance 0-1
}

export type ValidatorType =
  | 'file_exists'
  | 'test_passes'
  | 'type_check'
  | 'lint_clean'
  | 'builds'
  | 'deploys'
  | 'contains_pattern'
  | 'performance_threshold'
  | 'custom';

// ============================================================
// EXECUTION TYPES
// ============================================================

export interface ExecutionPlan {
  id: string;
  goal: Goal | string;        // Can be full Goal object or simple description
  phases: ExecutionPhase[];
  estimatedCost?: number;
  estimatedTime?: number;
  estimatedDuration?: number; // Alias for estimatedTime
  modelStrategy?: ModelStrategy;
  checkpoints: number[];      // Step/phase indices to checkpoint at
  rollbackPoints?: string[];  // Git commits to rollback to
}

export interface ExecutionPhase {
  id?: string;
  name: string;
  steps: ExecutionStep[];
  parallel: boolean;
  dependsOn?: string[];
  timeout: number;
}

export interface ExecutionStep {
  id: string;
  action: ActionType | string;
  params: Record<string, unknown>;
  expectedOutcome?: string;
  fallbackStrategy?: FallbackStrategy;
  maxRetries: number;
  model: 'opus' | 'sonnet' | 'haiku' | 'auto';
}

export type ActionType =
  | 'analyze'
  | 'plan'
  | 'read_file'
  | 'write_file'
  | 'edit_file'
  | 'run_command'
  | 'search_code'
  | 'search_web'
  | 'generate_content'
  | 'validate'
  | 'deploy'
  | 'test'
  | 'git_commit'
  | 'spawn_agent'
  | 'wait_parallel';

export interface FallbackStrategy {
  type: 'retry' | 'simplify' | 'escalate' | 'skip' | 'human' | 'alternative';
  maxAttempts?: number;
  backoffMs?: number;
  alternatives?: ExecutionStep[];
}

export interface ModelStrategy {
  planning: 'opus' | 'sonnet';
  execution: 'sonnet' | 'haiku';
  validation: 'sonnet' | 'haiku';
  errorRecovery: 'opus' | 'sonnet';
  escalationThreshold: number;  // Errors before escalating model
}

export interface ExecutionContext {
  workingDirectory: string;
  projectType?: string;
  framework?: string;
  language?: string;
  dependencies?: string[];
  gitBranch?: string;
  environment?: 'development' | 'staging' | 'production';
}

export interface ExecutionState {
  planId: string;
  currentPhase: number;
  currentStep: number;
  completedSteps: string[];
  failedSteps: string[];
  retryCount: Map<string, number>;
  tokensUsed: number;
  costUsd: number;
  startTime: number;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  stepId: string;
  timestamp: number;
  gitCommit?: string;
  state: Record<string, unknown>;
}

// ============================================================
// WORKER POOL TYPES
// ============================================================

export interface WorkerTask {
  id: string;
  type: ActionType;
  params: Record<string, unknown>;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number;
  retries: number;
  dependsOn?: string[];
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
  tokensUsed: number;
}

export interface WorkerPoolConfig {
  maxWorkers: number;
  minWorkers: number;
  taskTimeout: number;
  idleTimeout: number;
  scaleUpThreshold: number;   // Queue size to trigger scale up
  scaleDownThreshold: number; // Idle workers to trigger scale down
}

// ============================================================
// PROACTIVE SUGGESTIONS TYPES
// ============================================================

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  effort: 'trivial' | 'easy' | 'medium' | 'hard';
  autoFixable: boolean;
  fix?: ExecutionPlan;
  context: string[];
  confidence: number;
}

export type SuggestionType =
  | 'missing_tests'
  | 'outdated_deps'
  | 'security_issue'
  | 'performance'
  | 'code_smell'
  | 'missing_types'
  | 'dead_code'
  | 'duplicate_code'
  | 'missing_error_handling'
  | 'accessibility'
  | 'seo';

export interface ProjectAnalysis {
  files: FileAnalysis[];
  dependencies: DependencyAnalysis;
  codeQuality: CodeQualityMetrics;
  suggestions: Suggestion[];
  timestamp: number;
}

export interface FileAnalysis {
  path: string;
  lines: number;
  complexity: number;
  imports: string[];
  exports: string[];
  issues: string[];
}

export interface DependencyAnalysis {
  total: number;
  outdated: number;
  vulnerable: number;
  unused: number;
  updates: Array<{
    name: string;
    current: string;
    latest: string;
    breaking: boolean;
  }>;
}

export interface CodeQualityMetrics {
  testCoverage: number;
  typesCoverage: number;
  lintScore: number;
  duplicateLines: number;
  avgComplexity: number;
}

// ============================================================
// DEPLOY TYPES
// ============================================================

export type DeployProvider =
  | 'vercel'
  | 'netlify'
  | 'cloudflare'
  | 'hetzner'
  | 'coolify';

// Alias for compatibility
export type DeployTarget = DeployProvider;

export interface DeployConfig {
  provider: DeployProvider;
  projectName?: string;
  framework?: string;
  buildCommand?: string;
  outputDir?: string;
  envVars?: Record<string, string>;
  domain?: string;
  region?: string;
  email?: string;
  production?: boolean;
}

export interface DeployResult {
  success: boolean;
  provider: DeployProvider;
  url?: string;
  previewUrl?: string;
  buildTime?: number;
  logs?: string;
  error?: string;
}

// ============================================================
// SITE GENERATION TYPES
// ============================================================

export interface SiteSpec {
  name: string;
  type: 'landing' | 'portfolio' | 'blog' | 'docs' | 'shop' | 'saas';
  pages: PageSpec[];
  design: DesignSpec;
  content: ContentSpec;
  features: string[];
  seo: SEOSpec;
}

export interface PageSpec {
  slug: string;
  title: string;
  sections: SectionSpec[];
  meta?: Record<string, string>;
}

export interface SectionSpec {
  type: string;
  variant?: string;
  content?: Record<string, unknown>;
  order: number;
}

export interface DesignSpec {
  preset: 'modern' | 'minimal' | 'corporate' | 'playful' | 'premium';
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
}

export interface ContentSpec {
  source: 'generate' | 'upload' | 'url' | 'partial';
  businessInfo?: Record<string, string>;
  uploadedFiles?: string[];
  sourceUrl?: string;
}

export interface SEOSpec {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  keywords: string[];
  ogImage?: string;
  schema: SchemaType[];
}

export type SchemaType =
  | 'Organization'
  | 'LocalBusiness'
  | 'Person'
  | 'Product'
  | 'Article'
  | 'FAQ'
  | 'BreadcrumbList';

// ============================================================
// CI/CD TYPES
// ============================================================

export type CICDProvider = 'github' | 'gitlab' | 'bitbucket';

export interface CICDConfig {
  provider: CICDProvider;
  projectName?: string;
  triggers?: {
    push?: string[];
    pull_request?: string[];
    schedule?: string[];
  };
  stages?: Array<{
    name: 'lint' | 'test' | 'build' | 'deploy' | 'release';
    enabled: boolean;
  }>;
  caching?: boolean;
  artifacts?: boolean;
  secrets?: string[];
  notifications?: NotificationConfig;
}

export interface CICDTrigger {
  event: 'push' | 'pull_request' | 'tag' | 'schedule' | 'manual';
  branches?: string[];
  paths?: string[];
  cron?: string;
}

export interface CICDStage {
  name: string;
  jobs: CICDJob[];
  dependsOn?: string[];
}

export interface CICDJob {
  name: string;
  runner: string;
  steps: CICDStep[];
  env?: Record<string, string>;
  timeout?: number;
  continueOnError?: boolean;
}

export interface CICDStep {
  name: string;
  run?: string;
  uses?: string;
  with?: Record<string, string>;
  if?: string;
}

export interface NotificationConfig {
  slack?: string;
  discord?: string;
  email?: string[];
}
