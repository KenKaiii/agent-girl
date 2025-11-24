/**
 * AI Integration Module - Handles bidirectional communication with Claude AI
 * Manages prompt execution, token tracking, and AI-triggered tasks
 */

import { Task, AIPromptConfig } from './types';
import { QueueDatabase } from './queueDatabase';
import EventEmitter from 'events';

export interface AIExecutionContext {
  taskId: string;
  sessionId: string;
  prompt: string;
  mode: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  metadata?: Record<string, unknown>;
}

export interface AIResponse {
  success: boolean;
  output: string;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  error?: string;
  followUpTasks?: Partial<Task>[];
}

export class AIIntegration extends EventEmitter {
  private db: QueueDatabase;
  private defaultConfig: AIPromptConfig;
  private conversationCache: Map<string, Array<{ role: 'user' | 'assistant'; content: string }>> = new Map();
  private totalTokensUsed: number = 0;
  private executionCount: number = 0;

  constructor(db: QueueDatabase, config?: Partial<AIPromptConfig>) {
    super();
    this.db = db;

    this.defaultConfig = {
      systemPrompt: 'You are a helpful AI assistant designed to help with task execution and automation.',
      model: 'claude-3-5-sonnet',
      maxTokens: 2048,
      ...config,
    };

    console.log('🤖 AI Integration initialized');
  }

