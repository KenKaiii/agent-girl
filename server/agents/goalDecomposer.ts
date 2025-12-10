/**
 * Agent Girl - Self-Planning Goal Decomposer
 * Breaks down complex goals into executable plans with validation
 */

import type {
  Goal,
  GoalType,
  Constraint,
  SuccessCriterion,
  ExecutionPlan,
  ExecutionPhase,
  ExecutionStep,
  ModelStrategy,
  ActionType,
  FallbackStrategy,
  ExecutionContext,
} from './types';
import { getLearningEngine } from './learningEngine';

// ============================================================
// GOAL TEMPLATES
// ============================================================

const GOAL_PATTERNS: Record<string, Partial<Goal>> = {
  // Build patterns
  'create website': {
    type: 'build',
    complexity: 'complex',
    estimatedSteps: 25,
  },
  'add feature': {
    type: 'modify',
    complexity: 'medium',
    estimatedSteps: 10,
  },
  'fix bug': {
    type: 'fix',
    complexity: 'simple',
    estimatedSteps: 5,
  },
  'optimize': {
    type: 'optimize',
    complexity: 'medium',
    estimatedSteps: 8,
  },
  'deploy': {
    type: 'deploy',
    complexity: 'simple',
    estimatedSteps: 5,
  },
  'test': {
    type: 'test',
    complexity: 'medium',
    estimatedSteps: 8,
  },
  'refactor': {
    type: 'modify',
    complexity: 'medium',
    estimatedSteps: 12,
  },
  'research': {
    type: 'research',
    complexity: 'simple',
    estimatedSteps: 5,
  },
};

// ============================================================
// DECOMPOSER CLASS
// ============================================================

export class GoalDecomposer {
  private context: ExecutionContext;
  private learning = getLearningEngine();

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  /**
   * Decompose a natural language goal into an execution plan
   */
  async decompose(goalDescription: string): Promise<ExecutionPlan> {
    // 1. Analyze goal
    const goal = await this.analyzeGoal(goalDescription);

    // 2. Generate subgoals if complex
    if (goal.complexity === 'complex' || goal.complexity === 'epic') {
      goal.subgoals = await this.generateSubgoals(goal);
    }

    // 3. Create execution phases
    const phases = await this.createPhases(goal);

    // 4. Determine model strategy
    const modelStrategy = this.determineModelStrategy(goal);

    // 5. Calculate checkpoints
    const checkpoints = this.calculateCheckpoints(phases);

    // 6. Apply learned preferences
    const preferenceHint = this.learning.getPreferenceSummary(this.context);

    const plan: ExecutionPlan = {
      id: this.generateId(),
      goal,
      phases,
      estimatedCost: this.estimateCost(phases, modelStrategy),
      estimatedTime: this.estimateTime(phases),
      modelStrategy,
      checkpoints,
      rollbackPoints: [],
    };

    return plan;
  }

  // ============================================================
  // GOAL ANALYSIS
  // ============================================================

  private async analyzeGoal(description: string): Promise<Goal> {
    const lower = description.toLowerCase();

    // Match against patterns
    let matchedPattern: Partial<Goal> | undefined;
    for (const [pattern, template] of Object.entries(GOAL_PATTERNS)) {
      if (lower.includes(pattern)) {
        matchedPattern = template;
        break;
      }
    }

    // Infer constraints
    const constraints = this.inferConstraints(description);

    // Infer success criteria
    const successCriteria = this.inferSuccessCriteria(description, matchedPattern?.type || 'build');

    // Check for parallelization opportunity
    const parallelizable = this.isParallelizable(description);

    const goal: Goal = {
      id: this.generateId(),
      description,
      type: matchedPattern?.type || 'build',
      complexity: matchedPattern?.complexity || this.inferComplexity(description),
      estimatedSteps: matchedPattern?.estimatedSteps || 10,
      constraints,
      successCriteria,
      parallelizable,
    };

    return goal;
  }

