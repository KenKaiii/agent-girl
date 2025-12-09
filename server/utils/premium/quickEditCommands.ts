/**
 * Quick Edit Commands - Natural Language Website Editing
 * Allows customers to edit their premium websites with simple commands
 *
 * Examples:
 * - "change headline to 'Welcome to Our Practice'"
 * - "make the hero background darker"
 * - "add a phone number in the header"
 * - "change primary color to blue"
 */

import { DesignSystem, getDesignSystem } from '../../presets/design-systems';
import { NicheConfig, getNiche } from '../../presets/niches';

// ============================================================================
// Types
// ============================================================================

export type EditCommandType =
  | 'text_change'
  | 'color_change'
  | 'image_change'
  | 'layout_change'
  | 'add_element'
  | 'remove_element'
  | 'style_change'
  | 'content_regenerate'
  | 'seo_update';

export interface EditCommand {
  id: string;
  type: EditCommandType;
  originalInput: string;
  parsed: ParsedCommand;
  targetSelector?: string;
  targetFile?: string;
  changes: ChangeOperation[];
  preview?: string;
  confidence: number;
  requiresConfirmation: boolean;
}

export interface ParsedCommand {
  action: string;
  target: string;
  value?: string;
  modifiers: string[];
  context?: string;
}

export interface ChangeOperation {
  type: 'replace' | 'insert' | 'delete' | 'modify';
  path: string;
  oldValue?: string;
  newValue?: string;
  position?: 'before' | 'after' | 'inside';
}

export interface EditResult {
  success: boolean;
  command: EditCommand;
  appliedChanges: ChangeOperation[];
  undoOperations: ChangeOperation[];
  preview?: string;
  message: string;
}

// ============================================================================
// Command Patterns
// ============================================================================

interface CommandPattern {
  type: EditCommandType;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray, input: string) => ParsedCommand;
  confidence: number;
}

