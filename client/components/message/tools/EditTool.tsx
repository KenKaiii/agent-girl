/**
 * Edit/Write tool component - File editing display with diff viewer
 */

import React from 'react';
import { DiffViewer } from '../DiffViewer';
import type { ToolUseBlock } from './types';

// Detect language from file extension
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'tsx',
    'js': 'javascript',
    'jsx': 'jsx',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'css': 'css',
    'scss': 'scss',
    'html': 'html',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sh': 'bash',
    'sql': 'sql',
  };
  return languageMap[ext || ''] || 'text';
}

export function EditToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const input = toolUse.input;
  const filePath = String(input.file_path || '');
  const language = getLanguageFromPath(filePath);

  // Get old/new content based on tool type
  const oldContent = toolUse.name === 'Edit' ? String(input.old_string || '') : null;
  const newContent = toolUse.name === 'Write'
    ? String(input.content || '')
    : String(input.new_string || '');

  // Try to extract start line from context if available
  const startLine = (input.start_line as number) || 1;

  return (
    <DiffViewer
      filePath={filePath}
      oldContent={oldContent}
      newContent={newContent}
      language={language}
      startLine={startLine}
      maxHeight={300}
    />
  );
}
