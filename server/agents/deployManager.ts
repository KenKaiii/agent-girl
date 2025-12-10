/**
 * Agent Girl - One-Click Deploy Manager
 * Supports: Vercel, Netlify, Cloudflare Pages, Hetzner, Coolify
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  DeployConfig,
  DeployProvider,
  DeployResult,
  ExecutionPlan,
  ExecutionPhase,
} from './types';

const execAsync = promisify(exec);

// ============================================================
// PROVIDER CONFIGS
// ============================================================

interface ProviderConfig {
  name: DeployProvider;
  cli: string;
  installCmd: string;
  loginCmd: string;
  deployCmd: string;
  configFile: string;
  envPrefix: string;
  supportsPreview: boolean;
  supportsEdge: boolean;
  pricing: {
    free: boolean;
    startingPrice: number;
    unit: string;
  };
}

const PROVIDERS: Record<DeployProvider, ProviderConfig> = {
  vercel: {
    name: 'vercel',
    cli: 'vercel',
    installCmd: 'bun add -g vercel',
    loginCmd: 'vercel login',
    deployCmd: 'vercel deploy',
    configFile: 'vercel.json',
    envPrefix: 'VERCEL_',
    supportsPreview: true,
    supportsEdge: true,
    pricing: { free: true, startingPrice: 20, unit: '/month' },
  },
  netlify: {
    name: 'netlify',
    cli: 'netlify',
    installCmd: 'bun add -g netlify-cli',
    loginCmd: 'netlify login',
    deployCmd: 'netlify deploy',
    configFile: 'netlify.toml',
    envPrefix: 'NETLIFY_',
    supportsPreview: true,
    supportsEdge: true,
    pricing: { free: true, startingPrice: 19, unit: '/month' },
  },
  cloudflare: {
    name: 'cloudflare',
    cli: 'wrangler',
    installCmd: 'bun add -g wrangler',
    loginCmd: 'wrangler login',
    deployCmd: 'wrangler pages deploy',
    configFile: 'wrangler.toml',
    envPrefix: 'CF_',
    supportsPreview: true,
    supportsEdge: true,
    pricing: { free: true, startingPrice: 5, unit: '/month' },
  },
  hetzner: {
    name: 'hetzner',
    cli: 'hcloud',
    installCmd: 'brew install hcloud',
    loginCmd: 'hcloud context create',
    deployCmd: 'docker compose up -d',
    configFile: 'docker-compose.yml',
    envPrefix: 'HCLOUD_',
    supportsPreview: false,
    supportsEdge: false,
    pricing: { free: false, startingPrice: 3.79, unit: '/month' },
  },
  coolify: {
    name: 'coolify',
    cli: 'ssh',
    installCmd: 'brew install openssh',
    loginCmd: 'ssh-keygen',
    deployCmd: 'git push coolify main',
    configFile: 'coolify.yaml',
    envPrefix: 'COOLIFY_',
    supportsPreview: true,
    supportsEdge: false,
    pricing: { free: true, startingPrice: 0, unit: 'self-hosted' },
  },
};

// ============================================================
// FRAMEWORK DETECTION
// ============================================================

interface FrameworkConfig {
  name: string;
  buildCmd: string;
  outputDir: string;
  devCmd: string;
  framework?: string; // For provider-specific settings
}

const FRAMEWORKS: Record<string, FrameworkConfig> = {
  next: {
    name: 'Next.js',
    buildCmd: 'bun run build',
    outputDir: '.next',
    devCmd: 'bun run dev',
    framework: 'nextjs',
  },
  astro: {
    name: 'Astro',
    buildCmd: 'bun run build',
    outputDir: 'dist',
    devCmd: 'bun run dev',
    framework: 'astro',
  },
  vite: {
    name: 'Vite',
    buildCmd: 'bun run build',
    outputDir: 'dist',
    devCmd: 'bun run dev',
  },
  remix: {
    name: 'Remix',
    buildCmd: 'bun run build',
    outputDir: 'build',
    devCmd: 'bun run dev',
    framework: 'remix',
  },
  nuxt: {
    name: 'Nuxt',
    buildCmd: 'bun run build',
    outputDir: '.output',
    devCmd: 'bun run dev',
    framework: 'nuxt',
  },
  sveltekit: {
    name: 'SvelteKit',
    buildCmd: 'bun run build',
    outputDir: 'build',
    devCmd: 'bun run dev',
    framework: 'sveltekit',
  },
  static: {
    name: 'Static',
    buildCmd: '',
    outputDir: 'dist',
    devCmd: '',
  },
};

// ============================================================
// DEPLOY MANAGER
// ============================================================

export class DeployManager {
  private projectPath: string;
  private framework: FrameworkConfig | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  // ============================================================
  // DETECTION
  // ============================================================

  /**
   * Detect project framework
   */
  async detectFramework(): Promise<FrameworkConfig> {
    if (this.framework) return this.framework;

    try {
      const pkgPath = join(this.projectPath, 'package.json');
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.next) this.framework = FRAMEWORKS.next;
      else if (deps.astro) this.framework = FRAMEWORKS.astro;
      else if (deps.remix || deps['@remix-run/react']) this.framework = FRAMEWORKS.remix;
      else if (deps.nuxt) this.framework = FRAMEWORKS.nuxt;
      else if (deps['@sveltejs/kit']) this.framework = FRAMEWORKS.sveltekit;
      else if (deps.vite) this.framework = FRAMEWORKS.vite;
      else this.framework = FRAMEWORKS.static;

      return this.framework;
    } catch {
      return FRAMEWORKS.static;
    }
  }

  /**
   * Recommend best provider for project
   */
  async recommendProvider(): Promise<{
    recommended: DeployProvider;
    alternatives: DeployProvider[];
    reasons: string[];
  }> {
    const framework = await this.detectFramework();
    const reasons: string[] = [];

    // Check for existing configs
    const hasVercelConfig = await this.fileExists('vercel.json');
    const hasNetlifyConfig = await this.fileExists('netlify.toml');
    const hasCloudflareConfig = await this.fileExists('wrangler.toml');
    const hasDockerCompose = await this.fileExists('docker-compose.yml');

    if (hasVercelConfig) {
      reasons.push('Existing vercel.json detected');
      return { recommended: 'vercel', alternatives: ['netlify', 'cloudflare'], reasons };
    }

    if (hasNetlifyConfig) {
      reasons.push('Existing netlify.toml detected');
      return { recommended: 'netlify', alternatives: ['vercel', 'cloudflare'], reasons };
    }

    if (hasCloudflareConfig) {
      reasons.push('Existing wrangler.toml detected');
      return { recommended: 'cloudflare', alternatives: ['vercel', 'netlify'], reasons };
    }

    if (hasDockerCompose) {
      reasons.push('Docker Compose detected - self-hosting recommended');
      return { recommended: 'coolify', alternatives: ['hetzner'], reasons };
    }

    // Framework-based recommendation
    switch (framework.name) {
      case 'Next.js':
        reasons.push('Next.js has best support on Vercel');
        return { recommended: 'vercel', alternatives: ['netlify', 'cloudflare'], reasons };

      case 'Astro':
        reasons.push('Astro works great on Cloudflare (edge)');
        return { recommended: 'cloudflare', alternatives: ['vercel', 'netlify'], reasons };

      case 'Remix':
        reasons.push('Remix has native Cloudflare Workers support');
        return { recommended: 'cloudflare', alternatives: ['vercel', 'netlify'], reasons };

      case 'Nuxt':
        reasons.push('Nuxt has great Netlify integration');
        return { recommended: 'netlify', alternatives: ['vercel', 'cloudflare'], reasons };

      default:
        reasons.push('Static/Vite projects work well on all platforms');
        reasons.push('Cloudflare has best free tier');
        return { recommended: 'cloudflare', alternatives: ['vercel', 'netlify'], reasons };
    }
  }

  // ============================================================
  // DEPLOYMENT
  // ============================================================

  /**
   * One-click deploy
   */
  async deploy(config: DeployConfig): Promise<DeployResult> {
    const provider = PROVIDERS[config.provider];
    const framework = await this.detectFramework();
    const startTime = Date.now();

    try {
      // 1. Check CLI installed
      await this.ensureCLI(provider);

      // 2. Generate config file
      await this.generateConfig(config, framework);

      // 3. Build project
      if (framework.buildCmd) {
        await this.runCommand(framework.buildCmd, 'Building project...');
      }

      // 4. Deploy
      const deployOutput = await this.runDeploy(config, provider, framework);

      // 5. Extract URL
      const url = this.extractDeployUrl(deployOutput, config.provider);

      return {
        success: true,
        provider: config.provider,
        url,
        buildTime: Date.now() - startTime,
        logs: deployOutput,
      };
    } catch (error) {
      return {
        success: false,
        provider: config.provider,
        error: error instanceof Error ? error.message : String(error),
        buildTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate deployment execution plan
   */
  generateDeployPlan(config: DeployConfig): ExecutionPlan {
    const provider = PROVIDERS[config.provider];

    const phases: ExecutionPhase[] = [
      {
        name: 'Setup',
        steps: [
          {
            id: 'check_cli',
            action: 'check_command',
            params: { command: provider.cli },
            model: 'haiku',
            maxRetries: 1,
            fallbackStrategy: {
              type: 'alternative',
              alternatives: [
                {
                  id: 'install_cli',
                  action: 'run_command',
                  params: { command: provider.installCmd },
                  model: 'haiku',
                  maxRetries: 2,
                },
              ],
            },
          },
          {
            id: 'check_auth',
            action: 'check_auth',
            params: { provider: config.provider },
            model: 'haiku',
            maxRetries: 1,
          },
        ],
        parallel: false,
        timeout: 60000,
      },
      {
        name: 'Configure',
        steps: [
          {
            id: 'generate_config',
            action: 'generate_file',
            params: {
              path: provider.configFile,
              type: 'deploy_config',
            },
            model: 'sonnet',
            maxRetries: 2,
          },
          {
            id: 'set_env_vars',
            action: 'set_env',
            params: {
              provider: config.provider,
              vars: config.envVars,
            },
            model: 'haiku',
            maxRetries: 2,
          },
        ],
        parallel: false,
        timeout: 30000,
      },
      {
        name: 'Build',
        steps: [
          {
            id: 'install_deps',
            action: 'run_command',
            params: { command: 'bun install' },
            model: 'haiku',
            maxRetries: 2,
          },
          {
            id: 'build',
            action: 'run_command',
            params: { command: 'bun run build' },
            model: 'haiku',
            maxRetries: 2,
          },
        ],
        parallel: false,
        timeout: 300000,
      },
      {
        name: 'Deploy',
        steps: [
          {
            id: 'deploy',
            action: 'run_command',
            params: { command: this.getDeployCommand(config, provider) },
            model: 'haiku',
            maxRetries: 3,
          },
        ],
        parallel: false,
        timeout: 300000,
      },
      {
        name: 'Verify',
        steps: [
          {
            id: 'health_check',
            action: 'http_check',
            params: {
              url: '${deploy_url}',
              expectedStatus: 200,
            },
            model: 'haiku',
            maxRetries: 5,
          },
        ],
        parallel: false,
        timeout: 60000,
      },
    ];

    return {
      id: `deploy_${config.provider}_${Date.now()}`,
      goal: `Deploy to ${config.provider}`,
      phases,
      estimatedDuration: 600000,
      estimatedCost: 0.02,
      checkpoints: [2, 3], // After Build and Deploy
    };
  }

  // ============================================================
  // CONFIG GENERATORS
  // ============================================================

  private async generateConfig(
    config: DeployConfig,
    framework: FrameworkConfig
  ): Promise<void> {
    switch (config.provider) {
      case 'vercel':
        await this.generateVercelConfig(config, framework);
        break;
      case 'netlify':
        await this.generateNetlifyConfig(config, framework);
        break;
      case 'cloudflare':
        await this.generateCloudflareConfig(config, framework);
        break;
      case 'hetzner':
        await this.generateHetznerConfig(config, framework);
        break;
      case 'coolify':
        await this.generateCoolifyConfig(config, framework);
        break;
    }
  }

  private async generateVercelConfig(
    config: DeployConfig,
    framework: FrameworkConfig
  ): Promise<void> {
    const vercelConfig = {
      $schema: 'https://openapi.vercel.sh/vercel.json',
      framework: framework.framework,
      buildCommand: framework.buildCmd || undefined,
      outputDirectory: framework.outputDir,
      regions: config.region ? [config.region] : undefined,
      env: config.envVars,
      headers: [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
          ],
        },
      ],
    };

    await writeFile(
      join(this.projectPath, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
  }

  private async generateNetlifyConfig(
    config: DeployConfig,
    framework: FrameworkConfig
  ): Promise<void> {
    const netlifyConfig = `[build]
  command = "${framework.buildCmd || 'echo No build'}"
  publish = "${framework.outputDir}"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}
`;

    await writeFile(join(this.projectPath, 'netlify.toml'), netlifyConfig);
  }

  private async generateCloudflareConfig(
    config: DeployConfig,
    framework: FrameworkConfig
  ): Promise<void> {
    const projectName = config.projectName || 'my-project';

    const wranglerConfig = `name = "${projectName}"
compatibility_date = "2024-01-01"

[site]
bucket = "./${framework.outputDir}"

[build]
command = "${framework.buildCmd || ''}"

# Uncomment for edge functions
# [[pages.function]]
# binding = "AI"
# type = "ai"
`;

    await writeFile(join(this.projectPath, 'wrangler.toml'), wranglerConfig);
  }

  private async generateHetznerConfig(
    config: DeployConfig,
    framework: FrameworkConfig
  ): Promise<void> {
    const dockerCompose = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
${Object.entries(config.envVars || {})
  .map(([k, v]) => `      - ${k}=${v}`)
  .join('\n')}
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(\`${config.domain || 'app.example.com'}\`)"
      - "traefik.http.routers.app.tls=true"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"

  traefik:
    image: traefik:v2.10
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=${config.email || 'admin@example.com'}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    restart: unless-stopped
`;

    const dockerfile = `FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .
RUN ${framework.buildCmd || 'bun run build'}

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/${framework.outputDir} ./${framework.outputDir}
COPY --from=builder /app/package.json .
EXPOSE 3000
CMD ["bun", "run", "start"]
`;

    await writeFile(join(this.projectPath, 'docker-compose.yml'), dockerCompose);
    await writeFile(join(this.projectPath, 'Dockerfile'), dockerfile);
  }

  private async generateCoolifyConfig(
    config: DeployConfig,
    framework: FrameworkConfig
  ): Promise<void> {
    const coolifyConfig = `name: ${config.projectName || 'my-app'}
type: application

build:
  type: nixpacks
  command: ${framework.buildCmd || 'bun run build'}

deploy:
  port: 3000
  healthcheck:
    path: /
    interval: 30s
    timeout: 10s

domains:
  - ${config.domain || 'app.example.com'}

environment:
${Object.entries(config.envVars || {})
  .map(([k, v]) => `  ${k}: "${v}"`)
  .join('\n')}
`;

    await writeFile(join(this.projectPath, 'coolify.yaml'), coolifyConfig);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async ensureCLI(provider: ProviderConfig): Promise<void> {
    try {
      await execAsync(`which ${provider.cli}`);
    } catch {
      await this.runCommand(provider.installCmd, `Installing ${provider.cli}...`);
    }
  }

  private async runCommand(command: string, message?: string): Promise<string> {
    if (message) console.log(message);

    const { stdout, stderr } = await execAsync(command, {
      cwd: this.projectPath,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr && !stderr.includes('warning')) {
      console.warn(stderr);
    }

    return stdout;
  }

  private async runDeploy(
    config: DeployConfig,
    provider: ProviderConfig,
    framework: FrameworkConfig
  ): Promise<string> {
    const command = this.getDeployCommand(config, provider);
    return this.runCommand(command, `Deploying to ${provider.name}...`);
  }

  private getDeployCommand(config: DeployConfig, provider: ProviderConfig): string {
    const production = config.production ? '--prod' : '';

    switch (config.provider) {
      case 'vercel':
        return `vercel deploy ${production} --yes`;

      case 'netlify':
        return config.production
          ? 'netlify deploy --prod'
          : 'netlify deploy';

      case 'cloudflare':
        return `wrangler pages deploy ${config.production ? '--branch main' : ''}`;

      case 'hetzner':
        return 'docker compose up -d --build';

      case 'coolify':
        return 'git push coolify main';

      default:
        return provider.deployCmd;
    }
  }

  private extractDeployUrl(output: string, provider: DeployProvider): string | undefined {
    const patterns: Record<DeployProvider, RegExp> = {
      vercel: /https:\/\/[\w-]+\.vercel\.app/,
      netlify: /https:\/\/[\w-]+\.netlify\.app/,
      cloudflare: /https:\/\/[\w-]+\.pages\.dev/,
      hetzner: /Server IP:\s*([\d.]+)/,
      coolify: /Deployed to:\s*(https?:\/\/[^\s]+)/,
    };

    const match = output.match(patterns[provider]);
    return match ? match[0] : undefined;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(join(this.projectPath, path));
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================
  // STATUS & INFO
  // ============================================================

  /**
   * Get deployment status
   */
  async getStatus(provider: DeployProvider): Promise<{
    deployed: boolean;
    url?: string;
    lastDeploy?: Date;
    status?: 'ready' | 'building' | 'error';
  }> {
    const providerConfig = PROVIDERS[provider];

    try {
      switch (provider) {
        case 'vercel': {
          const { stdout } = await execAsync('vercel ls --json', {
            cwd: this.projectPath,
          });
          const deployments = JSON.parse(stdout);
          if (deployments.length > 0) {
            return {
              deployed: true,
              url: deployments[0].url,
              lastDeploy: new Date(deployments[0].created),
              status: deployments[0].state === 'READY' ? 'ready' : 'building',
            };
          }
          break;
        }

        case 'netlify': {
          const { stdout } = await execAsync('netlify status --json', {
            cwd: this.projectPath,
          });
          const status = JSON.parse(stdout);
          return {
            deployed: !!status.site_id,
            url: status.ssl_url,
            status: status.published_deploy?.state || 'ready',
          };
        }

        case 'cloudflare': {
          const { stdout } = await execAsync('wrangler pages deployment list --json', {
            cwd: this.projectPath,
          });
          const deployments = JSON.parse(stdout);
          if (deployments.length > 0) {
            return {
              deployed: true,
              url: deployments[0].url,
              lastDeploy: new Date(deployments[0].created_on),
              status: 'ready',
            };
          }
          break;
        }
      }
    } catch {
      // Not deployed or CLI not configured
    }

    return { deployed: false };
  }

  /**
   * Get all provider info
   */
  getProviderInfo(provider: DeployProvider): ProviderConfig {
    return PROVIDERS[provider];
  }

  /**
   * List all providers
   */
  listProviders(): ProviderConfig[] {
    return Object.values(PROVIDERS);
  }
}

// Export factory
export function createDeployManager(projectPath: string): DeployManager {
  return new DeployManager(projectPath);
}
