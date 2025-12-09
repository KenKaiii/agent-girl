import type { ProjectTemplate } from '../types';

export const vscodeExtensionTemplate: ProjectTemplate = {
    id: 'vscode-extension',
    name: 'VS Code Extension',
    description: 'Visual Studio Code extension with TypeScript',
    tooltip: 'Build extensions for VS Code, used by 20M+ developers. Monetize via marketplace, Gumroad, or license keys. Developers pay $10-100 for productivity tools. Examples: GitHub Copilot ($10/mo), Prettier, ESLint. Perfect for code snippets, linters, formatters, AI features, or any developer tool.',
    icon: null,
    gradient: 'linear-gradient(90deg, #007ACC 0%, #52B0E8 25%, #ffffff 50%, #52B0E8 75%, #007ACC 100%)',
    command: 'npx --package yo --package generator-code -- yo code',
    features: [
      {
        id: 'extension-type',
        name: 'Extension Type',
        description: 'What your extension provides',
        tooltip: 'VS Code supports different extension types. Choose based on your use case.',
        recommended: true,
        configOptions: [
          {
            id: 'extensionType',
            label: 'Extension Type',
            type: 'select',
            tooltip: 'Type of VS Code extension to create',
            options: [
              {
                value: 'command',
                label: 'Command Extension',
                tooltip: 'Add commands to command palette. Best for: Actions, tools, utilities. Most common type.',
                recommended: true
              },
              {
                value: 'language',
                label: 'Language Support',
                tooltip: 'Add language features (syntax, intellisense, formatting). Best for: New language support.'
              },
              {
                value: 'theme',
                label: 'Color Theme',
                tooltip: 'Custom VS Code theme. Best for: Visual customization, selling themes.'
              },
              {
                value: 'webview',
                label: 'Webview UI',
                tooltip: 'Custom panels with HTML/React. Best for: Complex UIs, dashboards, visualizations.'
              },
            ],
            defaultValue: 'command',
          },
        ],
      },
      {
        id: 'language-features',
        name: 'Language Features',
        description: 'IntelliSense, diagnostics, formatting',
        tooltip: 'Add code completion, error checking, formatting for languages. Uses Language Server Protocol (LSP). Advanced feature for language extensions.',
        configOptions: [
          {
            id: 'includeLsp',
            label: 'Language Server (LSP)',
            type: 'toggle',
            tooltip: 'Add Language Server Protocol for rich language features. Complex but powerful.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'webview-ui',
        name: 'Webview Panels',
        description: 'Custom UI with HTML/CSS/JS',
        tooltip: 'Create custom panels inside VS Code. Use React, Vue, or vanilla JS. Great for dashboards, forms, visualizations. Note: Webview UI Toolkit deprecated Jan 2025.',
        configOptions: [
          {
            id: 'webviewFramework',
            label: 'Webview Framework',
            type: 'select',
            tooltip: 'UI framework for webview panels',
            options: [
              {
                value: 'none',
                label: 'No Webview',
                tooltip: 'Command-only extension. Best for: Simple tools, no custom UI needed.',
                recommended: true
              },
              {
                value: 'vanilla',
                label: 'Vanilla JS/HTML',
                tooltip: 'Plain HTML/CSS/JS. Best for: Simple UIs, lightweight, no build complexity.'
              },
              {
                value: 'react',
                label: 'React',
                tooltip: 'React for webviews. Best for: Complex UIs, reusable components. Requires webpack setup.'
              },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        id: 'commands',
        name: 'Command Palette',
        description: 'Register VS Code commands',
        tooltip: 'Add commands users trigger via Cmd+Shift+P. Essential for command extensions. Include keybindings for power users.',
        recommended: true,
        hidden: true, // Always included for command type
      },
      {
        id: 'configuration',
        name: 'Settings & Configuration',
        description: 'User preferences for your extension',
        tooltip: 'Add settings to VS Code settings UI. Let users customize your extension behavior.',
        recommended: true,
        configOptions: [
          {
            id: 'includeSettings',
            label: 'Extension Settings',
            type: 'toggle',
            tooltip: 'Add configurable settings accessible via VS Code settings UI.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'file-system',
        name: 'File System Access',
        description: 'Read/write workspace files',
        tooltip: 'Access workspace files, watch for changes, modify code. Essential for code generators, formatters, linters.',
        configOptions: [
          {
            id: 'includeFileWatchers',
            label: 'File Watchers',
            type: 'toggle',
            tooltip: 'React to file changes in workspace. Best for: Linters, auto-formatters, sync tools.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'git-integration',
        name: 'Git Integration',
        description: 'Work with Git repositories',
        tooltip: 'Access Git data, modify commits, show diff views. Great for Git tools and workflow extensions.',
        configOptions: [
          {
            id: 'includeGit',
            label: 'Git API Access',
            type: 'toggle',
            tooltip: 'Use VS Code Git API to read repo status, branches, commits.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'external-apis',
        name: 'External API Integration',
        description: 'Connect to third-party services',
        tooltip: 'Call external APIs (AI services, databases, web services). Common for AI coding assistants, data fetchers.',
        configOptions: [
          {
            id: 'includeHttpClient',
            label: 'HTTP Client',
            type: 'toggle',
            tooltip: 'Add axios/fetch setup for API calls. Include rate limiting and error handling.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'licensing',
        name: 'Monetization',
        description: 'License keys for premium features',
        tooltip: 'Add license validation for paid extensions. Sell via Gumroad, marketplace, or custom platform.',
        configOptions: [
          {
            id: 'licenseModel',
            label: 'License Model',
            type: 'select',
            tooltip: 'How to monetize your extension',
            options: [
              {
                value: 'free',
                label: 'Free Extension',
                tooltip: 'No licensing, fully free. Best for: Open source, building audience.',
                recommended: true
              },
              {
                value: 'freemium',
                label: 'Freemium',
                tooltip: 'Free + premium features. Best for: Trial, conversion funnel. Validate with license keys.'
              },
              {
                value: 'paid',
                label: 'Paid Only',
                tooltip: 'Requires license key. Best for: Specialized tools, enterprise features.'
              },
            ],
            defaultValue: 'free',
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Extension testing with vscode-test',
        tooltip: 'Test extension in real VS Code instance. Essential for quality extensions.',
        recommended: true,
        configOptions: [
          {
            id: 'includeTests',
            label: 'Include Tests',
            type: 'toggle',
            tooltip: 'Set up vscode-test for integration testing. Includes example tests.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Publishing',
        description: 'Publish to VS Code Marketplace',
        tooltip: 'Publish extension to marketplace (60K+ extensions). Free to publish, optional paid listings.',
        recommended: true,
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Distribution',
            type: 'select',
            tooltip: 'How users will install your extension',
            options: [
              {
                value: 'marketplace',
                label: 'VS Code Marketplace',
                tooltip: 'Official marketplace. Best for: Maximum reach, credibility, free distribution.',
                recommended: true
              },
              {
                value: 'private',
                label: 'Private Distribution',
                tooltip: 'VSIX file distribution. Best for: Enterprise, internal tools, pre-release.'
              },
            ],
            defaultValue: 'marketplace',
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, TypeScript',
        tooltip: 'TypeScript strongly recommended for VS Code extensions. Catch errors before runtime.',
        recommended: true,
        hidden: true,
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage API keys and secrets',
        tooltip: 'Store API keys for external services. Use VS Code secrets API for secure storage.',
        recommended: true,
        hidden: true,
      },
    ],
};
