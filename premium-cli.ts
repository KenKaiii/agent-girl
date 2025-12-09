#!/usr/bin/env bun
/**
 * Premium Website Builder CLI
 *
 * Direct CLI for testing and controlling the Premium Website Builder
 * without needing the web interface.
 *
 * Usage:
 *   bun run premium-cli.ts build "Create a dental clinic website"
 *   bun run premium-cli.ts build "..." --output ./my-website --model sonnet
 *   bun run premium-cli.ts plan "..." --show-steps
 *   bun run premium-cli.ts status <buildId>
 *   bun run premium-cli.ts list
 *   bun run premium-cli.ts test
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateDecompositionPlan,
  type DecompositionPlan,
  type WebsiteProject
} from './server/utils/premium/smartDecomposition';
import {
  PremiumWebsiteExecutor,
  type ExecutionConfig,
  type StepProgress,
  type StepError,
  type ExecutionResult
} from './server/utils/premium/executor';

/**
 * Auto-detect niche from prompt keywords
 */
function detectNicheFromPrompt(prompt: string): string {
  const promptLower = prompt.toLowerCase();

  const nicheKeywords: Record<string, string[]> = {
    healthcare: ['arzt', 'doctor', 'zahnarzt', 'dentist', 'klinik', 'clinic', 'praxis', 'therapist', 'healthcare', 'medical'],
    saas: ['saas', 'software', 'app', 'tool', 'platform', 'startup', 'tech'],
    ecommerce: ['shop', 'store', 'ecommerce', 'products', 'verkauf', 'online shop', 'retail'],
    restaurant: ['restaurant', 'cafe', 'bar', 'food', 'essen', 'gastronomie', 'bistro', 'catering'],
    realestate: ['immobilien', 'real estate', 'makler', 'wohnung', 'haus', 'property'],
    fitness: ['fitness', 'gym', 'sport', 'yoga', 'training', 'personal trainer'],
    agency: ['agency', 'agentur', 'marketing', 'consulting', 'beratung'],
  };

  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    for (const keyword of keywords) {
      if (promptLower.includes(keyword)) {
        return niche;
      }
    }
  }

  return 'agency'; // Default fallback
}

/**
 * Create a WebsiteProject from a prompt
 */
function createProjectFromPrompt(prompt: string): WebsiteProject {
  const detectedNiche = detectNicheFromPrompt(prompt);

  return {
    id: `project_${Date.now()}`,
    businessDescription: prompt,
    nicheId: detectedNiche,
    designSystemId: 'modern',
    hasExistingContent: false,
    features: ['responsive', 'seo', 'performance'],
    pages: ['home', 'about', 'contact'],
    integrations: [],
  };
}

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const args = process.argv.slice(2);
const command = args[0];

// Active builds storage (in-memory for CLI session)
const activeBuilds = new Map<string, {
  plan: DecompositionPlan;
  executor: PremiumWebsiteExecutor;
  status: 'running' | 'complete' | 'error';
  startTime: number;
}>();

/**
 * Generate a unique build ID
 */
function generateBuildId(): string {
  return `build_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Log with color
 */
function log(color: keyof typeof colors, message: string): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Progress bar renderer
 */
function renderProgressBar(current: number, total: number, width = 40): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}% (${current}/${total})`;
}

/**
 * Plan command - Generate decomposition plan without executing
 */
