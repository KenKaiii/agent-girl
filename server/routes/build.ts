/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Build API - Automated project creation and dev server management
 * Enables one-click project start with auto preview
 */

import { mkdir, writeFile, access, readFile } from 'fs/promises';
import { join } from 'path';
import { exec, spawn, type ChildProcess } from 'child_process';
import { promisify } from 'util';
import { projectRegistry } from '../projectRegistry';

const execAsync = promisify(exec);

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Track running dev servers
const runningServers: Map<string, { pid: number; port: number; process?: ChildProcess }> = new Map();

// Find available port starting from base
async function findAvailablePort(basePort = 4321): Promise<number> {
  for (let port = basePort; port < basePort + 100; port++) {
    try {
      const { stdout } = await execAsync(`lsof -i :${port} 2>/dev/null | head -1`);
      if (!stdout.trim()) return port;
    } catch {
      return port;
    }
  }
  return basePort;
}

// Check if path exists
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Template-specific Astro configurations
interface TemplateConfig {
  name: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  pages: string[];
  components: string[];
  features: string[];
}

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'landing-modern': {
    name: 'Modern Landing Page',
    dependencies: {
      'astro': '^5.0.0',
      '@astrojs/tailwind': '^6.0.0',
      'tailwindcss': '^4.0.0',
    },
    devDependencies: {
      'typescript': '^5.3.0',
    },
    pages: ['index.astro'],
    components: ['Hero.astro', 'Features.astro', 'Testimonials.astro', 'CTA.astro', 'Footer.astro'],
    features: ['Hero Section', 'Feature Grid', 'Testimonials', 'CTA', 'SEO'],
  },
  'portfolio-minimal': {
    name: 'Minimal Portfolio',
    dependencies: {
      'astro': '^5.0.0',
      '@astrojs/tailwind': '^6.0.0',
      'tailwindcss': '^4.0.0',
    },
    devDependencies: {
      'typescript': '^5.3.0',
    },
    pages: ['index.astro', 'about.astro', 'contact.astro'],
    components: ['ProjectCard.astro', 'Gallery.astro', 'ContactForm.astro'],
    features: ['Project Gallery', 'About Section', 'Contact Form'],
  },
  'blog-starter': {
    name: 'Blog Starter',
    dependencies: {
      'astro': '^5.0.0',
      '@astrojs/tailwind': '^6.0.0',
      '@astrojs/mdx': '^4.0.0',
      'tailwindcss': '^4.0.0',
    },
    devDependencies: {
      'typescript': '^5.3.0',
    },
    pages: ['index.astro', 'blog/[...slug].astro'],
    components: ['PostCard.astro', 'TagList.astro', 'SearchBox.astro'],
    features: ['MDX Support', 'Tag System', 'Search', 'RSS Feed'],
  },
  'business-pro': {
    name: 'Business Pro',
    dependencies: {
      'astro': '^5.0.0',
      '@astrojs/tailwind': '^6.0.0',
      'tailwindcss': '^4.0.0',
    },
    devDependencies: {
      'typescript': '^5.3.0',
    },
    pages: ['index.astro', 'about.astro', 'services.astro', 'contact.astro'],
    components: ['Hero.astro', 'Services.astro', 'Team.astro', 'ContactForm.astro'],
    features: ['Team Section', 'Services', 'Testimonials', 'Contact'],
  },
  'shop-starter': {
    name: 'Shop Starter',
    dependencies: {
      'astro': '^5.0.0',
      '@astrojs/tailwind': '^6.0.0',
      'tailwindcss': '^4.0.0',
    },
    devDependencies: {
      'typescript': '^5.3.0',
    },
    pages: ['index.astro', 'products/[id].astro', 'cart.astro'],
    components: ['ProductCard.astro', 'Cart.astro', 'Checkout.astro'],
    features: ['Product Catalog', 'Cart', 'Checkout'],
  },
  'docs-starlight': {
    name: 'Documentation',
    dependencies: {
      'astro': '^5.0.0',
      '@astrojs/starlight': '^0.30.0',
    },
    devDependencies: {
      'typescript': '^5.3.0',
    },
    pages: [],
    components: [],
    features: ['Pagefind Search', 'i18n', 'Dark Mode', 'Sidebar Nav'],
  },
};

