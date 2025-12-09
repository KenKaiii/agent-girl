import type { ProjectTemplate } from '../types';

export const adobeUxpPluginTemplate: ProjectTemplate = {
    id: 'adobe-uxp-plugin',
    name: 'Adobe UXP Plugin',
    description: 'Photoshop/Premiere Pro plugin with UXP v8.0',
    tooltip: 'Build plugins for Adobe Creative Cloud apps (Photoshop, Premiere Pro, InDesign). 22M+ Creative Cloud subscribers. Sell on Adobe Marketplace with FastSpring built-in payments. Examples: batch processors ($20-100), AI tools ($30-150), workflow automation ($15-75). Professional creators pay premium for time-savers. Revenue potential: $500-50k/mo.',
    icon: null,
    gradient: 'linear-gradient(90deg, #FF0000 0%, #FF3366 25%, #ffffff 50%, #FF3366 75%, #FF0000 100%)',
    command: 'Use Adobe UXP Developer Tool',
    features: [
      {
        id: 'target-app',
        name: 'Target Application',
        description: 'Which Adobe app to extend',
        tooltip: 'Choose which Creative Cloud application your plugin will extend. Each app has different capabilities and user bases.',
        recommended: true,
        configOptions: [
          {
            id: 'targetApp',
            label: 'Adobe Application',
            type: 'select',
            tooltip: 'Select the primary Adobe app for your plugin',
            options: [
              {
                value: 'photoshop',
                label: 'Photoshop',
                tooltip: 'Most popular (15M+ users). Best for: Image editing, batch processing, AI features, automation. UXP v8.0 with full feature set.',
                recommended: true
              },
              {
                value: 'premiere-pro',
                label: 'Premiere Pro',
                tooltip: 'Video editing (4M+ users). Best for: Video processing, effects, automation. UXP in beta, GA soon (2025).'
              },
              {
                value: 'indesign',
                label: 'InDesign',
                tooltip: 'Publishing (2M+ users). Best for: Layout automation, document processing, publishing workflows.'
              },
              {
                value: 'illustrator',
                label: 'Illustrator (Coming)',
                tooltip: 'Vector graphics. UXP support coming. Use ExtendScript for now.'
              },
            ],
            defaultValue: 'photoshop',
          },
        ],
      },
      {
        id: 'ui-framework',
        name: 'UI Framework',
        description: 'Spectrum Web Components or React',
        tooltip: 'Build plugin UI with Spectrum Web Components (Adobe\'s official design system, v0.37.0) or React. SWC recommended by Adobe for 2025.',
        recommended: true,
        configOptions: [
          {
            id: 'uiFramework',
            label: 'UI Framework',
            type: 'select',
            tooltip: 'Choose how to build your plugin interface',
            options: [
              {
                value: 'spectrum-web-components',
                label: 'Spectrum Web Components',
                tooltip: 'Adobe official recommendation (2025). 30+ components, native Adobe look, auto-theming. Best for: Professional plugins, native feel.',
                recommended: true
              },
              {
                value: 'react-swc',
                label: 'React + Spectrum WC',
                tooltip: 'React with Spectrum Web Components. Best for: Complex UIs, familiar React patterns. UXP Developer Tool has React template.'
              },
              {
                value: 'vanilla-html',
                label: 'Vanilla HTML/CSS',
                tooltip: 'Plain HTML/CSS/JS. Best for: Simple plugins, lightweight, no build complexity.'
              },
            ],
            defaultValue: 'spectrum-web-components',
          },
          {
            id: 'includeTypeScript',
            label: 'TypeScript',
            type: 'toggle',
            tooltip: 'Add TypeScript for type safety and better IDE support. Highly recommended.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'plugin-capabilities',
        name: 'Plugin Capabilities',
        description: 'What your plugin will do',
        tooltip: 'UXP v8.0 features: Action recording, Selection API, Imaging API, Text APIs, Path manipulation. Choose based on your plugin\'s purpose.',
        recommended: true,
        configOptions: [
          {
            id: 'capabilities',
            label: 'Primary Capability',
            type: 'select',
            tooltip: 'Main functionality of your plugin',
            options: [
              {
                value: 'automation',
                label: 'Workflow Automation',
                tooltip: 'Automate repetitive tasks. Use Action Recording API (v8.0). Best for: Batch processing, presets, workflows.',
                recommended: true
              },
              {
                value: 'image-processing',
                label: 'Image Processing',
                tooltip: 'Modify images. Use Imaging API (out of beta v8.0). Best for: Filters, effects, AI image generation.'
              },
              {
                value: 'selection-tools',
                label: 'Selection Tools',
                tooltip: 'Advanced selections. Use new Selection class (v8.0). Best for: Masking, cutouts, selection refinement.'
              },
              {
                value: 'text-manipulation',
                label: 'Text Tools',
                tooltip: 'Text layer creation/editing. Use enhanced Text APIs (v8.0). Best for: Typography, text effects, templates.'
              },
              {
                value: 'export-import',
                label: 'Export/Import',
                tooltip: 'File operations. Best for: Format converters, asset exporters, integrations with external services.'
              },
            ],
            defaultValue: 'automation',
          },
        ],
      },
      {
        id: 'external-apis',
        name: 'External API Integration',
        description: 'Connect to third-party services',
        tooltip: 'Call external APIs for AI features, cloud storage, or web services. Popular: OpenAI for AI, AWS S3 for storage, REST APIs for integrations.',
        configOptions: [
          {
            id: 'includeExternalApi',
            label: 'External API Access',
            type: 'toggle',
            tooltip: 'Enable network access for calling external APIs (AI services, cloud storage, etc.).',
            defaultValue: false,
          },
          {
            id: 'apiType',
            label: 'API Type',
            type: 'select',
            tooltip: 'What type of external service to integrate',
            options: [
              {
                value: 'none',
                label: 'No External APIs',
                tooltip: 'Local-only plugin. Best for: On-device processing, privacy-focused tools.',
                recommended: true
              },
              {
                value: 'ai-services',
                label: 'AI Services (OpenAI, Stability)',
                tooltip: 'AI image generation, enhancement. Best for: AI features, content generation, smart automation.'
              },
              {
                value: 'cloud-storage',
                label: 'Cloud Storage (S3, Dropbox)',
                tooltip: 'Cloud file operations. Best for: Asset sync, backups, team collaboration.'
              },
              {
                value: 'custom-api',
                label: 'Custom Backend API',
                tooltip: 'Your own backend service. Best for: User accounts, licensing, premium features.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'monetization',
        name: 'Monetization',
        description: 'Sell on Adobe Marketplace',
        tooltip: 'Adobe Marketplace uses FastSpring for payments. Choose free, paid, or freemium. Plugins range $10-200. Professional creators pay for quality tools.',
        recommended: true,
        configOptions: [
          {
            id: 'pricingModel',
            label: 'Pricing Model',
            type: 'select',
            tooltip: 'How to monetize your plugin',
            options: [
              {
                value: 'free',
                label: 'Free',
                tooltip: 'Fully free plugin. Best for: Building audience, portfolio, open source.',
                recommended: true
              },
              {
                value: 'paid',
                label: 'Paid (One-time)',
                tooltip: 'One-time purchase. Best for: Tools, utilities. Typical range: $10-75.'
              },
              {
                value: 'freemium',
                label: 'Freemium',
                tooltip: 'Free + premium features. Best for: Trial, conversion. Popular for AI features or advanced tools.'
              },
              {
                value: 'subscription',
                label: 'Subscription',
                tooltip: 'Recurring payments. Best for: Ongoing features, cloud services, regular updates.'
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
        tooltip: 'Test plugins in Adobe apps. UXP Developer Tool provides debugging and hot reload.',
        configOptions: [
          {
            id: 'includeTests',
            label: 'Include Tests',
            type: 'toggle',
            tooltip: 'Set up testing framework for plugin logic.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Publishing',
        description: 'Distribute via Adobe Marketplace',
        tooltip: 'Publish to Adobe Exchange (marketplace) for discovery. Requires review process. EU requires additional contact info (DSA compliance, Feb 2025).',
        recommended: true,
        configOptions: [
          {
            id: 'publishTarget',
            label: 'Distribution',
            type: 'select',
            tooltip: 'How users will get your plugin',
            options: [
              {
                value: 'adobe-exchange',
                label: 'Adobe Exchange (Marketplace)',
                tooltip: 'Official marketplace. Best for: Maximum reach, credibility, built-in payments via FastSpring.',
                recommended: true
              },
              {
                value: 'private',
                label: 'Private Distribution',
                tooltip: 'Manual installation. Best for: Enterprise, internal tools, testing.'
              },
            ],
            defaultValue: 'adobe-exchange',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, TypeScript, best practices',
        tooltip: 'Follow Adobe UXP best practices. Use executeAsModal for document modifications.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage API keys',
        tooltip: 'Store external API keys, licensing credentials securely.',
        recommended: true,
        hidden: true,
      },
    ],
};
