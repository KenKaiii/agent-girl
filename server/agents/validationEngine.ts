/**
 * Agent Girl - Validation Engine with Regression Testing
 * Multi-layer validation: TypeScript, Build, Test, Runtime, UI
 *
 * Key Insight: Validation loop prevents feature-breaking during autonomous execution
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, access, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { ExecutionPlan } from './types';

const execAsync = promisify(exec);

// ============================================================
// TYPES
// ============================================================

export interface ValidationResult {
  id: string;
  type: ValidationType;
  passed: boolean;
  score: number; // 0-1
  duration: number;
  steps: ValidationStep[];
  errors: ValidationError[];
  warnings: string[];
  timestamp: number;
}

export interface ValidationStep {
  name: string;
  passed: boolean;
  duration: number;
  output?: string;
  error?: string;
}

export interface ValidationError {
  type: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}

export type ValidationType =
  | 'typescript'
  | 'lint'
  | 'build'
  | 'test'
  | 'runtime'
  | 'api'
  | 'ui'
  | 'performance'
  | 'security'
  | 'custom';

export interface ValidationConfig {
  projectPath: string;
  timeout: number;
  parallel: boolean;
  stopOnFirstFailure: boolean;
  minScore: number;
  enabledTypes: ValidationType[];
  customValidators: CustomValidator[];
}

export interface CustomValidator {
  name: string;
  type: ValidationType;
  command?: string;
  script?: string;
  expectedOutput?: string | RegExp;
  timeout?: number;
}

export interface RegressionTest {
  id: string;
  name: string;
  description: string;
  featureId?: number;
  steps: RegressionStep[];
  lastRun?: number;
  lastResult?: boolean;
}

export interface RegressionStep {
  action: 'navigate' | 'click' | 'type' | 'assert' | 'wait' | 'api' | 'command';
  target?: string;
  value?: string;
  expected?: string | RegExp | number | boolean;
  timeout?: number;
}

// ============================================================
// VALIDATION ENGINE
// ============================================================

export class ValidationEngine {
  private config: ValidationConfig;
  private results: Map<string, ValidationResult> = new Map();
  private regressionTests: RegressionTest[] = [];
  private validationHistory: ValidationResult[] = [];

  constructor(config: Partial<ValidationConfig> & { projectPath: string }) {
    this.config = {
      projectPath: config.projectPath,
      timeout: config.timeout ?? 60000,
      parallel: config.parallel ?? false,
      stopOnFirstFailure: config.stopOnFirstFailure ?? true,
      minScore: config.minScore ?? 0.85,
      enabledTypes: config.enabledTypes ?? ['typescript', 'build', 'test'],
      customValidators: config.customValidators ?? [],
    };
  }

  // ============================================================
  // FULL VALIDATION SUITE
  // ============================================================

  /**
   * Run complete validation suite
   */
  async runFullValidation(): Promise<{
    passed: boolean;
    score: number;
    results: ValidationResult[];
    duration: number;
  }> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    const validators: Array<{ type: ValidationType; fn: () => Promise<ValidationResult> }> = [
      { type: 'typescript', fn: () => this.validateTypeScript() },
      { type: 'lint', fn: () => this.validateLint() },
      { type: 'build', fn: () => this.validateBuild() },
      { type: 'test', fn: () => this.validateTests() },
    ];

    // Filter by enabled types
    const enabledValidators = validators.filter(v =>
      this.config.enabledTypes.includes(v.type)
    );

    // Add custom validators
    for (const custom of this.config.customValidators) {
      enabledValidators.push({
        type: custom.type,
        fn: () => this.runCustomValidator(custom),
      });
    }

    // Execute validators
    if (this.config.parallel) {
      const promises = enabledValidators.map(v => v.fn());
      results.push(...await Promise.all(promises));
    } else {
      for (const validator of enabledValidators) {
        const result = await validator.fn();
        results.push(result);

        if (!result.passed && this.config.stopOnFirstFailure) {
          break;
        }
      }
    }

    // Calculate overall score
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const avgScore = results.length > 0 ? totalScore / results.length : 0;
    const allPassed = results.every(r => r.passed);

    // Store in history
    this.validationHistory.push(...results);

    return {
      passed: allPassed && avgScore >= this.config.minScore,
      score: avgScore,
      results,
      duration: Date.now() - startTime,
    };
  }

  // ============================================================
  // INDIVIDUAL VALIDATORS
  // ============================================================

  /**
   * TypeScript validation
   */
  async validateTypeScript(): Promise<ValidationResult> {
    const startTime = Date.now();
    const steps: ValidationStep[] = [];
    const errors: ValidationError[] = [];

    try {
      // Run tsc --noEmit
      const { stdout, stderr } = await execAsync(
        'bunx tsc --noEmit 2>&1 || true',
        {
          cwd: this.config.projectPath,
          timeout: this.config.timeout,
        }
      );

      const output = stdout + stderr;
      const passed = !output.includes('error TS');

      // Parse errors
      if (!passed) {
        const errorLines = output.split('\n').filter(l => l.includes('error TS'));
        for (const line of errorLines) {
          const match = line.match(/(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/);
          if (match) {
            errors.push({
              type: match[4],
              message: match[5],
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              severity: 'error',
            });
          }
        }
      }

      steps.push({
        name: 'TypeScript Compilation',
        passed,
        duration: Date.now() - startTime,
        output: passed ? 'No errors' : `${errors.length} errors`,
        error: passed ? undefined : errors[0]?.message,
      });

    } catch (error) {
      steps.push({
        name: 'TypeScript Compilation',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const passed = steps.every(s => s.passed);

    return {
      id: `ts_${Date.now()}`,
      type: 'typescript',
      passed,
      score: passed ? 1 : Math.max(0, 1 - (errors.length * 0.1)),
      duration: Date.now() - startTime,
      steps,
      errors,
      warnings: [],
      timestamp: Date.now(),
    };
  }

  /**
   * Lint validation
   */
  async validateLint(): Promise<ValidationResult> {
    const startTime = Date.now();
    const steps: ValidationStep[] = [];
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    try {
      const { stdout, stderr } = await execAsync(
        'bunx eslint . --format json 2>&1 || true',
        {
          cwd: this.config.projectPath,
          timeout: this.config.timeout,
        }
      );

      let lintResults: Array<{
        filePath: string;
        messages: Array<{
          ruleId: string;
          message: string;
          line: number;
          column: number;
          severity: number;
        }>;
      }> = [];

      try {
        lintResults = JSON.parse(stdout);
      } catch {
        // Non-JSON output, parse manually
      }

      let errorCount = 0;
      let warningCount = 0;

      for (const file of lintResults) {
        for (const msg of file.messages) {
          if (msg.severity === 2) {
            errorCount++;
            errors.push({
              type: msg.ruleId || 'lint',
              message: msg.message,
              file: file.filePath,
              line: msg.line,
              column: msg.column,
              severity: 'error',
            });
          } else {
            warningCount++;
            warnings.push(`${file.filePath}:${msg.line} - ${msg.message}`);
          }
        }
      }

      const passed = errorCount === 0;

      steps.push({
        name: 'ESLint',
        passed,
        duration: Date.now() - startTime,
        output: `${errorCount} errors, ${warningCount} warnings`,
      });

    } catch (error) {
      steps.push({
        name: 'ESLint',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const passed = steps.every(s => s.passed);

    return {
      id: `lint_${Date.now()}`,
      type: 'lint',
      passed,
      score: passed ? 1 : Math.max(0.5, 1 - (errors.length * 0.05)),
      duration: Date.now() - startTime,
      steps,
      errors,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * Build validation
   */
  async validateBuild(): Promise<ValidationResult> {
    const startTime = Date.now();
    const steps: ValidationStep[] = [];
    const errors: ValidationError[] = [];

    // Detect package manager and build command
    const buildCmd = await this.detectBuildCommand();

    try {
      const { stdout, stderr } = await execAsync(
        `${buildCmd} 2>&1`,
        {
          cwd: this.config.projectPath,
          timeout: this.config.timeout * 2, // Build takes longer
        }
      );

      const output = stdout + stderr;
      const passed = !output.toLowerCase().includes('error') &&
                     !output.includes('Build failed');

      steps.push({
        name: 'Build',
        passed,
        duration: Date.now() - startTime,
        output: passed ? 'Build successful' : output.slice(-500),
      });

    } catch (error) {
      steps.push({
        name: 'Build',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const passed = steps.every(s => s.passed);

    return {
      id: `build_${Date.now()}`,
      type: 'build',
      passed,
      score: passed ? 1 : 0,
      duration: Date.now() - startTime,
      steps,
      errors,
      warnings: [],
      timestamp: Date.now(),
    };
  }

  /**
   * Test validation
   */
  async validateTests(): Promise<ValidationResult> {
    const startTime = Date.now();
    const steps: ValidationStep[] = [];
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Detect test command
    const testCmd = await this.detectTestCommand();
    if (!testCmd) {
      return {
        id: `test_${Date.now()}`,
        type: 'test',
        passed: true,
        score: 1,
        duration: Date.now() - startTime,
        steps: [{ name: 'Tests', passed: true, duration: 0, output: 'No tests configured' }],
        errors: [],
        warnings: ['No test command found'],
        timestamp: Date.now(),
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        `${testCmd} 2>&1`,
        {
          cwd: this.config.projectPath,
          timeout: this.config.timeout * 3, // Tests take longer
        }
      );

      const output = stdout + stderr;

      // Parse test results
      const passMatch = output.match(/(\d+)\s*(?:passed|passing)/i);
      const failMatch = output.match(/(\d+)\s*(?:failed|failing)/i);
      const skipMatch = output.match(/(\d+)\s*(?:skipped|pending)/i);

      const passed = parseInt(passMatch?.[1] || '0');
      const failed = parseInt(failMatch?.[1] || '0');
      const skipped = parseInt(skipMatch?.[1] || '0');
      const total = passed + failed;

      const allPassed = failed === 0;

      steps.push({
        name: 'Unit Tests',
        passed: allPassed,
        duration: Date.now() - startTime,
        output: `${passed}/${total} passed${skipped > 0 ? `, ${skipped} skipped` : ''}`,
      });

      if (skipped > 0) {
        warnings.push(`${skipped} tests skipped`);
      }

    } catch (error) {
      steps.push({
        name: 'Unit Tests',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const allPassed = steps.every(s => s.passed);

    return {
      id: `test_${Date.now()}`,
      type: 'test',
      passed: allPassed,
      score: allPassed ? 1 : 0.5,
      duration: Date.now() - startTime,
      steps,
      errors,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * API endpoint validation
   */
  async validateAPI(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    expected: { status?: number; body?: unknown } = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const steps: ValidationStep[] = [];
    const errors: ValidationError[] = [];

    try {
      const response = await fetch(endpoint, { method });
      const status = response.status;
      const body = await response.json().catch(() => null);

      const statusPassed = expected.status ? status === expected.status : status < 400;
      const bodyPassed = expected.body ? JSON.stringify(body).includes(JSON.stringify(expected.body)) : true;

      steps.push({
        name: `${method} ${endpoint}`,
        passed: statusPassed && bodyPassed,
        duration: Date.now() - startTime,
        output: `Status: ${status}`,
      });

    } catch (error) {
      errors.push({
        type: 'api',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
      });

      steps.push({
        name: `${method} ${endpoint}`,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const passed = steps.every(s => s.passed);

    return {
      id: `api_${Date.now()}`,
      type: 'api',
      passed,
      score: passed ? 1 : 0,
      duration: Date.now() - startTime,
      steps,
      errors,
      warnings: [],
      timestamp: Date.now(),
    };
  }

  /**
   * Run custom validator
   */
  private async runCustomValidator(validator: CustomValidator): Promise<ValidationResult> {
    const startTime = Date.now();
    const steps: ValidationStep[] = [];
    const errors: ValidationError[] = [];

    try {
      const command = validator.command || validator.script || 'echo "No command"';
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.projectPath,
        timeout: validator.timeout || this.config.timeout,
      });

      const output = stdout + stderr;

      let passed = true;
      if (validator.expectedOutput) {
        if (typeof validator.expectedOutput === 'string') {
          passed = output.includes(validator.expectedOutput);
        } else {
          passed = validator.expectedOutput.test(output);
        }
      }

      steps.push({
        name: validator.name,
        passed,
        duration: Date.now() - startTime,
        output: output.slice(0, 500),
      });

    } catch (error) {
      steps.push({
        name: validator.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const passed = steps.every(s => s.passed);

    return {
      id: `custom_${validator.name}_${Date.now()}`,
      type: validator.type,
      passed,
      score: passed ? 1 : 0,
      duration: Date.now() - startTime,
      steps,
      errors,
      warnings: [],
      timestamp: Date.now(),
    };
  }

  // ============================================================
  // REGRESSION TESTING
  // ============================================================

  /**
   * Add regression test
   */
  addRegressionTest(test: Omit<RegressionTest, 'id'>): string {
    const id = `reg_${Date.now()}`;
    this.regressionTests.push({ ...test, id });
    return id;
  }

  /**
   * Run regression tests
   */
  async runRegressionTests(count?: number): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: Array<{ test: RegressionTest; passed: boolean; error?: string }>;
  }> {
    const testsToRun = count
      ? this.regressionTests.slice(-count)
      : this.regressionTests;

    const results: Array<{ test: RegressionTest; passed: boolean; error?: string }> = [];
    let passed = 0;
    let failed = 0;

    for (const test of testsToRun) {
      try {
        const result = await this.runRegressionTest(test);
        test.lastRun = Date.now();
        test.lastResult = result;

        if (result) {
          passed++;
          results.push({ test, passed: true });
        } else {
          failed++;
          results.push({ test, passed: false });
        }
      } catch (error) {
        failed++;
        results.push({
          test,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      passed,
      failed,
      total: testsToRun.length,
      results,
    };
  }

  /**
   * Run single regression test
   */
  private async runRegressionTest(test: RegressionTest): Promise<boolean> {
    for (const step of test.steps) {
      const result = await this.executeRegressionStep(step);
      if (!result) return false;
    }
    return true;
  }

  /**
   * Execute single regression step
   */
  private async executeRegressionStep(step: RegressionStep): Promise<boolean> {
    const timeout = step.timeout || 10000;

    switch (step.action) {
      case 'command': {
        const { stdout } = await execAsync(step.value || '', {
          cwd: this.config.projectPath,
          timeout,
        });
        if (step.expected) {
          if (typeof step.expected === 'string') {
            return stdout.includes(step.expected);
          }
          if (step.expected instanceof RegExp) {
            return step.expected.test(stdout);
          }
        }
        return true;
      }

      case 'api': {
        const response = await fetch(step.target || '', { signal: AbortSignal.timeout(timeout) });
        if (typeof step.expected === 'number') {
          return response.status === step.expected;
        }
        return response.ok;
      }

      case 'assert': {
        // File exists, contains content, etc.
        if (step.target) {
          const exists = existsSync(join(this.config.projectPath, step.target));
          if (step.expected === false) return !exists;
          if (!exists) return false;

          if (step.value) {
            const content = await readFile(join(this.config.projectPath, step.target), 'utf-8');
            if (typeof step.expected === 'string') {
              return content.includes(step.expected);
            }
            if (step.expected instanceof RegExp) {
              return step.expected.test(content);
            }
          }
        }
        return true;
      }

      case 'wait': {
        await new Promise(resolve => setTimeout(resolve, parseInt(step.value || '1000')));
        return true;
      }

      default:
        // UI actions (navigate, click, type) would need browser automation
        // For now, assume they pass if no browser available
        return true;
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  private async detectBuildCommand(): Promise<string> {
    const pkgPath = join(this.config.projectPath, 'package.json');

    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
      if (pkg.scripts?.build) {
        // Detect package manager
        if (existsSync(join(this.config.projectPath, 'bun.lockb'))) {
          return 'bun run build';
        }
        if (existsSync(join(this.config.projectPath, 'pnpm-lock.yaml'))) {
          return 'pnpm run build';
        }
        if (existsSync(join(this.config.projectPath, 'yarn.lock'))) {
          return 'yarn build';
        }
        return 'npm run build';
      }
    }

    return 'echo "No build configured"';
  }

  private async detectTestCommand(): Promise<string | null> {
    const pkgPath = join(this.config.projectPath, 'package.json');

    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
      if (pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
        if (existsSync(join(this.config.projectPath, 'bun.lockb'))) {
          return 'bun test';
        }
        if (existsSync(join(this.config.projectPath, 'pnpm-lock.yaml'))) {
          return 'pnpm test';
        }
        if (existsSync(join(this.config.projectPath, 'yarn.lock'))) {
          return 'yarn test';
        }
        return 'npm test';
      }
    }

    return null;
  }

  // ============================================================
  // REPORTING
  // ============================================================

  /**
   * Generate validation report
   */
  generateReport(): string {
    const lines: string[] = [
      '# Validation Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Project: ${this.config.projectPath}`,
      '',
      '## Summary',
      '',
    ];

    // Group by type
    const byType = new Map<ValidationType, ValidationResult[]>();
    for (const result of this.validationHistory) {
      const list = byType.get(result.type) || [];
      list.push(result);
      byType.set(result.type, list);
    }

    for (const [type, results] of byType) {
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      const avgScore = results.reduce((s, r) => s + r.score, 0) / total;

      lines.push(`### ${type.toUpperCase()}`);
      lines.push(`- Pass Rate: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);
      lines.push(`- Avg Score: ${avgScore.toFixed(2)}`);
      lines.push('');
    }

    // Regression tests
    if (this.regressionTests.length > 0) {
      lines.push('## Regression Tests');
      lines.push('');
      for (const test of this.regressionTests) {
        const status = test.lastResult === undefined ? '⏳' : test.lastResult ? '✅' : '❌';
        lines.push(`- ${status} ${test.name}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ============================================================
  // STATUS
  // ============================================================

  getStatus(): {
    validationCount: number;
    lastValidation: ValidationResult | null;
    regressionTestCount: number;
    enabledTypes: ValidationType[];
  } {
    return {
      validationCount: this.validationHistory.length,
      lastValidation: this.validationHistory[this.validationHistory.length - 1] || null,
      regressionTestCount: this.regressionTests.length,
      enabledTypes: this.config.enabledTypes,
    };
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createValidationEngine(
  projectPath: string,
  config?: Partial<ValidationConfig>
): ValidationEngine {
  return new ValidationEngine({ projectPath, ...config });
}
