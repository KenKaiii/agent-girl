import type { ProjectTemplate } from '../types';

export const obsidianPluginTemplate: ProjectTemplate = {
    id: 'obsidian-plugin',
    name: 'Obsidian Plugin',
    description: 'Obsidian knowledge base plugin with TypeScript',
    tooltip: 'Build plugins for Obsidian, the fastest-growing PKM tool (1M+ users). Monetize via GitHub Sponsors, Buy Me a Coffee, Ko-fi. Users are passionate and generous with quality plugins ($5-20/mo donations). Average user has 15-20 plugins. Examples: task management, custom views, AI integration, export tools. Revenue potential: $100-5k/mo.',
    icon: null,
    gradient: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 25%, #ffffff 50%, #A78BFA 75%, #7C3AED 100%)',
    command: 'git clone https://github.com/obsidianmd/obsidian-sample-plugin.git',
    features: [
      {
        id: 'plugin-type',
        name: 'Plugin Type',
        description: 'What your plugin provides',
        tooltip: 'Obsidian plugins can add commands, UI elements, modify editor, process files. Choose based on functionality.',
        recommended: true,
        configOptions: [
          {
            id: 'pluginType',
            label: 'Primary Functionality',
            type: 'select',
            tooltip: 'Main purpose of your plugin',
            options: [
              {
                value: 'commands',
                label: 'Commands & Actions',
                tooltip: 'Add commands to command palette. Best for: Quick actions, utilities, automation. Most common type.',
                recommended: true
              },
              {
                value: 'editor-extension',
                label: 'Editor Extensions',
                tooltip: 'Enhance markdown editor. Best for: Custom syntax, live preview features, editor shortcuts.'
              },
              {
                value: 'view',
                label: 'Custom Views',
                tooltip: 'Add new pane types (calendar, graph, timeline). Best for: Visualizations, dashboards, alternative views.'
              },
              {
                value: 'file-processing',
                label: 'File Processing',
                tooltip: 'Process/transform files. Best for: Import/export, format conversion, batch operations.'
              },
            ],
            defaultValue: 'commands',
          },
        ],
      },
      {
        id: 'ui-elements',
        name: 'UI Components',
        description: 'Add UI to Obsidian',
        tooltip: 'Plugins can add ribbons, status bar items, modals, settings tabs. Choose what UI your plugin needs.',
        recommended: true,
        configOptions: [
          {
            id: 'includeRibbon',
            label: 'Ribbon Icon',
            type: 'toggle',
            tooltip: 'Add icon to left sidebar ribbon for quick access.',
            defaultValue: true,
          },
          {
            id: 'includeStatusBar',
            label: 'Status Bar Item',
            type: 'toggle',
            tooltip: 'Add element to bottom status bar (word count, stats, indicators).',
            defaultValue: false,
          },
          {
            id: 'includeSettings',
            label: 'Settings Tab',
            type: 'toggle',
            tooltip: 'Add settings page for user configuration. Recommended for most plugins.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'data-storage',
        name: 'Data Storage',
        description: 'Save plugin data',
        tooltip: 'Store plugin settings, cache, user data. Obsidian provides Component class for resource management and cleanup.',
        recommended: true,
        configOptions: [
          {
            id: 'storageType',
            label: 'Storage Type',
            type: 'select',
            tooltip: 'How to persist plugin data',
            options: [
              {
                value: 'plugin-data',
                label: 'Plugin Data (JSON)',
                tooltip: 'Store data in .obsidian/plugins/your-plugin/data.json. Best for: Settings, user preferences, cache.',
                recommended: true
              },
              {
                value: 'vault-files',
                label: 'Vault Files',
                tooltip: 'Store in vault as markdown. Best for: User-visible data, templates, generated content.'
              },
              {
                value: 'external-sync',
                label: 'External Sync',
                tooltip: 'Sync to cloud/backend. Best for: Cross-device sync, premium features. Requires external API.'
              },
            ],
            defaultValue: 'plugin-data',
          },
        ],
      },
      {
        id: 'editor-features',
        name: 'Editor Integration',
        description: 'Extend markdown editor',
        tooltip: 'Add custom syntax, live preview extensions, editor commands. Use CodeMirror 6 (Obsidian v1.0+).',
        configOptions: [
          {
            id: 'includeEditorExtensions',
            label: 'Editor Extensions',
            type: 'toggle',
            tooltip: 'Add custom editor functionality (syntax highlighting, live preview, decorations).',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'external-integrations',
        name: 'External Integrations',
        description: 'Connect to external services',
        tooltip: 'Integrate with APIs, cloud services, AI. Popular: Notion sync, AI assistants, cloud backup.',
        configOptions: [
          {
            id: 'includeExternalApi',
            label: 'External API Access',
            type: 'toggle',
            tooltip: 'Call external APIs for sync, AI features, integrations.',
            defaultValue: false,
          },
          {
            id: 'apiType',
            label: 'Integration Type',
            type: 'select',
            tooltip: 'What to integrate with',
            options: [
              {
                value: 'none',
                label: 'No Integrations',
                tooltip: 'Local-only plugin. Best for: Privacy, offline use.',
                recommended: true
              },
              {
                value: 'ai',
                label: 'AI Services',
                tooltip: 'OpenAI, Claude, etc. Best for: AI writing, summarization, chat.'
              },
              {
                value: 'sync',
                label: 'Sync Services',
                tooltip: 'Notion, Google Drive, Dropbox. Best for: Two-way sync, backup, import/export.'
              },
              {
                value: 'custom',
                label: 'Custom Backend',
                tooltip: 'Your own API. Best for: Premium features, user accounts, cloud features.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'monetization',
        name: 'Monetization',
        description: 'GitHub Sponsors, donations',
        tooltip: 'Obsidian community supports developers via donations. Popular: GitHub Sponsors ($5-20/mo), Buy Me a Coffee, Ko-fi. Users appreciate quality plugins and support developers.',
        configOptions: [
          {
            id: 'monetizationStrategy',
            label: 'Revenue Model',
            type: 'select',
            tooltip: 'How to generate revenue',
            options: [
              {
                value: 'donations',
                label: 'Donations (GitHub Sponsors)',
                tooltip: 'Recurring donations. Best for: Community-driven, transparent development. Most common for Obsidian plugins.',
                recommended: true
              },
              {
                value: 'freemium',
                label: 'Freemium + Premium',
                tooltip: 'Free plugin + paid premium features. Best for: Advanced features, cloud sync, AI. Requires license system.'
              },
              {
                value: 'free',
                label: 'Fully Free',
                tooltip: 'No monetization. Best for: Open source, building audience, portfolio.'
              },
            ],
            defaultValue: 'donations',
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test plugin functionality',
        tooltip: 'Test plugin logic and UI. Use ESLint for code quality (recommended).',
        configOptions: [
          {
            id: 'includeTests',
            label: 'Include Tests',
            type: 'toggle',
            tooltip: 'Set up testing framework for plugin.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Publishing',
        description: 'Community plugin submission',
        tooltip: 'Submit to Obsidian Community Plugins directory for discovery. Free, reviewed by Obsidian team. Users install via Settings > Community plugins.',
        recommended: true,
        configOptions: [
          {
            id: 'publishTarget',
            label: 'Distribution',
            type: 'select',
            tooltip: 'How users will install your plugin',
            options: [
              {
                value: 'community-plugins',
                label: 'Community Plugins',
                tooltip: 'Official directory. Best for: Maximum reach, credibility, easy installation for users.',
                recommended: true
              },
              {
                value: 'manual',
                label: 'Manual Installation (GitHub)',
                tooltip: 'Users install manually. Best for: Testing, pre-release, niche plugins.'
              },
            ],
            defaultValue: 'community-plugins',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, TypeScript',
        tooltip: 'TypeScript required. Use ESLint for code quality. Component class for resource management.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage API keys',
        tooltip: 'Store API keys for external services, license keys for premium features.',
        recommended: true,
        hidden: true,
      },
    ],
};
