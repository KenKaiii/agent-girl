/**
 * Smart Naming Utility
 * Generates intelligent project names using N-gram analysis and pattern detection
 * Analyzes: package.json, file types, directory structure, and content patterns
 */

import * as fs from "fs";
import * as path from "path";

/** Project analysis result */
export interface ProjectAnalysis {
  name: string | null;           // Detected project name (from package.json etc)
  framework: string | null;      // Detected framework (React, Vue, Astro, etc)
  language: string | null;       // Primary language (TypeScript, Python, etc)
  type: string | null;           // Project type (web, api, cli, library)
  keywords: string[];            // Important keywords from analysis
  suggestedName: string;         // AI-generated name suggestion
  confidence: number;            // Confidence score 0-1
}

/** Framework detection patterns */
const FRAMEWORK_PATTERNS: Record<string, { files: string[]; deps: string[]; weight: number }> = {
  'nextjs': { files: ['next.config.js', 'next.config.mjs', 'next.config.ts'], deps: ['next'], weight: 10 },
  'react': { files: [], deps: ['react', 'react-dom'], weight: 8 },
  'vue': { files: ['vue.config.js', 'vite.config.ts'], deps: ['vue'], weight: 9 },
  'astro': { files: ['astro.config.mjs', 'astro.config.ts'], deps: ['astro'], weight: 10 },
  'svelte': { files: ['svelte.config.js'], deps: ['svelte'], weight: 9 },
  'angular': { files: ['angular.json'], deps: ['@angular/core'], weight: 10 },
  'express': { files: [], deps: ['express'], weight: 7 },
  'fastify': { files: [], deps: ['fastify'], weight: 7 },
  'django': { files: ['manage.py', 'settings.py'], deps: [], weight: 9 },
  'flask': { files: ['app.py'], deps: ['flask'], weight: 8 },
  'rust': { files: ['Cargo.toml'], deps: [], weight: 10 },
  'go': { files: ['go.mod'], deps: [], weight: 10 },
  'electron': { files: ['electron-builder.yml'], deps: ['electron'], weight: 9 },
  'tauri': { files: ['tauri.conf.json'], deps: ['@tauri-apps/api'], weight: 10 },
};

/** Language detection by file extension */
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
  '.py': 'python', '.rs': 'rust', '.go': 'go', '.java': 'java',
  '.rb': 'ruby', '.php': 'php', '.cs': 'csharp', '.cpp': 'cpp', '.c': 'c',
  '.swift': 'swift', '.kt': 'kotlin', '.scala': 'scala', '.zig': 'zig',
};

/** Project type indicators */
const PROJECT_TYPE_PATTERNS: Record<string, { dirs: string[]; files: string[]; keywords: string[] }> = {
  'web-app': { dirs: ['pages', 'routes', 'views', 'components'], files: ['index.html'], keywords: ['frontend', 'web'] },
  'api': { dirs: ['routes', 'controllers', 'handlers'], files: ['swagger.json', 'openapi.yaml'], keywords: ['api', 'rest', 'graphql'] },
  'cli': { dirs: ['bin', 'commands'], files: [], keywords: ['cli', 'command', 'terminal'] },
  'library': { dirs: ['src', 'lib'], files: ['tsconfig.json', 'rollup.config.js'], keywords: ['lib', 'package', 'sdk'] },
  'mobile': { dirs: ['android', 'ios'], files: ['app.json', 'expo.json'], keywords: ['mobile', 'app', 'react-native'] },
};

/** Stopwords to exclude from n-gram analysis */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'about', 'also', 'if', 'this', 'that', 'these', 'those', 'it', 'its',
  'import', 'export', 'const', 'let', 'var', 'function', 'class', 'return',
  'new', 'public', 'private', 'protected', 'static', 'async', 'await', 'try',
  'catch', 'throw', 'interface', 'type', 'extends', 'implements', 'default',
  'src', 'dist', 'build', 'node_modules', 'package', 'json', 'config',
]);

/** Common tech terms to boost */
const TECH_TERMS = new Set([
  'api', 'auth', 'chat', 'dashboard', 'editor', 'portal', 'admin', 'cms',
  'blog', 'store', 'shop', 'ecommerce', 'payment', 'analytics', 'monitor',
  'agent', 'bot', 'scraper', 'crawler', 'parser', 'generator', 'builder',
  'manager', 'tracker', 'scheduler', 'queue', 'worker', 'service', 'client',
  'server', 'gateway', 'proxy', 'cache', 'database', 'storage', 'backup',
  'sync', 'stream', 'pipeline', 'workflow', 'automation', 'integration',
]);

