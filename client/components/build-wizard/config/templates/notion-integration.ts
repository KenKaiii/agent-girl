import type { ProjectTemplate } from '../types';

export const notionIntegrationTemplate: ProjectTemplate = {
    id: 'notion-integration',
    name: 'Notion Integration',
    description: 'Notion API integration with OAuth 2.0',
    tooltip: 'Build integrations for Notion (30M+ users, huge enterprise adoption). Create SaaS tools, automation, AI features, custom databases. Sell subscriptions $10-99/mo. Popular niches: CRM for Notion, automation, AI assistants, template marketplaces. Latest API: v2025-09-03 ("databases" → "data sources"). Revenue potential: $200-15k/mo.',
    icon: null,
    gradient: 'linear-gradient(90deg, #FFFFFF 0%, #E8E8E8 100%)',
    command: 'npm create next-app@latest',
    features: [
      {
        id: 'integration-type',
        name: 'Integration Type',
        description: 'Internal or Public OAuth integration',
        tooltip: 'Internal = Single workspace, token-based auth. Public = Multi-workspace, OAuth 2.0. Choose based on distribution.',
        recommended: true,
        configOptions: [
          {
            id: 'integrationType',
            label: 'Integration Type',
            type: 'select',
            tooltip: 'Authentication and distribution model',
            options: [
              {
                value: 'public-oauth',
                label: 'Public Integration (OAuth 2.0)',
                tooltip: 'Multi-workspace with OAuth. Best for: SaaS products, marketplace apps, public distribution. Required for selling.',
                recommended: true
              },
              {
                value: 'internal',
                label: 'Internal Integration',
                tooltip: 'Single workspace, token-based. Best for: Personal tools, team automation, testing. Simpler auth, no review.'
              },
            ],
            defaultValue: 'public-oauth',
          },
        ],
      },
      {
        id: 'framework',
        name: 'Framework',
        description: 'Next.js with Notion SDK',
        tooltip: 'Next.js recommended for full-stack. Use @notionhq/client v5.1.0+ (latest 2025). API routes for OAuth, serverless functions for automation.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'notion-features',
        name: 'Notion Features',
        description: 'What to build with Notion API',
        tooltip: 'Notion API v2025-09-03: data sources (formerly databases), pages, blocks, users. Popular: automation, custom views, AI features.',
        recommended: true,
        configOptions: [
          {
            id: 'featureType',
            label: 'Primary Functionality',
            type: 'select',
            tooltip: 'Main feature of your integration',
            options: [
              {
                value: 'automation',
                label: 'Automation & Sync',
                tooltip: 'Automate tasks, sync data. Best for: Recurring tasks, data sync, webhooks. Popular: CRM updates, task automation.',
                recommended: true
              },
              {
                value: 'crm',
                label: 'CRM System',
                tooltip: 'Customer relationship management. Best for: Sales pipelines, contact management, deal tracking. Hot niche!'
              },
              {
                value: 'ai-assistant',
                label: 'AI Assistant',
                tooltip: 'AI-powered features. Best for: Summarization, writing, chat, content generation. High-value, premium pricing.'
              },
              {
                value: 'custom-views',
                label: 'Custom Views/Dashboards',
                tooltip: 'Visualize Notion data differently. Best for: Charts, timelines, calendars, analytics. Alternative to Notion\'s built-in views.'
              },
              {
                value: 'templates',
                label: 'Template Marketplace',
                tooltip: 'Sell/share Notion templates. Best for: Pre-built databases, workflows. Can bundle with integration features.'
              },
            ],
            defaultValue: 'automation',
          },
        ],
      },
      {
        id: 'oauth-setup',
        name: 'OAuth 2.0 Configuration',
        description: 'Public integration authentication',
        tooltip: 'OAuth 2.0 for public integrations. Users grant access to their workspaces. Token exchange, redirect URIs, scopes. Notion API handles OAuth flow.',
        recommended: true,
        configOptions: [
          {
            id: 'includeOAuth',
            label: 'Setup OAuth 2.0',
            type: 'toggle',
            tooltip: 'Add OAuth flow for public integrations. Required for multi-workspace apps.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'database-integration',
        name: 'Data Sources (Databases)',
        description: 'Work with Notion data sources',
        tooltip: 'API v2025-09-03 renamed "databases" to "data sources". Query, create, update. Most integrations need this.',
        recommended: true,
        configOptions: [
          {
            id: 'databaseOperations',
            label: 'Database Operations',
            type: 'select',
            tooltip: 'What to do with Notion data sources',
            options: [
              {
                value: 'read-write',
                label: 'Read & Write',
                tooltip: 'Full CRUD operations. Best for: CRM, automation, sync. Most common.',
                recommended: true
              },
              {
                value: 'read-only',
                label: 'Read Only',
                tooltip: 'Query data only. Best for: Dashboards, analytics, reporting.'
              },
              {
                value: 'write-only',
                label: 'Write Only',
                tooltip: 'Create entries. Best for: Forms, data collection, imports.'
              },
            ],
            defaultValue: 'read-write',
          },
        ],
      },
      {
        id: 'external-integrations',
        name: 'External Integrations',
        description: 'Connect Notion to other services',
        tooltip: 'Integrate Notion with Slack, Gmail, Shopify, Stripe, etc. Most valuable integrations connect Notion to other tools.',
        configOptions: [
          {
            id: 'externalApis',
            label: 'External Services',
            type: 'select',
            tooltip: 'What services to connect with Notion',
            options: [
              {
                value: 'none',
                label: 'Notion Only',
                tooltip: 'No external integrations. Best for: Notion-only features, templates.',
                recommended: true
              },
              {
                value: 'productivity',
                label: 'Productivity (Slack, Gmail)',
                tooltip: 'Connect to communication tools. Best for: Notifications, task sync, team collaboration.'
              },
              {
                value: 'ecommerce',
                label: 'E-commerce (Shopify, Stripe)',
                tooltip: 'Connect to sales tools. Best for: Order tracking, inventory, customer data.'
              },
              {
                value: 'ai',
                label: 'AI Services (OpenAI, Claude)',
                tooltip: 'Add AI features. Best for: Content generation, summarization, chat assistants.'
              },
              {
                value: 'custom',
                label: 'Custom APIs',
                tooltip: 'Any external APIs. Best for: Specific integrations, niche tools.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'backend-database',
        name: 'Backend Database',
        description: 'Store integration data',
        tooltip: 'Store OAuth tokens, user data, cache. Separate from Notion data. Essential for public integrations.',
        recommended: true,
        configOptions: [
          {
            id: 'dbType',
            label: 'Database',
            type: 'select',
            tooltip: 'Where to store integration data',
            options: [
              {
                value: 'postgresql',
                label: 'PostgreSQL',
                tooltip: 'Production-ready. Best for: User accounts, OAuth tokens. Free: Supabase, Vercel Postgres.',
                recommended: true
              },
              {
                value: 'mongodb',
                label: 'MongoDB',
                tooltip: 'NoSQL. Best for: Flexible schemas, document storage. Free: MongoDB Atlas.'
              },
              {
                value: 'vercel-kv',
                label: 'Vercel KV (Redis)',
                tooltip: 'Fast key-value store. Best for: Session data, cache, rate limiting.'
              },
            ],
            defaultValue: 'postgresql',
          },
        ],
        autoBundles: ['env-config'],
      },
      {
        id: 'monetization',
        name: 'Monetization',
        description: 'SaaS subscription model',
        tooltip: 'Sell subscriptions ($10-99/mo). Use Stripe for payments. Popular models: freemium, usage-based, tiered pricing.',
        recommended: true,
        configOptions: [
          {
            id: 'pricingModel',
            label: 'Pricing Model',
            type: 'select',
            tooltip: 'How to charge users',
            options: [
              {
                value: 'freemium',
                label: 'Freemium',
                tooltip: 'Free tier + paid features. Best for: User acquisition, conversion funnel. Most common SaaS model.',
                recommended: true
              },
              {
                value: 'subscription',
                label: 'Paid Subscription',
                tooltip: 'Paid only ($10-99/mo). Best for: Premium features, no free tier. Higher revenue per user.'
              },
              {
                value: 'usage-based',
                label: 'Usage-based',
                tooltip: 'Pay per use (API calls, automations). Best for: Variable usage, enterprise. Examples: $0.10/automation.'
              },
              {
                value: 'free',
                label: 'Free',
                tooltip: 'Completely free. Best for: Building audience, open source.'
              },
            ],
            defaultValue: 'freemium',
          },
          {
            id: 'includeStripe',
            label: 'Stripe Integration',
            type: 'toggle',
            tooltip: 'Add Stripe for subscriptions and billing.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test integration functionality',
        tooltip: 'Test OAuth flow, API calls, webhooks. Essential for reliable integrations.',
        configOptions: [
          {
            id: 'includeTests',
            label: 'Include Tests',
            type: 'toggle',
            tooltip: 'Set up Vitest for testing API routes and integration logic.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Deploy to production',
        tooltip: 'Deploy to Vercel, Railway, or Fly.io. Need HTTPS for OAuth redirect URLs.',
        recommended: true,
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Hosting Platform',
            type: 'select',
            tooltip: 'Where to host your Notion integration',
            options: [
              {
                value: 'vercel',
                label: 'Vercel',
                tooltip: 'Easiest for Next.js. Free tier, auto HTTPS. Best for: Quick deployment, serverless.',
                recommended: true
              },
              {
                value: 'railway',
                label: 'Railway',
                tooltip: 'Full-stack hosting with databases. $5/mo. Best for: Persistent servers, background jobs.'
              },
              {
                value: 'fly',
                label: 'Fly.io',
                tooltip: 'Global edge deployment. Best for: Performance, worldwide users.'
              },
            ],
            defaultValue: 'vercel',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, TypeScript, validation',
        tooltip: 'Use TypeScript, validate input, handle rate limits. API best practices.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Variables',
        description: 'Manage secrets',
        tooltip: 'Store Notion OAuth secrets, API keys, database URLs securely.',
        recommended: true,
        hidden: true,
      },
    ],
};
