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
  vercel: { installed: boolean; authenticated: boolean };
  netlify: { installed: boolean; authenticated: boolean };
  cloudflare: { installed: boolean; authenticated: boolean };
  hetzner: { configured: boolean; host?: string };
}

// ============================================================================
// Platform Detection & Setup
// ============================================================================

// Hetzner config file path
const HETZNER_CONFIG_PATH = join(process.env.HOME || '/tmp', '.agent-girl-hetzner.json');

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
  const status: PlatformStatus = {
    vercel: { installed: false, authenticated: false },
    netlify: { installed: false, authenticated: false },
    cloudflare: { installed: false, authenticated: false },
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

    return new Response(JSON.stringify({
      error: 'Nicht gefunden',
      availableEndpoints: [
        'GET /api/deploy/status',
        'GET /api/deploy/framework?projectPath=...',
        'POST /api/deploy',
        'POST /api/deploy/quick',
        'POST /api/deploy/vercel/config'
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
