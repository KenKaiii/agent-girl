/**
 * Agent Girl - AST-based Refactoring Assistant
 * Intelligent code analysis and automated refactoring
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import type {
  ExecutionPlan,
  ExecutionPhase,
  ExecutionStep,
  ExecutionContext,
} from './types';

// ============================================================
// TYPES
// ============================================================

export interface CodeIssue {
  id: string;
  type: RefactoringType;
  severity: 'critical' | 'warning' | 'suggestion';
  file: string;
  line: number;
  endLine?: number;
  message: string;
  suggestion: string;
  autoFixable: boolean;
  fix?: CodeFix;
}

export interface CodeFix {
  type: 'replace' | 'insert' | 'delete' | 'move';
  range: { start: number; end: number };
  newText?: string;
  targetFile?: string;
  targetLine?: number;
}

export type RefactoringType =
  | 'extract_function'
  | 'extract_component'
  | 'extract_hook'
  | 'inline_variable'
  | 'rename_symbol'
  | 'move_to_file'
  | 'split_file'
  | 'dead_code'
  | 'duplicate_code'
  | 'long_function'
  | 'deep_nesting'
  | 'complex_condition'
  | 'magic_number'
  | 'missing_types'
  | 'unused_import'
  | 'circular_dependency';

export interface FileAnalysis {
  path: string;
  lines: number;
  functions: FunctionInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  components: ComponentInfo[];
  hooks: HookInfo[];
  issues: CodeIssue[];
  complexity: number;
  dependencies: string[];
}

interface FunctionInfo {
  name: string;
  line: number;
  endLine: number;
  params: number;
  complexity: number;
  isAsync: boolean;
  isExported: boolean;
}

interface ImportInfo {
  source: string;
  specifiers: string[];
  line: number;
  isUsed: boolean;
  isTypeOnly: boolean;
}

interface ExportInfo {
  name: string;
  type: 'default' | 'named' | 'type';
  line: number;
}

interface ComponentInfo {
  name: string;
  line: number;
  endLine: number;
  props: string[];
  hooks: string[];
  complexity: number;
}

interface HookInfo {
  name: string;
  line: number;
  endLine: number;
  dependencies: string[];
}

// ============================================================
// PATTERN DETECTION
// ============================================================

const PATTERNS = {
  function: /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
  arrowFunction: /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/g,
  component: /(?:export\s+)?(?:const|function)\s+([A-Z]\w+)\s*[=:]/g,
  hook: /(?:export\s+)?(?:const|function)\s+(use[A-Z]\w+)\s*[=:]/g,
  import: /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+)|\*\s+as\s+(\w+))?\s*(?:,\s*(?:\{([^}]+)\}|(\w+)))?\s*from\s*['"]([^'"]+)['"]/g,
  export: /export\s+(?:(default)\s+)?(?:type\s+)?(?:const|let|var|function|class|interface|type)\s+(\w+)/g,
  jsxElement: /<([A-Z]\w+)[^>]*>/g,
  hookCall: /\b(use\w+)\s*\(/g,
  complexity: {
    if: /\bif\s*\(/g,
    else: /\belse\s*{/g,
    for: /\bfor\s*\(/g,
    while: /\bwhile\s*\(/g,
    switch: /\bswitch\s*\(/g,
    case: /\bcase\s+/g,
    catch: /\bcatch\s*\(/g,
    ternary: /\?\s*[^:]+\s*:/g,
    and: /&&/g,
    or: /\|\|/g,
  },
  magicNumber: /(?<![\w.])(?<![\d])[2-9]\d{2,}(?![\d])|(?<![\w.])(?<![\d])\d{4,}(?![\d])/g,
  deepNesting: /^(\s{12,})\S/gm, // 3+ levels of 4-space indent
};

// ============================================================
// REFACTORING ASSISTANT
// ============================================================

export class RefactoringAssistant {
  private analysisCache: Map<string, FileAnalysis> = new Map();
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  // ============================================================
  // ANALYSIS
  // ============================================================

  /**
   * Analyze entire project
   */
  async analyzeProject(): Promise<{
    files: FileAnalysis[];
    issues: CodeIssue[];
    summary: ProjectSummary;
  }> {
    const files = await this.scanFiles();
    const analyses: FileAnalysis[] = [];
    const allIssues: CodeIssue[] = [];

    for (const file of files) {
      const analysis = await this.analyzeFile(file);
      if (analysis) {
        analyses.push(analysis);
        allIssues.push(...analysis.issues);
      }
    }

    // Detect cross-file issues
    const crossFileIssues = this.detectCrossFileIssues(analyses);
    allIssues.push(...crossFileIssues);

    // Sort by severity
    allIssues.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return {
      files: analyses,
      issues: allIssues,
      summary: this.generateSummary(analyses, allIssues),
    };
  }

  /**
   * Analyze single file
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis | null> {
    // Check cache
    const cached = this.analysisCache.get(filePath);
    if (cached) return cached;

    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      const analysis: FileAnalysis = {
        path: filePath.replace(this.projectPath, ''),
        lines: lines.length,
        functions: this.extractFunctions(content),
        imports: this.extractImports(content),
        exports: this.extractExports(content),
        components: this.extractComponents(content),
        hooks: this.extractHooks(content),
        issues: [],
        complexity: this.calculateComplexity(content),
        dependencies: [],
      };

      // Extract dependencies
      analysis.dependencies = analysis.imports.map(i => i.source);

      // Detect issues
      analysis.issues = this.detectIssues(content, analysis, filePath);

      // Cache result
      this.analysisCache.set(filePath, analysis);

      return analysis;
    } catch {
      return null;
    }
  }

  // ============================================================
  // EXTRACTION
  // ============================================================

  private extractFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split('\n');

    // Regular functions
    let match;
    while ((match = PATTERNS.function.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const endLine = this.findBlockEnd(lines, line - 1);
      const body = lines.slice(line - 1, endLine).join('\n');

      functions.push({
        name: match[1],
        line,
        endLine,
        params: match[2] ? match[2].split(',').filter(p => p.trim()).length : 0,
        complexity: this.calculateComplexity(body),
        isAsync: match[0].includes('async'),
        isExported: match[0].startsWith('export'),
      });
    }

    // Arrow functions
    PATTERNS.arrowFunction.lastIndex = 0;
    while ((match = PATTERNS.arrowFunction.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const endLine = this.findBlockEnd(lines, line - 1);
      const body = lines.slice(line - 1, endLine).join('\n');

      functions.push({
        name: match[1],
        line,
        endLine,
        params: 0, // Would need more complex parsing
        complexity: this.calculateComplexity(body),
        isAsync: match[0].includes('async'),
        isExported: match[0].startsWith('export'),
      });
    }

    return functions;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    let match: RegExpExecArray | null;

    PATTERNS.import.lastIndex = 0;
    while ((match = PATTERNS.import.exec(content)) !== null) {
      const specifiers: string[] = [];
      const currentMatch = match; // Capture for closure

      // Named imports { a, b, c }
      if (currentMatch[1]) {
        specifiers.push(...currentMatch[1].split(',').map(s => s.trim().split(' as ')[0].trim()));
      }
      // Default import
      if (currentMatch[2]) specifiers.push(currentMatch[2]);
      // Namespace import * as X
      if (currentMatch[3]) specifiers.push(currentMatch[3]);
      // Additional named imports after default
      if (currentMatch[4]) {
        specifiers.push(...currentMatch[4].split(',').map(s => s.trim().split(' as ')[0].trim()));
      }
      if (currentMatch[5]) specifiers.push(currentMatch[5]);

      const source = currentMatch[6];
      const line = content.substring(0, currentMatch.index).split('\n').length;

      // Check if imports are used
      const isUsed = specifiers.some(spec =>
        new RegExp(`\\b${spec}\\b`, 'g').test(
          content.substring(currentMatch.index + currentMatch[0].length)
        )
      );

      imports.push({
        source,
        specifiers,
        line,
        isUsed,
        isTypeOnly: match[0].includes('import type'),
      });
    }

    return imports;
  }

  private extractExports(content: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    let match;

    PATTERNS.export.lastIndex = 0;
    while ((match = PATTERNS.export.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      exports.push({
        name: match[2] || 'default',
        type: match[1] === 'default' ? 'default' : 'named',
        line,
      });
    }

    return exports;
  }

  private extractComponents(content: string): ComponentInfo[] {
    const components: ComponentInfo[] = [];
    const lines = content.split('\n');
    let match;

    PATTERNS.component.lastIndex = 0;
    while ((match = PATTERNS.component.exec(content)) !== null) {
      // Skip hooks
      if (match[1].startsWith('use')) continue;

      const line = content.substring(0, match.index).split('\n').length;
      const endLine = this.findBlockEnd(lines, line - 1);
      const body = lines.slice(line - 1, endLine).join('\n');

      // Extract hooks used
      const hooks: string[] = [];
      let hookMatch;
      PATTERNS.hookCall.lastIndex = 0;
      while ((hookMatch = PATTERNS.hookCall.exec(body)) !== null) {
        if (!hooks.includes(hookMatch[1])) {
          hooks.push(hookMatch[1]);
        }
      }

      // Extract props (simplified)
      const propsMatch = body.match(/\(\s*\{([^}]+)\}\s*[),:]/);
      const props = propsMatch
        ? propsMatch[1].split(',').map(p => p.trim().split(':')[0].trim())
        : [];

      components.push({
        name: match[1],
        line,
        endLine,
        props,
        hooks,
        complexity: this.calculateComplexity(body),
      });
    }

    return components;
  }

  private extractHooks(content: string): HookInfo[] {
    const hooks: HookInfo[] = [];
    const lines = content.split('\n');
    let match;

    PATTERNS.hook.lastIndex = 0;
    while ((match = PATTERNS.hook.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const endLine = this.findBlockEnd(lines, line - 1);
      const body = lines.slice(line - 1, endLine).join('\n');

      // Extract dependencies (hooks called within)
      const deps: string[] = [];
      let hookMatch;
      PATTERNS.hookCall.lastIndex = 0;
      while ((hookMatch = PATTERNS.hookCall.exec(body)) !== null) {
        if (!deps.includes(hookMatch[1]) && hookMatch[1] !== match[1]) {
          deps.push(hookMatch[1]);
        }
      }

      hooks.push({
        name: match[1],
        line,
        endLine,
        dependencies: deps,
      });
    }

    return hooks;
  }

  // ============================================================
  // ISSUE DETECTION
  // ============================================================

  private detectIssues(
    content: string,
    analysis: FileAnalysis,
    filePath: string
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // 1. Long functions (>50 lines)
    for (const fn of analysis.functions) {
      const length = fn.endLine - fn.line;
      if (length > 50) {
        issues.push({
          id: `long_fn_${fn.name}`,
          type: 'long_function',
          severity: length > 100 ? 'critical' : 'warning',
          file: analysis.path,
          line: fn.line,
          endLine: fn.endLine,
          message: `Function '${fn.name}' is ${length} lines (max: 50)`,
          suggestion: `Extract smaller functions from '${fn.name}'`,
          autoFixable: true,
          fix: {
            type: 'replace',
            range: { start: fn.line, end: fn.endLine },
          },
        });
      }
    }

    // 2. High complexity functions (>15)
    for (const fn of analysis.functions) {
      if (fn.complexity > 15) {
        issues.push({
          id: `complex_fn_${fn.name}`,
          type: 'deep_nesting',
          severity: fn.complexity > 25 ? 'critical' : 'warning',
          file: analysis.path,
          line: fn.line,
          message: `Function '${fn.name}' has complexity ${fn.complexity} (max: 15)`,
          suggestion: 'Simplify conditionals or extract helper functions',
          autoFixable: false,
        });
      }
    }

    // 3. Unused imports
    for (const imp of analysis.imports) {
      if (!imp.isUsed && !imp.isTypeOnly) {
        issues.push({
          id: `unused_import_${imp.source}_${imp.line}`,
          type: 'unused_import',
          severity: 'suggestion',
          file: analysis.path,
          line: imp.line,
          message: `Unused import from '${imp.source}'`,
          suggestion: 'Remove unused import',
          autoFixable: true,
          fix: {
            type: 'delete',
            range: { start: imp.line, end: imp.line },
          },
        });
      }
    }

    // 4. Large components (>200 lines)
    for (const comp of analysis.components) {
      const length = comp.endLine - comp.line;
      if (length > 200) {
        issues.push({
          id: `large_component_${comp.name}`,
          type: 'extract_component',
          severity: length > 400 ? 'critical' : 'warning',
          file: analysis.path,
          line: comp.line,
          endLine: comp.endLine,
          message: `Component '${comp.name}' is ${length} lines (max: 200)`,
          suggestion: 'Extract sub-components',
          autoFixable: true,
        });
      }
    }

    // 5. Magic numbers
    let match;
    PATTERNS.magicNumber.lastIndex = 0;
    while ((match = PATTERNS.magicNumber.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const lineContent = lines[line - 1];

      // Skip if in import, const declaration, or array index
      if (
        lineContent.includes('import') ||
        /const\s+\w+\s*=/.test(lineContent) ||
        /\[\s*\d+\s*\]/.test(lineContent)
      ) {
        continue;
      }

      issues.push({
        id: `magic_${match[0]}_${line}`,
        type: 'magic_number',
        severity: 'suggestion',
        file: analysis.path,
        line,
        message: `Magic number ${match[0]}`,
        suggestion: 'Extract to named constant',
        autoFixable: true,
      });
    }

    // 6. Deep nesting
    PATTERNS.deepNesting.lastIndex = 0;
    while ((match = PATTERNS.deepNesting.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const depth = Math.floor(match[1].length / 4);

      issues.push({
        id: `nesting_${line}`,
        type: 'deep_nesting',
        severity: depth > 5 ? 'warning' : 'suggestion',
        file: analysis.path,
        line,
        message: `Deep nesting (${depth} levels)`,
        suggestion: 'Extract to separate function or use early returns',
        autoFixable: false,
      });
    }

    // 7. Large file
    if (analysis.lines > 500) {
      issues.push({
        id: `large_file_${analysis.path}`,
        type: 'split_file',
        severity: analysis.lines > 1000 ? 'critical' : 'warning',
        file: analysis.path,
        line: 1,
        message: `File is ${analysis.lines} lines (max: 500)`,
        suggestion: 'Split into multiple files',
        autoFixable: true,
      });
    }

    return issues;
  }

  private detectCrossFileIssues(analyses: FileAnalysis[]): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Build dependency graph
    const depGraph = new Map<string, Set<string>>();
    for (const analysis of analyses) {
      depGraph.set(analysis.path, new Set(analysis.dependencies));
    }

    // Detect circular dependencies
    for (const [file, deps] of depGraph) {
      for (const dep of deps) {
        const depDeps = depGraph.get(dep);
        if (depDeps?.has(file)) {
          issues.push({
            id: `circular_${file}_${dep}`,
            type: 'circular_dependency',
            severity: 'warning',
            file,
            line: 1,
            message: `Circular dependency between '${file}' and '${dep}'`,
            suggestion: 'Extract shared code to a third module',
            autoFixable: false,
          });
        }
      }
    }

    // Detect duplicate code (simplified - check for similar function names)
    const functionMap = new Map<string, string[]>();
    for (const analysis of analyses) {
      for (const fn of analysis.functions) {
        if (!functionMap.has(fn.name)) {
          functionMap.set(fn.name, []);
        }
        functionMap.get(fn.name)!.push(analysis.path);
      }
    }

    for (const [name, files] of functionMap) {
      if (files.length > 1 && !['default', 'constructor'].includes(name)) {
        issues.push({
          id: `duplicate_fn_${name}`,
          type: 'duplicate_code',
          severity: 'suggestion',
          file: files[0],
          line: 1,
          message: `Function '${name}' exists in multiple files: ${files.join(', ')}`,
          suggestion: 'Consider extracting to shared utility',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  // ============================================================
  // REFACTORING PLANS
  // ============================================================

  /**
   * Generate refactoring plan for an issue
   */
  async generateRefactoringPlan(issue: CodeIssue): Promise<ExecutionPlan> {
    const phases: ExecutionPhase[] = [];

    switch (issue.type) {
      case 'long_function':
      case 'extract_function':
        phases.push(this.createExtractFunctionPhase(issue));
        break;

      case 'extract_component':
        phases.push(this.createExtractComponentPhase(issue));
        break;

      case 'split_file':
        phases.push(this.createSplitFilePhase(issue));
        break;

      case 'unused_import':
        phases.push(this.createRemoveImportPhase(issue));
        break;

      case 'duplicate_code':
        phases.push(this.createDeduplicatePhase(issue));
        break;

      default:
        phases.push(this.createGenericRefactorPhase(issue));
    }

    // Add validation phase
    phases.push({
      name: 'Validate',
      steps: [
        {
          id: 'typecheck',
          action: 'run_command',
          params: { command: 'bunx tsc --noEmit' },
          model: 'haiku',
          maxRetries: 1,
        },
        {
          id: 'lint',
          action: 'run_command',
          params: { command: 'bunx eslint .' },
          model: 'haiku',
          maxRetries: 1,
        },
      ],
      parallel: true,
      timeout: 60000,
    });

    return {
      id: `refactor_${issue.id}_${Date.now()}`,
      goal: `Refactor: ${issue.message}`,
      phases,
      estimatedDuration: phases.length * 30000,
      estimatedCost: 0.05,
      checkpoints: [0],
    };
  }

  private createExtractFunctionPhase(issue: CodeIssue): ExecutionPhase {
    return {
      name: 'Extract Function',
      steps: [
        {
          id: 'analyze_function',
          action: 'analyze',
          params: {
            file: issue.file,
            startLine: issue.line,
            endLine: issue.endLine,
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'identify_extractable',
          action: 'identify_code_blocks',
          params: {
            criteria: 'cohesive_block',
            minLines: 10,
            maxLines: 30,
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'extract_functions',
          action: 'refactor',
          params: {
            type: 'extract_function',
            preserveContext: true,
          },
          model: 'sonnet',
          maxRetries: 3,
        },
      ],
      parallel: false,
      timeout: 120000,
    };
  }

  private createExtractComponentPhase(issue: CodeIssue): ExecutionPhase {
    return {
      name: 'Extract Component',
      steps: [
        {
          id: 'analyze_component',
          action: 'analyze',
          params: {
            file: issue.file,
            type: 'component',
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'identify_subcomponents',
          action: 'identify_jsx_blocks',
          params: {
            minSize: 20,
            reusability: 'high',
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'create_components',
          action: 'refactor',
          params: {
            type: 'extract_component',
            createFiles: true,
            addExports: true,
          },
          model: 'sonnet',
          maxRetries: 3,
        },
        {
          id: 'update_imports',
          action: 'update_imports',
          params: {
            autoOrganize: true,
          },
          model: 'haiku',
          maxRetries: 2,
        },
      ],
      parallel: false,
      timeout: 180000,
    };
  }

  private createSplitFilePhase(issue: CodeIssue): ExecutionPhase {
    return {
      name: 'Split File',
      steps: [
        {
          id: 'analyze_structure',
          action: 'analyze',
          params: {
            file: issue.file,
            type: 'structure',
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'group_by_concern',
          action: 'group_code',
          params: {
            strategy: 'separation_of_concerns',
            maxFileSize: 300,
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'create_files',
          action: 'split_file',
          params: {
            createIndex: true,
            preserveExports: true,
          },
          model: 'sonnet',
          maxRetries: 3,
        },
        {
          id: 'update_all_imports',
          action: 'update_imports',
          params: {
            scope: 'project',
          },
          model: 'haiku',
          maxRetries: 2,
        },
      ],
      parallel: false,
      timeout: 300000,
    };
  }

  private createRemoveImportPhase(issue: CodeIssue): ExecutionPhase {
    return {
      name: 'Remove Unused Import',
      steps: [
        {
          id: 'remove_import',
          action: 'delete_lines',
          params: {
            file: issue.file,
            lines: [issue.line],
          },
          model: 'haiku',
          maxRetries: 1,
        },
      ],
      parallel: false,
      timeout: 10000,
    };
  }

  private createDeduplicatePhase(issue: CodeIssue): ExecutionPhase {
    return {
      name: 'Deduplicate Code',
      steps: [
        {
          id: 'find_duplicates',
          action: 'find_duplicates',
          params: {
            minSimilarity: 0.8,
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'create_shared',
          action: 'create_file',
          params: {
            path: 'utils/shared.ts',
            type: 'utility',
          },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'replace_duplicates',
          action: 'replace_with_import',
          params: {
            preserveTypes: true,
          },
          model: 'sonnet',
          maxRetries: 3,
        },
      ],
      parallel: false,
      timeout: 180000,
    };
  }

  private createGenericRefactorPhase(issue: CodeIssue): ExecutionPhase {
    return {
      name: 'Generic Refactor',
      steps: [
        {
          id: 'analyze',
          action: 'analyze',
          params: { file: issue.file },
          model: 'sonnet',
          maxRetries: 2,
        },
        {
          id: 'refactor',
          action: 'refactor',
          params: {
            type: issue.type,
            suggestion: issue.suggestion,
          },
          model: 'sonnet',
          maxRetries: 3,
        },
      ],
      parallel: false,
      timeout: 120000,
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async scanFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    const scan = async (dir: string): Promise<void> => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          // Skip common non-source directories
          if (
            entry.name.startsWith('.') ||
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === 'build' ||
            entry.name === 'coverage'
          ) {
            continue;
          }

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (extensions.includes(extname(entry.name))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Ignore permission errors
      }
    };

    await scan(this.projectPath);
    return files;
  }

  private findBlockEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let started = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === '{' || char === '(') {
          braceCount++;
          started = true;
        } else if (char === '}' || char === ')') {
          braceCount--;
        }
      }

      if (started && braceCount === 0) {
        return i + 1;
      }
    }

    return Math.min(startLine + 50, lines.length);
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;

    for (const [_, pattern] of Object.entries(PATTERNS.complexity)) {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  private generateSummary(
    analyses: FileAnalysis[],
    issues: CodeIssue[]
  ): ProjectSummary {
    const totalLines = analyses.reduce((sum, a) => sum + a.lines, 0);
    const avgComplexity =
      analyses.reduce((sum, a) => sum + a.complexity, 0) / analyses.length || 0;

    const issuesByType = new Map<RefactoringType, number>();
    for (const issue of issues) {
      issuesByType.set(issue.type, (issuesByType.get(issue.type) || 0) + 1);
    }

    return {
      totalFiles: analyses.length,
      totalLines,
      avgComplexity: Math.round(avgComplexity * 10) / 10,
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      autoFixableIssues: issues.filter(i => i.autoFixable).length,
      issuesByType: Object.fromEntries(issuesByType),
      topFiles: analyses
        .sort((a, b) => b.issues.length - a.issues.length)
        .slice(0, 5)
        .map(a => ({ path: a.path, issues: a.issues.length })),
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

interface ProjectSummary {
  totalFiles: number;
  totalLines: number;
  avgComplexity: number;
  totalIssues: number;
  criticalIssues: number;
  autoFixableIssues: number;
  issuesByType: Record<string, number>;
  topFiles: Array<{ path: string; issues: number }>;
}

// Export factory
export function createRefactoringAssistant(projectPath: string): RefactoringAssistant {
  return new RefactoringAssistant(projectPath);
}
