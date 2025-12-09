/**
 * Premium Design System Presets
 * 5 professionally crafted design systems ready for instant use
 */

export interface DesignSystem {
  id: string;
  name: string;
  description: string;
  preview: string; // Thumbnail/preview image path
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border?: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  spacing: {
    section: string;
    container: string;
    element: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: string;
    easing: string;
  };
  bestFor: string[];
  tailwindConfig: string; // Generated Tailwind config
}

export const DESIGN_SYSTEMS: Record<string, DesignSystem> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines, bold typography, tech-forward aesthetic',
    preview: '/previews/modern.png',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#8B5CF6',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      muted: '#64748B',
      border: '#E2E8F0',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'JetBrains Mono',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    spacing: {
      section: '6rem',
      container: '1.5rem',
      element: '1rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
    animations: {
      duration: '200ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    bestFor: ['Tech', 'SaaS', 'Startups', 'Agencies', 'Apps'],
    tailwindConfig: `
      colors: {
        primary: { DEFAULT: '#3B82F6', 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        secondary: { DEFAULT: '#10B981', 500: '#10B981', 600: '#059669' },
        accent: { DEFAULT: '#8B5CF6', 500: '#8B5CF6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    `,
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Whitespace-focused, elegant, content-first design',
    preview: '/previews/minimal.png',
    colors: {
      primary: '#18181B',
      secondary: '#71717A',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#18181B',
      muted: '#A1A1AA',
      border: '#E4E4E7',
      success: '#22C55E',
      warning: '#EAB308',
      error: '#DC2626',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Outfit',
      mono: 'IBM Plex Mono',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
      '5xl': '3.5rem',
    },
    spacing: {
      section: '8rem',
      container: '2rem',
      element: '1.5rem',
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      full: '9999px',
    },
    shadows: {
      sm: 'none',
      md: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      lg: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
      xl: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
    },
    animations: {
      duration: '300ms',
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    bestFor: ['Portfolio', 'Photography', 'Architecture', 'Design Studios', 'Art'],
    tailwindConfig: `
      colors: {
        primary: { DEFAULT: '#18181B', 50: '#FAFAFA', 100: '#F4F4F5', 500: '#71717A', 900: '#18181B' },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    `,
  },

  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional, trustworthy, established business aesthetic',
    preview: '/previews/corporate.png',
    colors: {
      primary: '#1E40AF',
      secondary: '#0369A1',
      accent: '#7C3AED',
      background: '#FFFFFF',
      surface: '#F1F5F9',
      text: '#0F172A',
      muted: '#475569',
      border: '#CBD5E1',
      success: '#16A34A',
      warning: '#CA8A04',
      error: '#DC2626',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans',
      mono: 'Fira Code',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    spacing: {
      section: '5rem',
      container: '1.5rem',
      element: '1rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
    animations: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    bestFor: ['Finance', 'Legal', 'Healthcare', 'Consulting', 'Insurance', 'B2B'],
    tailwindConfig: `
      colors: {
        primary: { DEFAULT: '#1E40AF', 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 600: '#2563EB', 700: '#1E40AF', 800: '#1E3A8A' },
        secondary: { DEFAULT: '#0369A1', 500: '#0369A1', 600: '#0284C7' },
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    `,
  },

  playful: {
    id: 'playful',
    name: 'Playful',
    description: 'Colorful, friendly, approachable and fun design',
    preview: '/previews/playful.png',
    colors: {
      primary: '#8B5CF6',
      secondary: '#F472B6',
      accent: '#FBBF24',
      background: '#FFFBEB',
      surface: '#FEF3C7',
      text: '#1F2937',
      muted: '#6B7280',
      border: '#FCD34D',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Nunito',
      mono: 'Space Mono',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.375rem',
      '2xl': '1.625rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
      '5xl': '3.5rem',
    },
    spacing: {
      section: '5rem',
      container: '1.5rem',
      element: '1.25rem',
    },
    borderRadius: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 2px 4px 0 rgb(139 92 246 / 0.1)',
      md: '0 4px 8px -1px rgb(139 92 246 / 0.15)',
      lg: '0 8px 16px -2px rgb(139 92 246 / 0.2)',
      xl: '0 16px 32px -4px rgb(139 92 246 / 0.25)',
    },
    animations: {
      duration: '300ms',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    bestFor: ['Kids', 'Education', 'Food & Beverage', 'Lifestyle', 'Pets', 'Games', 'Events'],
    tailwindConfig: `
      colors: {
        primary: { DEFAULT: '#8B5CF6', 50: '#F5F3FF', 100: '#EDE9FE', 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED' },
        secondary: { DEFAULT: '#F472B6', 400: '#F9A8D4', 500: '#F472B6', 600: '#EC4899' },
        accent: { DEFAULT: '#FBBF24', 400: '#FCD34D', 500: '#FBBF24' },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    `,
  },

  premiumDark: {
    id: 'premiumDark',
    name: 'Premium Dark',
    description: 'Luxurious, exclusive, high-end dark aesthetic',
    preview: '/previews/premium-dark.png',
    colors: {
      primary: '#D4AF37',
      secondary: '#C0C0C0',
      accent: '#E5C890',
      background: '#0A0A0A',
      surface: '#171717',
      text: '#FAFAFA',
      muted: '#A3A3A3',
      border: '#262626',
      success: '#4ADE80',
      warning: '#FACC15',
      error: '#F87171',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
      mono: 'Source Code Pro',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.75rem',
      '5xl': '3.75rem',
    },
    spacing: {
      section: '7rem',
      container: '2rem',
      element: '1.5rem',
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 2px 4px 0 rgb(212 175 55 / 0.1)',
      md: '0 4px 8px -1px rgb(212 175 55 / 0.15)',
      lg: '0 8px 16px -2px rgb(212 175 55 / 0.2)',
      xl: '0 16px 32px -4px rgb(212 175 55 / 0.25), 0 0 60px -10px rgb(212 175 55 / 0.3)',
    },
    animations: {
      duration: '400ms',
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    bestFor: ['Luxury', 'Fashion', 'Fine Dining', 'Real Estate', 'Automotive', 'Jewelry', 'Hotels'],
    tailwindConfig: `
      colors: {
        primary: { DEFAULT: '#D4AF37', 50: '#FDF9E8', 100: '#FAF0C8', 400: '#E5C890', 500: '#D4AF37', 600: '#B8960A' },
        secondary: { DEFAULT: '#C0C0C0', 400: '#D4D4D4', 500: '#C0C0C0', 600: '#A3A3A3' },
        background: '#0A0A0A',
        surface: '#171717',
      },
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
    `,
  },
};

/**
 * Get design system by ID
 */
export function getDesignSystem(id: string): DesignSystem | undefined {
  return DESIGN_SYSTEMS[id];
}

/**
 * Get all design systems as array
 */
export function getAllDesignSystems(): DesignSystem[] {
  return Object.values(DESIGN_SYSTEMS);
}

/**
 * Find best design system for a niche
 */
export function getDesignSystemForNiche(niche: string): DesignSystem {
  const nicheLower = niche.toLowerCase();

  // Check each design system's bestFor array
  for (const system of Object.values(DESIGN_SYSTEMS)) {
    for (const category of system.bestFor) {
      if (nicheLower.includes(category.toLowerCase()) ||
          category.toLowerCase().includes(nicheLower)) {
        return system;
      }
    }
  }

  // Default to modern if no match
  return DESIGN_SYSTEMS.modern;
}

/**
 * Generate complete Tailwind config for a design system
 */
export function generateTailwindConfig(system: DesignSystem): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      ${system.tailwindConfig}
      borderRadius: {
        sm: '${system.borderRadius.sm}',
        md: '${system.borderRadius.md}',
        lg: '${system.borderRadius.lg}',
        full: '${system.borderRadius.full}',
      },
      boxShadow: {
        sm: '${system.shadows.sm}',
        md: '${system.shadows.md}',
        lg: '${system.shadows.lg}',
        xl: '${system.shadows.xl}',
      },
      spacing: {
        section: '${system.spacing.section}',
        container: '${system.spacing.container}',
        element: '${system.spacing.element}',
      },
      transitionDuration: {
        DEFAULT: '${system.animations.duration}',
      },
      transitionTimingFunction: {
        DEFAULT: '${system.animations.easing}',
      },
    },
  },
  plugins: [],
};
`;
}

/**
 * Generate CSS variables for a design system
 */
export function generateCSSVariables(system: DesignSystem): string {
  return `:root {
  /* Colors */
  --color-primary: ${system.colors.primary};
  --color-secondary: ${system.colors.secondary};
  --color-accent: ${system.colors.accent || system.colors.secondary};
  --color-background: ${system.colors.background};
  --color-surface: ${system.colors.surface};
  --color-text: ${system.colors.text};
  --color-muted: ${system.colors.muted};
  --color-border: ${system.colors.border || system.colors.muted};
  --color-success: ${system.colors.success || '#22C55E'};
  --color-warning: ${system.colors.warning || '#F59E0B'};
  --color-error: ${system.colors.error || '#EF4444'};

  /* Typography */
  --font-heading: '${system.fonts.heading}', system-ui, sans-serif;
  --font-body: '${system.fonts.body}', system-ui, sans-serif;
  --font-mono: '${system.fonts.mono}', monospace;

  /* Font Sizes */
  --text-xs: ${system.fontSizes.xs};
  --text-sm: ${system.fontSizes.sm};
  --text-base: ${system.fontSizes.base};
  --text-lg: ${system.fontSizes.lg};
  --text-xl: ${system.fontSizes.xl};
  --text-2xl: ${system.fontSizes['2xl']};
  --text-3xl: ${system.fontSizes['3xl']};
  --text-4xl: ${system.fontSizes['4xl']};
  --text-5xl: ${system.fontSizes['5xl']};

  /* Spacing */
  --spacing-section: ${system.spacing.section};
  --spacing-container: ${system.spacing.container};
  --spacing-element: ${system.spacing.element};

  /* Border Radius */
  --radius-sm: ${system.borderRadius.sm};
  --radius-md: ${system.borderRadius.md};
  --radius-lg: ${system.borderRadius.lg};
  --radius-full: ${system.borderRadius.full};

  /* Shadows */
  --shadow-sm: ${system.shadows.sm};
  --shadow-md: ${system.shadows.md};
  --shadow-lg: ${system.shadows.lg};
  --shadow-xl: ${system.shadows.xl};

  /* Animation */
  --transition-duration: ${system.animations.duration};
  --transition-easing: ${system.animations.easing};
}
`;
}

export default DESIGN_SYSTEMS;
