/**
 * Agent Girl - Section Style Presets
 * Modern effects, animations, and pre-optimized section styles
 */

export interface EffectConfig {
  css: string;
  hover?: string;
  active?: string;
  transition?: string;
  dark?: string;
}

export interface SectionConfig {
  effects: string[];
  animation: string;
  spacing: string;
  container?: string;
}

// Modern Effect Presets
export const SECTION_EFFECTS: Record<string, EffectConfig> = {
  // Soft shadows (Josh Comeau inspired)
  softShadow: {
    css: 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
    hover: 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
    transition: 'transition-shadow duration-300 ease-out',
    dark: 'dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
  },

  // Layered shadow (more depth)
  layeredShadow: {
    css: 'shadow-[0_2px_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.04)]',
    hover: 'hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.06)]',
    transition: 'transition-all duration-300 ease-out',
  },

  // Glassmorphism
  glass: {
    css: 'backdrop-blur-md bg-white/60 border border-white/20',
    dark: 'dark:bg-gray-900/60 dark:border-gray-700/30',
    hover: 'hover:bg-white/70 dark:hover:bg-gray-900/70',
    transition: 'transition-colors duration-200',
  },

  // Frosted glass (stronger blur)
  frostedGlass: {
    css: 'backdrop-blur-xl bg-white/40 border border-white/30 backdrop-saturate-150',
    dark: 'dark:bg-gray-900/40 dark:border-gray-700/40',
    transition: 'transition-all duration-200',
  },

  // Neumorphism (Soft UI)
  neumorphic: {
    css: 'shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] bg-gray-100',
    dark: 'dark:shadow-[8px_8px_16px_#1a1a2e,-8px_-8px_16px_#2d2d44] dark:bg-gray-800',
    hover: 'hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]',
    transition: 'transition-shadow duration-200',
  },

  // Inset neumorphism
  neumorphicInset: {
    css: 'shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] bg-gray-100',
    dark: 'dark:shadow-[inset_4px_4px_8px_#1a1a2e,inset_-4px_-4px_8px_#2d2d44] dark:bg-gray-800',
  },

  // Gradient mesh
  gradientMesh: {
    css: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
    dark: 'dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
  },

  // Animated gradient
  animatedGradient: {
    css: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_auto] animate-gradient',
  },

  // Subtle grain texture
  grain: {
    css: 'relative before:absolute before:inset-0 before:bg-[url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")] before:pointer-events-none',
  },
};

// Micro-interaction Hover Effects
export const HOVER_EFFECTS: Record<string, EffectConfig> = {
  lift: {
    css: '',
    hover: 'hover:-translate-y-1',
    transition: 'transition-transform duration-200 ease-out',
  },

  scale: {
    css: '',
    hover: 'hover:scale-[1.02]',
    transition: 'transition-transform duration-200 ease-out',
  },

  glow: {
    css: '',
    hover: 'hover:ring-2 hover:ring-blue-400/50 hover:ring-offset-2',
    transition: 'transition-all duration-200',
  },

  borderGlow: {
    css: 'border border-transparent',
    hover: 'hover:border-blue-400/50',
    transition: 'transition-colors duration-200',
  },

  brighten: {
    css: '',
    hover: 'hover:brightness-105',
    transition: 'transition-[filter] duration-200',
  },

  tilt: {
    css: 'transform-style-preserve-3d perspective-1000',
    hover: 'hover:rotate-1',
    transition: 'transition-transform duration-300',
  },
};

