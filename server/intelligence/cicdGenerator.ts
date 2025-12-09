/**
 * Agent Girl - CI/CD Pipeline Generator
 * Generates optimized CI/CD pipelines for GitHub Actions, GitLab CI, etc.
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type {
  CICDConfig,
  CICDProvider,
  ExecutionPlan,
  ExecutionPhase,
} from './types';

// ============================================================
// TYPES
// ============================================================

interface PipelineStage {
  name: string;
  jobs: PipelineJob[];
  dependsOn?: string[];
}

interface PipelineJob {
  name: string;
  runsOn: string;
  steps: PipelineStep[];
  needs?: string[];
  if?: string;
  timeout?: number;
  env?: Record<string, string>;
  matrix?: {
    node?: string[];
    os?: string[];
  };
}

interface PipelineStep {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, string | boolean | number>;
  env?: Record<string, string>;
  if?: string;
}

interface TemplateConfig {
  name: string;
  description: string;
  stages: PipelineStage[];
  triggers: {
    push?: string[];
    pull_request?: string[];
    schedule?: string[];
  };
  caching?: boolean;
  artifacts?: boolean;
}

// ============================================================
// PIPELINE TEMPLATES
// ============================================================

const TEMPLATES: Record<string, TemplateConfig> = {
  'bun-full': {
    name: 'Bun Full Pipeline',
    description: 'Complete CI/CD with Bun: lint, test, build, deploy',
    stages: [
      {
        name: 'Quality',
        jobs: [
          {
            name: 'lint',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
              { name: 'Install', run: 'bun install --frozen-lockfile' },
              { name: 'Lint', run: 'bun run lint' },
              { name: 'Type Check', run: 'bunx tsc --noEmit' },
            ],
          },
        ],
      },
      {
        name: 'Test',
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
              { name: 'Install', run: 'bun install --frozen-lockfile' },
              { name: 'Test', run: 'bun test --coverage' },
              {
                name: 'Upload Coverage',
                uses: 'codecov/codecov-action@v4',
                with: { token: '${{ secrets.CODECOV_TOKEN }}' },
              },
            ],
            needs: ['lint'],
          },
        ],
        dependsOn: ['Quality'],
      },
      {
        name: 'Build',
        jobs: [
          {
            name: 'build',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
              { name: 'Install', run: 'bun install --frozen-lockfile' },
              { name: 'Build', run: 'bun run build' },
              {
                name: 'Upload Artifact',
                uses: 'actions/upload-artifact@v4',
                with: {
                  name: 'build',
                  path: 'dist/',
                  'retention-days': 7,
                },
              },
            ],
            needs: ['test'],
          },
        ],
        dependsOn: ['Test'],
      },
      {
        name: 'Deploy',
        jobs: [
          {
            name: 'deploy',
            runsOn: 'ubuntu-latest',
            if: "github.ref == 'refs/heads/main'",
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              {
                name: 'Download Artifact',
                uses: 'actions/download-artifact@v4',
                with: { name: 'build', path: 'dist/' },
              },
              {
                name: 'Deploy to Vercel',
                uses: 'amondnet/vercel-action@v25',
                with: {
                  'vercel-token': '${{ secrets.VERCEL_TOKEN }}',
                  'vercel-org-id': '${{ secrets.VERCEL_ORG_ID }}',
                  'vercel-project-id': '${{ secrets.VERCEL_PROJECT_ID }}',
                  'vercel-args': '--prod',
                },
              },
            ],
            needs: ['build'],
          },
        ],
        dependsOn: ['Build'],
      },
    ],
    triggers: {
      push: ['main', 'develop'],
      pull_request: ['main'],
    },
    caching: true,
    artifacts: true,
  },

  'node-matrix': {
    name: 'Node.js Matrix Testing',
    description: 'Test across multiple Node.js versions',
    stages: [
      {
        name: 'Test',
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            matrix: {
              node: ['18', '20', '22'],
            },
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              {
                name: 'Setup Node',
                uses: 'actions/setup-node@v4',
                with: { 'node-version': '${{ matrix.node }}' },
              },
              { name: 'Install', run: 'npm ci' },
              { name: 'Test', run: 'npm test' },
            ],
          },
        ],
      },
    ],
    triggers: {
      push: ['main'],
      pull_request: ['main'],
    },
    caching: true,
    artifacts: false,
  },

  'docker-build': {
    name: 'Docker Build & Push',
    description: 'Build and push Docker images to registry',
    stages: [
      {
        name: 'Build',
        jobs: [
          {
            name: 'docker',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              {
                name: 'Set up QEMU',
                uses: 'docker/setup-qemu-action@v3',
              },
              {
                name: 'Set up Docker Buildx',
                uses: 'docker/setup-buildx-action@v3',
              },
              {
                name: 'Login to Registry',
                uses: 'docker/login-action@v3',
                with: {
                  registry: 'ghcr.io',
                  username: '${{ github.actor }}',
                  password: '${{ secrets.GITHUB_TOKEN }}',
                },
              },
              {
                name: 'Build and Push',
                uses: 'docker/build-push-action@v5',
                with: {
                  context: '.',
                  platforms: 'linux/amd64,linux/arm64',
                  push: true,
                  tags: 'ghcr.io/${{ github.repository }}:${{ github.sha }}',
                  cache_from: 'type=gha',
                  cache_to: 'type=gha,mode=max',
                },
              },
            ],
          },
        ],
      },
    ],
    triggers: {
      push: ['main'],
    },
    caching: true,
    artifacts: false,
  },

  'release-please': {
    name: 'Automated Releases',
    description: 'Automated versioning and releases with Release Please',
    stages: [
      {
        name: 'Release',
        jobs: [
          {
            name: 'release',
            runsOn: 'ubuntu-latest',
            steps: [
              {
                name: 'Release Please',
                uses: 'google-github-actions/release-please-action@v4',
                with: {
                  'release-type': 'node',
                  'package-name': '${{ github.event.repository.name }}',
                },
              },
            ],
          },
        ],
      },
    ],
    triggers: {
      push: ['main'],
    },
    caching: false,
    artifacts: false,
  },

  'security-scan': {
    name: 'Security Scanning',
    description: 'Dependency and code security scanning',
    stages: [
      {
        name: 'Security',
        jobs: [
          {
            name: 'audit',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
              { name: 'Audit', run: 'bun audit' },
            ],
          },
          {
            name: 'codeql',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              {
                name: 'Initialize CodeQL',
                uses: 'github/codeql-action/init@v3',
                with: { languages: 'javascript-typescript' },
              },
              {
                name: 'Analyze',
                uses: 'github/codeql-action/analyze@v3',
              },
            ],
          },
        ],
      },
    ],
    triggers: {
      push: ['main'],
      schedule: ['0 0 * * 0'], // Weekly
    },
    caching: false,
    artifacts: false,
  },

  'preview-deployments': {
    name: 'Preview Deployments',
    description: 'Deploy preview for every PR',
    stages: [
      {
        name: 'Preview',
        jobs: [
          {
            name: 'deploy-preview',
            runsOn: 'ubuntu-latest',
            if: "github.event_name == 'pull_request'",
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
              { name: 'Install', run: 'bun install --frozen-lockfile' },
              { name: 'Build', run: 'bun run build' },
              {
                name: 'Deploy Preview',
                uses: 'amondnet/vercel-action@v25',
                with: {
                  'vercel-token': '${{ secrets.VERCEL_TOKEN }}',
                  'vercel-org-id': '${{ secrets.VERCEL_ORG_ID }}',
                  'vercel-project-id': '${{ secrets.VERCEL_PROJECT_ID }}',
                  'github-comment': true,
                },
              },
            ],
          },
        ],
      },
    ],
    triggers: {
      pull_request: ['main', 'develop'],
    },
    caching: true,
    artifacts: false,
  },

  'monorepo-turbo': {
    name: 'Turborepo Monorepo',
    description: 'Optimized CI for Turborepo monorepos',
    stages: [
      {
        name: 'Build',
        jobs: [
          {
            name: 'build',
            runsOn: 'ubuntu-latest',
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4', with: { 'fetch-depth': 2 } },
              { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
              {
                name: 'Cache Turbo',
                uses: 'actions/cache@v4',
                with: {
                  path: '.turbo',
                  key: '${{ runner.os }}-turbo-${{ github.sha }}',
                  'restore-keys': '${{ runner.os }}-turbo-',
                },
              },
              { name: 'Install', run: 'bun install --frozen-lockfile' },
              { name: 'Build', run: 'bunx turbo run build --filter="...[HEAD^]"' },
              { name: 'Test', run: 'bunx turbo run test --filter="...[HEAD^]"' },
            ],
          },
        ],
      },
    ],
    triggers: {
      push: ['main'],
      pull_request: ['main'],
    },
    caching: true,
    artifacts: true,
  },
};

// ============================================================
// CI/CD GENERATOR
// ============================================================

export class CICDGenerator {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  // ============================================================
  // GENERATION
  // ============================================================

  /**
   * Generate CI/CD pipeline from config
   */
  async generate(config: CICDConfig): Promise<{
    success: boolean;
    files: string[];
    error?: string;
  }> {
    try {
      const files: string[] = [];

      switch (config.provider) {
        case 'github':
          files.push(...(await this.generateGitHubActions(config)));
          break;
        case 'gitlab':
          files.push(...(await this.generateGitLabCI(config)));
          break;
        case 'bitbucket':
          files.push(...(await this.generateBitbucketPipelines(config)));
          break;
      }

      return { success: true, files };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate from template
   */
  async generateFromTemplate(
    templateName: string,
    provider: CICDProvider = 'github'
  ): Promise<{ success: boolean; files: string[]; error?: string }> {
    const template = TEMPLATES[templateName];
    if (!template) {
      return {
        success: false,
        files: [],
        error: `Unknown template: ${templateName}`,
      };
    }

    const config: CICDConfig = {
      provider,
      projectName: 'my-project',
      stages: template.stages.map(s => ({
        name: s.name as any,
        enabled: true,
      })),
      triggers: template.triggers,
      caching: template.caching ?? true,
      artifacts: template.artifacts ?? true,
    };

    return this.generate(config);
  }

  /**
   * List available templates
   */
  listTemplates(): Array<{ name: string; description: string }> {
    return Object.entries(TEMPLATES).map(([name, config]) => ({
      name,
      description: config.description,
    }));
  }

  // ============================================================
  // GITHUB ACTIONS
  // ============================================================

  private async generateGitHubActions(config: CICDConfig): Promise<string[]> {
    const workflowDir = join(this.projectPath, '.github', 'workflows');
    await mkdir(workflowDir, { recursive: true });

    const files: string[] = [];

    // Main CI workflow
    const ciWorkflow = this.buildGitHubWorkflow(config, 'ci');
    const ciPath = join(workflowDir, 'ci.yml');
    await writeFile(ciPath, ciWorkflow);
    files.push('.github/workflows/ci.yml');

    // PR workflow (if different triggers)
    if (config.triggers?.pull_request) {
      const prWorkflow = this.buildGitHubWorkflow(config, 'pr');
      const prPath = join(workflowDir, 'pr.yml');
      await writeFile(prPath, prWorkflow);
      files.push('.github/workflows/pr.yml');
    }

    // Release workflow
    if (config.stages?.some(s => s.name === 'release' && s.enabled)) {
      const releaseWorkflow = this.buildReleaseWorkflow(config);
      const releasePath = join(workflowDir, 'release.yml');
      await writeFile(releasePath, releaseWorkflow);
      files.push('.github/workflows/release.yml');
    }

    return files;
  }

  private buildGitHubWorkflow(config: CICDConfig, type: 'ci' | 'pr'): string {
    const isCI = type === 'ci';

    const workflow: any = {
      name: isCI ? 'CI' : 'PR Checks',
      on: {},
      env: {
        CI: 'true',
      },
      jobs: {},
    };

    // Triggers
    if (isCI && config.triggers?.push) {
      workflow.on.push = { branches: config.triggers.push };
    }
    if (!isCI && config.triggers?.pull_request) {
      workflow.on.pull_request = { branches: config.triggers.pull_request };
    }
    if (config.triggers?.schedule) {
      workflow.on.schedule = config.triggers.schedule.map(cron => ({ cron }));
    }

    // Jobs
    const stages = config.stages?.filter(s => s.enabled) || [];

    // Lint job
    if (stages.some(s => s.name === 'lint')) {
      workflow.jobs.lint = {
        'runs-on': 'ubuntu-latest',
        steps: [
          { name: 'Checkout', uses: 'actions/checkout@v4' },
          { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
          ...(config.caching
            ? [
                {
                  name: 'Cache',
                  uses: 'actions/cache@v4',
                  with: {
                    path: '~/.bun/install/cache\nnode_modules',
                    key: "${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}",
                  },
                },
              ]
            : []),
          { name: 'Install', run: 'bun install --frozen-lockfile' },
          { name: 'Lint', run: 'bun run lint' },
          { name: 'Type Check', run: 'bunx tsc --noEmit' },
        ],
      };
    }

    // Test job
    if (stages.some(s => s.name === 'test')) {
      workflow.jobs.test = {
        'runs-on': 'ubuntu-latest',
        needs: workflow.jobs.lint ? ['lint'] : undefined,
        steps: [
          { name: 'Checkout', uses: 'actions/checkout@v4' },
          { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
          ...(config.caching
            ? [
                {
                  name: 'Cache',
                  uses: 'actions/cache@v4',
                  with: {
                    path: '~/.bun/install/cache\nnode_modules',
                    key: "${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}",
                  },
                },
              ]
            : []),
          { name: 'Install', run: 'bun install --frozen-lockfile' },
          { name: 'Test', run: 'bun test --coverage' },
          ...(config.artifacts
            ? [
                {
                  name: 'Upload Coverage',
                  uses: 'codecov/codecov-action@v4',
                  if: 'always()',
                  with: { token: '${{ secrets.CODECOV_TOKEN }}' },
                },
              ]
            : []),
        ],
      };
    }

    // Build job
    if (stages.some(s => s.name === 'build')) {
      workflow.jobs.build = {
        'runs-on': 'ubuntu-latest',
        needs: workflow.jobs.test ? ['test'] : undefined,
        steps: [
          { name: 'Checkout', uses: 'actions/checkout@v4' },
          { name: 'Setup Bun', uses: 'oven-sh/setup-bun@v1' },
          ...(config.caching
            ? [
                {
                  name: 'Cache',
                  uses: 'actions/cache@v4',
                  with: {
                    path: '~/.bun/install/cache\nnode_modules',
                    key: "${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}",
                  },
                },
              ]
            : []),
          { name: 'Install', run: 'bun install --frozen-lockfile' },
          { name: 'Build', run: 'bun run build' },
          ...(config.artifacts
            ? [
                {
                  name: 'Upload Build',
                  uses: 'actions/upload-artifact@v4',
                  with: {
                    name: 'build',
                    path: 'dist/',
                    'retention-days': 7,
                  },
                },
              ]
            : []),
        ],
      };
    }

    // Deploy job (CI only, main branch)
    if (isCI && stages.some(s => s.name === 'deploy')) {
      workflow.jobs.deploy = {
        'runs-on': 'ubuntu-latest',
        needs: ['build'],
        if: "github.ref == 'refs/heads/main'",
        environment: {
          name: 'production',
          url: '${{ steps.deploy.outputs.url }}',
        },
        steps: [
          { name: 'Checkout', uses: 'actions/checkout@v4' },
          ...(config.artifacts
            ? [
                {
                  name: 'Download Build',
                  uses: 'actions/download-artifact@v4',
                  with: { name: 'build', path: 'dist/' },
                },
              ]
            : []),
          {
            name: 'Deploy',
            id: 'deploy',
            uses: 'amondnet/vercel-action@v25',
            with: {
              'vercel-token': '${{ secrets.VERCEL_TOKEN }}',
              'vercel-org-id': '${{ secrets.VERCEL_ORG_ID }}',
              'vercel-project-id': '${{ secrets.VERCEL_PROJECT_ID }}',
              'vercel-args': '--prod',
            },
          },
        ],
      };
    }

    return this.toYAML(workflow);
  }

  private buildReleaseWorkflow(config: CICDConfig): string {
    const workflow = {
      name: 'Release',
      on: {
        push: { branches: ['main'] },
      },
      permissions: {
        contents: 'write',
        'pull-requests': 'write',
      },
      jobs: {
        release: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Release Please',
              uses: 'google-github-actions/release-please-action@v4',
              id: 'release',
              with: {
                'release-type': 'node',
              },
            },
            {
              name: 'Checkout',
              uses: 'actions/checkout@v4',
              if: '${{ steps.release.outputs.release_created }}',
            },
            {
              name: 'Setup Bun',
              uses: 'oven-sh/setup-bun@v1',
              if: '${{ steps.release.outputs.release_created }}',
            },
            {
              name: 'Publish',
              run: 'bun publish',
              if: '${{ steps.release.outputs.release_created }}',
              env: {
                NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
              },
            },
          ],
        },
      },
    };

    return this.toYAML(workflow);
  }

  // ============================================================
  // GITLAB CI
  // ============================================================

  private async generateGitLabCI(config: CICDConfig): Promise<string[]> {
    const stages = config.stages?.filter(s => s.enabled).map(s => s.name) || [];

    const gitlabCI: any = {
      image: 'oven/bun:1',
      stages,
      cache: config.caching
        ? {
            key: '$CI_COMMIT_REF_SLUG',
            paths: ['node_modules/', '.bun/'],
          }
        : undefined,
    };

    // Lint job
    if (stages.includes('lint')) {
      gitlabCI.lint = {
        stage: 'lint',
        script: ['bun install --frozen-lockfile', 'bun run lint', 'bunx tsc --noEmit'],
      };
    }

    // Test job
    if (stages.includes('test')) {
      gitlabCI.test = {
        stage: 'test',
        script: ['bun install --frozen-lockfile', 'bun test --coverage'],
        coverage: '/Lines\\s*:\\s*(\\d+\\.?\\d*)%/',
        artifacts: config.artifacts
          ? {
              reports: { coverage_report: { coverage_format: 'cobertura', path: 'coverage/cobertura-coverage.xml' } },
            }
          : undefined,
      };
    }

    // Build job
    if (stages.includes('build')) {
      gitlabCI.build = {
        stage: 'build',
        script: ['bun install --frozen-lockfile', 'bun run build'],
        artifacts: config.artifacts
          ? {
              paths: ['dist/'],
              expire_in: '1 week',
            }
          : undefined,
      };
    }

    // Deploy job
    if (stages.includes('deploy')) {
      gitlabCI.deploy = {
        stage: 'deploy',
        script: ['bun install --frozen-lockfile', 'bun run deploy'],
        environment: {
          name: 'production',
          url: 'https://$CI_PROJECT_NAME.example.com',
        },
        only: ['main'],
      };
    }

    const ciPath = join(this.projectPath, '.gitlab-ci.yml');
    await writeFile(ciPath, this.toYAML(gitlabCI));

    return ['.gitlab-ci.yml'];
  }

  // ============================================================
  // BITBUCKET PIPELINES
  // ============================================================

  private async generateBitbucketPipelines(config: CICDConfig): Promise<string[]> {
    const stages = config.stages?.filter(s => s.enabled) || [];

    const pipelines: any = {
      image: 'oven/bun:1',
      definitions: {
        caches: {
          bun: '~/.bun',
        },
        steps: [],
      },
      pipelines: {
        default: [],
        branches: {
          main: [],
        },
      },
    };

    const steps: any[] = [];

    // Lint step
    if (stages.some(s => s.name === 'lint')) {
      steps.push({
        step: {
          name: 'Lint',
          caches: config.caching ? ['bun', 'node'] : undefined,
          script: ['bun install --frozen-lockfile', 'bun run lint', 'bunx tsc --noEmit'],
        },
      });
    }

    // Test step
    if (stages.some(s => s.name === 'test')) {
      steps.push({
        step: {
          name: 'Test',
          caches: config.caching ? ['bun', 'node'] : undefined,
          script: ['bun install --frozen-lockfile', 'bun test --coverage'],
        },
      });
    }

    // Build step
    if (stages.some(s => s.name === 'build')) {
      steps.push({
        step: {
          name: 'Build',
          caches: config.caching ? ['bun', 'node'] : undefined,
          script: ['bun install --frozen-lockfile', 'bun run build'],
          artifacts: config.artifacts ? ['dist/**'] : undefined,
        },
      });
    }

    pipelines.pipelines.default = steps;

    // Deploy step (main branch only)
    if (stages.some(s => s.name === 'deploy')) {
      pipelines.pipelines.branches.main = [
        ...steps,
        {
          step: {
            name: 'Deploy',
            deployment: 'production',
            script: ['bun run deploy'],
          },
        },
      ];
    }

    const pipelinesPath = join(this.projectPath, 'bitbucket-pipelines.yml');
    await writeFile(pipelinesPath, this.toYAML(pipelines));

    return ['bitbucket-pipelines.yml'];
  }

  // ============================================================
  // EXECUTION PLAN
  // ============================================================

  /**
   * Generate execution plan for CI/CD setup
   */
  generateSetupPlan(config: CICDConfig): ExecutionPlan {
    const phases: ExecutionPhase[] = [
      {
        name: 'Analyze',
        steps: [
          {
            id: 'detect_framework',
            action: 'detect_framework',
            params: {},
            model: 'haiku',
            maxRetries: 1,
          },
          {
            id: 'check_existing',
            action: 'check_files',
            params: {
              paths: ['.github/workflows', '.gitlab-ci.yml', 'bitbucket-pipelines.yml'],
            },
            model: 'haiku',
            maxRetries: 1,
          },
        ],
        parallel: true,
        timeout: 30000,
      },
      {
        name: 'Generate',
        steps: [
          {
            id: 'generate_pipeline',
            action: 'generate_cicd',
            params: { config },
            model: 'sonnet',
            maxRetries: 2,
          },
        ],
        parallel: false,
        timeout: 60000,
      },
      {
        name: 'Configure',
        steps: [
          {
            id: 'setup_secrets',
            action: 'configure_secrets',
            params: {
              provider: config.provider,
              secrets: ['VERCEL_TOKEN', 'CODECOV_TOKEN'],
            },
            model: 'haiku',
            maxRetries: 1,
            fallbackStrategy: { type: 'skip' },
          },
        ],
        parallel: false,
        timeout: 30000,
      },
      {
        name: 'Validate',
        steps: [
          {
            id: 'validate_yaml',
            action: 'validate_yaml',
            params: {},
            model: 'haiku',
            maxRetries: 1,
          },
          {
            id: 'dry_run',
            action: 'dry_run',
            params: { provider: config.provider },
            model: 'haiku',
            maxRetries: 1,
            fallbackStrategy: { type: 'skip' },
          },
        ],
        parallel: true,
        timeout: 60000,
      },
    ];

    return {
      id: `cicd_setup_${Date.now()}`,
      goal: `Setup ${config.provider} CI/CD pipeline`,
      phases,
      estimatedDuration: 180000,
      estimatedCost: 0.01,
      checkpoints: [1],
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private toYAML(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  - ${this.toYAML(item, indent + 2).trim().replace(/\n/g, `\n${spaces}    `)}\n`;
          } else {
            yaml += `${spaces}  - ${this.formatValue(item)}\n`;
          }
        }
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
      } else {
        yaml += `${spaces}${key}: ${this.formatValue(value)}\n`;
      }
    }

    return yaml;
  }

  private formatValue(value: any): string {
    if (typeof value === 'string') {
      // Quote strings with special characters
      if (
        value.includes(':') ||
        value.includes('#') ||
        value.includes('$') ||
        value.includes('{') ||
        value.includes('\n') ||
        value.startsWith("'") ||
        value.startsWith('"')
      ) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }
}

// Export factory
export function createCICDGenerator(projectPath: string): CICDGenerator {
  return new CICDGenerator(projectPath);
}
