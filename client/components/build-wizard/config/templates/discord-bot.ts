import type { ProjectTemplate } from '../types';

export const discordBotTemplate: ProjectTemplate = {
    id: 'discord-bot',
    name: 'Discord Bot',
    description: 'Discord.js bot with slash commands and interactions',
    tooltip: 'Build Discord bots with slash commands, buttons, modals, and event handlers. Perfect for: community moderation, custom commands, automation, games, music bots, server management, notification systems. Examples: MEE6, Dyno, Dank Memer use Discord.js. Works with Discord\'s latest API.',
    icon: null, // Will be set in component
    gradient: 'linear-gradient(90deg, #5865F2 0%, #7289DA 25%, #ffffff 50%, #7289DA 75%, #5865F2 100%)',
    command: 'npx @flzyy/create-discord-bot@latest',
    commandFlags: {
      typescript: (value) => value ? '--typescript' : '--javascript',
      packageManager: (value) => `--package-manager ${value}`,
    },
    features: [
      {
        id: 'slash-commands',
        name: 'Slash Commands',
        description: 'Modern Discord command system',
        tooltip: 'Slash commands are Discord\'s official command system. They appear in the Discord UI with autocomplete, validation, and help text. Required for all modern bots. Examples: /help, /ban @user, /play song-name. Discord deprecated old prefix commands (!help).',
        recommended: true,
        configOptions: [
          {
            id: 'commandHandler',
            label: 'Command Organization',
            type: 'select',
            tooltip: 'How to organize your slash commands for scalability.',
            options: [
              {
                value: 'category-folders',
                label: 'Category Folders',
                tooltip: 'Organize commands by category (moderation/, fun/, utility/). Best for: Bots with 10+ commands, clear organization, team development. Example: commands/moderation/ban.js',
                recommended: true
              },
              {
                value: 'single-file',
                label: 'Single File',
                tooltip: 'All commands in one file. Best for: Simple bots with <5 commands, quick prototypes. Gets messy with many commands.'
              },
              {
                value: 'command-registry',
                label: 'Command Registry',
                tooltip: 'Advanced pattern with auto-registration. Best for: Large bots (50+ commands), dynamic loading, plugin systems. Example: Dyno, MEE6 use this.'
              },
            ],
            defaultValue: 'category-folders',
          },
          {
            id: 'includeExamples',
            label: 'Include Example Commands',
            type: 'toggle',
            tooltip: 'Generate example slash commands: /ping, /help, /userinfo. Great for learning patterns and testing setup.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'interactions',
        name: 'Interactive Components',
        description: 'Buttons, select menus, and modals',
        tooltip: 'Discord UI components for rich interactions. Buttons = clickable in messages, Select Menus = dropdowns, Modals = forms/popups. Examples: reaction roles, polls, verification, settings menus.',
        recommended: true,
        configOptions: [
          {
            id: 'includeButtons',
            label: 'Button Components',
            type: 'toggle',
            tooltip: 'Add button support. Examples: "Yes/No" confirmation, pagination (Next/Prev), role selectors, game controls.',
            defaultValue: true,
          },
          {
            id: 'includeSelectMenus',
            label: 'Select Menus',
            type: 'toggle',
            tooltip: 'Add dropdown menu support. Examples: multi-role selector, language picker, category navigation, settings.',
            defaultValue: true,
          },
          {
            id: 'includeModals',
            label: 'Modal Forms',
            type: 'toggle',
            tooltip: 'Add popup form support. Examples: report user form, ticket creation, survey, configuration wizard. Modals can have text inputs.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'events',
        name: 'Event Handlers',
        description: 'React to Discord events',
        tooltip: 'Listen to Discord server events to trigger bot actions. Examples: welcome new members, log deleted messages, auto-moderate, track voice joins, react to emoji.',
        recommended: true,
        configOptions: [
          {
            id: 'eventTypes',
            label: 'Event Categories',
            type: 'select',
            tooltip: 'Which Discord events to handle in your bot.',
            options: [
              {
                value: 'essential',
                label: 'Essential Only',
                tooltip: 'messageCreate, interactionCreate, ready. Best for: Simple command bots, minimal overhead. Most bots only need these.',
                recommended: true
              },
              {
                value: 'moderation',
                label: 'Moderation Events',
                tooltip: 'Essential + messageDelete, messageUpdate, guildMemberAdd, guildMemberRemove, guildBanAdd. Best for: Moderation bots, logging, auto-mod.'
              },
              {
                value: 'comprehensive',
                label: 'Comprehensive',
                tooltip: 'All common events including voice, reactions, roles, channels. Best for: Full-featured bots, analytics, complex automation.'
              },
            ],
            defaultValue: 'essential',
          },
        ],
      },
      {
        id: 'permissions',
        name: 'Permission System',
        description: 'Role and permission management',
        tooltip: 'Control who can use commands. Examples: Admin-only commands, moderator tools, VIP features, cooldowns. Prevents abuse and unauthorized use.',
        configOptions: [
          {
            id: 'permissionType',
            label: 'Permission Model',
            type: 'select',
            tooltip: 'How to check user permissions for commands.',
            options: [
              {
                value: 'discord-native',
                label: 'Discord Permissions',
                tooltip: 'Use Discord\'s built-in permissions (Administrator, Manage Messages, etc.). Best for: Simple bots, standard moderation. Easy to use, Discord UI support.',
                recommended: true
              },
              {
                value: 'role-based',
                label: 'Role-Based',
                tooltip: 'Check by role names/IDs. Best for: Custom hierarchies, VIP systems, custom permissions. Example: "Premium" role gets extra commands.'
              },
              {
                value: 'custom-db',
                label: 'Custom Database',
                tooltip: 'Store permissions in database. Best for: Per-user permissions, complex systems, multi-server setups. Most flexible but requires database.'
              },
            ],
            defaultValue: 'discord-native',
          },
        ],
      },
      {
        id: 'database',
        name: 'Database Integration',
        description: 'Store persistent data',
        tooltip: 'Save data across bot restarts. Examples: user levels/XP, economy systems, custom settings, moderation logs, leaderboards, user preferences.',
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
                tooltip: 'File-based SQL database. Best for: Small-medium bots (<100 servers), easy setup, no hosting needed. Fast for single-server deployment.'
              },
              {
                value: 'mongodb',
                label: 'MongoDB (Cloud)',
                tooltip: 'NoSQL cloud database. Best for: Large bots (100+ servers), flexible schemas, horizontal scaling. Free tier: MongoDB Atlas.'
              },
              {
                value: 'postgresql',
                label: 'PostgreSQL (Cloud)',
                tooltip: 'SQL cloud database. Best for: Complex queries, relational data, transactions. Free tier: Supabase, Railway.'
              },
            ],
            defaultValue: 'none',
          },
        ],
        autoBundles: ['env-config'],
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
                tooltip: 'Basic console.log. Best for: Development, small bots. No setup needed. Not recommended for production.',
                recommended: true
              },
              {
                value: 'pino',
                label: 'Pino (Fast)',
                tooltip: 'Fast structured logging. Best for: Production bots, performance-critical apps. Integrates with log aggregators (Datadog, Logtail).'
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
        id: 'features',
        name: 'Bot Features',
        description: 'Common Discord bot functionality',
        tooltip: 'Pre-built features to add to your bot. Save time with ready-made implementations of popular bot features.',
        configOptions: [
          {
            id: 'includeEconomy',
            label: 'Economy System',
            type: 'toggle',
            tooltip: 'Virtual currency, shops, inventory. Examples: /balance, /daily, /buy, /leaderboard. Requires database. Popular feature for engagement.',
            defaultValue: false,
          },
          {
            id: 'includeLeveling',
            label: 'Leveling/XP System',
            type: 'toggle',
            tooltip: 'User levels and experience points. Examples: /rank, /leaderboard, role rewards. Requires database. Boosts server activity.',
            defaultValue: false,
          },
          {
            id: 'includeModeration',
            label: 'Moderation Tools',
            type: 'toggle',
            tooltip: 'Moderation commands: /ban, /kick, /mute, /warn, /purge. Includes logging and reason tracking. Essential for server management.',
            defaultValue: false,
          },
          {
            id: 'includeMusic',
            label: 'Music Player',
            type: 'toggle',
            tooltip: 'Play music from YouTube/Spotify. Examples: /play, /skip, /queue, /pause. Uses discord-player or voice library. Resource-intensive.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Hosting & Deployment',
        description: 'Where to run your Discord bot',
        tooltip: 'Discord bots must run 24/7 to respond to commands. Choose hosting that fits your bot\'s scale and budget.',
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Hosting Platform',
            type: 'select',
            tooltip: 'Where will your bot be hosted?',
            options: [
              {
                value: 'local',
                label: 'Local Machine',
                tooltip: 'Run on your computer. Best for: Development, testing. Free but requires your PC to stay on 24/7. Not for production.',
                recommended: true
              },
              {
                value: 'railway',
                label: 'Railway',
                tooltip: 'Easy cloud hosting for Discord bots. Best for: Production bots, $5/month. One-click deploy, automatic restarts, logs dashboard.'
              },
              {
                value: 'heroku',
                label: 'Heroku',
                tooltip: 'Classic PaaS hosting. Best for: Simple deploy, familiar platform. Free tier discontinued (Nov 2022), paid plans start $7/month.'
              },
              {
                value: 'vps',
                label: 'VPS (DigitalOcean/Linode)',
                tooltip: 'Virtual private server. Best for: Full control, multiple bots, custom setup. Requires Linux knowledge. $4-6/month.'
              },
              {
                value: 'docker',
                label: 'Docker Container',
                tooltip: 'Containerized deployment. Best for: Reproducible builds, multi-platform, Kubernetes. Deploy to any cloud provider.'
              },
            ],
            defaultValue: 'local',
          },
          {
            id: 'includeDockerfile',
            label: 'Include Dockerfile',
            type: 'toggle',
            tooltip: 'Generate Dockerfile for container deployment. Useful even for non-Docker hosting (ensures reproducible builds).',
            defaultValue: false,
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
        description: 'Manage bot token and secrets',
        tooltip: 'Store Discord bot token, API keys, and config safely. Never commit secrets to Git. Uses .env file with .env.example template.',
        recommended: true,
        hidden: true, // Auto-included
      },
      {
        id: 'testing',
        name: 'Testing Setup',
        description: 'Test your bot commands and handlers',
        tooltip: 'Write tests for commands and event handlers. Prevents regressions, documents expected behavior.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Test Framework',
            type: 'select',
            tooltip: 'Choose a test runner for bot testing.',
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
                tooltip: 'Popular test framework. Best for: Discord bots, mocking Discord.js, familiar to most devs. Extensive Discord.js testing guides available.'
              },
              {
                value: 'vitest',
                label: 'Vitest',
                tooltip: 'Fast, modern test runner. Best for: TypeScript bots, Vite projects, fast feedback loops.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
    ],
};
