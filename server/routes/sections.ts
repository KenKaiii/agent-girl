/**
 * Agent Girl - Smart Section API
 * Generate, preview, and manage niche-optimized sections
 */

import { generateSectionId, generateComponentIds } from '../utils/sectionIdGenerator';
import { NICHE_PRESETS, generateNicheSuperprompt, getNicheResearchQueries, type NicheType, type ToneType } from '../utils/nicheSuperprompt';

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Section templates
const SECTION_TEMPLATES = {
  hero: {
    name: 'Hero Section',
    description: 'Eye-catching hero with CTA',
    generate: (niche: NicheType) => {
      const ids = generateComponentIds('hero');
      const preset = NICHE_PRESETS[niche];
      return {
        ids,
        html: `<section id="${ids.section}" class="relative py-24 lg:py-32 ${getEffectClasses(preset.effects)}">
  <div id="${ids.container}" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h1 id="${ids.heading}" class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
        Headline
      </h1>
      <p id="${ids.content}" class="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        Subheadline description
      </p>
      <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <a href="#" class="px-8 py-4 rounded-lg font-semibold ${getButtonClasses(niche)}">
          Primary CTA
        </a>
      </div>
    </div>
  </div>
</section>`,
      };
    },
  },
  features: {
    name: 'Features Grid',
    description: '3-column feature cards',
    generate: (niche: NicheType) => {
      const ids = generateComponentIds('features');
      const preset = NICHE_PRESETS[niche];
      return {
        ids,
        html: `<section id="${ids.section}" class="py-16 lg:py-24 ${getBackgroundClasses(niche)}">
  <div id="${ids.container}" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 id="${ids.heading}" class="text-3xl sm:text-4xl font-bold">Features</h2>
    </div>
    <div id="${ids.content}" class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="p-6 rounded-xl ${getCardClasses(preset.effects)}">
        <h3 class="text-xl font-semibold mb-2">Feature 1</h3>
        <p class="text-gray-600">Description</p>
      </div>
      <div class="p-6 rounded-xl ${getCardClasses(preset.effects)}">
        <h3 class="text-xl font-semibold mb-2">Feature 2</h3>
        <p class="text-gray-600">Description</p>
      </div>
      <div class="p-6 rounded-xl ${getCardClasses(preset.effects)}">
        <h3 class="text-xl font-semibold mb-2">Feature 3</h3>
        <p class="text-gray-600">Description</p>
      </div>
    </div>
  </div>
</section>`,
      };
    },
  },
  cta: {
    name: 'CTA Section',
    description: 'Call-to-action with gradient',
    generate: (niche: NicheType) => {
      const ids = generateComponentIds('cta');
      return {
        ids,
        html: `<section id="${ids.section}" class="py-16 lg:py-24 ${getGradientClasses(niche)}">
  <div id="${ids.container}" class="max-w-4xl mx-auto px-4 text-center">
    <h2 id="${ids.heading}" class="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
    <p id="${ids.content}" class="text-lg text-white/90 mb-8">Join thousands today.</p>
    <a href="#" class="px-8 py-4 rounded-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors">
      Get Started Now
    </a>
  </div>
</section>`,
      };
    },
  },
  pricing: {
    name: 'Pricing Table',
    description: '3-tier pricing',
    generate: (niche: NicheType) => {
      const ids = generateComponentIds('pricing');
      const preset = NICHE_PRESETS[niche];
      return {
        ids,
        html: `<section id="${ids.section}" class="py-16 lg:py-24 ${getBackgroundClasses(niche)}">
  <div id="${ids.container}" class="max-w-7xl mx-auto px-4">
    <h2 id="${ids.heading}" class="text-3xl font-bold text-center mb-12">Pricing</h2>
    <div id="${ids.content}" class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div class="p-8 rounded-2xl ${getCardClasses(preset.effects)}">
        <h3 class="text-2xl font-bold">Starter</h3>
        <div class="mt-4"><span class="text-4xl font-bold">$9</span>/mo</div>
        <button class="mt-6 w-full py-3 rounded-lg border transition-colors">Get Started</button>
      </div>
      <div class="p-8 rounded-2xl ring-2 ring-blue-500 scale-105 ${getCardClasses(preset.effects)}">
        <h3 class="text-2xl font-bold">Pro</h3>
        <div class="mt-4"><span class="text-4xl font-bold">$29</span>/mo</div>
        <button class="mt-6 w-full py-3 rounded-lg bg-blue-600 text-white">Get Started</button>
      </div>
      <div class="p-8 rounded-2xl ${getCardClasses(preset.effects)}">
        <h3 class="text-2xl font-bold">Enterprise</h3>
        <div class="mt-4"><span class="text-4xl font-bold">$99</span>/mo</div>
        <button class="mt-6 w-full py-3 rounded-lg border transition-colors">Get Started</button>
      </div>
    </div>
  </div>
</section>`,
      };
    },
  },
};

// Helper functions
function getEffectClasses(effects: string): string {
  const effectMap: Record<string, string> = {
    minimal: '',
    glassmorphism: 'backdrop-blur-md bg-white/60 dark:bg-gray-900/60',
    'soft-shadows': 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
    'full-animations': 'animate-fade-up',
    'modern-glass': 'backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border border-white/20',
    neumorphism: 'shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]',
  };
  return effectMap[effects] || '';
}

