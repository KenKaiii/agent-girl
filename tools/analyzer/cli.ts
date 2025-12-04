#!/usr/bin/env bun
/**
 * Agent-Girl Code Analyzer CLI
 * Usage: bun run tools/analyzer/cli.ts [options]
 */

import { CodeAnalyzer, formatReport, exportReportJSON } from './index';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface CLIOptions {
  projectPath: string;
  output: 'console' | 'json' | 'html' | 'all';
  outputDir: string;
  checkCircular: boolean;
  maxComplexity: number;
  strict: boolean;
  watch: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    projectPath: process.cwd(),
    output: 'console',
    outputDir: './reports',
    checkCircular: false,
    maxComplexity: 15,
    strict: false,
    watch: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-p':
      case '--project':
        options.projectPath = args[++i];
        break;
      case '-o':
      case '--output':
        options.output = args[++i] as CLIOptions['output'];
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--check-circular':
        options.checkCircular = true;
        break;
      case '--max-complexity':
        options.maxComplexity = parseInt(args[++i], 10);
        break;
      case '--strict':
        options.strict = true;
        break;
      case '-w':
      case '--watch':
        options.watch = true;
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
      case '--report':
        options.output = 'all';
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Agent-Girl Code Analyzer
========================

Usage: bun run tools/analyzer/cli.ts [options]

Options:
  -p, --project <path>     Project root directory (default: cwd)
  -o, --output <type>      Output format: console, json, html, all (default: console)
  --output-dir <path>      Directory for reports (default: ./reports)
  --check-circular         Exit with error if circular dependencies found
  --max-complexity <n>     Max allowed complexity (default: 15)
  --strict                 Exit with error on any health issues
  -w, --watch              Watch mode (re-analyze on changes)
  --report                 Generate full report (all formats)
  -h, --help               Show this help message

Examples:
  bun run tools/analyzer/cli.ts                          # Analyze current directory
  bun run tools/analyzer/cli.ts -p ./server --report     # Full report for server
  bun run tools/analyzer/cli.ts --check-circular         # CI mode: fail on circular deps
  bun run tools/analyzer/cli.ts --strict                 # CI mode: fail on any issues
`);
}

function generateHTML(report: ReturnType<CodeAnalyzer['analyze']>): string {
  const issuesByType = new Map<string, number>();
  for (const issue of report.healthIssues) {
    issuesByType.set(issue.type, (issuesByType.get(issue.type) || 0) + 1);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Analysis Report - Agent-Girl</title>
  <style>
    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --error: #f85149;
      --warning: #d29922;
      --success: #3fb950;
      --info: #58a6ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }
    h1, h2, h3 { color: var(--text); margin-bottom: 1rem; }
    h1 { font-size: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    h2 { font-size: 1.5rem; margin-top: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat { text-align: center; padding: 1rem; }
    .stat-value { font-size: 2.5rem; font-weight: bold; color: var(--accent); }
    .stat-label { color: var(--text-muted); font-size: 0.9rem; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .badge-error { background: rgba(248, 81, 73, 0.2); color: var(--error); }
    .badge-warning { background: rgba(210, 153, 34, 0.2); color: var(--warning); }
    .badge-info { background: rgba(88, 166, 255, 0.2); color: var(--info); }
    .issue-list { list-style: none; }
    .issue-item {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .issue-item:last-child { border-bottom: none; }
    .file-path { color: var(--accent); font-family: monospace; font-size: 0.9rem; }
    .suggestion { color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem; }
    .progress-bar {
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent);
      transition: width 0.3s;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-weight: 500; }
    .complexity-bar {
      display: inline-block;
      height: 12px;
      background: linear-gradient(90deg, var(--success) 0%, var(--warning) 50%, var(--error) 100%);
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Analysis Report</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">
      Generated: ${report.timestamp}<br>
      Project: ${report.projectRoot}
    </p>

    <div class="grid">
      <div class="card stat">
        <div class="stat-value">${report.summary.totalFiles}</div>
        <div class="stat-label">Source Files</div>
      </div>
      <div class="card stat">
        <div class="stat-value">${report.summary.totalLines.toLocaleString()}</div>
        <div class="stat-label">Lines of Code</div>
      </div>
      <div class="card stat">
        <div class="stat-value">${report.summary.avgComplexity.toFixed(1)}</div>
        <div class="stat-label">Avg Complexity</div>
      </div>
      <div class="card stat">
        <div class="stat-value" style="color: ${report.summary.circularDependencies > 0 ? 'var(--error)' : 'var(--success)'}">
          ${report.summary.circularDependencies}
        </div>
        <div class="stat-label">Circular Dependencies</div>
      </div>
    </div>

    ${report.circularDependencies.length > 0 ? `
    <h2>Circular Dependencies</h2>
    <div class="card">
      <ul class="issue-list">
        ${report.circularDependencies.map(dep => `
          <li class="issue-item">
            <span class="badge badge-${dep.severity}">${dep.severity}</span>
            <div>
              <code>${dep.path.join(' → ')}</code>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${report.healthIssues.length > 0 ? `
    <h2>Health Issues (${report.healthIssues.length})</h2>
    <div class="card">
      <ul class="issue-list">
        ${report.healthIssues.slice(0, 50).map(issue => `
          <li class="issue-item">
            <span class="badge badge-${issue.severity}">${issue.severity}</span>
            <div>
              <span class="file-path">${issue.file}${issue.line ? ':' + issue.line : ''}</span>
              <div>${issue.message}</div>
              ${issue.suggestion ? `<div class="suggestion">→ ${issue.suggestion}</div>` : ''}
            </div>
          </li>
        `).join('')}
        ${report.healthIssues.length > 50 ? `<li class="issue-item"><em>... and ${report.healthIssues.length - 50} more</em></li>` : ''}
      </ul>
    </div>
    ` : ''}

    <h2>Top Complex Files</h2>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Lines</th>
            <th>Complexity</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${Array.from(report.modules.entries())
            .sort((a, b) => b[1].complexity - a[1].complexity)
            .slice(0, 15)
            .map(([path, mod]) => `
              <tr>
                <td><span class="file-path">${path}</span></td>
                <td>${mod.lineCount}</td>
                <td>${mod.complexity}</td>
                <td>
                  <div class="complexity-bar" style="width: ${Math.min(100, mod.complexity * 3)}px"></div>
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    </div>

    <h2>Dependency Graph</h2>
    <div class="card">
      <p style="color: var(--text-muted);">
        ${report.relationships.length} relationships between ${report.modules.size} modules
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log('🔍 Analyzing codebase...\n');

  const analyzer = new CodeAnalyzer(options.projectPath);
  const report = analyzer.analyze();

  // Console output
  if (options.output === 'console' || options.output === 'all') {
    console.log(formatReport(report));
  }

  // Save reports
  if (options.output === 'json' || options.output === 'all') {
    if (!existsSync(options.outputDir)) {
      mkdirSync(options.outputDir, { recursive: true });
    }

    const jsonPath = join(options.outputDir, 'analysis-report.json');
    writeFileSync(jsonPath, exportReportJSON(report));
    console.log(`\n📄 JSON report saved: ${jsonPath}`);
  }

  if (options.output === 'html' || options.output === 'all') {
    if (!existsSync(options.outputDir)) {
      mkdirSync(options.outputDir, { recursive: true });
    }

    const htmlPath = join(options.outputDir, 'analysis-report.html');
    writeFileSync(htmlPath, generateHTML(report));
    console.log(`📄 HTML report saved: ${htmlPath}`);
  }

  // CI checks
  let exitCode = 0;

  if (options.checkCircular && report.circularDependencies.length > 0) {
    console.error(`\n❌ Found ${report.circularDependencies.length} circular dependencies`);
    exitCode = 1;
  }

  if (options.strict) {
    const errors = report.healthIssues.filter(i => i.severity === 'error');
    if (errors.length > 0) {
      console.error(`\n❌ Found ${errors.length} critical issues`);
      exitCode = 1;
    }
  }

  // Complexity check
  const highComplexity = Array.from(report.modules.values())
    .filter(m => m.complexity > options.maxComplexity);

  if (highComplexity.length > 0 && options.strict) {
    console.error(`\n❌ ${highComplexity.length} files exceed max complexity of ${options.maxComplexity}`);
    exitCode = 1;
  }

  // Summary
  console.log('\n' + '─'.repeat(60));
  if (exitCode === 0) {
    console.log('✅ Analysis complete - no blocking issues found');
  } else {
    console.log('❌ Analysis complete - issues require attention');
  }

  process.exit(exitCode);
}

main().catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
