/**
 * Next.js App Template
 */

import type { ProjectTemplate } from '../types';

export const nextjsTemplate: ProjectTemplate = {
  id: 'nextjs',
  name: 'Next.js App',
  description: 'Full-stack React framework with App Router',
  tooltip: 'Build complete web applications with frontend and backend in one project. Perfect for SaaS products, dashboards, e-commerce sites, blogs, portfolios, or any website that needs a database, user accounts, or APIs. Most popular choice for modern web apps. Examples: Notion, TikTok, Twitch use Next.js.',
  icon: null,
  gradient: 'linear-gradient(90deg, #A8C7FA 0%, #DAEEFF 25%, #ffffff 50%, #DAEEFF 75%, #A8C7FA 100%)',
  command: 'npx create-next-app@latest',
  commandFlags: {
    typescript: () => '--typescript',
    tailwind: () => '--tailwind',
    appRouter: () => '--app',
    srcDir: () => '--src-dir',
    eslint: () => '--eslint',
  },
  features: [
    {
      id: 'auth',
      name: 'Authentication',
      description: 'Add user authentication to your app',
      tooltip: 'Let users create accounts and log in to your app. Use this for apps where users need to save their data, have personalized experiences, or access protected content.',
      recommended: true,
      configOptions: [
        {
          id: 'authProvider',
          label: 'Auth Provider',
          type: 'select',
          tooltip: 'Choose how users will sign in to your app',
          options: [
            { value: 'nextauth', label: 'NextAuth.js', tooltip: 'Free, fully customizable. Great for apps that need email/password login, Google, GitHub sign-in.', recommended: true },
            { value: 'clerk', label: 'Clerk', tooltip: 'Easiest setup with beautiful pre-built UI. Includes user management dashboard. Free tier: 10,000 users.' },
            { value: 'supabase', label: 'Supabase Auth', tooltip: 'Free, includes database. Best if you\'re also using Supabase for your database.' },
          ],
          defaultValue: 'nextauth',
        },
      ],
    },
    {
      id: 'database',
      name: 'Database',
      description: 'Connect a database to your app',
      tooltip: 'Store your app\'s data permanently. Essential for any app that needs to remember information between visits.',
      recommended: true,
      configOptions: [
        {
          id: 'dbType',
          label: 'Database',
          type: 'select',
          tooltip: 'Where your app\'s data will be stored',
          options: [
            { value: 'postgresql', label: 'PostgreSQL', tooltip: 'Most popular for production apps. Free hosting: Supabase, Vercel Postgres, Railway.', recommended: true },
            { value: 'sqlite', label: 'SQLite', tooltip: 'Simplest option, stores data in a file. Great for prototypes and learning.' },
            { value: 'mysql', label: 'MySQL', tooltip: 'Popular alternative to PostgreSQL. Use if your host specifically requires MySQL.' },
          ],
          defaultValue: 'postgresql',
        },
        {
          id: 'orm',
          label: 'ORM',
          type: 'select',
          tooltip: 'Tool that lets you work with your database using simple code instead of SQL',
          options: [
            { value: 'prisma', label: 'Prisma', tooltip: 'Easiest to learn, great documentation. Industry standard for Next.js apps.', recommended: true },
            { value: 'drizzle', label: 'Drizzle ORM', tooltip: 'Newer, faster, more TypeScript-friendly. Great for best performance.' },
          ],
          defaultValue: 'prisma',
        },
      ],
    },
    {
      id: 'styling',
      name: 'UI Components',
      description: 'Add pre-built UI component library',
      tooltip: 'Get ready-made components like buttons, forms, dialogs instead of building from scratch.',
      recommended: true,
      configOptions: [
        {
          id: 'uiLibrary',
          label: 'Component Library',
          type: 'select',
          tooltip: 'Choose which set of pre-built components to use',
          options: [
            { value: 'shadcn', label: 'shadcn/ui', tooltip: 'Copy-paste components you own and can fully customize. Free, beautiful, accessible.', recommended: true },
            { value: 'mui', label: 'Material-UI', tooltip: 'Google Material Design style. Huge library, very popular.' },
            { value: 'chakra', label: 'Chakra UI', tooltip: 'Simple, accessible, easy to learn. Best for quick prototypes.' },
          ],
          defaultValue: 'shadcn',
        },
      ],
    },
    {
      id: 'api',
      name: 'API Layer',
      description: 'Type-safe API integration',
      tooltip: 'Connect your frontend to your backend. Essential for any app that needs a backend API.',
      recommended: true,
      configOptions: [
        {
          id: 'apiType',
          label: 'API Type',
          type: 'select',
          tooltip: 'Choose how your frontend talks to your backend',
          options: [
            { value: 'trpc', label: 'tRPC', tooltip: 'End-to-end type safety. Best for TypeScript projects.', recommended: true },
            { value: 'rest', label: 'REST API Routes', tooltip: 'Traditional API approach. Best if you need a public API.' },
            { value: 'graphql', label: 'GraphQL', tooltip: 'Flexible queries. Best for complex apps with lots of data relationships.' },
          ],
          defaultValue: 'trpc',
        },
      ],
    },
    {
      id: 'env-validation',
      name: 'Environment Variables',
      description: 'Type-safe env validation with @t3-oss/env-nextjs',
      tooltip: 'Safely manage secret keys and configuration. Essential for any production app.',
    },
    {
      id: 'code-quality',
      name: 'Code Quality',
      description: 'ESLint, Prettier, Husky git hooks',
      tooltip: 'Automatically format your code and catch common mistakes. Great for teams and solo devs.',
      recommended: true,
    },
    {
      id: 'testing',
      name: 'Testing',
      description: 'Complete testing setup',
      tooltip: 'Write automated tests to catch bugs before users do.',
      configOptions: [
        {
          id: 'testingTools',
          label: 'Testing Tools',
          type: 'select',
          tooltip: 'Choose your testing framework',
          options: [
            { value: 'vitest-playwright', label: 'Vitest + Playwright', tooltip: 'Unit tests + browser tests. Complete coverage.', recommended: true },
            { value: 'jest-playwright', label: 'Jest + Playwright', tooltip: 'Same as above but with Jest.' },
            { value: 'vitest-only', label: 'Vitest only', tooltip: 'Unit tests only, no browser testing.' },
          ],
          defaultValue: 'vitest-playwright',
        },
      ],
    },
    {
      id: 'deployment',
      name: 'Deployment',
      description: 'Vercel deployment configuration',
      tooltip: 'One-click deploy to Vercel. Free hosting for personal projects.',
      recommended: true,
    },
  ],
};
