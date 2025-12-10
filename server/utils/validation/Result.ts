/**
 * Result Type for Error Handling
 * Provides a consistent way to handle success/failure across the codebase
 */

/**
 * Result type - either success with value or failure with error
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a successful result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create a failed result
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Check if result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

/**
 * Check if result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap a result with a default value if error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Map the success value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

/**
 * Map the error value
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.ok) {
    return Err(fn(result.error));
  }
  return result;
}

/**
 * Chain results together (flatMap)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * Try an operation, returning a Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Try an async operation, returning a Result
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return Ok(await fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Combine multiple results into one
 * Returns first error or array of all values
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return Ok(values);
}

/**
 * Custom error types for the application
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(
    public resource: string,
    public id?: string
  ) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends Error {
  constructor(
    public action: string,
    public resource?: string
  ) {
    super(`Permission denied: ${action}${resource ? ` on ${resource}` : ''}`);
    this.name = 'PermissionError';
  }
}

export class RateLimitError extends Error {
  constructor(
    public retryAfter?: number
  ) {
    super(`Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}ms` : ''}`);
    this.name = 'RateLimitError';
  }
}

/**
 * Convert an error to a user-friendly message
 */
export function toUserMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return error.field
      ? `Invalid ${error.field}: ${error.message}`
      : error.message;
  }

  if (error instanceof NotFoundError) {
    return `${error.resource} not found`;
  }

  if (error instanceof AuthenticationError) {
    return 'Please log in to continue';
  }

  if (error instanceof PermissionError) {
    return 'You do not have permission to perform this action';
  }

  if (error instanceof RateLimitError) {
    return 'Too many requests. Please wait and try again.';
  }

  // Generic error - don't expose internal details
  return 'An unexpected error occurred';
}
