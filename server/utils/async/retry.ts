/**
 * Retry Logic Utility
 * Automatic retry with exponential backoff for transient failures
 */

import { parseApiError, type ParsedApiError } from './apiErrors';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 2000ms) */
  initialDelayMs?: number;
  /** Backoff multiplier (default: 2 for exponential backoff) */
  backoffMultiplier?: number;
  /** Maximum delay between retries in milliseconds (default: 16000ms) */
  maxDelayMs?: number;
  /** Callback before each retry attempt */
  onRetry?: (attempt: number, error: ParsedApiError, delayMs: number) => void;
  /** Callback when max attempts reached */
  onMaxAttemptsReached?: (error: ParsedApiError) => void;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  backoffMultiplier: number,
  maxDelayMs: number
): number {
  const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Retry an async operation with exponential backoff
 * Works with Promise-returning functions
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 2000,
    backoffMultiplier = 2,
    maxDelayMs = 16000,
    onRetry,
    onMaxAttemptsReached,
  } = options;

  let lastError: ParsedApiError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Parse the error
      const parsedError = parseApiError(error);
      lastError = parsedError;

      // Check if error is retryable
      if (!parsedError.isRetryable) {
        // Non-retryable error, throw immediately
        throw error;
      }

      // Check if we've exhausted attempts
      if (attempt >= maxAttempts) {
        onMaxAttemptsReached?.(parsedError);
        throw error;
      }

      // Calculate delay (respect rate limit retry-after if present)
      let delayMs = calculateDelay(attempt, initialDelayMs, backoffMultiplier, maxDelayMs);
      if (parsedError.type === 'rate_limit_error' && parsedError.retryAfterSeconds) {
        delayMs = parsedError.retryAfterSeconds * 1000;
      }

      // Notify before retry
      onRetry?.(attempt, parsedError, delayMs);

      // Log retry attempt
      console.log(`⏳ Retrying after error (attempt ${attempt}/${maxAttempts}):`, {
        errorType: parsedError.type,
        message: parsedError.message,
        delayMs,
        requestId: parsedError.requestId,
      });

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError?.originalError || new Error('Retry failed');
}

/**
 * Retry an async generator with exponential backoff
 * This is specifically designed for the Claude SDK's query() which returns AsyncGenerator
 *
 * Note: This wraps the entire generator, so if it fails mid-stream, it will restart from the beginning.
 * For partial retry (resume from failure point), you'd need more complex state management.
 */
export async function* withRetryGenerator<T>(
  generatorFactory: () => AsyncGenerator<T>,
  options: RetryOptions = {}
): AsyncGenerator<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 2000,
    backoffMultiplier = 2,
    maxDelayMs = 16000,
    onRetry,
    onMaxAttemptsReached,
  } = options;

  let lastError: ParsedApiError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Create a new generator for this attempt
      const generator = generatorFactory();

      // Yield all values from the generator
      for await (const value of generator) {
        yield value;
      }

      // If we successfully completed, return
      return;
    } catch (error) {
      // Parse the error
      const parsedError = parseApiError(error);
      lastError = parsedError;

      // Check if error is retryable
      if (!parsedError.isRetryable) {
        // Non-retryable error, throw immediately
        throw error;
      }

      // Check if we've exhausted attempts
      if (attempt >= maxAttempts) {
        onMaxAttemptsReached?.(parsedError);
        throw error;
      }

      // Calculate delay (respect rate limit retry-after if present)
      let delayMs = calculateDelay(attempt, initialDelayMs, backoffMultiplier, maxDelayMs);
      if (parsedError.type === 'rate_limit_error' && parsedError.retryAfterSeconds) {
        delayMs = parsedError.retryAfterSeconds * 1000;
      }

      // Notify before retry
      onRetry?.(attempt, parsedError, delayMs);

      // Log retry attempt
      console.log(`⏳ Retrying generator after error (attempt ${attempt}/${maxAttempts}):`, {
        errorType: parsedError.type,
        message: parsedError.message,
        delayMs,
        requestId: parsedError.requestId,
      });

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError?.originalError || new Error('Retry failed');
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.isRetryable;
}

/**
 * Get retry delay for an error (respects rate limit retry-after)
 */
export function getRetryDelay(
  error: unknown,
  attempt: number,
  options: Pick<RetryOptions, 'initialDelayMs' | 'backoffMultiplier' | 'maxDelayMs'> = {}
): number {
  const parsed = parseApiError(error);
  const {
    initialDelayMs = 2000,
    backoffMultiplier = 2,
    maxDelayMs = 16000,
  } = options;

  // Respect rate limit retry-after
  if (parsed.type === 'rate_limit_error' && parsed.retryAfterSeconds) {
    return parsed.retryAfterSeconds * 1000;
  }

  // Exponential backoff
  return calculateDelay(attempt, initialDelayMs, backoffMultiplier, maxDelayMs);
}