  /**
   * Execute task with AI
   */
  async executeTask(context: AIExecutionContext): Promise<AIResponse> {
    this.executionCount++;
    const startTime = Date.now();

    console.log(`🤖 Executing AI task: ${context.taskId}`);

    try {
      // Get or initialize conversation history
      const history = this.conversationCache.get(context.sessionId) || [];

      // Build messages for Claude
      const messages = [
        ...history,
        { role: 'user' as const, content: context.prompt },
      ];

      // Execute with Claude SDK
      // NOTE: This requires actual Claude SDK integration
      const response = await this.callClaudeAPI(messages, context.mode);

      if (!response.success) {
        return {
          success: false,
          output: '',
          error: response.error,
        };
      }

      // Update conversation history
      history.push({ role: 'user', content: context.prompt });
      history.push({ role: 'assistant', content: response.output });

      // Keep history manageable (last 10 exchanges)
      if (history.length > 20) {
        history.splice(0, 10);
      }

      this.conversationCache.set(context.sessionId, history);

      // Track tokens
      if (response.tokensUsed) {
        this.totalTokensUsed += response.tokensUsed.total;
      }

      const executionTime = Date.now() - startTime;

      console.log(`✅ AI task completed: ${context.taskId} (${executionTime}ms)`);

      // Check for follow-up tasks in the response
      const followUpTasks = this.extractFollowUpTasks(response.output, context);

      // Emit completion event with results
      this.emit('task:executed', {
        taskId: context.taskId,
        executionTime,
        tokensUsed: response.tokensUsed,
        followUpTasks: followUpTasks.length > 0 ? followUpTasks : undefined,
      });

      return {
        success: true,
        output: response.output,
        tokensUsed: response.tokensUsed,
        followUpTasks: followUpTasks.length > 0 ? followUpTasks : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ AI task failed: ${context.taskId} - ${errorMessage}`);

      this.emit('task:error', { taskId: context.taskId, error: errorMessage });

      return {
        success: false,
        output: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Call Claude API with messages
   * This is a placeholder - actual implementation would use Claude SDK
   */
  private async callClaudeAPI(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    mode: string
  ): Promise<AIResponse> {
    // TODO: Integrate with actual Claude SDK
    // For now, return a mock response
    console.log(`📤 Calling Claude API (mode: ${mode})`);

    // Mock response for development
    const mockOutput = 'Task executed successfully with AI assistance.';

    return {
      success: true,
      output: mockOutput,
      tokensUsed: {
        input: Math.floor(Math.random() * 500),
        output: Math.floor(Math.random() * 500),
        total: Math.floor(Math.random() * 1000),
      },
    };
  }

  /**
   * Extract follow-up tasks from AI response
   * Uses simple pattern matching to identify if AI suggests new tasks
   */
  private extractFollowUpTasks(
    output: string,
    context: AIExecutionContext
  ): Partial<Task>[] {
    const tasks: Partial<Task>[] = [];

    // Look for task suggestions in format like:
    // "Next step: [task description]"
    // or "Follow-up: [task description]"
    const patterns = [
      /next step:?\s*([^\n.]+)/gi,
      /follow-up:?\s*([^\n.]+)/gi,
      /then:?\s*([^\n.]+)/gi,
      /create task:?\s*([^\n.]+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(output)) !== null) {
        const taskPrompt = match[1].trim();
        if (taskPrompt.length > 5) {
          tasks.push({
            sessionId: context.sessionId,
            prompt: taskPrompt,
            mode: (context.mode || 'general') as 'general' | 'coder' | 'intense-research' | 'spark',
            model: this.defaultConfig.model,
            priority: 'normal' as const,
            triggeredBy: context.taskId,
          });
        }
      }
    }

    return tasks;
  }

  /**
   * Generate task from AI suggestion
   */
  async generateTaskFromAI(prompt: string, sessionId: string): Promise<Task | null> {
    try {
      // Ask Claude to suggest a task structure
      const response = await this.callClaudeAPI(
        [{ role: 'user', content: `Generate a task for: ${prompt}` }],
        'general'
      );

      if (!response.success) {
        console.error('Failed to generate task from AI:', response.error);
        return null;
      }

      // Create task from AI suggestion
      const task = this.db.createTask({
        sessionId,
        prompt: response.output,
        mode: 'general' as const,
        model: this.defaultConfig.model!,
        status: 'pending' as const,
        priority: 'normal' as const,
        attempts: 0,
        maxAttempts: 3,
      });

      console.log(`🎯 Generated task from AI: ${task.id}`);
      return task;
    } catch (error) {
      console.error('Error generating task:', error);
      return null;
    }
  }

  /**
   * Create bidirectional conversation flow
   */
  async createConversationFlow(
    initialPrompt: string,
    sessionId: string,
    maxTurns: number = 3
  ): Promise<Task> {
    console.log(`💬 Starting conversation flow: ${sessionId}`);

    // Initialize conversation
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    this.conversationCache.set(sessionId, history);

    // Create initial task
    const task = this.db.createTask({
      sessionId,
      prompt: initialPrompt,
      mode: 'general',
      model: this.defaultConfig.model || 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'high',
      attempts: 0,
      maxAttempts: 3,
      metadata: {
        conversationFlow: true,
        maxTurns,
        currentTurn: 1,
      },
    });

    this.emit('conversation:started', { taskId: task.id, sessionId });

    return task;
  }

  /**
   * Continue conversation based on previous response
   */
  async continueConversation(
    taskId: string,
    previousResponse: string,
    sessionId: string
  ): Promise<Task | null> {
    const task = this.db.getTask(taskId);
    if (!task) return null;

    const currentTurn = ((task.metadata?.currentTurn as number) || 1) + 1;
    const maxTurns = (task.metadata?.maxTurns as number) || 3;

    if (currentTurn > maxTurns) {
      console.log(`🏁 Conversation flow ended after ${maxTurns} turns`);
      this.emit('conversation:ended', { taskId, sessionId });
      return null;
    }

    // Create follow-up task
    const followUp = this.db.createTask({
      sessionId,
      prompt: `Based on the previous response: "${previousResponse}", continue the conversation.`,
      mode: 'general',
      model: this.defaultConfig.model || 'claude-3-5-sonnet',
      status: 'pending',
      priority: 'high',
      attempts: 0,
      maxAttempts: 3,
      triggeredBy: taskId,
      metadata: {
        conversationFlow: true,
        maxTurns,
        currentTurn,
      },
    });

    this.emit('conversation:continued', {
      originalTaskId: taskId,
      followUpTaskId: followUp.id,
      turn: currentTurn,
      maxTurns,
    });

    return followUp;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): Array<{ role: 'user' | 'assistant'; content: string }> {
    return this.conversationCache.get(sessionId) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(sessionId: string): void {
    this.conversationCache.delete(sessionId);
    console.log(`🗑️  Cleared conversation history for ${sessionId}`);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalExecutions: number;
    totalTokensUsed: number;
    averageTokensPerExecution: number;
    activeConversations: number;
  } {
    return {
      totalExecutions: this.executionCount,
      totalTokensUsed: this.totalTokensUsed,
      averageTokensPerExecution:
        this.executionCount > 0 ? Math.round(this.totalTokensUsed / this.executionCount) : 0,
      activeConversations: this.conversationCache.size,
    };
  }

  /**
   * Set custom system prompt for AI
   */
  setSystemPrompt(prompt: string): void {
    this.defaultConfig.systemPrompt = prompt;
    console.log('📝 System prompt updated');
  }

  /**
   * Set model for AI execution
   */
  setModel(model: string): void {
    this.defaultConfig.model = model;
    console.log(`🔄 AI model set to: ${model}`);
  }

  /**
   * Get current configuration
   */
  getConfig(): AIPromptConfig {
    return { ...this.defaultConfig };
  }
}
