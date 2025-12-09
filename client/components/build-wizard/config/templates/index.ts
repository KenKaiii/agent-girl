// Template barrel file - exports all project templates
import type { ProjectTemplate } from '../types';

import { nextjsTemplate } from './nextjs';
import { chromeWxtTemplate } from './chrome-wxt';
import { chromePlasmoTemplate } from './chrome-plasmo';
import { viteReactTemplate } from './vite-react';
import { mcpServerTemplate } from './mcp-server';
import { discordBotTemplate } from './discord-bot';
import { slackBotTemplate } from './slack-bot';
import { tauriDesktopTemplate } from './tauri-desktop';
import { backendApiTemplate } from './backend-api';
import { expoMobileTemplate } from './expo-mobile';
import { shopifyAppTemplate } from './shopify-app';
import { wordpressPluginTemplate } from './wordpress-plugin';
import { vscodeExtensionTemplate } from './vscode-extension';
import { figmaPluginTemplate } from './figma-plugin';
import { raycastExtensionTemplate } from './raycast-extension';
import { adobeUxpPluginTemplate } from './adobe-uxp-plugin';
import { obsidianPluginTemplate } from './obsidian-plugin';
import { notionIntegrationTemplate } from './notion-integration';

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  nextjsTemplate,
  chromeWxtTemplate,
  chromePlasmoTemplate,
  viteReactTemplate,
  mcpServerTemplate,
  discordBotTemplate,
  slackBotTemplate,
  tauriDesktopTemplate,
  backendApiTemplate,
  expoMobileTemplate,
  shopifyAppTemplate,
  wordpressPluginTemplate,
  vscodeExtensionTemplate,
  figmaPluginTemplate,
  raycastExtensionTemplate,
  adobeUxpPluginTemplate,
  obsidianPluginTemplate,
  notionIntegrationTemplate,
];

// Re-export individual templates for direct access
export {
  nextjsTemplate,
  chromeWxtTemplate,
  chromePlasmoTemplate,
  viteReactTemplate,
  mcpServerTemplate,
  discordBotTemplate,
  slackBotTemplate,
  tauriDesktopTemplate,
  backendApiTemplate,
  expoMobileTemplate,
  shopifyAppTemplate,
  wordpressPluginTemplate,
  vscodeExtensionTemplate,
  figmaPluginTemplate,
  raycastExtensionTemplate,
  adobeUxpPluginTemplate,
  obsidianPluginTemplate,
  notionIntegrationTemplate,
};