  private inferComplexity(description: string): Goal['complexity'] {
    const words = description.split(/\s+/).length;
    const hasMultiple = /\b(and|also|plus|additionally|then)\b/i.test(description);
    const hasCondition = /\b(if|when|unless|depending)\b/i.test(description);

    if (words > 50 || (hasMultiple && hasCondition)) return 'epic';
    if (words > 30 || hasMultiple) return 'complex';
    if (words > 15) return 'medium';
    if (words > 5) return 'simple';
    return 'trivial';
  }

  private inferConstraints(description: string): Constraint[] {
    const constraints: Constraint[] = [];

    // Budget constraints
    if (/\b(cheap|low.?cost|budget|free)\b/i.test(description)) {
      constraints.push({ type: 'budget', value: 5, hard: false });
    }

    // Technology constraints
    const techPatterns = [
      { pattern: /\b(typescript|ts)\b/i, tech: 'typescript' },
      { pattern: /\b(javascript|js)\b/i, tech: 'javascript' },
      { pattern: /\b(react)\b/i, tech: 'react' },
      { pattern: /\b(vue)\b/i, tech: 'vue' },
      { pattern: /\b(astro)\b/i, tech: 'astro' },
      { pattern: /\b(next\.?js|nextjs)\b/i, tech: 'nextjs' },
    ];

    for (const { pattern, tech } of techPatterns) {
      if (pattern.test(description)) {
        constraints.push({ type: 'technology', value: tech, hard: true });
      }
    }

    // Time constraints
    if (/\b(quick|fast|asap|urgent)\b/i.test(description)) {
      constraints.push({ type: 'time', value: 300, hard: false }); // 5 minutes
    }

    return constraints;
  }

  private inferSuccessCriteria(description: string, type: GoalType): SuccessCriterion[] {
    const criteria: SuccessCriterion[] = [];

    // Always verify builds
    criteria.push({
      description: 'Code compiles without errors',
      validator: 'type_check',
      expected: true,
      weight: 1.0,
    });

    // Type-specific criteria
    switch (type) {
      case 'build':
        criteria.push({
          description: 'All specified files created',
          validator: 'file_exists',
          expected: true,
          weight: 0.9,
        });
        criteria.push({
          description: 'Project builds successfully',
          validator: 'builds',
          expected: true,
          weight: 1.0,
        });
        break;

      case 'test':
        criteria.push({
          description: 'All tests pass',
          validator: 'test_passes',
          expected: true,
          weight: 1.0,
        });
        break;

      case 'deploy':
        criteria.push({
          description: 'Deployment successful',
          validator: 'deploys',
          expected: true,
          weight: 1.0,
        });
        break;

      case 'fix':
        criteria.push({
          description: 'Bug is resolved',
          validator: 'test_passes',
          expected: true,
          weight: 1.0,
        });
        break;
    }

    // Lint check if mentioned
    if (/\b(lint|clean|format)\b/i.test(description)) {
      criteria.push({
        description: 'Linting passes',
        validator: 'lint_clean',
        expected: true,
        weight: 0.7,
      });
    }

    return criteria;
  }

  private isParallelizable(description: string): boolean {
    // Multiple independent items
    const hasAnd = /\band\b/gi.test(description);
    const items = description.split(/,|;|\band\b/i).length;
    return hasAnd && items >= 2;
  }

  // ============================================================
  // SUBGOAL GENERATION
  // ============================================================

  private async generateSubgoals(goal: Goal): Promise<Goal[]> {
    const subgoals: Goal[] = [];

    switch (goal.type) {
      case 'build':
        subgoals.push(
          this.createSubgoal('Analyze requirements', 'research', 2),
          this.createSubgoal('Setup project structure', 'build', 3),
          this.createSubgoal('Implement core functionality', 'build', 10),
          this.createSubgoal('Add styling and polish', 'modify', 5),
          this.createSubgoal('Test and validate', 'test', 3),
          this.createSubgoal('Optimize and finalize', 'optimize', 2),
        );
        break;

      case 'modify':
        subgoals.push(
          this.createSubgoal('Understand existing code', 'research', 2),
          this.createSubgoal('Plan changes', 'research', 1),
          this.createSubgoal('Implement changes', 'modify', 5),
          this.createSubgoal('Test changes', 'test', 2),
        );
        break;

      case 'deploy':
        subgoals.push(
          this.createSubgoal('Validate build', 'test', 2),
          this.createSubgoal('Configure deployment', 'build', 2),
          this.createSubgoal('Deploy to platform', 'deploy', 1),
        );
        break;

      default:
        // Single phase for simple goals
        break;
    }

    return subgoals;
  }

