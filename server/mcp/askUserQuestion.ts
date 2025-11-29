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

import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

// Schema for question options
const questionOptionSchema = z.object({
  label: z.string().describe('The display text for this option (1-5 words)'),
  description: z.string().describe('Explanation of what this option means'),
});

// Schema for a single question
const questionSchema = z.object({
  question: z.string().describe('The complete question to ask the user'),
  header: z.string().max(12).describe('Short label displayed as a chip/tag (max 12 chars)'),
  options: z.array(questionOptionSchema).min(2).max(4).describe('Available choices (2-4 options)'),
  multiSelect: z.boolean().describe('Allow multiple selections if true'),
});

// Pending questions waiting for user response (keyed by toolId)
const pendingQuestions = new Map<string, {
  resolve: (answers: Record<string, string>) => void;
  reject: (error: Error) => void;
}>();

// Global callback to notify frontend of new questions (set per session)
let globalQuestionCallback: ((toolId: string, questions: unknown[], sessionId: string) => void) | null = null;

/**
 * Set the global callback for sending questions to frontend
 */
export function setQuestionCallback(callback: (toolId: string, questions: unknown[], sessionId: string) => void) {
  globalQuestionCallback = callback;
}

/**
 * Register user's answer for a pending question
 */
export function answerQuestion(toolId: string, answers: Record<string, string>): boolean {
  const pending = pendingQuestions.get(toolId);
  if (pending) {
    pending.resolve(answers);
    pendingQuestions.delete(toolId);
    return true;
  }
  return false;
}

/**
 * Cancel a pending question
 */
export function cancelQuestion(toolId: string): boolean {
  const pending = pendingQuestions.get(toolId);
  if (pending) {
    pending.reject(new Error('Question cancelled by user'));
    pendingQuestions.delete(toolId);
    return true;
  }
  return false;
}

/**
 * Create the AskUserQuestion MCP server for a specific session
 */
export function createAskUserQuestionServer(sessionId: string) {
  return createSdkMcpServer({
    name: 'ask-user-question',
    version: '1.0.0',
    tools: [
      tool(
        'AskUserQuestion',
        `Ask the user questions when you need clarification, want to validate assumptions, or need to make a decision you're unsure about. This allows you to:
1. Gather user preferences or requirements
2. Clarify ambiguous instructions
3. Get decisions on implementation choices
4. Offer choices about what direction to take

Users can select from predefined options or provide custom input via "Other".`,
        {
          questions: z.array(questionSchema).min(1).max(4).describe('Questions to ask (1-4 questions)'),
        },
        async (args, _extra) => {
          // Generate a unique tool ID
          const toolId = `ask_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          console.log(`❓ AskUserQuestion called with ${args.questions.length} question(s) for session ${sessionId.substring(0, 8)}`);

          // Notify frontend about the question
          if (globalQuestionCallback) {
            globalQuestionCallback(toolId, args.questions, sessionId);
          } else {
            console.error('❌ No question callback registered!');
            return {
              content: [{ type: 'text' as const, text: 'Error: Question callback not configured' }],
              isError: true,
            };
          }

          // Wait for user's answer (with timeout)
          const timeout = 300000; // 5 minutes timeout

          try {
            const answers = await Promise.race([
              new Promise<Record<string, string>>((resolve, reject) => {
                pendingQuestions.set(toolId, { resolve, reject });
              }),
              new Promise<never>((_, reject) => {
                setTimeout(() => {
                  pendingQuestions.delete(toolId);
                  reject(new Error('Question timed out waiting for user response'));
                }, timeout);
              }),
            ]);

            // Format answers for Claude
            const formattedAnswers = Object.entries(answers)
              .map(([header, answer]) => `${header}: ${answer}`)
              .join('\n');

            console.log(`✅ User answered question ${toolId}`);

            return {
              content: [
                {
                  type: 'text' as const,
                  text: `User's answers:\n${formattedAnswers}`,
                },
              ],
            };
          } catch (error) {
            // Clean up on error
            pendingQuestions.delete(toolId);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Question error: ${errorMessage}`);

            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: ${errorMessage}`,
                },
              ],
              isError: true,
            };
          }
        }
      ),
    ],
  });
}
