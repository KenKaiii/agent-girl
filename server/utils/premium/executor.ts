/**
 * Premium Website Executor
 *
 * Executes the 100-step decomposition plan using Claude Agent SDK.
 * Uses the same SDK infrastructure as agent-girl's chat handler.
 *
 * Architecture:
 * 1. Takes a DecompositionPlan with detailed step prompts
 * 2. Executes each step via Claude Agent SDK query()
 * 3. Generates real Astro project files
 * 4. Tracks progress and handles errors with retry/escalation
 */

import * as fs from 'fs';
import { query } from "@anthropic-ai/claude-agent-sdk";
import { configureProvider } from '../../providers';
import { getMcpServers } from '../../mcpServers';
import type { DecompositionPlan, DecompositionStep } from './smartDecomposition';

export interface ExecutionConfig {
  projectPath: string;
  businessName: string;
  model?: 'haiku' | 'sonnet' | 'opus';
  maxRetries?: number;
  onProgress?: (progress: StepProgress) => void;
  onError?: (error: StepError) => void;
  onComplete?: (result: ExecutionResult) => void;
}

export interface StepProgress {
  stepId: number;
  stepName: string;
  phase: string;
  percentage: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  output?: string;
  filesCreated?: string[];
  tokensUsed?: number;
}

export interface StepError {
  stepId: number;
  stepName: string;
  error: string;
  retryCount: number;
  canRetry: boolean;
  escalatedModel?: string;
}

export interface ExecutionResult {
  success: boolean;
  projectPath: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  totalTokens: number;
  totalCost: number;
  filesCreated: string[];
  errors: StepError[];
  duration: number;
}

// Model selection for step execution
const MODEL_SELECTION = {
  foundation: 'sonnet',  // Project setup needs reliability
  components: 'haiku',   // Components can use fast model
  sections: 'haiku',     // Sections are templated
  pages: 'haiku',        // Page assembly is straightforward
  content: 'sonnet',     // Content generation needs quality
  images: 'haiku',       // Image prompts are simple
  seo: 'haiku',          // SEO is mostly boilerplate
  integrations: 'sonnet', // Integrations need accuracy
  validation: 'sonnet',  // Validation needs thoroughness
  delivery: 'haiku',     // Delivery is straightforward
} as const;

// Model API IDs
const MODEL_API_IDS: Record<string, string> = {
  haiku: 'claude-sonnet-4-20250514', // Use Sonnet as minimum for tool use
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};

// Error escalation thresholds
const ERROR_ESCALATION = {
  haiku_to_sonnet: 3,
  sonnet_to_opus: 5,
  max_retries: 7,
};

export class PremiumWebsiteExecutor {
  private plan: DecompositionPlan;
  private config: ExecutionConfig;
  private currentStep: number = 0;
  private errors: StepError[] = [];
  private filesCreated: string[] = [];
  private totalTokens: number = 0;
  private startTime: number = 0;
  private aborted: boolean = false;
  private currentAbortController: AbortController | null = null;

  constructor(plan: DecompositionPlan, config: ExecutionConfig) {
    this.plan = plan;
    this.config = {
      model: 'haiku',
      maxRetries: ERROR_ESCALATION.max_retries,
      ...config,
    };
  }

  /**
   * Execute the entire plan
   */
  async execute(): Promise<ExecutionResult> {
    this.startTime = Date.now();
    this.aborted = false;

    // Configure provider for OAuth authentication
    await configureProvider('anthropic');

    // Ensure project directory exists
    await this.ensureProjectDir();

    // Execute each step
    for (const step of this.plan.steps) {
      if (this.aborted) {
        break;
      }

      this.currentStep = step.id;
      await this.executeStep(step);
    }

    const duration = Date.now() - this.startTime;
    const completedSteps = this.plan.steps.filter(
      (_, i) => i < this.currentStep && !this.errors.some(e => e.stepId === this.plan.steps[i].id)
    ).length;

    const result: ExecutionResult = {
      success: this.errors.length === 0 && !this.aborted,
      projectPath: this.config.projectPath,
      totalSteps: this.plan.totalSteps,
      completedSteps,
      failedSteps: this.errors.filter(e => !e.canRetry).length,
      skippedSteps: this.plan.totalSteps - completedSteps - this.errors.length,
      totalTokens: this.totalTokens,
      totalCost: this.estimateCost(this.totalTokens),
      filesCreated: this.filesCreated,
      errors: this.errors,
      duration,
    };

    this.config.onComplete?.(result);
    return result;
  }

