import type { ProjectTemplate } from '../types';

export const shopifyAppTemplate: ProjectTemplate = {
    id: 'shopify-app',
    name: 'Shopify App',
    description: 'Build apps for Shopify merchants with React Router',
    tooltip: 'Create apps that extend Shopify stores with custom features. Perfect for inventory management, marketing automation, upsells, analytics, or any merchant tool. Shopify has 4M+ stores and merchants actively pay $5-300/mo for good apps. Built-in billing API makes monetization easy. Examples: Oberlo, Loox, Smile.io made millions.',
    icon: null,
    gradient: 'linear-gradient(90deg, #95BF47 0%, #7AB55C 25%, #ffffff 50%, #7AB55C 75%, #95BF47 100%)',
    command: 'npm init @shopify/app@latest',
    features: [
      {
        id: 'framework',
        name: 'Framework',
        description: 'React Router (recommended) or Remix',
        tooltip: 'Shopify officially recommends React Router for new apps. Remix is being phased out but still supported for existing apps. React Router offers better performance and simpler migration path.',
        recommended: true,
        configOptions: [
          {
            id: 'appFramework',
            label: 'App Framework',
            type: 'select',
            tooltip: 'Choose React Router (recommended by Shopify) or Remix (legacy)',
            options: [
              {
                value: 'react-router',
                label: 'React Router',
                tooltip: 'Official recommendation. Better performance, modern approach. Use --template=https://github.com/Shopify/shopify-app-template-react-router',
                recommended: true
              },
              {
                value: 'remix',
                label: 'Remix (Legacy)',
                tooltip: 'Older template, still works. Only use if migrating an existing Remix app. Being phased out.'
              },
            ],
            defaultValue: 'react-router',
          },
        ],
      },
      {
        id: 'app-bridge',
        name: 'Shopify App Bridge',
        description: 'Embedded app integration',
        tooltip: 'App Bridge connects your app to Shopify admin seamlessly. Required for embedded apps (runs inside Shopify admin). Handles navigation, modals, toasts, and deep linking. Always recommended.',
        recommended: true,
        hidden: true, // Always included
      },
      {
        id: 'authentication',
        name: 'Authentication & Billing',
        description: 'OAuth and subscription billing',
        tooltip: 'OAuth lets merchants install your app securely. Billing API handles subscriptions and one-time charges. Essential for production apps.',
        recommended: true,
        configOptions: [
          {
            id: 'includeBilling',
            label: 'Billing API Setup',
            type: 'toggle',
            tooltip: 'Set up Shopify billing for recurring charges or one-time payments. Required to charge merchants for your app.',
            defaultValue: true,
          },
          {
            id: 'billingModel',
            label: 'Billing Model',
            type: 'select',
            tooltip: 'How you\'ll charge merchants for your app',
            options: [
              {
                value: 'recurring',
                label: 'Recurring Subscription',
                tooltip: 'Monthly/annual subscriptions. Best for: SaaS apps, ongoing features. Most common model ($5-300/mo).',
                recommended: true
              },
              {
                value: 'one-time',
                label: 'One-time Charge',
                tooltip: 'Single payment per merchant. Best for: Setup fees, one-off features, simple tools.'
              },
              {
                value: 'usage',
                label: 'Usage-based',
                tooltip: 'Charge based on usage (API calls, orders processed, etc.). Best for: High-volume features, variable costs.'
              },
            ],
            defaultValue: 'recurring',
          },
        ],
        autoBundles: ['env-config'],
      },
      {
        id: 'ui-library',
        name: 'Polaris UI',
        description: 'Shopify\'s admin design system',
        tooltip: 'Polaris is Shopify\'s official UI library. Gives your app a native Shopify admin look. Includes buttons, forms, cards, navigation. Always recommended for embedded apps. November 2025: Now uses Polaris Web Components for auto-theming.',
        recommended: true,
        hidden: true, // Always included with template
      },
      {
        id: 'admin-api',
        name: 'Admin API Access',
        description: 'GraphQL API for store data',
        tooltip: 'Access store data: products, orders, customers, inventory. Use GraphQL Admin API (REST removed in React Router template). Essential for any app that reads/modifies store data.',
        recommended: true,
        configOptions: [
          {
            id: 'apiScopes',
            label: 'API Scopes',
            type: 'select',
            tooltip: 'What data your app can access. Choose based on your app\'s needs.',
            options: [
              {
                value: 'read-write-products',
                label: 'Products (Read/Write)',
                tooltip: 'Access product catalog. Best for: Inventory apps, product management, import/export tools.',
                recommended: true
              },
              {
                value: 'read-write-orders',
                label: 'Orders (Read/Write)',
                tooltip: 'Access order data. Best for: Fulfillment, shipping, order management, analytics.'
              },
              {
                value: 'read-write-customers',
                label: 'Customers (Read/Write)',
                tooltip: 'Access customer data. Best for: Marketing, loyalty programs, customer management.'
              },
              {
                value: 'comprehensive',
                label: 'Comprehensive Access',
                tooltip: 'Multiple scopes for full-featured apps. Request only what you need for app review approval.'
              },
            ],
            defaultValue: 'read-write-products',
          },
        ],
      },
      {
        id: 'webhooks',
        name: 'Webhooks',
        description: 'Real-time event notifications',
        tooltip: 'Get notified when events happen in stores (new order, product update, etc.). Essential for keeping your app data in sync. Examples: send email when order placed, update inventory on fulfillment.',
        recommended: true,
        configOptions: [
          {
            id: 'webhookTopics',
            label: 'Webhook Topics',
            type: 'select',
            tooltip: 'Which store events to listen for',
            options: [
              {
                value: 'orders',
                label: 'Orders (create, update, paid)',
                tooltip: 'Track order lifecycle. Best for: Order management, fulfillment, analytics.',
                recommended: true
              },
              {
                value: 'products',
                label: 'Products (create, update, delete)',
                tooltip: 'Track product changes. Best for: Inventory sync, product management.'
              },
              {
                value: 'shop',
                label: 'Shop (update, uninstall)',
                tooltip: 'Track shop changes and app uninstalls. Essential for cleanup and GDPR compliance.'
              },
              {
                value: 'comprehensive',
                label: 'Multiple Topics',
                tooltip: 'Listen to multiple event types for full-featured apps.'
              },
            ],
            defaultValue: 'orders',
          },
        ],
      },
      {
        id: 'app-extensions',
        name: 'App Extensions',
        description: 'Extend Shopify UI surfaces',
        tooltip: 'Add UI to checkout, product pages, admin. Examples: custom checkout fields, product recommendations, admin widgets. Powerful way to integrate deeply with Shopify.',
        configOptions: [
          {
            id: 'extensionTypes',
            label: 'Extension Types',
            type: 'select',
            tooltip: 'Where in Shopify your app adds UI',
            options: [
              {
                value: 'none',
                label: 'No Extensions',
                tooltip: 'Just embedded admin app. Best for: Admin-only tools, simple apps.',
                recommended: true
              },
              {
                value: 'checkout',
                label: 'Checkout UI Extensions',
                tooltip: 'Add fields/features to checkout. Best for: Upsells, custom fields, delivery options. Shopify Plus required.'
              },
              {
                value: 'product-page',
                label: 'Theme App Extensions',
                tooltip: 'Add widgets to storefront. Best for: Reviews, wishlists, size guides. Works with any theme.'
              },
              {
                value: 'admin',
                label: 'Admin UI Extensions',
                tooltip: 'Add sections to admin pages. Best for: Quick actions, widgets on product/order pages.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'database',
        name: 'Database',
        description: 'Store app data persistently',
        tooltip: 'Store merchant settings, sync data, cache information. Separate from Shopify\'s data. Essential for any app that needs to remember data.',
        recommended: true,
        configOptions: [
          {
            id: 'dbType',
            label: 'Database',
            type: 'select',
            tooltip: 'Where to store your app\'s data',
            options: [
              {
                value: 'postgresql',
                label: 'PostgreSQL (Recommended)',
                tooltip: 'Production-ready SQL database. Free hosting: Railway, Supabase, Neon. Best for scalable apps.',
                recommended: true
              },
              {
                value: 'mongodb',
                label: 'MongoDB',
                tooltip: 'NoSQL database. Best for: Flexible schemas, document storage. Free tier: MongoDB Atlas.'
              },
              {
                value: 'sqlite',
                label: 'SQLite (Dev Only)',
                tooltip: 'File-based database. Best for: Development, testing. Not recommended for production.'
              },
            ],
            defaultValue: 'postgresql',
          },
          {
            id: 'orm',
            label: 'ORM',
            type: 'select',
            tooltip: 'Tool for working with database in TypeScript',
            options: [
              {
                value: 'prisma',
                label: 'Prisma',
                tooltip: 'Type-safe ORM with great DX. Excellent docs, migration tools. Industry standard.',
                recommended: true
              },
              {
                value: 'drizzle',
                label: 'Drizzle',
                tooltip: 'Lightweight, TypeScript-first ORM. Faster than Prisma, more manual.'
              },
            ],
            defaultValue: 'prisma',
          },
        ],
        autoBundles: ['env-config'],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test your Shopify app',
        tooltip: 'Test API calls, webhooks, UI. Essential for production apps to avoid breaking merchant stores.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Test Framework',
            type: 'select',
            tooltip: 'Testing tools for your app',
            options: [
              {
                value: 'vitest',
                label: 'Vitest',
                tooltip: 'Fast modern test runner. Best for: React Router apps, unit tests.',
                recommended: true
              },
              {
                value: 'jest',
                label: 'Jest',
                tooltip: 'Popular test framework. Good for: Remix apps, existing Jest experience.'
              },
              {
                value: 'none',
                label: 'No Testing',
                tooltip: 'Skip testing setup. Not recommended for production apps.'
              },
            ],
            defaultValue: 'vitest',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Host your Shopify app',
        tooltip: 'Deploy your app for merchants to install. Shopify apps need HTTPS and OAuth callback URLs.',
        recommended: true,
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Hosting Platform',
            type: 'select',
            tooltip: 'Where to host your Shopify app',
            options: [
              {
                value: 'shopify-spin',
                label: 'Shopify Spin (Free)',
                tooltip: 'Free hosting for development/testing. Best for: Learning, demos. Not for production.',
                recommended: true
              },
              {
                value: 'railway',
                label: 'Railway',
                tooltip: 'Easy deployment with databases. $5/mo. Best for: Production apps, quick setup.'
              },
              {
                value: 'fly',
                label: 'Fly.io',
                tooltip: 'Global edge deployment. Free tier available. Best for: Performance, worldwide merchants.'
              },
              {
                value: 'vercel',
                label: 'Vercel',
                tooltip: 'Easy deployment for React apps. Need separate database. Best for: Serverless apps.'
              },
            ],
            defaultValue: 'shopify-spin',
          },
        ],
      },
      {
        id: 'gdpr-compliance',
        name: 'GDPR & Data Compliance',
        description: 'Mandatory webhook handlers',
        tooltip: 'Shopify requires apps to handle GDPR webhooks: customer data request, data deletion, shop deletion. Mandatory for app store approval.',
        recommended: true,
        hidden: true, // Always included
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, TypeScript',
        tooltip: 'Ensure code quality. Template includes TypeScript and ESLint configs.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Variables',
        description: 'Manage API keys and secrets',
        tooltip: 'Store Shopify API keys, database URLs, secrets safely. Never commit to Git.',
        recommended: true,
        hidden: true,
      },
    ],
};
