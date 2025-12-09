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
    name: 'Research',
    description: '5 agents, multi-angle deep research',
  },
  'spark': {
    id: 'spark',
    name: 'Spark',
    description: 'Interactive brainstorming with research',
  },
  'build': {
    id: 'build',
    name: 'Build',
    description: 'Website builder with Smart Sections & niche optimization',
  },
  'unified': {
    id: 'unified',
    name: 'Unified',
    description: 'All-in-one mode with full capabilities',
  },
  'autonom': {
    id: 'autonom',
    name: 'Autonom',
    description: 'Dynamic 100-step autonomous execution for any task',
  },
  'premium': {
    id: 'premium',
    name: 'Premium',
    description: 'AI-powered 100-step website builder with design presets',
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

export function loadModePrompt(modeId: string): string {
  if (modePromptCache.has(modeId)) {
    return modePromptCache.get(modeId)!;
  }

  const baseDir = getBinaryDir();
  const modePath = path.join(baseDir, 'server', 'modes', `${modeId}.txt`);

  if (!fs.existsSync(modePath)) {
    console.error(`❌ Mode file not found: ${modePath}`);
    return '';
  }

  try {
    const prompt = fs.readFileSync(modePath, 'utf-8');
    modePromptCache.set(modeId, prompt);
    return prompt;
  } catch (error) {
    console.error(`❌ Failed to load mode prompt: ${modeId}`, error);
    return '';
  }
}

export function getModeConfig(modeId: string): ModeConfig | null {
  return MODE_CONFIGS[modeId] || null;
}
