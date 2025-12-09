/**
 * Smart 100-Step Decomposition System
 * Intelligent task breakdown for premium website building
 */

import { getNiche, type NicheConfig } from '../../presets/niches';
import { getDesignSystem, type DesignSystem } from '../../presets/design-systems';

// Types
export interface WebsiteProject {
  id: string;
  businessDescription: string;
  nicheId: string;
  designSystemId: string;
  hasExistingContent: boolean;
  features: string[];
  pages: string[];
  integrations: string[];
}

export interface DecompositionStep {
  id: number;
  phase: Phase;
  name: string;
  description: string;
  prompt: string; // The actual prompt to send to AI
  estimatedTokens: number;
  dependencies: number[]; // Step IDs that must complete first
  canParallelize: boolean;
  outputs: string[]; // Expected file outputs
  validationChecks: string[];
  retryStrategy: 'simple' | 'escalate' | 'skip';
  maxRetries: number;
}

export interface DecompositionPlan {
  projectId: string;
  totalSteps: number;
  estimatedDuration: string; // e.g., "25-30 minutes"
  estimatedCost: string; // e.g., "$15-25"
  phases: PhaseInfo[];
  steps: DecompositionStep[];
}

export interface PhaseInfo {
  id: Phase;
  name: string;
  description: string;
  stepRange: [number, number];
  canParallelize: boolean;
}

export type Phase =
  | 'foundation'
  | 'components'
  | 'sections'
  | 'pages'
  | 'content'
  | 'images'
  | 'seo'
  | 'integrations'
  | 'validation'
  | 'delivery';

// Phase configurations
const PHASES: Record<Phase, { name: string; description: string; canParallelize: boolean }> = {
  foundation: {
    name: 'Foundation',
    description: 'Project setup, design tokens, base configuration',
    canParallelize: false,
  },
  components: {
    name: 'Component Library',
    description: 'Reusable UI components (Button, Card, Input, etc.)',
    canParallelize: true,
  },
  sections: {
    name: 'Section Templates',
    description: 'Page sections (Hero, Features, Testimonials, etc.)',
    canParallelize: true,
  },
  pages: {
    name: 'Page Assembly',
    description: 'Complete pages combining sections',
    canParallelize: true,
  },
  content: {
    name: 'Content Generation',
    description: 'AI-generated text content',
    canParallelize: true,
  },
  images: {
    name: 'Image Pipeline',
    description: 'AI image generation and optimization',
    canParallelize: true,
  },
  seo: {
    name: 'SEO & Performance',
    description: 'Meta tags, schema, performance optimization',
    canParallelize: true,
  },
  integrations: {
    name: 'Integrations',
    description: 'Forms, analytics, third-party services',
    canParallelize: true,
  },
  validation: {
    name: 'Validation',
    description: 'Testing, audits, quality checks',
    canParallelize: false,
  },
  delivery: {
    name: 'Delivery',
    description: 'Build, export, deployment',
    canParallelize: false,
  },
};

/**
 * Generate a complete decomposition plan for a website project
 */
