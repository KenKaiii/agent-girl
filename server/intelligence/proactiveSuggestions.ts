/**
 * Agent Girl - Proactive Suggestions Engine
 * Analyzes project and suggests improvements automatically
 */

import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type {
  Suggestion,
  SuggestionType,
  ProjectAnalysis,
  FileAnalysis,
  DependencyAnalysis,
  CodeQualityMetrics,
  ExecutionPlan,
  ExecutionContext,
} from './types';
import { createGoalDecomposer } from './goalDecomposer';

// ============================================================
// SUGGESTION RULES
// ============================================================

interface SuggestionRule {
  type: SuggestionType;
  check: (analysis: ProjectAnalysis) => Suggestion | null;
  priority: number;
}

const SUGGESTION_RULES: SuggestionRule[] = [
  // Critical: Security Issues
  {
    type: 'security_issue',
    priority: 1,
    check: (a) => {
      if (a.dependencies.vulnerable > 0) {
        return {
          id: `sec_${Date.now()}`,
          type: 'security_issue',
          title: `${a.dependencies.vulnerable} vulnerable dependencies`,
          description: `Found ${a.dependencies.vulnerable} packages with known vulnerabilities. Run \`bun audit\` for details.`,
          impact: 'critical',
          effort: 'easy',
          autoFixable: true,
          context: ['security', 'dependencies'],
          confidence: 0.95,
        };
      }
      return null;
    },
  },

  // High: Missing Tests
  {
    type: 'missing_tests',
    priority: 2,
    check: (a) => {
      if (a.codeQuality.testCoverage < 50) {
        const criticalFiles = a.files
          .filter(f => f.complexity > 10 && !f.path.includes('.test.'))
          .slice(0, 5);

        if (criticalFiles.length > 0) {
          return {
            id: `test_${Date.now()}`,
            type: 'missing_tests',
            title: `${criticalFiles.length} complex files without tests`,
            description: `High-complexity files: ${criticalFiles.map(f => f.path).join(', ')}`,
            impact: 'high',
            effort: 'medium',
            autoFixable: true,
            context: criticalFiles.map(f => f.path),
            confidence: 0.85,
          };
        }
      }
      return null;
    },
  },

  // High: Outdated Dependencies
  {
    type: 'outdated_deps',
    priority: 3,
    check: (a) => {
      const breaking = a.dependencies.updates.filter(u => u.breaking);
      if (breaking.length > 0) {
        return {
          id: `dep_${Date.now()}`,
          type: 'outdated_deps',
          title: `${breaking.length} dependencies with breaking updates`,
          description: breaking.map(u => `${u.name}: ${u.current} → ${u.latest}`).join('\n'),
          impact: 'high',
          effort: 'medium',
          autoFixable: false, // Needs manual review
          context: breaking.map(u => u.name),
          confidence: 0.9,
        };
      }

      const outdated = a.dependencies.updates.filter(u => !u.breaking);
      if (outdated.length > 5) {
        return {
          id: `dep_minor_${Date.now()}`,
          type: 'outdated_deps',
          title: `${outdated.length} dependencies can be updated`,
          description: `Run \`bun update\` to update non-breaking dependencies.`,
          impact: 'medium',
          effort: 'trivial',
          autoFixable: true,
          context: outdated.map(u => u.name),
          confidence: 0.95,
        };
      }
      return null;
    },
  },

  // Medium: Missing Types
  {
    type: 'missing_types',
    priority: 4,
    check: (a) => {
      if (a.codeQuality.typesCoverage < 80) {
        const untypedFiles = a.files.filter(f =>
          (f.path.endsWith('.js') || f.path.endsWith('.jsx')) &&
          !f.path.includes('node_modules')
        );

        if (untypedFiles.length > 0) {
          return {
            id: `types_${Date.now()}`,
            type: 'missing_types',
            title: `${untypedFiles.length} JavaScript files could use TypeScript`,
            description: `Consider converting to TypeScript for better type safety.`,
            impact: 'medium',
            effort: 'hard',
            autoFixable: false,
            context: untypedFiles.slice(0, 5).map(f => f.path),
            confidence: 0.7,
          };
        }
      }
      return null;
    },
  },

  // Medium: Code Smells (large files)
  {
    type: 'code_smell',
    priority: 5,
    check: (a) => {
      const largeFiles = a.files.filter(f => f.lines > 500);
      if (largeFiles.length > 0) {
        return {
          id: `smell_large_${Date.now()}`,
          type: 'code_smell',
          title: `${largeFiles.length} files exceed 500 lines`,
          description: `Consider splitting: ${largeFiles.map(f => `${f.path} (${f.lines} lines)`).join(', ')}`,
          impact: 'medium',
          effort: 'medium',
          autoFixable: true,
          context: largeFiles.map(f => f.path),
          confidence: 0.8,
        };
      }
      return null;
    },
  },

  // Medium: Duplicate Code
  {
    type: 'duplicate_code',
    priority: 6,
    check: (a) => {
      if (a.codeQuality.duplicateLines > 100) {
        return {
          id: `dup_${Date.now()}`,
          type: 'duplicate_code',
          title: `${a.codeQuality.duplicateLines} lines of duplicate code`,
          description: `Consider extracting common patterns into shared utilities.`,
          impact: 'medium',
          effort: 'medium',
          autoFixable: true,
          context: ['refactor'],
          confidence: 0.75,
        };
      }
      return null;
    },
  },

  // Low: Performance
  {
    type: 'performance',
    priority: 7,
    check: (a) => {
      // Check for common performance issues
      const heavyImports = a.files.filter(f =>
        f.imports.some(imp =>
          ['lodash', 'moment', 'jquery'].includes(imp.toLowerCase())
        )
      );

      if (heavyImports.length > 0) {
        return {
          id: `perf_${Date.now()}`,
          type: 'performance',
          title: `Heavy dependencies detected`,
          description: `Consider lighter alternatives: lodash → lodash-es, moment → date-fns`,
          impact: 'low',
          effort: 'medium',
          autoFixable: false,
          context: heavyImports.map(f => f.path),
          confidence: 0.7,
        };
      }
      return null;
    },
  },

  // Low: Dead Code
  {
    type: 'dead_code',
    priority: 8,
    check: (a) => {
      if (a.dependencies.unused > 0) {
        return {
          id: `dead_${Date.now()}`,
          type: 'dead_code',
          title: `${a.dependencies.unused} unused dependencies`,
          description: `Remove unused packages to reduce bundle size.`,
          impact: 'low',
          effort: 'trivial',
          autoFixable: true,
          context: ['cleanup'],
          confidence: 0.85,
        };
      }
      return null;
    },
  },
];

