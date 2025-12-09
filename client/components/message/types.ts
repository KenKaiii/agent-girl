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

export interface BaseMessage {
  id: string;
  timestamp: string;
  type: 'user' | 'assistant' | 'system';
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  content: string;
  attachments?: FileAttachment[];
}

export interface ToolEdit {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export interface TodoItem {
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown> & {
    file_path?: string;
    content?: string;
    offset?: number;
    limit?: number;
    old_string?: string;
    new_string?: string;
    replace_all?: boolean;
    edits?: ToolEdit[];
    command?: string;
    description?: string;
    run_in_background?: boolean;
    timeout?: number;
    pattern?: string;
    path?: string;
    glob?: string;
    output_mode?: string;
    '-i'?: boolean;
    '-n'?: boolean;
    multiline?: boolean;
    query?: string;
    allowed_domains?: string[];
    url?: string;
    prompt?: string;
    subagent_type?: string;
    todos?: TodoItem[];
    notebook_path?: string;
    cell_id?: string;
    cell_type?: string;
    edit_mode?: string;
    plan?: string;
  };
  // For Task tools: nested tool calls from spawned agents
  nestedTools?: ToolUseBlock[];
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface LongRunningCommandBlock {
  type: 'long_running_command';
  bashId: string;
  command: string;
  commandType: 'install' | 'build' | 'test';
  output?: string;
  status?: 'running' | 'completed' | 'failed';
  startedAt: number;
  description?: string;
  updates?: Array<{ timestamp: number; content: string; isError?: boolean }>;
}

export interface ToolResult {
  tool_use_id: string;
  type: 'tool_result';
  content: string;
}

export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  content: (TextBlock | ToolUseBlock | ThinkingBlock | LongRunningCommandBlock)[];
  metadata?: {
    id: string;
    model: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      service_tier: string;
    };
  };
}

export interface PreviewElement {
  id: number;
  tagName: string;
  selector: string;
  textContent?: string;
  className?: string;
  elementId?: string;
  path?: string;
  styles?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
  };
}

export interface PreviewFileContext {
  framework: string;
  routePattern?: string;
  possibleFiles: string[];
  resolvedFile?: string;
  componentHints?: string[];
}

export interface PreviewViewport {
  device: string;
  width: number;
  height: number;
}

export interface PreviewActionMetadata {
  type: 'preview';
  action: 'element_select' | 'style_change' | 'content_edit' | 'ai_request';
  previewUrl: string;
  elements: PreviewElement[];
  fileContext?: PreviewFileContext;
  viewport?: PreviewViewport;
  screenshot?: string;
  userRequest?: string;
}

export interface SystemMessage extends BaseMessage {
  type: 'system';
  content: string;
  metadata?: {
    type: string;
    subtype?: string;
    cwd?: string;
    session_id?: string;
    tools?: string[];
    model?: string;
    mcp_servers?: string[];
    permissionMode?: string;
    slash_commands?: string[];
    apiKeySource?: string;
  } | PreviewActionMetadata;
}

export interface UserToolResultMessage extends BaseMessage {
  type: 'user';
  content: ToolResult[];
  metadata: {
    role: 'user';
    content: ToolResult[];
  };
}

export type Message = UserMessage | AssistantMessage | SystemMessage | UserToolResultMessage;

export interface QueryData {
  slug: string;
  title: string;
  description: string;
  prompt: string;
  status: string;
  createdAt: string;
  messages: Message[];
}