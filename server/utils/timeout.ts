/**
 * Timeout Wrapper Utility
 * Wraps async operations with timeout and warning notifications
 * Includes activity-based hang detection for agents that stop producing output
 */

export interface TimeoutOptions {
  /** Total timeout in milliseconds (default: 120000ms / 2 minutes) */
  timeoutMs?: number;
  /** Warning time in milliseconds (default: 60000ms / 1 minute) */
  warningMs?: number;
  /** Callback when warning threshold is reached */
  onWarning?: () => void;
  /** Callback when timeout is reached */
  onTimeout?: () => void;
}

export interface ActivityTimeoutOptions extends TimeoutOptions {
  /** Time without activity before hang warning (default: 90000ms / 1.5 minutes) */
  hangWarningMs?: number;
  /** Time without activity before hang abort (default: 180000ms / 3 minutes) */
  hangAbortMs?: number;
  /** Callback when no activity detected for hangWarningMs */
  onHangWarning?: (lastActivityType: string, silentMs: number) => void;
  /** Callback when no activity detected for hangAbortMs */
  onHangAbort?: (lastActivityType: string, silentMs: number) => void;
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wrap an async generator with timeout and warning notifications
 * This is specifically designed for the Claude SDK's query() which returns AsyncGenerator
 */
export async function* withTimeoutGenerator<T>(
  generator: AsyncGenerator<T>,
  options: TimeoutOptions = {}
): AsyncGenerator<T> {
  const {
    timeoutMs = 120000,  // 2 minutes default
    warningMs = 60000,   // 1 minute default
    onWarning,
    onTimeout,
  } = options;

  let warningFired = false;
  let timeoutFired = false;

  // Set up warning timer
  const warningTimer = setTimeout(() => {
    if (!warningFired) {
      warningFired = true;
      onWarning?.();
    }
  }, warningMs);

  // Set up timeout timer
  const timeoutTimer = setTimeout(() => {
    if (!timeoutFired) {
      timeoutFired = true;
      onTimeout?.();
      // We can't easily abort an AsyncGenerator, so we rely on the consumer
      // to handle the timeout notification and stop consuming
    }
  }, timeoutMs);

  try {
    // Track last activity time
    let _lastActivityTime = Date.now();

    for await (const value of generator) {
      // Update last activity on each yield
      _lastActivityTime = Date.now();

      // Check if timeout has fired
      if (timeoutFired) {
        throw new TimeoutError(`Operation timed out after ${timeoutMs}ms`);
      }

      yield value;
    }
  } finally {
    // Clean up timers
    clearTimeout(warningTimer);
    clearTimeout(timeoutTimer);
  }
}

/**
 * Wrap a Promise with timeout (for non-generator async operations)
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const {
    timeoutMs = 120000,  // 2 minutes default
    warningMs = 60000,   // 1 minute default
    onWarning,
    onTimeout,
  } = options;

  let warningFired = false;

  // Set up warning timer
  const warningTimer = setTimeout(() => {
    if (!warningFired) {
      warningFired = true;
      onWarning?.();
    }
  }, warningMs);

  // Set up timeout timer
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      onTimeout?.();
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(warningTimer);
  }
}

/**
 * Create a timeout controller that can be used to track elapsed time
 * and send periodic updates
 */
export class TimeoutController {
  private startTime: number;
  private warningMs: number;
  private timeoutMs: number;
  private warningFired = false;
  private timeoutFired = false;
  private warningTimer?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;
  private onWarning?: () => void;
  private onTimeout?: () => void;

  constructor(options: TimeoutOptions = {}) {
    this.startTime = Date.now();
    this.warningMs = options.warningMs || 60000;
    this.timeoutMs = options.timeoutMs || 120000;
    this.onWarning = options.onWarning;
    this.onTimeout = options.onTimeout;

    // Start timers
    this.warningTimer = setTimeout(() => {
      if (!this.warningFired) {
        this.warningFired = true;
        this.onWarning?.();
      }
    }, this.warningMs);

    this.timeoutTimer = setTimeout(() => {
      if (!this.timeoutFired) {
        this.timeoutFired = true;
        this.onTimeout?.();
      }
    }, this.timeoutMs);
  }

  /** Get elapsed time in milliseconds */
  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  /** Get elapsed time in seconds */
  getElapsedSeconds(): number {
    return Math.floor(this.getElapsed() / 1000);
  }

  /** Check if warning threshold was reached */
  hasWarning(): boolean {
    return this.warningFired;
  }

  /** Check if timeout threshold was reached */
  hasTimeout(): boolean {
    return this.timeoutFired;
  }

  /** Cancel timers and clean up */
  cancel(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
  }

  /** Reset the timeout timer (used for inactivity timeout) */
  reset(): void {
    this.startTime = Date.now();
    this.warningFired = false;
    this.timeoutFired = false;

    // Clear existing timers
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    // Restart timers
    this.warningTimer = setTimeout(() => {
      if (!this.warningFired) {
        this.warningFired = true;
        this.onWarning?.();
      }
    }, this.warningMs);

    this.timeoutTimer = setTimeout(() => {
      if (!this.timeoutFired) {
        this.timeoutFired = true;
        this.onTimeout?.();
      }
    }, this.timeoutMs);
  }

