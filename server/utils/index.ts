/**
 * Utility Exports
 * Central export point for all server utilities
 */

// Rate Limiting
export { TokenBucketRateLimiter, wsRateLimiter, expensiveOpLimiter } from './rateLimiter';

// Path Security
export {
  sanitizePath,
  isPathSafe,
  validateDirectoryPath,
  validateFilePath,
  getSafeRelativePath,
  sanitizeFilename,
  getDefaultAllowedBases,
} from './pathSecurity';

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
} from './crypto';
export type { EncryptedData } from './crypto';

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
} from './validation';

// Logger
export { logger } from './logger';
export type { LogLevel, LogContext, LogEntry } from './logger';

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
} from './Result';
export type { Result } from './Result';