  private createSubgoal(description: string, type: GoalType, steps: number): Goal {
    return {
      id: this.generateId(),
      description,
      type,
      complexity: steps > 5 ? 'medium' : 'simple',
      estimatedSteps: steps,
      constraints: [],
      successCriteria: [],
      parallelizable: false,
    };
  }

  // ============================================================
  // PHASE CREATION
  // ============================================================

  private async createPhases(goal: Goal): Promise<ExecutionPhase[]> {
    const phases: ExecutionPhase[] = [];

    // Phase 0: Analysis (always)
    phases.push(this.createAnalysisPhase(goal));

    // Generate phases from subgoals or create default phases
    if (goal.subgoals && goal.subgoals.length > 0) {
      for (const subgoal of goal.subgoals) {
        phases.push(await this.subgoalToPhase(subgoal));
      }
    } else {
      phases.push(await this.createDefaultPhase(goal));
    }

    // Final phase: Validation
    phases.push(this.createValidationPhase(goal));

    return phases;
  }

  private createAnalysisPhase(goal: Goal): ExecutionPhase {
    return {
      id: `phase_analysis_${this.generateId()}`,
      name: 'Analysis',
      steps: [
        this.createStep('analyze', {
          description: goal.description,
          context: this.context,
        }, 'Analyze requirements and context'),
        this.createStep('search_code', {
          patterns: this.extractSearchPatterns(goal.description),
        }, 'Search existing codebase'),
      ],
      parallel: false,
      timeout: 30000,
    };
  }

  private async subgoalToPhase(subgoal: Goal): Promise<ExecutionPhase> {
    const steps: ExecutionStep[] = [];

    switch (subgoal.type) {
      case 'research':
        steps.push(
          this.createStep('search_code', {}, 'Search codebase'),
          this.createStep('analyze', {}, 'Analyze findings'),
        );
        break;

      case 'build':
        steps.push(
          this.createStep('plan', {}, 'Plan implementation'),
          this.createStep('write_file', {}, 'Write files'),
          this.createStep('run_command', { command: 'bun install' }, 'Install dependencies'),
        );
        break;

      case 'modify':
        steps.push(
          this.createStep('read_file', {}, 'Read existing files'),
          this.createStep('edit_file', {}, 'Apply modifications'),
        );
        break;

      case 'test':
        steps.push(
          this.createStep('run_command', { command: 'bun test' }, 'Run tests'),
          this.createStep('validate', {}, 'Validate results'),
        );
        break;

      case 'deploy':
        steps.push(
          this.createStep('deploy', {}, 'Deploy to target'),
          this.createStep('validate', {}, 'Verify deployment'),
        );
        break;

      default:
        steps.push(
          this.createStep('generate_content', { description: subgoal.description }, 'Execute step'),
        );
    }

    return {
      id: `phase_${subgoal.id}`,
      name: subgoal.description,
      steps,
      parallel: subgoal.parallelizable,
      timeout: subgoal.estimatedSteps * 10000,
    };
  }

  private async createDefaultPhase(goal: Goal): Promise<ExecutionPhase> {
    return {
      id: `phase_main_${this.generateId()}`,
      name: 'Execution',
      steps: [
        this.createStep('generate_content', {
          description: goal.description,
          constraints: goal.constraints,
        }, 'Execute main goal'),
      ],
      parallel: false,
      timeout: 60000,
    };
  }

