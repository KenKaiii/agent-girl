/**
 * FilePathActions - Action buttons for file paths (open, reveal, copy)
 */

import React, { memo, useCallback } from 'react';
import { FileText, FolderOpen, Copy } from 'lucide-react';
import { showError } from '../../utils/errorMessages';
import { useWorkingDirectory } from '../../hooks/useWorkingDirectory';

export const FilePathActions = memo(function FilePathActions({ filePath }: { filePath: string }) {
  const { workingDirectory } = useWorkingDirectory();

  const handleOpenFile = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, workingDirectory }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!result.success) {
        showError('OPEN_FOLDER', result.error || 'Failed to open file');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('OPEN_FOLDER', errorMsg);
    }
  }, [filePath, workingDirectory]);

  const handleOpenFolder = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/open-file-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, workingDirectory }),
      });
      const result = await response.json() as { success: boolean; error?: string };
      if (!result.success) {
        showError('OPEN_FOLDER', result.error || 'Failed to open folder');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('OPEN_FOLDER', errorMsg);
    }
  }, [filePath, workingDirectory]);

  const handleCopyPath = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(filePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError('OPEN_FOLDER', errorMsg);
    }
  }, [filePath]);

  return (
    <div className="flex gap-0.5 ml-1 shrink-0">
      <button
        onClick={handleOpenFile}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        title="Open file"
      >
        <FileText className="w-3 h-3 text-white/40 hover:text-white/80" />
      </button>
      <button
        onClick={handleOpenFolder}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        title="Reveal in Finder"
      >
        <FolderOpen className="w-3 h-3 text-white/40 hover:text-white/80" />
      </button>
      <button
        onClick={handleCopyPath}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        title="Copy path"
      >
        <Copy className="w-3 h-3 text-white/40 hover:text-white/80" />
      </button>
    </div>
  );
});
