#!/usr/bin/env bun
/**
 * Agent-Girl Test Workflow Runner
 * Comprehensive testing, validation, and quality assurance automation
 */

import { spawn, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip' | 'error';
  duration: number;
  output?: string;
  errors?: string[];
}

interface StageResult {
  stage: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  tests: TestResult[];
  summary: string;
}

interface WorkflowReport {
  timestamp: string;
  projectRoot: string;
  totalDuration: number;
  overallStatus: 'pass' | 'fail';
  stages: StageResult[];
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    coverage?: number;
  };
}

type StageHandler = () => Promise<StageResult>;

export class TestWorkflow {
  private projectRoot: string;
  private stages: Map<string, StageHandler> = new Map();
  private results: StageResult[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.registerDefaultStages();
  }

  private registerDefaultStages(): void {
    this.stages.set('lint', () => this.runLintStage());
    this.stages.set('typecheck', () => this.runTypeCheckStage());
    this.stages.set('unit', () => this.runUnitTestStage());
    this.stages.set('integration', () => this.runIntegrationTestStage());
    this.stages.set('security', () => this.runSecurityStage());
    this.stages.set('analyze', () => this.runAnalyzeStage());
    this.stages.set('build', () => this.runBuildStage());
  }

  async runFullWorkflow(): Promise<WorkflowReport> {
    const startTime = Date.now();
    console.log('═'.repeat(60));
    console.log('  AGENT-GIRL TEST WORKFLOW');
    console.log('═'.repeat(60));
    console.log(`  Started: ${new Date().toISOString()}`);
    console.log(`  Project: ${this.projectRoot}`);
    console.log('═'.repeat(60));
    console.log('');

    const stageOrder = ['lint', 'typecheck', 'unit', 'integration', 'security', 'analyze', 'build'];

    for (const stageName of stageOrder) {
      const handler = this.stages.get(stageName);
      if (!handler) continue;

      console.log(`\n┌─ STAGE: ${stageName.toUpperCase()} ${'─'.repeat(45 - stageName.length)}┐`);

      try {
        const result = await handler();
        this.results.push(result);

        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
        console.log(`└─ ${icon} ${result.summary} (${result.duration}ms) ${'─'.repeat(Math.max(0, 30 - result.summary.length))}┘`);

        // Stop on critical failures
        if (result.status === 'fail' && ['lint', 'typecheck'].includes(stageName)) {
          console.log('\n⚠️  Stopping workflow due to critical failure');
          break;
        }
      } catch (err) {
        this.results.push({
          stage: stageName,
          status: 'fail',
          duration: 0,
          tests: [],
          summary: `Error: ${err instanceof Error ? err.message : String(err)}`,
        });
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const report = this.generateReport(totalDuration);

    this.printSummary(report);

    return report;
  }

  async runStage(stageName: string): Promise<StageResult> {
    const handler = this.stages.get(stageName);
    if (!handler) {
      throw new Error(`Unknown stage: ${stageName}`);
    }
    return handler();
  }

  // Stage Implementations

  private async runLintStage(): Promise<StageResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Run ESLint
    const eslintResult = await this.runCommand('bun', ['run', 'lint'], 'ESLint');
    tests.push(eslintResult);

    // Check for console.log statements (optional warning)
    const consoleLogCheck = await this.checkPattern(
      'console\\.log',
      ['server/**/*.ts', 'client/**/*.ts'],
      'Console.log Check',
      'warning'
    );
    tests.push(consoleLogCheck);

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;

    return {
      stage: 'lint',
      status: failed > 0 ? 'fail' : 'pass',
      duration: Date.now() - startTime,
      tests,
      summary: `${passed} passed, ${failed} failed`,
    };
  }

  private async runTypeCheckStage(): Promise<StageResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // TypeScript check for server
    const serverTsc = await this.runCommand('bun', ['run', 'typecheck'], 'Server TypeCheck');
    tests.push(serverTsc);

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;

    return {
      stage: 'typecheck',
      status: failed > 0 ? 'fail' : 'pass',
      duration: Date.now() - startTime,
      tests,
      summary: `${passed} passed, ${failed} failed`,
    };
  }