// Generate basic Astro project structure
async function generateAstroProject(
  projectPath: string,
  templateId: string,
  projectName: string
): Promise<void> {
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['landing-modern'];

  // Create directories
  await mkdir(projectPath, { recursive: true });
  await mkdir(join(projectPath, 'src'), { recursive: true });
  await mkdir(join(projectPath, 'src/pages'), { recursive: true });
  await mkdir(join(projectPath, 'src/components'), { recursive: true });
  await mkdir(join(projectPath, 'src/layouts'), { recursive: true });
  await mkdir(join(projectPath, 'public'), { recursive: true });

  // package.json
  const packageJson = {
    name: projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    type: 'module',
    version: '0.0.1',
    scripts: {
      dev: 'astro dev',
      start: 'astro dev',
      build: 'astro build',
      preview: 'astro preview',
    },
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
  };
  await writeFile(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

  // astro.config.mjs
  const astroConfig = `import { defineConfig } from 'astro/config';
import tailwindcss from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwindcss()],
  output: 'static',
});
`;
  await writeFile(join(projectPath, 'astro.config.mjs'), astroConfig);

  // tsconfig.json
  const tsConfig = {
    extends: 'astro/tsconfigs/strict',
    compilerOptions: {
      baseUrl: '.',
      paths: { '@/*': ['src/*'] },
    },
  };
  await writeFile(join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

  // Basic Layout
  const layout = `---
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
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
    <slot />
  </body>
</html>
`;
  await writeFile(join(projectPath, 'src/layouts/Layout.astro'), layout);

  // Index page with placeholder
  const indexPage = `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="${config.name}">
  <main class="container mx-auto px-4 py-16">
    <div class="text-center">
      <h1 class="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        ${config.name}
      </h1>
      <p class="text-xl text-gray-300 mb-8">
        Agent Girl is building your ${templateId} website...
      </p>
      <div class="flex justify-center gap-4">
        <div class="animate-pulse bg-blue-500/20 rounded-lg p-4">
          <span class="text-blue-400">Building components...</span>
        </div>
      </div>
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        ${config.features.map(f => `
        <div class="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 class="text-lg font-semibold mb-2">${f}</h3>
          <p class="text-sm text-gray-400">Coming soon...</p>
        </div>`).join('')}
      </div>
    </div>
  </main>
</Layout>
`;
  await writeFile(join(projectPath, 'src/pages/index.astro'), indexPage);

  // Tailwind CSS
  const globalsCss = `@import "tailwindcss";
`;
  await writeFile(join(projectPath, 'src/styles/globals.css'), globalsCss);
  await mkdir(join(projectPath, 'src/styles'), { recursive: true });
  await writeFile(join(projectPath, 'src/styles/globals.css'), globalsCss);
}

// Start dev server for a project
async function startDevServer(projectPath: string): Promise<{ port: number; pid: number }> {
  const port = await findAvailablePort(4321);

  // Install dependencies first
  try {
    await execAsync('bun install', { cwd: projectPath, timeout: 60000 });
  } catch {
    // Try npm as fallback
    try {
      await execAsync('npm install', { cwd: projectPath, timeout: 120000 });
    } catch (npmError) {
      console.error('Failed to install dependencies:', npmError);
    }
  }

  // Start dev server
  const devProcess = spawn('bun', ['run', 'dev', '--port', port.toString()], {
    cwd: projectPath,
    detached: true,
    stdio: 'ignore',
  });

  devProcess.unref();

  // Store reference
  runningServers.set(projectPath, {
    pid: devProcess.pid || 0,
    port,
    process: devProcess
  });

  // Wait for server to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok) break;
    } catch {
      // Server not ready yet
    }
  }

  return { port, pid: devProcess.pid || 0 };
}

// Stop dev server for a project
async function stopDevServer(projectPath: string): Promise<boolean> {
  const server = runningServers.get(projectPath);
  if (!server) return false;

  try {
    if (server.process) {
      server.process.kill('SIGTERM');
    } else {
      await execAsync(`kill -9 ${server.pid}`);
    }
    runningServers.delete(projectPath);
    return true;
  } catch {
    return false;
  }
}

