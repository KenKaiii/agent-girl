import type { ProjectTemplate } from '../types';

export const chromePlasmoTemplate: ProjectTemplate = {
  id: 'chrome-plasmo',
  name: 'Chrome Extension (Plasmo)',
  description: 'TypeScript-first Chrome extension framework',
  tooltip: 'Alternative Chrome extension framework focused on TypeScript and developer experience. Great if you want batteries-included setup with less configuration. Similar to WXT but with different conventions. Choose this if you prefer opinionated frameworks that handle setup for you.',
  icon: null,
  gradient: 'linear-gradient(90deg, #C7FAA8 0%, #EEFFDA 25%, #ffffff 50%, #EEFFDA 75%, #C7FAA8 100%)',
  command: 'pnpm create plasmo',
  features: [
    {
      id: 'popup',
      name: 'Popup UI',
      description: 'Extension popup interface',
      tooltip: 'The small window that opens when users click your extension icon in the toolbar. Essential for most extensions. This is where users interact with your extension\'s main features.',
      recommended: true,
    },
    {
      id: 'content-script',
      name: 'Content Script',
      description: 'Inject scripts into web pages',
      tooltip: 'Run JavaScript code on websites the user visits. Use this to modify web pages, add features to sites, or extract data. Examples: ad blockers, grammar checkers, price trackers.',
    },
    {
      id: 'background',
      name: 'Background Service',
      description: 'Service worker for background tasks',
      tooltip: 'Code that runs in the background even when popup is closed. Use for: listening to browser events, managing extension state, scheduling tasks, handling notifications.',
    },
    {
      id: 'storage',
      name: 'Storage API',
      description: 'Chrome storage integration',
      tooltip: 'Save extension settings and user data that persists across browser sessions. Essential if your extension needs to remember preferences or store data.',
    },
    {
      id: 'styling',
      name: 'Styling',
      description: 'Tailwind CSS setup',
      tooltip: 'Pre-configured Tailwind CSS for styling your extension. Utility-first CSS framework for rapid UI development. Build beautiful interfaces quickly.',
      recommended: true,
    },
    {
      id: 'code-quality',
      name: 'Code Quality',
      description: 'ESLint, Prettier, Husky',
      tooltip: 'Keep code clean and catch errors before they reach users. Auto-formats code and runs checks before commits. Essential for professional extensions.',
      recommended: true,
    },
    {
      id: 'testing',
      name: 'Testing',
      description: 'Vitest for unit and E2E testing',
      tooltip: 'Automated tests for your extension. Catch bugs before users do. Includes both unit tests and end-to-end testing capabilities.',
    },
    {
      id: 'env-config',
      name: 'Environment Config',
      description: 'Type-safe .env.* files',
      tooltip: 'Manage API keys and configuration safely. Different settings for development vs production. Essential if you\'re using external APIs.',
    },
    {
      id: 'deployment',
      name: 'Deployment',
      description: 'Chrome Web Store + automated builds',
      tooltip: 'Automated workflow for publishing your extension to Chrome Web Store. Includes build optimization and packaging for distribution.',
    },
  ],
};
