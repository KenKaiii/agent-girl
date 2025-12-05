/**
 * Startup & Environment Module
 * Handles environment detection, configuration loading, and initialization
 */

import path from "path";
import { readFileSync, existsSync, appendFileSync } from "fs";

// Determine if running in standalone mode
const IS_STANDALONE = process.env.STANDALONE_BUILD === 'true';

/**
 * Debug logging function
 * In standalone mode: only writes to debug log file (silent in console)
 * In dev mode: writes to console for debugging
 */
export const debugLog = (message: string): void => {
  if (IS_STANDALONE) {
    try {
      const logPath = path.join(path.dirname(process.execPath), 'agent-girl-debug.log');
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      appendFileSync(logPath, logMessage, 'utf-8');
    } catch (e) {
      console.error('Failed to write debug log:', e);
    }
  } else {
    console.log(message);
  }
};

/**
 * Get the directory where the binary/script is located
 * Uses import.meta.dir to get the actual file location, then goes up to the app root
 *
 * EXPORTED for use in other modules that need to resolve paths relative to the app root
 */
export const getBinaryDir = (): string => {
  // import.meta.dir gives us /path/to/agent-girl/server
  // We need to go up one level to /path/to/agent-girl (the app root)
  const serverDir = import.meta.dir;
  const appRoot = path.dirname(serverDir);
  return appRoot;
};

export interface StartupConfig {
  isStandalone: boolean;
  binaryDir: string;
  debugLog: (message: string) => void;
  // PostCSS is now lazy-loaded in staticFileServer.ts to avoid 100% CPU from oxide bindings
}

/**
 * Initialize startup configuration
 * Loads environment variables (PostCSS is lazy-loaded in staticFileServer.ts)
 */
export async function initializeStartup(): Promise<StartupConfig> {
  const BINARY_DIR = getBinaryDir();

  debugLog('🔍 Startup diagnostics:');
  debugLog(`  - IS_STANDALONE: ${IS_STANDALONE}`);
  debugLog(`  - STANDALONE_BUILD env: ${process.env.STANDALONE_BUILD}`);
  debugLog(`  - process.execPath: ${process.execPath}`);
  debugLog(`  - process.cwd(): ${process.cwd()}`);
  debugLog(`  - BINARY_DIR: ${BINARY_DIR}`);

  // NOTE: PostCSS/Tailwind imports REMOVED from startup
  // @tailwindcss/oxide native bindings were causing 100% CPU via file watchers
  // PostCSS is now lazy-loaded in staticFileServer.ts on first CSS request

  // Load environment variables
  // In standalone mode, manually parse .env from binary directory
  // In dev mode, use dotenv/config from project root
  if (IS_STANDALONE) {
    const envPath = path.join(BINARY_DIR, '.env');
    debugLog(`  - Looking for .env at: ${envPath}`);
    debugLog(`  - .env exists: ${existsSync(envPath)}`);

    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      debugLog(`  - .env file size: ${envContent.length} bytes`);

      let keysLoaded = 0;
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) return;

        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();

          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          process.env[key] = value;
          keysLoaded++;
          // Only log the key name, not the value (for security)
          if (key === 'ANTHROPIC_API_KEY' || key === 'ZAI_API_KEY') {
            debugLog(`  - Loaded ${key}: ${value.substring(0, 10)}...`);
          }
        }
      });
      debugLog(`✅ Loaded .env from: ${envPath} (${keysLoaded} keys)`);
    } else {
      debugLog(`⚠️  .env file not found at: ${envPath}`);
    }
  } else {
    debugLog('  - Using dotenv/config (dev mode)');
    await import("dotenv/config");
  }

  debugLog(`  - ANTHROPIC_API_KEY set: ${!!process.env.ANTHROPIC_API_KEY}`);
  debugLog(`  - ZAI_API_KEY set: ${!!process.env.ZAI_API_KEY}`);
  debugLog(`  - MOONSHOT_API_KEY set: ${!!process.env.MOONSHOT_API_KEY}`);

  return {
    isStandalone: IS_STANDALONE,
    binaryDir: BINARY_DIR,
    debugLog,
  };
}

/**
 * Check if Node.js v18+ is available for Claude SDK subprocess
 * The SDK requires Node.js runtime even though the server runs on Bun
 */
export async function checkNodeAvailability(): Promise<void> {
  try {
    const { execSync } = await import('child_process');
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);

    if (majorVersion < 18) {
      throw new Error(
        `Node.js v18+ required for Claude SDK. Found: ${version}\n` +
        'Please upgrade: https://nodejs.org'
      );
    }

    debugLog(`✅ Node.js ${version} available for SDK subprocess`);

    // Check for architecture mismatch on ARM Macs (Rosetta emulation causes 40-70% slowdown)
    if (process.platform === 'darwin' && process.arch === 'arm64') {
      try {
        const nodeArch = execSync('node -e "console.log(process.arch)"', { encoding: 'utf8' }).trim();
        if (nodeArch === 'x64') {
          console.warn('⚠️  WARNING: Node.js is running in x86_64 mode on ARM Mac (Rosetta emulation)');
          console.warn('   This causes 40-70% performance penalty for SDK subprocess spawning');
          console.warn('   Install native arm64 Node.js for better performance:');
          console.warn('   brew uninstall node && brew install node');
        }
      } catch {
        // Ignore errors checking architecture
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If execSync failed because node is not found
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found') || errorMessage.includes('command not found')) {
      throw new Error(
        'Node.js v18+ not found. Required for Claude SDK subprocess.\n' +
        'Install from: https://nodejs.org\n\n' +
        'Installation instructions:\n' +
        '  • macOS: brew install node\n' +
        '  • Linux: sudo apt install nodejs npm (Ubuntu/Debian)\n' +
        '  • Windows: Download from https://nodejs.org'
      );
    }

    // Re-throw other errors (like version check failure)
    throw error;
  }
}