// ============================================================
// PROACTIVE ENGINE
// ============================================================

export class ProactiveSuggestionsEngine {
  private analysisCache: Map<string, ProjectAnalysis> = new Map();
  private suggestionHistory: Set<string> = new Set(); // Avoid duplicate suggestions
  private idleCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private projectPath: string) {}

  /**
   * Start idle monitoring - analyze when user is inactive
   */
  startIdleMonitor(idleMs = 30000, onSuggestion: (s: Suggestion) => void): void {
    let lastActivity = Date.now();

    // Track activity (would be connected to actual UI events)
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    this.idleCheckInterval = setInterval(async () => {
      const idle = Date.now() - lastActivity;
      if (idle >= idleMs) {
        const suggestions = await this.analyze();
        const newSuggestions = suggestions.filter(
          s => !this.suggestionHistory.has(s.id)
        );

        for (const suggestion of newSuggestions.slice(0, 3)) {
          this.suggestionHistory.add(suggestion.id);
          onSuggestion(suggestion);
        }

        // Reset activity to prevent spam
        lastActivity = Date.now();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop idle monitoring
   */
  stopIdleMonitor(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  /**
   * Full project analysis
   */
  async analyze(): Promise<Suggestion[]> {
    const analysis = await this.analyzeProject();
    const suggestions: Suggestion[] = [];

    // Run all rules
    for (const rule of SUGGESTION_RULES) {
      const suggestion = rule.check(analysis);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Sort by priority (impact + confidence)
    suggestions.sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.confidence - a.confidence;
    });

    return suggestions;
  }

  /**
   * Generate auto-fix plan for a suggestion
   */
  async generateFix(suggestion: Suggestion): Promise<ExecutionPlan | null> {
    if (!suggestion.autoFixable) return null;

    const context: ExecutionContext = {
      workingDirectory: this.projectPath,
    };

    const decomposer = createGoalDecomposer(context);

    switch (suggestion.type) {
      case 'missing_tests':
        return decomposer.decompose(
          `Generate comprehensive tests for: ${suggestion.context.join(', ')}`
        );

      case 'outdated_deps':
        return decomposer.decompose(
          `Update dependencies safely: ${suggestion.context.join(', ')}`
        );

      case 'code_smell':
        return decomposer.decompose(
          `Refactor large files into smaller modules: ${suggestion.context.join(', ')}`
        );

      case 'duplicate_code':
        return decomposer.decompose(
          `Extract duplicate code into shared utilities`
        );

      case 'dead_code':
        return decomposer.decompose(
          `Remove unused dependencies and dead code`
        );

      case 'security_issue':
        return decomposer.decompose(
          `Fix security vulnerabilities in dependencies`
        );

      default:
        return null;
    }
  }

  // ============================================================
  // PROJECT ANALYSIS
  // ============================================================

  private async analyzeProject(): Promise<ProjectAnalysis> {
    const cacheKey = `${this.projectPath}_${Date.now() - (Date.now() % 60000)}`; // Cache for 1 minute

    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const [files, dependencies, codeQuality] = await Promise.all([
      this.analyzeFiles(),
      this.analyzeDependencies(),
      this.analyzeCodeQuality(),
    ]);

    const analysis: ProjectAnalysis = {
      files,
      dependencies,
      codeQuality,
      suggestions: [], // Will be filled by analyze()
      timestamp: Date.now(),
    };

    this.analysisCache.set(cacheKey, analysis);

    // Clean old cache entries
    for (const [key] of this.analysisCache) {
      if (!key.startsWith(this.projectPath)) {
        this.analysisCache.delete(key);
      }
    }

    return analysis;
  }

  private async analyzeFiles(): Promise<FileAnalysis[]> {
    const files: FileAnalysis[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.astro', '.svelte'];

    const scan = async (dir: string): Promise<void> => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          // Skip node_modules, .git, etc.
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
          }

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (extensions.includes(extname(entry.name))) {
            const analysis = await this.analyzeFile(fullPath);
            if (analysis) files.push(analysis);
          }
        }
      } catch {
        // Ignore permission errors
      }
    };

    await scan(this.projectPath);
    return files;
  }

  private async analyzeFile(path: string): Promise<FileAnalysis | null> {
    try {
      const content = await Bun.file(path).text();
      const lines = content.split('\n');

      // Extract imports
      const importRegex = /import\s+(?:(?:\{[^}]*\}|[^{}\s]+)\s+from\s+)?['"]([^'"]+)['"]/g;
      const imports: string[] = [];
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Extract exports
      const exportRegex = /export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+(\w+)/g;
      const exports: string[] = [];
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }

      // Calculate complexity (simple heuristic)
      const complexity = this.calculateComplexity(content);

      // Find issues
      const issues: string[] = [];
      if (lines.length > 500) issues.push('file_too_large');
      if (complexity > 20) issues.push('high_complexity');
      if (content.includes('any')) issues.push('uses_any');
      if (content.includes('// TODO')) issues.push('has_todos');
      if (content.includes('console.log')) issues.push('has_console_logs');

      return {
        path: path.replace(this.projectPath, ''),
        lines: lines.length,
        complexity,
        imports,
        exports,
        issues,
      };
    } catch {
      return null;
    }
  }

  private calculateComplexity(content: string): number {
    // Cyclomatic complexity approximation
    const patterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\?\s*[^:]+\s*:/g, // Ternary
      /&&/g,
      /\|\|/g,
    ];

    let complexity = 1;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  private async analyzeDependencies(): Promise<DependencyAnalysis> {
    try {
      const pkgPath = join(this.projectPath, 'package.json');
      const pkg = await Bun.file(pkgPath).json();

      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      const total = Object.keys(deps).length;

      // Check for outdated (simplified - would use npm/bun API)
      const updates: DependencyAnalysis['updates'] = [];

      // Simulate some outdated checks
      for (const [name, version] of Object.entries(deps)) {
        if (typeof version === 'string' && version.startsWith('^')) {
          // Could be outdated (simplified heuristic)
          // In real implementation, would check npm registry
        }
      }

      return {
        total,
        outdated: updates.length,
        vulnerable: 0, // Would run bun audit
        unused: 0, // Would analyze imports
        updates,
      };
    } catch {
      return {
        total: 0,
        outdated: 0,
        vulnerable: 0,
        unused: 0,
        updates: [],
      };
    }
  }

  private async analyzeCodeQuality(): Promise<CodeQualityMetrics> {
    // In real implementation, would integrate with actual tools
    return {
      testCoverage: 0, // Would run coverage
      typesCoverage: 100, // Assume TypeScript
      lintScore: 100, // Would run eslint
      duplicateLines: 0, // Would run jscpd
      avgComplexity: 5, // Would calculate from files
    };
  }
}

export function createProactiveSuggestions(projectPath: string): ProactiveSuggestionsEngine {
  return new ProactiveSuggestionsEngine(projectPath);
}
