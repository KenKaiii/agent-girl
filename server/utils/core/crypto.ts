/**
 * Cryptographic Utilities
 * Secure encryption/decryption for sensitive data like OAuth tokens
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'crypto';
import { homedir, hostname } from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const _TAG_LENGTH = 16; // GCM tag length (16 bytes), kept for documentation
const SALT_LENGTH = 32;

export interface EncryptedData {
  encrypted: string;  // Base64 encoded
  iv: string;         // Base64 encoded
  tag: string;        // Base64 encoded
  salt: string;       // Base64 encoded (for key derivation)
  version: number;    // Schema version for future upgrades
}

/**
 * Get or create machine-specific secret for key derivation
 * This is NOT the encryption key, but contributes to key derivation
 */
function getMachineSecret(): string {
  const configDir = join(homedir(), '.agent-girl');
  const secretFile = join(configDir, '.machine-secret');

  try {
    if (existsSync(secretFile)) {
      return readFileSync(secretFile, 'utf-8').trim();
    }

    // Create new machine secret
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }

    const secret = randomBytes(32).toString('base64');
    writeFileSync(secretFile, secret, { mode: 0o600 });

    return secret;
  } catch {
    // Fallback to hostname-based derivation if file ops fail
    return createHash('sha256').update(`${hostname()}-agent-girl-fallback`).digest('base64');
  }
}

/**
 * Derive encryption key from machine secret and salt
 */
function deriveKey(salt: Buffer): Buffer {
  const machineSecret = getMachineSecret();

  // Use scrypt for key derivation (memory-hard, resistant to GPU attacks)
  return scryptSync(machineSecret, salt, KEY_LENGTH, {
    N: 16384,   // CPU/memory cost
    r: 8,       // Block size
    p: 1,       // Parallelization
  });
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(plaintext: string): EncryptedData {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from machine secret and salt
  const key = deriveKey(salt);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get authentication tag
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    salt: salt.toString('base64'),
    version: 1,
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(data: EncryptedData): string {
  // Validate version
  if (data.version !== 1) {
    throw new Error(`Unsupported encryption version: ${data.version}`);
  }

  // Decode from base64
  const salt = Buffer.from(data.salt, 'base64');
  const iv = Buffer.from(data.iv, 'base64');
  const tag = Buffer.from(data.tag, 'base64');

  // Derive key using same salt
  const key = deriveKey(salt);

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  // Decrypt
  let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt an object (JSON serializable)
 */
export function encryptObject<T>(obj: T): EncryptedData {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt to an object
 */
export function decryptObject<T>(data: EncryptedData): T {
  const json = decrypt(data);
  return JSON.parse(json) as T;
}

/**
 * Check if data is encrypted (has expected structure)
 */
export function isEncrypted(data: unknown): data is EncryptedData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  return (
    typeof obj.encrypted === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.tag === 'string' &&
    typeof obj.salt === 'string' &&
    typeof obj.version === 'number'
  );
}

/**
 * Secure comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }

  return result === 0;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Hash a value (one-way, for comparison)
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('base64');
}

/**
 * Mask sensitive value for logging (show first 3 and last 3 chars)
 */
export function maskSensitive(value: string, visibleChars: number = 3): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }

  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(10, value.length - visibleChars * 2));

  return `${start}${masked}${end}`;
}
