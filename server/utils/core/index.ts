/**
 * Agent Girl - Core utilities barrel export
 * Fundamental utilities like logging, crypto, and path security
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export { logger } from './logger';
export type { LogLevel, LogContext, LogEntry } from './logger';
export { encrypt, decrypt, encryptObject, decryptObject, isEncrypted, generateSecureToken, hashValue, maskSensitive, secureCompare } from './crypto';
export type { EncryptedData } from './crypto';
export { sanitizePath, isPathSafe, validateDirectoryPath, validateFilePath, getSafeRelativePath, sanitizeFilename, getDefaultAllowedBases } from './pathSecurity';
export type { PathValidationResult } from './pathSecurity';
export { generateSectionId } from './sectionIdGenerator';
