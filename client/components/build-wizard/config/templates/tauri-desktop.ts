import type { ProjectTemplate } from '../types';

export const tauriDesktopTemplate: ProjectTemplate = {
    id: 'tauri-desktop',
    name: 'Tauri Desktop App',
    description: 'Cross-platform desktop app with Rust backend',
    tooltip: 'Build lightweight, secure desktop apps for Windows, macOS, and Linux. Smaller than Electron (3MB vs 120MB), faster startup, better security. Perfect for: productivity tools, system utilities, media apps, dashboards, local-first apps. Examples: 1Password, Warp, Radicle use Tauri. Uses OS WebView instead of bundling Chromium.',
    icon: null, // Will be set in component
    gradient: 'linear-gradient(90deg, #FFC131 0%, #FFD84D 25%, #ffffff 50%, #FFD84D 75%, #FFC131 100%)',
    command: 'npm create tauri-app@latest',
    commandFlags: {},
    features: [
      {
        id: 'frontend-framework',
        name: 'Frontend Framework',
        description: 'Choose your web framework',
        tooltip: 'Tauri uses web technologies for the UI. Choose a framework you\'re comfortable with. The frontend runs in OS WebView (not Chromium), keeping bundle size tiny.',
        recommended: true,
        configOptions: [
          {
            id: 'framework',
            label: 'Framework',
            type: 'select',
            tooltip: 'Which frontend framework to use for your desktop app UI.',
            options: [
              {
                value: 'react',
                label: 'React',
                tooltip: 'Most popular framework. Best for: Large apps, complex UIs, familiar to most devs. Huge ecosystem.',
                recommended: true
              },
              {
                value: 'vue',
                label: 'Vue',
                tooltip: 'Progressive framework. Best for: Gradual adoption, elegant syntax, great docs. Popular in Europe/Asia.'
              },
              {
                value: 'svelte',
                label: 'Svelte',
                tooltip: 'Compile-time framework. Best for: Smaller bundles, faster runtime, simpler code. No virtual DOM overhead.'
              },
              {
                value: 'solid',
                label: 'SolidJS',
                tooltip: 'Fine-grained reactivity. Best for: Performance-critical apps, reactive UIs. Similar to React but faster.'
              },
              {
                value: 'vanilla',
                label: 'Vanilla (HTML/CSS/JS)',
                tooltip: 'No framework. Best for: Simple apps, learning Tauri, minimal overhead. Lightest option.'
              },
            ],
            defaultValue: 'react',
          },
          {
            id: 'typescript',
            label: 'Use TypeScript',
            type: 'toggle',
            tooltip: 'Add TypeScript for type safety. Highly recommended for Tauri apps (Rust backend is typed, frontend should be too).',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'tauri-features',
        name: 'Tauri Native Features',
        description: 'OS-level integrations',
        tooltip: 'Tauri provides plugins for native OS features. These run in the Rust backend and are exposed to frontend via IPC. Secure by default with permission system.',
        recommended: true,
        configOptions: [
          {
            id: 'includeSystemTray',
            label: 'System Tray Icon',
            type: 'toggle',
            tooltip: 'Add app to system tray (menu bar on macOS, taskbar on Windows). Examples: quick actions, show/hide window, status indicators. Great for background apps.',
            defaultValue: true,
          },
          {
            id: 'includeNotifications',
            label: 'OS Notifications',
            type: 'toggle',
            tooltip: 'Send native desktop notifications. Examples: task reminders, alerts, status updates. Uses OS notification center.',
            defaultValue: true,
          },
          {
            id: 'includeFileSystem',
            label: 'File System Access',
            type: 'toggle',
            tooltip: 'Read/write files with permission dialogs. Examples: save/load documents, config files, exports. Sandboxed for security.',
            defaultValue: true,
          },
          {
            id: 'includeDialog',
            label: 'Native Dialogs',
            type: 'toggle',
            tooltip: 'Open/save file dialogs, message boxes, confirm dialogs. Uses OS-native dialogs (looks native on each platform).',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'window-config',
        name: 'Window Configuration',
        description: 'App window behavior',
        tooltip: 'Configure how your app window behaves. Frameless/transparent windows for custom designs, multi-window support for complex apps.',
        configOptions: [
          {
            id: 'windowType',
            label: 'Window Style',
            type: 'select',
            tooltip: 'How should the app window look?',
            options: [
              {
                value: 'standard',
                label: 'Standard Window',
                tooltip: 'Normal window with OS-native title bar. Best for: Traditional desktop apps, familiar UX. Easiest to use.',
                recommended: true
              },
              {
                value: 'frameless',
                label: 'Frameless (Custom Title Bar)',
                tooltip: 'Remove OS title bar, create custom UI. Best for: Modern apps, custom branding. Examples: VS Code, Spotify. Requires custom close/minimize buttons.'
              },
              {
                value: 'transparent',
                label: 'Transparent Window',
                tooltip: 'Fully transparent window. Best for: Widgets, overlays, creative UIs. Advanced use case.'
              },
            ],
            defaultValue: 'standard',
          },
          {
            id: 'includeMultiWindow',
            label: 'Multi-Window Support',
            type: 'toggle',
            tooltip: 'Enable opening multiple windows. Examples: preferences window, inspector, secondary views. Like opening new browser tabs.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'updater',
        name: 'Auto-Updater',
        description: 'Automatic app updates',
        tooltip: 'Tauri\'s updater downloads and installs new versions automatically. Essential for production apps. Users get updates without visiting your website.',
        configOptions: [
          {
            id: 'enableUpdater',
            label: 'Enable Auto-Updates',
            type: 'toggle',
            tooltip: 'Check for updates on app launch. Downloads and installs silently. Requires hosting update manifest JSON. Best practice for all production apps.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'database',
        name: 'Local Database',
        description: 'Store app data locally',
        tooltip: 'Desktop apps often need local storage. Options range from simple JSON files to full SQL databases. All stored on user\'s machine (offline-first).',
        configOptions: [
          {
            id: 'dbType',
            label: 'Database Type',
            type: 'select',
            tooltip: 'How to store app data locally.',
            options: [
              {
                value: 'none',
                label: 'No Database',
                tooltip: 'No persistent storage (or use browser localStorage). Best for: Simple apps, stateless tools. Data lost when app closes.',
                recommended: true
              },
              {
                value: 'sqlite',
                label: 'SQLite (Rust)',
                tooltip: 'SQL database in Rust backend. Best for: Structured data, complex queries, large datasets. Fast, reliable, offline. Popular choice.'
              },
              {
                value: 'surrealdb',
                label: 'SurrealDB',
                tooltip: 'Modern multi-model DB. Best for: Graph data, real-time sync, flexible schemas. Embedded mode for offline use.'
              },
              {
                value: 'tauri-store',
                label: 'Tauri Store Plugin',
                tooltip: 'Simple key-value store. Best for: App settings, preferences, small data. Easy to use, JSON-based.'
              },
            ],
            defaultValue: 'none',
          },
        ],
        autoBundles: ['env-config'],
      },
      {
        id: 'ipc-patterns',
        name: 'IPC & Backend Logic',
        description: 'Frontend-backend communication',
        tooltip: 'Tauri apps split logic: frontend (UI in WebView) and backend (Rust for performance/security). IPC = how they communicate. Define commands in Rust, call from JS.',
        configOptions: [
          {
            id: 'ipcPattern',
            label: 'IPC Organization',
            type: 'select',
            tooltip: 'How to organize backend Rust commands.',
            options: [
              {
                value: 'modules',
                label: 'Module-Based',
                tooltip: 'Organize commands by feature module. Best for: Medium-large apps, team development. Example: src-tauri/src/commands/file.rs',
                recommended: true
              },
              {
                value: 'single-file',
                label: 'Single File',
                tooltip: 'All commands in main.rs. Best for: Small apps (<10 commands), quick prototypes. Gets messy at scale.'
              },
            ],
            defaultValue: 'modules',
          },
        ],
      },
      {
        id: 'security',
        name: 'Security & Permissions',
        description: 'App security configuration',
        tooltip: 'Tauri is secure by default. Fine-grained permissions control what frontend can access. CSP prevents XSS attacks. Essential for production apps.',
        recommended: true,
        configOptions: [
          {
            id: 'securityLevel',
            label: 'Security Preset',
            type: 'select',
            tooltip: 'How strict should security be?',
            options: [
              {
                value: 'recommended',
                label: 'Recommended',
                tooltip: 'Balanced security. Best for: Most apps. Enables CSP, restricts dangerous APIs, allows common use cases.',
                recommended: true
              },
              {
                value: 'strict',
                label: 'Strict (Paranoid)',
                tooltip: 'Maximum security. Best for: Financial apps, sensitive data. Blocks everything by default, explicit allow-list only.'
              },
              {
                value: 'permissive',
                label: 'Permissive (Dev)',
                tooltip: 'Relaxed for development. Best for: Rapid prototyping, learning. NOT for production. Disables some safety checks.'
              },
            ],
            defaultValue: 'recommended',
          },
        ],
        hidden: true, // Auto-included
      },
      {
        id: 'packaging',
        name: 'Build & Distribution',
        description: 'How to package and distribute',
        tooltip: 'Tauri builds native installers for each platform. Smaller bundles than Electron (3-10MB vs 120MB). Code signing for macOS/Windows trust.',
        configOptions: [
          {
            id: 'platforms',
            label: 'Target Platforms',
            type: 'select',
            tooltip: 'Which operating systems to support.',
            options: [
              {
                value: 'all',
                label: 'All Platforms',
                tooltip: 'Windows, macOS, Linux. Best for: Maximum reach, cross-platform tools. Requires testing on each OS.',
                recommended: true
              },
              {
                value: 'desktop-only',
                label: 'Desktop Only (Win + Mac)',
                tooltip: 'Skip Linux. Best for: Consumer apps, most users are on Win/Mac. Simpler QA.'
              },
              {
                value: 'single-platform',
                label: 'Single Platform',
                tooltip: 'One OS only. Best for: Internal tools, platform-specific features. Easier to develop/test.'
              },
            ],
            defaultValue: 'all',
          },
          {
            id: 'includeCodeSigning',
            label: 'Code Signing Setup',
            type: 'toggle',
            tooltip: 'Configure for macOS notarization and Windows code signing. Prevents "untrusted developer" warnings. Required for production distribution.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'developer-tools',
        name: 'Developer Experience',
        description: 'Development and debugging tools',
        tooltip: 'Tools to make Tauri development easier. Hot reload for fast iteration, devtools for debugging, logging for troubleshooting.',
        configOptions: [
          {
            id: 'includeDevTools',
            label: 'Enable DevTools',
            type: 'toggle',
            tooltip: 'Chrome DevTools in development builds. Inspect UI, debug JS, view network. Automatically disabled in production.',
            defaultValue: true,
          },
          {
            id: 'loggingLib',
            label: 'Logging',
            type: 'select',
            tooltip: 'How to log from Rust backend.',
            options: [
              {
                value: 'env_logger',
                label: 'env_logger (Simple)',
                tooltip: 'Standard Rust logging. Best for: Development, simple apps. Configure via RUST_LOG env var.',
                recommended: true
              },
              {
                value: 'tracing',
                label: 'tracing (Advanced)',
                tooltip: 'Structured logging with spans. Best for: Complex apps, performance profiling, production debugging. More powerful.'
              },
            ],
            defaultValue: 'env_logger',
          },
        ],
      },
      {
        id: 'mobile-support',
        name: 'Mobile Support (Beta)',
        description: 'iOS and Android apps',
        tooltip: 'Tauri 2.0 added mobile support (beta). Same codebase for desktop AND mobile. Still experimental but promising for cross-platform apps.',
        configOptions: [
          {
            id: 'enableMobile',
            label: 'Enable Mobile Targets',
            type: 'toggle',
            tooltip: 'Add iOS and Android support. BETA feature. Best for: Experimenting, cross-platform MVP. Not production-ready yet.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'Linting and formatting',
        tooltip: 'Ensure code quality for both frontend (ESLint/Prettier) and backend (Clippy/rustfmt). Essential for team development.',
        recommended: true,
        hidden: true, // Auto-included
      },
      {
        id: 'env-config',
        name: 'Environment Configuration',
        description: 'Manage secrets and config',
        tooltip: 'Environment variables for API keys, feature flags, etc. Never commit secrets to Git. Uses .env with .env.example template.',
        recommended: true,
        hidden: true, // Auto-included
      },
      {
        id: 'testing',
        name: 'Testing Setup',
        description: 'Test your app',
        tooltip: 'Test both frontend (Vitest/Jest) and backend (Rust tests). E2E testing with WebDriver. Prevents regressions.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Frontend Test Framework',
            type: 'select',
            tooltip: 'Choose a test runner for frontend code.',
            options: [
              {
                value: 'vitest',
                label: 'Vitest',
                tooltip: 'Fast, modern test runner. Best for: Vite projects, TypeScript, fast feedback. Recommended for Tauri.',
                recommended: true
              },
              {
                value: 'jest',
                label: 'Jest',
                tooltip: 'Popular test framework. Best for: React apps, familiar to most devs. Mature ecosystem.'
              },
              {
                value: 'none',
                label: 'No Testing',
                tooltip: 'Skip testing setup. Best for: Quick prototypes. Not recommended for production apps.'
              },
            ],
            defaultValue: 'vitest',
          },
          {
            id: 'includeE2E',
            label: 'E2E Testing (WebDriver)',
            type: 'toggle',
            tooltip: 'End-to-end testing with WebDriver. Test full app workflows. Examples: opening windows, clicking buttons, verifying results.',
            defaultValue: false,
          },
        ],
      },
    ],
};
