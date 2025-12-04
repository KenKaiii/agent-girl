import fs from 'fs/promises';
import path from 'path';
import { OAuthTokens } from './oauth';
import { encrypt, decrypt, isEncrypted, EncryptedData } from './utils/crypto';
import { logger } from './utils/logger';

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.agent-girl');
const TOKEN_FILE = path.join(CONFIG_DIR, 'oauth-tokens.json');
const ENCRYPTED_TOKEN_FILE = path.join(CONFIG_DIR, 'oauth-tokens.enc.json');

export interface StoredAuth {
  anthropic?: OAuthTokens;
}

interface EncryptedStoredAuth {
  anthropic?: EncryptedData;
  version: number;
}

/**
 * Ensure config directory exists with proper permissions
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  } catch {
    // Directory might already exist, that's OK
  }
}

/**
 * Migrate from plaintext to encrypted storage
 */
async function migrateToEncrypted(): Promise<void> {
  try {
    const plainData = await fs.readFile(TOKEN_FILE, 'utf-8');
    const auth = JSON.parse(plainData) as StoredAuth;

    if (auth.anthropic) {
      // Encrypt and save to new file
      const encrypted: EncryptedStoredAuth = {
        anthropic: encrypt(JSON.stringify(auth.anthropic)),
        version: 1,
      };
      await fs.writeFile(ENCRYPTED_TOKEN_FILE, JSON.stringify(encrypted, null, 2), {
        encoding: 'utf-8',
        mode: 0o600,
      });

      // Remove old plaintext file
      await fs.unlink(TOKEN_FILE);
      logger.info('Migrated OAuth tokens to encrypted storage');
    }
  } catch {
    // Old file doesn't exist or already migrated
  }
}

/**
 * Load OAuth tokens from encrypted storage
 */
export async function loadTokens(): Promise<StoredAuth> {
  try {
    await ensureConfigDir();

    // Try to migrate from old plaintext file
    await migrateToEncrypted();

    // Load encrypted file
    const data = await fs.readFile(ENCRYPTED_TOKEN_FILE, 'utf-8');
    const stored = JSON.parse(data) as EncryptedStoredAuth;

    if (!stored.anthropic) {
      return {};
    }

    // Decrypt tokens
    if (isEncrypted(stored.anthropic)) {
      const decrypted = decrypt(stored.anthropic);
      return {
        anthropic: JSON.parse(decrypted) as OAuthTokens,
      };
    }

    return {};
  } catch (error) {
    // Log specific error types for debugging
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        // File doesn't exist - not an error
        return {};
      }
      logger.warn('Failed to load tokens', { error: error.message });
    }
    return {};
  }
}

/**
 * Save OAuth tokens to encrypted storage
 */
export async function saveTokens(tokens: OAuthTokens): Promise<void> {
  await ensureConfigDir();

  // Encrypt tokens before saving
  const encrypted: EncryptedStoredAuth = {
    anthropic: encrypt(JSON.stringify(tokens)),
    version: 1,
  };

  await fs.writeFile(ENCRYPTED_TOKEN_FILE, JSON.stringify(encrypted, null, 2), {
    encoding: 'utf-8',
    mode: 0o600, // Read/write for owner only
  });

  logger.info('OAuth tokens saved (encrypted)');
}

/**
 * Get Anthropic OAuth tokens if they exist
 */
export async function getAnthropicTokens(): Promise<OAuthTokens | null> {
  const auth = await loadTokens();
  return auth.anthropic || null;
}

/**
 * Clear all OAuth tokens (logout)
 */
export async function clearTokens(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
    console.log('✅ Logged out successfully');
  } catch {
    // File might not exist, that's OK
    console.log('✅ Logged out successfully');
  }
}

/**
 * Check if user is logged in with OAuth
 */
export async function isLoggedIn(): Promise<boolean> {
  const tokens = await getAnthropicTokens();
  return tokens !== null;
}
