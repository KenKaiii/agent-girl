/**
 * AI Component Generator API
 *
 * Generates React/Astro/Vue components from natural language descriptions.
 * Similar to Lovable.dev and Bolt.new component generation capabilities.
 */

import { z } from 'zod';
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

// ============================================================================
// Types & Schemas
// ============================================================================

const ComponentRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  framework: z.enum(['react', 'astro', 'vue', 'svelte']).default('react'),
  styling: z.enum(['tailwind', 'css', 'styled-components', 'css-modules']).default('tailwind'),
  typescript: z.boolean().default(true),
  projectPath: z.string().optional(),
  includeTests: z.boolean().default(false),
  includeStories: z.boolean().default(false),
});

type ComponentRequest = z.infer<typeof ComponentRequestSchema>;

interface ComponentResult {
  success: boolean;
  component: {
    name: string;
    path: string;
    code: string;
    props: Array<{ name: string; type: string; required: boolean }>;
    preview?: string;
  };
  tests?: string;
  stories?: string;
  error?: string;
}

// ============================================================================
// Component Templates
// ============================================================================

const COMPONENT_TEMPLATES = {
  react: {
    functional: (name: string, props: string[], typescript: boolean) => {
      const ext = typescript ? 'tsx' : 'jsx';
      const propsType = typescript
        ? `interface ${name}Props {\n${props.map(p => `  ${p}: string;`).join('\n')}\n}`
        : '';
      const propsParam = typescript ? `props: ${name}Props` : 'props';

      return {
        ext,
        code: `${typescript ? propsType + '\n\n' : ''}export function ${name}(${propsParam}) {
  return (
    <div className="${name.toLowerCase()}">
      {/* Component content */}
    </div>
  );
}

export default ${name};
`
      };
    }
  },

  astro: {
    component: (name: string, props: string[]) => ({
      ext: 'astro',
      code: `---
interface Props {
${props.map(p => `  ${p}: string;`).join('\n')}
}

const { ${props.join(', ')} } = Astro.props;
---

<div class="${name.toLowerCase()}">
  <!-- Component content -->
</div>

<style>
  .${name.toLowerCase()} {
    /* Styles */
  }
</style>
`
    })
  },

  vue: {
    sfc: (name: string, props: string[], typescript: boolean) => ({
      ext: 'vue',
      code: `<script setup${typescript ? ' lang="ts"' : ''}>
${typescript ? `interface Props {\n${props.map(p => `  ${p}: string`).join('\n')}\n}\n` : ''}
defineProps<${typescript ? 'Props' : `{ ${props.map(p => `${p}: String`).join(', ')} }`}>()
</script>

<template>
  <div class="${name.toLowerCase()}">
    <!-- Component content -->
  </div>
</template>

<style scoped>
.${name.toLowerCase()} {
  /* Styles */
}
</style>
`
    })
  },

  svelte: {
    component: (name: string, props: string[], typescript: boolean) => ({
      ext: 'svelte',
      code: `<script${typescript ? ' lang="ts"' : ''}>
${props.map(p => `  export let ${p}${typescript ? ': string' : ''};`).join('\n')}
</script>

<div class="${name.toLowerCase()}">
  <!-- Component content -->
</div>

<style>
  .${name.toLowerCase()} {
    /* Styles */
  }
</style>
`
    })
  }
};

// ============================================================================
// AI Prompt Generation
// ============================================================================

function generateComponentPrompt(request: ComponentRequest): string {
  return `Generate a ${request.framework} component with the following specifications:

**Component Name:** ${request.name}
**Description:** ${request.description}
**Styling:** ${request.styling}
**TypeScript:** ${request.typescript ? 'Yes' : 'No'}

Requirements:
1. Create a well-structured, reusable component
2. Use ${request.styling} for styling
3. Include proper TypeScript types if enabled
4. Follow ${request.framework} best practices
5. Make it accessible (ARIA labels, semantic HTML)
6. Add helpful comments

Output Format:
Return ONLY the component code, no explanations.
Start with imports, then the component, then exports.

${request.styling === 'tailwind' ? 'Use Tailwind CSS classes for all styling.' : ''}
${request.includeTests ? 'Also generate a test file using Vitest.' : ''}
${request.includeStories ? 'Also generate a Storybook story file.' : ''}
`;
}

