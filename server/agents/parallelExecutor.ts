/**
 * Agent Girl - Parallel Task Executor with Intelligent Worker Pool
 * High-performance multi-iterative execution engine
 */

import type {
  WorkerTask,
  WorkerResult,
  WorkerPoolConfig,
  ExecutionPlan,
  ExecutionPhase,
  ExecutionStep,
  ExecutionState,
  Checkpoint,
  FallbackStrategy,
} from './types';

// ============================================================
// WORKER POOL
// ============================================================

interface Worker {
  id: string;
  busy: boolean;
  currentTask: string | null;
  completedTasks: number;
  errors: number;
  avgDuration: number;
}

export class ParallelExecutor {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private results: Map<string, WorkerResult> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private completedTasks: Set<string> = new Set();
  private config: WorkerPoolConfig;
  private executing = false;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: Partial<WorkerPoolConfig> = {}) {
    this.config = {
      maxWorkers: config.maxWorkers ?? 5,
      minWorkers: config.minWorkers ?? 1,
      taskTimeout: config.taskTimeout ?? 60000,
      idleTimeout: config.idleTimeout ?? 30000,
      scaleUpThreshold: config.scaleUpThreshold ?? 10,
      scaleDownThreshold: config.scaleDownThreshold ?? 2,
    };

    // Initialize minimum workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.spawnWorker();
    }
  }

  // ============================================================
  // TASK MANAGEMENT
  // ============================================================

  /**
   * Add tasks to queue with optional dependencies
   */
  addTasks(tasks: WorkerTask[]): void {
    for (const task of tasks) {
      this.taskQueue.push(task);

      // Track dependencies
      if (task.dependsOn && task.dependsOn.length > 0) {
        this.dependencies.set(task.id, new Set(task.dependsOn));
      }
    }

    // Sort by priority
    this.sortQueue();

    // Auto-scale if needed
    this.autoScale();
  }

  /**
   * Execute all queued tasks
   */
  async executeAll(): Promise<Map<string, WorkerResult>> {
    this.executing = true;
    this.emit('start', { totalTasks: this.taskQueue.length });

    while (this.taskQueue.length > 0 || this.hasActiveTasks()) {
      // Get ready tasks (no pending dependencies)
      const readyTasks = this.getReadyTasks();

      if (readyTasks.length === 0 && this.hasActiveTasks()) {
        // Wait for active tasks to complete
        await this.sleep(100);
        continue;
      }

      if (readyTasks.length === 0) break;

      // Assign tasks to available workers
      const assignments = this.assignTasks(readyTasks);

      // Execute in parallel
      await Promise.all(
        assignments.map(({ worker, task }) =>
          this.executeTask(worker, task)
        )
      );
    }

    this.executing = false;
    this.emit('complete', {
      results: this.results,
      completed: this.completedTasks.size,
    });

    return this.results;
  }

  /**
   * Execute a single task with retries and fallbacks
   */
  private async executeTask(worker: Worker, task: WorkerTask): Promise<void> {
    worker.busy = true;
    worker.currentTask = task.id;
    const startTime = Date.now();

    this.emit('taskStart', { taskId: task.id, workerId: worker.id });

    let attempt = 0;
    let success = false;
    let result: unknown;
    let error: string | undefined;

    while (attempt < task.retries && !success) {
      attempt++;

      try {
        result = await Promise.race([
          this.runTask(task),
          this.timeout(task.timeout),
        ]);
        success = true;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        worker.errors++;

        this.emit('taskRetry', {
          taskId: task.id,
          attempt,
          error,
        });

        if (attempt < task.retries) {
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    const duration = Date.now() - startTime;
    worker.completedTasks++;
    worker.avgDuration = (worker.avgDuration * (worker.completedTasks - 1) + duration) / worker.completedTasks;
    worker.busy = false;
    worker.currentTask = null;

    const workerResult: WorkerResult = {
      taskId: task.id,
      success,
      result: success ? result : undefined,
      error: success ? undefined : error,
      duration,
      tokensUsed: 0, // Will be populated by actual task execution
    };

    this.results.set(task.id, workerResult);
    this.completedTasks.add(task.id);

    // Remove from queue
    const idx = this.taskQueue.findIndex(t => t.id === task.id);
    if (idx >= 0) this.taskQueue.splice(idx, 1);

    this.emit('taskComplete', workerResult);
  }

  /**
   * Actual task execution - Override in subclass or provide executor
   */
  protected async runTask(task: WorkerTask): Promise<unknown> {
    // This would be overridden with actual implementation
    // For now, simulate async work
    await this.sleep(100);
    return { taskId: task.id, executed: true };
  }

  // ============================================================
  // EXECUTION PLAN RUNNER
  // ============================================================

  /**
   * Execute a full execution plan with phases
   */
  async executePlan(
    plan: ExecutionPlan,
    onProgress?: (state: ExecutionState) => void
  ): Promise<{ success: boolean; state: ExecutionState }> {
    const state: ExecutionState = {
      planId: plan.id,
      currentPhase: 0,
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      retryCount: new Map(),
      tokensUsed: 0,
      costUsd: 0,
      startTime: Date.now(),
      checkpoints: [],
    };

    this.emit('planStart', { plan, state });

    for (let phaseIdx = 0; phaseIdx < plan.phases.length; phaseIdx++) {
      const phase = plan.phases[phaseIdx];
      state.currentPhase = phaseIdx;

      this.emit('phaseStart', { phase, phaseIdx });

      // Check phase dependencies
      if (phase.dependsOn) {
        const unmetDeps = phase.dependsOn.filter(
          dep => !state.completedSteps.includes(dep)
        );
        if (unmetDeps.length > 0) {
          this.emit('phaseDependencyFailed', { phase, unmetDeps });
          continue;
        }
      }

      // Execute phase (parallel or sequential)
      const phaseResult = await this.executePhase(phase, state, onProgress);

      if (!phaseResult.success) {
        // Phase failed - decide whether to continue or abort
        const criticalFailures = phaseResult.failedSteps.filter(
          stepId => {
            const step = phase.steps.find(s => s.id === stepId);
            return step?.fallbackStrategy?.type !== 'skip';
          }
        );

        if (criticalFailures.length > 0) {
          state.failedSteps.push(...criticalFailures);
          this.emit('planFailed', { state, reason: 'Critical step failed' });
          return { success: false, state };
        }
      }

      // Checkpoint if needed
      if (plan.checkpoints.includes(phaseIdx)) {
        const checkpoint: Checkpoint = {
          stepId: `phase_${phaseIdx}`,
          timestamp: Date.now(),
          state: { completedSteps: [...state.completedSteps] },
        };
        state.checkpoints.push(checkpoint);
        this.emit('checkpoint', checkpoint);
      }

      onProgress?.(state);
    }

    this.emit('planComplete', { state });
    return { success: true, state };
  }

  /**
   * Execute a single phase
   */
  private async executePhase(
    phase: ExecutionPhase,
    state: ExecutionState,
    onProgress?: (state: ExecutionState) => void
  ): Promise<{ success: boolean; failedSteps: string[] }> {
    const failedSteps: string[] = [];

    if (phase.parallel) {
      // Execute all steps in parallel
      const tasks: WorkerTask[] = phase.steps.map(step => ({
        id: step.id,
        type: step.action as WorkerTask['type'],
        params: step.params,
        priority: 'medium' as const,
        timeout: phase.timeout,
        retries: step.maxRetries,
        dependsOn: undefined,
      }));

      this.addTasks(tasks);
      const results = await this.executeAll();

      for (const [taskId, result] of results) {
        if (result.success) {
          state.completedSteps.push(taskId);
        } else {
          failedSteps.push(taskId);
        }
        state.currentStep++;
        onProgress?.(state);
      }
    } else {
      // Execute steps sequentially
      for (const step of phase.steps) {
        const result = await this.executeSingleStep(step, state);

        if (result.success) {
          state.completedSteps.push(step.id);
        } else {
          failedSteps.push(step.id);

          // Handle fallback
          if (step.fallbackStrategy?.type === 'skip') {
            continue;
          }
          if (step.fallbackStrategy?.type === 'human') {
            this.emit('humanRequired', { step, state });
            break;
          }
        }

        state.currentStep++;
        onProgress?.(state);
      }
    }

    return {
      success: failedSteps.length === 0,
      failedSteps,
    };
  }

  /**
   * Execute a single step with model selection
   */
  private async executeSingleStep(
    step: ExecutionStep,
    state: ExecutionState
  ): Promise<WorkerResult> {
    const retries = state.retryCount.get(step.id) || 0;

    const task: WorkerTask = {
      id: step.id,
      type: step.action as WorkerTask['type'],
      params: {
        ...step.params,
        model: this.selectModel(step, retries),
      },
      priority: 'high' as const,
      timeout: 60000,
      retries: step.maxRetries,
    };

    // Execute directly (not through pool for single step)
    const startTime = Date.now();
    let success = false;
    let result: unknown;
    let error: string | undefined;

    try {
      result = await this.runTask(task);
      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      state.retryCount.set(step.id, retries + 1);
    }

    return {
      taskId: step.id,
      success,
      result,
      error,
      duration: Date.now() - startTime,
      tokensUsed: 0,
    };
  }

  /**
   * Select model based on step requirements and error history
   */
  private selectModel(step: ExecutionStep, retries: number): string {
    if (step.model !== 'auto') return step.model;

    // Escalate model on retries
    if (retries >= 3) return 'opus';
    if (retries >= 1) return 'sonnet';

    // Default to haiku for speed
    return 'haiku';
  }

  // ============================================================
  // WORKER MANAGEMENT
  // ============================================================

  private spawnWorker(): Worker {
    const worker: Worker = {
      id: `worker_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      busy: false,
      currentTask: null,
      completedTasks: 0,
      errors: 0,
      avgDuration: 0,
    };

    this.workers.set(worker.id, worker);
    this.emit('workerSpawned', { workerId: worker.id });
    return worker;
  }

  private removeWorker(workerId: string): void {
    this.workers.delete(workerId);
    this.emit('workerRemoved', { workerId });
  }

  private autoScale(): void {
    const queueSize = this.taskQueue.length;
    const activeWorkers = [...this.workers.values()].filter(w => w.busy).length;
    const totalWorkers = this.workers.size;

    // Scale up
    if (queueSize > this.config.scaleUpThreshold && totalWorkers < this.config.maxWorkers) {
      const toAdd = Math.min(
        this.config.maxWorkers - totalWorkers,
        Math.ceil(queueSize / this.config.scaleUpThreshold)
      );
      for (let i = 0; i < toAdd; i++) {
        this.spawnWorker();
      }
    }

    // Scale down
    const idleWorkers = [...this.workers.values()].filter(w => !w.busy);
    if (idleWorkers.length > this.config.scaleDownThreshold && totalWorkers > this.config.minWorkers) {
      const toRemove = Math.min(
        idleWorkers.length - this.config.scaleDownThreshold,
        totalWorkers - this.config.minWorkers
      );
      for (let i = 0; i < toRemove; i++) {
        this.removeWorker(idleWorkers[i].id);
      }
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private getReadyTasks(): WorkerTask[] {
    return this.taskQueue.filter(task => {
      const deps = this.dependencies.get(task.id);
      if (!deps) return true;

      // All dependencies must be completed
      for (const dep of deps) {
        if (!this.completedTasks.has(dep)) return false;
      }
      return true;
    });
  }

  private assignTasks(tasks: WorkerTask[]): Array<{ worker: Worker; task: WorkerTask }> {
    const assignments: Array<{ worker: Worker; task: WorkerTask }> = [];
    const availableWorkers = [...this.workers.values()].filter(w => !w.busy);

    for (let i = 0; i < Math.min(tasks.length, availableWorkers.length); i++) {
      assignments.push({
        worker: availableWorkers[i],
        task: tasks[i],
      });
    }

    return assignments;
  }

  private hasActiveTasks(): boolean {
    return [...this.workers.values()].some(w => w.busy);
  }

  private sortQueue(): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    this.taskQueue.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Task timeout')), ms)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================
  // EVENTS
  // ============================================================

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event) || [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  getStatus(): {
    workers: number;
    busy: number;
    queued: number;
    completed: number;
  } {
    const workers = [...this.workers.values()];
    return {
      workers: workers.length,
      busy: workers.filter(w => w.busy).length,
      queued: this.taskQueue.length,
      completed: this.completedTasks.size,
    };
  }
}

// Export singleton factory
export function createParallelExecutor(config?: Partial<WorkerPoolConfig>): ParallelExecutor {
  return new ParallelExecutor(config);
}