function getBackgroundClasses(niche: NicheType): string {
  const bgMap: Record<NicheType, string> = {
    healthcare: 'bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
    fintech: 'bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950',
    ecommerce: 'bg-white dark:bg-gray-900',
    creative: 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900',
    saas: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-950',
    education: 'bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900',
    realestate: 'bg-gradient-to-br from-gray-50 to-amber-50 dark:from-gray-900',
    restaurant: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900',
  };
  return bgMap[niche] || 'bg-gray-50 dark:bg-gray-900';
}

function getCardClasses(effects: string): string {
  const base = 'bg-white dark:bg-gray-800 hover:-translate-y-1 transition-all duration-200';
  const effectMap: Record<string, string> = {
    minimal: base,
    glassmorphism: `${base} backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/20`,
    'soft-shadows': `${base} shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]`,
    'full-animations': `${base} shadow-lg`,
    'modern-glass': `${base} backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/30`,
    neumorphism: `bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]`,
  };
  return effectMap[effects] || base;
}

function getButtonClasses(niche: NicheType): string {
  const colorMap: Record<NicheType, string> = {
    healthcare: 'bg-blue-600 hover:bg-blue-700 text-white',
    fintech: 'bg-gradient-to-r from-blue-900 to-blue-700 text-white',
    ecommerce: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    creative: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    saas: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
    education: 'bg-blue-600 hover:bg-blue-700 text-white',
    realestate: 'bg-gradient-to-r from-gray-800 to-gray-700 text-white',
    restaurant: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white',
  };
  return colorMap[niche] || 'bg-blue-600 hover:bg-blue-700 text-white';
}

function getGradientClasses(niche: NicheType): string {
  const gradientMap: Record<NicheType, string> = {
    healthcare: 'bg-gradient-to-r from-blue-600 to-green-500',
    fintech: 'bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900',
    ecommerce: 'bg-gradient-to-r from-orange-500 to-red-600',
    creative: 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500',
    saas: 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600',
    education: 'bg-gradient-to-r from-blue-600 to-orange-500',
    realestate: 'bg-gradient-to-r from-gray-800 to-amber-700',
    restaurant: 'bg-gradient-to-r from-amber-600 to-red-600',
  };
  return gradientMap[niche] || 'bg-gradient-to-r from-blue-600 to-purple-600';
}

/**
 * Handle section routes
 */
export async function handleSectionRoutes(req: Request, url: URL): Promise<Response | null> {
  // Only handle /api/sections routes
  if (!url.pathname.startsWith('/api/sections')) {
    return null;
  }

  const method = req.method;
  const path = url.pathname.replace('/api/sections', '');

  // GET /api/sections/niches - Get all niches
  if (method === 'GET' && path === '/niches') {
    const niches = Object.entries(NICHE_PRESETS).map(([id, preset]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      colors: preset.colors,
      effects: preset.effects,
      trust: preset.trust,
      style: preset.style,
      animations: preset.animations,
    }));
    return jsonResponse({ niches });
  }

  // GET /api/sections/niches/:niche - Get niche details
  const nicheMatch = path.match(/^\/niches\/([a-z]+)$/);
  if (method === 'GET' && nicheMatch) {
    const niche = nicheMatch[1] as NicheType;
    const preset = NICHE_PRESETS[niche];
    if (!preset) {
      return jsonResponse({ error: 'Niche not found' }, 404);
    }
    const superprompt = generateNicheSuperprompt({
      industry: niche,
      targetAudience: 'General',
      tone: 'professional' as ToneType,
    });
    const researchQueries = getNicheResearchQueries(niche);
    return jsonResponse({ niche, preset, superprompt, researchQueries });
  }

  // GET /api/sections/templates - Get all templates
  if (method === 'GET' && path === '/templates') {
    const templates = Object.entries(SECTION_TEMPLATES).map(([id, t]) => ({
      id,
      name: t.name,
      description: t.description,
    }));
    return jsonResponse({ templates });
  }

  // POST /api/sections/generate-ids - Generate unique IDs
  if (method === 'POST' && path === '/generate-ids') {
    const body = await req.json() as { count?: number; pattern?: string };
    const count = Math.min(body.count || 1, 50);
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(generateSectionId(body.pattern as Parameters<typeof generateSectionId>[0]));
    }
    return jsonResponse({ ids });
  }

  // POST /api/sections/generate - Generate a section
  if (method === 'POST' && path === '/generate') {
    const body = await req.json() as { template: string; niche?: string };
    const template = body.template;
    const niche = (body.niche || 'saas') as NicheType;

    const sectionTemplate = SECTION_TEMPLATES[template as keyof typeof SECTION_TEMPLATES];
    if (!sectionTemplate) {
      return jsonResponse({ error: 'Template not found' }, 404);
    }
    const preset = NICHE_PRESETS[niche];
    if (!preset) {
      return jsonResponse({ error: 'Niche not found' }, 404);
    }

    const generated = sectionTemplate.generate(niche);
    return jsonResponse({ template, niche, preset, ...generated });
  }

  // GET /api/sections/preview/:niche - Preview all sections for a niche
  const previewMatch = path.match(/^\/preview\/([a-z]+)$/);
  if (method === 'GET' && previewMatch) {
    const niche = previewMatch[1] as NicheType;
    if (!NICHE_PRESETS[niche]) {
      return jsonResponse({ error: 'Niche not found' }, 404);
    }
    const sections = Object.entries(SECTION_TEMPLATES).map(([id, t]) => ({
      id,
      name: t.name,
      ...t.generate(niche),
    }));
    return jsonResponse({ niche, preset: NICHE_PRESETS[niche], sections });
  }

  return null;
}
