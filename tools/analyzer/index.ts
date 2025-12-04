/**
 * Agent-Girl Code Relationship Analyzer
 * Analyzes module dependencies, circular imports, complexity metrics, and code health
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';

// Types
interface ModuleInfo {
  path: string;
  exports: string[];
  imports: ImportInfo[];
  functions: FunctionInfo[];
  classes: string[];
  lineCount: number;
  complexity: number;
}

interface ImportInfo {
  source: string;
  specifiers: string[];
  line: number;
  isRelative: boolean;
}

interface FunctionInfo {
  name: string;
  line: number;
  complexity: number;
  lineCount: number;
  params: number;
}

interface Relationship {
  source: string;
  target: string;
  type: 'import' | 'export' | 'extends' | 'implements';
  specifiers: string[];
  line: number;
}

interface CircularDependency {
  path: string[];
  severity: 'warning' | 'error';
}

interface CodeHealthIssue {
  file: string;
  line?: number;
  type: 'complexity' | 'size' | 'circular' | 'orphan' | 'dead-code' | 'security';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

export interface AnalysisReport {
  timestamp: string;
  projectRoot: string;
  summary: {
    totalFiles: number;
    totalLines: number;
    avgComplexity: number;
    circularDependencies: number;
    healthIssues: number;
  };
  modules: Map<string, ModuleInfo>;
  relationships: Relationship[];
  circularDependencies: CircularDependency[];
  orphanedFiles: string[];
  healthIssues: CodeHealthIssue[];
  dependencyGraph: Map<string, string[]>;
}

// Configuration
const CONFIG = {
  maxComplexity: 15,
  maxFileLines: 500,
  maxFunctionLines: 50,
  maxFunctionParams: 5,
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  securityPatterns: [
    { pattern: /process\.env\.\w+/g, type: 'env-access' },
    { pattern: /eval\s*\(/g, type: 'eval-usage' },
    { pattern: /(password|secret|key|token)\s*[=:]\s*['"][^'"]+['"]/gi, type: 'hardcoded-secret' },
    { pattern: /\.\.\/.*\.\./g, type: 'path-traversal-risk' },
    { pattern: /JSON\.parse\s*\([^)]*\)/g, type: 'json-parse-unchecked' },
  ],
};

export class CodeAnalyzer {
  private projectRoot: string;
  private modules = new Map<string, ModuleInfo>();
  private relationships: Relationship[] = [];
  private healthIssues: CodeHealthIssue[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = resolve(projectRoot);
  }

  analyze(): AnalysisReport {
    console.log(`Analyzing project: ${this.projectRoot}`);

    // Step 1: Discover all source files
    const files = this.discoverFiles(this.projectRoot);
    console.log(`Found ${files.length} source files`);

    // Step 2: Parse each file
    for (const file of files) {
      const moduleInfo = this.parseFile(file);
      this.modules.set(this.relativePath(file), moduleInfo);
    }

    // Step 3: Build relationships
    this.buildRelationships();

    // Step 4: Detect circular dependencies
    const circularDeps = this.detectCircularDependencies();

    // Step 5: Find orphaned files
    const orphans = this.findOrphanedFiles();

    // Step 6: Run health checks
    this.runHealthChecks();

    // Step 7: Build dependency graph
    const depGraph = this.buildDependencyGraph();

    // Calculate summary
    const totalLines = Array.from(this.modules.values()).reduce((sum, m) => sum + m.lineCount, 0);
    const avgComplexity = this.modules.size > 0
      ? Array.from(this.modules.values()).reduce((sum, m) => sum + m.complexity, 0) / this.modules.size
      : 0;

    return {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      summary: {
        totalFiles: this.modules.size,
        totalLines,
        avgComplexity: Math.round(avgComplexity * 100) / 100,
        circularDependencies: circularDeps.length,
        healthIssues: this.healthIssues.length,
      },
      modules: this.modules,
      relationships: this.relationships,
      circularDependencies: circularDeps,
      orphanedFiles: orphans,
      healthIssues: this.healthIssues,
      dependencyGraph: depGraph,
    };
  }

  private discoverFiles(dir: string): string[] {
    const files: string[] = [];

    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);

      if (CONFIG.ignoreDirs.includes(entry)) continue;

      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...this.discoverFiles(fullPath));
      } else if (CONFIG.extensions.some(ext => entry.endsWith(ext))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private parseFile(filePath: string): ModuleInfo {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const imports = this.extractImports(content, lines);
    const exports = this.extractExports(content);
    const functions = this.extractFunctions(content, lines);
    const classes = this.extractClasses(content);
    const complexity = this.calculateFileComplexity(content);

    // Security checks
    this.checkSecurityPatterns(filePath, content, lines);

    return {
      path: filePath,
      exports,
      imports,
      functions,
      classes,
      lineCount: lines.length,
      complexity,
    };
  }

  private extractImports(content: string, lines: string[]): ImportInfo[] {
    const imports: ImportInfo[] = [];

    // Match ES6 imports
    const importRegex = /import\s+(?:(?:\{([^}]+)\}|(\w+)|\*\s+as\s+(\w+))(?:\s*,\s*(?:\{([^}]+)\}|(\w+)))?)\s+from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const source = match[6];
      const specifiers: string[] = [];

      // Named imports
      if (match[1]) specifiers.push(...match[1].split(',').map(s => s.trim()));
      // Default import
      if (match[2]) specifiers.push(match[2]);
      // Namespace import
      if (match[3]) specifiers.push(`* as ${match[3]}`);
      // Additional named
      if (match[4]) specifiers.push(...match[4].split(',').map(s => s.trim()));
      // Additional default
      if (match[5]) specifiers.push(match[5]);

      const line = this.findLineNumber(content, match.index);

      imports.push({
        source,
        specifiers,
        line,
        isRelative: source.startsWith('.'),
      });
    }

    // Match require() calls
    const requireRegex = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        source: match[3],
        specifiers: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]],
        line: this.findLineNumber(content, match.index),
        isRelative: match[3].startsWith('.'),
      });
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];

    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Export default
    if (/export\s+default/.test(content)) {
      exports.push('default');
    }

    // Re-exports
    const reExportRegex = /export\s+\{([^}]+)\}\s+from/g;
    while ((match = reExportRegex.exec(content)) !== null) {
      exports.push(...match[1].split(',').map(s => s.trim().split(' as ')[0]));
    }

    return exports;
  }

  private extractFunctions(content: string, lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    // Function declarations
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2] ? match[2].split(',').filter(p => p.trim()).length : 0;
      const line = this.findLineNumber(content, match.index);
      const lineCount = this.estimateFunctionLength(content, match.index);
      const complexity = this.calculateFunctionComplexity(content.slice(match.index, match.index + lineCount * 80));

      functions.push({ name, line, complexity, lineCount, params });
    }

    // Arrow functions assigned to const
    const arrowRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*(?::\s*\w+(?:<[^>]+>)?)?\s*=>/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2] ? match[2].split(',').filter(p => p.trim()).length : 0;
      const line = this.findLineNumber(content, match.index);
      const lineCount = this.estimateFunctionLength(content, match.index);
      const complexity = this.calculateFunctionComplexity(content.slice(match.index, match.index + lineCount * 80));

      functions.push({ name, line, complexity, lineCount, params });
    }

    return functions;
  }

  private extractClasses(content: string): string[] {
    const classes: string[] = [];
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    return classes;
  }

  private calculateFileComplexity(content: string): number {
    let complexity = 1;

    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\belse\b/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*[^:]+:/g, // ternary
      /&&/g,
      /\|\|/g,
      /\?\?/g,
    ];

    for (const pattern of patterns) {
      complexity += (content.match(pattern) || []).length;
    }

    return complexity;
  }

  private calculateFunctionComplexity(content: string): number {
    return this.calculateFileComplexity(content);
  }

  private estimateFunctionLength(content: string, startIndex: number): number {
    let braceCount = 0;
    let started = false;
    let lineCount = 0;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '\n') lineCount++;
      if (content[i] === '{') {
        braceCount++;
        started = true;
      }
      if (content[i] === '}') {
        braceCount--;
        if (started && braceCount === 0) break;
      }
    }

    return Math.max(1, lineCount);
  }

  private findLineNumber(content: string, index: number): number {
    return content.slice(0, index).split('\n').length;
  }

  private buildRelationships(): void {
    for (const [sourcePath, module] of this.modules) {
      for (const imp of module.imports) {
        if (imp.isRelative) {
          const targetPath = this.resolveImportPath(sourcePath, imp.source);
          if (targetPath) {
            this.relationships.push({
              source: sourcePath,
              target: targetPath,
              type: 'import',
              specifiers: imp.specifiers,
              line: imp.line,
            });
          }
        }
      }
    }
  }

  private resolveImportPath(fromPath: string, importPath: string): string | null {
    const fromDir = dirname(join(this.projectRoot, fromPath));
    const resolved = resolve(fromDir, importPath);

    // Try with extensions
    for (const ext of CONFIG.extensions) {
      const withExt = resolved + ext;
      const relPath = this.relativePath(withExt);
      if (this.modules.has(relPath)) {
        return relPath;
      }
    }

    // Try index files
    for (const ext of CONFIG.extensions) {
      const indexPath = join(resolved, `index${ext}`);
      const relPath = this.relativePath(indexPath);
      if (this.modules.has(relPath)) {
        return relPath;
      }
    }

    return null;
  }

  private detectCircularDependencies(): CircularDependency[] {
    const circular: CircularDependency[] = [];
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      if (path.includes(node)) {
        const cycleStart = path.indexOf(node);
        const cycle = [...path.slice(cycleStart), node];
        circular.push({
          path: cycle,
          severity: cycle.length <= 3 ? 'error' : 'warning',
        });
        return;
      }

      if (visited.has(node)) return;
      visited.add(node);
      path.push(node);

      const module = this.modules.get(node);
      if (module) {
        for (const imp of module.imports) {
          if (imp.isRelative) {
            const target = this.resolveImportPath(node, imp.source);
            if (target) dfs(target);
          }
        }
      }

      path.pop();
    };

    for (const modulePath of this.modules.keys()) {
      visited.clear();
      path.length = 0;
      dfs(modulePath);
    }

    return circular;
  }

  private findOrphanedFiles(): string[] {
    const imported = new Set<string>();

    for (const rel of this.relationships) {
      imported.add(rel.target);
    }

    const orphans: string[] = [];
    for (const modulePath of this.modules.keys()) {
      // Skip entry points and test files
      if (
        modulePath.includes('index.') ||
        modulePath.includes('server.') ||
        modulePath.includes('App.') ||
        modulePath.includes('.test.') ||
        modulePath.includes('.spec.')
      ) {
        continue;
      }

      if (!imported.has(modulePath)) {
        orphans.push(modulePath);
      }
    }

    return orphans;
  }

  private runHealthChecks(): void {
    for (const [path, module] of this.modules) {
      // File size check
      if (module.lineCount > CONFIG.maxFileLines) {
        this.healthIssues.push({
          file: path,
          type: 'size',
          severity: module.lineCount > CONFIG.maxFileLines * 2 ? 'error' : 'warning',
          message: `File has ${module.lineCount} lines (max: ${CONFIG.maxFileLines})`,
          suggestion: 'Consider splitting into smaller modules',
        });
      }

      // Complexity check
      if (module.complexity > CONFIG.maxComplexity) {
        this.healthIssues.push({
          file: path,
          type: 'complexity',
          severity: module.complexity > CONFIG.maxComplexity * 2 ? 'error' : 'warning',
          message: `File complexity: ${module.complexity} (max: ${CONFIG.maxComplexity})`,
          suggestion: 'Extract complex logic into separate functions',
        });
      }

      // Function checks
      for (const fn of module.functions) {
        if (fn.complexity > CONFIG.maxComplexity) {
          this.healthIssues.push({
            file: path,
            line: fn.line,
            type: 'complexity',
            severity: 'warning',
            message: `Function '${fn.name}' has complexity ${fn.complexity}`,
            suggestion: 'Break down into smaller functions',
          });
        }

        if (fn.lineCount > CONFIG.maxFunctionLines) {
          this.healthIssues.push({
            file: path,
            line: fn.line,
            type: 'size',
            severity: 'warning',
            message: `Function '${fn.name}' has ${fn.lineCount} lines`,
            suggestion: 'Extract logic into helper functions',
          });
        }

        if (fn.params > CONFIG.maxFunctionParams) {
          this.healthIssues.push({
            file: path,
            line: fn.line,
            type: 'complexity',
            severity: 'info',
            message: `Function '${fn.name}' has ${fn.params} parameters`,
            suggestion: 'Consider using an options object',
          });
        }
      }
    }
  }

  private checkSecurityPatterns(filePath: string, content: string, lines: string[]): void {
    const relPath = this.relativePath(filePath);

    for (const { pattern, type } of CONFIG.securityPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = this.findLineNumber(content, match.index);

        // Skip if in comments
        const lineContent = lines[line - 1] || '';
        if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('*')) {
          continue;
        }

        this.healthIssues.push({
          file: relPath,
          line,
          type: 'security',
          severity: type === 'hardcoded-secret' ? 'error' : 'warning',
          message: `Security: ${type} detected`,
          suggestion: this.getSecuritySuggestion(type),
        });
      }
    }
  }

  private getSecuritySuggestion(type: string): string {
    const suggestions: Record<string, string> = {
      'env-access': 'Validate environment variables at startup',
      'eval-usage': 'Avoid eval(), use safer alternatives',
      'hardcoded-secret': 'Move secrets to environment variables',
      'path-traversal-risk': 'Validate and sanitize paths',
      'json-parse-unchecked': 'Wrap JSON.parse in try-catch or use Zod',
    };
    return suggestions[type] || 'Review for security implications';
  }

  private buildDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const modulePath of this.modules.keys()) {
      graph.set(modulePath, []);
    }

    for (const rel of this.relationships) {
      const deps = graph.get(rel.source) || [];
      if (!deps.includes(rel.target)) {
        deps.push(rel.target);
      }
      graph.set(rel.source, deps);
    }

    return graph;
  }

  private relativePath(fullPath: string): string {
    return relative(this.projectRoot, fullPath);
  }
}

// Report formatter
export function formatReport(report: AnalysisReport): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('  CODE ANALYSIS REPORT');
  lines.push('═'.repeat(60));
  lines.push(`  Generated: ${report.timestamp}`);
  lines.push(`  Project: ${report.projectRoot}`);
  lines.push('');

  lines.push('┌─ SUMMARY ─────────────────────────────────────────────────┐');
  lines.push(`│  Total Files:           ${report.summary.totalFiles.toString().padStart(6)}`);
  lines.push(`│  Total Lines:           ${report.summary.totalLines.toString().padStart(6)}`);
  lines.push(`│  Avg Complexity:        ${report.summary.avgComplexity.toFixed(2).padStart(6)}`);
  lines.push(`│  Circular Dependencies: ${report.summary.circularDependencies.toString().padStart(6)}`);
  lines.push(`│  Health Issues:         ${report.summary.healthIssues.toString().padStart(6)}`);
  lines.push('└───────────────────────────────────────────────────────────┘');
  lines.push('');

  if (report.circularDependencies.length > 0) {
    lines.push('┌─ CIRCULAR DEPENDENCIES ───────────────────────────────────┐');
    for (const dep of report.circularDependencies) {
      const severity = dep.severity === 'error' ? '🔴' : '🟡';
      lines.push(`│ ${severity} ${dep.path.join(' → ')}`);
    }
    lines.push('└───────────────────────────────────────────────────────────┘');
    lines.push('');
  }

  if (report.healthIssues.length > 0) {
    lines.push('┌─ HEALTH ISSUES ───────────────────────────────────────────┐');
    const grouped = new Map<string, CodeHealthIssue[]>();
    for (const issue of report.healthIssues) {
      const key = issue.severity;
      const list = grouped.get(key) || [];
      list.push(issue);
      grouped.set(key, list);
    }

    for (const severity of ['error', 'warning', 'info']) {
      const issues = grouped.get(severity) || [];
      if (issues.length === 0) continue;

      const icon = severity === 'error' ? '🔴' : severity === 'warning' ? '🟡' : '🔵';
      lines.push(`│`);
      lines.push(`│ ${icon} ${severity.toUpperCase()} (${issues.length})`);

      for (const issue of issues.slice(0, 10)) {
        const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
        lines.push(`│   └─ ${loc}`);
        lines.push(`│      ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`│      → ${issue.suggestion}`);
        }
      }

      if (issues.length > 10) {
        lines.push(`│   ... and ${issues.length - 10} more`);
      }
    }
    lines.push('└───────────────────────────────────────────────────────────┘');
    lines.push('');
  }

  if (report.orphanedFiles.length > 0) {
    lines.push('┌─ POTENTIALLY ORPHANED FILES ─────────────────────────────┐');
    for (const file of report.orphanedFiles.slice(0, 15)) {
      lines.push(`│  📄 ${file}`);
    }
    if (report.orphanedFiles.length > 15) {
      lines.push(`│  ... and ${report.orphanedFiles.length - 15} more`);
    }
    lines.push('└───────────────────────────────────────────────────────────┘');
    lines.push('');
  }

  // Top 10 complex files
  const complexFiles = Array.from(report.modules.entries())
    .sort((a, b) => b[1].complexity - a[1].complexity)
    .slice(0, 10);

  lines.push('┌─ TOP 10 COMPLEX FILES ────────────────────────────────────┐');
  for (const [path, module] of complexFiles) {
    const bar = '█'.repeat(Math.min(20, Math.floor(module.complexity / 5)));
    lines.push(`│  ${module.complexity.toString().padStart(3)} ${bar} ${path}`);
  }
  lines.push('└───────────────────────────────────────────────────────────┘');

  return lines.join('\n');
}

// JSON export
export function exportReportJSON(report: AnalysisReport): string {
  return JSON.stringify({
    ...report,
    modules: Object.fromEntries(report.modules),
    dependencyGraph: Object.fromEntries(report.dependencyGraph),
  }, null, 2);
}