async function planCommand(prompt: string, showSteps: boolean): Promise<void> {
  log('cyan', '\n🔍 Analyzing prompt and generating 100-step plan...\n');

  const startTime = Date.now();

  try {
    const project = createProjectFromPrompt(prompt);
    const plan = await generateDecompositionPlan(project);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log('green', `✅ Plan generated in ${duration}s\n`);

    console.log(`${colors.bright}Project ID:${colors.reset} ${plan.projectId}`);
    console.log(`${colors.bright}Total Steps:${colors.reset} ${plan.totalSteps}`);
    console.log(`${colors.bright}Estimated Duration:${colors.reset} ${plan.estimatedDuration}`);
    console.log(`${colors.bright}Estimated Cost:${colors.reset} ${plan.estimatedCost}`);

    console.log(`\n${colors.bright}Phases:${colors.reset}`);
    for (const phase of plan.phases) {
      console.log(`  ${colors.cyan}${phase.name}${colors.reset} (Steps ${phase.stepRange[0]}-${phase.stepRange[1]})`);
      console.log(`    ${colors.dim}${phase.description}${colors.reset}`);
    }

    if (showSteps) {
      console.log(`\n${colors.bright}All Steps:${colors.reset}\n`);
      for (const step of plan.steps) {
        const phaseColor = step.phase === 'foundation' ? 'blue' :
                          step.phase === 'content' ? 'green' :
                          step.phase === 'validation' ? 'yellow' : 'cyan';
        console.log(`  ${colors[phaseColor]}[${step.id}]${colors.reset} ${step.name}`);
        console.log(`      ${colors.dim}${step.description.substring(0, 80)}...${colors.reset}`);
        console.log(`      Tokens: ~${step.estimatedTokens} | Outputs: ${step.outputs.join(', ')}`);
      }
    }

    // Save plan to file
    const planPath = `/tmp/premium-plan-${plan.projectId}.json`;
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    log('dim', `\nPlan saved to: ${planPath}`);

  } catch (error) {
    log('red', `\n❌ Error generating plan: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Build command - Execute full website build
 */
async function buildCommand(
  prompt: string,
  outputDir: string,
  model: 'haiku' | 'sonnet' | 'opus'
): Promise<void> {
  const buildId = generateBuildId();
  log('cyan', `\n🚀 Starting Premium Build: ${buildId}\n`);
  log('dim', `Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
  log('dim', `Output: ${outputDir}`);
  log('dim', `Model: ${model}\n`);

  // Step 1: Generate plan
  log('yellow', '📋 Phase 1: Generating 100-step decomposition plan...');

  let plan: DecompositionPlan;
  try {
    const project = createProjectFromPrompt(prompt);
    plan = await generateDecompositionPlan(project);
    log('green', `✅ Plan generated: ${plan.totalSteps} steps across ${plan.phases.length} phases\n`);
  } catch (error) {
    log('red', `❌ Plan generation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Ensure output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 2: Execute plan
  log('yellow', '🔨 Phase 2: Executing build steps...\n');

  const config: ExecutionConfig = {
    projectPath: outputDir,
    businessName: 'Premium Website',
    model,
    maxRetries: 7,

    onProgress: (progress: StepProgress) => {
      const statusIcon = progress.status === 'completed' ? '✅' :
                        progress.status === 'executing' ? '⚙️' :
                        progress.status === 'failed' ? '❌' :
                        progress.status === 'skipped' ? '⏭️' : '⏳';

      // Clear line and render progress
      process.stdout.write('\r\x1b[K');
      process.stdout.write(
        `${statusIcon} ${renderProgressBar(progress.stepId, plan.totalSteps)} ` +
        `${colors.cyan}[${progress.phase}]${colors.reset} ${progress.stepName}`
      );

      if (progress.status === 'completed' && progress.filesCreated?.length) {
        process.stdout.write(`\n   ${colors.dim}Files: ${progress.filesCreated.join(', ')}${colors.reset}`);
      }
      process.stdout.write('\n');
    },

    onError: (error: StepError) => {
      log('red', `\n⚠️  Error at step ${error.stepId}: ${error.stepName}`);
      log('dim', `   ${error.error}`);
      log('dim', `   Retry ${error.retryCount}/${7}, escalating to: ${error.escalatedModel || model}`);
    },

    onComplete: (result: ExecutionResult) => {
      console.log('\n');
      if (result.success) {
        log('green', '═══════════════════════════════════════════════════════');
        log('green', '  ✅ BUILD COMPLETE');
        log('green', '═══════════════════════════════════════════════════════');
      } else {
        log('red', '═══════════════════════════════════════════════════════');
        log('red', '  ❌ BUILD FAILED');
        log('red', '═══════════════════════════════════════════════════════');
      }

      console.log(`\n${colors.bright}Summary:${colors.reset}`);
      console.log(`  Steps: ${result.completedSteps}/${result.totalSteps} completed`);
      console.log(`  Failed: ${result.failedSteps}`);
      console.log(`  Skipped: ${result.skippedSteps}`);
      console.log(`  Duration: ${(result.duration / 1000 / 60).toFixed(1)} minutes`);
      console.log(`  Tokens: ${result.totalTokens.toLocaleString()}`);
      console.log(`  Cost: $${result.totalCost.toFixed(4)}`);
      console.log(`  Files: ${result.filesCreated.length} created`);
      console.log(`  Output: ${result.projectPath}`);

      if (result.errors.length > 0) {
        console.log(`\n${colors.bright}Errors:${colors.reset}`);
        for (const err of result.errors) {
          console.log(`  ${colors.red}[Step ${err.stepId}]${colors.reset} ${err.stepName}: ${err.error}`);
        }
      }
    },
  };

  const executor = new PremiumWebsiteExecutor(plan, config);

  // Store active build
  activeBuilds.set(buildId, {
    plan,
    executor,
    status: 'running',
    startTime: Date.now(),
  });

  try {
    const result = await executor.execute();
    activeBuilds.get(buildId)!.status = result.success ? 'complete' : 'error';

    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    log('red', `\n❌ Build execution failed: ${error instanceof Error ? error.message : String(error)}`);
    activeBuilds.get(buildId)!.status = 'error';
    process.exit(1);
  }
}

/**
 * Test command - Run integration test
 */
async function testCommand(): Promise<void> {
  log('cyan', '\n🧪 Premium Builder Integration Test\n');

  const testCases = [
    {
      name: 'Plan Generation',
      run: async () => {
        const project = createProjectFromPrompt('Test website for a bakery');
        const plan = await generateDecompositionPlan(project);
        if (plan.totalSteps < 50) throw new Error(`Expected at least 50 steps, got ${plan.totalSteps}`);
        if (plan.phases.length === 0) throw new Error('No phases generated');
        return `${plan.totalSteps} steps, ${plan.phases.length} phases`;
      },
    },
    {
      name: 'Executor Initialization',
      run: async () => {
        const project = createProjectFromPrompt('Test');
        const plan = await generateDecompositionPlan(project);
        const executor = new PremiumWebsiteExecutor(plan, {
          projectPath: '/tmp/test-premium',
          businessName: 'Test',
          model: 'haiku',
        });
        if (!executor) throw new Error('Executor not created');
        return 'Executor created successfully';
      },
    },
    {
      name: 'Claude CLI Available',
      run: async () => {
        const { execSync } = await import('child_process');
        // Try common paths for claude CLI
        const paths = [
          'claude',
          '/opt/homebrew/bin/claude',
          '/usr/local/bin/claude',
          `${process.env.HOME}/.npm-global/bin/claude`,
        ];

        for (const claudePath of paths) {
          try {
            const version = execSync(`${claudePath} --version 2>/dev/null`, { encoding: 'utf-8' }).trim();
            return `${version} (${claudePath})`;
          } catch {
            // Try next path
          }
        }
        throw new Error('Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code');
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    process.stdout.write(`  ${test.name}... `);
    try {
      const result = await test.run();
      log('green', `✅ ${result}`);
      passed++;
    } catch (error) {
      log('red', `❌ ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  console.log(`\n${colors.bright}Results:${colors.reset} ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

/**
 * Dry run command - Execute plan without Claude (for testing flow)
 */
async function dryRunCommand(prompt: string, outputDir: string): Promise<void> {
  log('cyan', '\n🧪 Dry Run Mode (no actual Claude calls)\n');
  log('dim', `Prompt: "${prompt.substring(0, 100)}..."`);
  log('dim', `Output: ${outputDir}\n`);

  // Generate plan
  log('yellow', '📋 Generating plan...');
  const project = createProjectFromPrompt(prompt);
  const plan = await generateDecompositionPlan(project);
  log('green', `✅ Plan: ${plan.totalSteps} steps\n`);

  // Ensure output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Simulate execution
  log('yellow', '🔨 Simulating execution...\n');

  let totalTokens = 0;
  const startTime = Date.now();

  for (const step of plan.steps) {
    // Render progress
    process.stdout.write('\r\x1b[K');
    process.stdout.write(
      `${renderProgressBar(step.id, plan.totalSteps)} ` +
      `${colors.cyan}[${step.phase}]${colors.reset} ${step.name}`
    );

    // Simulate delay (much faster than real execution)
    await new Promise(resolve => setTimeout(resolve, 50));
    totalTokens += step.estimatedTokens;

    // Create placeholder files (skip directories and node_modules)
    for (const output of step.outputs) {
      // Skip directories and node_modules
      if (output.endsWith('/') || output.includes('node_modules')) {
        continue;
      }

      // Skip if no file extension (likely a directory)
      if (!output.includes('.')) {
        continue;
      }

      try {
        const filePath = path.join(outputDir, output);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, `// Placeholder for ${output}\n// Generated by step ${step.id}: ${step.name}\n`);
        }
      } catch {
        // Skip files that can't be created
      }
    }
  }

  const duration = Date.now() - startTime;

  console.log('\n\n');
  log('green', '═══════════════════════════════════════════════════════');
  log('green', '  ✅ DRY RUN COMPLETE');
  log('green', '═══════════════════════════════════════════════════════');

  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`  Steps: ${plan.totalSteps}`);
  console.log(`  Duration: ${(duration / 1000).toFixed(1)}s (simulated)`);
  console.log(`  Est. Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`  Est. Cost: $${(totalTokens * 0.00001).toFixed(4)}`);
  console.log(`  Output: ${outputDir}`);

  // List created directories
  console.log(`\n${colors.bright}Created structure:${colors.reset}`);
  const { execSync } = await import('child_process');
  try {
    const tree = execSync(`find ${outputDir} -type f | head -20`, { encoding: 'utf-8' });
    console.log(colors.dim + tree + colors.reset);
  } catch {
    // Ignore errors
  }
}

/**
 * Status command - Show status of project builds
 */
async function statusCommand(outputDir: string): Promise<void> {
  log('cyan', '\n📊 Premium Build Status\n');

  // Check if directory exists
  if (!fs.existsSync(outputDir)) {
    log('red', `Directory not found: ${outputDir}`);
    return;
  }

  // Check for key files to determine build progress
  const checkFiles: Record<string, string> = {
    'package.json': 'Foundation',
    'astro.config.mjs': 'Foundation',
    'tailwind.config.mjs': 'Foundation',
    'src/layouts/Layout.astro': 'Foundation',
    'src/components/Button.astro': 'Components',
    'src/components/Card.astro': 'Components',
    'src/sections/Hero.astro': 'Sections',
    'src/pages/index.astro': 'Pages',
    'src/pages/about.astro': 'Pages',
    'src/content/site.json': 'Content',
    'public/images/hero': 'Images',
    'public/sitemap.xml': 'SEO',
    'public/robots.txt': 'SEO',
    'dist/': 'Build',
  };

  const phases: Record<string, { found: number; total: number; files: string[] }> = {};

  for (const [file, phase] of Object.entries(checkFiles)) {
    if (!phases[phase]) {
      phases[phase] = { found: 0, total: 0, files: [] };
    }
    phases[phase].total++;

    const fullPath = path.join(outputDir, file);
    if (fs.existsSync(fullPath)) {
      phases[phase].found++;
      phases[phase].files.push(file);
    }
  }

  console.log(`${colors.bright}Directory:${colors.reset} ${outputDir}\n`);

  let totalFound = 0;
  let totalExpected = 0;

  for (const [phase, data] of Object.entries(phases)) {
    const percentage = Math.round((data.found / data.total) * 100);
    const statusIcon = percentage === 100 ? '✅' : percentage > 0 ? '🔶' : '⬜';

    console.log(`  ${statusIcon} ${colors.bright}${phase}${colors.reset}: ${data.found}/${data.total} (${percentage}%)`);

    if (data.found > 0 && data.found < data.total) {
      console.log(`     ${colors.dim}Found: ${data.files.join(', ')}${colors.reset}`);
    }

    totalFound += data.found;
    totalExpected += data.total;
  }

  const overallPercentage = Math.round((totalFound / totalExpected) * 100);
  console.log(`\n${colors.bright}Overall Progress:${colors.reset} ${overallPercentage}%`);

  // Check for build artifacts
  const distPath = path.join(outputDir, 'dist');
  if (fs.existsSync(distPath)) {
    log('green', '\n✅ Production build exists');
    const { execSync } = await import('child_process');
    try {
      const size = execSync(`du -sh ${distPath}`, { encoding: 'utf-8' }).trim().split('\t')[0];
      console.log(`   Size: ${size}`);
    } catch {
      // Ignore
    }
  }
}

/**
 * Inspect command - Show details of a generated plan
 */
async function inspectCommand(planPath: string): Promise<void> {
  log('cyan', '\n🔎 Plan Inspection\n');

  if (!fs.existsSync(planPath)) {
    log('red', `Plan file not found: ${planPath}`);
    return;
  }

  try {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));

    console.log(`${colors.bright}Project ID:${colors.reset} ${plan.projectId}`);
    console.log(`${colors.bright}Total Steps:${colors.reset} ${plan.totalSteps}`);
    console.log(`${colors.bright}Phases:${colors.reset} ${plan.phases.length}`);

    // Calculate token distribution by phase
    const phaseTokens: Record<string, number> = {};
    for (const step of plan.steps) {
      phaseTokens[step.phase] = (phaseTokens[step.phase] || 0) + step.estimatedTokens;
    }

    console.log(`\n${colors.bright}Token Distribution:${colors.reset}`);
    for (const [phase, tokens] of Object.entries(phaseTokens)) {
      const bar = '█'.repeat(Math.round(tokens / 1000));
      console.log(`  ${colors.cyan}${phase.padEnd(12)}${colors.reset} ${bar} ${tokens.toLocaleString()}`);
    }

    const totalTokens = Object.values(phaseTokens).reduce((a, b) => a + b, 0);
    console.log(`\n${colors.bright}Total Tokens:${colors.reset} ${totalTokens.toLocaleString()}`);
    console.log(`${colors.bright}Est. Cost:${colors.reset} $${(totalTokens * 0.00001).toFixed(4)}`);

  } catch (error) {
    log('red', `Error reading plan: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List recent plans
 */
async function listPlansCommand(): Promise<void> {
  log('cyan', '\n📋 Recent Premium Plans\n');

  const { execSync } = await import('child_process');
  try {
    const files = execSync('ls -lt /tmp/premium-plan-*.json 2>/dev/null | head -10', { encoding: 'utf-8' });
    if (files.trim()) {
      console.log(files);
    } else {
      log('dim', 'No plans found in /tmp/');
    }
  } catch {
    log('dim', 'No plans found in /tmp/');
  }
}

/**
 * Help command
 */
function showHelp(): void {
  console.log(`
${colors.bright}🏗️  Premium Website Builder CLI${colors.reset}

${colors.bright}Usage:${colors.reset}
  bun run premium-cli.ts <command> [options]

${colors.bright}Commands:${colors.reset}
  ${colors.cyan}build${colors.reset} <prompt>            Build a complete website
    --output <dir>            Output directory (default: ./premium-output)
    --model <haiku|sonnet|opus>  Model to use (default: haiku)

  ${colors.cyan}plan${colors.reset} <prompt>             Generate plan without building
    --show-steps              Show all 100 steps in detail

  ${colors.cyan}dry-run${colors.reset} <prompt>          Simulate build without Claude calls
    --output <dir>            Output directory

  ${colors.cyan}status${colors.reset} <dir>              Show build status of a project

  ${colors.cyan}inspect${colors.reset} <plan.json>       Inspect a generated plan file

  ${colors.cyan}list-plans${colors.reset}                List recent plans in /tmp/

  ${colors.cyan}test${colors.reset}                      Run integration tests

  ${colors.cyan}--help${colors.reset}                    Show this help

${colors.bright}Examples:${colors.reset}
  ${colors.dim}# Generate plan only${colors.reset}
  bun run premium-cli.ts plan "Create a modern dental clinic website"

  ${colors.dim}# Full build with custom output${colors.reset}
  bun run premium-cli.ts build "Create a bakery website" --output ./bakery-site

  ${colors.dim}# Dry run to test flow${colors.reset}
  bun run premium-cli.ts dry-run "Restaurant website" --output /tmp/test

  ${colors.dim}# Check build status${colors.reset}
  bun run premium-cli.ts status /tmp/dental-test

  ${colors.dim}# Inspect generated plan${colors.reset}
  bun run premium-cli.ts inspect /tmp/premium-plan-project_xxx.json

  ${colors.dim}# Run tests${colors.reset}
  bun run premium-cli.ts test

${colors.bright}Environment:${colors.reset}
  Requires 'claude' CLI to be installed and authenticated.
  Install: npm install -g @anthropic-ai/claude-code
`);
}

/**
 * Parse CLI arguments
 */
function parseArgs(): {
  prompt?: string;
  output: string;
  model: 'haiku' | 'sonnet' | 'opus';
  showSteps: boolean;
} {
  let prompt: string | undefined;
  let output = './premium-output';
  let model: 'haiku' | 'sonnet' | 'opus' = 'haiku';
  let showSteps = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      output = args[++i];
    } else if (arg === '--model' || arg === '-m') {
      const m = args[++i];
      if (m === 'haiku' || m === 'sonnet' || m === 'opus') {
        model = m;
      }
    } else if (arg === '--show-steps') {
      showSteps = true;
    } else if (!arg.startsWith('-') && !prompt) {
      prompt = arg;
    }
  }

  return { prompt, output, model, showSteps };
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const { prompt, output, model, showSteps } = parseArgs();

  switch (command) {
    case 'build':
      if (!prompt) {
        log('red', '\n❌ Please provide a prompt for the website');
        showHelp();
        process.exit(1);
      }
      await buildCommand(prompt, output, model);
      break;

    case 'plan':
      if (!prompt) {
        log('red', '\n❌ Please provide a prompt for the plan');
        showHelp();
        process.exit(1);
      }
      await planCommand(prompt, showSteps);
      break;

    case 'dry-run':
    case 'dryrun':
      if (!prompt) {
        log('red', '\n❌ Please provide a prompt for dry run');
        showHelp();
        process.exit(1);
      }
      await dryRunCommand(prompt, output);
      break;

    case 'test':
      await testCommand();
      break;

    case 'status':
      if (!prompt) {
        log('red', '\n❌ Please provide a directory to check');
        showHelp();
        process.exit(1);
      }
      await statusCommand(prompt);
      break;

    case 'inspect':
      if (!prompt) {
        log('red', '\n❌ Please provide a plan file path');
        showHelp();
        process.exit(1);
      }
      await inspectCommand(prompt);
      break;

    case 'list-plans':
    case 'list':
      await listPlansCommand();
      break;

    case '--help':
    case 'help':
    case '-h':
      showHelp();
      break;

    case undefined:
      showHelp();
      break;

    default:
      log('red', `\n❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  log('red', `\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});
