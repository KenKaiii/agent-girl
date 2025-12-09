import type { ProjectTemplate } from '../types';

export const wordpressPluginTemplate: ProjectTemplate = {
    id: 'wordpress-plugin',
    name: 'WordPress Plugin',
    description: 'Modern WordPress plugin with React admin panel',
    tooltip: 'Create WordPress plugins with modern tooling. 40% of all websites run WordPress (810M+ sites). Sell plugins as freemium with premium licenses at $50-300/year. Examples: WPForms ($20M+/year), Advanced Custom Fields, Yoast SEO. Perfect for SEO tools, form builders, security, backups, or any WordPress enhancement.',
    icon: null,
    gradient: 'linear-gradient(90deg, #21759B 0%, #3C9CD7 25%, #ffffff 50%, #3C9CD7 75%, #21759B 100%)',
    command: 'wp scaffold plugin',
    features: [
      {
        id: 'php-architecture',
        name: 'PHP Architecture',
        description: 'Object-oriented PHP structure',
        tooltip: 'Modern OOP approach with namespaces, autoloading, and dependency injection. Better than procedural PHP for maintainable plugins.',
        recommended: true,
        hidden: true, // Always included
      },
      {
        id: 'admin-panel',
        name: 'Admin Panel',
        description: 'React-based settings interface',
        tooltip: 'Build admin UI with React instead of PHP templates. Use @wordpress/components for native WordPress look. Modern, interactive, easier to maintain.',
        recommended: true,
        configOptions: [
          {
            id: 'uiFramework',
            label: 'Admin UI Framework',
            type: 'select',
            tooltip: 'How to build your admin interface',
            options: [
              {
                value: 'wordpress-components',
                label: '@wordpress/components',
                tooltip: 'Official WordPress React components. Native admin look, accessible. Best for most plugins.',
                recommended: true
              },
              {
                value: 'custom-react',
                label: 'Custom React UI',
                tooltip: 'Build your own UI with React. Best for: Unique designs, custom branding.'
              },
              {
                value: 'php-templates',
                label: 'PHP Templates (Classic)',
                tooltip: 'Traditional WordPress approach. Best for: Simple plugins, no build step needed.'
              },
            ],
            defaultValue: 'wordpress-components',
          },
        ],
      },
      {
        id: 'build-system',
        name: 'Build System',
        description: 'Compile and bundle assets',
        tooltip: '@wordpress/scripts provides webpack setup for React, TypeScript, SCSS. Auto-handles dependencies, asset generation, hot reload.',
        recommended: true,
        configOptions: [
          {
            id: 'buildTool',
            label: 'Build Tool',
            type: 'select',
            tooltip: 'How to compile TypeScript/React code',
            options: [
              {
                value: 'wp-scripts',
                label: '@wordpress/scripts',
                tooltip: 'Official WordPress build tool. Webpack-based, zero config. Best for standard plugins.',
                recommended: true
              },
              {
                value: 'vite',
                label: 'Vite',
                tooltip: 'Faster builds, modern tooling. Best for: Large plugins, custom setup, better DX.'
              },
            ],
            defaultValue: 'wp-scripts',
          },
          {
            id: 'includeTypeScript',
            label: 'TypeScript',
            type: 'toggle',
            tooltip: 'Add TypeScript for both React and type checking. Recommended for modern development.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'gutenberg-blocks',
        name: 'Gutenberg Blocks',
        description: 'Custom WordPress blocks',
        tooltip: 'Add custom blocks to WordPress block editor (Gutenberg). Great for adding features to posts/pages. Examples: pricing tables, testimonials, custom forms.',
        configOptions: [
          {
            id: 'includeBlocks',
            label: 'Include Custom Blocks',
            type: 'toggle',
            tooltip: 'Scaffold example Gutenberg block. Use @wordpress/blocks API and React.',
            defaultValue: false,
          },
          {
            id: 'blockType',
            label: 'Block Template',
            type: 'select',
            tooltip: 'Type of block to scaffold',
            options: [
              {
                value: 'static',
                label: 'Static Block',
                tooltip: 'Simple content block. Best for: Text, images, static content.',
                recommended: true
              },
              {
                value: 'dynamic',
                label: 'Dynamic Block',
                tooltip: 'PHP-rendered block. Best for: Database queries, dynamic content, posts lists.'
              },
              {
                value: 'interactive',
                label: 'Interactive Block',
                tooltip: 'Block with frontend JS. Best for: Forms, calculators, interactive widgets.'
              },
            ],
            defaultValue: 'static',
          },
        ],
      },
      {
        id: 'rest-api',
        name: 'REST API Endpoints',
        description: 'Custom API routes',
        tooltip: 'Add custom REST API endpoints for your plugin. Communicate between React admin and PHP backend, or expose data to external apps.',
        recommended: true,
        configOptions: [
          {
            id: 'includeRestApi',
            label: 'Custom API Routes',
            type: 'toggle',
            tooltip: 'Add REST API endpoints with proper authentication and validation.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'database',
        name: 'Custom Database Tables',
        description: 'Plugin-specific data storage',
        tooltip: 'Create custom database tables for your plugin data. Better than storing everything in wp_options for large datasets.',
        configOptions: [
          {
            id: 'includeCustomTables',
            label: 'Custom Tables',
            type: 'toggle',
            tooltip: 'Generate migration system for custom database tables with $wpdb wrapper.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'cpt-taxonomies',
        name: 'Custom Post Types & Taxonomies',
        description: 'Register custom content types',
        tooltip: 'Add custom post types (like "Products", "Portfolio") and taxonomies (like categories). Great for plugins that manage custom content.',
        configOptions: [
          {
            id: 'includeCpt',
            label: 'Custom Post Types',
            type: 'toggle',
            tooltip: 'Add example custom post type registration with admin UI.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'licensing',
        name: 'License Key System',
        description: 'Sell premium versions',
        tooltip: 'Add license key validation for premium features. Essential for selling premium plugins. Works with EDD, WooCommerce, or custom API.',
        configOptions: [
          {
            id: 'licenseSystem',
            label: 'License Provider',
            type: 'select',
            tooltip: 'How to validate license keys',
            options: [
              {
                value: 'none',
                label: 'No Licensing',
                tooltip: 'Free plugin only. Best for: Building audience, freemium later.',
                recommended: true
              },
              {
                value: 'edd',
                label: 'Easy Digital Downloads',
                tooltip: 'Popular WordPress license system. Best for: Selling via your site, proven solution.'
              },
              {
                value: 'freemius',
                label: 'Freemius',
                tooltip: 'Complete monetization platform. Handles licensing, updates, analytics. Best for: Quick launch, less work.'
              },
              {
                value: 'custom',
                label: 'Custom License API',
                tooltip: 'Build your own license validation. Best for: Full control, custom business logic.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'auto-updates',
        name: 'Auto-Update System',
        description: 'Plugin update mechanism',
        tooltip: 'Enable automatic updates for premium plugins (not hosted on WordPress.org). Users get updates via WordPress admin.',
        configOptions: [
          {
            id: 'updateMechanism',
            label: 'Update System',
            type: 'select',
            tooltip: 'How plugin updates are delivered',
            options: [
              {
                value: 'wp-org',
                label: 'WordPress.org (Free)',
                tooltip: 'Host on WP.org plugin directory. Free, automatic. Best for: Free plugins only.',
                recommended: true
              },
              {
                value: 'custom-api',
                label: 'Custom Update API',
                tooltip: 'Self-hosted updates. Best for: Premium plugins, full control. Requires license check.'
              },
            ],
            defaultValue: 'wp-org',
          },
        ],
      },
      {
        id: 'i18n',
        name: 'Internationalization',
        description: 'Multi-language support',
        tooltip: 'Make plugin translatable. WordPress has global audience. Proper i18n increases market reach.',
        recommended: true,
        hidden: true, // Always included
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test plugin functionality',
        tooltip: 'Test PHP and JavaScript code. Essential to avoid breaking WordPress sites.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Test Framework',
            type: 'select',
            tooltip: 'Testing tools for your plugin',
            options: [
              {
                value: 'phpunit',
                label: 'PHPUnit + Jest',
                tooltip: 'PHP unit tests + JS tests. Best for: Complete coverage, standard approach.',
                recommended: true
              },
              {
                value: 'phpunit-only',
                label: 'PHPUnit Only',
                tooltip: 'PHP tests only. Best for: Minimal JS, backend-focused plugins.'
              },
              {
                value: 'none',
                label: 'No Testing',
                tooltip: 'Skip testing setup. Not recommended for production plugins.'
              },
            ],
            defaultValue: 'phpunit',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Publish to WordPress.org or sell direct',
        tooltip: 'Deploy to WordPress.org for free distribution or sell via your site. WordPress.org has 60K+ plugins.',
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Distribution',
            type: 'select',
            tooltip: 'How users will get your plugin',
            options: [
              {
                value: 'wp-org',
                label: 'WordPress.org',
                tooltip: 'Free plugin directory. Best for: Building audience, freemium model, credibility.',
                recommended: true
              },
              {
                value: 'premium',
                label: 'Premium (Direct Sales)',
                tooltip: 'Sell on your site. Best for: Premium-only plugins, higher margins. Use with licensing.'
              },
            ],
            defaultValue: 'wp-org',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'PHP CodeSniffer, ESLint, Prettier',
        tooltip: 'Follow WordPress coding standards. Required for WordPress.org approval.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage API keys and secrets',
        tooltip: 'Store license API keys, third-party credentials safely.',
        recommended: true,
        hidden: true,
      },
    ],
};