  /**
   * Abort execution
   */
  abort(): void {
    this.aborted = true;
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  /**
   * Execute a single step using Claude Agent SDK
   */
  private async executeStep(step: DecompositionStep): Promise<void> {
    let retryCount = 0;
    let currentModel = this.selectModel(step.phase, retryCount);

    const progress: StepProgress = {
      stepId: step.id,
      stepName: step.name,
      phase: step.phase,
      percentage: Math.round((step.id / this.plan.totalSteps) * 100),
      status: 'executing',
    };
    this.config.onProgress?.(progress);

    while (retryCount < (this.config.maxRetries || ERROR_ESCALATION.max_retries)) {
      try {
        // Build the execution prompt
        const prompt = this.buildStepPrompt(step);

        // Execute via Claude Agent SDK
        const result = await this.runSDKQuery(prompt, currentModel);

        // Parse and validate output
        const filesCreated = this.extractCreatedFiles(result);
        this.filesCreated.push(...filesCreated);

        // Track tokens
        this.totalTokens += step.estimatedTokens;

        // Report success
        progress.status = 'completed';
        progress.output = result;
        progress.filesCreated = filesCreated;
        progress.tokensUsed = step.estimatedTokens;
        this.config.onProgress?.(progress);

        return;
      } catch (error) {
        retryCount++;

        const stepError: StepError = {
          stepId: step.id,
          stepName: step.name,
          error: error instanceof Error ? error.message : String(error),
          retryCount,
          canRetry: retryCount < (this.config.maxRetries || ERROR_ESCALATION.max_retries),
        };

        // Escalate model on errors
        currentModel = this.selectModel(step.phase, retryCount);
        stepError.escalatedModel = currentModel;

        this.config.onError?.(stepError);

        if (!stepError.canRetry) {
          // Mark step as failed
          progress.status = 'failed';
          this.config.onProgress?.(progress);
          this.errors.push(stepError);

          // Handle retry strategy
          if (step.retryStrategy === 'skip') {
            progress.status = 'skipped';
            this.config.onProgress?.(progress);
          }
          return;
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.min(1000 * Math.pow(2, retryCount), 10000));
      }
    }
  }

  /**
   * Build the prompt for a step
   */
  private buildStepPrompt(step: DecompositionStep): string {
    return `[PREMIUM BUILDER - STEP ${step.id}/${this.plan.totalSteps}]

PHASE: ${step.phase.toUpperCase()}
TASK: ${step.name}

${step.description}

WORKING DIRECTORY: ${this.config.projectPath}

---

${step.prompt}

---

EXPECTED OUTPUTS:
${step.outputs.map(o => `- ${o}`).join('\n')}

VALIDATION:
${step.validationChecks.map(c => `- [ ] ${c}`).join('\n')}

Execute this step. Write the actual files. Do NOT ask questions - make intelligent decisions.`;
  }

  /**
   * Run Claude Agent SDK query
   */
  private async runSDKQuery(prompt: string, model: string): Promise<string> {
    // Create abort controller for this query
    this.currentAbortController = new AbortController();

    // Get model API ID
    const apiModelId = MODEL_API_IDS[model] || MODEL_API_IDS.sonnet;

    // Get MCP servers
    const mcpServers = getMcpServers('anthropic', apiModelId);

    // Build system prompt
    const systemPrompt = `You are a premium website builder executing step-by-step instructions.

RULES:
1. Execute EXACTLY what the step asks - no more, no less
2. Write files directly to the working directory using the Write tool
3. Do NOT ask questions - make intelligent decisions
4. Focus on quality and completeness
5. Follow Astro 5.x best practices
6. Use Tailwind CSS v4 for styling

WORKING DIRECTORY: ${this.config.projectPath}

When creating files:
- Use absolute paths starting with ${this.config.projectPath}
- Create parent directories as needed
- Use proper TypeScript/Astro syntax`;

    // Create a simple one-shot prompt iterator
    const promptIterator = (async function* () {
      yield {
        type: 'user' as const,
        message: {
          role: 'user' as const,
          content: prompt,
        },
        session_id: `premium-${Date.now()}`,
        parent_tool_use_id: null,
      };
    })();

    // Query options
    const queryOptions = {
      model: apiModelId,
      systemPrompt,
      permissionMode: 'bypassPermissions' as const,
      abortController: this.currentAbortController,
      cwd: this.config.projectPath,
      mcpServers,
    };

    let fullResponse = '';

    try {
      // Run the query
      const result = query({
        prompt: promptIterator,
        options: queryOptions,
      });

      // Collect response
      for await (const message of result) {
        if (this.aborted) {
          throw new Error('Execution aborted');
        }

        // Extract text content from messages
        if ((message as { type: string }).type === 'assistant') {
          const content = (message as { message: { content: unknown[] } }).message.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if ((block as { type: string }).type === 'text') {
                fullResponse += (block as { text: string }).text;
              }
            }
          }
        }

        // Handle stream events for text deltas
        if ((message as { type: string }).type === 'stream_event') {
          const event = (message as { event: { type: string } }).event;
          if (event.type === 'content_block_delta') {
            const delta = (event as { delta?: { type: string; text?: string } }).delta;
            if (delta?.type === 'text_delta' && delta.text) {
              fullResponse += delta.text;
            }
          }
        }

        // Handle completion
        if ((message as { type: string }).type === 'result') {
          break;
        }
      }

      return fullResponse;
    } finally {
      this.currentAbortController = null;
    }
  }

  /**
   * Select model based on phase and error count
   */
  private selectModel(phase: string, errorCount: number): 'haiku' | 'sonnet' | 'opus' {
    // Error escalation
    if (errorCount >= ERROR_ESCALATION.sonnet_to_opus) {
      return 'opus';
    }
    if (errorCount >= ERROR_ESCALATION.haiku_to_sonnet) {
      return 'sonnet';
    }

    // Phase-based selection
    return (MODEL_SELECTION[phase as keyof typeof MODEL_SELECTION] || 'haiku') as 'haiku' | 'sonnet' | 'opus';
  }

  /**
   * Extract created files from Claude output
   */
  private extractCreatedFiles(output: string): string[] {
    const files: string[] = [];

    // Match file paths in common formats
    const patterns = [
      /Created?\s+(?:file\s+)?['"`]?([^\s'"`]+\.(?:ts|tsx|astro|mjs|json|css|js|jsx|md|txt))['"`]?/gi,
      /Writing?\s+(?:to\s+)?['"`]?([^\s'"`]+\.(?:ts|tsx|astro|mjs|json|css|js|jsx|md|txt))['"`]?/gi,
      /(?:src|public)\/[^\s'"`]+\.(?:ts|tsx|astro|mjs|json|css|js|jsx|md|txt)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(output)) !== null) {
        const file = match[1] || match[0];
        if (!files.includes(file)) {
          files.push(file);
        }
      }
    }

    return files;
  }

  /**
   * Ensure project directory exists
   */
  private async ensureProjectDir(): Promise<void> {
    if (!fs.existsSync(this.config.projectPath)) {
      fs.mkdirSync(this.config.projectPath, { recursive: true });
    }
  }

  /**
   * Estimate cost from tokens
   */
  private estimateCost(tokens: number): number {
    // Sonnet pricing: $3/1M input, $15/1M output
    // Estimate 2:1 output:input ratio
    const inputTokens = tokens / 3;
    const outputTokens = (tokens * 2) / 3;
    return (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create and execute a premium website build
 * Main entry point for one-prompt-to-website flow
 */
export async function buildPremiumWebsite(
  plan: DecompositionPlan,
  config: ExecutionConfig
): Promise<ExecutionResult> {
  const executor = new PremiumWebsiteExecutor(plan, config);
  return executor.execute();
}

export default PremiumWebsiteExecutor;
