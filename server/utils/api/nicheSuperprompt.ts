/**
 * Agent Girl - Dynamic Niche Superprompt System
 * Pre-research prompts for niche-specific optimization
 */

export type NicheType = 'healthcare' | 'fintech' | 'ecommerce' | 'creative' | 'saas' | 'education' | 'realestate' | 'restaurant';
export type ToneType = 'professional' | 'casual' | 'luxury' | 'playful' | 'minimal' | 'bold';

export interface NicheContext {
  industry: NicheType;
  targetAudience: string;
  competitors?: string[];
  tone: ToneType;
  locale?: string;
}

export interface NichePreset {
  colors: string[];
  effects: 'minimal' | 'glassmorphism' | 'soft-shadows' | 'full-animations' | 'modern-glass' | 'neumorphism';
  trust: string[];
  compliance?: string[];
  conversion?: string[];
  style: string;
  typography: {
    heading: string;
    body: string;
  };
  animations: 'subtle' | 'moderate' | 'expressive';
}

export const NICHE_PRESETS: Record<NicheType, NichePreset> = {
  healthcare: {
    colors: ['blue-500', 'green-500', 'white', 'gray-50'],
    effects: 'minimal',
    trust: ['certifications', 'testimonials', 'team-credentials', 'patient-reviews'],
    compliance: ['HIPAA', 'WCAG-AAA', 'ADA'],
    style: 'clean-professional',
    typography: {
      heading: 'Inter',
      body: 'Inter',
    },
    animations: 'subtle',
  },
  fintech: {
    colors: ['navy-900', 'gold-500', 'white', 'gray-100'],
    effects: 'glassmorphism',
    trust: ['security-badges', 'stats', 'partner-logos', 'compliance-seals'],
    compliance: ['PCI-DSS', 'GDPR', 'SOC2'],
    style: 'premium-trust',
    typography: {
      heading: 'Space Grotesk',
      body: 'Inter',
    },
    animations: 'subtle',
  },
  ecommerce: {
    colors: ['brand-primary', 'accent', 'white', 'gray-50'],
    effects: 'soft-shadows',
    trust: ['reviews', 'guarantees', 'shipping-info', 'secure-checkout'],
    conversion: ['urgency', 'social-proof', 'scarcity', 'free-shipping'],
    style: 'conversion-focused',
    typography: {
      heading: 'DM Sans',
      body: 'Inter',
    },
    animations: 'moderate',
  },
  creative: {
    colors: ['vibrant-gradient', 'accent-pop', 'dark-900', 'white'],
    effects: 'full-animations',
    trust: ['portfolio', 'case-studies', 'awards', 'client-logos'],
    style: 'expressive-bold',
    typography: {
      heading: 'Clash Display',
      body: 'Satoshi',
    },
    animations: 'expressive',
  },
  saas: {
    colors: ['purple-600', 'blue-500', 'white', 'gray-50'],
    effects: 'modern-glass',
    trust: ['logos', 'stats', 'testimonials', 'integrations'],
    conversion: ['free-trial', 'demo', 'pricing-comparison'],
    style: 'modern-tech',
    typography: {
      heading: 'Cal Sans',
      body: 'Inter',
    },
    animations: 'moderate',
  },
  education: {
    colors: ['blue-600', 'orange-500', 'white', 'gray-50'],
    effects: 'soft-shadows',
    trust: ['accreditations', 'testimonials', 'success-stories', 'instructors'],
    style: 'approachable-professional',
    typography: {
      heading: 'Plus Jakarta Sans',
      body: 'Inter',
    },
    animations: 'moderate',
  },
  realestate: {
    colors: ['navy-800', 'gold-400', 'white', 'warm-gray'],
    effects: 'soft-shadows',
    trust: ['listings', 'testimonials', 'agent-profiles', 'awards'],
    style: 'elegant-trustworthy',
    typography: {
      heading: 'Playfair Display',
      body: 'Source Sans Pro',
    },
    animations: 'subtle',
  },
  restaurant: {
    colors: ['warm-brown', 'cream', 'dark-green', 'gold'],
    effects: 'minimal',
    trust: ['reviews', 'photos', 'chef-bio', 'awards'],
    style: 'warm-inviting',
    typography: {
      heading: 'Fraunces',
      body: 'Lora',
    },
    animations: 'subtle',
  },
};