const COMMAND_PATTERNS: CommandPattern[] = [
  // Text changes
  {
    type: 'text_change',
    patterns: [
      /change\s+(?:the\s+)?(.+?)\s+(?:text\s+)?to\s+["'](.+?)["']/i,
      /set\s+(?:the\s+)?(.+?)\s+to\s+["'](.+?)["']/i,
      /update\s+(?:the\s+)?(.+?)\s+(?:text\s+)?to\s+["'](.+?)["']/i,
      /make\s+(?:the\s+)?(.+?)\s+say\s+["'](.+?)["']/i,
    ],
    extract: (match, input) => ({
      action: 'change',
      target: match[1].trim(),
      value: match[2],
      modifiers: [],
      context: input,
    }),
    confidence: 0.9,
  },

  // Color changes
  {
    type: 'color_change',
    patterns: [
      /change\s+(?:the\s+)?(.+?)\s+color\s+to\s+(\w+|#[0-9a-fA-F]{3,6})/i,
      /make\s+(?:the\s+)?(.+?)\s+(darker|lighter|more\s+\w+)/i,
      /set\s+(?:the\s+)?(.+?)\s+color\s+to\s+(\w+|#[0-9a-fA-F]{3,6})/i,
      /use\s+(\w+)\s+(?:as\s+)?(?:the\s+)?(.+?)\s+color/i,
    ],
    extract: (match, input) => ({
      action: 'change_color',
      target: match[1].trim(),
      value: match[2],
      modifiers: extractColorModifiers(input),
      context: input,
    }),
    confidence: 0.85,
  },

  // Image changes
  {
    type: 'image_change',
    patterns: [
      /change\s+(?:the\s+)?(.+?)\s+image\s+to\s+(.+)/i,
      /replace\s+(?:the\s+)?(.+?)\s+(?:image|photo|picture)\s+with\s+(.+)/i,
      /use\s+(.+?)\s+(?:as|for)\s+(?:the\s+)?(.+?)\s+(?:image|background)/i,
      /update\s+(?:the\s+)?(.+?)\s+(?:image|photo)/i,
    ],
    extract: (match, input) => ({
      action: 'change_image',
      target: match[1].trim(),
      value: match[2]?.trim(),
      modifiers: [],
      context: input,
    }),
    confidence: 0.85,
  },

  // Add element
  {
    type: 'add_element',
    patterns: [
      /add\s+(?:a\s+)?(.+?)\s+(?:to|in|on)\s+(?:the\s+)?(.+)/i,
      /include\s+(?:a\s+)?(.+?)\s+(?:in|on)\s+(?:the\s+)?(.+)/i,
      /put\s+(?:a\s+)?(.+?)\s+(?:in|on)\s+(?:the\s+)?(.+)/i,
      /insert\s+(?:a\s+)?(.+?)\s+(?:before|after|in)\s+(?:the\s+)?(.+)/i,
    ],
    extract: (match, input) => ({
      action: 'add',
      target: match[2].trim(),
      value: match[1].trim(),
      modifiers: extractPositionModifiers(input),
      context: input,
    }),
    confidence: 0.8,
  },

  // Remove element
  {
    type: 'remove_element',
    patterns: [
      /remove\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(.+))?$/i,
      /delete\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(.+))?$/i,
      /hide\s+(?:the\s+)?(.+)/i,
      /get\s+rid\s+of\s+(?:the\s+)?(.+)/i,
    ],
    extract: (match, input) => ({
      action: 'remove',
      target: match[1].trim(),
      value: match[2]?.trim(),
      modifiers: [],
      context: input,
    }),
    confidence: 0.85,
  },

  // Style changes
  {
    type: 'style_change',
    patterns: [
      /make\s+(?:the\s+)?(.+?)\s+(bigger|smaller|larger|bolder|thinner)/i,
      /(?:increase|decrease)\s+(?:the\s+)?(.+?)\s+(size|spacing|padding|margin)/i,
      /center\s+(?:the\s+)?(.+)/i,
      /align\s+(?:the\s+)?(.+?)\s+(?:to\s+)?(?:the\s+)?(left|right|center)/i,
    ],
    extract: (match, input) => ({
      action: 'style',
      target: match[1].trim(),
      value: match[2],
      modifiers: extractStyleModifiers(input),
      context: input,
    }),
    confidence: 0.8,
  },

  // Content regenerate
  {
    type: 'content_regenerate',
    patterns: [
      /regenerate\s+(?:the\s+)?(.+?)(?:\s+content)?$/i,
      /rewrite\s+(?:the\s+)?(.+)/i,
      /generate\s+(?:new|better)\s+(.+)/i,
      /improve\s+(?:the\s+)?(.+?)(?:\s+text)?$/i,
    ],
    extract: (match, input) => ({
      action: 'regenerate',
      target: match[1].trim(),
      modifiers: extractToneModifiers(input),
      context: input,
    }),
    confidence: 0.75,
  },

  // SEO updates
  {
    type: 'seo_update',
    patterns: [
      /(?:change|update|set)\s+(?:the\s+)?(?:page\s+)?title\s+to\s+["'](.+?)["']/i,
      /(?:change|update|set)\s+(?:the\s+)?(?:meta\s+)?description\s+to\s+["'](.+?)["']/i,
      /add\s+(?:the\s+)?keyword[s]?\s+["'](.+?)["']/i,
      /optimize\s+(?:for|the)\s+(?:keyword\s+)?["'](.+?)["']/i,
    ],
    extract: (match, input) => ({
      action: 'seo',
      target: determineSEOTarget(input),
      value: match[1],
      modifiers: [],
      context: input,
    }),
    confidence: 0.85,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function extractColorModifiers(input: string): string[] {
  const modifiers: string[] = [];
  if (/darker/i.test(input)) modifiers.push('darker');
  if (/lighter/i.test(input)) modifiers.push('lighter');
  if (/more\s+saturated/i.test(input)) modifiers.push('saturated');
  if (/less\s+saturated/i.test(input)) modifiers.push('desaturated');
  if (/vibrant/i.test(input)) modifiers.push('vibrant');
  if (/muted/i.test(input)) modifiers.push('muted');
  return modifiers;
}

function extractPositionModifiers(input: string): string[] {
  const modifiers: string[] = [];
  if (/before/i.test(input)) modifiers.push('before');
  if (/after/i.test(input)) modifiers.push('after');
  if (/at\s+(?:the\s+)?top/i.test(input)) modifiers.push('top');
  if (/at\s+(?:the\s+)?bottom/i.test(input)) modifiers.push('bottom');
  if (/in\s+(?:the\s+)?header/i.test(input)) modifiers.push('header');
  if (/in\s+(?:the\s+)?footer/i.test(input)) modifiers.push('footer');
  return modifiers;
}

function extractStyleModifiers(input: string): string[] {
  const modifiers: string[] = [];
  if (/much\s+(bigger|larger)/i.test(input)) modifiers.push('scale-large');
  if (/slightly\s+(bigger|larger)/i.test(input)) modifiers.push('scale-small');
  if (/much\s+smaller/i.test(input)) modifiers.push('shrink-large');
  if (/slightly\s+smaller/i.test(input)) modifiers.push('shrink-small');
  if (/bold/i.test(input)) modifiers.push('bold');
  if (/italic/i.test(input)) modifiers.push('italic');
  return modifiers;
}

function extractToneModifiers(input: string): string[] {
  const modifiers: string[] = [];
  if (/professional/i.test(input)) modifiers.push('professional');
  if (/friendly/i.test(input)) modifiers.push('friendly');
  if (/formal/i.test(input)) modifiers.push('formal');
  if (/casual/i.test(input)) modifiers.push('casual');
  if (/persuasive/i.test(input)) modifiers.push('persuasive');
  if (/shorter/i.test(input)) modifiers.push('concise');
  if (/longer/i.test(input)) modifiers.push('detailed');
  return modifiers;
}

function determineSEOTarget(input: string): string {
  if (/title/i.test(input)) return 'title';
  if (/description/i.test(input)) return 'meta_description';
  if (/keyword/i.test(input)) return 'keywords';
  if (/og:|social/i.test(input)) return 'og_tags';
  return 'general';
}

function generateId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Target Resolution
// ============================================================================

interface TargetResolution {
  selector: string;
  file: string;
  elementType: string;
  confidence: number;
}

const TARGET_MAP: Record<string, TargetResolution> = {
  // Headers
  'headline': { selector: 'h1', file: 'Hero.astro', elementType: 'heading', confidence: 0.9 },
  'heading': { selector: 'h1', file: 'Hero.astro', elementType: 'heading', confidence: 0.9 },
  'title': { selector: 'h1', file: 'Hero.astro', elementType: 'heading', confidence: 0.85 },
  'hero title': { selector: '.hero h1', file: 'Hero.astro', elementType: 'heading', confidence: 0.95 },
  'hero heading': { selector: '.hero h1', file: 'Hero.astro', elementType: 'heading', confidence: 0.95 },
  'main heading': { selector: 'h1', file: 'Hero.astro', elementType: 'heading', confidence: 0.9 },

  // Subheadings
  'subheading': { selector: '.hero p', file: 'Hero.astro', elementType: 'text', confidence: 0.85 },
  'subtitle': { selector: '.hero p', file: 'Hero.astro', elementType: 'text', confidence: 0.85 },
  'tagline': { selector: '.hero .tagline', file: 'Hero.astro', elementType: 'text', confidence: 0.9 },

  // Buttons
  'button': { selector: '.btn-primary', file: 'Hero.astro', elementType: 'button', confidence: 0.8 },
  'cta button': { selector: '.btn-cta', file: 'Hero.astro', elementType: 'button', confidence: 0.9 },
  'call to action': { selector: '.btn-cta', file: 'Hero.astro', elementType: 'button', confidence: 0.85 },
  'primary button': { selector: '.btn-primary', file: 'Hero.astro', elementType: 'button', confidence: 0.9 },

  // Sections
  'hero': { selector: '.hero', file: 'Hero.astro', elementType: 'section', confidence: 0.95 },
  'hero section': { selector: '.hero', file: 'Hero.astro', elementType: 'section', confidence: 0.95 },
  'hero background': { selector: '.hero', file: 'Hero.astro', elementType: 'background', confidence: 0.9 },
  'about': { selector: '.about', file: 'About.astro', elementType: 'section', confidence: 0.9 },
  'about section': { selector: '.about', file: 'About.astro', elementType: 'section', confidence: 0.95 },
  'services': { selector: '.services', file: 'Services.astro', elementType: 'section', confidence: 0.9 },
  'contact': { selector: '.contact', file: 'Contact.astro', elementType: 'section', confidence: 0.9 },
  'footer': { selector: 'footer', file: 'Footer.astro', elementType: 'section', confidence: 0.95 },
  'header': { selector: 'header', file: 'Header.astro', elementType: 'section', confidence: 0.95 },
  'navigation': { selector: 'nav', file: 'Header.astro', elementType: 'navigation', confidence: 0.9 },
  'nav': { selector: 'nav', file: 'Header.astro', elementType: 'navigation', confidence: 0.9 },

  // Colors
  'primary color': { selector: ':root', file: 'global.css', elementType: 'css_variable', confidence: 0.95 },
  'secondary color': { selector: ':root', file: 'global.css', elementType: 'css_variable', confidence: 0.95 },
  'accent color': { selector: ':root', file: 'global.css', elementType: 'css_variable', confidence: 0.95 },
  'background color': { selector: ':root', file: 'global.css', elementType: 'css_variable', confidence: 0.9 },
  'text color': { selector: ':root', file: 'global.css', elementType: 'css_variable', confidence: 0.9 },

  // Contact info
  'phone number': { selector: '.phone', file: 'Contact.astro', elementType: 'text', confidence: 0.9 },
  'email': { selector: '.email', file: 'Contact.astro', elementType: 'text', confidence: 0.9 },
  'address': { selector: '.address', file: 'Contact.astro', elementType: 'text', confidence: 0.9 },

  // Images
  'logo': { selector: '.logo img', file: 'Header.astro', elementType: 'image', confidence: 0.95 },
  'hero image': { selector: '.hero img', file: 'Hero.astro', elementType: 'image', confidence: 0.9 },
  'background image': { selector: '.hero', file: 'Hero.astro', elementType: 'background_image', confidence: 0.85 },
};

function resolveTarget(target: string): TargetResolution | null {
  // Normalize target
  const normalized = target.toLowerCase().trim();

  // Direct match
  if (TARGET_MAP[normalized]) {
    return TARGET_MAP[normalized];
  }

  // Fuzzy match
  for (const [key, value] of Object.entries(TARGET_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { ...value, confidence: value.confidence * 0.8 };
    }
  }

  // Return generic selector
  return {
    selector: `.${normalized.replace(/\s+/g, '-')}`,
    file: 'unknown',
    elementType: 'unknown',
    confidence: 0.3,
  };
}

// ============================================================================
// Main Parser
// ============================================================================

export function parseEditCommand(input: string): EditCommand | null {
  const normalizedInput = input.trim();

  for (const pattern of COMMAND_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = normalizedInput.match(regex);
      if (match) {
        const parsed = pattern.extract(match, normalizedInput);
        const targetResolution = resolveTarget(parsed.target);

        return {
          id: generateId(),
          type: pattern.type,
          originalInput: input,
          parsed,
          targetSelector: targetResolution?.selector,
          targetFile: targetResolution?.file,
          changes: generateChanges(pattern.type, parsed, targetResolution),
          confidence: pattern.confidence * (targetResolution?.confidence || 0.5),
          requiresConfirmation: pattern.confidence < 0.8 || (targetResolution?.confidence || 0) < 0.7,
        };
      }
    }
  }

  return null;
}

// ============================================================================
// Change Generation
// ============================================================================

function generateChanges(
  type: EditCommandType,
  parsed: ParsedCommand,
  target: TargetResolution | null
): ChangeOperation[] {
  if (!target) return [];

  switch (type) {
    case 'text_change':
      return [{
        type: 'replace',
        path: `${target.file}:${target.selector}`,
        newValue: parsed.value,
      }];

    case 'color_change':
      return [{
        type: 'modify',
        path: `${target.file}:${target.selector}`,
        newValue: resolveColor(parsed.value || '', parsed.modifiers),
      }];

    case 'image_change':
      return [{
        type: 'replace',
        path: `${target.file}:${target.selector}`,
        newValue: parsed.value,
      }];

    case 'add_element':
      return [{
        type: 'insert',
        path: `${target.file}:${target.selector}`,
        newValue: parsed.value,
        position: parsed.modifiers.includes('before') ? 'before' : 'after',
      }];

    case 'remove_element':
      return [{
        type: 'delete',
        path: `${target.file}:${target.selector}`,
      }];

    case 'style_change':
      return generateStyleChanges(parsed, target);

    case 'content_regenerate':
      return [{
        type: 'replace',
        path: `${target.file}:${target.selector}`,
        newValue: `[REGENERATE:${parsed.modifiers.join(',')}]`,
      }];

    case 'seo_update':
      return [{
        type: 'modify',
        path: `Layout.astro:head`,
        newValue: parsed.value,
      }];

    default:
      return [];
  }
}

function resolveColor(value: string, modifiers: string[]): string {
  // Named colors
  const namedColors: Record<string, string> = {
    blue: '#3B82F6',
    red: '#EF4444',
    green: '#10B981',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    orange: '#F97316',
    teal: '#14B8A6',
    indigo: '#6366F1',
    gold: '#D4AF37',
    silver: '#C0C0C0',
    black: '#000000',
    white: '#FFFFFF',
  };

  let color = value.startsWith('#') ? value : (namedColors[value.toLowerCase()] || value);

  // Apply modifiers
  if (modifiers.includes('darker')) {
    color = adjustBrightness(color, -20);
  }
  if (modifiers.includes('lighter')) {
    color = adjustBrightness(color, 20);
  }

  return color;
}

function adjustBrightness(hex: string, percent: number): string {
  // Simple brightness adjustment
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function generateStyleChanges(parsed: ParsedCommand, target: TargetResolution): ChangeOperation[] {
  const changes: ChangeOperation[] = [];

  if (parsed.value === 'bigger' || parsed.value === 'larger') {
    changes.push({
      type: 'modify',
      path: `${target.file}:${target.selector}:font-size`,
      newValue: 'scale(1.2)',
    });
  }

  if (parsed.value === 'smaller') {
    changes.push({
      type: 'modify',
      path: `${target.file}:${target.selector}:font-size`,
      newValue: 'scale(0.8)',
    });
  }

  if (parsed.value === 'bolder') {
    changes.push({
      type: 'modify',
      path: `${target.file}:${target.selector}:font-weight`,
      newValue: 'bold',
    });
  }

  return changes;
}

// ============================================================================
// Command Execution
// ============================================================================

export async function executeEditCommand(
  command: EditCommand,
  projectPath: string
): Promise<EditResult> {
  const appliedChanges: ChangeOperation[] = [];
  const undoOperations: ChangeOperation[] = [];

  try {
    for (const change of command.changes) {
      // In a real implementation, this would:
      // 1. Read the target file
      // 2. Parse the AST or use regex
      // 3. Apply the change
      // 4. Save the file
      // 5. Store undo operation

      appliedChanges.push(change);
      undoOperations.push({
        type: change.type === 'insert' ? 'delete' : 'replace',
        path: change.path,
        oldValue: change.newValue,
        newValue: change.oldValue,
      });
    }

    return {
      success: true,
      command,
      appliedChanges,
      undoOperations,
      message: `Successfully applied ${appliedChanges.length} change(s)`,
    };
  } catch (error) {
    return {
      success: false,
      command,
      appliedChanges,
      undoOperations,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Undo/Redo Stack
// ============================================================================

interface UndoStack {
  past: EditResult[];
  future: EditResult[];
}

const undoStacks: Map<string, UndoStack> = new Map();

export function pushToUndoStack(projectId: string, result: EditResult): void {
  let stack = undoStacks.get(projectId);
  if (!stack) {
    stack = { past: [], future: [] };
    undoStacks.set(projectId, stack);
  }

  stack.past.push(result);
  stack.future = []; // Clear future on new action

  // Limit stack size
  if (stack.past.length > 50) {
    stack.past.shift();
  }
}

export function undo(projectId: string): EditResult | null {
  const stack = undoStacks.get(projectId);
  if (!stack || stack.past.length === 0) return null;

  const result = stack.past.pop()!;
  stack.future.push(result);

  return result;
}

export function redo(projectId: string): EditResult | null {
  const stack = undoStacks.get(projectId);
  if (!stack || stack.future.length === 0) return null;

  const result = stack.future.pop()!;
  stack.past.push(result);

  return result;
}

// ============================================================================
// Suggestion Generator
// ============================================================================

export function generateEditSuggestions(
  currentContent: string,
  nicheId: string,
  designSystemId: string
): string[] {
  const suggestions: string[] = [];
  const niche = getNiche(nicheId);
  const designSystem = getDesignSystem(designSystemId);

  // Generic suggestions
  suggestions.push(
    'Change the headline to something more compelling',
    'Make the call-to-action button stand out more',
    'Add a phone number to the header',
    'Update the hero image',
  );

  // Niche-specific suggestions
  if (niche) {
    if (niche.id === 'healthcare') {
      suggestions.push(
        'Add patient testimonials',
        'Include insurance information',
        'Add appointment booking button',
      );
    }
    if (niche.id === 'restaurant') {
      suggestions.push(
        'Update the menu section',
        'Add opening hours',
        'Include reservation button',
      );
    }
    if (niche.id === 'ecommerce') {
      suggestions.push(
        'Highlight bestsellers',
        'Add trust badges',
        'Update product descriptions',
      );
    }
  }

  return suggestions.slice(0, 8);
}

// ============================================================================
// Exports
// ============================================================================

export default {
  parseEditCommand,
  executeEditCommand,
  pushToUndoStack,
  undo,
  redo,
  generateEditSuggestions,
};