export function generateDecompositionPlan(project: WebsiteProject): DecompositionPlan {
  const niche = getNiche(project.nicheId);
  const designSystem = getDesignSystem(project.designSystemId);

  if (!niche || !designSystem) {
    throw new Error('Invalid niche or design system');
  }

  const steps: DecompositionStep[] = [];
  let stepId = 1;

  // Phase A: Foundation (Steps 1-8)
  const foundationSteps = generateFoundationSteps(project, niche, designSystem, stepId);
  steps.push(...foundationSteps);
  stepId += foundationSteps.length;

  // Phase B: Components (Steps 9-18)
  const componentSteps = generateComponentSteps(project, designSystem, stepId);
  steps.push(...componentSteps);
  stepId += componentSteps.length;

  // Phase C: Sections (Steps 19-35)
  const sectionSteps = generateSectionSteps(project, niche, designSystem, stepId);
  steps.push(...sectionSteps);
  stepId += sectionSteps.length;

  // Phase D: Pages (Steps 36-45)
  const pageSteps = generatePageSteps(project, niche, stepId);
  steps.push(...pageSteps);
  stepId += pageSteps.length;

  // Phase E: Content (Steps 46-58)
  const contentSteps = generateContentSteps(project, niche, stepId);
  steps.push(...contentSteps);
  stepId += contentSteps.length;

  // Phase F: Images (Steps 59-70)
  const imageSteps = generateImageSteps(project, niche, stepId);
  steps.push(...imageSteps);
  stepId += imageSteps.length;

  // Phase G: SEO (Steps 71-80)
  const seoSteps = generateSEOSteps(project, niche, stepId);
  steps.push(...seoSteps);
  stepId += seoSteps.length;

  // Phase H: Integrations (Steps 81-88)
  const integrationSteps = generateIntegrationSteps(project, niche, stepId);
  steps.push(...integrationSteps);
  stepId += integrationSteps.length;

  // Phase I: Validation (Steps 89-95)
  const validationSteps = generateValidationSteps(project, stepId);
  steps.push(...validationSteps);
  stepId += validationSteps.length;

  // Phase J: Delivery (Steps 96-100)
  const deliverySteps = generateDeliverySteps(project, stepId);
  steps.push(...deliverySteps);

  // Calculate phases info
  const phases = calculatePhaseInfo(steps);

  // Estimate duration and cost
  const totalTokens = steps.reduce((sum, s) => sum + s.estimatedTokens, 0);
  const estimatedDuration = estimateDuration(steps);
  const estimatedCost = estimateCost(totalTokens);

  return {
    projectId: project.id,
    totalSteps: steps.length,
    estimatedDuration,
    estimatedCost,
    phases,
    steps,
  };
}

/**
 * Foundation phase steps
 */
