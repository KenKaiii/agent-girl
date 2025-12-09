import type { ProjectTemplate } from '../types';

export const slackBotTemplate: ProjectTemplate = {
    id: 'slack-bot',
    name: 'Slack Bot',
    description: 'Slack Bolt app with slash commands and workflows',
    tooltip: 'Build Slack bots with slash commands, shortcuts, modals, and event handlers. Perfect for: team automation, workflows, custom integrations, notifications, productivity tools, ChatOps, scheduled tasks. Examples: Polly, Donut, Standuply use Slack Bolt. Works with Slack\'s latest Block Kit UI.',
    icon: null, // Will be set in component
    gradient: 'linear-gradient(90deg, #611F69 0%, #ECB22E 25%, #ffffff 50%, #ECB22E 75%, #611F69 100%)',
    command: 'git clone https://github.com/slack-samples/bolt-ts-starter-template',
    commandFlags: {},
    features: [
      {
        id: 'slash-commands',
        name: 'Slash Commands',
        description: 'Custom commands for Slack',
        tooltip: 'Slash commands let users trigger your app from any Slack conversation. Examples: /standup, /poll "Question?", /remind me in 1h. They appear in Slack\'s autocomplete. Essential for most Slack bots.',
        recommended: true,
        configOptions: [
          {
            id: 'commandPattern',
            label: 'Command Organization',
            type: 'select',
            tooltip: 'How to structure your slash command handlers.',
            options: [
              {
                value: 'listeners-folder',
                label: 'Listeners Folder',
                tooltip: 'Bolt best practice: /listeners/commands/ directory. Best for: Organized bots, team development, 5+ commands. Example: listeners/commands/standup.ts',
                recommended: true
              },
              {
                value: 'single-file',
                label: 'Single File',
                tooltip: 'All commands in app.ts. Best for: Simple bots with 1-3 commands, quick prototypes. Gets messy with many commands.'
              },
              {
                value: 'command-registry',
                label: 'Command Registry',
                tooltip: 'Advanced pattern with dynamic loading. Best for: Large bots (20+ commands), plugin systems, multi-workspace apps.'
              },
            ],
            defaultValue: 'listeners-folder',
          },
          {
            id: 'includeExamples',
            label: 'Include Example Commands',
            type: 'toggle',
            tooltip: 'Generate example slash commands: /hello, /echo <message>, /remind. Great for learning Bolt patterns.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'shortcuts',
        name: 'Shortcuts & Actions',
        description: 'Quick actions from messages and menus',
        tooltip: 'Shortcuts = Quick actions triggered from Slack UI. Message shortcuts = right-click messages (e.g., "Create Task"). Global shortcuts = lightning bolt menu (e.g., "Start Standup"). Boost productivity.',
        recommended: true,
        configOptions: [
          {
            id: 'includeMessageShortcuts',
            label: 'Message Shortcuts',
            type: 'toggle',
            tooltip: 'Right-click message actions. Examples: "Save to Notes", "Create Ticket", "Translate Message". Access any message context.',
            defaultValue: true,
          },
          {
            id: 'includeGlobalShortcuts',
            label: 'Global Shortcuts',
            type: 'toggle',
            tooltip: 'Lightning bolt menu actions. Examples: "Create Poll", "Start Standup", "Open Dashboard". Available from anywhere in Slack.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'block-kit',
        name: 'Block Kit UI',
        description: 'Rich interactive messages',
        tooltip: 'Block Kit = Slack\'s UI framework for beautiful messages. Build with blocks (text, buttons, dropdowns, images, dividers). Use Block Kit Builder to design visually. Much better than plain text!',
        recommended: true,
        configOptions: [
          {
            id: 'includeButtons',
            label: 'Interactive Buttons',
            type: 'toggle',
            tooltip: 'Add clickable buttons to messages. Examples: "Approve/Reject", "Yes/No", "Mark Complete". Actions trigger your bot handlers.',
            defaultValue: true,
          },
          {
            id: 'includeSelectMenus',
            label: 'Select Menus',
            type: 'toggle',
            tooltip: 'Dropdown/checkbox selections. Examples: user picker, channel picker, date picker, static options. Great for forms and settings.',
            defaultValue: true,
          },
          {
            id: 'includeModals',
            label: 'Modal Forms',
            type: 'toggle',
            tooltip: 'Popup forms for complex input. Examples: ticket creation, survey, settings, multi-step wizards. Can have text inputs, selects, checkboxes.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'events',
        name: 'Event Subscriptions',
        description: 'React to Slack workspace events',
        tooltip: 'Listen to Slack events to trigger bot actions. Examples: welcome new members, react to mentions, monitor messages, track emoji reactions, log file uploads.',
        recommended: true,
        configOptions: [
          {
            id: 'eventTypes',
            label: 'Event Categories',
            type: 'select',
            tooltip: 'Which Slack events your bot will handle.',
            options: [
              {
                value: 'essential',
                label: 'Essential Only',
                tooltip: 'message, app_mention, app_home_opened. Best for: Simple bots, minimal permissions. Most bots only need these.',
                recommended: true
              },
              {
                value: 'automation',
                label: 'Automation Events',
                tooltip: 'Essential + member_joined_channel, reaction_added, file_shared. Best for: Welcome bots, notification systems, file processing.'
              },
              {
                value: 'comprehensive',
                label: 'Comprehensive',
                tooltip: 'All common events including channel updates, team changes, workflow steps. Best for: Analytics, compliance, advanced automation.'
              },
            ],
            defaultValue: 'essential',
          },
        ],
      },
      {
        id: 'app-home',
        name: 'App Home',
        description: 'Custom app homepage in Slack',
        tooltip: 'App Home = Your bot\'s dedicated tab in Slack. Users click your app → see custom UI. Examples: dashboards, settings, help docs, task lists. Great for app discoverability.',
        configOptions: [
          {
            id: 'includeHomeTab',
            label: 'Home Tab',
            type: 'toggle',
            tooltip: 'Enable custom Home tab with Block Kit UI. Examples: personalized dashboard, recent activity, quick actions. Users see it when opening your app.',
            defaultValue: false,
          },
          {
            id: 'includeMessagesTab',
            label: 'Messages Tab',
            type: 'toggle',
            tooltip: 'Enable DM conversations with your bot. Users can message your bot directly. Essential for conversational bots.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'workflows',
        name: 'Workflow Steps',
        description: 'Custom steps for Slack Workflows',
        tooltip: 'Workflow Steps = Add your bot to Slack\'s no-code Workflow Builder. Users can drag-drop your custom steps. Examples: "Send to External API", "Create Database Record", "Custom Approval". Extends Slack workflows.',
        configOptions: [
          {
            id: 'includeWorkflowSteps',
            label: 'Enable Workflow Steps',
            type: 'toggle',
            tooltip: 'Create custom workflow steps users can add to their workflows. Great for: integrations, approvals, data processing. Non-technical users love this.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'database',
        name: 'Database Integration',
        description: 'Store persistent data',
        tooltip: 'Save data across bot restarts. Examples: user preferences, task lists, poll results, analytics, custom settings, approval history.',
        configOptions: [
          {
            id: 'dbType',
            label: 'Database Type',
            type: 'select',
            tooltip: 'Where to store bot data persistently.',
            options: [
              {
                value: 'none',
                label: 'No Database',
                tooltip: 'No persistent storage. Data lost on restart. Best for: Simple bots, stateless commands, testing. Not recommended for production.',
                recommended: true
              },
              {
                value: 'sqlite',
                label: 'SQLite (Local)',
                tooltip: 'File-based SQL database. Best for: Small teams (<50 users), easy setup, single workspace. Fast for development.'
              },
              {
                value: 'mongodb',
                label: 'MongoDB (Cloud)',
                tooltip: 'NoSQL cloud database. Best for: Multi-workspace apps, flexible schemas, scaling. Free tier: MongoDB Atlas.'
              },
              {
                value: 'postgresql',
                label: 'PostgreSQL (Cloud)',
                tooltip: 'SQL cloud database. Best for: Complex queries, relational data, transactions. Free tier: Supabase, Railway.'
              },
              {
                value: 'firebase',
                label: 'Firebase (Google)',
                tooltip: 'Real-time NoSQL database. Best for: Real-time updates, mobile/web sync, Google Cloud ecosystem. Free tier: Spark plan.'
              },
            ],
            defaultValue: 'none',
          },
        ],
        autoBundles: ['env-config'],
      },
      {
        id: 'authentication',
        name: 'OAuth & Permissions',
        description: 'User authentication and scopes',
        tooltip: 'OAuth = Users install your bot to their workspace. Scopes = Permissions your bot requests (read messages, post messages, etc.). Essential for production bots.',
        configOptions: [
          {
            id: 'distributionType',
            label: 'Distribution Model',
            type: 'select',
            tooltip: 'How will users install your bot?',
            options: [
              {
                value: 'single-workspace',
                label: 'Single Workspace',
                tooltip: 'Bot for one workspace only (your team). Best for: Internal tools, team automation. Simpler setup, no OAuth needed.',
                recommended: true
              },
              {
                value: 'multi-workspace',
                label: 'Multi-Workspace',
                tooltip: 'Distribute to multiple workspaces. Best for: Public bots, SaaS products. Requires OAuth flow, workspace database.'
              },
            ],
            defaultValue: 'single-workspace',
          },
        ],
      },
      {
        id: 'logging',
        name: 'Logging & Debugging',
        description: 'Track bot activity and errors',
        tooltip: 'Monitor bot health, debug issues, track usage. Essential for production bots. Examples: command usage stats, error alerts, performance monitoring.',
        configOptions: [
          {
            id: 'logLevel',
            label: 'Logging Library',
            type: 'select',
            tooltip: 'How to log bot activity and errors.',
            options: [
              {
                value: 'console',
                label: 'Console (Simple)',
                tooltip: 'Basic console.log. Best for: Development, small bots. Bolt has built-in logging. Not recommended for production.',
                recommended: true
              },
              {
                value: 'pino',
                label: 'Pino (Fast)',
                tooltip: 'Fast structured logging. Best for: Production bots, high traffic. Integrates with log aggregators (Datadog, Logtail).'
              },
              {
                value: 'winston',
                label: 'Winston (Feature-rich)',
                tooltip: 'Flexible logging with transports. Best for: Multiple outputs (file + console + cloud), log rotation, custom formatting.'
              },
            ],
            defaultValue: 'console',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Hosting & Deployment',
        description: 'Where to run your Slack bot',
        tooltip: 'Slack bots must run 24/7 with public HTTPS endpoint. Slack sends events to your URL. Choose hosting that supports HTTPS and webhooks.',
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Hosting Platform',
            type: 'select',
            tooltip: 'Where will your bot be hosted?',
            options: [
              {
                value: 'local-ngrok',
                label: 'Local + ngrok',
                tooltip: 'Run locally with ngrok tunnel. Best for: Development, testing. Free but requires your PC on. Not for production.',
                recommended: true
              },
              {
                value: 'heroku',
                label: 'Heroku',
                tooltip: 'Classic PaaS hosting. Best for: Easy deploy, familiar platform. Paid plans start $7/month (free tier discontinued).'
              },
              {
                value: 'railway',
                label: 'Railway',
                tooltip: 'Modern cloud hosting. Best for: Production bots, $5/month. One-click deploy, automatic HTTPS, logs dashboard.'
              },
              {
                value: 'aws-lambda',
                label: 'AWS Lambda',
                tooltip: 'Serverless functions. Best for: Enterprise, auto-scaling, AWS ecosystem. More complex setup but very scalable.'
              },
              {
                value: 'vercel',
                label: 'Vercel',
                tooltip: 'Serverless platform. Best for: TypeScript bots, Next.js integration, quick deploy. Free tier available.'
              },
              {
                value: 'docker',
                label: 'Docker Container',
                tooltip: 'Containerized deployment. Best for: Reproducible builds, Kubernetes, any cloud provider. Requires Docker knowledge.'
              },
            ],
            defaultValue: 'local-ngrok',
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
        description: 'Manage Slack tokens and secrets',
        tooltip: 'Store Slack bot/app tokens, signing secret, and API keys safely. Never commit secrets to Git. Uses .env file with .env.example template.',
        recommended: true,
        hidden: true, // Auto-included
      },
      {
        id: 'testing',
        name: 'Testing Setup',
        description: 'Test your bot commands and handlers',
        tooltip: 'Write tests for slash commands, shortcuts, and event handlers. Prevents regressions, documents expected behavior.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Test Framework',
            type: 'select',
            tooltip: 'Choose a test runner for Slack bot testing.',
            options: [
              {
                value: 'none',
                label: 'No Testing',
                tooltip: 'Skip testing setup. Best for: Quick prototypes, personal bots. Not recommended for production.',
                recommended: true
              },
              {
                value: 'jest',
                label: 'Jest',
                tooltip: 'Popular test framework. Best for: Slack bots, mocking Bolt framework, familiar to most devs.'
              },
              {
                value: 'vitest',
                label: 'Vitest',
                tooltip: 'Fast, modern test runner. Best for: TypeScript bots, fast feedback loops, ESM support.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
    ],
};
