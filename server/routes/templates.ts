/**
 * Project Templates Library API
 *
 * Provides pre-built project templates similar to Bolt.new and Lovable.
 * Supports Astro, Next.js, React, Vue, and more.
 */

import { z } from 'zod';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, cpSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types & Schemas
// ============================================================================

const CreateFromTemplateSchema = z.object({
  templateId: z.string(),
  projectName: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  targetPath: z.string(),
  customizations: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    author: z.string().optional(),
    primaryColor: z.string().optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
});

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'starter' | 'landing' | 'dashboard' | 'blog' | 'ecommerce' | 'portfolio' | 'saas';
  framework: 'astro' | 'nextjs' | 'react' | 'vue' | 'svelte';
  features: string[];
  preview?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  command?: string;
  files?: Record<string, string>;
}

// ============================================================================
// Template Library
// ============================================================================

const TEMPLATES: ProjectTemplate[] = [
  // ========== ASTRO TEMPLATES ==========
  {
    id: 'astro-landing',
    name: 'Astro Landing Page',
    description: 'Modern landing page with hero, features, pricing, and CTA sections',
    category: 'landing',
    framework: 'astro',
    features: ['Tailwind CSS', 'View Transitions', 'SEO Optimized', 'Mobile Responsive'],
    difficulty: 'beginner',
    estimatedTime: '5 min',
    command: 'bun create astro@latest --template minimal',
  },
  {
    id: 'astro-blog',
    name: 'Astro Blog',
    description: 'Content-focused blog with MDX support and RSS feed',
    category: 'blog',
    framework: 'astro',
    features: ['MDX', 'RSS', 'Sitemap', 'Reading Time', 'Tags'],
    difficulty: 'beginner',
    estimatedTime: '5 min',
    command: 'bun create astro@latest --template blog',
  },
  {
    id: 'astro-portfolio',
    name: 'Astro Portfolio',
    description: 'Creative portfolio for developers and designers',
    category: 'portfolio',
    framework: 'astro',
    features: ['Project Gallery', 'About Section', 'Contact Form', 'Animations'],
    difficulty: 'beginner',
    estimatedTime: '5 min',
    command: 'bun create astro@latest --template portfolio',
  },
  {
    id: 'astro-saas',
    name: 'Astro SaaS Starter',
    description: 'SaaS landing page with auth, pricing, and dashboard',
    category: 'saas',
    framework: 'astro',
    features: ['Auth Ready', 'Stripe Integration', 'Dashboard Layout', 'Dark Mode'],
    difficulty: 'intermediate',
    estimatedTime: '10 min',
  },
  {
    id: 'astro-docs',
    name: 'Astro Documentation',
    description: 'Documentation site with sidebar navigation and search',
    category: 'starter',
    framework: 'astro',
    features: ['Starlight', 'Search', 'Versioning', 'i18n'],
    difficulty: 'beginner',
    estimatedTime: '5 min',
    command: 'bun create astro@latest --template starlight',
  },

  // ========== NEXT.JS TEMPLATES ==========
  {
    id: 'nextjs-app',
    name: 'Next.js App Router',
    description: 'Modern Next.js 14+ with App Router and Server Components',
    category: 'starter',
    framework: 'nextjs',
    features: ['App Router', 'Server Components', 'Tailwind CSS', 'TypeScript'],
    difficulty: 'beginner',
    estimatedTime: '3 min',
    command: 'bunx create-next-app@latest --typescript --tailwind --app --src-dir',
  },
  {
    id: 'nextjs-dashboard',
    name: 'Next.js Dashboard',
    description: 'Admin dashboard with charts, tables, and auth',
    category: 'dashboard',
    framework: 'nextjs',
    features: ['shadcn/ui', 'Charts', 'Data Tables', 'Auth', 'Dark Mode'],
    difficulty: 'intermediate',
    estimatedTime: '10 min',
  },
  {
    id: 'nextjs-ecommerce',
    name: 'Next.js E-Commerce',
    description: 'Full e-commerce store with cart and checkout',
    category: 'ecommerce',
    framework: 'nextjs',
    features: ['Product Catalog', 'Shopping Cart', 'Stripe Checkout', 'Order History'],
    difficulty: 'advanced',
    estimatedTime: '15 min',
  },
  {
    id: 'nextjs-blog',
    name: 'Next.js Blog',
    description: 'Blog with MDX, categories, and social sharing',
    category: 'blog',
    framework: 'nextjs',
    features: ['MDX', 'Categories', 'Social Sharing', 'Newsletter'],
    difficulty: 'beginner',
    estimatedTime: '5 min',
  },

  // ========== REACT TEMPLATES ==========
  {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Lightning-fast React development with Vite',
    category: 'starter',
    framework: 'react',
    features: ['Vite', 'TypeScript', 'Tailwind CSS', 'ESLint'],
    difficulty: 'beginner',
    estimatedTime: '2 min',
    command: 'bun create vite --template react-ts',
  },
  {
    id: 'react-dashboard',
    name: 'React Admin Dashboard',
    description: 'Feature-rich admin dashboard with routing',
    category: 'dashboard',
    framework: 'react',
    features: ['React Router', 'Charts', 'Tables', 'Forms', 'Auth'],
    difficulty: 'intermediate',
    estimatedTime: '10 min',
  },

  // ========== VUE TEMPLATES ==========
  {
    id: 'vue-nuxt',
    name: 'Nuxt 3 Starter',
    description: 'Vue 3 with Nuxt for SSR and file-based routing',
    category: 'starter',
    framework: 'vue',
    features: ['Nuxt 3', 'Vue 3', 'Auto Imports', 'TypeScript'],
    difficulty: 'beginner',
    estimatedTime: '3 min',
    command: 'bunx nuxi@latest init',
  },
  {
    id: 'vue-landing',
    name: 'Vue Landing Page',
    description: 'Beautiful landing page with Vue 3 Composition API',
    category: 'landing',
    framework: 'vue',
    features: ['Composition API', 'Animations', 'Form Handling', 'i18n'],
    difficulty: 'beginner',
    estimatedTime: '5 min',
  },

  // ========== SVELTE TEMPLATES ==========
  {
    id: 'svelte-kit',
    name: 'SvelteKit Starter',
    description: 'Full-stack SvelteKit with SSR and API routes',
    category: 'starter',
    framework: 'svelte',
    features: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Form Actions'],
    difficulty: 'beginner',
    estimatedTime: '3 min',
    command: 'bun create svelte@latest',
  },
];

