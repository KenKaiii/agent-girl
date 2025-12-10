/**
 * Token Bucket Rate Limiter
 * Prevents WebSocket abuse with configurable rate limiting
 */

interface RateLimitState {
  tokens: number;
  lastRefill: number;
  violations: number;
  blockedUntil: number;
}

interface RateLimiterConfig {
  maxTokens: number;
  refillRate: number;
  refillInterval: number;
  maxViolations: number;
  blockDuration: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxTokens: 60,           // Max requests in bucket
  refillRate: 10,          // Tokens added per interval
  refillInterval: 1000,    // Refill every 1 second
  maxViolations: 5,        // Block after 5 violations
  blockDuration: 60000,    // Block for 1 minute
};

export class TokenBucketRateLimiter {
  private limits = new Map<string, RateLimitState>();
  private config: RateLimiterConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Check if a client can proceed with a request
   * @returns true if allowed, false if rate limited
   */
  canProceed(clientId: string): boolean {
    const now = Date.now();
    let state = this.limits.get(clientId);

    if (!state) {
      state = {
        tokens: this.config.maxTokens,
        lastRefill: now,
        violations: 0,
        blockedUntil: 0,
      };
      this.limits.set(clientId, state);
    }

    // Check if client is blocked
    if (state.blockedUntil > now) {
      return false;
    }

    // Refill tokens based on elapsed time
    const elapsed = now - state.lastRefill;
    const refills = Math.floor(elapsed / this.config.refillInterval);

    if (refills > 0) {
      state.tokens = Math.min(
        this.config.maxTokens,
        state.tokens + refills * this.config.refillRate
      );
      state.lastRefill = now;
    }

    // Check if we have tokens available
    if (state.tokens > 0) {
      state.tokens--;
      // Decay violations over time
      if (elapsed > 10000 && state.violations > 0) {
        state.violations = Math.max(0, state.violations - 1);
      }
      return true;
    }

    // Rate limit hit - record violation
    state.violations++;

    if (state.violations >= this.config.maxViolations) {
      state.blockedUntil = now + this.config.blockDuration;
      console.warn(`[RateLimiter] Client ${clientId} blocked for ${this.config.blockDuration}ms`);
    }

    return false;
  }

  /**
   * Get remaining tokens for a client
   */
  getRemainingTokens(clientId: string): number {
    const state = this.limits.get(clientId);
    return state?.tokens ?? this.config.maxTokens;
  }

  /**
   * Check if a client is currently blocked
   */
  isBlocked(clientId: string): boolean {
    const state = this.limits.get(clientId);
    return state ? state.blockedUntil > Date.now() : false;
  }

  /**
   * Get time until client is unblocked (in ms)
   */
  getBlockedTimeRemaining(clientId: string): number {
    const state = this.limits.get(clientId);
    if (!state || state.blockedUntil <= Date.now()) return 0;
    return state.blockedUntil - Date.now();
  }

  /**
   * Reset rate limit for a client
   */
  reset(clientId: string): void {
    this.limits.delete(clientId);
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    totalClients: number;
    blockedClients: number;
    averageTokens: number;
  } {
    const now = Date.now();
    let blockedCount = 0;
    let totalTokens = 0;

    for (const state of this.limits.values()) {
      if (state.blockedUntil > now) blockedCount++;
      totalTokens += state.tokens;
    }

    return {
      totalClients: this.limits.size,
      blockedClients: blockedCount,
      averageTokens: this.limits.size > 0 ? totalTokens / this.limits.size : this.config.maxTokens,
    };
  }

  /**
   * Cleanup stale entries periodically
   */
  private startCleanup(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 10 * 60 * 1000; // 10 minutes

      for (const [clientId, state] of this.limits) {
        // Remove entries that haven't been accessed in a while
        if (now - state.lastRefill > staleThreshold && state.blockedUntil <= now) {
          this.limits.delete(clientId);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Singleton instance for WebSocket rate limiting
export const wsRateLimiter = new TokenBucketRateLimiter({
  maxTokens: 60,      // 60 messages
  refillRate: 10,     // +10 per second
  refillInterval: 1000,
  maxViolations: 5,
  blockDuration: 60000,
});

// Stricter limiter for expensive operations
export const expensiveOpLimiter = new TokenBucketRateLimiter({
  maxTokens: 10,      // 10 expensive ops
  refillRate: 1,      // +1 per 5 seconds
  refillInterval: 5000,
  maxViolations: 3,
  blockDuration: 300000, // 5 minute block
});

// Premium Builder API rate limiter
// More restrictive since builds are resource-intensive
export const premiumBuildLimiter = new TokenBucketRateLimiter({
  maxTokens: 5,       // Max 5 builds
  refillRate: 1,      // +1 per minute
  refillInterval: 60000,
  maxViolations: 3,
  blockDuration: 600000, // 10 minute block for abuse
});

// Premium edit operations limiter
export const premiumEditLimiter = new TokenBucketRateLimiter({
  maxTokens: 30,      // 30 edits per bucket
  refillRate: 5,      // +5 per 10 seconds
  refillInterval: 10000,
  maxViolations: 5,
  blockDuration: 120000, // 2 minute block
});
