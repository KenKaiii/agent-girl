import crypto from 'crypto';
import { open } from 'openurl';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

// OAuth Client ID - load from environment for security
const CLIENT_ID = process.env.OAUTH_CLIENT_ID || '9d1c250a-e61b-44d9-88ed-5944d1962f5e';

// Log warning if using default (in development only)
if (!process.env.OAUTH_CLIENT_ID && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  Using default OAUTH_CLIENT_ID. Set OAUTH_CLIENT_ID env var for production.');
}
const AUTHORIZATION_URL = 'https://claude.ai/oauth/authorize';
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback';

export interface OAuthTokens {
  type: 'oauth';
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Generate PKCE challenge for OAuth flow
 */
export function generatePKCE(): PKCEChallenge {
  // Generate code verifier (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');

  // Generate code challenge (SHA256 hash of verifier)
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return {
    codeVerifier,
    codeChallenge,
  };
}

/**
 * Generate authorization URL for OAuth flow
 */
export function getAuthorizationURL(codeChallenge: string, codeVerifier: string): string {
  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set('code', 'true');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', 'org:create_api_key user:profile user:inference');
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('state', codeVerifier); // Use verifier as state for CSRF protection

  return url.toString();
}

/**
 * Exchange authorization code for tokens
 * The response format from Claude is: code#state
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<OAuthTokens> {
  // Split code and state (format: code#state)
  const splits = code.split('#');
  const authCode = splits[0];
  const state = splits[1] || codeVerifier; // Use verifier if state not present

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: authCode,
      state: state,
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    type: 'oauth',
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    type: 'oauth',
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(expiresAt: number): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= (expiresAt - fiveMinutes);
}

/**
 * Check if running in WSL (Windows Subsystem for Linux)
 */
function isWSL(): boolean {
  try {
    // Check /proc/version for WSL indicators
    if (fs.existsSync('/proc/version')) {
      const version = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      return version.includes('microsoft') || version.includes('wsl');
    }
  } catch {
    // Ignore errors
  }
  return false;
}

/**
 * Open URL in browser - WSL-aware
 */
async function openBrowser(url: string): Promise<void> {
  if (isWSL()) {
    // In WSL, use Windows command to open browser
    // cmd.exe /c start opens URL in default Windows browser
    try {
      await execAsync(`cmd.exe /c start "${url.replace(/"/g, '\\"')}"`);
    } catch {
      // Fallback: try powershell
      try {
        await execAsync(`powershell.exe -c Start '${url.replace(/'/g, "''")}'`);
      } catch {
        throw new Error('Failed to open browser in WSL');
      }
    }
  } else {
    // Non-WSL: use openurl package (handles macOS, Linux, Windows)
    await open(url);
  }
}

/**
 * Start OAuth flow - opens browser and returns authorization URL
 */
export async function startOAuthFlow(): Promise<{ authUrl: string; pkce: PKCEChallenge }> {
  const pkce = generatePKCE();
  const authUrl = getAuthorizationURL(pkce.codeChallenge, pkce.codeVerifier);

  console.log('\n🔐 Opening browser for Claude authentication...');
  console.log(`\nIf browser doesn't open, visit this URL:\n${authUrl}\n`);

  // Open browser (WSL-aware)
  try {
    await openBrowser(authUrl);
  } catch {
    console.error('Failed to open browser automatically. Please open the URL manually.');
  }

  return { authUrl, pkce };
}