// ============================================================================
// Template Files (for custom templates without CLI command)
// ============================================================================

const TEMPLATE_FILES: Record<string, Record<string, string>> = {
  'astro-saas': {
    'package.json': `{
  "name": "{{projectName}}",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "@astrojs/tailwind": "^5.1.0",
    "@astrojs/react": "^3.6.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0"
  }
}`,
    'astro.config.mjs': `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [tailwind(), react()],
});`,
    'src/pages/index.astro': `---
import Layout from '../layouts/Layout.astro';
import Hero from '../components/Hero.astro';
import Features from '../components/Features.astro';
import Pricing from '../components/Pricing.astro';
import CTA from '../components/CTA.astro';
---

<Layout title="{{title}}">
  <Hero />
  <Features />
  <Pricing />
  <CTA />
</Layout>`,
    'src/layouts/Layout.astro': `---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content="{{description}}" />
    <title>{title}</title>
  </head>
  <body class="bg-white dark:bg-gray-900">
    <slot />
  </body>
</html>`,
    'src/components/Hero.astro': `---
---

<section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
  <div class="text-center text-white px-4">
    <h1 class="text-5xl md:text-7xl font-bold mb-6">{{title}}</h1>
    <p class="text-xl md:text-2xl mb-8 opacity-90">{{description}}</p>
    <div class="flex gap-4 justify-center">
      <a href="#pricing" class="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
        Jetzt starten
      </a>
      <a href="#features" class="px-8 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition">
        Mehr erfahren
      </a>
    </div>
  </div>
</section>`,
    'src/components/Features.astro': `---
const features = [
  { icon: '🚀', title: 'Schnell', description: 'Blitzschnelle Performance durch moderne Technologie' },
  { icon: '🔒', title: 'Sicher', description: 'Enterprise-Grade Sicherheit für Ihre Daten' },
  { icon: '📱', title: 'Responsive', description: 'Perfekt auf allen Geräten' },
  { icon: '🎨', title: 'Anpassbar', description: 'Vollständig an Ihre Marke anpassbar' },
];
---

<section id="features" class="py-24 px-4 bg-gray-50 dark:bg-gray-800">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-4xl font-bold text-center mb-16 dark:text-white">Features</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      {features.map(f => (
        <div class="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
          <div class="text-4xl mb-4">{f.icon}</div>
          <h3 class="text-xl font-semibold mb-2 dark:text-white">{f.title}</h3>
          <p class="text-gray-600 dark:text-gray-300">{f.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>`,
    'src/components/Pricing.astro': `---
const plans = [
  { name: 'Starter', price: '0', features: ['5 Projekte', 'Community Support', 'Basis Analytics'], cta: 'Kostenlos starten' },
  { name: 'Pro', price: '29', features: ['Unbegrenzte Projekte', 'Priority Support', 'Advanced Analytics', 'Team Collaboration'], cta: 'Pro werden', popular: true },
  { name: 'Enterprise', price: '99', features: ['Alles in Pro', 'Dedicated Support', 'Custom Integrations', 'SLA'], cta: 'Kontakt' },
];
---

<section id="pricing" class="py-24 px-4">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-4xl font-bold text-center mb-16 dark:text-white">Preise</h2>
    <div class="grid md:grid-cols-3 gap-8">
      {plans.map(plan => (
        <div class={\`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg \${plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''}\`}>
          {plan.popular && <span class="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">Beliebt</span>}
          <h3 class="text-2xl font-bold mt-4 dark:text-white">{plan.name}</h3>
          <div class="my-4">
            <span class="text-4xl font-bold dark:text-white">€{plan.price}</span>
            <span class="text-gray-500">/Monat</span>
          </div>
          <ul class="space-y-3 mb-8">
            {plan.features.map(f => (
              <li class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span class="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
          <button class={\`w-full py-3 rounded-lg font-semibold transition \${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-gray-200'}\`}>
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  </div>
</section>`,
    'src/components/CTA.astro': `---
---

<section class="py-24 px-4 bg-blue-600">
  <div class="max-w-4xl mx-auto text-center text-white">
    <h2 class="text-4xl font-bold mb-6">Bereit loszulegen?</h2>
    <p class="text-xl mb-8 opacity-90">Starten Sie noch heute kostenlos und erleben Sie den Unterschied.</p>
    <a href="/signup" class="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition">
      Kostenlos registrieren
    </a>
  </div>
</section>`,
    'tailwind.config.mjs': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};`,
  },

  'nextjs-dashboard': {
    'package.json': `{
  "name": "{{projectName}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}`,
    'src/app/layout.tsx': `import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '{{title}}',
  description: '{{description}}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}`,
    'src/app/page.tsx': `import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}`,
    'src/components/Sidebar.tsx': `'use client';

import { Home, Users, Settings, BarChart, FileText } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Benutzer', href: '/users' },
  { icon: BarChart, label: 'Analytics', href: '/analytics' },
  { icon: FileText, label: 'Berichte', href: '/reports' },
  { icon: Settings, label: 'Einstellungen', href: '/settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{{title}}</h1>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}`,
    'src/components/Header.tsx': `'use client';

import { Bell, Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </header>
  );
}`,
    'src/components/Dashboard.tsx': `'use client';

import { Users, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Benutzer', value: '12.5K', icon: Users, change: '+12%', color: 'blue' },
  { label: 'Umsatz', value: '€45.2K', icon: DollarSign, change: '+8%', color: 'green' },
  { label: 'Bestellungen', value: '1.2K', icon: ShoppingCart, change: '+23%', color: 'purple' },
  { label: 'Wachstum', value: '18%', icon: TrendingUp, change: '+5%', color: 'orange' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Übersicht</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={\`p-3 bg-\${stat.color}-100 dark:bg-\${stat.color}-900/30 rounded-lg\`}>
                <stat.icon className={\`w-6 h-6 text-\${stat.color}-600\`} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-500 text-sm font-medium">{stat.change}</span>
              <span className="text-gray-500 text-sm ml-1">vs letzter Monat</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  },
};

// ============================================================================
// Template Creation Logic
// ============================================================================

async function createFromTemplate(
  template: ProjectTemplate,
  projectName: string,
  targetPath: string,
  customizations?: Record<string, unknown>
): Promise<{ success: boolean; path: string; message: string }> {
  const projectPath = join(targetPath, projectName);

  // Check if directory already exists
  if (existsSync(projectPath)) {
    return {
      success: false,
      path: projectPath,
      message: `Projekt "${projectName}" existiert bereits in ${targetPath}`
    };
  }

  try {
    // If template has a CLI command, use it
    if (template.command) {
      const cmd = `cd "${targetPath}" && ${template.command} "${projectName}" --yes 2>/dev/null || ${template.command} "${projectName}"`;
      execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });

      return {
        success: true,
        path: projectPath,
        message: `Projekt "${projectName}" erfolgreich erstellt mit ${template.name}`
      };
    }

    // Otherwise, use template files
    const templateFiles = TEMPLATE_FILES[template.id];
    if (!templateFiles) {
      return {
        success: false,
        path: projectPath,
        message: `Keine Template-Dateien für ${template.id} gefunden`
      };
    }

    // Create project directory
    mkdirSync(projectPath, { recursive: true });

    // Process and write each file
    for (const [filePath, content] of Object.entries(templateFiles)) {
      const fullPath = join(projectPath, filePath);
      const dir = join(projectPath, filePath.split('/').slice(0, -1).join('/'));

      if (dir !== projectPath) {
        mkdirSync(dir, { recursive: true });
      }

      // Apply customizations
      let processedContent = content
        .replace(/\{\{projectName\}\}/g, projectName)
        .replace(/\{\{title\}\}/g, customizations?.title as string || projectName)
        .replace(/\{\{description\}\}/g, customizations?.description as string || `${projectName} - Erstellt mit Agent Girl`);

      writeFileSync(fullPath, processedContent, 'utf-8');
    }

    // Install dependencies
    try {
      execSync(`cd "${projectPath}" && bun install`, { stdio: 'inherit', shell: '/bin/bash' });
    } catch {
      // Dependencies will be installed on first dev run
    }

    return {
      success: true,
      path: projectPath,
      message: `Projekt "${projectName}" erfolgreich erstellt mit ${template.name}`
    };
  } catch (error) {
    return {
      success: false,
      path: projectPath,
      message: `Fehler beim Erstellen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// ============================================================================
// Route Handler
// ============================================================================

export async function handleTemplateRoutes(req: Request, url: URL): Promise<Response> {
  const path = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // GET /api/templates - List all templates
    if (path === '/api/templates' && req.method === 'GET') {
      const category = url.searchParams.get('category');
      const framework = url.searchParams.get('framework');

      let templates = [...TEMPLATES];

      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      if (framework) {
        templates = templates.filter(t => t.framework === framework);
      }

      // Group by category
      const grouped = templates.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      }, {} as Record<string, typeof templates>);

      return new Response(JSON.stringify({
        templates,
        grouped,
        categories: [...new Set(TEMPLATES.map(t => t.category))],
        frameworks: [...new Set(TEMPLATES.map(t => t.framework))],
        total: templates.length
      }), { status: 200, headers: corsHeaders });
    }

    // GET /api/templates/:id - Get single template
    if (path.startsWith('/api/templates/') && req.method === 'GET') {
      const id = path.replace('/api/templates/', '');
      const template = TEMPLATES.find(t => t.id === id);

      if (!template) {
        return new Response(JSON.stringify({
          error: 'Template nicht gefunden'
        }), { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify(template), {
        status: 200,
        headers: corsHeaders
      });
    }

    // POST /api/templates/create - Create project from template
    if (path === '/api/templates/create' && req.method === 'POST') {
      const body = await req.json();
      const parsed = CreateFromTemplateSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const { templateId, projectName, targetPath, customizations } = parsed.data;
      const template = TEMPLATES.find(t => t.id === templateId);

      if (!template) {
        return new Response(JSON.stringify({
          error: 'Template nicht gefunden'
        }), { status: 404, headers: corsHeaders });
      }

      const result = await createFromTemplate(
        template,
        projectName,
        targetPath,
        customizations as Record<string, unknown>
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 201 : 400,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: 'Nicht gefunden',
      availableEndpoints: [
        'GET /api/templates',
        'GET /api/templates/:id',
        'POST /api/templates/create'
      ]
    }), { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Templates API error:', error);
    return new Response(JSON.stringify({
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }), { status: 500, headers: corsHeaders });
  }
}
