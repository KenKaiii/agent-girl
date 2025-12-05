/**
 * Shared types for tool components
 */

export interface ToolUseBlock {
  id: string;
  type: 'tool_use';
  name: string;
  input: Record<string, unknown>;
  nestedTools?: ToolUseBlock[];
}

export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm?: string;
}
