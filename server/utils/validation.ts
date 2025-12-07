/**
 * Input Validation Schemas
 * Zod-based validation for all user inputs
 */

import { z } from 'zod';

// ============================================================================
// Chat Message Validation
// ============================================================================

export const ChatMessageSchema = z.object({
  type: z.literal('chat'),
  content: z.union([
    z.string().min(1).max(100000),
    z.array(z.record(z.unknown())),
  ]),
  sessionId: z.string().uuid(),
  model: z.string().optional(),
  timezone: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ============================================================================
// File Attachment Validation
// ============================================================================

const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/json',
  'text/markdown',
  'text/csv',
  'application/pdf',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const ImageAttachmentSchema = z.object({
  type: z.literal('image'),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES),
  data: z.string().refine(
    (val) => {
      // Check if valid base64 and within size limit
      try {
        const decoded = Buffer.from(val, 'base64');
        return decoded.length <= MAX_IMAGE_SIZE;
      } catch {
        return false;
      }
    },
    { message: `Image must be valid base64 and under ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }
  ),
  filename: z.string()
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters')
    .optional(),
});

export const FileAttachmentSchema = z.object({
  type: z.literal('file'),
  mimeType: z.enum(ALLOWED_FILE_TYPES),
  data: z.string().refine(
    (val) => {
      try {
        const decoded = Buffer.from(val, 'base64');
        return decoded.length <= MAX_FILE_SIZE;
      } catch {
        return false;
      }
    },
    { message: `File must be valid base64 and under ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  ),
  filename: z.string()
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
});

export const AttachmentSchema = z.discriminatedUnion('type', [
  ImageAttachmentSchema,
  FileAttachmentSchema,
]);

export type Attachment = z.infer<typeof AttachmentSchema>;

// ============================================================================
// Session Validation
// ============================================================================

export const SessionIdSchema = z.string().uuid();

export const CreateSessionSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  workingDirectory: z.string().max(4096).optional(),
  mode: z.enum(['chat', 'agent', 'code']).optional().default('chat'),
  model: z.string().optional(),
});

export const UpdateSessionSchema = z.object({
  sessionId: SessionIdSchema,
  title: z.string().min(1).max(500).optional(),
  workingDirectory: z.string().max(4096).optional(),
  permissionMode: z.enum(['default', 'acceptEdits', 'bypassPermissions', 'plan', 'autonom']).optional(),
  mode: z.enum(['chat', 'agent', 'code']).optional(),
  model: z.string().optional(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type UpdateSession = z.infer<typeof UpdateSessionSchema>;

// ============================================================================
// Directory Validation
// ============================================================================

export const DirectoryPathSchema = z.string()
  .min(1)
  .max(4096)
  .refine(
    (val) => !val.includes('\0'),
    { message: 'Path contains null bytes' }
  )
  .refine(
    (val) => !/\.\.[\\/]/.test(val.replace(/^~/, '')),
    { message: 'Path traversal not allowed' }
  );

export const DirectoryRequestSchema = z.object({
  path: DirectoryPathSchema,
  createIfMissing: z.boolean().optional().default(false),
});

export type DirectoryRequest = z.infer<typeof DirectoryRequestSchema>;

// ============================================================================
// WebSocket Message Validation
// ============================================================================

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  ChatMessageSchema,
  z.object({
    type: z.literal('approve_plan'),
    sessionId: SessionIdSchema,
    approved: z.boolean(),
  }),
  z.object({
    type: z.literal('set_permission_mode'),
    sessionId: SessionIdSchema,
    mode: z.enum(['default', 'acceptEdits', 'bypassPermissions', 'plan', 'autonom']),
  }),
  z.object({
    type: z.literal('kill_background_process'),
    sessionId: SessionIdSchema,
    processId: z.string(),
  }),
  z.object({
    type: z.literal('stop_generation'),
    sessionId: SessionIdSchema,
  }),
  z.object({
    type: z.literal('answer_question'),
    sessionId: SessionIdSchema,
    questionId: z.string(),
    answer: z.record(z.string(), z.string()),
  }),
  z.object({
    type: z.literal('cancel_question'),
    sessionId: SessionIdSchema,
    questionId: z.string(),
  }),
]);

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// ============================================================================
// API Key Validation
// ============================================================================

export const ApiKeySchema = z.string()
  .min(20)
  .max(200)
  .regex(/^(sk-|sk-ant-)/i, 'Invalid API key format');

// ============================================================================
// Model Selection Validation
// ============================================================================

export const ModelIdSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid model ID format');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate and parse input with detailed error messages
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
}

/**
 * Create a validated request handler wrapper
 */
export function withValidation<T, R>(
  schema: z.ZodSchema<T>,
  handler: (data: T) => Promise<R>
): (data: unknown) => Promise<R> {
  return async (data: unknown) => {
    const result = validateInput(schema, data);

    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors.join(', ')}`);
    }

    return handler(result.data);
  };
}

/**
 * Sanitize string for safe display (prevent XSS in logs etc)
 */
export function sanitizeForDisplay(str: string, maxLength: number = 100): string {
  return str
    .replace(/[<>'"&]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, '')
    .slice(0, maxLength);
}
