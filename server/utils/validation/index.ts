/**
 * Agent Girl - Validation utilities barrel export
 * Error handling, result types, and data validation
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export { parseApiError, getUserFriendlyMessage, isRetryableError } from './apiErrors';
export type { ApiErrorType, ParsedApiError } from './apiErrors';
export { Ok, Err, isOk, isErr, unwrap, unwrapOr, map, mapErr, andThen } from './Result';
export type { Result } from './Result';
export { ChatMessageSchema, ImageAttachmentSchema, FileAttachmentSchema, AttachmentSchema, SessionIdSchema, CreateSessionSchema, UpdateSessionSchema } from './validation';
export type { ChatMessage, Attachment, CreateSession } from './validation';
