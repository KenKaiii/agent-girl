import type { ProjectTemplate } from '../types';

export const expoMobileTemplate: ProjectTemplate = {
    id: 'expo-mobile',
    name: 'Mobile App (Expo)',
    description: 'Cross-platform iOS/Android app with React Native',
    tooltip: 'Build native mobile apps for iOS and Android from one codebase. Easier than React Native CLI, includes web support. Perfect for: social apps, e-commerce, productivity tools, utilities, games. Examples: Coinbase, Microsoft, Siemens use Expo. No Mac needed for iOS builds (EAS Build)!',
    icon: null, // Will be set in component
    gradient: 'linear-gradient(90deg, #4630EB 0%, #7C65FF 25%, #ffffff 50%, #7C65FF 75%, #4630EB 100%)',
    command: 'npx create-expo-app@latest',
    commandFlags: {
      template: (value) => `--template ${value}`,
    },
    features: [
      {
        id: 'template-type',
        name: 'Starting Template',
        description: 'Base template to start from',
        tooltip: 'Expo provides templates with different starting points. Choose based on your app complexity.',
        recommended: true,
        configOptions: [
          {
            id: 'templateChoice',
            label: 'Template',
            type: 'select',
            tooltip: 'Which Expo template to use.',
            options: [
              {
                value: 'blank-typescript',
                label: 'Blank (TypeScript)',
                tooltip: 'Minimal app with TypeScript. Best for: Most apps, custom setup, TypeScript recommended. Clean starting point.',
                recommended: true
              },
              {
                value: 'tabs',
                label: 'Tabs (TypeScript)',
                tooltip: 'Pre-configured tab navigation. Best for: Apps with bottom tabs (like Instagram, Twitter). Saves setup time.'
              },
              {
                value: 'blank',
                label: 'Blank (JavaScript)',
                tooltip: 'Minimal app with JavaScript. Best for: Quick prototypes, no TypeScript needed. Not recommended for production.'
              },
            ],
            defaultValue: 'blank-typescript',
          },
        ],
      },
      {
        id: 'navigation',
        name: 'Navigation',
        description: 'How users move between screens',
        tooltip: 'Navigation is essential for multi-screen apps. Expo Router is modern (file-based like Next.js), React Navigation is traditional.',
        recommended: true,
        configOptions: [
          {
            id: 'navType',
            label: 'Navigation Library',
            type: 'select',
            tooltip: 'Which navigation system to use.',
            options: [
              {
                value: 'expo-router',
                label: 'Expo Router (File-Based)',
                tooltip: 'Next.js-style file-based routing. Best for: Modern apps, deep linking, web support. Routes defined by file structure. Recommended!',
                recommended: true
              },
              {
                value: 'react-navigation',
                label: 'React Navigation',
                tooltip: 'Traditional navigation library. Best for: Custom navigation, complex flows, existing RN apps. More flexible but manual setup.'
              },
              {
                value: 'none',
                label: 'No Navigation',
                tooltip: 'Single screen app. Best for: Simple utilities, demos, learning. Add navigation later if needed.'
              },
            ],
            defaultValue: 'expo-router',
          },
          {
            id: 'navPatterns',
            label: 'Navigation Patterns',
            type: 'select',
            tooltip: 'Common navigation UI patterns to include.',
            options: [
              {
                value: 'tabs-stack',
                label: 'Tabs + Stack',
                tooltip: 'Bottom tabs with stacks. Best for: Most apps (Instagram, Twitter style). Each tab has its own stack of screens.',
                recommended: true
              },
              {
                value: 'drawer',
                label: 'Drawer (Sidebar)',
                tooltip: 'Slide-out sidebar menu. Best for: Content-heavy apps, many sections. Common in news/productivity apps.'
              },
              {
                value: 'stack-only',
                label: 'Stack Only',
                tooltip: 'Simple push/pop navigation. Best for: Linear flows, wizards, onboarding. Simpler than tabs.'
              },
            ],
            defaultValue: 'tabs-stack',
          },
        ],
      },
      {
        id: 'ui-styling',
        name: 'UI & Styling',
        description: 'How to style your app',
        tooltip: 'Choose a styling approach. NativeWind (Tailwind for mobile) is modern and familiar to web devs.',
        configOptions: [
          {
            id: 'stylingLib',
            label: 'Styling Library',
            type: 'select',
            tooltip: 'How to style components.',
            options: [
              {
                value: 'nativewind',
                label: 'NativeWind (Tailwind)',
                tooltip: 'Tailwind CSS for React Native. Best for: Web developers, rapid styling, utility-first. Familiar API. Recommended!',
                recommended: true
              },
              {
                value: 'rn-paper',
                label: 'React Native Paper',
                tooltip: 'Material Design components. Best for: Material design apps, pre-built components, Android-first apps.'
              },
              {
                value: 'tamagui',
                label: 'Tamagui',
                tooltip: 'Universal UI kit (web + native). Best for: Cross-platform design systems, performance-critical apps. Advanced.'
              },
              {
                value: 'stylesheet',
                label: 'StyleSheet (Native)',
                tooltip: 'React Native\'s built-in styling. Best for: Learning RN, no dependencies, full control. Manual but flexible.'
              },
            ],
            defaultValue: 'nativewind',
          },
        ],
      },
      {
        id: 'authentication',
        name: 'Authentication',
        description: 'User login and signup',
        tooltip: 'Let users create accounts and sign in. Essential for most apps with user-specific data.',
        configOptions: [
          {
            id: 'authProvider',
            label: 'Auth Provider',
            type: 'select',
            tooltip: 'Which authentication service to use.',
            options: [
              {
                value: 'supabase',
                label: 'Supabase',
                tooltip: 'Open-source Firebase alternative. Best for: Full backend (auth + database + storage), generous free tier. Includes RLS security.',
                recommended: true
              },
              {
                value: 'clerk',
                label: 'Clerk',
                tooltip: 'Modern auth platform. Best for: Beautiful UI components, passwordless auth, webhooks. Great DX, paid service.'
              },
              {
                value: 'firebase',
                label: 'Firebase Auth',
                tooltip: 'Google\'s auth service. Best for: Google ecosystem, social logins, phone auth. Mature, free tier available.'
              },
              {
                value: 'expo-auth-session',
                label: 'Expo Auth Session',
                tooltip: 'OAuth helper for custom providers. Best for: Custom backend, OAuth flows, SSO. More manual setup.'
              },
              {
                value: 'none',
                label: 'No Authentication',
                tooltip: 'No user accounts. Best for: Utilities, demos, public apps. Add later if needed.'
              },
            ],
            defaultValue: 'supabase',
          },
        ],
        autoBundles: ['env-config'],
      },
      {
        id: 'state-management',
        name: 'State Management',
        description: 'Manage app-wide state',
        tooltip: 'Share data between screens (user info, cart, preferences). Zustand is simplest, Redux is most powerful.',
        configOptions: [
          {
            id: 'stateLib',
            label: 'State Library',
            type: 'select',
            tooltip: 'How to manage global app state.',
            options: [
              {
                value: 'zustand',
                label: 'Zustand',
                tooltip: 'Simple hooks-based state. Best for: Most apps, easy to learn, minimal boilerplate. Recommended for Expo!',
                recommended: true
              },
              {
                value: 'redux',
                label: 'Redux Toolkit',
                tooltip: 'Powerful state management. Best for: Complex apps, time-travel debugging, large teams. More boilerplate.'
              },
              {
                value: 'jotai',
                label: 'Jotai',
                tooltip: 'Atomic state management. Best for: Fine-grained updates, React Suspense integration. Modern approach.'
              },
              {
                value: 'context',
                label: 'React Context',
                tooltip: 'Built-in React state. Best for: Simple apps, learning, no extra dependencies. Can cause re-renders.'
              },
            ],
            defaultValue: 'zustand',
          },
        ],
      },
      {
        id: 'data-storage',
        name: 'Data Storage',
        description: 'Store data locally on device',
        tooltip: 'Save data offline. AsyncStorage for simple data, SQLite for complex queries, Realm for offline-first.',
        configOptions: [
          {
            id: 'storageType',
            label: 'Storage Type',
            type: 'select',
            tooltip: 'How to store data on device.',
            options: [
              {
                value: 'async-storage',
                label: 'AsyncStorage',
                tooltip: 'Simple key-value storage. Best for: Settings, preferences, small data. Easy to use, 6MB limit. Recommended for most apps.',
                recommended: true
              },
              {
                value: 'sqlite',
                label: 'SQLite (expo-sqlite)',
                tooltip: 'SQL database on device. Best for: Large datasets, complex queries, offline-first apps. More powerful than AsyncStorage.'
              },
              {
                value: 'watermelondb',
                label: 'WatermelonDB',
                tooltip: 'Offline-first database. Best for: Sync with backend, reactive queries, large datasets. Advanced use case.'
              },
              {
                value: 'secure-store',
                label: 'SecureStore (Credentials)',
                tooltip: 'Encrypted storage for secrets. Best for: API keys, tokens, passwords. Uses Keychain (iOS) / Keystore (Android).'
              },
            ],
            defaultValue: 'async-storage',
          },
        ],
      },
      {
        id: 'native-features',
        name: 'Native Features',
        description: 'Device capabilities',
        tooltip: 'Access native device features. Expo provides easy-to-use modules for camera, location, notifications, etc.',
        configOptions: [
          {
            id: 'includeCamera',
            label: 'Camera & Media',
            type: 'toggle',
            tooltip: 'Take photos, record video, pick from library. Examples: profile pictures, photo sharing, QR scanner.',
            defaultValue: false,
          },
          {
            id: 'includeLocation',
            label: 'Location Services',
            type: 'toggle',
            tooltip: 'Get GPS location, geofencing, maps. Examples: delivery apps, social check-ins, location-based features.',
            defaultValue: false,
          },
          {
            id: 'includePushNotifications',
            label: 'Push Notifications',
            type: 'toggle',
            tooltip: 'Send notifications to users. Examples: chat messages, reminders, alerts. Requires Expo push service or Firebase.',
            defaultValue: false,
          },
          {
            id: 'includeBiometrics',
            label: 'Biometric Auth',
            type: 'toggle',
            tooltip: 'Face ID / Touch ID / Fingerprint. Examples: secure login, payment confirmation. iOS/Android native auth.',
            defaultValue: false,
          },
          {
            id: 'includeInAppPurchases',
            label: 'In-App Purchases',
            type: 'toggle',
            tooltip: 'Sell subscriptions, consumables, premium features. Examples: subscriptions, coins, pro upgrades. App Store integration.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'backend-integration',
        name: 'Backend & API',
        description: 'Connect to backend services',
        tooltip: 'Most apps need a backend for data, auth, storage. Choose based on features needed.',
        configOptions: [
          {
            id: 'backendType',
            label: 'Backend Service',
            type: 'select',
            tooltip: 'Which backend to use.',
            options: [
              {
                value: 'supabase',
                label: 'Supabase',
                tooltip: 'PostgreSQL database + auth + storage + realtime. Best for: Full-stack apps, SQL, open-source. Generous free tier.',
                recommended: true
              },
              {
                value: 'firebase',
                label: 'Firebase',
                tooltip: 'Google BaaS (database, auth, storage, functions). Best for: Google ecosystem, NoSQL, real-time. Free tier available.'
              },
              {
                value: 'custom-api',
                label: 'Custom API (REST)',
                tooltip: 'Your own backend API. Best for: Existing backend, custom logic, full control. Use fetch/axios.'
              },
              {
                value: 'graphql',
                label: 'GraphQL (Apollo)',
                tooltip: 'GraphQL API with Apollo Client. Best for: GraphQL backends, efficient queries, type safety.'
              },
              {
                value: 'none',
                label: 'No Backend',
                tooltip: 'Local-only app. Best for: Utilities, games, calculators. No server needed.'
              },
            ],
            defaultValue: 'supabase',
          },
        ],
      },
      {
        id: 'analytics',
        name: 'Analytics & Monitoring',
        description: 'Track usage and errors',
        tooltip: 'Understand how users use your app, catch crashes. Essential for production apps.',
        configOptions: [
          {
            id: 'analyticsProvider',
            label: 'Analytics',
            type: 'select',
            tooltip: 'Track user behavior and app usage.',
            options: [
              {
                value: 'expo-analytics',
                label: 'Expo Analytics',
                tooltip: 'Built-in Expo analytics. Best for: Simple tracking, Expo integration. Basic but easy.',
                recommended: true
              },
              {
                value: 'posthog',
                label: 'PostHog',
                tooltip: 'Product analytics. Best for: Feature flags, session replay, funnels. Open-source, free tier.'
              },
              {
                value: 'mixpanel',
                label: 'Mixpanel',
                tooltip: 'Advanced product analytics. Best for: Detailed user tracking, retention, cohorts. Paid service.'
              },
              {
                value: 'none',
                label: 'No Analytics',
                tooltip: 'Skip analytics. Best for: Internal apps, prototypes. Add later if needed.'
              },
            ],
            defaultValue: 'expo-analytics',
          },
          {
            id: 'includeErrorTracking',
            label: 'Error Tracking (Sentry)',
            type: 'toggle',
            tooltip: 'Automatic crash reporting and error alerts. See stack traces, user context. Essential for production apps.',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test your mobile app',
        tooltip: 'Write tests to prevent bugs. Unit tests for logic, component tests for UI, E2E for full flows.',
        configOptions: [
          {
            id: 'testFramework',
            label: 'Test Framework',
            type: 'select',
            tooltip: 'Choose test tools for your app.',
            options: [
              {
                value: 'jest-testing-library',
                label: 'Jest + Testing Library',
                tooltip: 'Unit and component tests. Best for: Logic testing, component behavior. Standard for React Native. Recommended!',
                recommended: true
              },
              {
                value: 'detox',
                label: 'Detox (E2E)',
                tooltip: 'End-to-end testing on simulators. Best for: Testing full user flows, critical paths. Slower but thorough.'
              },
              {
                value: 'maestro',
                label: 'Maestro (E2E)',
                tooltip: 'Simple E2E testing. Best for: Easy setup, fast tests, readable syntax. Modern Detox alternative.'
              },
              {
                value: 'none',
                label: 'No Testing',
                tooltip: 'Skip testing setup. Best for: Quick prototypes. Not recommended for production apps.'
              },
            ],
            defaultValue: 'jest-testing-library',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Build & Deployment',
        description: 'Deploy to app stores',
        tooltip: 'Build your app for iOS and Android. EAS Build lets you build iOS without a Mac! OTA updates let you push updates instantly.',
        recommended: true,
        configOptions: [
          {
            id: 'useasBuild',
            label: 'Use EAS Build',
            type: 'toggle',
            tooltip: 'Cloud builds (build iOS on Windows/Linux!). Best for: No Mac, team builds, CI/CD. Highly recommended! Free tier: 30 builds/month.',
            defaultValue: true,
          },
          {
            id: 'useEasUpdates',
            label: 'EAS Updates (OTA)',
            type: 'toggle',
            tooltip: 'Push JavaScript updates without app store review. Examples: bug fixes, content updates. Updates download on app start.',
            defaultValue: true,
          },
          {
            id: 'includeAppConfig',
            label: 'App Store Config',
            type: 'toggle',
            tooltip: 'Generate app.json with store metadata (name, icons, splash, version). Required for store submission.',
            defaultValue: true,
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
        description: 'Manage API keys and secrets',
        tooltip: 'Store API keys, backend URLs, secrets safely. Never commit secrets to Git. Uses .env with .env.example.',
        recommended: true,
        hidden: true, // Auto-included
      },
    ],
};
