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

import * as fs from 'fs';
import * as path from 'path';
import { getBinaryDir } from './startup';

export interface ModeConfig {
  id: string;
  name: string;
  description: string;
}

const MODE_CONFIGS: Record<string, ModeConfig> = {
  'general': {
    id: 'general',
    name: 'General',
    description: 'Everyday conversation & research',
  },
  'coder': {
    id: 'coder',
    name: 'Coder',
    description: 'Software development & debugging',
  },
  'intense-research': {
    id: 'intense-research',
    name: 'Intense Research',
    description: '5 agents, multi-angle deep research',
  },
  // GLM direct variant (loaded automatically for z-ai provider - no subagents)
  'intense-research-glm': {
    id: 'intense-research-glm',
    name: 'Intense Research',
    description: 'Direct multi-angle deep research (GLM)',
  },
  'spark': {
    id: 'spark',
    name: 'Spark',
    description: 'Interactive brainstorming with research',
  },
};

const modePromptCache = new Map<string, string>();

export function getAvailableModes(): ModeConfig[] {
  const baseDir = getBinaryDir();
  const modesDir = path.join(baseDir, 'server', 'modes');

  if (!fs.existsSync(modesDir)) {
    console.warn('⚠️  Modes directory not found:', modesDir);
    return [];
  }

  const files = fs.readdirSync(modesDir);
  const modes: ModeConfig[] = [];

  for (const file of files) {
    if (file.endsWith('.txt')) {
      const modeId = file.replace('.txt', '');
      const config = MODE_CONFIGS[modeId];

      if (config) {
        modes.push(config);
      } else {
        console.warn(`⚠️  No config found for mode: ${modeId}`);
      }
    }
  }

  return modes;
}

/**
 * Get the effective mode ID based on provider
 * Some modes have provider-specific optimized variants (e.g., intense-research-glm for Z.AI)
 */
export function getEffectiveModeId(modeId: string, provider?: string): string {
  // Check for provider-specific variants
  if (provider === 'z-ai' && modeId === 'intense-research') {
    return 'intense-research-glm';
  }
  return modeId;
}

export function loadModePrompt(modeId: string, provider?: string): string {
  // Get effective mode ID (may be provider-specific variant)
  const effectiveModeId = getEffectiveModeId(modeId, provider);

  if (modePromptCache.has(effectiveModeId)) {
    return modePromptCache.get(effectiveModeId)!;
  }

  const baseDir = getBinaryDir();
  const modePath = path.join(baseDir, 'server', 'modes', `${effectiveModeId}.txt`);

  if (!fs.existsSync(modePath)) {
    // Fallback to base mode if variant not found
    if (effectiveModeId !== modeId) {
      console.warn(`⚠️  Provider-specific mode ${effectiveModeId} not found, falling back to ${modeId}`);
      return loadModePrompt(modeId); // Recursive call without provider
    }
    console.error(`❌ Mode file not found: ${modePath}`);
    return '';
  }

  try {
    const prompt = fs.readFileSync(modePath, 'utf-8');
    modePromptCache.set(effectiveModeId, prompt);

    // Log when using provider-specific variant
    if (effectiveModeId !== modeId) {
      console.log(`📋 Using ${effectiveModeId} mode (optimized for ${provider})`);
    }

    return prompt;
  } catch (error) {
    console.error(`❌ Failed to load mode prompt: ${effectiveModeId}`, error);
    return '';
  }
}

export function getModeConfig(modeId: string): ModeConfig | null {
  return MODE_CONFIGS[modeId] || null;
}