  /** Throw error if timeout was reached */
  checkTimeout(): void {
    if (this.timeoutFired) {
      throw new TimeoutError(`Operation timed out after ${this.timeoutMs}ms`);
    }
  }
}

/**
 * Activity-based timeout controller for agent hang detection
 * Tracks activity types (text, thinking, tool_use) and detects when agents stop producing output
 */
export class ActivityTimeoutController extends TimeoutController {
  private lastActivityTime: number;
  private lastActivityType: string = 'init';
  private hangWarningMs: number;
  private hangAbortMs: number;
  private hangWarningFired = false;
  private hangAbortFired = false;
  private hangCheckInterval?: NodeJS.Timeout;
  private onHangWarning?: (lastActivityType: string, silentMs: number) => void;
  private onHangAbort?: (lastActivityType: string, silentMs: number) => void;

  // Output token tracking for 25000 token limit workaround
  private outputTokenCount = 0;
  private readonly OUTPUT_TOKEN_WARNING = 20000; // Warn at 80% of limit
  private readonly OUTPUT_TOKEN_LIMIT = 24000; // Safe limit before API cuts off
  private outputTokenWarningFired = false;
  private onOutputTokenWarning?: (tokenCount: number) => void;
  private onOutputTokenLimit?: (tokenCount: number) => void;

  constructor(options: ActivityTimeoutOptions = {}) {
    super(options);
    this.lastActivityTime = Date.now();
    this.hangWarningMs = options.hangWarningMs || 90000;  // 1.5 minutes default
    this.hangAbortMs = options.hangAbortMs || 180000;     // 3 minutes default
    this.onHangWarning = options.onHangWarning;
    this.onHangAbort = options.onHangAbort;

    // Start hang detection interval (check every 10 seconds)
    this.hangCheckInterval = setInterval(() => {
      this.checkHang();
    }, 10000);
  }

  /**
   * Record activity with type for debugging
   */
  recordActivity(activityType: string): void {
    this.lastActivityTime = Date.now();
    this.lastActivityType = activityType;
    this.hangWarningFired = false; // Reset warning on activity
    // Note: Don't reset hangAbortFired - if we recovered, great, but track it
  }

  /**
   * Add output tokens to counter (for 25000 limit tracking)
   */
  addOutputTokens(count: number): void {
    this.outputTokenCount += count;

    // Check warning threshold
    if (!this.outputTokenWarningFired && this.outputTokenCount >= this.OUTPUT_TOKEN_WARNING) {
      this.outputTokenWarningFired = true;
      this.onOutputTokenWarning?.(this.outputTokenCount);
    }

    // Check limit threshold
    if (this.outputTokenCount >= this.OUTPUT_TOKEN_LIMIT) {
      this.onOutputTokenLimit?.(this.outputTokenCount);
    }
  }

  /**
   * Get current output token count
   */
  getOutputTokenCount(): number {
    return this.outputTokenCount;
  }

  /**
   * Reset output token counter (for new turn)
   */
  resetOutputTokens(): void {
    this.outputTokenCount = 0;
    this.outputTokenWarningFired = false;
  }

  /**
   * Check if we're approaching output token limit
   */
  isApproachingOutputLimit(): boolean {
    return this.outputTokenCount >= this.OUTPUT_TOKEN_WARNING;
  }

  /**
   * Set output token callbacks
   */
  setOutputTokenCallbacks(
    onWarning?: (tokenCount: number) => void,
    onLimit?: (tokenCount: number) => void
  ): void {
    this.onOutputTokenWarning = onWarning;
    this.onOutputTokenLimit = onLimit;
  }

  /**
   * Check for hang condition
   */
  private checkHang(): void {
    const silentMs = Date.now() - this.lastActivityTime;

    // Check hang abort threshold
    if (!this.hangAbortFired && silentMs >= this.hangAbortMs) {
      this.hangAbortFired = true;
      console.log(`🔴 [HANG ABORT] No activity for ${Math.floor(silentMs / 1000)}s (last: ${this.lastActivityType})`);
      this.onHangAbort?.(this.lastActivityType, silentMs);
      return;
    }

    // Check hang warning threshold
    if (!this.hangWarningFired && silentMs >= this.hangWarningMs) {
      this.hangWarningFired = true;
      console.log(`⚠️ [HANG WARNING] No activity for ${Math.floor(silentMs / 1000)}s (last: ${this.lastActivityType})`);
      this.onHangWarning?.(this.lastActivityType, silentMs);
    }
  }

  /**
   * Get time since last activity
   */
  getSilentTime(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Get last activity info
   */
  getLastActivity(): { type: string; timeAgo: number } {
    return {
      type: this.lastActivityType,
      timeAgo: this.getSilentTime(),
    };
  }

  /**
   * Check if hang was detected
   */
  hasHang(): boolean {
    return this.hangAbortFired;
  }

  /**
   * Override cancel to also clear hang interval
   */
  override cancel(): void {
    super.cancel();
    if (this.hangCheckInterval) {
      clearInterval(this.hangCheckInterval);
      this.hangCheckInterval = undefined;
    }
  }

  /**
   * Override reset to also reset hang detection state
   */
  override reset(): void {
    super.reset();
    this.lastActivityTime = Date.now();
    this.hangWarningFired = false;
    this.hangAbortFired = false;
  }
}

/**
 * HangError for hang detection
 */
export class HangError extends Error {
  constructor(public lastActivityType: string, public silentMs: number) {
    super(`Agent hang detected: no activity for ${Math.floor(silentMs / 1000)}s (last activity: ${lastActivityType})`);
    this.name = 'HangError';
  }
}
