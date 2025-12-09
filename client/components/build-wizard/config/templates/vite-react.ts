import type { ProjectTemplate } from '../types';

export const viteReactTemplate: ProjectTemplate = {
    id: 'vite-react',
    name: 'Vite + React',
    description: 'Lightning-fast React development with Vite',
    tooltip: 'Build fast single-page applications (SPAs) for frontend-only projects. Perfect for: interactive dashboards, admin panels, portfolio sites, landing pages, or prototypes. Simpler than Next.js - no backend/server code, just frontend. Best for apps that don\'t need a database or user accounts, or when you already have a separate backend API.',
    icon: null,
    gradient: 'linear-gradient(90deg, #C7A8FA 0%, #DAAEEE 25%, #ffffff 50%, #DAAEEE 75%, #C7A8FA 100%)',
    command: 'npm create vite@latest',
    commandFlags: {
      template: () => '--template react-ts',
    },
    features: [
      {
        id: 'routing',
        name: 'Routing',
        description: 'React Router for navigation',
        tooltip: 'Add multiple pages/views to your app. Users can navigate between different screens (Home, About, Dashboard, etc.). Essential for any app with more than one page.',
        recommended: true,
      },
      {
        id: 'state',
        name: 'State Management',
        description: 'Global state management',
        tooltip: 'Share data across your entire app. User info, settings, cart items accessible from any component. Essential for medium to large apps where components need to share data.',
        configOptions: [
          {
            id: 'stateLibrary',
            label: 'State Library',
            type: 'select',
            tooltip: 'Choose how to manage app-wide state',
            options: [
              { value: 'zustand', label: 'Zustand', tooltip: 'Simplest, easiest to learn. Small bundle size. Best for most apps. Growing in popularity.', recommended: true },
              { value: 'redux', label: 'Redux Toolkit', tooltip: 'Industry standard, huge ecosystem, tons of jobs use it. More complex but very powerful. Best for large teams.' },
              { value: 'jotai', label: 'Jotai', tooltip: 'Atomic state management, flexible and minimal. Good TypeScript support. Best if you want granular control.' },
            ],
            defaultValue: 'zustand',
          },
        ],
      },
      {
        id: 'styling',
        name: 'Styling',
        description: 'CSS framework',
        tooltip: 'Choose how to style your app. Tailwind is fastest for building interfaces. Styled Components keeps styles with components. CSS Modules prevents style conflicts.',
        recommended: true,
        configOptions: [
          {
            id: 'cssFramework',
            label: 'CSS Framework',
            type: 'select',
            tooltip: 'Choose your styling approach',
            options: [
              { value: 'tailwind', label: 'Tailwind CSS', tooltip: 'Utility-first CSS, fastest development. Most popular choice. Build interfaces rapidly with utility classes.', recommended: true },
              { value: 'styled', label: 'Styled Components', tooltip: 'Write CSS in JavaScript. Scoped styles, dynamic styling. Great for component libraries.' },
              { value: 'css-modules', label: 'CSS Modules', tooltip: 'Traditional CSS with automatic scope. No style conflicts. Good if you prefer writing regular CSS.' },
            ],
            defaultValue: 'tailwind',
          },
        ],
      },
      {
        id: 'ui-library',
        name: 'UI Library',
        description: 'Component library',
        tooltip: 'Get ready-made components like buttons, forms, dialogs instead of building from scratch. Saves weeks of work. Make your app look professional quickly.',
        configOptions: [
          {
            id: 'componentLib',
            label: 'Components',
            type: 'select',
            tooltip: 'Choose your component library',
            options: [
              { value: 'shadcn', label: 'shadcn/ui', tooltip: 'Copy-paste components you own and can fully customize. Free, beautiful, accessible. Best for most apps.', recommended: true },
              { value: 'mui', label: 'Material-UI', tooltip: 'Google Material Design style. Huge library, very popular. Free with lots of examples. Great for business apps.' },
              { value: 'none', label: 'None', tooltip: 'Build everything yourself. Full control but more work. Choose this if you have custom design requirements.' },
            ],
            defaultValue: 'shadcn',
          },
        ],
      },
      {
        id: 'ai-integration',
        name: 'AI Integration',
        description: 'Add AI capabilities to your app',
        tooltip: 'Add ChatGPT-like features to your app: chatbots, content generation, text analysis, summaries, translations. Use this to build AI-powered tools, writing assistants, smart search, or automated customer support.',
        configOptions: [
          {
            id: 'aiProvider',
            label: 'AI Provider',
            type: 'select',
            tooltip: 'Choose which AI model will power your app',
            options: [
              { value: 'vercel-ai', label: 'Vercel AI SDK', tooltip: 'Works with OpenAI, Anthropic, Google, and more. Switch providers anytime without changing code. Best for flexibility.', recommended: true },
              { value: 'openai', label: 'OpenAI', tooltip: 'ChatGPT creator. Great for chatbots and content generation. Pricing: $0.0015 per 1K words. Free $5 credit for new accounts.' },
              { value: 'anthropic', label: 'Anthropic Claude', tooltip: 'Best for long documents and complex reasoning. More accurate than ChatGPT for analysis. Pricing: $0.008 per 1K words.' },
            ],
            defaultValue: 'vercel-ai',
          },
        ],
      },
      {
        id: 'payments',
        name: 'Payments',
        description: 'Accept payments and manage subscriptions',
        tooltip: 'Let users pay you with credit cards for one-time purchases or monthly subscriptions. Essential for SaaS, online courses, premium features, memberships, or any app that makes money. Handles checkout, billing, and tax automatically.',
        autoBundles: ['email', 'rate-limiting'], // Payments need receipts and webhook protection
        configOptions: [
          {
            id: 'paymentProvider',
            label: 'Payment Provider',
            type: 'select',
            tooltip: 'Choose which service will handle your payments and money',
            options: [
              { value: 'stripe', label: 'Stripe', tooltip: 'Industry standard, works in 100+ countries. Fees: 2.9% + 30¢ per transaction. Best documentation and features. Used by Amazon, Google, Shopify.', recommended: true },
              { value: 'lemonsqueezy', label: 'LemonSqueezy', tooltip: 'Simplest setup, merchant of record handles taxes. Fees: 5% + 50¢. Best for digital products and courses. Quick start for indie devs. Recently acquired by Stripe.' },
              { value: 'paddle', label: 'Paddle', tooltip: 'Handles all taxes and compliance for you (SaaS focus). Fees: 5% + 50¢. Best if selling globally and want easy tax handling. Merchant of record.' },
            ],
            defaultValue: 'stripe',
          },
        ],
      },
      {
        id: 'email',
        name: 'Email',
        description: 'Send transactional and marketing emails',
        tooltip: 'Send emails from your app: welcome emails, password resets, receipts, notifications, newsletters. Essential for user communication. Without this, users won\'t get confirmation emails or important updates.',
        configOptions: [
          {
            id: 'emailProvider',
            label: 'Email Provider',
            type: 'select',
            tooltip: 'Choose which service will send emails for your app',
            options: [
              { value: 'resend', label: 'Resend + React Email', tooltip: 'Modern, simple API with beautiful React Email templates. Free: 3,000 emails/month, then $20/month. Best for startups and modern apps. 270K+ weekly downloads.', recommended: true },
              { value: 'sendgrid', label: 'SendGrid', tooltip: 'Enterprise option. Free: 100 emails/day. Paid from $20/month. Good for marketing emails and analytics. Higher deliverability.' },
            ],
            defaultValue: 'resend',
          },
        ],
      },
      {
        id: 'file-storage',
        name: 'File Storage',
        description: 'Upload and store user files',
        tooltip: 'Let users upload files: profile pictures, documents, videos, PDFs. Use for apps with user content, portfolios, file sharing, or media platforms. Files are stored in the cloud, not on your server.',
        configOptions: [
          {
            id: 'storageProvider',
            label: 'Storage Provider',
            type: 'select',
            tooltip: 'Choose where user-uploaded files will be stored',
            options: [
              { value: 'uploadthing', label: 'UploadThing', tooltip: 'Easiest setup. Free: 2GB storage, 2GB bandwidth/month. Handles file uploads with one line of code. Best for quick starts.', recommended: true },
              { value: 's3', label: 'AWS S3', tooltip: 'Industry standard, unlimited scale. $0.023 per GB/month. Best for large apps with many files. More complex setup but most powerful.' },
              { value: 'r2', label: 'Cloudflare R2', tooltip: 'Like S3 but free bandwidth. $0.015 per GB/month. Best if serving many files to users (downloads, media). Good for cost savings.' },
            ],
            defaultValue: 'uploadthing',
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Complete testing setup',
        configOptions: [
          {
            id: 'testingTools',
            label: 'Testing Tools',
            type: 'select',
            options: [
              { value: 'vitest-playwright', label: 'Vitest + Playwright' },
              { value: 'vitest-only', label: 'Vitest only' },
            ],
            defaultValue: 'vitest-playwright',
          },
        ],
      },
      {
        id: 'env-validation',
        name: 'Environment Variables',
        description: 'Type-safe env with Zod',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, Husky',
      },
      {
        id: 'error-tracking',
        name: 'Error Tracking',
        description: 'Sentry integration',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Privacy-focused analytics',
        configOptions: [
          {
            id: 'analyticsProvider',
            label: 'Analytics',
            type: 'select',
            options: [
              { value: 'posthog', label: 'PostHog' },
              { value: 'plausible', label: 'Plausible' },
              { value: 'umami', label: 'Umami' },
            ],
            defaultValue: 'posthog',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Deploy config',
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Platform',
            type: 'select',
            options: [
              { value: 'vercel', label: 'Vercel' },
              { value: 'netlify', label: 'Netlify' },
              { value: 'cloudflare', label: 'Cloudflare Pages' },
            ],
            defaultValue: 'vercel',
          },
        ],
      },
    ],
};