function generateFoundationSteps(
  project: WebsiteProject,
  niche: NicheConfig,
  designSystem: DesignSystem,
  startId: number
): DecompositionStep[] {
  return [
    {
      id: startId,
      phase: 'foundation',
      name: 'Create Astro Project',
      description: 'Initialize new Astro project with TypeScript',
      prompt: `Create a new Astro project for a ${niche.name} website.
Use: npm create astro@latest ${project.id} -- --template minimal --typescript strict
Then cd into the project.`,
      estimatedTokens: 500,
      dependencies: [],
      canParallelize: false,
      outputs: ['package.json', 'astro.config.mjs', 'tsconfig.json'],
      validationChecks: ['package.json exists', 'astro.config.mjs exists'],
      retryStrategy: 'simple',
      maxRetries: 3,
    },
    {
      id: startId + 1,
      phase: 'foundation',
      name: 'Install Dependencies',
      description: 'Install Tailwind, Astro integrations, and utilities',
      prompt: `Install required dependencies:
bun add @astrojs/tailwind @astrojs/sitemap @astrojs/mdx
bun add -D tailwindcss postcss autoprefixer
bun add clsx tailwind-merge lucide-astro`,
      estimatedTokens: 300,
      dependencies: [startId],
      canParallelize: false,
      outputs: ['node_modules/', 'bun.lockb'],
      validationChecks: ['node_modules exists'],
      retryStrategy: 'simple',
      maxRetries: 3,
    },
    {
      id: startId + 2,
      phase: 'foundation',
      name: 'Configure Tailwind with Design System',
      description: 'Setup Tailwind with custom design tokens',
      prompt: `Create tailwind.config.mjs with the "${designSystem.name}" design system:

Colors:
- Primary: ${designSystem.colors.primary}
- Secondary: ${designSystem.colors.secondary}
- Background: ${designSystem.colors.background}
- Text: ${designSystem.colors.text}

Fonts:
- Heading: ${designSystem.fonts.heading}
- Body: ${designSystem.fonts.body}

Border radius: ${designSystem.borderRadius.md}
Include all color shades (50-900) for primary.`,
      estimatedTokens: 800,
      dependencies: [startId + 1],
      canParallelize: false,
      outputs: ['tailwind.config.mjs', 'postcss.config.mjs'],
      validationChecks: ['tailwind.config.mjs has design tokens'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 3,
      phase: 'foundation',
      name: 'Create Base Layout',
      description: 'Main layout with head, navigation, footer slots',
      prompt: `Create src/layouts/Layout.astro with:
- HTML5 structure
- Meta viewport, charset
- Slot for page content
- Import global styles
- Google Fonts: ${designSystem.fonts.heading}, ${designSystem.fonts.body}
- Props: title, description, ogImage`,
      estimatedTokens: 600,
      dependencies: [startId + 2],
      canParallelize: false,
      outputs: ['src/layouts/Layout.astro'],
      validationChecks: ['Layout.astro exports default'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 4,
      phase: 'foundation',
      name: 'Create Global Styles',
      description: 'CSS variables and base styles',
      prompt: `Create src/styles/global.css with:
- CSS custom properties from design system
- Base typography styles
- Smooth scrolling
- Focus states for accessibility
- Tailwind directives (@tailwind base, components, utilities)`,
      estimatedTokens: 500,
      dependencies: [startId + 2],
      canParallelize: true,
      outputs: ['src/styles/global.css'],
      validationChecks: ['global.css has CSS variables'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 5,
      phase: 'foundation',
      name: 'Create Navigation Component',
      description: 'Responsive header with mobile menu',
      prompt: `Create src/components/Navigation.astro:
- Logo/brand on left
- Navigation links: ${niche.sections.required.slice(0, 5).map(s => s.name).join(', ')}
- Mobile hamburger menu with slide-out
- Sticky on scroll
- Using ${designSystem.name} design system colors`,
      estimatedTokens: 1200,
      dependencies: [startId + 3],
      canParallelize: false,
      outputs: ['src/components/Navigation.astro'],
      validationChecks: ['Navigation has mobile menu'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 6,
      phase: 'foundation',
      name: 'Create Footer Component',
      description: 'Footer with links, contact, social',
      prompt: `Create src/components/Footer.astro:
- Multi-column layout (responsive)
- Quick links section
- Contact information
- Social media icons
- Copyright with current year
- ${niche.legalRequirements?.join(', ') || 'Impressum, Datenschutz'} links`,
      estimatedTokens: 800,
      dependencies: [startId + 3],
      canParallelize: true,
      outputs: ['src/components/Footer.astro'],
      validationChecks: ['Footer has legal links'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 7,
      phase: 'foundation',
      name: 'Configure Astro Integrations',
      description: 'Setup sitemap, MDX, image optimization',
      prompt: `Update astro.config.mjs:
- Add @astrojs/tailwind integration
- Add @astrojs/sitemap with site URL placeholder
- Configure image optimization
- Set output to 'static'
- Add redirects if needed`,
      estimatedTokens: 400,
      dependencies: [startId + 1],
      canParallelize: true,
      outputs: ['astro.config.mjs'],
      validationChecks: ['astro.config.mjs has integrations'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
  ];
}

/**
 * Component library steps
 */
function generateComponentSteps(
  project: WebsiteProject,
  designSystem: DesignSystem,
  startId: number
): DecompositionStep[] {
  const components = [
    { name: 'Button', variants: ['primary', 'secondary', 'outline', 'ghost'] },
    { name: 'Card', variants: ['default', 'hover', 'featured'] },
    { name: 'Badge', variants: ['default', 'success', 'warning', 'error'] },
    { name: 'Input', variants: ['text', 'email', 'textarea'] },
    { name: 'Container', variants: ['default', 'narrow', 'wide'] },
    { name: 'Section', variants: ['default', 'alternate', 'dark'] },
    { name: 'Heading', variants: ['h1', 'h2', 'h3', 'h4'] },
    { name: 'Icon', variants: ['inline', 'block', 'button'] },
  ];

  return components.map((comp, index) => ({
    id: startId + index,
    phase: 'components' as Phase,
    name: `Create ${comp.name} Component`,
    description: `Reusable ${comp.name} with variants`,
    prompt: `Create src/components/ui/${comp.name}.astro:
- Variants: ${comp.variants.join(', ')}
- Props interface with TypeScript
- Using design system: ${designSystem.name}
- Primary color: ${designSystem.colors.primary}
- Border radius: ${designSystem.borderRadius.md}
- Include hover/focus states
- Accessible (ARIA attributes if needed)`,
    estimatedTokens: 600,
    dependencies: [startId - 1], // Depends on foundation
    canParallelize: true,
    outputs: [`src/components/ui/${comp.name}.astro`],
    validationChecks: [`${comp.name}.astro has Props interface`],
    retryStrategy: 'simple' as const,
    maxRetries: 2,
  }));
}

/**
 * Section template steps
 */
function generateSectionSteps(
  project: WebsiteProject,
  niche: NicheConfig,
  designSystem: DesignSystem,
  startId: number
): DecompositionStep[] {
  const allSections = [...niche.sections.required, ...niche.sections.optional.slice(0, 5)];

  return allSections.map((section, index) => ({
    id: startId + index,
    phase: 'sections' as Phase,
    name: `Create ${section.name} Section`,
    description: section.description,
    prompt: `Create src/components/sections/${section.id}.astro:
- ${section.description}
- Variants: ${section.variants?.slice(0, 3).join(', ') || 'default'}
- Design system: ${designSystem.name}
- Mobile-first responsive
- Props for all customizable content
- Using Container and Section components
- Smooth scroll anchor: #${section.id}

For ${niche.name} niche, focus on: ${niche.contentPrompts.services}`,
    estimatedTokens: 1000,
    dependencies: [startId - 1], // Depends on components
    canParallelize: true,
    outputs: [`src/components/sections/${section.id}.astro`],
    validationChecks: [`${section.id}.astro is responsive`],
    retryStrategy: 'simple' as const,
    maxRetries: 2,
  }));
}

/**
 * Page assembly steps
 */
function generatePageSteps(
  project: WebsiteProject,
  niche: NicheConfig,
  startId: number
): DecompositionStep[] {
  const pages = [
    { name: 'index', title: 'Homepage', sections: niche.sections.required.map(s => s.id) },
    { name: 'about', title: 'About', sections: ['hero', 'about', 'team', 'cta'] },
    { name: 'services', title: 'Services', sections: ['hero', 'features', 'pricing', 'faq', 'cta'] },
    { name: 'contact', title: 'Contact', sections: ['hero', 'contact', 'location', 'faq'] },
    { name: 'impressum', title: 'Impressum', sections: [] },
    { name: 'datenschutz', title: 'Datenschutz', sections: [] },
    { name: '404', title: '404 Not Found', sections: [] },
  ];

  return pages.map((page, index) => ({
    id: startId + index,
    phase: 'pages' as Phase,
    name: `Create ${page.title} Page`,
    description: `Assemble ${page.name}.astro page`,
    prompt: `Create src/pages/${page.name}.astro:
- Title: "${page.title} | ${project.businessDescription}"
- Use Layout component
- ${page.sections.length > 0
      ? `Include sections in order: ${page.sections.join(' → ')}`
      : `Create appropriate content for ${page.title}`
    }
- Add meta description
- Proper heading hierarchy`,
    estimatedTokens: 600,
    dependencies: [startId - 1], // Depends on sections
    canParallelize: true,
    outputs: [`src/pages/${page.name}.astro`],
    validationChecks: [`${page.name}.astro uses Layout`],
    retryStrategy: 'simple' as const,
    maxRetries: 2,
  }));
}

/**
 * Content generation steps
 */
function generateContentSteps(
  project: WebsiteProject,
  niche: NicheConfig,
  startId: number
): DecompositionStep[] {
  const contentTypes = [
    { type: 'hero', prompt: niche.contentPrompts.hero },
    { type: 'about', prompt: niche.contentPrompts.about },
    { type: 'services', prompt: niche.contentPrompts.services },
    { type: 'cta', prompt: niche.contentPrompts.cta },
    { type: 'testimonials', prompt: 'Generate 3-5 realistic testimonials with names, roles, and quotes' },
    { type: 'faq', prompt: 'Generate 5-8 frequently asked questions with detailed answers' },
    { type: 'meta', prompt: 'Generate SEO-optimized meta titles and descriptions for all pages' },
  ];

  return contentTypes.map((content, index) => ({
    id: startId + index,
    phase: 'content' as Phase,
    name: `Generate ${content.type} Content`,
    description: `AI-generated ${content.type} text`,
    prompt: `Generate content for ${content.type}:
Business: ${project.businessDescription}
Niche: ${niche.name}
Tone: Professional, trustworthy, engaging

Guidelines: ${content.prompt}

Output as JSON that can be imported into components.
Include German and English versions if applicable.`,
    estimatedTokens: 800,
    dependencies: [],
    canParallelize: true,
    outputs: [`src/content/${content.type}.json`],
    validationChecks: [`${content.type}.json is valid JSON`],
    retryStrategy: 'simple' as const,
    maxRetries: 2,
  }));
}

/**
 * Image generation steps
 */
function generateImageSteps(
  project: WebsiteProject,
  niche: NicheConfig,
  startId: number
): DecompositionStep[] {
  const imageTypes = [
    { type: 'hero', prompt: niche.imagePrompts.hero, count: 1 },
    { type: 'features', prompt: niche.imagePrompts.features, count: 6 },
    { type: 'team', prompt: niche.imagePrompts.team, count: 4 },
    { type: 'testimonials', prompt: 'Professional headshots, diverse, friendly', count: 5 },
    { type: 'gallery', prompt: niche.imagePrompts.background, count: 6 },
    { type: 'background', prompt: niche.imagePrompts.background, count: 2 },
  ];

  const steps: DecompositionStep[] = [];

  imageTypes.forEach((img, index) => {
    // Generation step
    steps.push({
      id: startId + index * 2,
      phase: 'images',
      name: `Generate ${img.type} Images`,
      description: `AI-generate ${img.count} ${img.type} images`,
      prompt: `Generate ${img.count} images for ${img.type}:
Style: ${img.prompt}
Business: ${project.businessDescription}
Use AI image generation (DALL-E 3 or Flux)
Save to public/images/${img.type}/`,
      estimatedTokens: 200,
      dependencies: [],
      canParallelize: true,
      outputs: [`public/images/${img.type}/`],
      validationChecks: [`${img.type} images exist`],
      retryStrategy: 'escalate',
      maxRetries: 3,
    });

    // Optimization step
    steps.push({
      id: startId + index * 2 + 1,
      phase: 'images',
      name: `Optimize ${img.type} Images`,
      description: `AVIF/WebP conversion, responsive variants`,
      prompt: `Process images in public/images/${img.type}/:
1. Remove any watermarks
2. Convert to AVIF and WebP
3. Generate responsive variants (480w, 800w, 1200w, 1920w)
4. Extract metadata (dimensions, dominant color)
5. Generate Astro Image components`,
      estimatedTokens: 100,
      dependencies: [startId + index * 2],
      canParallelize: true,
      outputs: [`public/images/${img.type}/*.avif`, `public/images/${img.type}/*.webp`],
      validationChecks: [`${img.type} has WebP versions`],
      retryStrategy: 'simple',
      maxRetries: 2,
    });
  });

  return steps;
}

/**
 * SEO and performance steps
 */
function generateSEOSteps(
  project: WebsiteProject,
  niche: NicheConfig,
  startId: number
): DecompositionStep[] {
  return [
    {
      id: startId,
      phase: 'seo',
      name: 'Generate Meta Tags',
      description: 'Page-level meta tags for SEO',
      prompt: `Create src/components/SEO.astro component:
- Title template: "{pageTitle} | ${project.businessDescription}"
- Meta description (150-160 chars)
- Canonical URL
- Viewport meta
- Language (de-DE)`,
      estimatedTokens: 500,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/components/SEO.astro'],
      validationChecks: ['SEO.astro has all meta tags'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 1,
      phase: 'seo',
      name: 'Generate Open Graph Tags',
      description: 'Social media sharing optimization',
      prompt: `Add to SEO.astro:
- og:title, og:description, og:image
- og:type (website)
- og:url
- Twitter card meta tags
- Default OG image generation`,
      estimatedTokens: 400,
      dependencies: [startId],
      canParallelize: false,
      outputs: ['src/components/SEO.astro'],
      validationChecks: ['SEO.astro has OG tags'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 2,
      phase: 'seo',
      name: 'Generate JSON-LD Schema',
      description: `${niche.seo.schema} structured data`,
      prompt: `Create src/components/Schema.astro:
- Schema.org type: ${niche.seo.schema}
- Include: name, description, url, logo
- ${niche.seo.localSEO ? 'Add LocalBusiness properties: address, phone, hours' : ''}
- Add BreadcrumbList for navigation
- Add FAQPage schema for FAQ section`,
      estimatedTokens: 600,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/components/Schema.astro'],
      validationChecks: ['Schema.astro has valid JSON-LD'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 3,
      phase: 'seo',
      name: 'Create Sitemap',
      description: 'XML sitemap for search engines',
      prompt: `Configure @astrojs/sitemap:
- Include all pages
- Set changefreq and priority
- Exclude admin/private pages
- Generate sitemap.xml on build`,
      estimatedTokens: 300,
      dependencies: [],
      canParallelize: true,
      outputs: ['astro.config.mjs'],
      validationChecks: ['sitemap integration configured'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 4,
      phase: 'seo',
      name: 'Create Robots.txt',
      description: 'Search engine crawling rules',
      prompt: `Create public/robots.txt:
- Allow all crawlers
- Disallow /admin, /api if present
- Reference sitemap.xml
- Add crawl-delay if needed`,
      estimatedTokens: 200,
      dependencies: [],
      canParallelize: true,
      outputs: ['public/robots.txt'],
      validationChecks: ['robots.txt exists'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 5,
      phase: 'seo',
      name: 'Performance: Critical CSS',
      description: 'Inline critical CSS for faster FCP',
      prompt: `Optimize CSS loading:
- Identify critical above-fold CSS
- Inline in <head>
- Defer non-critical CSS
- Use font-display: swap`,
      estimatedTokens: 400,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/layouts/Layout.astro'],
      validationChecks: ['Layout has critical CSS'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 6,
      phase: 'seo',
      name: 'Performance: Script Optimization',
      description: 'Defer/async scripts, code splitting',
      prompt: `Optimize JavaScript:
- Add defer to non-critical scripts
- Lazy load below-fold components
- Use dynamic imports for heavy features
- Preconnect to external domains`,
      estimatedTokens: 400,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/layouts/Layout.astro'],
      validationChecks: ['Scripts are deferred'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 7,
      phase: 'seo',
      name: 'Performance: Image Optimization',
      description: 'Lazy loading, srcset, blur placeholders',
      prompt: `Ensure all images have:
- loading="lazy" (except hero)
- width and height attributes
- srcset for responsive images
- Blur placeholder or dominant color
- Use Astro Image component`,
      estimatedTokens: 400,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/components/sections/*.astro'],
      validationChecks: ['Images have lazy loading'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 8,
      phase: 'seo',
      name: 'Accessibility: ARIA & Focus',
      description: 'Keyboard navigation, screen reader support',
      prompt: `Add accessibility features:
- ARIA labels on interactive elements
- Focus visible states
- Skip to content link
- Proper heading hierarchy
- Alt text on all images
- Color contrast check (WCAG AA)`,
      estimatedTokens: 500,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/components/*.astro'],
      validationChecks: ['Components have ARIA labels'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
  ];
}

/**
 * Integration steps
 */
function generateIntegrationSteps(
  project: WebsiteProject,
  niche: NicheConfig,
  startId: number
): DecompositionStep[] {
  const integrations = niche.integrations.slice(0, 5);

  const baseSteps: DecompositionStep[] = [
    {
      id: startId,
      phase: 'integrations',
      name: 'Contact Form Backend',
      description: 'Formspree or similar form handling',
      prompt: `Setup contact form:
- Create form in Contact section
- Use Formspree or Basin for backend
- Add honeypot spam protection
- Success/error states
- Email validation
- GDPR consent checkbox`,
      estimatedTokens: 600,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/components/sections/contact.astro'],
      validationChecks: ['Form has action URL'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 1,
      phase: 'integrations',
      name: 'Analytics Setup',
      description: 'GA4 or Plausible analytics',
      prompt: `Add analytics:
- Create src/components/Analytics.astro
- Support GA4 and Plausible
- Load after user consent
- Track page views
- Set up basic events`,
      estimatedTokens: 400,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/components/Analytics.astro'],
      validationChecks: ['Analytics script exists'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 2,
      phase: 'integrations',
      name: 'Cookie Consent',
      description: 'GDPR-compliant cookie banner',
      prompt: `Create cookie consent:
- src/components/CookieConsent.astro
- Categories: necessary, analytics, marketing
- Store preference in localStorage
- Block scripts until consent
- "Accept all" and "Customize" options`,
      estimatedTokens: 700,
      dependencies: [],
      canParallelize: true,
      outputs: ['src/components/CookieConsent.astro'],
      validationChecks: ['Cookie consent saves preference'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
  ];

  // Add niche-specific integrations
  const nicheSteps = integrations.map((integration, index) => ({
    id: startId + 3 + index,
    phase: 'integrations' as Phase,
    name: `Setup ${integration}`,
    description: `Integrate ${integration} service`,
    prompt: `Add ${integration} integration:
- Follow ${integration} setup documentation
- Add necessary scripts/widgets
- Configure for ${niche.name} use case
- Test functionality`,
    estimatedTokens: 400,
    dependencies: [],
    canParallelize: true,
    outputs: [`src/components/${integration.toLowerCase().replace(/\s/g, '')}.astro`],
    validationChecks: [`${integration} integration works`],
    retryStrategy: 'simple' as const,
    maxRetries: 2,
  }));

  return [...baseSteps, ...nicheSteps];
}

/**
 * Validation steps
 */
function generateValidationSteps(
  project: WebsiteProject,
  startId: number
): DecompositionStep[] {
  return [
    {
      id: startId,
      phase: 'validation',
      name: 'Build Project',
      description: 'Production build to catch errors',
      prompt: `Run production build:
bun run build

Fix any errors or warnings.
Verify dist/ folder is created.`,
      estimatedTokens: 200,
      dependencies: [],
      canParallelize: false,
      outputs: ['dist/'],
      validationChecks: ['Build succeeds without errors'],
      retryStrategy: 'escalate',
      maxRetries: 5,
    },
    {
      id: startId + 1,
      phase: 'validation',
      name: 'Lighthouse Audit',
      description: 'Performance, SEO, Accessibility scores',
      prompt: `Run Lighthouse audit:
- Performance: Target 90+
- Accessibility: Target 100
- Best Practices: Target 100
- SEO: Target 100

Fix any issues below targets.`,
      estimatedTokens: 300,
      dependencies: [startId],
      canParallelize: false,
      outputs: ['lighthouse-report.json'],
      validationChecks: ['All scores 90+'],
      retryStrategy: 'escalate',
      maxRetries: 3,
    },
    {
      id: startId + 2,
      phase: 'validation',
      name: 'Mobile Responsiveness',
      description: 'Test on mobile viewports',
      prompt: `Verify mobile responsiveness:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)

Check:
- Navigation works
- Text is readable
- Touch targets are 44px+
- No horizontal scroll`,
      estimatedTokens: 300,
      dependencies: [startId],
      canParallelize: true,
      outputs: [],
      validationChecks: ['Mobile layout works'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 3,
      phase: 'validation',
      name: 'Cross-Browser Test',
      description: 'Chrome, Safari, Firefox compatibility',
      prompt: `Test in browsers:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)

Verify:
- Layout is consistent
- Fonts load correctly
- Animations work
- Forms function`,
      estimatedTokens: 200,
      dependencies: [startId],
      canParallelize: true,
      outputs: [],
      validationChecks: ['Works in all browsers'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 4,
      phase: 'validation',
      name: 'Link Checker',
      description: 'Verify all links work',
      prompt: `Check all links:
- Internal navigation
- External links
- Social media links
- Legal page links

Fix any 404s or broken links.`,
      estimatedTokens: 200,
      dependencies: [startId],
      canParallelize: true,
      outputs: [],
      validationChecks: ['No broken links'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 5,
      phase: 'validation',
      name: 'Form Testing',
      description: 'Verify form submissions work',
      prompt: `Test contact form:
- Submit with valid data
- Verify email received
- Test validation errors
- Check success message
- Test honeypot protection`,
      estimatedTokens: 200,
      dependencies: [startId],
      canParallelize: true,
      outputs: [],
      validationChecks: ['Form submission works'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
  ];
}

/**
 * Delivery steps
 */
function generateDeliverySteps(
  project: WebsiteProject,
  startId: number
): DecompositionStep[] {
  return [
    {
      id: startId,
      phase: 'delivery',
      name: 'Final Build',
      description: 'Production-ready build',
      prompt: `Create final production build:
bun run build

Verify:
- dist/ folder complete
- All assets included
- No console errors`,
      estimatedTokens: 200,
      dependencies: [],
      canParallelize: false,
      outputs: ['dist/'],
      validationChecks: ['dist/ is complete'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 1,
      phase: 'delivery',
      name: 'Create ZIP Export',
      description: 'Downloadable project archive',
      prompt: `Create ZIP export:
- Include all source files
- Include dist/ folder
- Add README with setup instructions
- Exclude node_modules
- Name: ${project.id}-website.zip`,
      estimatedTokens: 200,
      dependencies: [startId],
      canParallelize: false,
      outputs: [`${project.id}-website.zip`],
      validationChecks: ['ZIP file created'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 2,
      phase: 'delivery',
      name: 'GitHub Repository',
      description: 'Push to GitHub repo',
      prompt: `Create GitHub repository:
- Initialize git if needed
- Create .gitignore
- Commit all files
- Push to origin
- Add README.md`,
      estimatedTokens: 300,
      dependencies: [startId],
      canParallelize: true,
      outputs: ['.git/', 'README.md'],
      validationChecks: ['Pushed to GitHub'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
    {
      id: startId + 3,
      phase: 'delivery',
      name: 'Deploy to Cloudflare',
      description: 'One-click Cloudflare Pages deployment',
      prompt: `Deploy to Cloudflare Pages:
- Connect GitHub repo
- Set build command: bun run build
- Set output directory: dist
- Configure custom domain (if provided)
- Verify deployment succeeds`,
      estimatedTokens: 300,
      dependencies: [startId + 2],
      canParallelize: false,
      outputs: [],
      validationChecks: ['Site is live'],
      retryStrategy: 'escalate',
      maxRetries: 3,
    },
    {
      id: startId + 4,
      phase: 'delivery',
      name: 'Generate Documentation',
      description: 'Edit guide for customer',
      prompt: `Create EDIT-GUIDE.md:
- How to edit content
- How to add pages
- How to update images
- How to change colors
- Contact for support

Make it non-technical and easy to follow.`,
      estimatedTokens: 500,
      dependencies: [],
      canParallelize: true,
      outputs: ['EDIT-GUIDE.md'],
      validationChecks: ['Guide is comprehensive'],
      retryStrategy: 'simple',
      maxRetries: 2,
    },
  ];
}

/**
 * Calculate phase info from steps
 */
function calculatePhaseInfo(steps: DecompositionStep[]): PhaseInfo[] {
  const phaseMap = new Map<Phase, { start: number; end: number }>();

  steps.forEach((step) => {
    const existing = phaseMap.get(step.phase);
    if (!existing) {
      phaseMap.set(step.phase, { start: step.id, end: step.id });
    } else {
      existing.end = step.id;
    }
  });

  return Array.from(phaseMap.entries()).map(([phase, range]) => ({
    id: phase,
    name: PHASES[phase].name,
    description: PHASES[phase].description,
    stepRange: [range.start, range.end] as [number, number],
    canParallelize: PHASES[phase].canParallelize,
  }));
}

/**
 * Estimate total duration
 */
function estimateDuration(steps: DecompositionStep[]): string {
  // Rough estimates based on step types
  const parallelizable = steps.filter((s) => s.canParallelize).length;
  const sequential = steps.length - parallelizable;

  // Assume 30 seconds per parallelizable step (batched), 60 seconds per sequential
  const parallelTime = Math.ceil(parallelizable / 3) * 0.5; // minutes
  const sequentialTime = sequential * 1; // minutes

  const totalMinutes = Math.round(parallelTime + sequentialTime);
  const minTime = Math.max(15, totalMinutes - 5);
  const maxTime = totalMinutes + 10;

  return `${minTime}-${maxTime} minutes`;
}

/**
 * Estimate total cost
 */
function estimateCost(totalTokens: number): string {
  // Assuming Haiku pricing: ~$0.25 per 1M input, $1.25 per 1M output
  // Average 2:1 output:input ratio
  const inputCost = (totalTokens * 0.25) / 1_000_000;
  const outputCost = (totalTokens * 2 * 1.25) / 1_000_000;
  const totalCost = inputCost + outputCost;

  const minCost = Math.max(5, Math.floor(totalCost * 0.8));
  const maxCost = Math.ceil(totalCost * 1.5);

  return `$${minCost}-${maxCost}`;
}

export default {
  generateDecompositionPlan,
};