/**
 * Read and parse package.json if it exists
 */
function readPackageJson(dir: string): { name?: string; description?: string; keywords?: string[]; dependencies?: Record<string, string> } | null {
  try {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const content = fs.readFileSync(pkgPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Read and parse Cargo.toml if it exists
 */
function readCargoToml(dir: string): { name?: string; description?: string } | null {
  try {
    const cargoPath = path.join(dir, 'Cargo.toml');
    if (fs.existsSync(cargoPath)) {
      const content = fs.readFileSync(cargoPath, 'utf-8');
      const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
      const descMatch = content.match(/^description\s*=\s*"([^"]+)"/m);
      return {
        name: nameMatch?.[1],
        description: descMatch?.[1],
      };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Read and parse pyproject.toml or setup.py for Python projects
 */
function readPythonProject(dir: string): { name?: string; description?: string } | null {
  try {
    // Try pyproject.toml first
    const pyprojectPath = path.join(dir, 'pyproject.toml');
    if (fs.existsSync(pyprojectPath)) {
      const content = fs.readFileSync(pyprojectPath, 'utf-8');
      const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
      const descMatch = content.match(/^description\s*=\s*"([^"]+)"/m);
      return {
        name: nameMatch?.[1],
        description: descMatch?.[1],
      };
    }
    // Try setup.py
    const setupPath = path.join(dir, 'setup.py');
    if (fs.existsSync(setupPath)) {
      const content = fs.readFileSync(setupPath, 'utf-8');
      const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
      return { name: nameMatch?.[1] };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Count file types in directory (recursive, limited depth)
 */
function countFileTypes(dir: string, maxDepth: number = 3): Record<string, number> {
  const counts: Record<string, number> = {};

  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden and common ignored dirs
        if (entry.name.startsWith('.') ||
            entry.name === 'node_modules' ||
            entry.name === '__pycache__' ||
            entry.name === 'dist' ||
            entry.name === 'build' ||
            entry.name === 'target' ||
            entry.name === 'coverage') {
          continue;
        }

        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext) {
            counts[ext] = (counts[ext] || 0) + 1;
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  walk(dir, 0);
  return counts;
}

/**
 * Extract n-grams from text for keyword analysis
 */
function extractNgrams(text: string, n: number = 1): Map<string, number> {
  const ngrams = new Map<string, number>();

  // Tokenize: split on non-word characters, convert to lowercase
  const tokens = text
    .toLowerCase()
    .replace(/[_-]/g, ' ') // Convert snake_case and kebab-case to spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));

  // Generate n-grams
  for (let i = 0; i <= tokens.length - n; i++) {
    const ngram = tokens.slice(i, i + n).join(' ');
    ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
  }

  return ngrams;
}

/**
 * Get top directory names for analysis
 */
function getTopDirectories(dir: string): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => e.name)
      .slice(0, 20);
  } catch {
    return [];
  }
}

/**
 * Get top-level file names for analysis
 */
function getTopFiles(dir: string): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && !e.name.startsWith('.'))
      .map(e => e.name)
      .slice(0, 30);
  } catch {
    return [];
  }
}

/**
 * Detect framework from project files and dependencies
 */
function detectFramework(dir: string, pkg: ReturnType<typeof readPackageJson>): string | null {
  const files = getTopFiles(dir);
  const deps = pkg?.dependencies || {};
  const devDeps = (pkg as { devDependencies?: Record<string, string> })?.devDependencies || {};
  const allDeps = { ...deps, ...devDeps };

  let bestMatch: { name: string; weight: number } | null = null;

  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    let score = 0;

    // Check config files
    for (const file of patterns.files) {
      if (files.includes(file)) {
        score += patterns.weight;
      }
    }

    // Check dependencies
    for (const dep of patterns.deps) {
      if (dep in allDeps) {
        score += patterns.weight * 0.8;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.weight)) {
      bestMatch = { name: framework, weight: score };
    }
  }

  return bestMatch?.name || null;
}

/**
 * Detect primary programming language
 */
function detectLanguage(fileTypeCounts: Record<string, number>): string | null {
  let maxCount = 0;
  let primaryLang: string | null = null;

  for (const [ext, count] of Object.entries(fileTypeCounts)) {
    const lang = LANGUAGE_EXTENSIONS[ext];
    if (lang && count > maxCount) {
      maxCount = count;
      primaryLang = lang;
    }
  }

  return primaryLang;
}

