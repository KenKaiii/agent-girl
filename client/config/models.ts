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

/**
 * Model Configuration
 *
 * Centralized definitions for all available AI models.
 * Add new models here to make them available in the UI.
 */

export type ProviderType = 'anthropic' | 'z-ai' | 'moonshot';

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  apiModelId: string;
  provider: ProviderType;
}

/**
 * Available Models
 *
 * Add new models to this array to make them available in the model selector.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'opus',
    name: 'Opus 4.6',
    description: 'Anthropic\'s most powerful model for the most complex tasks',
    apiModelId: 'claude-opus-4-6',
    provider: 'anthropic',
  },
  {
    id: 'sonnet',
    name: 'Sonnet 4.5',
    description: 'Balanced intelligence and speed for complex agents and coding',
    apiModelId: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
  },
  {
    id: 'haiku',
    name: 'Haiku 4.5',
    description: 'Fast and efficient model for quick tasks and rapid responses',
    apiModelId: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
  },
  {
    id: 'glm-5',
    name: 'GLM 5',
    description: 'Z.AI\'s latest flagship model for powerful reasoning and coding',
    apiModelId: 'glm-5',
    provider: 'z-ai',
  },
  {
    id: 'glm-4.7',
    name: 'GLM 4.7',
    description: 'Z.AI\'s model for reasoning and coding',
    apiModelId: 'glm-4.7',
    provider: 'z-ai',
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    description: 'Moonshot\'s model for complex reasoning tasks',
    apiModelId: 'kimi-k2.5',
    provider: 'moonshot',
  },
];

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

/**
 * Get the default model
 */
export function getDefaultModel(): ModelConfig {
  return AVAILABLE_MODELS[0];
}
