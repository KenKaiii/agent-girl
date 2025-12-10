/**
 * Utility Exports
 * Central export point for all server utilities
 * REFACTORED: Imports now route through organized subfolders (core, async, validation, api)
 * Backward compatibility: All exports remain unchanged for existing code
 */

// CORE UTILITIES
// Path Security
export {
  sanitizePath,
  isPathSafe,
  validateDirectoryPath,
  validateFilePath,
  getSafeRelativePath,
  sanitizeFilename,
  getDefaultAllowedBases,
} from './core/pathSecurity';

// Cryptography
export {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  isEncrypted,
  secureCompare,
  generateSecureToken,
  hashValue,
  maskSensitive,
} from './core/crypto';
export type { EncryptedData } from './core/crypto';

// Logger
export { logger } from './core/logger';
export type { LogLevel, LogContext, LogEntry } from './core/logger';

// VALIDATION UTILITIES
// Input Validation
export {
  ChatMessageSchema,
  ImageAttachmentSchema,
  FileAttachmentSchema,
  AttachmentSchema,
  SessionIdSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  DirectoryPathSchema,
  DirectoryRequestSchema,
  WebSocketMessageSchema,
  ApiKeySchema,
  ModelIdSchema,
  validateInput,
  withValidation,
  sanitizeForDisplay,
} from './validation/validation';

// Result Type & Error Handling
export {
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  andThen,
  tryCatch,
  tryCatchAsync,
  all,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  PermissionError,
  RateLimitError,
  toUserMessage,
} from './validation/Result';
export type { Result } from './validation/Result';

// API UTILITIES
// Rate Limiting
export { TokenBucketRateLimiter, wsRateLimiter, expensiveOpLimiter } from './api/rateLimiter';
