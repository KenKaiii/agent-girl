/**
 * API Error Handler Utility
 * Parses and categorizes errors from Claude API and other providers
 */

export type ApiErrorType =
  | 'invalid_request_error'      // 400 - Bad request format
  | 'authentication_error'       // 401 - Invalid API key
  | 'permission_error'           // 403 - Insufficient permissions
  | 'not_found_error'            // 404 - Resource not found
  | 'request_too_large'          // 413 - Request exceeds 32 MB
  | 'rate_limit_error'           // 429 - Rate limit exceeded
  | 'api_error'                  // 500 - Internal API error
  | 'overloaded_error'           // 529 - API overloaded
  | 'timeout_error'              // 408/504 - Request timeout
  | 'network_error'              // Network/connection failure
  | 'insufficient_credits'       // Credit exhaustion
  | 'sdk_process_error'          // SDK subprocess exit error
  | 'unknown_error';             // Fallback

export interface ParsedApiError {
  type: ApiErrorType;
  message: string;
  isRetryable: boolean;
  retryAfterSeconds?: number;
  requestId?: string;
  statusCode?: number;
  stderrContext?: string;
  originalError?: unknown;
}

/**
 * Check if error is retryable (should be retried automatically)
 */
export function isRetryableError(errorType: ApiErrorType): boolean {
  return [
    'api_error',
    'overloaded_error',
    'timeout_error',
    'network_error',
    'rate_limit_error', // Retryable if we respect retry-after
  ].includes(errorType);
}

/**
 * Parse error from API response or exception
 * @param error The error object to parse
 * @param stderrContext Optional stderr output from SDK subprocess for context
 */
export function parseApiError(error: unknown, stderrContext?: string): ParsedApiError {
  // Default unknown error
  const defaultError: ParsedApiError = {
    type: 'unknown_error',
    message: 'An unexpected error occurred',
    isRetryable: false,
    originalError: error,
    stderrContext,
  };

  // Handle Error objects
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const stderrLower = stderrContext?.toLowerCase() || '';

    // Check for authentication errors in error message or stderr (check first, most critical)
    if (
      errorMessage.includes('invalid api key') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401') ||
      stderrLower.includes('invalid api key') ||
      stderrLower.includes('authentication') ||
      stderrLower.includes('unauthorized') ||
      stderrLower.includes('401')
    ) {
      return {
        type: 'authentication_error',
        message: 'Invalid API key. Please check your API key configuration.',
        isRetryable: false,
        stderrContext,
        originalError: error,
      };
    }

    // Check for permission errors in error message or stderr
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('403') ||
      stderrLower.includes('permission') ||
      stderrLower.includes('forbidden') ||
      stderrLower.includes('403')
    ) {
      return {
        type: 'permission_error',
        message: 'Your API key does not have permission to access this model or resource.',
        isRetryable: false,
        stderrContext,
        originalError: error,
      };
    }

    // Check for rate limit errors in error message or stderr
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429') ||
      stderrLower.includes('rate limit') ||
      stderrLower.includes('429')
    ) {
      return {
        type: 'rate_limit_error',
        message: 'Rate limit exceeded. Please wait a moment and try again.',
        isRetryable: true,
        stderrContext,
        originalError: error,
      };
    }

    // Check for credit exhaustion in error message or stderr
    if (
      errorMessage.includes('credit') ||
      errorMessage.includes('insufficient') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('billing') ||
      stderrLower.includes('credit') ||
      stderrLower.includes('insufficient') ||
      stderrLower.includes('quota') ||
      stderrLower.includes('billing')
    ) {
      return {
        type: 'insufficient_credits',
        message: 'Insufficient credits. Please check your account balance and add more credits.',
        isRetryable: false,
        stderrContext,
        originalError: error,
      };
    }

    // Check for SDK process exit errors
    if (
      errorMessage.includes('process exited') ||
      errorMessage.includes('exit code') ||
      errorMessage.includes('subprocess') ||
      errorMessage.includes('spawn')
    ) {
      // Extract exit code if present
      const exitCodeMatch = errorMessage.match(/exit(?:ed with)? code (\d+)/i);
      const exitCode = exitCodeMatch ? exitCodeMatch[1] : 'unknown';

      return {
        type: 'sdk_process_error',
        message: `SDK subprocess exited with code ${exitCode}. ${stderrContext ? 'Details: ' + stderrContext : 'Check server logs for details.'}`,
        isRetryable: false,
        stderrContext,
        originalError: error,
      };
    }

    // Network/connection errors
    if (
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound') ||
      errorMessage.includes('etimedout')
    ) {
      return {
        type: 'network_error',
        message: 'Network connection failed. Check your internet connection.',
        isRetryable: true,
        stderrContext,
        originalError: error,
      };
    }

    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('deadline exceeded')
    ) {
      return {
        type: 'timeout_error',
        message: 'Request timed out. Please try again.',
        isRetryable: true,
        stderrContext,
        originalError: error,
      };
    }

    // Try to parse structured error from message
    try {
      // Check if error message contains JSON
      const jsonMatch = error.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error) {
          return parseStructuredError(parsed, error, stderrContext);
        }
      }
    } catch {
      // Not JSON, continue
    }

    // Generic error message
    return {
      ...defaultError,
      message: error.message,
    };
  }

  // Handle structured error objects (from API responses)
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Anthropic API error format: { type: "error", error: { type: "...", message: "..." } }
    if (err.type === 'error' && typeof err.error === 'object' && err.error !== null) {
      return parseStructuredError(err, error, stderrContext);
    }

    // HTTP response-like errors
    if (typeof err.status === 'number' || typeof err.statusCode === 'number') {
      const statusCode = (err.status || err.statusCode) as number;
      return parseHttpError(statusCode, err, error, stderrContext);
    }
  }

  return defaultError;
}

