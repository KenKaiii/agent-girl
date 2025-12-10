/**
 * Agent Girl - Smart Section ID Generator
 * Multi-pattern obfuscated IDs to prevent pattern recognition
 */

// Cryptographically secure random string
function secureRandom(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join('');
}

// Word lists for narrative IDs
const ADJECTIVES = [
  'swift', 'calm', 'bold', 'soft', 'pure', 'zen', 'nova',
  'vast', 'keen', 'warm', 'cool', 'deep', 'free', 'wise',
  'bright', 'clear', 'fresh', 'prime', 'true', 'vivid',
] as const;

const NOUNS = [
  'wave', 'peak', 'flow', 'spark', 'bloom', 'drift', 'pulse',
  'core', 'edge', 'glow', 'mist', 'reef', 'arch', 'cove',
  'dawn', 'dusk', 'vale', 'mesa', 'fjord', 'grove',
] as const;

// Pick random element
function pick<T>(arr: readonly T[]): T {
  const index = crypto.getRandomValues(new Uint32Array(1))[0] % arr.length;
  return arr[index];
}

export type IdPattern = 'semantic' | 'narrative' | 'hash' | 'mixed' | 'data' | 'element';

export interface ComponentIds {
  section: string;
  container: string;
  heading: string;
  content: string;
  wrapper?: string;
}

/**
 * Generate a single section ID with specified or random pattern
 */
export function generateSectionId(pattern?: IdPattern): string {
  const patterns: Record<IdPattern, () => string> = {
    // Pattern 1: s_a7x3k2 (semantic prefix + hash)
    semantic: () => `s_${secureRandom(6)}`,

    // Pattern 2: swift-wave-3k (adjective-noun-hash)
    narrative: () => `${pick(ADJECTIVES)}-${pick(NOUNS)}-${secureRandom(2)}`,

    // Pattern 3: _x7k2m9p (underscore + pure hash)
    hash: () => `_${secureRandom(7)}`,

    // Pattern 4: sec-3a-bloom (prefix-hash-noun)
    mixed: () => `sec-${secureRandom(2)}-${pick(NOUNS)}`,

    // Pattern 5: data-v7x9k2 (data attribute style)
    data: () => `v${secureRandom(6)}`,

    // Pattern 6: el_swift_3k (element + adjective + hash)
    element: () => `el_${pick(ADJECTIVES)}_${secureRandom(2)}`,
  };

  // Random pattern selection if not specified
  const patternKeys = Object.keys(patterns) as IdPattern[];
  const selectedPattern = pattern || patternKeys[crypto.getRandomValues(new Uint32Array(1))[0] % patternKeys.length];

  return patterns[selectedPattern]();
}

/**
 * Generate a complete set of IDs for a component
 * Each ID uses a different pattern for maximum obfuscation
 */
export function generateComponentIds(sectionType?: string): ComponentIds {
  const allPatterns: IdPattern[] = ['semantic', 'narrative', 'hash', 'mixed', 'data', 'element'];

  // Shuffle patterns to randomize assignment
  const shuffled = [...allPatterns].sort(() =>
    crypto.getRandomValues(new Uint32Array(1))[0] % 2 === 0 ? 1 : -1
  );

  return {
    section: generateSectionId(shuffled[0]),
    container: generateSectionId(shuffled[1]),
    heading: generateSectionId(shuffled[2]),
    content: generateSectionId(shuffled[3]),
    wrapper: generateSectionId(shuffled[4]),
  };
}

/**
 * Generate multiple unique IDs ensuring no collisions
 */
export function generateUniqueIds(count: number, pattern?: IdPattern): string[] {
  const ids = new Set<string>();
  while (ids.size < count) {
    ids.add(generateSectionId(pattern));
  }
  return Array.from(ids);
}

/**
 * Generate ID with niche-specific prefix for semantic meaning
 */
export function generateNicheId(niche: string): string {
  const prefixes: Record<string, string> = {
    healthcare: 'hc',
    fintech: 'ft',
    ecommerce: 'ec',
    creative: 'cr',
    saas: 'ss',
  };

  const prefix = prefixes[niche] || 'gen';
  return `${prefix}_${secureRandom(5)}`;
}

/**
 * Validate that an ID is unique within a document context
 */
export function isUniqueId(id: string, existingIds: Set<string>): boolean {
  return !existingIds.has(id);
}

/**
 * Generate CSS class names with varied patterns
 */
export function generateClassNames(baseClass: string): string[] {
  const patterns = [
    `${baseClass}-${secureRandom(4)}`,
    `_${secureRandom(3)}_${baseClass}`,
    `${pick(ADJECTIVES)}${baseClass.charAt(0).toUpperCase()}${baseClass.slice(1)}`,
    `c${secureRandom(5)}`,
  ];

  return patterns;
}
