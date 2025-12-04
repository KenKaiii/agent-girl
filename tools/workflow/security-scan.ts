#!/usr/bin/env bun
/**
 * Agent-Girl Security Scanner
 * Scans for common security vulnerabilities and misconfigurations
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';

interface SecurityFinding {
  file: string;
  line: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  snippet: string;
  recommendation: string;
}

interface ScanReport {
  timestamp: string;
  projectRoot: string;
  scanDuration: number;
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

// Security patterns with associated metadata
const SECURITY_PATTERNS = [
  {
    pattern: /(password|secret|api_key|apikey|auth_token|private_key)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
    type: 'hardcoded-credential',
    severity: 'critical' as const,
    message: 'Hardcoded credential detected',
    recommendation: 'Move secrets to environment variables or a secure vault',
  },
  {
    pattern: /eval\s*\(/g,
    type: 'eval-usage',
    severity: 'high' as const,
    message: 'Use of eval() detected',
    recommendation: 'Avoid eval() - use safer alternatives like JSON.parse or Function constructor',
  },
  {
    pattern: /new Function\s*\(/g,
    type: 'function-constructor',
    severity: 'high' as const,
    message: 'Dynamic code execution via Function constructor',
    recommendation: 'Avoid dynamic code generation when possible',
  },
  {
    pattern: /dangerouslySetInnerHTML/g,
    type: 'xss-risk',
    severity: 'high' as const,
    message: 'Potential XSS vulnerability via dangerouslySetInnerHTML',
    recommendation: 'Sanitize HTML content before rendering',
  },
  {
    pattern: /innerHTML\s*=/g,
    type: 'xss-risk',
    severity: 'high' as const,
    message: 'Potential XSS vulnerability via innerHTML',
    recommendation: 'Use textContent or sanitize HTML content',
  },
  {
    pattern: /\.\.\/.*\.\.\//g,
    type: 'path-traversal-pattern',
    severity: 'medium' as const,
    message: 'Potential path traversal pattern detected',
    recommendation: 'Validate and sanitize file paths',
  },
  {
    pattern: /spawn\s*\([^)]*\$\{/g,
    type: 'command-injection',
    severity: 'critical' as const,
    message: 'Potential command injection via spawn with template literal',
    recommendation: 'Use parameterized arguments instead of string interpolation',
  },
  {
    pattern: /exec\s*\([^)]*\$\{/g,
    type: 'command-injection',
    severity: 'critical' as const,
    message: 'Potential command injection via exec with template literal',
    recommendation: 'Use execFile with array arguments instead',
  },
  {
    pattern: /process\.env\.\w+/g,
    type: 'env-access',
    severity: 'info' as const,
    message: 'Environment variable access',
    recommendation: 'Ensure environment variables are validated at startup',
  },
  {
    pattern: /JSON\.parse\s*\(\s*(?![^)]*try)/g,
    type: 'unsafe-json-parse',
    severity: 'low' as const,
    message: 'JSON.parse without error handling',
    recommendation: 'Wrap JSON.parse in try-catch or use a safe parsing utility',
  },
  {
    pattern: /cors\s*\(\s*\{[^}]*origin\s*:\s*true/gi,
    type: 'cors-misconfiguration',
    severity: 'medium' as const,
    message: 'CORS configured to allow all origins',
    recommendation: 'Restrict CORS to specific trusted origins',
  },
  {
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g,
    type: 'insecure-http',
    severity: 'low' as const,
    message: 'Insecure HTTP URL detected',
    recommendation: 'Use HTTPS for external connections',
  },
  {
    pattern: /md5|sha1(?!sum)/gi,
    type: 'weak-crypto',
    severity: 'medium' as const,
    message: 'Potentially weak cryptographic algorithm',
    recommendation: 'Use SHA-256 or stronger algorithms',
  },
  {
    pattern: /Math\.random\s*\(\)/g,
    type: 'insecure-random',
    severity: 'low' as const,
    message: 'Math.random() used (not cryptographically secure)',
    recommendation: 'Use crypto.randomBytes() for security-sensitive operations',
  },
  {
    pattern: /disable.*ssl|ssl.*false|verify.*false|rejectUnauthorized.*false/gi,
    type: 'ssl-disabled',
    severity: 'high' as const,
    message: 'SSL/TLS verification may be disabled',
    recommendation: 'Never disable SSL verification in production',
  },
  {
    pattern: /console\.(log|debug|info)\s*\([^)]*(?:password|token|secret|key)/gi,
    type: 'secret-logging',
    severity: 'high' as const,
    message: 'Potentially logging sensitive information',
    recommendation: 'Remove or mask sensitive data from logs',
  },
  {
    pattern: /SELECT.*FROM.*WHERE.*\+|INSERT.*VALUES.*\+/gi,
    type: 'sql-injection-risk',
    severity: 'high' as const,
    message: 'Potential SQL injection via string concatenation',
    recommendation: 'Use parameterized queries or prepared statements',
  },
  {
    pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
    type: 'sql-injection-risk',
    severity: 'high' as const,
    message: 'Potential SQL injection via template literal',
    recommendation: 'Use parameterized queries or prepared statements',
  },
  {
    pattern: /new\s+RegExp\s*\(\s*[^'"]/g,
    type: 'regex-injection',
    severity: 'medium' as const,
    message: 'Dynamic RegExp creation may be vulnerable to ReDoS',
    recommendation: 'Validate and sanitize regex input or use static patterns',
  },
  {
    pattern: /fs\.(readFile|writeFile|unlink|rmdir).*\$\{/g,
    type: 'path-injection',
    severity: 'high' as const,
    message: 'File system operation with dynamic path',
    recommendation: 'Validate and sanitize file paths before use',
  },
];

// Files and directories to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '*.min.js',
  '*.map',
  '*.lock',
  'package-lock.json',
  'bun.lockb',
];

const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

export class SecurityScanner {
  private projectRoot: string;
  private findings: SecurityFinding[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  scan(): ScanReport {
    const startTime = Date.now();
    console.log('🔒 Security Scan Started');
    console.log('═'.repeat(60));

    const files = this.discoverFiles(this.projectRoot);
    console.log(`  Scanning ${files.length} files...`);

    for (const file of files) {
      this.scanFile(file);
    }

    // Check for common misconfigurations
    this.checkConfigurationFiles();

    const scanDuration = Date.now() - startTime;

    // Sort findings by severity
    this.findings.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.severity] - order[b.severity];
    });

    const summary = {
      critical: this.findings.filter(f => f.severity === 'critical').length,
      high: this.findings.filter(f => f.severity === 'high').length,
      medium: this.findings.filter(f => f.severity === 'medium').length,
      low: this.findings.filter(f => f.severity === 'low').length,
      info: this.findings.filter(f => f.severity === 'info').length,
    };

    return {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      scanDuration,
      findings: this.findings,
      summary,
    };
  }

  private discoverFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        // Skip certain patterns
        if (SKIP_PATTERNS.some(p => entry === p || entry.match(p.replace('*', '.*')))) {
          continue;
        }

        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.discoverFiles(fullPath));
        } else if (SCAN_EXTENSIONS.includes(extname(entry))) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Skip unreadable directories
    }

    return files;
  }

  private scanFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relPath = relative(this.projectRoot, filePath);

      for (const rule of SECURITY_PATTERNS) {
        // Reset regex state
        rule.pattern.lastIndex = 0;

        let match;
        while ((match = rule.pattern.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const lineContent = lines[lineNumber - 1] || '';

          // Skip if in comment
          if (this.isInComment(lineContent, lines, lineNumber)) {
            continue;
          }

          // Skip env-access info findings in certain files
          if (rule.type === 'env-access' && relPath.includes('startup.ts')) {
            continue;
          }

          this.findings.push({
            file: relPath,
            line: lineNumber,
            type: rule.type,
            severity: rule.severity,
            message: rule.message,
            snippet: this.getSnippet(lines, lineNumber),
            recommendation: rule.recommendation,
          });
        }
      }
    } catch (err) {
      // Skip unreadable files
    }
  }

  private checkConfigurationFiles(): void {
    // Check package.json for vulnerable scripts
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

        // Check for preinstall/postinstall scripts (can be attack vector)
        if (packageJson.scripts?.preinstall || packageJson.scripts?.postinstall) {
          this.findings.push({
            file: 'package.json',
            line: 1,
            type: 'install-scripts',
            severity: 'info',
            message: 'Install scripts detected',
            snippet: JSON.stringify(packageJson.scripts).slice(0, 100),
            recommendation: 'Review install scripts for security implications',
          });
        }
      } catch {
        // Invalid JSON
      }
    }

    // Check for .env files committed
    const envFiles = ['.env', '.env.local', '.env.production'];
    for (const envFile of envFiles) {
      const envPath = join(this.projectRoot, envFile);
      if (existsSync(envPath)) {
        this.findings.push({
          file: envFile,
          line: 1,
          type: 'env-file-present',
          severity: 'high',
          message: `Environment file ${envFile} found in project`,
          snippet: '(file contents not shown for security)',
          recommendation: 'Add to .gitignore and use .env.example instead',
        });
      }
    }

    // Check .gitignore for proper exclusions
    const gitignorePath = join(this.projectRoot, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf-8');
      const requiredPatterns = ['.env', 'node_modules', '*.key', '*.pem'];

      for (const pattern of requiredPatterns) {
        if (!gitignore.includes(pattern)) {
          this.findings.push({
            file: '.gitignore',
            line: 1,
            type: 'gitignore-missing',
            severity: 'medium',
            message: `Pattern "${pattern}" not in .gitignore`,
            snippet: '',
            recommendation: `Add ${pattern} to .gitignore`,
          });
        }
      }
    }
  }

  private getLineNumber(content: string, index: number): number {
    return content.slice(0, index).split('\n').length;
  }

  private getSnippet(lines: string[], lineNumber: number): string {
    const line = lines[lineNumber - 1] || '';
    return line.trim().slice(0, 80) + (line.length > 80 ? '...' : '');
  }

  private isInComment(lineContent: string, lines: string[], lineNumber: number): boolean {
    const trimmed = lineContent.trim();

    // Single line comment
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return true;
    }

    // Check for block comment (simplified check)
    for (let i = lineNumber - 1; i >= Math.max(0, lineNumber - 20); i--) {
      const prevLine = lines[i]?.trim() || '';
      if (prevLine.includes('*/')) return false;
      if (prevLine.includes('/*')) return true;
    }

    return false;
  }
}

