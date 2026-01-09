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

import type { ProviderType } from '../client/config/models';
import type { AgentDefinition } from './agents';
import type { UserConfig } from './userConfig';
import { getUserDisplayName } from './userConfig';

/**
 * Format current date and time for the given timezone (compact version)
 */
function formatCurrentDateTime(timezone?: string): string {
  const tz = timezone || 'UTC';
  const now = new Date();

  try {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `Current date & time: ${dateFormatter.format(now)} (${tz})`;
  } catch {
    return `Current date & time: ${now.toISOString()} (UTC)`;
  }
}

/**
 * Build mode-specific base prompt with tailored personality
 * Supports provider-specific variants (e.g., GLM-optimized intense-research)
 */
function buildModePrompt(mode: string, userConfig?: UserConfig, provider?: ProviderType): string {
  const userName = userConfig ? getUserDisplayName(userConfig) : null;

  // Mode-specific personalities
  const modePrompts: Record<string, string> = {
    'general': `You are Agent Girl${userName ? ` talking to ${userName}` : ''}, a versatile AI assistant.

Match the user's language. Research when needed (your training data is outdated). Use diagrams for complex concepts (mermaid). Be conversational, funny, and helpful.`,

    'coder': `You are Agent Girl${userName ? ` pair programming with ${userName}` : ''}, a senior software engineer.

CODE FIRST. Explain after (if asked). Match the user's language. Research libraries/docs before using them. Direct, concise, technical.`,

    'spark': `You are Agent Girl${userName ? ` brainstorming with ${userName}` : ''}, in rapid-fire creative mode.

Generate ideas FAST. Number them (#1, #2, #3). Research inline to validate (don't break flow). Brief, energetic responses. Match the user's language.`,

    'intense-research': `You are Agent Girl${userName ? ` researching for ${userName}` : ''}, a research orchestrator.

Spawn 5+ agents in parallel. Delegate ALL research. Cross-reference findings. Synthesize comprehensive reports. Match the user's language.`,

    // GLM direct research (no subagents - they freeze with non-Anthropic providers)
    'intense-research-glm': `You are Agent Girl${userName ? ` researching for ${userName}` : ''}, a deep researcher.

You perform research DIRECTLY (no subagents).

Research strategy:
1. Break topic into 3-5 key angles
2. For each angle: 1-2 searches, read 2-3 pages, note findings
3. Cross-reference and synthesize

Use mcp__web-search-prime__webSearchPrime for searches, mcp__web-reader__webReader to read pages.
Quality over quantity. Match the user's language.`,
  };

  // Use GLM-optimized variant for Z.AI provider
  if (provider === 'z-ai' && mode === 'intense-research') {
    return modePrompts['intense-research-glm'];
  }

  return modePrompts[mode] || modePrompts['general'];
}

/**
 * Inject working directory context into an agent definition
 */
function injectWorkingDirIntoAgent(agent: AgentDefinition, workingDir: string): AgentDefinition {
  return {
    ...agent,
    prompt: `${agent.prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ENVIRONMENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKING DIRECTORY: ${workingDir}

When creating files, use the WORKING DIRECTORY path above.
All file paths should be relative to this directory or use absolute paths within it.
`
  };
}

/**
 * Inject working directory context into all agent definitions
 */
export function injectWorkingDirIntoAgents(
  agents: Record<string, AgentDefinition>,
  workingDir: string
): Record<string, AgentDefinition> {
  const updatedAgents: Record<string, AgentDefinition> = {};

  for (const [key, agent] of Object.entries(agents)) {
    updatedAgents[key] = injectWorkingDirIntoAgent(agent, workingDir);
  }

  return updatedAgents;
}

/**
 * Get system prompt based on provider and available agents
 * Includes background process instructions and provider-specific features
 */
export function getSystemPrompt(
  provider: ProviderType,
  agents?: Record<string, AgentDefinition>,
  userConfig?: UserConfig,
  timezone?: string,
  mode?: string,
  _modelId?: string
): string {
  // Start with mode-specific base personality (replaces generic base + mode override)
  // Pass provider to use GLM-optimized variants when appropriate
  let prompt = buildModePrompt(mode || 'general', userConfig, provider);

  // Date/time (compact)
  prompt += `\n\n${formatCurrentDateTime(timezone)}`;

  // Working directory (compact)
  prompt += `\nWorking directory: Will be provided in environment context.`;

  // Provider-specific tools (compact)
  if (provider === 'z-ai') {
    // GLM models use Z.AI MCP tools instead of built-in WebSearch/WebFetch
    prompt += `\nWeb search: Use mcp__web-search-prime__search to find URLs.`;
    prompt += `\nWeb reading: Use mcp__web-reader__webReader to fetch and read webpage content.`;
    prompt += `\nImage analysis: Use mcp__zai-mcp-server__image_analysis for [Image attached: ...] paths.`;
  }

  // File attachments (compact)
  prompt += `\nFile attachments: Read [File attached: ...] paths with Read tool.`;

  // Background processes (compact)
  prompt += `\nBackground processes: Use Bash with run_in_background:true for dev servers, watchers, databases.`;

  // Agents (compact list)
  if (agents && Object.keys(agents).length > 0) {
    const agentList = Object.entries(agents)
      .map(([key, agent]) => `${key}: ${agent.description}`)
      .join('; ');
    prompt += `\n\nSpecialized agents available: ${agentList}. Use Task tool to delegate when appropriate.`;
  }

  return prompt;
}

// Keep original export for backwards compatibility (fallback to general mode)
export const SYSTEM_PROMPT = buildModePrompt('general');