  private async runUnitTestStage(): Promise<StageResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Run unit tests with Bun
    const unitTests = await this.runCommand(
      'bun',
      ['test', '--bail', 'tests/'],
      'Unit Tests'
    );
    tests.push(unitTests);

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;

    return {
      stage: 'unit',
      status: failed > 0 ? 'fail' : 'pass',
      duration: Date.now() - startTime,
      tests,
      summary: `${passed} passed, ${failed} failed`,
    };
  }

  private async runIntegrationTestStage(): Promise<StageResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Check if integration test file exists
    const integrationTestPath = join(this.projectRoot, 'tests/integration.test.ts');
    if (existsSync(integrationTestPath)) {
      const integrationTests = await this.runCommand(
        'bun',
        ['test', 'tests/integration.test.ts'],
        'Integration Tests'
      );
      tests.push(integrationTests);
    } else {
      tests.push({
        name: 'Integration Tests',
        status: 'skip',
        duration: 0,
        output: 'No integration tests found',
      });
    }

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;
    const skipped = tests.filter(t => t.status === 'skip').length;

    return {
      stage: 'integration',
      status: failed > 0 ? 'fail' : 'pass',
      duration: Date.now() - startTime,
      tests,
      summary: `${passed} passed, ${failed} failed, ${skipped} skipped`,
    };
  }

  private async runSecurityStage(): Promise<StageResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Check for hardcoded secrets
    const secretsCheck = await this.checkPattern(
      '(password|secret|api_key|apikey)\\s*[=:]\\s*[\'"][^\'"]{8,}[\'"]',
      ['server/**/*.ts', 'client/**/*.ts'],
      'Hardcoded Secrets',
      'error'
    );
    tests.push(secretsCheck);

    // Check for eval usage
    const evalCheck = await this.checkPattern(
      'eval\\s*\\(',
      ['server/**/*.ts', 'client/**/*.ts'],
      'Eval Usage',
      'error'
    );
    tests.push(evalCheck);

    // Check for SQL injection patterns
    const sqlCheck = await this.checkPattern(
      '\\$\\{.*\\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)',
      ['server/**/*.ts'],
      'SQL Injection Risk',
      'warning'
    );
    tests.push(sqlCheck);

    // Run bun audit (if available)
    const auditResult = await this.runCommand('bun', ['pm', 'audit'], 'Dependency Audit');
    tests.push(auditResult);

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;

    return {
      stage: 'security',
      status: failed > 0 ? 'fail' : 'pass',
      duration: Date.now() - startTime,
      tests,
      summary: `${passed} checks passed, ${failed} issues found`,
    };
  }

  private async runAnalyzeStage(): Promise<StageResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Run code analyzer
    const analyzerPath = join(this.projectRoot, 'tools/analyzer/cli.ts');
    if (existsSync(analyzerPath)) {
      const analyzerResult = await this.runCommand(
        'bun',
        ['run', analyzerPath, '--check-circular', '--max-complexity=20'],
        'Code Analysis'
      );
      tests.push(analyzerResult);
    } else {
      tests.push({
        name: 'Code Analysis',
        status: 'skip',
        duration: 0,
        output: 'Analyzer not found',
      });
    }

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;

    return {
      stage: 'analyze',
      status: failed > 0 ? 'fail' : 'pass',
      duration: Date.now() - startTime,
      tests,
      summary: `${passed} passed, ${failed} failed`,
    };
  }

  private async runBuildStage(): Promise<StageResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Build the project
    const buildResult = await this.runCommand('bun', ['run', 'build'], 'Production Build');
    tests.push(buildResult);

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;

    return {
      stage: 'build',
      status: failed > 0 ? 'fail' : 'pass',
      duration: Date.now() - startTime,
      tests,
      summary: `${passed} passed, ${failed} failed`,
    };
  }

  // Helper Methods

  private async runCommand(cmd: string, args: string[], name: string): Promise<TestResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const process = spawn(cmd, args, {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        const output = stdout + stderr;

        console.log(`  ${code === 0 ? '✓' : '✗'} ${name} (${duration}ms)`);

        resolve({
          name,
          status: code === 0 ? 'pass' : 'fail',
          duration,
          output: output.slice(0, 2000), // Limit output
          errors: code !== 0 ? [output.slice(0, 500)] : undefined,
        });
      });

      process.on('error', (err) => {
        resolve({
          name,
          status: 'error',
          duration: Date.now() - startTime,
          errors: [err.message],
        });
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        process.kill();
        resolve({
          name,
          status: 'error',
          duration: Date.now() - startTime,
          errors: ['Test timeout exceeded (5 minutes)'],
        });
      }, 5 * 60 * 1000);
    });
  }

  private async checkPattern(
    pattern: string,
    globs: string[],
    name: string,
    severity: 'error' | 'warning'
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const result = spawnSync('rg', ['-l', '-i', pattern, ...globs], {
        cwd: this.projectRoot,
        encoding: 'utf-8',
      });

      const matches = result.stdout?.trim().split('\n').filter(Boolean) || [];
      const duration = Date.now() - startTime;

      if (matches.length > 0) {
        console.log(`  ${severity === 'error' ? '✗' : '⚠'} ${name}: ${matches.length} matches`);
        return {
          name,
          status: severity === 'error' ? 'fail' : 'pass',
          duration,
          output: `Found in: ${matches.slice(0, 5).join(', ')}${matches.length > 5 ? '...' : ''}`,
          errors: severity === 'error' ? matches : undefined,
        };
      }

      console.log(`  ✓ ${name} (${duration}ms)`);
      return { name, status: 'pass', duration };
    } catch {
      return {
        name,
        status: 'skip',
        duration: Date.now() - startTime,
        output: 'ripgrep not available',
      };
    }
  }

  private generateReport(totalDuration: number): WorkflowReport {
    const allTests = this.results.flatMap(r => r.tests);
    const passed = allTests.filter(t => t.status === 'pass').length;
    const failed = allTests.filter(t => t.status === 'fail').length;
    const skipped = allTests.filter(t => t.status === 'skip').length;

    const overallStatus = this.results.some(r => r.status === 'fail') ? 'fail' : 'pass';

    return {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      totalDuration,
      overallStatus,
      stages: this.results,
      summary: { passed, failed, skipped },
    };
  }

  private printSummary(report: WorkflowReport): void {
    console.log('\n' + '═'.repeat(60));
    console.log('  WORKFLOW SUMMARY');
    console.log('═'.repeat(60));

    for (const stage of report.stages) {
      const icon = stage.status === 'pass' ? '✅' : stage.status === 'fail' ? '❌' : '⏭️';
      console.log(`  ${icon} ${stage.stage.toUpperCase().padEnd(15)} ${stage.summary}`);
    }

    console.log('─'.repeat(60));
    console.log(`  Total Duration: ${report.totalDuration}ms`);
    console.log(`  Tests: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.skipped} skipped`);
    console.log('═'.repeat(60));

    if (report.overallStatus === 'pass') {
      console.log('\n  ✅ ALL CHECKS PASSED\n');
    } else {
      console.log('\n  ❌ SOME CHECKS FAILED\n');
    }
  }

  // Export report to file
  saveReport(report: WorkflowReport, outputDir: string): void {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const jsonPath = join(outputDir, 'workflow-report.json');
    writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${jsonPath}`);
  }
}

// CLI Entry Point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const projectRoot = args.find(a => !a.startsWith('-')) || process.cwd();

  const workflow = new TestWorkflow(projectRoot);

  if (args.includes('--stage')) {
    const stageIndex = args.indexOf('--stage');
    const stageName = args[stageIndex + 1];
    const result = await workflow.runStage(stageName);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'pass' ? 0 : 1);
  }

  const report = await workflow.runFullWorkflow();

  if (args.includes('--save')) {
    workflow.saveReport(report, join(projectRoot, 'reports'));
  }

  process.exit(report.overallStatus === 'pass' ? 0 : 1);
}

main().catch(err => {
  console.error('Workflow failed:', err);
  process.exit(1);
});