/**
 * Parse structured API error (Anthropic format)
 */
function parseStructuredError(errorObj: Record<string, unknown>, originalError: unknown, stderrContext?: string): ParsedApiError {
  const error = errorObj.error as Record<string, unknown>;
  const errorType = error.type as string;
  const message = error.message as string || 'Unknown error';
  const requestId = errorObj.request_id as string | undefined;

  // Map Anthropic error types
  const mappedType = mapErrorType(errorType);

  // Extract retry-after from rate limit errors
  let retryAfterSeconds: number | undefined;
  if (mappedType === 'rate_limit_error' && typeof error.retry_after === 'number') {
    retryAfterSeconds = error.retry_after;
  }

  return {
    type: mappedType,
    message: message,
    isRetryable: isRetryableError(mappedType),
    retryAfterSeconds,
    requestId,
    stderrContext,
    originalError,
  };
}

/**
 * Parse HTTP status code errors
 */
function parseHttpError(statusCode: number, errorObj: Record<string, unknown>, originalError: unknown, stderrContext?: string): ParsedApiError {
  const message = (errorObj.message || errorObj.error || 'Unknown error') as string;

  let type: ApiErrorType;
  let isRetryable = false;

  switch (statusCode) {
    case 400:
      type = 'invalid_request_error';
      break;
    case 401:
      type = 'authentication_error';
      break;
    case 403:
      type = 'permission_error';
      break;
    case 404:
      type = 'not_found_error';
      break;
    case 408:
      type = 'timeout_error';
      isRetryable = true;
      break;
    case 413:
      type = 'request_too_large';
      break;
    case 429:
      type = 'rate_limit_error';
      isRetryable = true;
      break;
    case 500:
      type = 'api_error';
      isRetryable = true;
      break;
    case 502:
    case 503:
    case 504:
      type = 'overloaded_error';
      isRetryable = true;
      break;
    case 529:
      type = 'overloaded_error';
      isRetryable = true;
      break;
    default:
      type = 'unknown_error';
  }

  return {
    type,
    message,
    isRetryable,
    statusCode,
    stderrContext,
    originalError,
  };
}

/**
 * Map Anthropic error type strings to our types
 */
function mapErrorType(errorType: string): ApiErrorType {
  const typeMap: Record<string, ApiErrorType> = {
    'invalid_request_error': 'invalid_request_error',
    'authentication_error': 'authentication_error',
    'permission_error': 'permission_error',
    'not_found_error': 'not_found_error',
    'request_too_large': 'request_too_large',
    'rate_limit_error': 'rate_limit_error',
    'api_error': 'api_error',
    'overloaded_error': 'overloaded_error',
  };

  return typeMap[errorType] || 'unknown_error';
}

/**
 * Get user-friendly error message with actionable guidance
 */
export function getUserFriendlyMessage(parsedError: ParsedApiError): string {
  switch (parsedError.type) {
    case 'insufficient_credits':
      return 'Insufficient credits. Your Anthropic account has run out of credits. Please visit console.anthropic.com to add more credits to your account.';

    case 'sdk_process_error':
      // If we have clean stderr context (not too long, looks like actual error), show it
      if (parsedError.stderrContext) {
        const cleanStderr = parsedError.stderrContext.trim();
        // Only show stderr if it's concise and looks like an actual error message
        if (cleanStderr.length < 200 && !cleanStderr.includes('WORKING DIRECTORY') && !cleanStderr.includes('--')) {
          return `Claude SDK error: ${cleanStderr}`;
        }
      }
      // Otherwise provide clean fallback
      return 'Claude SDK encountered an error. This may be due to insufficient credits, API rate limits, or network issues. Check your account balance and try again.';

    case 'authentication_error':
      return 'Invalid API key. Please check your API key configuration.';

    case 'permission_error':
      return 'Your API key does not have permission to access this model.';

    case 'rate_limit_error':
      if (parsedError.retryAfterSeconds) {
        return `Rate limit exceeded. Please wait ${parsedError.retryAfterSeconds} seconds and try again.`;
      }
      return 'Rate limit exceeded. Please wait a moment and try again.';

    case 'timeout_error':
      return 'Request timed out. The AI is taking longer than expected. Try simplifying your request or try again.';

    case 'overloaded_error':
      return 'Claude\'s servers are currently overloaded. Retrying automatically...';

    case 'api_error':
      return 'Internal API error occurred. Retrying automatically...';

    case 'network_error':
      return 'Network connection failed. Please check your internet connection.';

    case 'invalid_request_error':
      // Clean up API error message - only show if it's concise and useful
      if (parsedError.message && parsedError.message.length < 150) {
        const cleanMessage = parsedError.message.replace(/\n/g, ' ').trim();
        return `Invalid request: ${cleanMessage}`;
      }
      return 'Invalid request. Please check your input and try again.';

    case 'request_too_large':
      return 'Your request is too large (exceeds 32 MB). Try reducing the size of attachments or splitting into multiple messages.';

    case 'not_found_error':
      return 'The requested model or resource was not found.';

    default:
      return parsedError.message || 'An unexpected error occurred.';
  }
}