/**
 * Detect project type
 */
function detectProjectType(dir: string, pkg: ReturnType<typeof readPackageJson>): string | null {
  const dirs = getTopDirectories(dir);
  const files = getTopFiles(dir);

  let bestMatch: { type: string; score: number } | null = null;

  for (const [type, patterns] of Object.entries(PROJECT_TYPE_PATTERNS)) {
    let score = 0;

    for (const d of patterns.dirs) {
      if (dirs.includes(d)) score += 2;
    }

    for (const f of patterns.files) {
      if (files.includes(f)) score += 3;
    }

    // Check keywords in package.json
    if (pkg?.keywords) {
      for (const kw of patterns.keywords) {
        if (pkg.keywords.some(k => k.toLowerCase().includes(kw))) {
          score += 2;
        }
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { type, score };
    }
  }

  return bestMatch?.type || null;
}

/**
 * Extract keywords using n-gram analysis
 */
function extractKeywords(dir: string, pkg: ReturnType<typeof readPackageJson>): string[] {
  const allText: string[] = [];

  // Add package.json info
  if (pkg) {
    if (pkg.name) allText.push(pkg.name);
    if (pkg.description) allText.push(pkg.description);
    if (pkg.keywords) allText.push(...pkg.keywords);
  }

  // Add directory names
  allText.push(...getTopDirectories(dir));

  // Add file names (without extensions)
  const files = getTopFiles(dir);
  allText.push(...files.map(f => path.basename(f, path.extname(f))));

  // Read README if exists
  try {
    const readmePaths = ['README.md', 'readme.md', 'README.txt', 'README'];
    for (const readme of readmePaths) {
      const readmePath = path.join(dir, readme);
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        // Take first 1000 chars of README
        allText.push(content.substring(0, 1000));
        break;
      }
    }
  } catch {
    // Ignore read errors
  }

  // Generate n-grams
  const text = allText.join(' ');
  const unigrams = extractNgrams(text, 1);
  const bigrams = extractNgrams(text, 2);

  // Score and rank keywords
  const scored: Array<{ word: string; score: number }> = [];

  for (const [word, count] of unigrams) {
    let score = count;
    // Boost tech terms
    if (TECH_TERMS.has(word)) score *= 2;
    // Boost if it appears in project name
    if (pkg?.name?.toLowerCase().includes(word)) score *= 3;
    scored.push({ word, score });
  }

  // Add significant bigrams
  for (const [bigram, count] of bigrams) {
    if (count >= 2) {
      scored.push({ word: bigram, score: count * 1.5 });
    }
  }

  // Sort by score and take top keywords
  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, 10)
    .map(s => s.word)
    .filter(w => w.length > 2);
}

/**
 * Generate a smart suggested name based on analysis
 */
