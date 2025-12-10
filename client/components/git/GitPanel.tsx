/**
 * Git Panel Component
 *
 * Visual git interface similar to VS Code's Source Control panel.
 * Shows status, staged/unstaged changes, commit history, and actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Upload,
  Download,
  RefreshCw,
  Plus,
  Minus,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Cloud,
  CloudOff,
  Rocket
} from 'lucide-react';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  hasChanges: boolean;
  isClean: boolean;
  remote?: string;
}

interface GitLog {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

interface GitPanelProps {
  projectPath: string;
  onStatusChange?: (status: GitStatus) => void;
}

export function GitPanel({ projectPath, onStatusChange }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [log, setLog] = useState<GitLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    unstaged: true,
    untracked: true,
    history: false
  });
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!projectPath) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/git/status?projectPath=${encodeURIComponent(projectPath)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Laden des Git-Status');
      }

      setStatus(data);
      onStatusChange?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, onStatusChange]);

  const fetchLog = useCallback(async () => {
    if (!projectPath) return;

    try {
      const res = await fetch(`/api/git/log?projectPath=${encodeURIComponent(projectPath)}&count=10`);
      const data = await res.json();

      if (res.ok) {
        setLog(data.log || []);
      }
    } catch {
      // Silently fail for log
    }
  }, [projectPath]);

  useEffect(() => {
    fetchStatus();
    fetchLog();
  }, [fetchStatus, fetchLog]);

  const performAction = async (action: string, body: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      setError(null);
      setActionResult(null);

      const res = await fetch(`/api/git/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, ...body })
      });

      const data = await res.json();

      setActionResult({ success: res.ok, message: data.message });

      if (res.ok) {
        await fetchStatus();
        await fetchLog();
      }

      // Clear message after 3 seconds
      setTimeout(() => setActionResult(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError('Commit-Nachricht erforderlich');
      return;
    }

    await performAction('commit', { message: commitMessage });
    setCommitMessage('');
  };

  const handlePush = async () => {
    await performAction('push', {});
  };

  const handlePull = async () => {
    await performAction('pull', {});
  };

  const handleStageFile = async (file: string) => {
    await performAction('commit', { files: [file], message: '' });
    // Actually just stage, not commit - need separate endpoint
    // For now, refresh status
    await fetchStatus();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!projectPath) {
    return (
      <div className="p-4 text-gray-500 text-center">
        <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Wähle ein Projekt aus</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-800 dark:text-white">
              {status?.branch || 'Git'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {status?.remote ? (
              <span title="Verbunden"><Cloud className="w-4 h-4 text-green-500" /></span>
            ) : (
              <span title="Kein Remote"><CloudOff className="w-4 h-4 text-gray-400" /></span>
            )}
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ahead/Behind */}
        {status && (status.ahead > 0 || status.behind > 0) && (
          <div className="flex items-center gap-3 mt-2 text-sm">
            {status.ahead > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <Upload className="w-3 h-3" />
                {status.ahead} ahead
              </span>
            )}
            {status.behind > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Download className="w-3 h-3" />
                {status.behind} behind
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error/Success Message */}
      {(error || actionResult) && (
        <div className={`px-3 py-2 text-sm ${
          actionResult?.success ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {error || actionResult?.message}
        </div>
      )}

      {/* Commit Input */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit-Nachricht..."
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          rows={2}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleCommit}
            disabled={!status?.hasChanges || !commitMessage.trim() || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Commit
          </button>
          <button
            onClick={handlePush}
            disabled={!status?.remote || status?.ahead === 0 || isLoading}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Push"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handlePull}
            disabled={!status?.remote || isLoading}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Pull"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        {status?.staged && status.staged.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('staged')}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {expandedSections.staged ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-sm font-medium">Staged ({status.staged.length})</span>
            </button>
            {expandedSections.staged && (
              <div className="pb-2">
                {status.staged.map(file => (
                  <div key={file} className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 dark:text-green-400">
                    <Plus className="w-3 h-3" />
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unstaged Changes */}
        {status?.unstaged && status.unstaged.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('unstaged')}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {expandedSections.unstaged ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-sm font-medium">Geändert ({status.unstaged.length})</span>
            </button>
            {expandedSections.unstaged && (
              <div className="pb-2">
                {status.unstaged.map(file => (
                  <div key={file} className="flex items-center gap-2 px-3 py-1 text-sm text-yellow-600 dark:text-yellow-400">
                    <Minus className="w-3 h-3" />
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Untracked Files */}
        {status?.untracked && status.untracked.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('untracked')}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {expandedSections.untracked ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-sm font-medium">Untracked ({status.untracked.length})</span>
            </button>
            {expandedSections.untracked && (
              <div className="pb-2">
                {status.untracked.map(file => (
                  <div key={file} className="flex items-center gap-2 px-3 py-1 text-sm text-gray-500">
                    <span className="w-3 h-3">?</span>
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clean State */}
        {status?.isClean && (
          <div className="p-4 text-center text-gray-500">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p>Keine Änderungen</p>
          </div>
        )}

        {/* Commit History */}
        <div>
          <button
            onClick={() => toggleSection('history')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {expandedSections.history ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Historie</span>
          </button>
          {expandedSections.history && (
            <div className="pb-2">
              {log.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">Keine Commits</div>
              ) : (
                log.map(commit => (
                  <div key={commit.hash} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <GitCommit className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                        {commit.shortHash}
                      </span>
                      <span className="text-xs text-gray-500">{commit.date}</span>
                    </div>
                    <p className="text-sm mt-1 truncate">{commit.message}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      {commit.author}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => performAction('pr', { title: 'New Feature', body: 'Description' })}
          disabled={!status?.remote || isLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GitPullRequest className="w-4 h-4" />
          Pull Request erstellen
        </button>
      </div>
    </div>
  );
}

export default GitPanel;
