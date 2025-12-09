import type { ProjectTemplate } from '../types';

export const mcpServerTemplate: ProjectTemplate = {
    id: 'mcp-server',
    name: 'MCP Server',
    description: 'Model Context Protocol server for Claude integration',
    tooltip: 'Create servers that extend Claude with custom tools, resources, and prompts. Perfect for connecting Claude to APIs, databases, file systems, or custom business logic. Examples: database query tools, code analysis, web scraping, custom workflows. Used by Claude Desktop, Claude Code, and any MCP-compatible client.',
    icon: null, // Will be set in component
    gradient: 'linear-gradient(90deg, #FF6B35 0%, #FFA07A 25%, #ffffff 50%, #FFA07A 75%, #FF6B35 100%)',
    command: 'npx @modelcontextprotocol/create-server',
    commandFlags: {
      name: (value) => `--name "${value}"`,
      description: (value) => `--description "${value}"`,
    },
    features: [
      {
        id: 'transport',
        name: 'Transport Type',
        description: 'How your MCP server communicates with clients',
        tooltip: 'STDIO = Local-only (Claude Desktop). HTTP = Remote/cloud deployment (Claude web, team sharing). Choose STDIO for personal tools, HTTP for team/production use.',
        recommended: true,
        configOptions: [
          {
            id: 'transportType',
            label: 'Transport Protocol',
            type: 'select',
            tooltip: 'STDIO runs locally on your machine. HTTP allows remote access for teams and cloud deployment.',
            options: [
              {
                value: 'stdio',
                label: 'STDIO (Local)',
                tooltip: 'Best for: Personal Claude Desktop use, file system access, local databases, tools that need direct system access. Fastest, most secure for local use.',
                recommended: true
              },
              {
                value: 'http',
                label: 'HTTP (Remote)',
                tooltip: 'Best for: Team collaboration, cloud APIs, webhooks, shared tools. Accessible from Claude web, requires hosting (Cloudflare, AWS, etc.).'
              },
            ],
            defaultValue: 'stdio',
          },
        ],
      },
      {
        id: 'capabilities',
        name: 'Server Capabilities',
        description: 'What your MCP server will provide to Claude',
        tooltip: 'Tools = Actions Claude can perform (e.g., query database, call API). Resources = Data Claude can read (e.g., files, docs). Prompts = Reusable instruction templates. Select all that apply.',
        recommended: true,
        configOptions: [
          {
            id: 'includeTools',
            label: 'Tools (Executable Functions)',
            type: 'toggle',
            tooltip: 'Add tools for Claude to execute actions. Examples: search database, call weather API, create file, send email. Tools can modify state and have side effects.',
            defaultValue: true,
          },
          {
            id: 'includeResources',
            label: 'Resources (Data Sources)',
            type: 'toggle',
            tooltip: 'Expose data for Claude to read. Examples: config files, documentation, user profiles, logs. Resources are read-only and have no side effects.',
            defaultValue: false,
          },
          {
            id: 'includePrompts',
            label: 'Prompts (Reusable Templates)',
            type: 'toggle',
            tooltip: 'Define prompt templates for common tasks. Examples: code review template, bug report format, analysis framework. Ensures consistent AI interactions.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'tool-examples',
        name: 'Tool Examples',
        description: 'Pre-built tool templates to include',
        tooltip: 'Start with example tools you can customize. These demonstrate best practices for different use cases.',
        configOptions: [
          {
            id: 'toolType',
            label: 'Tool Template',
            type: 'select',
            tooltip: 'Choose a starting template that matches your use case. You can add more tools later.',
            options: [
              {
                value: 'api',
                label: 'API Client',
                tooltip: 'Tools for calling REST APIs. Example: Fetch data from external services, webhooks, GraphQL queries.',
                recommended: true
              },
              {
                value: 'database',
                label: 'Database Query',
                tooltip: 'Tools for querying databases (SQL, MongoDB, etc.). Example: Run queries, insert records, aggregate data.'
              },
              {
                value: 'filesystem',
                label: 'File Operations',
                tooltip: 'Tools for reading/writing files. Example: Search files, read configs, generate reports, modify code.'
              },
              {
                value: 'web',
                label: 'Web Scraping',
                tooltip: 'Tools for fetching and parsing web content. Example: Extract data from websites, monitor pages, aggregate info.'
              },
              {
                value: 'git',
                label: 'Git Operations',
                tooltip: 'Tools for Git operations. Example: Search repos, read commits, analyze diffs, automate workflows.'
              },
              {
                value: 'custom',
                label: 'Custom Logic',
                tooltip: 'Blank template for your own business logic. Example: Calculations, data transformation, integrations.'
              },
            ],
            defaultValue: 'api',
          },
        ],
      },
      {
        id: 'authentication',
        name: 'Authentication',
        description: 'Secure your MCP server (HTTP only)',
        tooltip: 'HTTP servers should always use authentication. Choose API keys for simplicity or OAuth for enterprise SSO. STDIO servers don\'t need auth (already local).',
        configOptions: [
          {
            id: 'authMethod',
            label: 'Auth Method',
            type: 'select',
            tooltip: 'API Key = Simple, good for personal/small teams. OAuth = Enterprise SSO (Google, Microsoft). None = Only use for local STDIO.',
            options: [
              {
                value: 'none',
                label: 'None (STDIO only)',
                tooltip: 'No authentication. Only safe for local STDIO transport. Never use with HTTP!',
                recommended: true
              },
              {
                value: 'api-key',
                label: 'API Key',
                tooltip: 'Simple bearer token authentication. Best for: Internal tools, personal use, small teams. Easy to implement.'
              },
              {
                value: 'oauth',
                label: 'OAuth 2.0',
                tooltip: 'Enterprise authentication with SSO providers (Google, Microsoft, GitHub). Best for: Team deployments, production apps, enterprise environments.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'validation',
        name: 'Input Validation',
        description: 'Validate tool inputs with schemas',
        tooltip: 'Use Zod to validate tool parameters before execution. Prevents errors, improves type safety, generates better documentation. Highly recommended for production servers.',
        recommended: true,
        configOptions: [
          {
            id: 'validationLib',
            label: 'Validation Library',
            type: 'select',
            tooltip: 'Zod provides runtime type checking and automatic schema generation for MCP tools.',
            options: [
              {
                value: 'zod',
                label: 'Zod',
                tooltip: 'TypeScript-first validation. Best DX with MCP SDK. Auto-generates input schemas. Example: z.object({ query: z.string() })',
                recommended: true
              },
              {
                value: 'none',
                label: 'No validation',
                tooltip: 'Manual validation. Only choose if you have specific requirements. Not recommended for production.'
              },
            ],
            defaultValue: 'zod',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment Target',
        description: 'Where you plan to host your MCP server',
        tooltip: 'Local = Claude Desktop only. Cloud = Accessible from anywhere, team sharing. Choose based on who needs access.',
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Deployment Platform',
            type: 'select',
            tooltip: 'Where will your MCP server run?',
            options: [
              {
                value: 'local',
                label: 'Local (Claude Desktop)',
                tooltip: 'Run on your machine only. Best for: Personal tools, file system access, local databases. Requires STDIO transport.',
                recommended: true
              },
              {
                value: 'cloudflare',
                label: 'Cloudflare Workers',
                tooltip: 'Serverless edge deployment. Best for: Global low-latency, API integrations, auto-scaling. Free tier available. Requires HTTP transport.'
              },
              {
                value: 'vercel',
                label: 'Vercel',
                tooltip: 'Next.js-friendly serverless. Best for: Integrating with existing Next.js apps, quick deployment. Free tier available. Requires HTTP transport.'
              },
              {
                value: 'aws-lambda',
                label: 'AWS Lambda',
                tooltip: 'Flexible serverless compute. Best for: Enterprise environments, AWS ecosystem, advanced networking. Requires HTTP transport.'
              },
              {
                value: 'docker',
                label: 'Docker Container',
                tooltip: 'Self-hosted container. Best for: On-premise deployments, custom infrastructure, full control. Requires HTTP transport.'
              },
              {
                value: 'desktop-extension',
                label: 'Desktop Extension (.mcpb)',
                tooltip: 'Package as one-click installable for Claude Desktop. Best for: Distributing to non-technical users, easy installation. Uses STDIO internally.'
              },
            ],
            defaultValue: 'local',
          },
        ],
      },
      {
        id: 'error-handling',
        name: 'Error Handling & Logging',
        description: 'Handle errors and log activity',
        tooltip: 'Production servers need robust error handling and observability. Choose logging that matches your deployment platform.',
        configOptions: [
          {
            id: 'loggingLib',
            label: 'Logging Library',
            type: 'select',
            tooltip: 'How to track server activity and debug issues.',
            options: [
              {
                value: 'console',
                label: 'Console (Simple)',
                tooltip: 'Basic console.log. Good for: Local development, testing. Not recommended for production.',
                recommended: true
              },
              {
                value: 'pino',
                label: 'Pino (Fast)',
                tooltip: 'Fast structured logging. Good for: Production servers, high traffic. Works with log aggregators (Datadog, Splunk).'
              },
              {
                value: 'winston',
                label: 'Winston (Feature-rich)',
                tooltip: 'Flexible logging with transports. Good for: Complex apps, multiple outputs (file, cloud, console).'
              },
            ],
            defaultValue: 'console',
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing Setup',
        description: 'Test your MCP server tools and resources',
        tooltip: 'Write tests to ensure your server works correctly. Catch bugs before deployment, document expected behavior.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Test Framework',
            type: 'select',
            tooltip: 'Choose a test runner for unit and integration tests.',
            options: [
              {
                value: 'vitest',
                label: 'Vitest',
                tooltip: 'Fast, modern test runner. Compatible with Vite. Good for: TypeScript projects, fast feedback loops.',
                recommended: true
              },
              {
                value: 'jest',
                label: 'Jest',
                tooltip: 'Popular, mature test framework. Good for: Large projects, extensive ecosystem, familiar to most developers.'
              },
              {
                value: 'none',
                label: 'No testing',
                tooltip: 'Skip testing setup. Only for quick prototypes. Not recommended for production servers.'
              },
            ],
            defaultValue: 'vitest',
          },
        ],
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Generate documentation for your server',
        tooltip: 'Auto-generate docs from your tool schemas. Helps users understand what your server does and how to use it.',
        configOptions: [
          {
            id: 'docGen',
            label: 'Documentation Type',
            type: 'select',
            tooltip: 'MCP servers should document their tools, resources, and prompts.',
            options: [
              {
                value: 'readme',
                label: 'README.md',
                tooltip: 'Basic markdown documentation. Good for: Simple servers, GitHub sharing, quick reference.',
                recommended: true
              },
              {
                value: 'typedoc',
                label: 'TypeDoc (API Docs)',
                tooltip: 'Generate HTML API docs from TypeScript. Good for: Complex servers, public APIs, detailed documentation.'
              },
              {
                value: 'none',
                label: 'No docs',
                tooltip: 'Skip documentation. Only for personal prototypes.'
              },
            ],
            defaultValue: 'readme',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'Linting, formatting, and type checking',
        tooltip: 'Ensure code quality with automated tools. Catches bugs early, maintains consistent style.',
        recommended: true,
        hidden: true, // Auto-included
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage environment variables and secrets',
        tooltip: 'Handle API keys, database URLs, and other secrets safely. Never commit secrets to Git.',
        recommended: true,
        hidden: true, // Auto-included
      },
    ],
};
