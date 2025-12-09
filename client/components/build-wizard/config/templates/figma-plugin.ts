import type { ProjectTemplate } from '../types';

export const figmaPluginTemplate: ProjectTemplate = {
    id: 'figma-plugin',
    name: 'Figma Plugin',
    description: 'Figma plugin with TypeScript and React',
    tooltip: 'Build plugins for Figma, used by 4M+ designers. Sell on FigPlug, Gumroad, or subscription services. Designers pay for time-savers. Examples: Iconify, Unsplash, AI tools. Perfect for icon libraries, asset management, AI generation, export tools, or design automation.',
    icon: null,
    gradient: 'linear-gradient(90deg, #F24E1E 0%, #FF7262 25%, #ffffff 50%, #FF7262 75%, #F24E1E 100%)',
    command: 'npx create-figma-plugin',
    features: [
      {
        id: 'plugin-type',
        name: 'Plugin Type',
        description: 'UI plugin or widget',
        tooltip: 'UI Plugin = runs in panel with custom UI. Widget = interactive elements on canvas (like sticky notes). Most plugins are UI type.',
        recommended: true,
        configOptions: [
          {
            id: 'pluginType',
            label: 'Plugin Type',
            type: 'select',
            tooltip: 'What type of Figma plugin to create',
            options: [
              {
                value: 'ui',
                label: 'UI Plugin',
                tooltip: 'Plugin with custom UI panel. Best for: Tools, generators, exporters. Most common type.',
                recommended: true
              },
              {
                value: 'widget',
                label: 'FigJam Widget',
                tooltip: 'Interactive canvas element. Best for: Collaboration tools, sticky notes, voting. FigJam only.'
              },
              {
                value: 'both',
                label: 'Plugin + Widget',
                tooltip: 'Combine plugin and widget. Best for: Full-featured tools with canvas integration.'
              },
            ],
            defaultValue: 'ui',
          },
        ],
      },
      {
        id: 'ui-framework',
        name: 'UI Framework',
        description: 'Build plugin interface',
        tooltip: 'Choose how to build your plugin UI. React recommended for complex interfaces.',
        recommended: true,
        configOptions: [
          {
            id: 'uiFramework',
            label: 'UI Framework',
            type: 'select',
            tooltip: 'Framework for building plugin UI',
            options: [
              {
                value: 'react',
                label: 'React + TypeScript',
                tooltip: 'React for UI. Best for: Complex interfaces, reusable components. create-figma-plugin handles setup.',
                recommended: true
              },
              {
                value: 'vanilla',
                label: 'Vanilla HTML/CSS',
                tooltip: 'Plain HTML/CSS/JS. Best for: Simple UIs, lightweight plugins, less build complexity.'
              },
              {
                value: 'preact',
                label: 'Preact',
                tooltip: 'Lightweight React alternative. Best for: Smaller bundle size, React-like DX.'
              },
            ],
            defaultValue: 'react',
          },
        ],
      },
      {
        id: 'plugin-capabilities',
        name: 'Plugin Capabilities',
        description: 'What your plugin can do',
        tooltip: 'Figma plugins can read/modify designs, access files, work with components. Choose based on your plugin\'s purpose.',
        recommended: true,
        configOptions: [
          {
            id: 'capabilities',
            label: 'Plugin Capabilities',
            type: 'select',
            tooltip: 'What your plugin will do in Figma',
            options: [
              {
                value: 'read-write',
                label: 'Read & Modify Designs',
                tooltip: 'Access and change layers, styles, components. Best for: Generators, converters, automation tools.',
                recommended: true
              },
              {
                value: 'read-only',
                label: 'Read Only',
                tooltip: 'Read design data without modification. Best for: Exporters, analyzers, documentation tools.'
              },
              {
                value: 'ui-only',
                label: 'UI Only (No File Access)',
                tooltip: 'Custom UI without design file access. Best for: External tools, dashboards, integrations.'
              },
            ],
            defaultValue: 'read-write',
          },
        ],
      },
      {
        id: 'network-access',
        name: 'Network & External APIs',
        description: 'Call external services',
        tooltip: 'Connect to AI APIs, asset libraries, databases. Requires network permission in manifest. Common for AI plugins, icon libraries.',
        configOptions: [
          {
            id: 'includeNetworkAccess',
            label: 'Network Access',
            type: 'toggle',
            tooltip: 'Enable external API calls (OpenAI, image CDNs, etc.). Adds network permission to manifest.',
            defaultValue: false,
          },
          {
            id: 'apiIntegration',
            label: 'API Type',
            type: 'select',
            tooltip: 'What external services to integrate',
            options: [
              {
                value: 'none',
                label: 'No External APIs',
                tooltip: 'Local-only plugin. Best for: No external dependencies.',
                recommended: true
              },
              {
                value: 'ai',
                label: 'AI Services (OpenAI, etc)',
                tooltip: 'AI image generation, text processing. Best for: AI design tools, automation.'
              },
              {
                value: 'assets',
                label: 'Asset APIs (Icons, Images)',
                tooltip: 'Fetch assets from CDNs or APIs. Best for: Icon libraries, image search, stock photos.'
              },
              {
                value: 'custom',
                label: 'Custom Backend',
                tooltip: 'Your own API for data sync, licensing. Best for: Premium features, user accounts.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'data-storage',
        name: 'Data Storage',
        description: 'Save plugin data',
        tooltip: 'Store user preferences, cache data. Use clientStorage API (local) or external database for sync across devices.',
        configOptions: [
          {
            id: 'storageType',
            label: 'Storage Type',
            type: 'select',
            tooltip: 'Where to store plugin data',
            options: [
              {
                value: 'client-storage',
                label: 'Client Storage (Local)',
                tooltip: 'Store data locally in Figma. Best for: User preferences, cached data. Free, built-in.',
                recommended: true
              },
              {
                value: 'cloud-sync',
                label: 'Cloud Sync',
                tooltip: 'Sync data across devices. Best for: User accounts, premium features. Requires backend.'
              },
            ],
            defaultValue: 'client-storage',
          },
        ],
      },
      {
        id: 'monetization',
        name: 'Monetization',
        description: 'Sell your plugin',
        tooltip: 'Sell plugins via FigPlug (marketplace), Gumroad (one-time), or subscription service. Add license validation.',
        configOptions: [
          {
            id: 'monetizationModel',
            label: 'Business Model',
            type: 'select',
            tooltip: 'How to monetize your plugin',
            options: [
              {
                value: 'free',
                label: 'Free Plugin',
                tooltip: 'Completely free. Best for: Building audience, portfolio, open source.',
                recommended: true
              },
              {
                value: 'figplug',
                label: 'FigPlug Marketplace',
                tooltip: 'Sell on FigPlug. Best for: Discovery, marketplace credibility. They handle payments.'
              },
              {
                value: 'gumroad',
                label: 'Gumroad (One-time)',
                tooltip: 'Sell via Gumroad. Best for: One-time purchases, simple licensing. Use license keys.'
              },
              {
                value: 'subscription',
                label: 'Subscription Service',
                tooltip: 'Monthly/annual subscriptions. Best for: SaaS plugins with ongoing value, cloud features.'
              },
            ],
            defaultValue: 'free',
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test plugin functionality',
        tooltip: 'Test plugin logic, UI, and Figma API interactions. Important for stable releases.',
        configOptions: [
          {
            id: 'includeTests',
            label: 'Include Tests',
            type: 'toggle',
            tooltip: 'Set up Vitest for unit tests. create-figma-plugin has built-in test support.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Publishing',
        description: 'Publish to Figma Community',
        tooltip: 'Publish to Figma Community (free) or sell on FigPlug/Gumroad. Community has millions of users.',
        recommended: true,
        configOptions: [
          {
            id: 'publishTarget',
            label: 'Distribution',
            type: 'select',
            tooltip: 'Where users will get your plugin',
            options: [
              {
                value: 'figma-community',
                label: 'Figma Community (Free)',
                tooltip: 'Free plugin directory. Best for: Maximum reach, credibility, portfolio.',
                recommended: true
              },
              {
                value: 'private',
                label: 'Private / Organization',
                tooltip: 'Private distribution for teams. Best for: Internal tools, enterprise plugins.'
              },
            ],
            defaultValue: 'figma-community',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, TypeScript',
        tooltip: 'TypeScript required by Figma. create-figma-plugin handles build config.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage API keys',
        tooltip: 'Store API keys for external services (AI, assets, licensing).',
        recommended: true,
        hidden: true,
      },
    ],
};