/**
 * Generate a dynamic superprompt for niche-specific implementation
 */
export function generateNicheSuperprompt(context: NicheContext): string {
  const preset = NICHE_PRESETS[context.industry];

  return `
## PRE-IMPLEMENTATION RESEARCH (Quick 30-second scan)

Before generating any code, consider these niche-specific requirements:

### 1. Industry: ${context.industry.toUpperCase()}

**Color Palette**: ${preset.colors.join(', ')}
**Effect Style**: ${preset.effects}
**Animation Level**: ${preset.animations}
**Typography**: ${preset.typography.heading} / ${preset.typography.body}

### 2. Trust Elements to Include
${preset.trust.map(t => `- ${t}`).join('\n')}

${preset.compliance ? `### 3. Compliance Requirements
${preset.compliance.map(c => `- ${c} compliant`).join('\n')}` : ''}

${preset.conversion ? `### 4. Conversion Elements
${preset.conversion.map(c => `- ${c}`).join('\n')}` : ''}

### 5. Target Audience: ${context.targetAudience}
- Preferred interaction patterns for this audience
- Accessibility level: ${context.industry === 'healthcare' ? 'WCAG AAA' : 'WCAG AA'}
- Device priority: ${context.industry === 'ecommerce' ? 'Mobile-first' : 'Responsive all'}

### 6. Tone: ${context.tone}
- Animation timing: ${context.tone === 'professional' || context.tone === 'luxury' ? 'conservative (200-300ms)' : 'expressive (300-500ms)'}
- Color intensity: ${context.tone === 'bold' ? 'vibrant' : context.tone === 'minimal' ? 'muted' : 'balanced'}
- Spacing: ${context.tone === 'luxury' || context.tone === 'minimal' ? 'airy (generous whitespace)' : 'standard'}

### 7. Apply These Settings
- Use unique IDs (randomized patterns, no section-1, section-2)
- Effect intensity: ${preset.effects}
- Section spacing: appropriate for ${context.industry}
- Dark mode: ${context.industry === 'fintech' || context.industry === 'saas' ? 'required' : 'recommended'}

### Output Standards
- PageSpeed 90+ optimized
- ${context.industry === 'healthcare' ? 'WCAG 2.1 AAA' : 'WCAG 2.1 AA'} compliant
- Mobile-first responsive
- Dark mode support
- SEO structured data for ${context.industry}
`;
}

/**
 * Get quick research queries for a niche
 */
export function getNicheResearchQueries(niche: NicheType): string[] {
  const baseQueries: Record<NicheType, string[]> = {
    healthcare: [
      'healthcare website design trends 2025',
      'medical website accessibility requirements',
      'patient trust signals for healthcare',
    ],
    fintech: [
      'fintech website design best practices 2025',
      'financial services trust indicators',
      'secure payment UI patterns',
    ],
    ecommerce: [
      'ecommerce conversion optimization 2025',
      'product page best practices',
      'checkout flow optimization',
    ],
    creative: [
      'portfolio website trends 2025',
      'creative agency website examples',
      'visual storytelling in web design',
    ],
    saas: [
      'SaaS landing page best practices 2025',
      'product demo UI patterns',
      'pricing page optimization',
    ],
    education: [
      'education website design trends',
      'online learning platform UX',
      'course page best practices',
    ],
    realestate: [
      'real estate website trends 2025',
      'property listing page design',
      'real estate lead generation UI',
    ],
    restaurant: [
      'restaurant website design 2025',
      'food photography display patterns',
      'online reservation UI best practices',
    ],
  };

  return baseQueries[niche] || [`${niche} website design best practices 2025`];
}

/**
 * Get CSS variables for a niche
 */
export function getNicheCSSVariables(niche: NicheType): Record<string, string> {
  const preset = NICHE_PRESETS[niche];

  return {
    '--primary': preset.colors[0],
    '--secondary': preset.colors[1],
    '--background': preset.colors[2],
    '--surface': preset.colors[3] || preset.colors[2],
    '--animation-speed': preset.animations === 'subtle' ? '200ms' : preset.animations === 'moderate' ? '300ms' : '400ms',
    '--spacing-unit': preset.animations === 'subtle' ? '1rem' : '1.25rem',
  };
}
