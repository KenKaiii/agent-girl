/**
 * Chrome Extension (WXT) Template
 */

import type { ProjectTemplate } from '../types';

export const chromeWxtTemplate: ProjectTemplate = {
  id: 'chrome-wxt',
  name: 'Chrome Extension (WXT)',
  description: 'Modern Chrome extension with React/Vue/Svelte',
  tooltip: 'Build browser extensions that add features to Chrome (and other browsers). Perfect for productivity tools, ad blockers, price trackers, page modifiers. Examples: Grammarly, Honey, LastPass.',
  icon: null,
  gradient: 'linear-gradient(90deg, #A8FAC7 0%, #DAFFEE 25%, #ffffff 50%, #DAFFEE 75%, #A8FAC7 100%)',
  command: 'npx wxt@latest init',
  commandFlags: {
    template: (framework: string | boolean | number) => `--template ${String(framework)}`,
    packageManager: (pm: string | boolean | number) => `--pm ${String(pm)}`,
  },
  features: [
    {
      id: 'framework',
      name: 'Framework',
      description: 'Choose your UI framework',
      tooltip: 'Pick the JavaScript framework for building your extension\'s UI.',
      recommended: true,
      configOptions: [
        {
          id: 'uiFramework',
          label: 'Framework',
          type: 'select',
          tooltip: 'Choose your UI development framework',
          options: [
            { value: 'react', label: 'React', tooltip: 'Most popular, huge ecosystem.', recommended: true },
            { value: 'vue', label: 'Vue 3', tooltip: 'Easier to learn, great documentation.' },
            { value: 'svelte', label: 'Svelte', tooltip: 'Fastest performance, smallest bundle.' },
            { value: 'vanilla', label: 'Vanilla JS', tooltip: 'No framework, just JavaScript.' },
          ],
          defaultValue: 'react',
        },
      ],
    },
    {
      id: 'popup',
      name: 'Popup UI',
      description: 'Extension popup interface',
      tooltip: 'The small window that opens when users click your extension icon.',
      recommended: true,
    },
    {
      id: 'content-script',
      name: 'Content Script',
      description: 'Inject scripts into web pages',
      tooltip: 'Run JavaScript code on websites the user visits.',
    },
    {
      id: 'background',
      name: 'Background Service',
      description: 'Service worker for background tasks',
      tooltip: 'Code that runs in the background even when popup is closed.',
    },
    {
      id: 'styling',
      name: 'Styling',
      description: 'CSS framework',
      tooltip: 'Choose how to style your extension\'s UI.',
      configOptions: [
        {
          id: 'cssFramework',
          label: 'CSS Framework',
          type: 'select',
          tooltip: 'Choose your styling approach',
          options: [
            { value: 'tailwind', label: 'Tailwind CSS', tooltip: 'Utility-first CSS, fastest development.', recommended: true },
            { value: 'unocss', label: 'UnoCSS', tooltip: 'Like Tailwind but faster and smaller.' },
            { value: 'css', label: 'Plain CSS', tooltip: 'Traditional CSS. Full control.' },
          ],
          defaultValue: 'tailwind',
        },
      ],
    },
    {
      id: 'storage',
      name: 'Storage',
      description: 'Chrome storage API wrapper',
      tooltip: 'Save extension settings and user data that persists across sessions.',
    },
    {
      id: 'code-quality',
      name: 'Code Quality',
      description: 'ESLint, Prettier, lint-staged',
      tooltip: 'Keep code clean and catch errors before they reach users.',
      recommended: true,
    },
    {
      id: 'testing',
      name: 'Testing',
      description: 'Vitest + Playwright for extension testing',
      tooltip: 'Automated tests for your extension.',
    },
    {
      id: 'env-config',
      name: 'Environment Config',
      description: 'Type-safe environment variables',
      tooltip: 'Manage API keys and configuration safely.',
    },
    {
      id: 'deployment',
      name: 'Deployment',
      description: 'Chrome Web Store publishing workflow',
      tooltip: 'Automated workflow for publishing your extension.',
    },
  ],
};
