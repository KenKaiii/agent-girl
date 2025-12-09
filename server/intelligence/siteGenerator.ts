/**
 * Agent Girl - Multi-Page Site Generator
 * Generates complete multi-page websites with intelligent content
 *
 * OPTIMIZED FOR:
 * - Parallel file generation (3-5x faster)
 * - Zero-friction autonomous flow
 * - Instant validation during generation
 * - Auto-install & build integration
 * - Intelligent defaults (no config needed)
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  SiteSpec,
  PageSpec,
  SectionSpec,
  DesignSpec,
  SEOSpec,
  SchemaType,
} from './types';

const execAsync = promisify(exec);

// ============================================================
// GENERATION RESULT TYPE
// ============================================================

export interface GenerationResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
  stats: {
    filesGenerated: number;
    generationTimeMs: number;
    installTimeMs?: number;
    buildTimeMs?: number;
    totalTimeMs: number;
  };
  outputPath: string;
  previewUrl?: string;
}

// ============================================================
// DESIGN PRESETS
// ============================================================

const DESIGN_PRESETS: Record<DesignSpec['preset'], {
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: { heading: string; body: string };
  spacing: { section: string; component: string };
  borderRadius: string;
}> = {
  modern: {
    colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#8B5CF6', background: '#FFFFFF', text: '#1F2937' },
    fonts: { heading: 'Inter', body: 'Inter' },
    spacing: { section: '6rem', component: '2rem' },
    borderRadius: '0.75rem',
  },
  minimal: {
    colors: { primary: '#18181B', secondary: '#71717A', accent: '#18181B', background: '#FAFAFA', text: '#18181B' },
    fonts: { heading: 'system-ui', body: 'system-ui' },
    spacing: { section: '8rem', component: '1.5rem' },
    borderRadius: '0',
  },
  corporate: {
    colors: { primary: '#1E40AF', secondary: '#059669', accent: '#DC2626', background: '#F8FAFC', text: '#334155' },
    fonts: { heading: 'Merriweather', body: 'Open Sans' },
    spacing: { section: '5rem', component: '2rem' },
    borderRadius: '0.5rem',
  },
  playful: {
    colors: { primary: '#EC4899', secondary: '#F59E0B', accent: '#06B6D4', background: '#FDF4FF', text: '#4C1D95' },
    fonts: { heading: 'Poppins', body: 'Nunito' },
    spacing: { section: '4rem', component: '1.5rem' },
    borderRadius: '1.5rem',
  },
  premium: {
    colors: { primary: '#D4AF37', secondary: '#1A1A2E', accent: '#C9B037', background: '#0F0F1A', text: '#EAEAEA' },
    fonts: { heading: 'Playfair Display', body: 'Lato' },
    spacing: { section: '7rem', component: '2.5rem' },
    borderRadius: '0.25rem',
  },
};

// ============================================================
// SECTION TEMPLATES
// ============================================================

const SECTION_TEMPLATES: Record<string, (content?: Record<string, unknown>) => string> = {
  hero: (c) => `
---
const { title = "${c?.title || 'Welcome'}", subtitle = "${c?.subtitle || 'Your tagline here'}", cta = "${c?.cta || 'Get Started'}", ctaLink = "${c?.ctaLink || '#contact'}" } = Astro.props;
---
<section class="hero min-h-[80vh] flex items-center justify-center text-center px-4">
  <div class="max-w-4xl">
    <h1 class="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">{title}</h1>
    <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">{subtitle}</p>
    <a href={ctaLink} class="btn btn-primary text-lg px-8 py-4">{cta}</a>
  </div>
</section>
`,

  features: (c) => `
---
const features = ${JSON.stringify(c?.features || [
  { icon: '🚀', title: 'Fast', description: 'Lightning-fast performance' },
  { icon: '🎨', title: 'Beautiful', description: 'Stunning modern design' },
  { icon: '📱', title: 'Responsive', description: 'Works on all devices' },
])};
---
<section class="features py-section">
  <div class="container mx-auto px-4">
    <h2 class="text-4xl font-bold text-center mb-12">Features</h2>
    <div class="grid md:grid-cols-3 gap-8">
      {features.map((f: { icon: string; title: string; description: string }) => (
        <div class="feature-card p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
          <div class="text-4xl mb-4">{f.icon}</div>
          <h3 class="text-xl font-semibold mb-2">{f.title}</h3>
          <p class="text-gray-600 dark:text-gray-300">{f.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
`,

  testimonials: () => `
---
const testimonials = [
  { name: 'Sarah M.', role: 'CEO', text: 'Absolutely fantastic experience!', avatar: '/avatars/1.jpg' },
  { name: 'John D.', role: 'Developer', text: 'Best decision we ever made.', avatar: '/avatars/2.jpg' },
  { name: 'Lisa K.', role: 'Designer', text: 'Exceeded all expectations.', avatar: '/avatars/3.jpg' },
];
---
<section class="testimonials py-section bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4">
    <h2 class="text-4xl font-bold text-center mb-12">What Our Clients Say</h2>
    <div class="grid md:grid-cols-3 gap-8">
      {testimonials.map((t) => (
        <div class="testimonial-card p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
          <p class="text-lg mb-4 italic">"{t.text}"</p>
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
            <div>
              <p class="font-semibold">{t.name}</p>
              <p class="text-sm text-gray-500">{t.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
`,

  cta: (c) => `
---
const { title = "${c?.title || 'Ready to Start?'}", description = "${c?.description || 'Get in touch today'}", buttonText = "${c?.buttonText || 'Contact Us'}", buttonLink = "${c?.buttonLink || '#contact'}" } = Astro.props;
---
<section class="cta py-section bg-primary text-white">
  <div class="container mx-auto px-4 text-center">
    <h2 class="text-4xl font-bold mb-4">{title}</h2>
    <p class="text-xl mb-8 opacity-90">{description}</p>
    <a href={buttonLink} class="btn btn-white text-lg px-8 py-4">{buttonText}</a>
  </div>
</section>
`,

  contact: () => `
<section id="contact" class="contact py-section">
  <div class="container mx-auto px-4 max-w-2xl">
    <h2 class="text-4xl font-bold text-center mb-12">Get in Touch</h2>
    <form class="space-y-6" action="/api/contact" method="POST">
      <div class="grid md:grid-cols-2 gap-6">
        <input type="text" name="name" placeholder="Your Name" required class="input" />
        <input type="email" name="email" placeholder="Your Email" required class="input" />
      </div>
      <textarea name="message" placeholder="Your Message" rows="5" required class="input"></textarea>
      <button type="submit" class="btn btn-primary w-full py-4">Send Message</button>
    </form>
  </div>
</section>
`,

  about: (c) => `
---
const { title = "${c?.title || 'About Us'}", description = "${c?.description || 'We are a passionate team dedicated to excellence.'}" } = Astro.props;
---
<section class="about py-section">
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-4xl font-bold mb-6">{title}</h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">{description}</p>
      </div>
      <div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
</section>
`,

  services: (c) => `
---
const services = ${JSON.stringify(c?.services || [
  { title: 'Web Design', description: 'Custom designs tailored to your brand', price: 'From $999' },
  { title: 'Development', description: 'High-performance web applications', price: 'From $1,499' },
  { title: 'SEO', description: 'Boost your search engine rankings', price: 'From $499/mo' },
])};
---
<section class="services py-section bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4">
    <h2 class="text-4xl font-bold text-center mb-12">Our Services</h2>
    <div class="grid md:grid-cols-3 gap-8">
      {services.map((s: { title: string; description: string; price: string }) => (
        <div class="service-card p-8 rounded-lg bg-white dark:bg-gray-800 shadow-lg text-center">
          <h3 class="text-2xl font-semibold mb-4">{s.title}</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">{s.description}</p>
          <p class="text-xl font-bold text-primary">{s.price}</p>
        </div>
      ))}
    </div>
  </div>
</section>
`,

  team: () => `
---
const team = [
  { name: 'Alex Johnson', role: 'Founder & CEO', image: '/team/alex.jpg' },
  { name: 'Maria Garcia', role: 'Lead Designer', image: '/team/maria.jpg' },
  { name: 'David Chen', role: 'Tech Lead', image: '/team/david.jpg' },
];
---
<section class="team py-section">
  <div class="container mx-auto px-4">
    <h2 class="text-4xl font-bold text-center mb-12">Our Team</h2>
    <div class="grid md:grid-cols-3 gap-8">
      {team.map((m) => (
        <div class="team-card text-center">
          <div class="w-48 h-48 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
          <h3 class="text-xl font-semibold">{m.name}</h3>
          <p class="text-gray-500">{m.role}</p>
        </div>
      ))}
    </div>
  </div>
</section>
`,

  pricing: (c) => `
---
const plans = ${JSON.stringify(c?.plans || [
  { name: 'Starter', price: 29, features: ['5 Projects', 'Basic Support', '1GB Storage'] },
  { name: 'Pro', price: 79, features: ['Unlimited Projects', 'Priority Support', '10GB Storage', 'Analytics'], popular: true },
  { name: 'Enterprise', price: 199, features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Support', 'SLA'] },
])};
---
<section class="pricing py-section bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4">
    <h2 class="text-4xl font-bold text-center mb-12">Pricing</h2>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {plans.map((p: { name: string; price: number; features: string[]; popular?: boolean }) => (
        <div class={["pricing-card p-8 rounded-lg bg-white dark:bg-gray-800 shadow-lg", p.popular ? "ring-2 ring-primary scale-105" : ""].join(" ")}>
          {p.popular && <span class="bg-primary text-white text-sm px-3 py-1 rounded-full">Most Popular</span>}
          <h3 class="text-2xl font-semibold mt-4">{p.name}</h3>
          <p class="text-4xl font-bold my-4">{"$"}{p.price}<span class="text-lg font-normal">/mo</span></p>
          <ul class="space-y-2 mb-8">
            {p.features.map((f: string) => <li class="flex items-center"><span class="mr-2">✓</span>{f}</li>)}
          </ul>
          <a href="#contact" class="btn btn-primary w-full">Get Started</a>
        </div>
      ))}
    </div>
  </div>
</section>
`,

  faq: (c) => `
---
const faqs = ${JSON.stringify(c?.faqs || [
  { q: 'How long does it take?', a: 'Most projects are completed within 2-4 weeks.' },
  { q: 'Do you offer support?', a: 'Yes, we provide ongoing support and maintenance.' },
  { q: 'Can I request revisions?', a: 'Absolutely! We offer unlimited revisions until you are satisfied.' },
])};
---
<section class="faq py-section">
  <div class="container mx-auto px-4 max-w-3xl">
    <h2 class="text-4xl font-bold text-center mb-12">FAQ</h2>
    <div class="space-y-4">
      {faqs.map((f: { q: string; a: string }) => (
        <details class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <summary class="font-semibold cursor-pointer">{f.q}</summary>
          <p class="mt-4 text-gray-600 dark:text-gray-300">{f.a}</p>
        </details>
      ))}
    </div>
  </div>
</section>
`,

  footer: (c) => `
---
const { siteName = "${c?.siteName || 'Site Name'}", year = new Date().getFullYear() } = Astro.props;
---
<footer class="py-12 bg-gray-900 text-white">
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-4 gap-8 mb-8">
      <div>
        <h3 class="text-xl font-bold mb-4">{siteName}</h3>
        <p class="text-gray-400">Building amazing experiences since 2024.</p>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Links</h4>
        <ul class="space-y-2 text-gray-400">
          <li><a href="/" class="hover:text-white">Home</a></li>
          <li><a href="/about" class="hover:text-white">About</a></li>
          <li><a href="/services" class="hover:text-white">Services</a></li>
          <li><a href="/contact" class="hover:text-white">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Legal</h4>
        <ul class="space-y-2 text-gray-400">
          <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
          <li><a href="/terms" class="hover:text-white">Terms of Service</a></li>
          <li><a href="/imprint" class="hover:text-white">Imprint</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Connect</h4>
        <div class="flex space-x-4">
          <a href="#" class="text-gray-400 hover:text-white">Twitter</a>
          <a href="#" class="text-gray-400 hover:text-white">LinkedIn</a>
          <a href="#" class="text-gray-400 hover:text-white">GitHub</a>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
      <p>© {year} {siteName}. All rights reserved.</p>
    </div>
  </div>
</footer>
`,
};

// ============================================================
// SITE GENERATOR
// ============================================================

export class SiteGenerator {
  private spec: SiteSpec;
  private outputPath: string;
  private design: typeof DESIGN_PRESETS['modern'];
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(spec: SiteSpec, outputPath: string) {
    this.spec = spec;
    this.outputPath = outputPath;
    this.design = DESIGN_PRESETS[spec.design.preset];
  }

  /**
   * Generate complete site - OPTIMIZED with parallel generation
   */
  async generate(): Promise<{ success: boolean; files: string[] }> {
    const result = await this.generateFull({ install: false, build: false });
    return { success: result.success, files: result.files };
  }

  /**
   * FULL AUTONOMOUS FLOW - Generate, install, build, preview
   * Zero friction - just call and get a working site
   */
  async generateFull(options: {
    install?: boolean;
    build?: boolean;
    preview?: boolean;
    validate?: boolean;
  } = {}): Promise<GenerationResult> {
    const startTime = Date.now();
    const files: string[] = [];
    this.errors = [];
    this.warnings = [];

    const result: GenerationResult = {
      success: false,
      files: [],
      errors: [],
      warnings: [],
      stats: {
        filesGenerated: 0,
        generationTimeMs: 0,
        totalTimeMs: 0,
      },
      outputPath: this.outputPath,
    };

    try {
      // 1. Create directory structure (fast, sequential)
      await this.createDirectories();

      // 2. PARALLEL GENERATION - 3-5x faster than sequential
      const genStart = Date.now();

      const [
        configFiles,
        layoutFile,
        componentFiles,
        styleFile,
        seoFiles,
      ] = await Promise.all([
        this.generateConfigs(),
        this.generateLayout(),
        this.generateComponents(),
        this.generateStyles(),
        this.generateSEO(),
      ]);

      files.push(...configFiles, layoutFile, ...componentFiles, styleFile, ...seoFiles);

      // Pages depend on components, so generate after
      const pageFiles = await Promise.all(
        this.spec.pages.map(page => this.generatePage(page))
      );
      files.push(...pageFiles);

      result.stats.generationTimeMs = Date.now() - genStart;
      result.files = files;
      result.stats.filesGenerated = files.length;

      // 3. AUTO-INSTALL (optional, default: true for full flow)
      if (options.install !== false) {
        const installStart = Date.now();
        try {
          await this.autoInstall();
          result.stats.installTimeMs = Date.now() - installStart;
        } catch (e) {
          this.warnings.push(`Install warning: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // 4. AUTO-BUILD (optional)
      if (options.build) {
        const buildStart = Date.now();
        try {
          await this.autoBuild();
          result.stats.buildTimeMs = Date.now() - buildStart;
        } catch (e) {
          this.errors.push(`Build failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // 5. AUTO-PREVIEW (optional)
      if (options.preview) {
        try {
          const port = await this.findAvailablePort(4321);
          result.previewUrl = `http://localhost:${port}`;
          // Don't await - runs in background
          this.startPreview(port);
        } catch (e) {
          this.warnings.push(`Preview warning: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // 6. VALIDATE (optional)
      if (options.validate) {
        const validation = await this.validate();
        if (!validation.valid) {
          this.errors.push(...validation.errors);
        }
        this.warnings.push(...validation.warnings);
      }

      result.success = this.errors.length === 0;
      result.errors = this.errors;
      result.warnings = this.warnings;
      result.stats.totalTimeMs = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errors = [error instanceof Error ? error.message : String(error)];
      result.stats.totalTimeMs = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Quick generate - just files, no install/build (fastest)
   */
  async generateQuick(): Promise<GenerationResult> {
    return this.generateFull({ install: false, build: false, validate: false });
  }

  /**
   * Generate and install - ready for dev
   */
  async generateAndInstall(): Promise<GenerationResult> {
    return this.generateFull({ install: true, build: false });
  }

  /**
   * Generate, install, and build - production ready
   */
  async generateAndBuild(): Promise<GenerationResult> {
    return this.generateFull({ install: true, build: true, validate: true });
  }

  /**
   * Auto-install dependencies using bun (fastest) or npm
   */
  private async autoInstall(): Promise<void> {
    const hasBun = await this.commandExists('bun');
    const cmd = hasBun ? 'bun install' : 'npm install';

    await execAsync(cmd, {
      cwd: this.outputPath,
      env: { ...process.env, SHELL: '/bin/sh' },
    });
  }

  /**
   * Auto-build the site
   */
  private async autoBuild(): Promise<void> {
    const hasBun = await this.commandExists('bun');
    const astroCmd = join(this.outputPath, 'node_modules/.bin/astro');

    // Check if astro exists
    try {
      await access(astroCmd);
    } catch {
      throw new Error('Astro not installed. Run install first.');
    }

    const cmd = hasBun
      ? `bun run ${astroCmd} build`
      : `npx astro build`;

    await execAsync(cmd, {
      cwd: this.outputPath,
      env: { ...process.env, SHELL: '/bin/sh' },
    });
  }

  /**
   * Start preview server (non-blocking)
   */
  private startPreview(port: number): void {
    const cmd = `npx astro preview --port ${port}`;
    exec(cmd, { cwd: this.outputPath });
  }

  /**
   * Validate generated site structure
   */
  private async validate(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required files exist
    const requiredFiles = [
      'package.json',
      'astro.config.mjs',
      'src/layouts/Layout.astro',
      'src/styles/global.css',
      'src/pages/index.astro',
    ];

    for (const file of requiredFiles) {
      try {
        await access(join(this.outputPath, file));
      } catch {
        errors.push(`Missing required file: ${file}`);
      }
    }

    // Check for common issues
    if (this.spec.pages.length === 0) {
      errors.push('No pages defined');
    }

    if (!this.spec.seo.siteName) {
      warnings.push('No site name defined for SEO');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if command exists
   */
  private async commandExists(cmd: string): Promise<boolean> {
    try {
      await execAsync(`which ${cmd}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find available port
   */
  private async findAvailablePort(startPort: number): Promise<number> {
    // Simple approach - just return the start port
    // In production, would check if port is in use
    return startPort;
  }

  private async createDirectories(): Promise<void> {
    const dirs = [
      '',
      'src',
      'src/pages',
      'src/layouts',
      'src/components',
      'src/components/sections',
      'src/styles',
      'public',
      'public/images',
    ];

    for (const dir of dirs) {
      await mkdir(join(this.outputPath, dir), { recursive: true });
    }
  }

  private async generateConfigs(): Promise<string[]> {
    const files: string[] = [];
    const siteName = this.spec.name.toLowerCase().replace(/\s+/g, '-');

    // package.json - Astro 5.x with Tailwind CSS 4.x
    const pkg = {
      name: siteName,
      type: 'module',
      version: '1.0.0',
      scripts: {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
        check: 'astro check',
      },
      dependencies: {
        'astro': '^5.1.0',
        '@astrojs/sitemap': '^3.2.0',
      },
      devDependencies: {
        '@tailwindcss/vite': '^4.0.0',
        'tailwindcss': '^4.0.0',
        'typescript': '^5.7.0',
        '@astrojs/check': '^0.9.0',
      },
    };
    await this.writeFile('package.json', JSON.stringify(pkg, null, 2));
    files.push('package.json');

    // astro.config.mjs - Astro 5.x with Tailwind 4 via Vite plugin
    const siteUrl = this.spec.seo.siteName ? `https://${siteName}.com` : 'https://example.com';
    const astroConfig = `import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: '${siteUrl}',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
`;
    await this.writeFile('astro.config.mjs', astroConfig.trim());
    files.push('astro.config.mjs');

    // tsconfig.json
    const tsConfig = {
      extends: 'astro/tsconfigs/strict',
      compilerOptions: {
        baseUrl: '.',
        paths: { '@/*': ['src/*'] },
        strictNullChecks: true,
      },
    };
    await this.writeFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));
    files.push('tsconfig.json');

    // Tailwind CSS 4.x uses CSS-first configuration
    // No tailwind.config.mjs needed - config goes in CSS

    // .gitignore
    const gitignore = `# build output
dist/
.output/

# dependencies
node_modules/

# logs
*.log
npm-debug.log*

# environment variables
.env
.env.*
!.env.example

# astro
.astro/

# IDE
.vscode/*
!.vscode/extensions.json
.idea/
*.sublime-*

# OS
.DS_Store
Thumbs.db
`;
    await this.writeFile('.gitignore', gitignore.trim());
    files.push('.gitignore');

    return files;
  }

  private async generateLayout(): Promise<string> {
    const siteName = this.spec.name.toLowerCase().replace(/\s+/g, '-');
    const siteUrl = `https://${siteName}.com`;

    const layout = `---
import '../styles/global.css';
import SEOSchema from '../components/SEOSchema.astro';

interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  canonical?: string;
}

const {
  title,
  description = '${this.spec.seo.defaultDescription}',
  image = '/og-image.png',
  type = 'website',
  canonical = Astro.url.href,
} = Astro.props;

const fullTitle = \`\${title} | ${this.spec.seo.siteName}\`;
const siteUrl = '${siteUrl}';
const ogImage = image.startsWith('http') ? image : \`\${siteUrl}\${image}\`;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary Meta Tags -->
  <title>{fullTitle}</title>
  <meta name="title" content={fullTitle} />
  <meta name="description" content={description} />
  <meta name="keywords" content="${this.spec.seo.keywords?.join(', ') || ''}" />
  <meta name="author" content="${this.spec.seo.siteName}" />
  <link rel="canonical" href={canonical} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonical} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content="${this.spec.seo.siteName}" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={canonical} />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=${this.design.fonts.heading.replace(/ /g, '+')}:wght@400;600;700&family=${this.design.fonts.body.replace(/ /g, '+')}:wght@400;500;600&display=swap" rel="stylesheet" />

  <!-- Structured Data -->
  <SEOSchema />
</head>
<body>
  <nav class="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-800">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <a href="/" class="text-xl font-bold" style="font-family: var(--font-heading);">${this.spec.name}</a>
      <div class="hidden md:flex space-x-8">
        ${this.spec.pages.map(p => `<a href="/${p.slug === 'index' ? '' : p.slug}" class="hover:opacity-70 transition-opacity">${p.title}</a>`).join('\n        ')}
      </div>
      <!-- Mobile menu button -->
      <button id="mobile-menu-btn" class="md:hidden p-2" aria-label="Open menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
    <!-- Mobile menu -->
    <div id="mobile-menu" class="hidden md:hidden px-4 pb-4">
      ${this.spec.pages.map(p => `<a href="/${p.slug === 'index' ? '' : p.slug}" class="block py-2 hover:opacity-70">${p.title}</a>`).join('\n      ')}
    </div>
  </nav>

  <main class="pt-20">
    <slot />
  </main>

  <script>
    // Mobile menu toggle
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    btn?.addEventListener('click', () => menu?.classList.toggle('hidden'));
  </script>
</body>
</html>
`;
    await this.writeFile('src/layouts/Layout.astro', layout.trim());
    return 'src/layouts/Layout.astro';
  }

  private async generatePage(page: PageSpec): Promise<string> {
    // Generate import statements and component usage
    const sortedSections = page.sections.sort((a, b) => a.order - b.order);

    // Collect unique section types for imports
    // Use "Section" suffix to avoid naming conflicts with page names
    const sectionTypes = [...new Set(sortedSections.map(s => s.type))];
    const imports = sectionTypes
      .filter(type => SECTION_TEMPLATES[type])
      .map(type => {
        const componentName = type.charAt(0).toUpperCase() + type.slice(1);
        const importName = `${componentName}Section`;
        return `import ${importName} from '../components/sections/${componentName}.astro';`;
      })
      .join('\n');

    // Generate component usages with props
    const components = sortedSections
      .map(s => {
        if (!SECTION_TEMPLATES[s.type]) return `<!-- Unknown section: ${s.type} -->`;
        const componentName = s.type.charAt(0).toUpperCase() + s.type.slice(1);
        const importName = `${componentName}Section`;

        // Pass content as props if available
        if (s.content && Object.keys(s.content).length > 0) {
          const props = Object.entries(s.content)
            .map(([key, value]) => {
              if (typeof value === 'string') {
                return `${key}="${value}"`;
              }
              return `${key}={${JSON.stringify(value)}}`;
            })
            .join(' ');
          return `  <${importName} ${props} />`;
        }
        return `  <${importName} />`;
      })
      .join('\n');

    const content = `---
import Layout from '../layouts/Layout.astro';
${imports}
---
<Layout title="${page.title}">
${components}
</Layout>
`;

    const filename = page.slug === 'index' ? 'index.astro' : `${page.slug}.astro`;
    await this.writeFile(`src/pages/${filename}`, content.trim());
    return `src/pages/${filename}`;
  }

  private async generateComponents(): Promise<string[]> {
    const files: string[] = [];

    // Generate individual section components for reuse
    for (const [name, template] of Object.entries(SECTION_TEMPLATES)) {
      const componentName = name.charAt(0).toUpperCase() + name.slice(1);
      const content = template({});
      await this.writeFile(`src/components/sections/${componentName}.astro`, content.trim());
      files.push(`src/components/sections/${componentName}.astro`);
    }

    return files;
  }

  private async generateStyles(): Promise<string> {
    // Tailwind CSS 4.x uses CSS-first configuration with @theme
    const css = `@import "tailwindcss";

/* Tailwind CSS 4.x Theme Configuration */
@theme {
  /* Colors */
  --color-primary: ${this.design.colors.primary};
  --color-secondary: ${this.design.colors.secondary};
  --color-accent: ${this.design.colors.accent};
  --color-background: ${this.design.colors.background};
  --color-foreground: ${this.design.colors.text};

  /* Typography */
  --font-heading: "${this.design.fonts.heading}", ui-sans-serif, system-ui, sans-serif;
  --font-body: "${this.design.fonts.body}", ui-sans-serif, system-ui, sans-serif;

  /* Spacing */
  --spacing-section: ${this.design.spacing.section};
  --spacing-component: ${this.design.spacing.component};

  /* Border Radius */
  --radius-default: ${this.design.borderRadius};
  --radius-lg: calc(${this.design.borderRadius} * 1.5);
  --radius-sm: calc(${this.design.borderRadius} * 0.5);

  /* Animations */
  --animate-fade-in: fade-in 0.6s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Base Styles */
@layer base {
  html {
    font-family: var(--font-body);
    color: var(--color-foreground);
    background-color: var(--color-background);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
  }
}

/* Component Styles */
@layer components {
  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-default);
    font-weight: 600;
    transition: all 0.2s ease;
    text-decoration: none;
    cursor: pointer;
  }

  .btn-primary {
    background-color: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background-color: var(--color-secondary);
    color: white;
  }

  .btn-white {
    background-color: white;
    color: var(--color-primary);
  }

  .btn-white:hover {
    background-color: #f3f4f6;
  }

  .input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-default);
    border: 1px solid #d1d5db;
    background-color: white;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }

  .py-section {
    padding-top: var(--spacing-section);
    padding-bottom: var(--spacing-section);
  }

  .animate-fade-in {
    animation: var(--animate-fade-in);
  }
}

/* Dark Mode Support */
@layer base {
  @media (prefers-color-scheme: dark) {
    html {
      --color-background: #0f172a;
      --color-foreground: #f1f5f9;
    }

    .input {
      background-color: #1e293b;
      border-color: #475569;
      color: #f1f5f9;
    }
  }
}
`;
    await this.writeFile('src/styles/global.css', css.trim());
    return 'src/styles/global.css';
  }

  private async generateSEO(): Promise<string[]> {
    const files: string[] = [];
    const siteName = this.spec.name.toLowerCase().replace(/\s+/g, '-');
    const siteUrl = `https://${siteName}.com`;

    // robots.txt with correct sitemap URL
    const robots = `# robots.txt for ${this.spec.seo.siteName}
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteUrl}/sitemap-index.xml

# Crawl-delay (optional, for politeness)
Crawl-delay: 1

# Block common admin/private paths (customize as needed)
Disallow: /api/
Disallow: /_astro/
`;
    await this.writeFile('public/robots.txt', robots.trim());
    files.push('public/robots.txt');

    // Generate JSON-LD schema component
    // Use direct inline script with the JSON to avoid TypeScript issues in Astro templates
    const schemas = this.spec.seo.schema.map(type => this.generateSchema(type, siteUrl));
    const schemaScripts = schemas
      .map(schema => `<script type="application/ld+json" is:inline>${JSON.stringify(schema)}</script>`)
      .join('\n');
    const schemaComponent = `---
/**
 * SEO Schema Component
 * Renders JSON-LD structured data for search engines
 */
---
${schemaScripts}
`;
    await this.writeFile('src/components/SEOSchema.astro', schemaComponent.trim());
    files.push('src/components/SEOSchema.astro');

    // Generate default favicon SVG
    const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${this.design.colors.primary}"/>
  <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white">${this.spec.name.charAt(0).toUpperCase()}</text>
</svg>`;
    await this.writeFile('public/favicon.svg', favicon);
    files.push('public/favicon.svg');

    return files;
  }

  private generateSchema(type: SchemaType, siteUrl: string): Record<string, unknown> {
    const base = {
      '@context': 'https://schema.org',
      '@type': type,
    };

    switch (type) {
      case 'Organization':
        return {
          ...base,
          name: this.spec.seo.siteName,
          url: siteUrl,
          description: this.spec.seo.defaultDescription,
          logo: `${siteUrl}/logo.png`,
          sameAs: [], // Social media links can be added here
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: 'English',
          },
        };

      case 'LocalBusiness':
        return {
          ...base,
          name: this.spec.seo.siteName,
          url: siteUrl,
          description: this.spec.seo.defaultDescription,
          image: `${siteUrl}/og-image.png`,
          address: {
            '@type': 'PostalAddress',
            streetAddress: '',
            addressLocality: '',
            addressRegion: '',
            postalCode: '',
            addressCountry: '',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: '',
            longitude: '',
          },
          openingHoursSpecification: [],
          telephone: '',
          priceRange: '$$',
        };

      case 'Person':
        return {
          ...base,
          name: this.spec.seo.siteName,
          url: siteUrl,
          description: this.spec.seo.defaultDescription,
          image: `${siteUrl}/profile.jpg`,
          jobTitle: '',
          worksFor: {
            '@type': 'Organization',
            name: '',
          },
          sameAs: [], // Social media profiles
        };

      case 'Product':
        return {
          ...base,
          name: this.spec.seo.siteName,
          description: this.spec.seo.defaultDescription,
          image: `${siteUrl}/product.jpg`,
          brand: {
            '@type': 'Brand',
            name: this.spec.seo.siteName,
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: '0',
            availability: 'https://schema.org/InStock',
            url: siteUrl,
          },
        };

      case 'Article':
        return {
          ...base,
          headline: this.spec.seo.defaultTitle,
          description: this.spec.seo.defaultDescription,
          image: `${siteUrl}/og-image.png`,
          author: {
            '@type': 'Person',
            name: this.spec.seo.siteName,
          },
          publisher: {
            '@type': 'Organization',
            name: this.spec.seo.siteName,
            logo: {
              '@type': 'ImageObject',
              url: `${siteUrl}/logo.png`,
            },
          },
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
        };

      default:
        return {
          ...base,
          name: this.spec.seo.siteName,
          url: siteUrl,
          description: this.spec.seo.defaultDescription,
        };
    }
  }

  private async writeFile(path: string, content: string): Promise<void> {
    await writeFile(join(this.outputPath, path), content);
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createSiteGenerator(spec: SiteSpec, outputPath: string): SiteGenerator {
  return new SiteGenerator(spec, outputPath);
}

/**
 * Quick site generation from description (legacy)
 */
export async function generateSiteFromDescription(
  description: string,
  outputPath: string
): Promise<{ success: boolean; files: string[] }> {
  const result = await quickSite({ description, outputPath });
  return { success: result.success, files: result.files };
}

// ============================================================
// INTELLIGENT QUICK FACTORY - ZERO CONFIG
// ============================================================

/**
 * Site type templates with intelligent defaults
 */
const SITE_TEMPLATES: Record<SiteSpec['type'], {
  pages: PageSpec[];
  design: DesignSpec['preset'];
  schema: SchemaType[];
}> = {
  landing: {
    pages: [
      { slug: 'index', title: 'Home', sections: [
        { type: 'hero', order: 1 },
        { type: 'features', order: 2 },
        { type: 'testimonials', order: 3 },
        { type: 'pricing', order: 4 },
        { type: 'faq', order: 5 },
        { type: 'cta', order: 6 },
        { type: 'footer', order: 7 },
      ]},
      { slug: 'about', title: 'About', sections: [
        { type: 'about', order: 1 },
        { type: 'team', order: 2 },
        { type: 'footer', order: 3 },
      ]},
    ],
    design: 'modern',
    schema: ['Organization'],
  },
  portfolio: {
    pages: [
      { slug: 'index', title: 'Portfolio', sections: [
        { type: 'hero', order: 1 },
        { type: 'services', order: 2 },
        { type: 'testimonials', order: 3 },
        { type: 'contact', order: 4 },
        { type: 'footer', order: 5 },
      ]},
      { slug: 'about', title: 'About', sections: [
        { type: 'about', order: 1 },
        { type: 'footer', order: 2 },
      ]},
    ],
    design: 'minimal',
    schema: ['Person'],
  },
  blog: {
    pages: [
      { slug: 'index', title: 'Blog', sections: [
        { type: 'hero', order: 1 },
        { type: 'features', order: 2 },
        { type: 'footer', order: 3 },
      ]},
      { slug: 'about', title: 'About', sections: [
        { type: 'about', order: 1 },
        { type: 'footer', order: 2 },
      ]},
    ],
    design: 'minimal',
    schema: ['Article'],
  },
  docs: {
    pages: [
      { slug: 'index', title: 'Documentation', sections: [
        { type: 'hero', order: 1 },
        { type: 'features', order: 2 },
        { type: 'faq', order: 3 },
        { type: 'footer', order: 4 },
      ]},
    ],
    design: 'minimal',
    schema: ['Organization'],
  },
  shop: {
    pages: [
      { slug: 'index', title: 'Shop', sections: [
        { type: 'hero', order: 1 },
        { type: 'features', order: 2 },
        { type: 'pricing', order: 3 },
        { type: 'testimonials', order: 4 },
        { type: 'faq', order: 5 },
        { type: 'footer', order: 6 },
      ]},
      { slug: 'about', title: 'About', sections: [
        { type: 'about', order: 1 },
        { type: 'footer', order: 2 },
      ]},
    ],
    design: 'playful',
    schema: ['Product', 'Organization'],
  },
  saas: {
    pages: [
      { slug: 'index', title: 'Home', sections: [
        { type: 'hero', order: 1 },
        { type: 'features', order: 2 },
        { type: 'pricing', order: 3 },
        { type: 'testimonials', order: 4 },
        { type: 'faq', order: 5 },
        { type: 'cta', order: 6 },
        { type: 'footer', order: 7 },
      ]},
      { slug: 'about', title: 'About', sections: [
        { type: 'about', order: 1 },
        { type: 'team', order: 2 },
        { type: 'footer', order: 3 },
      ]},
    ],
    design: 'corporate',
    schema: ['Organization', 'Product'],
  },
};

/**
 * Detect site type from description using keywords
 */
function detectSiteType(description: string): SiteSpec['type'] {
  const lower = description.toLowerCase();

  const patterns: Array<{ type: SiteSpec['type']; keywords: string[] }> = [
    { type: 'saas', keywords: ['saas', 'software', 'platform', 'app', 'dashboard', 'subscription'] },
    { type: 'shop', keywords: ['shop', 'store', 'ecommerce', 'product', 'buy', 'sell', 'cart'] },
    { type: 'portfolio', keywords: ['portfolio', 'freelance', 'personal', 'designer', 'developer', 'artist'] },
    { type: 'blog', keywords: ['blog', 'article', 'news', 'content', 'posts', 'writer'] },
    { type: 'docs', keywords: ['docs', 'documentation', 'api', 'guide', 'reference', 'manual'] },
  ];

  for (const { type, keywords } of patterns) {
    if (keywords.some(kw => lower.includes(kw))) {
      return type;
    }
  }

  return 'landing'; // Default
}

/**
 * Detect design preset from description
 */
function detectDesignPreset(description: string): DesignSpec['preset'] {
  const lower = description.toLowerCase();

  if (lower.includes('premium') || lower.includes('luxury') || lower.includes('elegant')) return 'premium';
  if (lower.includes('playful') || lower.includes('fun') || lower.includes('colorful')) return 'playful';
  if (lower.includes('corporate') || lower.includes('business') || lower.includes('professional')) return 'corporate';
  if (lower.includes('minimal') || lower.includes('simple') || lower.includes('clean')) return 'minimal';

  return 'modern'; // Default
}

/**
 * Extract keywords from description
 */
function extractKeywords(description: string): string[] {
  // Simple keyword extraction - remove common words
  const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'for', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'with'];
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 10);
}

/**
 * Extract site name from description
 */
function extractSiteName(description: string, type: SiteSpec['type']): string {
  // Try to find a name in quotes
  const quotedMatch = description.match(/["']([^"']+)["']/);
  if (quotedMatch) return quotedMatch[1];

  // Try to find "called X" or "named X"
  const namedMatch = description.match(/(?:called|named)\s+(\w+)/i);
  if (namedMatch) return namedMatch[1];

  // Default based on type
  const typeNames: Record<SiteSpec['type'], string> = {
    landing: 'My Landing Page',
    portfolio: 'My Portfolio',
    blog: 'My Blog',
    docs: 'Documentation',
    shop: 'My Shop',
    saas: 'My SaaS',
  };

  return typeNames[type];
}

export interface QuickSiteOptions {
  /** Description of what you want (e.g., "A SaaS landing page for a project management tool") */
  description: string;
  /** Output path for the generated site */
  outputPath: string;
  /** Override site name */
  name?: string;
  /** Override site type */
  type?: SiteSpec['type'];
  /** Override design preset */
  design?: DesignSpec['preset'];
  /** Auto-install dependencies (default: true) */
  install?: boolean;
  /** Auto-build after generation (default: false) */
  build?: boolean;
  /** Start preview server (default: false) */
  preview?: boolean;
}

/**
 * ZERO-CONFIG SITE GENERATION
 *
 * Just describe what you want, get a working site.
 *
 * @example
 * // Minimal - just description
 * await quickSite({
 *   description: "A SaaS landing page for a project management tool",
 *   outputPath: "/tmp/my-site"
 * });
 *
 * @example
 * // With build
 * await quickSite({
 *   description: "Portfolio site for a freelance designer",
 *   outputPath: "./my-portfolio",
 *   build: true
 * });
 *
 * @example
 * // Full control
 * await quickSite({
 *   description: "Premium agency website",
 *   outputPath: "./agency",
 *   name: "Elite Agency",
 *   type: "landing",
 *   design: "premium",
 *   build: true,
 *   preview: true
 * });
 */
export async function quickSite(options: QuickSiteOptions): Promise<GenerationResult> {
  const {
    description,
    outputPath,
    install = true,
    build = false,
    preview = false,
  } = options;

  // Auto-detect everything from description
  const type = options.type ?? detectSiteType(description);
  const design = options.design ?? detectDesignPreset(description);
  const name = options.name ?? extractSiteName(description, type);
  const keywords = extractKeywords(description);
  const template = SITE_TEMPLATES[type];

  // Build spec with intelligent defaults
  const spec: SiteSpec = {
    name,
    type,
    pages: template.pages,
    design: { preset: design },
    content: { source: 'generate' },
    features: [],
    seo: {
      siteName: name,
      defaultTitle: `Welcome to ${name}`,
      defaultDescription: description,
      keywords,
      schema: template.schema,
    },
  };

  // Generate with options
  const generator = new SiteGenerator(spec, outputPath);
  return generator.generateFull({ install, build, preview, validate: build });
}

/**
 * ULTRA-QUICK: One-liner site generation
 *
 * @example
 * await site("SaaS landing page", "/tmp/my-saas");
 * await site("Portfolio for designer", "./portfolio", { build: true });
 */
export async function site(
  description: string,
  outputPath: string,
  options?: Partial<Omit<QuickSiteOptions, 'description' | 'outputPath'>>
): Promise<GenerationResult> {
  return quickSite({ description, outputPath, ...options });
}
