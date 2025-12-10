/**
 * One-Click Deployment API
 *
 * Deploy to Vercel, Netlify, or Cloudflare Pages with a single click.
 * Similar to Bolt.new and Lovable deployment integrations.
 */

import { z } from 'zod';
import { execSync, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// Types & Schemas
// ============================================================================

const DeploySchema = z.object({
  projectPath: z.string(),
  platform: z.enum(['vercel', 'netlify', 'cloudflare', 'hetzner']),
  production: z.boolean().default(false),
  envVars: z.record(z.string(), z.string()).optional(),
});

const HetznerConfigSchema = z.object({
  host: z.string(),
  user: z.string().default('root'),
  path: z.string().default('/var/www/html'),
  port: z.number().default(22),
  buildCommand: z.string().optional(),
  outputDir: z.string().optional(),
});

const VercelConfigSchema = z.object({
  projectPath: z.string(),
  projectName: z.string().optional(),
  framework: z.enum(['astro', 'nextjs', 'react', 'vue', 'svelte', 'other']).optional(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
});

interface DeploymentResult {
  success: boolean;
  platform: string;
  url?: string;
  previewUrl?: string;
  message: string;
  deploymentId?: string;
  logs?: string[];
}

interface HetznerConfig {
  host: string;
  user: string;
  path: string;
  port: number;
  buildCommand?: string;
  outputDir?: string;
}

interface PlatformStatus {
  vercel: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  netlify: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  cloudflare: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  hetzner: { configured: boolean; host?: string };
}

interface TokenStorage {
  vercel?: string;
  netlify?: string;
  cloudflare?: { token: string; accountId?: string };
}

// OAuth Configuration (for future OAuth app setup)
// For now, we use CLI login which is easier and requires no OAuth app registration
const OAUTH_CONFIG = {
  vercel: {
    authUrl: 'https://vercel.com/integrations/deploy-button/new',
    // Full OAuth would need: clientId, clientSecret, redirectUri
  },
  netlify: {
    authUrl: 'https://app.netlify.com/authorize',
    // Full OAuth would need: clientId, clientSecret, redirectUri
  },
  cloudflare: {
    // Cloudflare uses wrangler login - no OAuth app needed
  }
};

// ============================================================================
// Platform Detection & Setup
// ============================================================================

// Config file paths
const HETZNER_CONFIG_PATH = join(process.env.HOME || '/tmp', '.agent-girl-hetzner.json');
const TOKEN_STORAGE_PATH = join(process.env.HOME || '/tmp', '.agent-girl-tokens.json');

// Token storage functions
function loadTokens(): TokenStorage {
  try {
    if (existsSync(TOKEN_STORAGE_PATH)) {
      return JSON.parse(readFileSync(TOKEN_STORAGE_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveTokens(tokens: TokenStorage): void {
  writeFileSync(TOKEN_STORAGE_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

function saveToken(platform: 'vercel' | 'netlify' | 'cloudflare', token: string, accountId?: string): void {
  const tokens = loadTokens();
  if (platform === 'cloudflare') {
    tokens.cloudflare = { token, accountId };
  } else {
    tokens[platform] = token;
  }
  saveTokens(tokens);
}

function removeToken(platform: 'vercel' | 'netlify' | 'cloudflare'): void {
  const tokens = loadTokens();
  delete tokens[platform];
  saveTokens(tokens);
}

function getToken(platform: 'vercel' | 'netlify' | 'cloudflare'): string | { token: string; accountId?: string } | undefined {
  const tokens = loadTokens();
  return tokens[platform];
}

// Token verification functions
async function verifyVercelToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyNetlifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.netlify.com/api/v1/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyCloudflareToken(token: string, accountId?: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// CLI Login Functions (Browser-based, most frictionless)
// ============================================================================

interface LoginResult {
  success: boolean;
  message: string;
  needsManualStep?: boolean;
  command?: string;
}

async function loginVercel(): Promise<LoginResult> {
  try {
    // Check if CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        message: 'Vercel CLI nicht installiert.',
        needsManualStep: true,
        command: 'bun add -g vercel'
      };
    }

    // Check if already logged in
    try {
      execSync('vercel whoami', { stdio: 'pipe', timeout: 10000 });
      return {
        success: true,
        message: 'Vercel bereits eingeloggt!'
      };
    } catch {}

    // CLI login requires interactive terminal - return instructions
    return {
      success: false,
      message: 'Bitte führe "vercel login" in deinem Terminal aus, dann versuche es erneut.',
      needsManualStep: true,
      command: 'vercel login'
    };
  } catch (error) {
    return {
      success: false,
      message: `Vercel Login fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function loginNetlify(): Promise<LoginResult> {
  try {
    // Check if CLI is installed
    try {
      execSync('netlify --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        message: 'Netlify CLI nicht installiert.',
        needsManualStep: true,
        command: 'bun add -g netlify-cli'
      };
    }

    // Check if already logged in
    try {
      const { stdout } = await execAsync('netlify status --json 2>/dev/null || echo "{}"', { timeout: 10000 });
      const status = JSON.parse(stdout);
      if (status.account?.slug || status.user?.slug) {
        return {
          success: true,
          message: 'Netlify bereits eingeloggt!'
        };
      }
    } catch {}

    // CLI login requires interactive terminal - return instructions
    // The user should run this in their terminal manually
    return {
      success: false,
      message: 'Bitte führe "netlify login" in deinem Terminal aus, dann versuche es erneut.',
      needsManualStep: true,
      command: 'netlify login'
    };
  } catch (error) {
    return {
      success: false,
      message: `Netlify Login fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function loginCloudflare(): Promise<LoginResult> {
  try {
    // Check if wrangler is installed
    try {
      execSync('wrangler --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        message: 'Wrangler CLI nicht installiert.',
        needsManualStep: true,
        command: 'bun add -g wrangler'
      };
    }

    // Check if already logged in
    try {
      const { stdout } = await execAsync('wrangler whoami 2>/dev/null', { timeout: 10000 });
      if (stdout && !stdout.includes('not authenticated')) {
        return {
          success: true,
          message: 'Cloudflare bereits eingeloggt!'
        };
      }
    } catch {}

    // CLI login requires interactive terminal - return instructions
    return {
      success: false,
      message: 'Bitte führe "wrangler login" in deinem Terminal aus, dann versuche es erneut.',
      needsManualStep: true,
      command: 'wrangler login'
    };
  } catch (error) {
    return {
      success: false,
      message: `Cloudflare Login fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// ============================================================================
// Hetzner Auto-Setup (SSH Key Generation)
// ============================================================================

interface HetznerSetupResult {
  success: boolean;
  message: string;
  sshKey?: string;
  sshCommand?: string;
}

async function setupHetznerAuto(host: string, user: string = 'root', port: number = 22): Promise<HetznerSetupResult> {
  const sshDir = join(process.env.HOME || '/tmp', '.ssh');
  const keyPath = join(sshDir, 'agent-girl-hetzner');
  const pubKeyPath = `${keyPath}.pub`;

  try {
    // Ensure .ssh directory exists
    if (!existsSync(sshDir)) {
      execSync(`mkdir -p ${sshDir} && chmod 700 ${sshDir}`, { stdio: 'pipe' });
    }

    // Generate SSH key if not exists
    if (!existsSync(keyPath)) {
      execSync(`ssh-keygen -t ed25519 -f ${keyPath} -N "" -C "agent-girl-deploy"`, { stdio: 'pipe' });
    }

    // Read public key
    const publicKey = readFileSync(pubKeyPath, 'utf-8').trim();

    // Test if we can connect (key might already be on server)
    try {
      execSync(
        `ssh -i ${keyPath} -p ${port} -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes ${user}@${host} "echo ok"`,
        { stdio: 'pipe' }
      );

      // Connection works! Save config
      saveHetznerConfig({ host, user, port, path: '/var/www/html' });

      return {
        success: true,
        message: `SSH-Verbindung zu ${host} erfolgreich! Bereit für Deploy.`
      };
    } catch {
      // Key not on server yet - user needs to add it
      const sshCopyCommand = `ssh-copy-id -i ${pubKeyPath} -p ${port} ${user}@${host}`;
      const manualCommand = `cat ${pubKeyPath} | ssh -p ${port} ${user}@${host} "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"`;

      return {
        success: false,
        message: 'SSH-Key generiert. Bitte auf Server kopieren:',
        sshKey: publicKey,
        sshCommand: sshCopyCommand
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Hetzner Setup fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function testHetznerConnection(host: string, user: string = 'root', port: number = 22): Promise<LoginResult> {
  const keyPath = join(process.env.HOME || '/tmp', '.ssh', 'agent-girl-hetzner');

  try {
    // Try with our generated key first
    if (existsSync(keyPath)) {
      try {
        execSync(
          `ssh -i ${keyPath} -p ${port} -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes ${user}@${host} "echo ok"`,
          { stdio: 'pipe' }
        );
        return { success: true, message: 'Verbindung erfolgreich!' };
      } catch {}
    }

    // Try with default SSH key
    try {
      execSync(
        `ssh -p ${port} -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes ${user}@${host} "echo ok"`,
        { stdio: 'pipe' }
      );
      return { success: true, message: 'Verbindung erfolgreich!' };
    } catch {}

    return {
      success: false,
      message: 'SSH-Verbindung fehlgeschlagen. Bitte SSH-Key einrichten.',
      needsManualStep: true
    };
  } catch (error) {
    return {
      success: false,
      message: `Test fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

function loadHetznerConfig(): HetznerConfig | null {
  try {
    if (existsSync(HETZNER_CONFIG_PATH)) {
      return JSON.parse(readFileSync(HETZNER_CONFIG_PATH, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveHetznerConfig(config: HetznerConfig): void {
  writeFileSync(HETZNER_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

async function checkPlatformStatus(): Promise<PlatformStatus> {
  const tokens = loadTokens();
  const status: PlatformStatus = {
    vercel: { installed: false, authenticated: false, hasToken: !!tokens.vercel },
    netlify: { installed: false, authenticated: false, hasToken: !!tokens.netlify },
    cloudflare: { installed: false, authenticated: false, hasToken: !!tokens.cloudflare?.token },
    hetzner: { configured: false }
  };

  // Check Vercel
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    status.vercel.installed = true;
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      status.vercel.authenticated = true;
    } catch {}
  } catch {}

  // Check Netlify
  try {
    execSync('netlify --version', { stdio: 'pipe' });
    status.netlify.installed = true;
    try {
      execSync('netlify status', { stdio: 'pipe' });
      status.netlify.authenticated = true;
    } catch {}
  } catch {}

  // Check Cloudflare (Wrangler)
  try {
    execSync('wrangler --version', { stdio: 'pipe' });
    status.cloudflare.installed = true;
    try {
      execSync('wrangler whoami', { stdio: 'pipe' });
      status.cloudflare.authenticated = true;
    } catch {}
  } catch {}

  // Check Hetzner (rsync + SSH config)
  const hetznerConfig = loadHetznerConfig();
  if (hetznerConfig?.host) {
    status.hetzner.configured = true;
    status.hetzner.host = hetznerConfig.host;
  }

  return status;
}

function detectFramework(projectPath: string): string {
  const packageJsonPath = join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return 'static';
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (deps['astro']) return 'astro';
  if (deps['next']) return 'nextjs';
  if (deps['nuxt']) return 'nuxt';
  if (deps['svelte'] || deps['@sveltejs/kit']) return 'svelte';
  if (deps['vue']) return 'vue';
  if (deps['react']) return 'react';

  return 'other';
}

// ============================================================================
// Vercel Deployment
// ============================================================================

async function deployToVercel(
  projectPath: string,
  production: boolean = false,
  envVars?: Record<string, string>
): Promise<DeploymentResult> {
  const logs: string[] = [];

  try {
    // Check if Vercel is installed and authenticated
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        platform: 'vercel',
        message: 'Vercel CLI nicht installiert. Führe aus: bun add -g vercel'
      };
    }

    // Set environment variables if provided
    if (envVars) {
      for (const [key, value] of Object.entries(envVars)) {
        try {
          execSync(`vercel env add ${key} production`, {
            cwd: projectPath,
            input: value,
            stdio: 'pipe'
          });
          logs.push(`Umgebungsvariable ${key} gesetzt`);
        } catch {
          logs.push(`Warnung: Konnte ${key} nicht setzen`);
        }
      }
    }

    // Deploy
    const prodFlag = production ? '--prod' : '';
    const { stdout } = await execAsync(`vercel ${prodFlag} --yes`, {
      cwd: projectPath
    });

    const urlMatch = stdout.match(/(https:\/\/[^\s]+\.vercel\.app)/);
    const url = urlMatch ? urlMatch[1] : undefined;

    logs.push('Deployment erfolgreich');

    return {
      success: true,
      platform: 'vercel',
      url,
      previewUrl: production ? undefined : url,
      message: production
        ? `Produktions-Deployment abgeschlossen: ${url}`
        : `Preview-Deployment abgeschlossen: ${url}`,
      logs
    };
  } catch (error) {
    return {
      success: false,
      platform: 'vercel',
      message: `Vercel Deployment fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      logs
    };
  }
}

async function configureVercel(
  projectPath: string,
  options: {
    projectName?: string;
    framework?: string;
    buildCommand?: string;
    outputDirectory?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const framework = options.framework || detectFramework(projectPath);

    // Create or update vercel.json
    const vercelConfig: Record<string, unknown> = {};

    if (options.buildCommand) {
      vercelConfig.buildCommand = options.buildCommand;
    }

    if (options.outputDirectory) {
      vercelConfig.outputDirectory = options.outputDirectory;
    }

    // Framework-specific defaults
    switch (framework) {
      case 'astro':
        vercelConfig.framework = 'astro';
        if (!options.outputDirectory) vercelConfig.outputDirectory = 'dist';
        break;
      case 'nextjs':
        vercelConfig.framework = 'nextjs';
        break;
      case 'svelte':
        vercelConfig.framework = 'sveltekit';
        break;
    }

    const vercelJsonPath = join(projectPath, 'vercel.json');
    writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2), 'utf-8');

    // Link project if project name provided
    if (options.projectName) {
      try {
        execSync(`vercel link --project=${options.projectName} --yes`, {
          cwd: projectPath,
          stdio: 'pipe'
        });
      } catch {
        // Project might not exist yet, that's okay
      }
    }

    return {
      success: true,
      message: `Vercel konfiguriert für ${framework}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Konfiguration fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// ============================================================================
// Netlify Deployment
// ============================================================================

async function deployToNetlify(
  projectPath: string,
  production: boolean = false,
  envVars?: Record<string, string>
): Promise<DeploymentResult> {
  const logs: string[] = [];

  try {
    // Check if Netlify CLI is installed
    try {
      execSync('netlify --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        platform: 'netlify',
        message: 'Netlify CLI nicht installiert. Führe aus: bun add -g netlify-cli'
      };
    }

    // Build first
    logs.push('Building project...');
    try {
      execSync('bun run build', { cwd: projectPath, stdio: 'pipe' });
      logs.push('Build erfolgreich');
    } catch {
      logs.push('Warnung: Build-Befehl fehlgeschlagen');
    }

    // Set environment variables
    if (envVars) {
      for (const [key, value] of Object.entries(envVars)) {
        try {
          execSync(`netlify env:set ${key} "${value}"`, {
            cwd: projectPath,
            stdio: 'pipe'
          });
          logs.push(`Umgebungsvariable ${key} gesetzt`);
        } catch {
          logs.push(`Warnung: Konnte ${key} nicht setzen`);
        }
      }
    }

    // Detect output directory
    const framework = detectFramework(projectPath);
    let outputDir = 'dist';
    if (framework === 'nextjs') outputDir = '.next';
    if (framework === 'nuxt') outputDir = '.output/public';

    // Deploy
    const prodFlag = production ? '--prod' : '';
    const { stdout } = await execAsync(
      `netlify deploy ${prodFlag} --dir=${outputDir}`,
      { cwd: projectPath }
    );

    const urlMatch = stdout.match(/(https:\/\/[^\s]+\.netlify\.app)/);
    const url = urlMatch ? urlMatch[1] : undefined;

    logs.push('Deployment erfolgreich');

    return {
      success: true,
      platform: 'netlify',
      url,
      previewUrl: production ? undefined : url,
      message: production
        ? `Produktions-Deployment abgeschlossen: ${url}`
        : `Preview-Deployment abgeschlossen: ${url}`,
      logs
    };
  } catch (error) {
    return {
      success: false,
      platform: 'netlify',
      message: `Netlify Deployment fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      logs
    };
  }
}

// ============================================================================
// Cloudflare Pages Deployment
// ============================================================================

async function deployToCloudflare(
  projectPath: string,
  production: boolean = false,
  envVars?: Record<string, string>
): Promise<DeploymentResult> {
  const logs: string[] = [];

  try {
    // Check if Wrangler is installed
    try {
      execSync('wrangler --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        platform: 'cloudflare',
        message: 'Wrangler CLI nicht installiert. Führe aus: bun add -g wrangler'
      };
    }

    // Build first
    logs.push('Building project...');
    try {
      execSync('bun run build', { cwd: projectPath, stdio: 'pipe' });
      logs.push('Build erfolgreich');
    } catch {
      logs.push('Warnung: Build-Befehl fehlgeschlagen');
    }

    // Detect output directory
    const framework = detectFramework(projectPath);
    let outputDir = 'dist';
    if (framework === 'nextjs') outputDir = '.next';
    if (framework === 'nuxt') outputDir = '.output/public';

    // Get project name from package.json
    const packageJsonPath = join(projectPath, 'package.json');
    let projectName = 'my-project';
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      projectName = packageJson.name || projectName;
    }

    // Deploy
    const branch = production ? 'main' : 'preview';
    const { stdout } = await execAsync(
      `wrangler pages deploy ${outputDir} --project-name=${projectName} --branch=${branch}`,
      { cwd: projectPath }
    );

    const urlMatch = stdout.match(/(https:\/\/[^\s]+\.pages\.dev)/);
    const url = urlMatch ? urlMatch[1] : undefined;

    logs.push('Deployment erfolgreich');

    return {
      success: true,
      platform: 'cloudflare',
      url,
      previewUrl: production ? undefined : url,
      message: production
        ? `Produktions-Deployment abgeschlossen: ${url}`
        : `Preview-Deployment abgeschlossen: ${url}`,
      logs
    };
  } catch (error) {
    return {
      success: false,
      platform: 'cloudflare',
      message: `Cloudflare Deployment fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      logs
    };
  }
}

// ============================================================================
// Hetzner VPS Deployment (rsync over SSH)
// ============================================================================

async function deployToHetzner(
  projectPath: string,
  config?: Partial<HetznerConfig>
): Promise<DeploymentResult> {
  const logs: string[] = [];

  try {
    // Load or use provided config
    const savedConfig = loadHetznerConfig();
    const hetznerConfig: HetznerConfig = {
      host: config?.host || savedConfig?.host || '',
      user: config?.user || savedConfig?.user || 'root',
      path: config?.path || savedConfig?.path || '/var/www/html',
      port: config?.port || savedConfig?.port || 22,
      buildCommand: config?.buildCommand || savedConfig?.buildCommand,
      outputDir: config?.outputDir || savedConfig?.outputDir,
    };

    if (!hetznerConfig.host) {
      return {
        success: false,
        platform: 'hetzner',
        message: 'Hetzner nicht konfiguriert. Bitte zuerst Server-Daten eingeben.'
      };
    }

    // Check rsync is available
    try {
      execSync('which rsync', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        platform: 'hetzner',
        message: 'rsync nicht installiert. Führe aus: brew install rsync'
      };
    }

    // Detect framework and output directory
    const framework = detectFramework(projectPath);
    let outputDir = hetznerConfig.outputDir || 'dist';
    if (!hetznerConfig.outputDir) {
      if (framework === 'astro') outputDir = 'dist';
      else if (framework === 'nextjs') outputDir = 'out'; // static export
      else if (framework === 'nuxt') outputDir = '.output/public';
      else if (framework === 'svelte') outputDir = 'build';
      else if (framework === 'react') outputDir = 'dist';
    }

    // Build the project
    logs.push('Building project...');
    const buildCmd = hetznerConfig.buildCommand || 'bun run build';
    try {
      execSync(buildCmd, { cwd: projectPath, stdio: 'pipe' });
      logs.push('Build erfolgreich');
    } catch (buildError) {
      logs.push(`Build-Warnung: ${buildError instanceof Error ? buildError.message : 'Build fehlgeschlagen'}`);
    }

    // Check if output directory exists
    const outputPath = join(projectPath, outputDir);
    if (!existsSync(outputPath)) {
      return {
        success: false,
        platform: 'hetzner',
        message: `Output-Verzeichnis "${outputDir}" nicht gefunden. Bitte Build ausführen.`,
        logs
      };
    }

    // Deploy with rsync
    logs.push(`Deploying to ${hetznerConfig.host}:${hetznerConfig.path}...`);
    const rsyncCmd = `rsync -avz --delete -e "ssh -p ${hetznerConfig.port} -o StrictHostKeyChecking=no" ${outputPath}/ ${hetznerConfig.user}@${hetznerConfig.host}:${hetznerConfig.path}/`;

    const { stdout, stderr } = await execAsync(rsyncCmd, { cwd: projectPath });

    if (stderr && !stderr.includes('sending incremental file list')) {
      logs.push(`rsync output: ${stderr}`);
    }

    // Count transferred files
    const fileCount = (stdout.match(/\n/g) || []).length;
    logs.push(`${fileCount} Dateien synchronisiert`);
    logs.push('Deployment erfolgreich');

    // Construct URL (assuming standard web setup)
    const url = `https://${hetznerConfig.host}`;

    return {
      success: true,
      platform: 'hetzner',
      url,
      message: `Erfolgreich auf ${hetznerConfig.host} deployed`,
      logs
    };
  } catch (error) {
    return {
      success: false,
      platform: 'hetzner',
      message: `Hetzner Deployment fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      logs
    };
  }
}

async function configureHetzner(config: HetznerConfig): Promise<{ success: boolean; message: string }> {
  try {
    // Test SSH connection
    const testCmd = `ssh -p ${config.port} -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${config.user}@${config.host} "echo 'Connection successful'"`;

    try {
      execSync(testCmd, { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        message: `SSH-Verbindung zu ${config.host} fehlgeschlagen. Stelle sicher, dass SSH-Key eingerichtet ist.`
      };
    }

    // Save config
    saveHetznerConfig(config);

    return {
      success: true,
      message: `Hetzner konfiguriert: ${config.user}@${config.host}:${config.path}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Konfiguration fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// ============================================================================
// Project Management - List, Duplicate, Download, Delete
// ============================================================================

interface Project {
  id: string;
  name: string;
  platform: 'vercel' | 'netlify' | 'cloudflare';
  url?: string;
  createdAt: string;
  updatedAt: string;
  framework?: string;
  repo?: string;
  deployments?: number;
  latestDeployment?: {
    id: string;
    url: string;
    state: string;
    createdAt: string;
  };
}

interface ProjectsResult {
  success: boolean;
  projects: Project[];
  message?: string;
}

async function fetchVercelProjects(): Promise<Project[]> {
  try {
    // Try CLI first
    const { stdout } = await execAsync('vercel projects list --json 2>/dev/null || echo "[]"');
    const cliProjects = JSON.parse(stdout);
    if (Array.isArray(cliProjects) && cliProjects.length > 0) {
      return cliProjects.map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        name: String(p.name || ''),
        platform: 'vercel' as const,
        url: p.alias ? `https://${(p.alias as string[])[0]}` : undefined,
        createdAt: String(p.createdAt || new Date().toISOString()),
        updatedAt: String(p.updatedAt || new Date().toISOString()),
        framework: String(p.framework || ''),
        repo: p.link ? `${(p.link as Record<string, unknown>).org}/${(p.link as Record<string, unknown>).repo}` : undefined
      }));
    }

    // Fallback to API with token
    const token = getToken('vercel');
    if (token && typeof token === 'string') {
      const res = await fetch('https://api.vercel.com/v9/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json() as { projects: Record<string, unknown>[] };
        return data.projects.map((p) => ({
          id: String(p.id || ''),
          name: String(p.name || ''),
          platform: 'vercel' as const,
          url: p.alias ? `https://${(p.alias as string[])[0]}` : undefined,
          createdAt: String(p.createdAt || new Date().toISOString()),
          updatedAt: String(p.updatedAt || new Date().toISOString()),
          framework: String(p.framework || ''),
          repo: p.link ? `${(p.link as Record<string, unknown>).org}/${(p.link as Record<string, unknown>).repo}` : undefined
        }));
      }
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchNetlifyProjects(): Promise<Project[]> {
  try {
    // Try CLI first
    const { stdout } = await execAsync('netlify sites:list --json 2>/dev/null || echo "[]"');
    const cliProjects = JSON.parse(stdout);
    if (Array.isArray(cliProjects) && cliProjects.length > 0) {
      return cliProjects.map((p: Record<string, unknown>) => ({
        id: String(p.id || p.site_id || ''),
        name: String(p.name || ''),
        platform: 'netlify' as const,
        url: p.ssl_url ? String(p.ssl_url) : p.url ? String(p.url) : undefined,
        createdAt: String(p.created_at || new Date().toISOString()),
        updatedAt: String(p.updated_at || new Date().toISOString()),
        framework: String((p.build_settings as Record<string, unknown>)?.framework || ''),
        repo: p.repo_url ? String(p.repo_url) : undefined
      }));
    }

    // Fallback to API with token
    const token = getToken('netlify');
    if (token && typeof token === 'string') {
      const res = await fetch('https://api.netlify.com/api/v1/sites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json() as Record<string, unknown>[];
        return data.map((p) => ({
          id: String(p.id || p.site_id || ''),
          name: String(p.name || ''),
          platform: 'netlify' as const,
          url: p.ssl_url ? String(p.ssl_url) : p.url ? String(p.url) : undefined,
          createdAt: String(p.created_at || new Date().toISOString()),
          updatedAt: String(p.updated_at || new Date().toISOString()),
          framework: '',
          repo: p.repo_url ? String(p.repo_url) : undefined
        }));
      }
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchCloudflareProjects(): Promise<Project[]> {
  try {
    // Try CLI first
    const { stdout } = await execAsync('wrangler pages project list --json 2>/dev/null || echo "[]"');
    let cliProjects: Record<string, unknown>[] = [];
    try {
      cliProjects = JSON.parse(stdout);
    } catch {
      // Wrangler output might not be pure JSON, try parsing differently
      const match = stdout.match(/\[[\s\S]*\]/);
      if (match) {
        cliProjects = JSON.parse(match[0]);
      }
    }

    if (Array.isArray(cliProjects) && cliProjects.length > 0) {
      return cliProjects.map((p) => {
        const latestDeploy = p.latest_deployment as Record<string, unknown> | undefined;
        const deployTrigger = latestDeploy?.deployment_trigger as Record<string, unknown> | undefined;
        return {
          id: String(p.id || p.name || ''),
          name: String(p.name || ''),
          platform: 'cloudflare' as const,
          url: p.subdomain ? `https://${p.subdomain}.pages.dev` : undefined,
          createdAt: String(p.created_on || new Date().toISOString()),
          updatedAt: String(latestDeploy?.created_on || p.created_on || new Date().toISOString()),
          framework: '',
          deployments: typeof p.deployment_count === 'number' ? p.deployment_count : undefined,
          latestDeployment: latestDeploy ? {
            id: String(latestDeploy.id || ''),
            url: String(latestDeploy.url || ''),
            state: String(deployTrigger?.type || 'unknown'),
            createdAt: String(latestDeploy.created_on || '')
          } : undefined
        };
      });
    }

    // Fallback to API with token
    const cfToken = getToken('cloudflare');
    if (cfToken && typeof cfToken === 'object' && cfToken.token) {
      const res = await fetch('https://api.cloudflare.com/client/v4/accounts/' + (cfToken.accountId || '') + '/pages/projects', {
        headers: { Authorization: `Bearer ${cfToken.token}` }
      });
      if (res.ok) {
        const data = await res.json() as { result: Record<string, unknown>[] };
        return (data.result || []).map((p) => ({
          id: String(p.id || p.name || ''),
          name: String(p.name || ''),
          platform: 'cloudflare' as const,
          url: p.subdomain ? `https://${p.subdomain}.pages.dev` : undefined,
          createdAt: String(p.created_on || new Date().toISOString()),
          updatedAt: String(p.created_on || new Date().toISOString()),
          framework: ''
        }));
      }
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchAllProjects(): Promise<ProjectsResult> {
  const status = await checkPlatformStatus();
  const allProjects: Project[] = [];

  // Fetch from all authenticated platforms in parallel
  const promises: Promise<Project[]>[] = [];

  if (status.vercel.authenticated || status.vercel.hasToken) {
    promises.push(fetchVercelProjects());
  }
  if (status.netlify.authenticated || status.netlify.hasToken) {
    promises.push(fetchNetlifyProjects());
  }
  if (status.cloudflare.authenticated || status.cloudflare.hasToken) {
    promises.push(fetchCloudflareProjects());
  }

  const results = await Promise.all(promises);
  results.forEach(projects => allProjects.push(...projects));

  // Sort by updatedAt (most recent first)
  allProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    success: true,
    projects: allProjects,
    message: `${allProjects.length} Projekte gefunden`
  };
}

async function fetchProjectsByPlatform(platform: 'vercel' | 'netlify' | 'cloudflare'): Promise<ProjectsResult> {
  let projects: Project[] = [];

  switch (platform) {
    case 'vercel':
      projects = await fetchVercelProjects();
      break;
    case 'netlify':
      projects = await fetchNetlifyProjects();
      break;
    case 'cloudflare':
      projects = await fetchCloudflareProjects();
      break;
  }

  return {
    success: true,
    projects,
    message: `${projects.length} ${platform} Projekte gefunden`
  };
}

async function downloadProject(platform: string, projectId: string, targetPath: string): Promise<{ success: boolean; message: string; path?: string }> {
  try {
    // Ensure target directory exists
    if (!existsSync(targetPath)) {
      execSync(`mkdir -p ${targetPath}`, { stdio: 'pipe' });
    }

    switch (platform) {
      case 'vercel': {
        // Get project info and clone from git if available
        const { stdout } = await execAsync(`vercel project ${projectId} --json 2>/dev/null || echo "{}"`, {
          cwd: targetPath
        });
        const project = JSON.parse(stdout);

        if (project.link?.repo) {
          // Clone from git
          const repoUrl = `https://github.com/${project.link.org}/${project.link.repo}.git`;
          await execAsync(`git clone ${repoUrl} .`, { cwd: targetPath });
          return {
            success: true,
            message: `Projekt von GitHub geklont: ${project.link.repo}`,
            path: targetPath
          };
        }

        // Pull from Vercel
        await execAsync(`vercel pull --yes`, { cwd: targetPath });
        return {
          success: true,
          message: `Vercel Projekt heruntergeladen`,
          path: targetPath
        };
      }

      case 'netlify': {
        // Get site info
        const { stdout: siteInfo } = await execAsync(`netlify api getSite --data '{"site_id": "${projectId}"}' 2>/dev/null || echo "{}"`, {
          cwd: targetPath
        });
        const site = JSON.parse(siteInfo);

        if (site.repo_url) {
          // Clone from git
          await execAsync(`git clone ${site.repo_url} .`, { cwd: targetPath });
          return {
            success: true,
            message: `Projekt von Repository geklont`,
            path: targetPath
          };
        }

        // Link and pull
        await execAsync(`netlify link --id ${projectId}`, { cwd: targetPath });
        return {
          success: true,
          message: `Netlify Projekt verlinkt`,
          path: targetPath
        };
      }

      case 'cloudflare': {
        // Cloudflare Pages projects are git-based
        return {
          success: false,
          message: 'Cloudflare Pages Projekte werden über Git verwaltet. Bitte Repository direkt klonen.'
        };
      }

      default:
        return {
          success: false,
          message: `Unbekannte Platform: ${platform}`
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Download fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function duplicateProject(platform: string, projectId: string, newName: string): Promise<{ success: boolean; message: string; newProjectId?: string }> {
  try {
    switch (platform) {
      case 'vercel': {
        // Vercel doesn't have direct duplicate - need to create new and deploy
        return {
          success: false,
          message: 'Vercel Projekt-Duplikation: Bitte Projekt lokal herunterladen und neu deployen.'
        };
      }

      case 'netlify': {
        // Netlify has clone functionality
        const { stdout } = await execAsync(
          `netlify api createSiteInTeam --data '{"name": "${newName}", "repo": {"provider": "manual"}}' 2>/dev/null || echo "{}"`
        );
        const result = JSON.parse(stdout);
        if (result.id) {
          return {
            success: true,
            message: `Neues Netlify Projekt erstellt: ${newName}`,
            newProjectId: result.id
          };
        }
        return {
          success: false,
          message: 'Konnte Projekt nicht duplizieren'
        };
      }

      case 'cloudflare': {
        // Create new project
        const { stdout } = await execAsync(
          `wrangler pages project create ${newName} 2>/dev/null || echo "failed"`
        );
        if (!stdout.includes('failed')) {
          return {
            success: true,
            message: `Neues Cloudflare Pages Projekt erstellt: ${newName}`,
            newProjectId: newName
          };
        }
        return {
          success: false,
          message: 'Konnte Projekt nicht erstellen'
        };
      }

      default:
        return {
          success: false,
          message: `Unbekannte Platform: ${platform}`
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Duplikation fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function deleteProject(platform: string, projectId: string): Promise<{ success: boolean; message: string }> {
  try {
    switch (platform) {
      case 'vercel': {
        await execAsync(`vercel remove ${projectId} --yes`);
        return {
          success: true,
          message: `Vercel Projekt gelöscht: ${projectId}`
        };
      }

      case 'netlify': {
        await execAsync(`netlify sites:delete ${projectId} --force`);
        return {
          success: true,
          message: `Netlify Projekt gelöscht: ${projectId}`
        };
      }

      case 'cloudflare': {
        await execAsync(`wrangler pages project delete ${projectId} --yes`);
        return {
          success: true,
          message: `Cloudflare Pages Projekt gelöscht: ${projectId}`
        };
      }

      default:
        return {
          success: false,
          message: `Unbekannte Platform: ${platform}`
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Löschen fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function getProjectDeployments(platform: string, projectId: string): Promise<{ success: boolean; deployments: Record<string, unknown>[]; message?: string }> {
  try {
    switch (platform) {
      case 'vercel': {
        const { stdout } = await execAsync(`vercel ls ${projectId} --json 2>/dev/null || echo "[]"`);
        const deployments = JSON.parse(stdout);
        return { success: true, deployments };
      }

      case 'netlify': {
        const { stdout } = await execAsync(`netlify api listSiteDeploys --data '{"site_id": "${projectId}"}' 2>/dev/null || echo "[]"`);
        const deployments = JSON.parse(stdout);
        return { success: true, deployments };
      }

      case 'cloudflare': {
        const { stdout } = await execAsync(`wrangler pages deployment list ${projectId} --json 2>/dev/null || echo "[]"`);
        let deployments: Record<string, unknown>[] = [];
        try {
          deployments = JSON.parse(stdout);
        } catch {
          const match = stdout.match(/\[[\s\S]*\]/);
          if (match) deployments = JSON.parse(match[0]);
        }
        return { success: true, deployments };
      }

      default:
        return { success: false, deployments: [], message: `Unbekannte Platform: ${platform}` };
    }
  } catch (error) {
    return {
      success: false,
      deployments: [],
      message: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function rollbackDeployment(platform: string, projectId: string, deploymentId: string): Promise<{ success: boolean; message: string }> {
  try {
    switch (platform) {
      case 'vercel': {
        await execAsync(`vercel promote ${deploymentId} --yes`);
        return { success: true, message: `Vercel Deployment ${deploymentId} promoted` };
      }

      case 'netlify': {
        await execAsync(`netlify api restoreSiteDeploy --data '{"site_id": "${projectId}", "deploy_id": "${deploymentId}"}'`);
        return { success: true, message: `Netlify Deployment ${deploymentId} wiederhergestellt` };
      }

      case 'cloudflare': {
        // Cloudflare doesn't have direct rollback - redeploy needed
        return { success: false, message: 'Cloudflare Pages: Bitte manuell redeployen' };
      }

      default:
        return { success: false, message: `Unbekannte Platform: ${platform}` };
    }
  } catch (error) {
    return {
      success: false,
      message: `Rollback fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// ============================================================================
// Quick Deploy (Auto-detect best platform)
// ============================================================================

async function quickDeploy(
  projectPath: string,
  production: boolean = false
): Promise<DeploymentResult> {
  const status = await checkPlatformStatus();

  // Priority: Vercel > Netlify > Cloudflare > Hetzner
  if (status.vercel.authenticated) {
    return deployToVercel(projectPath, production);
  }

  if (status.netlify.authenticated) {
    return deployToNetlify(projectPath, production);
  }

  if (status.cloudflare.authenticated) {
    return deployToCloudflare(projectPath, production);
  }

  // Check if any CLI is installed but not authenticated
  if (status.vercel.installed) {
    return {
      success: false,
      platform: 'vercel',
      message: 'Vercel CLI installiert aber nicht eingeloggt. Führe aus: vercel login'
    };
  }

  if (status.netlify.installed) {
    return {
      success: false,
      platform: 'netlify',
      message: 'Netlify CLI installiert aber nicht eingeloggt. Führe aus: netlify login'
    };
  }

  if (status.cloudflare.installed) {
    return {
      success: false,
      platform: 'cloudflare',
      message: 'Wrangler CLI installiert aber nicht eingeloggt. Führe aus: wrangler login'
    };
  }

  // Try Hetzner if configured
  if (status.hetzner.configured) {
    return deployToHetzner(projectPath);
  }

  return {
    success: false,
    platform: 'none',
    message: 'Keine Deployment-Plattform konfiguriert. Installiere: vercel, netlify-cli, wrangler, oder konfiguriere Hetzner'
  };
}

// ============================================================================
// Route Handler
// ============================================================================

export async function handleDeployRoutes(req: Request, url: URL): Promise<Response> {
  const path = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // GET /api/deploy/status - Check platform status
    if (path === '/api/deploy/status' && req.method === 'GET') {
      const status = await checkPlatformStatus();
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: corsHeaders
      });
    }

    // POST /api/deploy - Deploy to specific platform
    if (path === '/api/deploy' && req.method === 'POST') {
      const body = await req.json();
      const parsed = DeploySchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const { projectPath, platform, production, envVars } = parsed.data;

      let result: DeploymentResult;
      switch (platform) {
        case 'vercel':
          result = await deployToVercel(projectPath, production, envVars);
          break;
        case 'netlify':
          result = await deployToNetlify(projectPath, production, envVars);
          break;
        case 'cloudflare':
          result = await deployToCloudflare(projectPath, production, envVars);
          break;
        case 'hetzner':
          result = await deployToHetzner(projectPath);
          break;
        default:
          return new Response(JSON.stringify({
            success: false,
            error: `Unbekannte Platform: ${platform}`
          }), { status: 400, headers: corsHeaders });
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/quick - Auto-deploy to best available platform
    if (path === '/api/deploy/quick' && req.method === 'POST') {
      const body = await req.json();
      const { projectPath, production = false } = body;

      if (!projectPath) {
        return new Response(JSON.stringify({
          error: 'projectPath erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await quickDeploy(projectPath, production);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/vercel/config - Configure Vercel
    if (path === '/api/deploy/vercel/config' && req.method === 'POST') {
      const body = await req.json();
      const parsed = VercelConfigSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await configureVercel(parsed.data.projectPath, parsed.data);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // GET /api/deploy/framework - Detect project framework
    if (path === '/api/deploy/framework' && req.method === 'GET') {
      const projectPath = url.searchParams.get('projectPath');

      if (!projectPath) {
        return new Response(JSON.stringify({
          error: 'projectPath erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const framework = detectFramework(projectPath);
      return new Response(JSON.stringify({ framework }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/auth/token - Save and verify platform token
    if (path === '/api/deploy/auth/token' && req.method === 'POST') {
      const body = await req.json();
      const { platform, token, accountId } = body;

      if (!platform || !token) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform und token erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      if (!['vercel', 'netlify', 'cloudflare'].includes(platform)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Ungültige Platform. Erlaubt: vercel, netlify, cloudflare'
        }), { status: 400, headers: corsHeaders });
      }

      // Verify token before saving
      let isValid = false;
      try {
        switch (platform) {
          case 'vercel':
            isValid = await verifyVercelToken(token);
            break;
          case 'netlify':
            isValid = await verifyNetlifyToken(token);
            break;
          case 'cloudflare':
            isValid = await verifyCloudflareToken(token, accountId);
            break;
        }
      } catch {
        isValid = false;
      }

      if (!isValid) {
        return new Response(JSON.stringify({
          success: false,
          error: `Token für ${platform} ist ungültig. Bitte überprüfe den Token.`
        }), { status: 400, headers: corsHeaders });
      }

      // Save token
      saveToken(platform as 'vercel' | 'netlify' | 'cloudflare', token, accountId);

      return new Response(JSON.stringify({
        success: true,
        message: `${platform} Token erfolgreich gespeichert`
      }), { status: 200, headers: corsHeaders });
    }

    // POST /api/deploy/auth/disconnect - Remove platform token
    if (path === '/api/deploy/auth/disconnect' && req.method === 'POST') {
      const body = await req.json();
      const { platform } = body;

      if (!platform) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      if (!['vercel', 'netlify', 'cloudflare'].includes(platform)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Ungültige Platform. Erlaubt: vercel, netlify, cloudflare'
        }), { status: 400, headers: corsHeaders });
      }

      removeToken(platform as 'vercel' | 'netlify' | 'cloudflare');

      return new Response(JSON.stringify({
        success: true,
        message: `${platform} Token entfernt`
      }), { status: 200, headers: corsHeaders });
    }

    // POST /api/deploy/auth/login - Browser-based CLI login (easiest method)
    if (path === '/api/deploy/auth/login' && req.method === 'POST') {
      const body = await req.json();
      const { platform } = body;

      if (!platform) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      let result: LoginResult;
      switch (platform) {
        case 'vercel':
          result = await loginVercel();
          break;
        case 'netlify':
          result = await loginNetlify();
          break;
        case 'cloudflare':
          result = await loginCloudflare();
          break;
        default:
          return new Response(JSON.stringify({
            success: false,
            error: 'Ungültige Platform. Erlaubt: vercel, netlify, cloudflare'
          }), { status: 400, headers: corsHeaders });
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/hetzner/setup - Auto SSH key setup
    if (path === '/api/deploy/hetzner/setup' && req.method === 'POST') {
      const body = await req.json();
      const { host, user = 'root', port = 22 } = body;

      if (!host) {
        return new Response(JSON.stringify({
          success: false,
          error: 'host erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await setupHetznerAuto(host, user, port);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/hetzner/test - Test SSH connection
    if (path === '/api/deploy/hetzner/test' && req.method === 'POST') {
      const body = await req.json();
      const { host, user = 'root', port = 22 } = body;

      if (!host) {
        return new Response(JSON.stringify({
          success: false,
          error: 'host erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await testHetznerConnection(host, user, port);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/hetzner/config - Configure Hetzner VPS
    if (path === '/api/deploy/hetzner/config' && req.method === 'POST') {
      const body = await req.json();
      const parsed = HetznerConfigSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await configureHetzner(parsed.data);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // ========================================================================
    // Project Management Routes
    // ========================================================================

    // GET /api/deploy/projects - List all projects from all connected platforms
    if (path === '/api/deploy/projects' && req.method === 'GET') {
      const platform = url.searchParams.get('platform') as 'vercel' | 'netlify' | 'cloudflare' | null;

      const result = platform
        ? await fetchProjectsByPlatform(platform)
        : await fetchAllProjects();

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders
      });
    }

    // GET /api/deploy/projects/:projectId/deployments - Get deployment history
    if (path.match(/^\/api\/deploy\/projects\/[^/]+\/deployments$/) && req.method === 'GET') {
      const projectId = path.split('/')[4];
      const platform = url.searchParams.get('platform');

      if (!platform) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform Parameter erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await getProjectDeployments(platform, projectId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/projects/download - Download project locally
    if (path === '/api/deploy/projects/download' && req.method === 'POST') {
      const body = await req.json();
      const { platform, projectId, targetPath } = body;

      if (!platform || !projectId || !targetPath) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform, projectId und targetPath erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await downloadProject(platform, projectId, targetPath);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/projects/duplicate - Duplicate a project
    if (path === '/api/deploy/projects/duplicate' && req.method === 'POST') {
      const body = await req.json();
      const { platform, projectId, newName } = body;

      if (!platform || !projectId || !newName) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform, projectId und newName erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await duplicateProject(platform, projectId, newName);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // DELETE /api/deploy/projects/:projectId - Delete a project
    if (path.match(/^\/api\/deploy\/projects\/[^/]+$/) && req.method === 'DELETE') {
      const projectId = path.split('/')[4];
      const platform = url.searchParams.get('platform');

      if (!platform) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform Parameter erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await deleteProject(platform, projectId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/deploy/projects/rollback - Rollback to a previous deployment
    if (path === '/api/deploy/projects/rollback' && req.method === 'POST') {
      const body = await req.json();
      const { platform, projectId, deploymentId } = body;

      if (!platform || !projectId || !deploymentId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'platform, projectId und deploymentId erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const result = await rollbackDeployment(platform, projectId, deploymentId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: 'Nicht gefunden',
      availableEndpoints: [
        'GET /api/deploy/status',
        'GET /api/deploy/framework?projectPath=...',
        'GET /api/deploy/projects',
        'GET /api/deploy/projects?platform=vercel|netlify|cloudflare',
        'GET /api/deploy/projects/:projectId/deployments?platform=...',
        'POST /api/deploy',
        'POST /api/deploy/quick',
        'POST /api/deploy/vercel/config',
        'POST /api/deploy/hetzner/config',
        'POST /api/deploy/hetzner/setup',
        'POST /api/deploy/hetzner/test',
        'POST /api/deploy/auth/token',
        'POST /api/deploy/auth/disconnect',
        'POST /api/deploy/auth/login',
        'POST /api/deploy/projects/download',
        'POST /api/deploy/projects/duplicate',
        'POST /api/deploy/projects/rollback',
        'DELETE /api/deploy/projects/:projectId?platform=...'
      ]
    }), { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Deploy API error:', error);
    return new Response(JSON.stringify({
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }), { status: 500, headers: corsHeaders });
  }
}