// ============================================================================
// Component Library
// ============================================================================

const PRESET_COMPONENTS = {
  // UI Components
  'Button': {
    description: 'Customizable button with variants (primary, secondary, outline, ghost)',
    props: ['variant', 'size', 'disabled', 'loading', 'children'],
    category: 'ui'
  },
  'Card': {
    description: 'Content card with header, body, and footer sections',
    props: ['title', 'description', 'image', 'footer'],
    category: 'ui'
  },
  'Modal': {
    description: 'Accessible modal dialog with backdrop and close button',
    props: ['isOpen', 'onClose', 'title', 'children'],
    category: 'ui'
  },
  'Dropdown': {
    description: 'Dropdown menu with keyboard navigation',
    props: ['trigger', 'items', 'onSelect'],
    category: 'ui'
  },
  'Toast': {
    description: 'Notification toast with variants (success, error, info, warning)',
    props: ['message', 'variant', 'duration', 'onClose'],
    category: 'ui'
  },

  // Layout Components
  'Hero': {
    description: 'Full-width hero section with title, subtitle, and CTA',
    props: ['title', 'subtitle', 'ctaText', 'ctaLink', 'backgroundImage'],
    category: 'layout'
  },
  'Navbar': {
    description: 'Responsive navigation bar with logo and links',
    props: ['logo', 'links', 'sticky'],
    category: 'layout'
  },
  'Footer': {
    description: 'Website footer with columns and social links',
    props: ['columns', 'socialLinks', 'copyright'],
    category: 'layout'
  },
  'Sidebar': {
    description: 'Collapsible sidebar navigation',
    props: ['items', 'isOpen', 'onToggle'],
    category: 'layout'
  },

  // Form Components
  'Input': {
    description: 'Text input with label, validation, and error states',
    props: ['label', 'value', 'onChange', 'error', 'placeholder'],
    category: 'form'
  },
  'Select': {
    description: 'Dropdown select with search and multi-select support',
    props: ['options', 'value', 'onChange', 'multiple', 'searchable'],
    category: 'form'
  },
  'Checkbox': {
    description: 'Checkbox with label and indeterminate state',
    props: ['label', 'checked', 'onChange', 'indeterminate'],
    category: 'form'
  },
  'Form': {
    description: 'Form wrapper with validation and submission handling',
    props: ['onSubmit', 'children', 'validationSchema'],
    category: 'form'
  },

  // Data Display
  'Table': {
    description: 'Data table with sorting, filtering, and pagination',
    props: ['columns', 'data', 'sortable', 'filterable', 'paginated'],
    category: 'data'
  },
  'Avatar': {
    description: 'User avatar with fallback and status indicator',
    props: ['src', 'alt', 'size', 'status', 'fallback'],
    category: 'data'
  },
  'Badge': {
    description: 'Status badge with color variants',
    props: ['label', 'variant', 'size'],
    category: 'data'
  },
  'Skeleton': {
    description: 'Loading skeleton placeholder',
    props: ['width', 'height', 'variant'],
    category: 'data'
  },

  // Marketing
  'Pricing': {
    description: 'Pricing card with features list and CTA',
    props: ['title', 'price', 'period', 'features', 'ctaText', 'popular'],
    category: 'marketing'
  },
  'Testimonial': {
    description: 'Customer testimonial with avatar and quote',
    props: ['quote', 'author', 'role', 'avatar', 'company'],
    category: 'marketing'
  },
  'Features': {
    description: 'Features grid with icons and descriptions',
    props: ['features', 'columns'],
    category: 'marketing'
  },
  'CTA': {
    description: 'Call-to-action section with background',
    props: ['title', 'description', 'primaryAction', 'secondaryAction'],
    category: 'marketing'
  }
};

