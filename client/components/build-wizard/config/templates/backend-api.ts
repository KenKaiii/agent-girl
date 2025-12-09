import type { ProjectTemplate } from '../types';

export const backendApiTemplate: ProjectTemplate = {
    id: 'backend-api',
    name: 'Backend API (Hono)',
    description: 'Ultra-fast REST API with Hono framework',
    tooltip: 'Build blazing-fast APIs that run anywhere. Smaller & faster than Express. Perfect for: microservices, mobile backends, serverless APIs, webhooks, data pipelines. Works with Bun (fastest!), Cloudflare Workers, Deno, Node.js. Examples: Use Hono for high-performance APIs with minimal overhead.',
    icon: null, // Will be set in component
    gradient: 'linear-gradient(90deg, #FF6600 0%, #FF8833 25%, #ffffff 50%, #FF8833 75%, #FF6600 100%)',
    command: 'npm create hono@latest',
    commandFlags: {},
    features: [
      {
        id: 'runtime',
        name: 'Runtime Environment',
        description: 'Where your API will run',
        tooltip: 'Hono works on any JavaScript runtime. Each has different trade-offs for speed, deployment, and features.',
        recommended: true,
        configOptions: [
          {
            id: 'runtime',
            label: 'Runtime',
            type: 'select',
            tooltip: 'Which JavaScript runtime to use.',
            options: [
              {
                value: 'bun',
                label: 'Bun',
                tooltip: 'FASTEST runtime (3x faster than Node). Best for: New projects, maximum performance, modern APIs. Native TypeScript support. Recommended!',
                recommended: true
              },
              {
                value: 'cloudflare-workers',
                label: 'Cloudflare Workers',
                tooltip: 'Edge serverless (runs globally). Best for: Low-latency APIs, auto-scaling, $5/month. Deploy worldwide instantly. Great for public APIs.'
              },
              {
                value: 'deno',
                label: 'Deno',
                tooltip: 'Secure runtime with built-in TypeScript. Best for: Security-focused apps, no npm needed. Modern alternative to Node.js.'
              },
              {
                value: 'nodejs',
                label: 'Node.js',
                tooltip: 'Traditional runtime. Best for: Existing Node.js infrastructure, team familiarity, npm ecosystem. Most compatible.'
              },
            ],
            defaultValue: 'bun',
          },
        ],
      },
      {
        id: 'routing',
        name: 'API Routes & Structure',
        description: 'Organize your endpoints',
        tooltip: 'How to structure your API routes. Hono supports both file-based routing and programmatic routes.',
        configOptions: [
          {
            id: 'routingPattern',
            label: 'Route Organization',
            type: 'select',
            tooltip: 'How to organize API endpoints.',
            options: [
              {
                value: 'modular',
                label: 'Modular (Recommended)',
                tooltip: 'Organize routes by feature/resource. Best for: Medium-large APIs, team development. Example: src/routes/users.ts, src/routes/posts.ts',
                recommended: true
              },
              {
                value: 'single-file',
                label: 'Single File',
                tooltip: 'All routes in one file. Best for: Simple APIs (<10 endpoints), quick prototypes. Gets messy at scale.'
              },
              {
                value: 'file-based',
                label: 'File-Based Routing',
                tooltip: 'Routes based on file structure (like Next.js). Best for: Convention over configuration. Example: routes/api/users/[id].ts'
              },
            ],
            defaultValue: 'modular',
          },
        ],
      },
      {
        id: 'authentication',
        name: 'Authentication & Authorization',
        description: 'Secure your API endpoints',
        tooltip: 'Control who can access your API. Essential for production APIs. Hono has built-in auth middleware.',
        recommended: true,
        configOptions: [
          {
            id: 'authType',
            label: 'Auth Method',
            type: 'select',
            tooltip: 'How users/services authenticate to your API.',
            options: [
              {
                value: 'jwt',
                label: 'JWT (JSON Web Tokens)',
                tooltip: 'Stateless token-based auth. Best for: Mobile apps, SPAs, microservices. Scalable, no server-side sessions. Industry standard.',
                recommended: true
              },
              {
                value: 'api-key',
                label: 'API Keys',
                tooltip: 'Simple bearer tokens. Best for: Internal services, server-to-server, webhooks. Easy to implement and revoke.'
              },
              {
                value: 'basic',
                label: 'Basic Auth',
                tooltip: 'Username/password in headers. Best for: Admin endpoints, simple auth, development. Not recommended for production (unless HTTPS).'
              },
              {
                value: 'oauth',
                label: 'OAuth 2.0',
                tooltip: 'Third-party login (Google, GitHub). Best for: User-facing APIs, social login, enterprise SSO. More complex setup.'
              },
              {
                value: 'none',
                label: 'No Auth',
                tooltip: 'Public API, no authentication. Best for: Open data APIs, webhooks, development. NOT for production with sensitive data.'
              },
            ],
            defaultValue: 'jwt',
          },
        ],
      },
      {
        id: 'database',
        name: 'Database Integration',
        description: 'Persist your data',
        tooltip: 'Connect to a database for storing API data. Includes ORM/query builder setup.',
        configOptions: [
          {
            id: 'dbType',
            label: 'Database',
            type: 'select',
            tooltip: 'Which database to use.',
            options: [
              {
                value: 'postgresql',
                label: 'PostgreSQL',
                tooltip: 'Most popular SQL database. Best for: Relational data, complex queries, transactions. Free tier: Supabase, Neon, Railway.',
                recommended: true
              },
              {
                value: 'sqlite',
                label: 'SQLite',
                tooltip: 'File-based SQL. Best for: Development, small APIs, serverless (D1 on Cloudflare). Simple, no hosting needed.'
              },
              {
                value: 'mongodb',
                label: 'MongoDB',
                tooltip: 'NoSQL document database. Best for: Flexible schemas, rapid iteration, JSON-like data. Free tier: MongoDB Atlas.'
              },
              {
                value: 'mysql',
                label: 'MySQL',
                tooltip: 'Traditional SQL database. Best for: Existing MySQL infrastructure, shared hosting. Wide support.'
              },
              {
                value: 'none',
                label: 'No Database',
                tooltip: 'Stateless API or external data source. Best for: Proxy APIs, data transformations, simple webhooks.'
              },
            ],
            defaultValue: 'postgresql',
          },
          {
            id: 'orm',
            label: 'ORM/Query Builder',
            type: 'select',
            tooltip: 'Tool for interacting with database.',
            options: [
              {
                value: 'drizzle',
                label: 'Drizzle ORM',
                tooltip: 'TypeScript-first, lightweight. Best for: Type safety, performance, Hono integration. Modern choice for new projects.',
                recommended: true
              },
              {
                value: 'prisma',
                label: 'Prisma',
                tooltip: 'Popular ORM with migrations. Best for: Auto-generated types, database migrations, Prisma Studio. Great DX.'
              },
              {
                value: 'raw-sql',
                label: 'Raw SQL',
                tooltip: 'Write SQL directly. Best for: Maximum control, complex queries, performance tuning. No ORM overhead.'
              },
            ],
            defaultValue: 'drizzle',
          },
        ],
        autoBundles: ['env-config'],
      },
      {
        id: 'validation',
        name: 'Request Validation',
        description: 'Validate incoming data',
        tooltip: 'Validate request body, query params, and headers. Prevents bad data from reaching your handlers. Essential for security.',
        recommended: true,
        configOptions: [
          {
            id: 'validationLib',
            label: 'Validation Library',
            type: 'select',
            tooltip: 'How to validate API requests.',
            options: [
              {
                value: 'zod',
                label: 'Zod',
                tooltip: 'TypeScript-first validation. Best for: Type inference, great error messages, Hono integration. Industry standard. Recommended!',
                recommended: true
              },
              {
                value: 'typebox',
                label: 'TypeBox',
                tooltip: 'JSON Schema validator. Best for: OpenAPI generation, JSON Schema compliance, performance. Faster than Zod.'
              },
              {
                value: 'none',
                label: 'Manual Validation',
                tooltip: 'Write validation yourself. Best for: Simple APIs, custom logic. Not recommended for production.'
              },
            ],
            defaultValue: 'zod',
          },
        ],
      },
      {
        id: 'api-docs',
        name: 'API Documentation',
        description: 'Auto-generate API docs',
        tooltip: 'Generate interactive API documentation. Helps developers understand and test your API. Essential for public/team APIs.',
        configOptions: [
          {
            id: 'docsType',
            label: 'Documentation Format',
            type: 'select',
            tooltip: 'How to document your API.',
            options: [
              {
                value: 'openapi',
                label: 'OpenAPI/Swagger',
                tooltip: 'Industry standard REST API docs. Best for: Public APIs, client generation, interactive testing. Swagger UI included.',
                recommended: true
              },
              {
                value: 'scalar',
                label: 'Scalar',
                tooltip: 'Modern OpenAPI UI. Best for: Beautiful docs, better than Swagger UI, same OpenAPI spec. Great UX.'
              },
              {
                value: 'readme',
                label: 'README.md',
                tooltip: 'Simple markdown docs. Best for: Internal APIs, small teams, minimal overhead. Manual but flexible.'
              },
              {
                value: 'none',
                label: 'No Documentation',
                tooltip: 'Skip docs generation. Best for: Internal prototypes only. Not recommended for team/production APIs.'
              },
            ],
            defaultValue: 'openapi',
          },
        ],
      },
      {
        id: 'middleware',
        name: 'Middleware & Utilities',
        description: 'Cross-cutting concerns',
        tooltip: 'Common middleware for production APIs: CORS, rate limiting, compression, logging, etc.',
        configOptions: [
          {
            id: 'includeCors',
            label: 'CORS Support',
            type: 'toggle',
            tooltip: 'Allow cross-origin requests (frontend calling API from different domain). Essential for browser-based apps.',
            defaultValue: true,
          },
          {
            id: 'includeRateLimit',
            label: 'Rate Limiting',
            type: 'toggle',
            tooltip: 'Prevent API abuse by limiting requests per IP/user. Examples: 100 requests/minute. Essential for production.',
            defaultValue: true,
          },
          {
            id: 'includeCompression',
            label: 'Response Compression',
            type: 'toggle',
            tooltip: 'Compress API responses (gzip/brotli) to reduce bandwidth. Improves performance, especially for large responses.',
            defaultValue: true,
          },
          {
            id: 'includeHelmet',
            label: 'Security Headers',
            type: 'toggle',
            tooltip: 'Add security headers (CSP, X-Frame-Options, etc.). Protects against common attacks. Recommended for production.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'logging',
        name: 'Logging & Monitoring',
        description: 'Track API usage and errors',
        tooltip: 'Monitor API health, debug issues, track usage. Essential for production APIs.',
        configOptions: [
          {
            id: 'loggingLib',
            label: 'Logging Library',
            type: 'select',
            tooltip: 'How to log API requests and errors.',
            options: [
              {
                value: 'pino',
                label: 'Pino',
                tooltip: 'Fast structured logging. Best for: Production APIs, high traffic, JSON logs. Integrates with Datadog, Logtail. Recommended!',
                recommended: true
              },
              {
                value: 'winston',
                label: 'Winston',
                tooltip: 'Feature-rich logging. Best for: Multiple outputs (file + console + cloud), custom formatting, log levels.'
              },
              {
                value: 'console',
                label: 'Console (Simple)',
                tooltip: 'Basic console.log. Best for: Development, small APIs. Not recommended for production.'
              },
            ],
            defaultValue: 'pino',
          },
          {
            id: 'includeErrorTracking',
            label: 'Error Tracking',
            type: 'toggle',
            tooltip: 'Automatic error reporting to Sentry. Get alerts when API errors occur. Essential for production monitoring.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing Setup',
        description: 'Test your API endpoints',
        tooltip: 'Write tests for routes, middleware, and database logic. Prevents regressions, documents expected behavior.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Test Framework',
            type: 'select',
            tooltip: 'Choose a test runner for API testing.',
            options: [
              {
                value: 'vitest',
                label: 'Vitest',
                tooltip: 'Fast, modern test runner. Best for: TypeScript, fast feedback, ESM support. Great Hono integration. Recommended!',
                recommended: true
              },
              {
                value: 'jest',
                label: 'Jest',
                tooltip: 'Popular test framework. Best for: Familiar to most devs, mature ecosystem, extensive mocking.'
              },
              {
                value: 'bun-test',
                label: 'Bun Test (Native)',
                tooltip: 'Built into Bun. Best for: Bun runtime only, fastest execution, no extra dependencies. Bun-specific.'
              },
              {
                value: 'none',
                label: 'No Testing',
                tooltip: 'Skip testing setup. Best for: Quick prototypes. Not recommended for production APIs.'
              },
            ],
            defaultValue: 'vitest',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment Target',
        description: 'Where to host your API',
        tooltip: 'Choose hosting that matches your runtime. Serverless for auto-scaling, containers for control.',
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Hosting Platform',
            type: 'select',
            tooltip: 'Where will your API run in production?',
            options: [
              {
                value: 'cloudflare-workers',
                label: 'Cloudflare Workers',
                tooltip: 'Edge serverless, global deployment. Best for: Low-latency, auto-scaling, $5/month. Pairs perfectly with Hono. Blazing fast!',
                recommended: true
              },
              {
                value: 'railway',
                label: 'Railway',
                tooltip: 'Easy deployment with databases. Best for: Full-stack apps, $5/month, automatic HTTPS. Great for APIs with PostgreSQL.'
              },
              {
                value: 'vercel',
                label: 'Vercel',
                tooltip: 'Serverless functions. Best for: Next.js integration, quick deploy, free tier. Good for moderate traffic.'
              },
              {
                value: 'fly-io',
                label: 'Fly.io',
                tooltip: 'Global edge deployment. Best for: Low-latency, websockets, persistent connections. Deploy worldwide.'
              },
              {
                value: 'docker',
                label: 'Docker Container',
                tooltip: 'Self-hosted or any cloud. Best for: Full control, Kubernetes, on-premise. Most flexible.'
              },
              {
                value: 'aws-lambda',
                label: 'AWS Lambda',
                tooltip: 'AWS serverless. Best for: Enterprise AWS environments, auto-scaling, pay-per-request. More complex setup.'
              },
            ],
            defaultValue: 'cloudflare-workers',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'Linting, formatting, and type checking',
        tooltip: 'Ensure code quality with automated tools. Catches bugs early, maintains consistent style. Essential for team development.',
        recommended: true,
        hidden: true, // Auto-included
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage secrets and config',
        tooltip: 'Environment variables for API keys, database URLs, secrets. Never commit secrets to Git. Uses .env with .env.example template.',
        recommended: true,
        hidden: true, // Auto-included
      },
    ],
};