// Build Routes Handler
export async function handleBuildRoutes(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  // POST /api/build/start - Create project and start dev server
  if (path === '/api/build/start' && req.method === 'POST') {
    return await handleBuildStart(req);
  }

  // POST /api/build/stop - Stop dev server
  if (path === '/api/build/stop' && req.method === 'POST') {
    return await handleBuildStop(req);
  }

  // GET /api/build/status - Get running projects status
  if (path === '/api/build/status' && req.method === 'GET') {
    return handleBuildStatus();
  }

  // GET /api/build/templates - List available templates
  if (path === '/api/build/templates' && req.method === 'GET') {
    return handleBuildTemplates();
  }

  return null;
}

// Handle POST /api/build/start
async function handleBuildStart(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { templateId, projectName, workingDir, sessionId } = body;

    if (!templateId || !projectName) {
      return jsonResponse({
        error: 'Missing required fields: templateId, projectName'
      }, 400);
    }

    // Determine project path
    const basePath = workingDir || '/Users/master/Projects';
    const projectPath = join(basePath, projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'));

    // Check if already exists
    if (await pathExists(projectPath)) {
      // Project exists, check if already registered
      let project = projectRegistry.getProjectByPath(projectPath);

      if (!project) {
        // Register existing project
        const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['landing-modern'];
        project = projectRegistry.registerProject({
          sessionId,
          name: projectName,
          type: 'astro',
          path: projectPath,
          metadata: {
            template: templateId,
            features: config.features,
          },
        });
      } else if (sessionId && project.session_id !== sessionId) {
        // Link to new session
        projectRegistry.linkToSession(project.id, sessionId);
      }

      // Start the server
      const { port, pid } = await startDevServer(projectPath);
      projectRegistry.updateStatus(project.id, 'serving', `http://localhost:${port}`, port);

      return jsonResponse({
        success: true,
        projectId: project.id,
        projectPath,
        port,
        pid,
        previewUrl: `http://localhost:${port}`,
        message: 'Existing project found, dev server started',
      });
    }

    // Determine project type from template
    const projectType = templateId === 'docs-starlight' ? 'astro' :
                        templateId.includes('next') ? 'next' :
                        templateId.includes('react') ? 'react' : 'astro';

    // Register new project before generating
    const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['landing-modern'];
    const project = projectRegistry.registerProject({
      sessionId,
      name: projectName,
      type: projectType,
      path: projectPath,
      metadata: {
        template: templateId,
        features: config.features,
      },
    });

    // Generate new project
    await generateAstroProject(projectPath, templateId, projectName);
    projectRegistry.updateStatus(project.id, 'building');

    // Start dev server
    const { port, pid } = await startDevServer(projectPath);
    projectRegistry.updateStatus(project.id, 'serving', `http://localhost:${port}`, port);

    return jsonResponse({
      success: true,
      projectId: project.id,
      projectPath,
      port,
      pid,
      previewUrl: `http://localhost:${port}`,
      template: config.name,
      message: 'Project created and dev server started',
    });
  } catch (error) {
    console.error('Build start error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to start build'
    }, 500);
  }
}

// Handle POST /api/build/stop
async function handleBuildStop(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { projectPath } = body;

    if (!projectPath) {
      return jsonResponse({ error: 'Missing projectPath' }, 400);
    }

    const stopped = await stopDevServer(projectPath);

    return jsonResponse({
      success: stopped,
      message: stopped ? 'Dev server stopped' : 'No server found for project',
    });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to stop server'
    }, 500);
  }
}

// Handle GET /api/build/status
function handleBuildStatus(): Response {
  const projects = Array.from(runningServers.entries()).map(([path, info]) => ({
    projectPath: path,
    port: info.port,
    pid: info.pid,
    previewUrl: `http://localhost:${info.port}`,
  }));

  return jsonResponse({
    runningProjects: projects,
    count: projects.length,
  });
}

// Handle GET /api/build/templates
function handleBuildTemplates(): Response {
  const templates = Object.entries(TEMPLATE_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
    features: config.features,
    pages: config.pages,
    components: config.components,
  }));

  return jsonResponse({ templates });
}