// ============================================================================
// Component Generator
// ============================================================================

async function generateComponent(request: ComponentRequest): Promise<ComponentResult> {
  const { name, framework, typescript, styling, includeTests, includeStories } = request;

  // Check if it's a preset component
  const preset = PRESET_COMPONENTS[name as keyof typeof PRESET_COMPONENTS];
  const props = preset?.props || ['className'];

  // Generate base component from template
  let template;
  switch (framework) {
    case 'react':
      template = COMPONENT_TEMPLATES.react.functional(name, props, typescript);
      break;
    case 'astro':
      template = COMPONENT_TEMPLATES.astro.component(name, props);
      break;
    case 'vue':
      template = COMPONENT_TEMPLATES.vue.sfc(name, props, typescript);
      break;
    case 'svelte':
      template = COMPONENT_TEMPLATES.svelte.component(name, props, typescript);
      break;
    default:
      template = COMPONENT_TEMPLATES.react.functional(name, props, typescript);
  }

  // Generate Tailwind-styled component
  const styledCode = addTailwindStyles(template.code, name, request.description);

  // Build component path
  const componentPath = request.projectPath
    ? join(request.projectPath, 'src', 'components', `${name}.${template.ext}`)
    : `${name}.${template.ext}`;

  // Generate tests if requested
  let tests: string | undefined;
  if (includeTests) {
    tests = generateTests(name, framework, typescript);
  }

  // Generate stories if requested
  let stories: string | undefined;
  if (includeStories) {
    stories = generateStories(name, framework, typescript);
  }

  return {
    success: true,
    component: {
      name,
      path: componentPath,
      code: styledCode,
      props: props.map(p => ({ name: p, type: 'string', required: false })),
      preview: generatePreviewCode(name, props)
    },
    tests,
    stories
  };
}

function addTailwindStyles(code: string, name: string, description: string): string {
  // Parse description for styling hints
  const hasCard = description.toLowerCase().includes('card');
  const hasButton = description.toLowerCase().includes('button');
  const hasForm = description.toLowerCase().includes('form') || description.toLowerCase().includes('input');
  const hasHero = description.toLowerCase().includes('hero');
  const hasNav = description.toLowerCase().includes('nav');

  // Generate appropriate Tailwind classes
  let classes = 'p-4';

  if (hasCard) {
    classes = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700';
  } else if (hasButton) {
    classes = 'px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50';
  } else if (hasForm) {
    classes = 'space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg';
  } else if (hasHero) {
    classes = 'min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white';
  } else if (hasNav) {
    classes = 'flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-sm';
  }

  // Replace placeholder classes
  return code.replace(
    new RegExp(`className="${name.toLowerCase()}"`, 'g'),
    `className="${classes}"`
  ).replace(
    new RegExp(`class="${name.toLowerCase()}"`, 'g'),
    `class="${classes}"`
  );
}

function generateTests(name: string, framework: string, typescript: boolean): string {
  const ext = typescript ? 'test.tsx' : 'test.jsx';

  if (framework === 'react') {
    return `import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
  });

  it('matches snapshot', () => {
    const { container } = render(<${name} />);
    expect(container).toMatchSnapshot();
  });

  it('applies custom className', () => {
    render(<${name} className="custom-class" />);
    const element = screen.getByRole('generic');
    expect(element).toHaveClass('custom-class');
  });
});
`;
  }

  return `// Tests for ${name} component`;
}