// Animation Keyframes (add to tailwind.config)
export const ANIMATIONS = {
  fadeUp: {
    keyframes: {
      '0%': { opacity: '0', transform: 'translateY(20px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    class: 'animate-fade-up',
    duration: '0.5s',
  },

  fadeIn: {
    keyframes: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    class: 'animate-fade-in',
    duration: '0.4s',
  },

  slideIn: {
    keyframes: {
      '0%': { opacity: '0', transform: 'translateX(-20px)' },
      '100%': { opacity: '1', transform: 'translateX(0)' },
    },
    class: 'animate-slide-in',
    duration: '0.4s',
  },

  scaleIn: {
    keyframes: {
      '0%': { opacity: '0', transform: 'scale(0.95)' },
      '100%': { opacity: '1', transform: 'scale(1)' },
    },
    class: 'animate-scale-in',
    duration: '0.3s',
  },

  staggerFade: {
    class: 'animate-stagger-fade',
    staggerDelay: '0.1s',
  },

  pulseSubtle: {
    keyframes: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.85' },
    },
    class: 'animate-pulse-subtle',
    duration: '2s',
  },

  gradient: {
    keyframes: {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
    class: 'animate-gradient',
    duration: '3s',
  },
};

// Pre-optimized Section Templates
export const SECTION_TEMPLATES: Record<string, SectionConfig> = {
  hero: {
    effects: ['gradientMesh', 'softShadow'],
    animation: 'fadeUp',
    spacing: 'py-20 lg:py-32',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  },

  heroGlass: {
    effects: ['frostedGlass', 'softShadow'],
    animation: 'fadeUp',
    spacing: 'py-24 lg:py-40',
    container: 'max-w-6xl mx-auto px-4',
  },

  features: {
    effects: ['glass', 'lift'],
    animation: 'staggerFade',
    spacing: 'py-16 lg:py-24',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  },

  featuresCards: {
    effects: ['softShadow', 'lift', 'scale'],
    animation: 'fadeUp',
    spacing: 'py-16 lg:py-24',
  },

  testimonials: {
    effects: ['neumorphic', 'scale'],
    animation: 'slideIn',
    spacing: 'py-12 lg:py-20',
  },

  testimonialsGlass: {
    effects: ['glass', 'softShadow'],
    animation: 'fadeIn',
    spacing: 'py-16 lg:py-24',
  },

  cta: {
    effects: ['gradientMesh', 'glow'],
    animation: 'pulseSubtle',
    spacing: 'py-16 lg:py-24',
  },

  ctaBold: {
    effects: ['animatedGradient', 'layeredShadow'],
    animation: 'scaleIn',
    spacing: 'py-20 lg:py-32',
  },

  pricing: {
    effects: ['softShadow', 'lift', 'borderGlow'],
    animation: 'staggerFade',
    spacing: 'py-16 lg:py-24',
  },

  stats: {
    effects: ['glass', 'softShadow'],
    animation: 'fadeUp',
    spacing: 'py-12 lg:py-16',
  },

  logos: {
    effects: ['brighten'],
    animation: 'fadeIn',
    spacing: 'py-8 lg:py-12',
  },

  footer: {
    effects: ['grain'],
    animation: 'fadeIn',
    spacing: 'py-12 lg:py-16',
  },
};

// Helper to combine effects
export function combineEffects(effectNames: string[]): string {
  const allEffects = { ...SECTION_EFFECTS, ...HOVER_EFFECTS };

  return effectNames
    .map((name) => {
      const effect = allEffects[name];
      if (!effect) return '';
      return [effect.css, effect.hover, effect.transition, effect.dark]
        .filter(Boolean)
        .join(' ');
    })
    .join(' ');
}

// Get complete section classes
export function getSectionClasses(templateName: string): string {
  const template = SECTION_TEMPLATES[templateName];
  if (!template) return '';

  const effectClasses = combineEffects(template.effects);
  const animationClass = ANIMATIONS[template.animation as keyof typeof ANIMATIONS]?.class || '';

  return `${template.spacing} ${effectClasses} ${animationClass}`.trim();
}

// Get container classes
export function getContainerClasses(templateName: string): string {
  const template = SECTION_TEMPLATES[templateName];
  return template?.container || 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
}

// Generate Tailwind config additions
export function getTailwindAnimationConfig(): object {
  const keyframes: Record<string, object> = {};
  const animation: Record<string, string> = {};

  Object.entries(ANIMATIONS).forEach(([name, config]) => {
    if ('keyframes' in config && config.keyframes) {
      keyframes[name] = config.keyframes;
      const duration = 'duration' in config ? config.duration : '0.3s';
      animation[name] = `${name} ${duration} ease-out`;
    }
  });

  return { keyframes, animation };
}
