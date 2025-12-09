import type { ProjectTemplate } from '../types';

export const raycastExtensionTemplate: ProjectTemplate = {
    id: 'raycast-extension',
    name: 'Raycast Extension',
    description: 'Raycast extension with React and TypeScript',
    tooltip: 'Build extensions for Raycast, the productivity tool for Mac power users. Growing platform with early mover advantage. Raycast adding paid extensions soon. Tech-savvy users pay premium. Perfect for launchers, quick actions, API integrations, or workflow tools. Examples: GitHub, Jira, Calendar integrations.',
    icon: null,
    gradient: 'linear-gradient(90deg, #FF6363 0%, #FF8A8A 25%, #ffffff 50%, #FF8A8A 75%, #FF6363 100%)',
    command: 'npm create raycast-extension',
    features: [
      {
        id: 'extension-template',
        name: 'Extension Template',
        description: 'Starting template type',
        tooltip: 'Raycast provides templates for different extension types. Choose based on your use case.',
        recommended: true,
        configOptions: [
          {
            id: 'templateType',
            label: 'Template Type',
            type: 'select',
            tooltip: 'Type of Raycast extension to create',
            options: [
              {
                value: 'hello-world',
                label: 'Hello World (Command)',
                tooltip: 'Simple command template. Best for: Quick actions, learning, basic commands.',
                recommended: true
              },
              {
                value: 'list',
                label: 'List Template',
                tooltip: 'Display searchable lists. Best for: Browsing items, selections, catalogs.'
              },
              {
                value: 'form',
                label: 'Form Template',
                tooltip: 'Input forms with various fields. Best for: Data entry, configurations, settings.'
              },
              {
                value: 'menu-bar',
                label: 'Menu Bar',
                tooltip: 'Menu bar extra. Best for: Always-visible info, quick status, notifications.'
              },
            ],
            defaultValue: 'hello-world',
          },
        ],
      },
      {
        id: 'ui-components',
        name: 'UI Components',
        description: 'Raycast UI elements',
        tooltip: 'Raycast provides built-in React components (List, Detail, Form, etc). Use these for consistent UX.',
        recommended: true,
        hidden: true, // Always included
      },
      {
        id: 'preferences',
        name: 'User Preferences',
        description: 'Extension settings',
        tooltip: 'Let users configure your extension. Add API keys, default values, toggles. Appears in Raycast settings.',
        recommended: true,
        configOptions: [
          {
            id: 'includePreferences',
            label: 'Extension Preferences',
            type: 'toggle',
            tooltip: 'Add configurable settings for your extension.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'external-apis',
        name: 'API Integration',
        description: 'Connect to external services',
        tooltip: 'Call third-party APIs (GitHub, Jira, Notion, etc). Most Raycast extensions integrate with web services.',
        recommended: true,
        configOptions: [
          {
            id: 'apiType',
            label: 'API Integration',
            type: 'select',
            tooltip: 'What external service to integrate',
            options: [
              {
                value: 'none',
                label: 'No External API',
                tooltip: 'Local-only extension. Best for: Utilities, calculations, local file operations.',
                recommended: true
              },
              {
                value: 'rest',
                label: 'REST API',
                tooltip: 'Integrate REST APIs. Best for: Most web services, standard HTTP APIs.'
              },
              {
                value: 'graphql',
                label: 'GraphQL API',
                tooltip: 'Integrate GraphQL APIs (GitHub, Shopify, etc). Best for: Complex queries, efficient data fetching.'
              },
            ],
            defaultValue: 'none',
          },
          {
            id: 'includeOAuth',
            label: 'OAuth Support',
            type: 'toggle',
            tooltip: 'Add OAuth authentication for APIs. Raycast has built-in OAuth support (2025 update).',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'storage',
        name: 'Local Storage',
        description: 'Cache and persist data',
        tooltip: 'Store data locally for offline use, caching, faster load times. Use Raycast Storage/Cache APIs.',
        configOptions: [
          {
            id: 'includeStorage',
            label: 'Local Storage',
            type: 'toggle',
            tooltip: 'Use Raycast Storage API to save data locally.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'background-refresh',
        name: 'Background Refresh',
        description: 'Auto-update data',
        tooltip: 'Refresh data in background for menu bar commands. Great for status monitors, notifications.',
        configOptions: [
          {
            id: 'includeBackground',
            label: 'Background Updates',
            type: 'toggle',
            tooltip: 'Enable background refresh for menu bar commands (interval-based).',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'utilities',
        name: 'Raycast Utilities',
        description: 'Helper functions and best practices',
        tooltip: 'Raycast provides @raycast/utils package with helpers for async, caching, fetching. Recommended for all extensions.',
        recommended: true,
        hidden: true, // Always included in 2025 templates
      },
      {
        id: 'monetization',
        name: 'Monetization (Coming Soon)',
        description: 'Paid extensions via Raycast Store',
        tooltip: 'Raycast is adding paid extension support. Early extensions will have advantage. Plan for future monetization.',
        configOptions: [
          {
            id: 'planMonetization',
            label: 'Plan for Monetization',
            type: 'toggle',
            tooltip: 'Structure extension for future paid features (licensing placeholder, premium features gates).',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test extension functionality',
        tooltip: 'Test extension logic, API calls, UI. Raycast extensions are React apps - use standard testing tools.',
        configOptions: [
          {
            id: 'includeTests',
            label: 'Include Tests',
            type: 'toggle',
            tooltip: 'Set up Vitest for unit testing extension logic.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Publishing',
        description: 'Publish to Raycast Store',
        tooltip: 'Publish to Raycast Store (free for now, paid coming). Extensions are reviewed before approval.',
        recommended: true,
        configOptions: [
          {
            id: 'publishTarget',
            label: 'Distribution',
            type: 'select',
            tooltip: 'How users will get your extension',
            options: [
              {
                value: 'raycast-store',
                label: 'Raycast Store',
                tooltip: 'Official store. Best for: Maximum reach, credibility. Required for paid extensions.',
                recommended: true
              },
              {
                value: 'private',
                label: 'Private / Import',
                tooltip: 'Manual import via GitHub. Best for: Personal tools, pre-release testing.'
              },
            ],
            defaultValue: 'raycast-store',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, TypeScript',
        tooltip: 'TypeScript required for Raycast extensions. Template includes ESLint config.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage API keys',
        tooltip: 'Store API keys via preferences or environment variables.',
        recommended: true,
        hidden: true,
      },
    ],
};