function generateStories(name: string, framework: string, typescript: boolean): string {
  const ext = typescript ? 'stories.tsx' : 'stories.jsx';

  if (framework === 'react') {
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithProps: Story = {
  args: {
    // Add default props here
  },
};
`;
  }

  return `// Storybook stories for ${name} component`;
}

function generatePreviewCode(name: string, props: string[]): string {
  const propsString = props.slice(0, 3).map(p => `${p}="example"`).join(' ');
  return `<${name} ${propsString} />`;
}

// ============================================================================
// Route Handler
// ============================================================================

export async function handleComponentRoutes(req: Request, url: URL): Promise<Response> {
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // POST /api/components/generate - Generate component from description
    if (path === '/api/components/generate' && req.method === 'POST') {
      const body = await req.json();
      const parsed = ComponentRequestSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Invalid request',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await generateComponent(parsed.data);

      // Save to file if projectPath provided
      if (parsed.data.projectPath && result.success) {
        const dir = dirname(result.component.path);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(result.component.path, result.component.code, 'utf-8');

        if (result.tests) {
          const testPath = result.component.path.replace(/\.(tsx?|jsx?)$/, '.test.$1');
          writeFileSync(testPath, result.tests, 'utf-8');
        }

        if (result.stories) {
          const storyPath = result.component.path.replace(/\.(tsx?|jsx?)$/, '.stories.$1');
          writeFileSync(storyPath, result.stories, 'utf-8');
        }
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders
      });
    }

    // GET /api/components/presets - List preset components
    if (path === '/api/components/presets' && req.method === 'GET') {
      const category = url.searchParams.get('category');

      let presets = Object.entries(PRESET_COMPONENTS).map(([name, data]) => ({
        name,
        ...data
      }));

      if (category) {
        presets = presets.filter(p => p.category === category);
      }

      // Group by category
      const grouped = presets.reduce((acc, preset) => {
        if (!acc[preset.category]) {
          acc[preset.category] = [];
        }
        acc[preset.category].push(preset);
        return acc;
      }, {} as Record<string, typeof presets>);

      return new Response(JSON.stringify({
        categories: Object.keys(grouped),
        presets: grouped,
        total: presets.length
      }), { status: 200, headers: corsHeaders });
    }

    // GET /api/components/list - List components in project
    if (path === '/api/components/list' && req.method === 'GET') {
      const projectPath = url.searchParams.get('projectPath');

      if (!projectPath) {
        return new Response(JSON.stringify({
          error: 'projectPath query parameter required'
        }), { status: 400, headers: corsHeaders });
      }

      const componentsDir = join(projectPath, 'src', 'components');

      if (!existsSync(componentsDir)) {
        return new Response(JSON.stringify({
          components: [],
          message: 'No components directory found'
        }), { status: 200, headers: corsHeaders });
      }

      const files = readdirSync(componentsDir, { withFileTypes: true });
      const components = files
        .filter(f => f.isFile() && /\.(tsx?|jsx?|vue|svelte|astro)$/.test(f.name))
        .map(f => {
          const fullPath = join(componentsDir, f.name);
          const content = readFileSync(fullPath, 'utf-8');
          const name = f.name.replace(/\.(tsx?|jsx?|vue|svelte|astro)$/, '');

          return {
            name,
            path: fullPath,
            framework: detectFramework(f.name),
            lines: content.split('\n').length
          };
        });

      return new Response(JSON.stringify({
        components,
        total: components.length
      }), { status: 200, headers: corsHeaders });
    }

    // POST /api/components/preview - Generate preview HTML
    if (path === '/api/components/preview' && req.method === 'POST') {
      const { code, framework } = await req.json();

      const previewHtml = generatePreviewHtml(code, framework);

      return new Response(JSON.stringify({
        html: previewHtml
      }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      error: 'Not found',
      availableEndpoints: [
        'POST /api/components/generate',
        'GET /api/components/presets',
        'GET /api/components/list?projectPath=...',
        'POST /api/components/preview'
      ]
    }), { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Component API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: corsHeaders });
  }
}

function detectFramework(filename: string): string {
  if (filename.endsWith('.astro')) return 'astro';
  if (filename.endsWith('.vue')) return 'vue';
  if (filename.endsWith('.svelte')) return 'svelte';
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) return 'react';
  return 'unknown';
}

function generatePreviewHtml(code: string, framework: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="p-8 bg-gray-100 dark:bg-gray-900">
  <div id="preview" class="max-w-2xl mx-auto">
    <!-- Component renders here -->
    <pre class="bg-white dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
<code>${escapeHtml(code)}</code>
    </pre>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
