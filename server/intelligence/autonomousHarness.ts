/**
 * Agent Girl - Autonomous 24h Agent Harness
 * Based on Anthropic's agent harness pattern + Cole Medin's Linear integration
 *
 * Core Concept: Controlled context resets with intelligent handoff
 * - Each agent session has limited context (~100k tokens)
 * - Progress is persisted externally (progress.json + git commits)
 * - Validation loop ensures no regression
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { ExecutionPlan, ExecutionState, Goal } from './types';

// ============================================================
// TYPES
// ============================================================

export interface AppSpec {
  name: string;
  description: string;
  coreFeatures: string[];
  techStack: {
    backend?: string;
    frontend?: string;
    database?: string;
    auth?: string;
    hosting?: string;
  };
  successCriteria: string[];
  constraints?: string[];
}

export interface Feature {
  id: number;
  name: string;
  description: string;
  category: 'setup' | 'backend' | 'frontend' | 'integration' | 'testing' | 'deploy';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedComplexity: 'trivial' | 'simple' | 'medium' | 'complex';
  validationSteps: string[];
  dependencies: number[];
  passes: boolean;
  attempts: number;
  lastError?: string;
  completedAt?: number;
  gitCommit?: string;
}

export interface FeatureList {
  appSpec: AppSpec;
  features: Feature[];
  createdAt: number;
  lastUpdated: number;
  totalFeatures: number;
  completedFeatures: number;
  currentFeatureId: number | null;
}

export interface SessionProgress {
  sessionId: string;
  sessionNumber: number;
  startedAt: number;
  endedAt?: number;

  // What was done
  completedFeatures: number[];
  attemptedFeatures: number[];
  regressionsPassed: number[];
  regressionsFailed: number[];

  // Current state
  appState: {
    backendRunning: boolean;
    frontendRunning: boolean;
    databaseInitialized: boolean;
    lastHealthCheck?: number;
  };

  // For next session
  summary: string;
  currentState: string;
  nextSuggestedTask: string;
  knownIssues: string[];

  // Git
  commits: Array<{
    sha: string;
    message: string;
    timestamp: number;
    featureId?: number;
  }>;
}

export interface HarnessConfig {
  projectPath: string;
  maxSessionTokens: number;
  maxRetries: number;
  regressionTestCount: number;
  autoCommit: boolean;
  validationTimeout: number;
  pauseBetweenSessions: number;
}

export interface ValidationResult {
  featureId: number;
  passed: boolean;
  steps: Array<{
    description: string;
    passed: boolean;
    error?: string;
    duration: number;
  }>;
  totalDuration: number;
}

// ============================================================
// AUTONOMOUS HARNESS
// ============================================================

export class AutonomousHarness {
  private config: HarnessConfig;
  private featureList: FeatureList | null = null;
  private currentProgress: SessionProgress | null = null;
  private sessionCount = 0;
  private running = false;

  constructor(config: Partial<HarnessConfig> & { projectPath: string }) {
    this.config = {
      projectPath: config.projectPath,
      maxSessionTokens: config.maxSessionTokens ?? 100000,
      maxRetries: config.maxRetries ?? 3,
      regressionTestCount: config.regressionTestCount ?? 2,
      autoCommit: config.autoCommit ?? true,
      validationTimeout: config.validationTimeout ?? 30000,
      pauseBetweenSessions: config.pauseBetweenSessions ?? 5000,
    };
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize harness from app spec
   */
  async initialize(appSpec: AppSpec): Promise<FeatureList> {
    // Create project structure
    await this.ensureDirectories();

    // Generate feature list from spec
    const features = this.generateFeatureList(appSpec);

    this.featureList = {
      appSpec,
      features,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      totalFeatures: features.length,
      completedFeatures: 0,
      currentFeatureId: null,
    };

    // Persist
    await this.saveFeatureList();

    // Initialize git if needed
    await this.initGit();

    return this.featureList;
  }

  /**
   * Resume from existing progress
   */
  async resume(): Promise<{ featureList: FeatureList; progress: SessionProgress | null }> {
    await this.loadFeatureList();
    await this.loadLatestProgress();

    if (!this.featureList) {
      throw new Error('No feature list found. Run initialize() first.');
    }

    return {
      featureList: this.featureList,
      progress: this.currentProgress,
    };
  }

  // ============================================================
  // FEATURE LIST GENERATION
  // ============================================================

  /**
   * Generate granular feature list from app spec
   * Key insight: 50 granular tasks > 10 vague tasks
   */
  private generateFeatureList(spec: AppSpec): Feature[] {
    const features: Feature[] = [];
    let id = 1;

    // Phase 1: Setup (Critical - must complete first)
    features.push({
      id: id++,
      name: 'Initialize project structure',
      description: `Create ${spec.techStack.frontend || 'frontend'} + ${spec.techStack.backend || 'backend'} scaffolding`,
      category: 'setup',
      priority: 'critical',
      estimatedComplexity: 'simple',
      validationSteps: ['package.json exists', 'node_modules installed', 'dev server starts'],
      dependencies: [],
      passes: false,
      attempts: 0,
    });

    if (spec.techStack.database) {
      features.push({
        id: id++,
        name: 'Setup database',
        description: `Initialize ${spec.techStack.database} with migrations`,
        category: 'setup',
        priority: 'critical',
        estimatedComplexity: 'simple',
        validationSteps: ['Database file/connection exists', 'Migrations run successfully'],
        dependencies: [1],
        passes: false,
        attempts: 0,
      });
    }

    features.push({
      id: id++,
      name: 'Create init script',
      description: 'Create init_script.sh to start all services',
      category: 'setup',
      priority: 'critical',
      estimatedComplexity: 'trivial',
      validationSteps: ['init_script.sh exists', 'Script is executable', 'Services start correctly'],
      dependencies: [1],
      passes: false,
      attempts: 0,
    });

    // Phase 2: Backend features
    const backendId = id;
    features.push({
      id: id++,
      name: 'Backend health endpoint',
      description: 'GET /health returns 200 with status',
      category: 'backend',
      priority: 'critical',
      estimatedComplexity: 'trivial',
      validationSteps: ['GET /health returns 200', 'Response includes uptime'],
      dependencies: [1],
      passes: false,
      attempts: 0,
    });

    // Generate backend features from core features
    for (const feature of spec.coreFeatures) {
      const featureName = feature.toLowerCase();

      // API endpoint
      features.push({
        id: id++,
        name: `API: ${feature}`,
        description: `Implement backend API for ${feature}`,
        category: 'backend',
        priority: 'high',
        estimatedComplexity: 'medium',
        validationSteps: [
          `API endpoint responds`,
          `CRUD operations work`,
          `Error handling in place`,
        ],
        dependencies: [backendId],
        passes: false,
        attempts: 0,
      });

      // Frontend component
      features.push({
        id: id++,
        name: `UI: ${feature}`,
        description: `Create frontend interface for ${feature}`,
        category: 'frontend',
        priority: 'high',
        estimatedComplexity: 'medium',
        validationSteps: [
          `Component renders`,
          `User interactions work`,
          `Data displays correctly`,
        ],
        dependencies: [id - 1], // Depends on API
        passes: false,
        attempts: 0,
      });
    }

    // Phase 3: Integration
    if (spec.techStack.auth) {
      features.push({
        id: id++,
        name: 'Authentication system',
        description: `Implement ${spec.techStack.auth} authentication`,
        category: 'integration',
        priority: 'high',
        estimatedComplexity: 'complex',
        validationSteps: [
          'Login endpoint works',
          'Protected routes require auth',
          'Token refresh works',
        ],
        dependencies: [backendId],
        passes: false,
        attempts: 0,
      });
    }

    // Phase 4: Testing
    features.push({
      id: id++,
      name: 'Unit tests',
      description: 'Add unit tests for core functionality',
      category: 'testing',
      priority: 'medium',
      estimatedComplexity: 'medium',
      validationSteps: ['Tests exist', 'Tests pass', 'Coverage > 60%'],
      dependencies: [], // Can run anytime
      passes: false,
      attempts: 0,
    });

    features.push({
      id: id++,
      name: 'E2E tests',
      description: 'Add end-to-end tests with Playwright/Puppeteer',
      category: 'testing',
      priority: 'medium',
      estimatedComplexity: 'medium',
      validationSteps: ['E2E tests exist', 'Critical paths covered', 'Tests pass'],
      dependencies: [],
      passes: false,
      attempts: 0,
    });

    // Phase 5: Polish from success criteria
    for (const criterion of spec.successCriteria) {
      features.push({
        id: id++,
        name: `Success: ${criterion.slice(0, 50)}`,
        description: criterion,
        category: 'integration',
        priority: 'medium',
        estimatedComplexity: 'simple',
        validationSteps: [criterion],
        dependencies: [],
        passes: false,
        attempts: 0,
      });
    }

    // Phase 6: Deploy
    if (spec.techStack.hosting) {
      features.push({
        id: id++,
        name: 'Production deployment',
        description: `Deploy to ${spec.techStack.hosting}`,
        category: 'deploy',
        priority: 'low',
        estimatedComplexity: 'medium',
        validationSteps: [
          'Build succeeds',
          'Deploy completes',
          'Production URL accessible',
        ],
        dependencies: [], // Should be last
        passes: false,
        attempts: 0,
      });
    }

    return features;
  }

  // ============================================================
  // 10-STEP AGENT PROTOCOL
  // ============================================================

  /**
   * Execute single agent session following 10-step protocol
   */
  async executeSession(): Promise<SessionProgress> {
    if (!this.featureList) {
      throw new Error('No feature list. Run initialize() or resume() first.');
    }

    this.sessionCount++;
    const sessionId = `session_${Date.now()}_${this.sessionCount}`;

    const progress: SessionProgress = {
      sessionId,
      sessionNumber: this.sessionCount,
      startedAt: Date.now(),
      completedFeatures: [],
      attemptedFeatures: [],
      regressionsPassed: [],
      regressionsFailed: [],
      appState: {
        backendRunning: false,
        frontendRunning: false,
        databaseInitialized: false,
      },
      summary: '',
      currentState: '',
      nextSuggestedTask: '',
      knownIssues: [],
      commits: [],
    };

    try {
      // Step 1: Get Bearings
      await this.getBearings(progress);

      // Step 2: Start App
      await this.startApp(progress);

      // Step 3: Regression Test
      await this.regressionTest(progress);

      // Step 4: Pick Task
      const feature = this.pickNextTask();
      if (!feature) {
        progress.summary = 'All features completed!';
        return progress;
      }

      this.featureList.currentFeatureId = feature.id;
      progress.attemptedFeatures.push(feature.id);

      // Step 5: Implement (this is where Claude Code would do the work)
      const implementationPlan = this.generateImplementationPlan(feature);

      // Step 6: Validate
      const validation = await this.validateFeature(feature);

      // Step 7: Mark Done
      if (validation.passed) {
        feature.passes = true;
        feature.completedAt = Date.now();
        this.featureList.completedFeatures++;
        progress.completedFeatures.push(feature.id);
      } else {
        feature.attempts++;
        feature.lastError = validation.steps.find(s => !s.passed)?.error;
        progress.knownIssues.push(`Feature ${feature.id}: ${feature.lastError}`);
      }

      // Step 8: Git Commit
      if (this.config.autoCommit && validation.passed) {
        const commit = await this.gitCommit(feature);
        if (commit) {
          feature.gitCommit = commit.sha;
          progress.commits.push(commit);
        }
      }

      // Step 9: Update Progress
      progress.endedAt = Date.now();
      progress.summary = this.generateSessionSummary(progress);
      progress.currentState = this.generateCurrentState();
      progress.nextSuggestedTask = this.suggestNextTask();

      await this.saveProgress(progress);
      await this.saveFeatureList();

      // Step 10: Exit (return for orchestrator to spawn next session)
      return progress;

    } catch (error) {
      progress.endedAt = Date.now();
      progress.knownIssues.push(error instanceof Error ? error.message : String(error));
      await this.saveProgress(progress);
      throw error;
    }
  }

  // ============================================================
  // PROTOCOL STEPS
  // ============================================================

  /**
   * Step 1: Get Bearings - Read progress, git log, understand state
   */
  private async getBearings(progress: SessionProgress): Promise<void> {
    // Load previous progress
    await this.loadLatestProgress();

    // Check git status
    const gitLog = await this.getGitLog(5);

    // Update progress with context
    if (this.currentProgress) {
      progress.appState = { ...this.currentProgress.appState };
    }
  }

  /**
   * Step 2: Start App - Run init_script.sh
   */
  private async startApp(progress: SessionProgress): Promise<void> {
    const initScript = join(this.config.projectPath, 'init_script.sh');

    if (existsSync(initScript)) {
      // In real implementation, this would execute the script
      // and check for running services
      progress.appState.backendRunning = true;
      progress.appState.frontendRunning = true;
      progress.appState.lastHealthCheck = Date.now();
    }
  }

  /**
   * Step 3: Regression Test - Verify 1-2 completed features still work
   */
  private async regressionTest(progress: SessionProgress): Promise<void> {
    if (!this.featureList) return;

    const completedFeatures = this.featureList.features.filter(f => f.passes);
    const toTest = completedFeatures.slice(-this.config.regressionTestCount);

    for (const feature of toTest) {
      const result = await this.validateFeature(feature);
      if (result.passed) {
        progress.regressionsPassed.push(feature.id);
      } else {
        progress.regressionsFailed.push(feature.id);
        // Mark as broken - needs fix
        feature.passes = false;
        this.featureList.completedFeatures--;
      }
    }
  }

  /**
   * Step 4: Pick next task based on dependencies and priority
   */
  private pickNextTask(): Feature | null {
    if (!this.featureList) return null;

    const available = this.featureList.features.filter(f => {
      // Not completed
      if (f.passes) return false;
      // Not exceeded retries
      if (f.attempts >= this.config.maxRetries) return false;
      // Dependencies met
      const depsMet = f.dependencies.every(depId => {
        const dep = this.featureList!.features.find(d => d.id === depId);
        return dep?.passes === true;
      });
      return depsMet;
    });

    if (available.length === 0) return null;

    // Sort by priority, then by id (earlier features first)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    available.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.id - b.id;
    });

    return available[0];
  }

  /**
   * Generate implementation plan for a feature
   */
  private generateImplementationPlan(feature: Feature): ExecutionPlan {
    return {
      id: `plan_feature_${feature.id}`,
      goal: feature.description,
      phases: [
        {
          name: 'Analyze',
          steps: [
            {
              id: 'analyze_1',
              action: 'analyze',
              params: { target: feature.name, context: feature.description },
              maxRetries: 1,
              model: 'haiku',
            },
          ],
          parallel: false,
          timeout: 30000,
        },
        {
          name: 'Implement',
          steps: [
            {
              id: 'implement_1',
              action: 'generate_content',
              params: { feature: feature.name, description: feature.description },
              maxRetries: 2,
              model: 'sonnet',
            },
          ],
          parallel: false,
          timeout: 120000,
        },
        {
          name: 'Validate',
          steps: feature.validationSteps.map((step, i) => ({
            id: `validate_${i}`,
            action: 'validate',
            params: { check: step },
            maxRetries: 1,
            model: 'haiku',
          })),
          parallel: true,
          timeout: 60000,
        },
      ],
      checkpoints: [1], // Checkpoint after implement
    };
  }

  /**
   * Step 6: Validate feature with its validation steps
   */
  private async validateFeature(feature: Feature): Promise<ValidationResult> {
    const startTime = Date.now();
    const stepResults: ValidationResult['steps'] = [];

    for (const step of feature.validationSteps) {
      const stepStart = Date.now();

      // In real implementation, this would run actual validation
      // (Puppeteer for UI, HTTP requests for API, file checks, etc.)
      const passed = Math.random() > 0.2; // Placeholder

      stepResults.push({
        description: step,
        passed,
        error: passed ? undefined : `Validation failed: ${step}`,
        duration: Date.now() - stepStart,
      });

      if (!passed) break; // Stop on first failure
    }

    return {
      featureId: feature.id,
      passed: stepResults.every(s => s.passed),
      steps: stepResults,
      totalDuration: Date.now() - startTime,
    };
  }

  // ============================================================
  // GIT INTEGRATION (Save States)
  // ============================================================

  private async initGit(): Promise<void> {
    const gitDir = join(this.config.projectPath, '.git');
    if (!existsSync(gitDir)) {
      // Would run: git init
    }
  }

  private async gitCommit(feature: Feature): Promise<{ sha: string; message: string; timestamp: number } | null> {
    const message = `feat(${feature.category}): ${feature.name}\n\nFeature #${feature.id} completed`;
    const sha = `commit_${Date.now()}`; // Placeholder

    return {
      sha,
      message,
      timestamp: Date.now(),
    };
  }

  private async getGitLog(count: number): Promise<string[]> {
    // Would run: git log --oneline -N
    return [];
  }

  // ============================================================
  // PROGRESS PERSISTENCE
  // ============================================================

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.config.projectPath,
      join(this.config.projectPath, '.harness'),
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }
  }

  private async saveFeatureList(): Promise<void> {
    if (!this.featureList) return;

    const path = join(this.config.projectPath, '.harness', 'feature_list.json');
    this.featureList.lastUpdated = Date.now();
    await writeFile(path, JSON.stringify(this.featureList, null, 2));
  }

  private async loadFeatureList(): Promise<void> {
    const path = join(this.config.projectPath, '.harness', 'feature_list.json');

    if (existsSync(path)) {
      const content = await readFile(path, 'utf-8');
      this.featureList = JSON.parse(content);
    }
  }

  private async saveProgress(progress: SessionProgress): Promise<void> {
    // Save as JSON
    const jsonPath = join(
      this.config.projectPath,
      '.harness',
      `progress_${progress.sessionNumber}.json`
    );
    await writeFile(jsonPath, JSON.stringify(progress, null, 2));

    // Save as human-readable markdown (claude_progress.txt pattern)
    const mdPath = join(this.config.projectPath, 'claude_progress.txt');
    await writeFile(mdPath, this.generateProgressMarkdown(progress));
  }

  private async loadLatestProgress(): Promise<void> {
    // Find latest progress file
    const harnessDir = join(this.config.projectPath, '.harness');
    if (!existsSync(harnessDir)) return;

    // Would scan for progress_*.json and load latest
    // For now, load from markdown if exists
    const mdPath = join(this.config.projectPath, 'claude_progress.txt');
    if (existsSync(mdPath)) {
      // Parse markdown back to progress object
    }
  }

  // ============================================================
  // PROGRESS FORMATTING
  // ============================================================

  private generateProgressMarkdown(progress: SessionProgress): string {
    const lines: string[] = [
      `## Session ${progress.sessionNumber} Summary`,
      '',
      `**Started:** ${new Date(progress.startedAt).toISOString()}`,
      `**Ended:** ${progress.endedAt ? new Date(progress.endedAt).toISOString() : 'In Progress'}`,
      '',
      '### Completed Features',
    ];

    if (progress.completedFeatures.length > 0) {
      for (const id of progress.completedFeatures) {
        const feature = this.featureList?.features.find(f => f.id === id);
        if (feature) {
          lines.push(`- [x] #${id}: ${feature.name}`);
        }
      }
    } else {
      lines.push('- None this session');
    }

    lines.push('', '### Current State');
    lines.push(progress.currentState || 'No state recorded');

    lines.push('', '### App Status');
    lines.push(`- Backend: ${progress.appState.backendRunning ? '✅ Running' : '❌ Stopped'}`);
    lines.push(`- Frontend: ${progress.appState.frontendRunning ? '✅ Running' : '❌ Stopped'}`);
    lines.push(`- Database: ${progress.appState.databaseInitialized ? '✅ Initialized' : '❌ Not ready'}`);

    if (progress.regressionsFailed.length > 0) {
      lines.push('', '### ⚠️ Regression Failures');
      for (const id of progress.regressionsFailed) {
        const feature = this.featureList?.features.find(f => f.id === id);
        lines.push(`- #${id}: ${feature?.name || 'Unknown'}`);
      }
    }

    lines.push('', '### Next Suggested Task');
    lines.push(progress.nextSuggestedTask || 'No suggestion');

    if (progress.knownIssues.length > 0) {
      lines.push('', '### Known Issues');
      for (const issue of progress.knownIssues) {
        lines.push(`- ${issue}`);
      }
    }

    if (progress.commits.length > 0) {
      lines.push('', '### Git Commits');
      for (const commit of progress.commits) {
        lines.push(`- \`${commit.sha.slice(0, 7)}\`: ${commit.message.split('\n')[0]}`);
      }
    }

    // Overall progress
    if (this.featureList) {
      const percent = Math.round(
        (this.featureList.completedFeatures / this.featureList.totalFeatures) * 100
      );
      lines.push('', '### Overall Progress');
      lines.push(`**${this.featureList.completedFeatures}/${this.featureList.totalFeatures} features (${percent}%)**`);

      const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
      lines.push(`\`[${bar}]\``);
    }

    return lines.join('\n');
  }

  private generateSessionSummary(progress: SessionProgress): string {
    const completed = progress.completedFeatures.length;
    const attempted = progress.attemptedFeatures.length;
    const regressions = progress.regressionsFailed.length;

    return `Session ${progress.sessionNumber}: ${completed}/${attempted} features completed, ${regressions} regressions`;
  }

  private generateCurrentState(): string {
    if (!this.featureList) return 'No feature list';

    const completed = this.featureList.features.filter(f => f.passes);
    const categories = new Set(completed.map(f => f.category));

    return `${completed.length} features done across ${categories.size} categories: ${[...categories].join(', ')}`;
  }

  private suggestNextTask(): string {
    const next = this.pickNextTask();
    if (!next) return 'All available tasks completed!';
    return `#${next.id}: ${next.name} (${next.priority} priority, ${next.estimatedComplexity} complexity)`;
  }

  // ============================================================
  // ORCHESTRATION
  // ============================================================

  /**
   * Run continuous agent loop until all features complete
   */
  async runContinuous(onProgress?: (progress: SessionProgress) => void): Promise<{
    success: boolean;
    totalSessions: number;
    totalFeatures: number;
    completedFeatures: number;
    duration: number;
  }> {
    const startTime = Date.now();
    this.running = true;

    while (this.running) {
      // Check if all done
      if (this.featureList) {
        const allDone = this.featureList.features.every(
          f => f.passes || f.attempts >= this.config.maxRetries
        );
        if (allDone) break;
      }

      // Execute session
      const progress = await this.executeSession();
      onProgress?.(progress);

      // Pause between sessions (context reset)
      if (this.running) {
        await new Promise(resolve =>
          setTimeout(resolve, this.config.pauseBetweenSessions)
        );
      }
    }

    return {
      success: this.featureList?.completedFeatures === this.featureList?.totalFeatures,
      totalSessions: this.sessionCount,
      totalFeatures: this.featureList?.totalFeatures || 0,
      completedFeatures: this.featureList?.completedFeatures || 0,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Stop the continuous loop
   */
  stop(): void {
    this.running = false;
  }

  // ============================================================
  // STATUS
  // ============================================================

  getStatus(): {
    running: boolean;
    sessionCount: number;
    featureList: FeatureList | null;
    currentProgress: SessionProgress | null;
  } {
    return {
      running: this.running,
      sessionCount: this.sessionCount,
      featureList: this.featureList,
      currentProgress: this.currentProgress,
    };
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createAutonomousHarness(
  projectPath: string,
  config?: Partial<HarnessConfig>
): AutonomousHarness {
  return new AutonomousHarness({ projectPath, ...config });
}