function generateSuggestedName(analysis: Omit<ProjectAnalysis, 'suggestedName' | 'confidence'>): string {
  const parts: string[] = [];

  // Use project name if available and meaningful
  if (analysis.name && analysis.name.length > 2 && analysis.name.length < 30) {
    // Clean up the name
    const cleanName = analysis.name
      .replace(/^@[^/]+\//, '') // Remove npm scope
      .replace(/[_-]/g, ' ')
      .trim();

    if (cleanName) {
      return toKebabCase(cleanName);
    }
  }

  // Build name from framework + type + keywords
  if (analysis.framework) {
    parts.push(analysis.framework);
  }

  if (analysis.type) {
    parts.push(analysis.type.replace('-', ' '));
  }

  // Add top keyword if different from framework/type
  const topKeyword = analysis.keywords[0];
  if (topKeyword &&
      topKeyword !== analysis.framework?.toLowerCase() &&
      topKeyword !== analysis.type?.toLowerCase()) {
    parts.push(topKeyword);
  }

  // Generate name
  if (parts.length > 0) {
    return toKebabCase(parts.join(' ')).substring(0, 40);
  }

  // Fallback: use first keyword or 'project'
  return analysis.keywords[0] ? toKebabCase(analysis.keywords[0]) : 'project';
}

/**
 * Convert text to kebab-case
 */
function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate confidence score based on available data
 */
function calculateConfidence(analysis: Omit<ProjectAnalysis, 'suggestedName' | 'confidence'>): number {
  let score = 0;
  let maxScore = 0;

  // Has project name from manifest
  maxScore += 30;
  if (analysis.name) score += 30;

  // Framework detected
  maxScore += 25;
  if (analysis.framework) score += 25;

  // Language detected
  maxScore += 20;
  if (analysis.language) score += 20;

  // Project type detected
  maxScore += 15;
  if (analysis.type) score += 15;

  // Has keywords
  maxScore += 10;
  if (analysis.keywords.length > 0) score += Math.min(10, analysis.keywords.length * 2);

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Main function: Analyze a project directory and generate smart naming suggestions
 */
export function analyzeProject(dir: string): ProjectAnalysis {
  // Expand home directory
  if (dir.startsWith('~/')) {
    dir = path.join(process.env.HOME || '', dir.slice(2));
  }

  // Read project manifests
  const pkg = readPackageJson(dir);
  const cargo = readCargoToml(dir);
  const python = readPythonProject(dir);

  // Count file types
  const fileTypeCounts = countFileTypes(dir);

  // Detect various attributes
  const name = pkg?.name || cargo?.name || python?.name || null;
  const framework = detectFramework(dir, pkg);
  const language = detectLanguage(fileTypeCounts);
  const type = detectProjectType(dir, pkg);
  const keywords = extractKeywords(dir, pkg);

  // Build partial analysis
  const partialAnalysis = {
    name,
    framework,
    language,
    type,
    keywords,
  };

  // Generate suggested name and confidence
  const suggestedName = generateSuggestedName(partialAnalysis);
  const confidence = calculateConfidence(partialAnalysis);

  return {
    ...partialAnalysis,
    suggestedName,
    confidence,
  };
}

/**
 * Generate multiple name suggestions with variations
 */
export function generateNameSuggestions(dir: string, count: number = 5): string[] {
  const analysis = analyzeProject(dir);
  const suggestions: string[] = [];

  // Primary suggestion
  suggestions.push(analysis.suggestedName);

  // Variation: framework + first keyword
  if (analysis.framework && analysis.keywords[0]) {
    suggestions.push(toKebabCase(`${analysis.framework} ${analysis.keywords[0]}`));
  }

  // Variation: type + first keyword
  if (analysis.type && analysis.keywords[0]) {
    suggestions.push(toKebabCase(`${analysis.keywords[0]} ${analysis.type}`));
  }

  // Variation: language + keyword
  if (analysis.language && analysis.keywords[0]) {
    suggestions.push(toKebabCase(`${analysis.keywords[0]} ${analysis.language}`));
  }

  // Add top keywords as fallback
  for (const kw of analysis.keywords) {
    if (suggestions.length >= count) break;
    if (!suggestions.includes(kw)) {
      suggestions.push(toKebabCase(kw));
    }
  }

  // Remove duplicates and limit
  return [...new Set(suggestions)].slice(0, count);
}

/**
 * Quick analysis for chat naming (lighter weight)
 */
export function quickAnalyzeForChatName(content: string, workingDir?: string): string {
  // Extract key terms from message content
  const contentNgrams = extractNgrams(content, 1);
  const contentBigrams = extractNgrams(content, 2);

  // Score terms
  const scored: Array<{ term: string; score: number }> = [];

  for (const [term, count] of contentNgrams) {
    let score = count;
    if (TECH_TERMS.has(term)) score *= 3;
    scored.push({ term, score });
  }

  for (const [bigram, count] of contentBigrams) {
    if (count >= 2) {
      scored.push({ term: bigram, score: count * 2 });
    }
  }

  // If we have a working directory, blend in project analysis
  if (workingDir && fs.existsSync(workingDir)) {
    try {
      const projectAnalysis = analyzeProject(workingDir);

      // Boost terms that match project keywords
      for (const s of scored) {
        if (projectAnalysis.keywords.includes(s.term)) {
          s.score *= 2;
        }
      }

      // Add project name as high-scoring term if available
      if (projectAnalysis.name) {
        scored.push({ term: toKebabCase(projectAnalysis.name), score: 100 });
      }
    } catch {
      // Ignore project analysis errors
    }
  }

  // Sort and generate name
  scored.sort((a, b) => b.score - a.score);

  const topTerms = scored.slice(0, 3).map(s => s.term);

  if (topTerms.length === 0) {
    return 'chat';
  }

  // Generate name from top terms
  const name = toKebabCase(topTerms.join(' ')).substring(0, 40);
  return name || 'chat';
}