  private createValidationPhase(goal: Goal): ExecutionPhase {
    const steps: ExecutionStep[] = [];

    for (const criterion of goal.successCriteria) {
      steps.push(
        this.createStep('validate', {
          validator: criterion.validator,
          expected: criterion.expected,
        }, criterion.description)
      );
    }

    // Always type check
    if (!steps.some(s => s.params.validator === 'type_check')) {
      steps.push(
        this.createStep('run_command', {
          command: 'bun run tsc --noEmit',
        }, 'Type check')
      );
    }

    return {
      id: `phase_validation_${this.generateId()}`,
      name: 'Validation',
      steps,
      parallel: true, // Validations can run in parallel
      timeout: 30000,
    };
  }

  private createStep(
    action: ActionType,
    params: Record<string, unknown>,
    description: string
  ): ExecutionStep {
    return {
      id: `step_${this.generateId()}`,
      action,
      params,
      expectedOutcome: description,
      fallbackStrategy: this.getDefaultFallback(action),
      maxRetries: 3,
      model: 'auto',
    };
  }

  private getDefaultFallback(action: ActionType): FallbackStrategy {
    switch (action) {
      case 'deploy':
        return { type: 'human', maxAttempts: 1, backoffMs: 0 };
      case 'validate':
        return { type: 'skip', maxAttempts: 2, backoffMs: 1000 };
      default:
        return { type: 'retry', maxAttempts: 3, backoffMs: 2000 };
    }
  }

  // ============================================================
  // MODEL STRATEGY
  // ============================================================

  private determineModelStrategy(goal: Goal): ModelStrategy {
    const isComplex = goal.complexity === 'complex' || goal.complexity === 'epic';

    return {
      planning: isComplex ? 'opus' : 'sonnet',
      execution: 'haiku',
      validation: 'haiku',
      errorRecovery: 'sonnet',
      escalationThreshold: 3,
    };
  }

  // ============================================================
  // ESTIMATES
  // ============================================================

  private calculateCheckpoints(phases: ExecutionPhase[]): number[] {
    const checkpoints: number[] = [];
    let totalSteps = 0;

    for (let i = 0; i < phases.length; i++) {
      totalSteps += phases[i].steps.length;
      // Checkpoint every 5 steps or at phase boundaries
      if (totalSteps >= 5 || i === phases.length - 1) {
        checkpoints.push(i);
        totalSteps = 0;
      }
    }

    return checkpoints;
  }

  private estimateCost(phases: ExecutionPhase[], strategy: ModelStrategy): number {
    let totalTokens = 0;

    for (const phase of phases) {
      for (const step of phase.steps) {
        // Rough token estimates per action
        const actionTokens: Record<string, number> = {
          analyze: 2000,
          plan: 3000,
          read_file: 500,
          write_file: 2000,
          edit_file: 1500,
          run_command: 200,
          search_code: 1000,
          search_web: 1500,
          generate_content: 3000,
          validate: 500,
          deploy: 1000,
          test: 800,
          git_commit: 300,
          spawn_agent: 500,
          wait_parallel: 0,
        };

        const actionKey = typeof step.action === 'string' ? step.action : 'analyze';
        totalTokens += actionTokens[actionKey] || 1000;
      }
    }

    // Calculate cost (rough: $3/1M input, $15/1M output)
    // Assume 30% output ratio
    const inputTokens = totalTokens * 0.7;
    const outputTokens = totalTokens * 0.3;

    return (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  }

  private estimateTime(phases: ExecutionPhase[]): number {
    let totalMs = 0;

    for (const phase of phases) {
      if (phase.parallel) {
        // Parallel: max of all steps
        totalMs += Math.max(...phase.steps.map(() => 5000));
      } else {
        // Sequential: sum of all steps
        totalMs += phase.steps.length * 5000;
      }
    }

    return totalMs;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private extractSearchPatterns(description: string): string[] {
    // Extract technical terms for code search
    const patterns: string[] = [];

    const techTerms = description.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) || []; // PascalCase
    const functions = description.match(/\b[a-z]+(?:[A-Z][a-z]+)+\b/g) || []; // camelCase

    patterns.push(...techTerms, ...functions);

    return [...new Set(patterns)];
  }

  private generateId(): string {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }
}

export function createGoalDecomposer(context: ExecutionContext): GoalDecomposer {
  return new GoalDecomposer(context);
}
