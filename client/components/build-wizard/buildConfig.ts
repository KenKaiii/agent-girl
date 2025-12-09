/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Re-export types for backwards compatibility
export type { FeatureOption, ConfigOption, ProjectTemplate } from './config/types';

// Re-export templates
export { PROJECT_TEMPLATES } from './config/templates';

// Re-export utility functions
export { generateBuildPrompt } from './config/generateBuildPrompt';

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
} from './config/templates';