function printReport(report: ScanReport): void {
  console.log('\n' + '═'.repeat(60));
  console.log('  SECURITY SCAN REPORT');
  console.log('═'.repeat(60));

  // Summary
  console.log('\n┌─ SUMMARY ─────────────────────────────────────────────────┐');
  console.log(`│  🔴 Critical: ${report.summary.critical.toString().padStart(4)}`);
  console.log(`│  🟠 High:     ${report.summary.high.toString().padStart(4)}`);
  console.log(`│  🟡 Medium:   ${report.summary.medium.toString().padStart(4)}`);
  console.log(`│  🔵 Low:      ${report.summary.low.toString().padStart(4)}`);
  console.log(`│  ⚪ Info:     ${report.summary.info.toString().padStart(4)}`);
  console.log('└───────────────────────────────────────────────────────────┘');

  // Findings
  if (report.findings.length > 0) {
    console.log('\n┌─ FINDINGS ────────────────────────────────────────────────┐');

    const severityIcon: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: '⚪',
    };

    for (const finding of report.findings.slice(0, 30)) {
      const icon = severityIcon[finding.severity];
      console.log(`│`);
      console.log(`│ ${icon} [${finding.severity.toUpperCase()}] ${finding.type}`);
      console.log(`│   File: ${finding.file}:${finding.line}`);
      console.log(`│   ${finding.message}`);
      if (finding.snippet) {
        console.log(`│   > ${finding.snippet}`);
      }
      console.log(`│   → ${finding.recommendation}`);
    }

    if (report.findings.length > 30) {
      console.log(`│`);
      console.log(`│ ... and ${report.findings.length - 30} more findings`);
    }

    console.log('└───────────────────────────────────────────────────────────┘');
  }

  console.log(`\n  Scan completed in ${report.scanDuration}ms`);
  console.log('═'.repeat(60));

  // Exit code guidance
  if (report.summary.critical > 0 || report.summary.high > 0) {
    console.log('\n❌ SECURITY ISSUES FOUND - Review and fix before deployment\n');
  } else if (report.summary.medium > 0) {
    console.log('\n⚠️  SECURITY WARNINGS - Consider addressing these issues\n');
  } else {
    console.log('\n✅ NO CRITICAL SECURITY ISSUES FOUND\n');
  }
}

// CLI Entry Point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const projectRoot = args.find(a => !a.startsWith('-')) || process.cwd();

  const scanner = new SecurityScanner(projectRoot);
  const report = scanner.scan();

  printReport(report);

  // Save JSON report if requested
  if (args.includes('--json')) {
    const outputPath = args[args.indexOf('--json') + 1] || 'security-report.json';
    const { writeFileSync } = await import('fs');
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${outputPath}`);
  }

  // Exit with error if critical/high issues found
  if (args.includes('--strict')) {
    if (report.summary.critical > 0 || report.summary.high > 0) {
      process.exit(1);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Security scan failed:', err);
  process.exit(1);
});
