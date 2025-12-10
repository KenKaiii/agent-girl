/**
 * Git Panel Hook
 *
 * State management for Git operations including status, commits, branches.
 * Provides real-time git status updates and action handlers.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface GitStatus {
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

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  relativeDate: string;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  lastCommit?: string;
}

interface UseGitPanelOptions {
  projectPath: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseGitPanelReturn {
  // State
  status: GitStatus | null;
  commits: GitCommit[];
  branches: GitBranch[];
  isLoading: boolean;
  isCommitting: boolean;
  isPushing: boolean;
  isPulling: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  commit: (message: string, files?: string[]) => Promise<boolean>;
  push: (force?: boolean) => Promise<boolean>;
  pull: (rebase?: boolean) => Promise<boolean>;
  stageFile: (file: string) => Promise<boolean>;
  unstageFile: (file: string) => Promise<boolean>;
  stageAll: () => Promise<boolean>;
  createBranch: (name: string) => Promise<boolean>;
  checkoutBranch: (name: string) => Promise<boolean>;
  deleteBranch: (name: string) => Promise<boolean>;
  createPR: (title: string, body?: string, base?: string) => Promise<{ success: boolean; url?: string }>;
}

export function useGitPanel({
  projectPath,
  autoRefresh = true,
  refreshInterval = 30000,
}: UseGitPanelOptions): UseGitPanelReturn {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch git status
  const fetchStatus = useCallback(async () => {
    if (!projectPath) return;

    try {
      const res = await fetch(`/api/git/status?projectPath=${encodeURIComponent(projectPath)}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError(null);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch git status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  }, [projectPath]);

  // Fetch commit history
  const fetchCommits = useCallback(async () => {
    if (!projectPath) return;

    try {
      const res = await fetch(`/api/git/log?projectPath=${encodeURIComponent(projectPath)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setCommits(data.commits || []);
      }
    } catch {
      // Silent fail for commits
    }
  }, [projectPath]);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    if (!projectPath) return;

    try {
      const res = await fetch(`/api/git/branch?projectPath=${encodeURIComponent(projectPath)}&action=list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, action: 'list' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch {
      // Silent fail for branches
    }
  }, [projectPath]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStatus(), fetchCommits(), fetchBranches()]);
    setIsLoading(false);
  }, [fetchStatus, fetchCommits, fetchBranches]);

  // Commit changes
  const commit = useCallback(async (message: string, files?: string[]): Promise<boolean> => {
    if (!projectPath || !message.trim()) return false;

    setIsCommitting(true);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, message, files }),
      });

      if (res.ok) {
        await refresh();
        return true;
      }

      const data = await res.json();
      setError(data.error || 'Commit failed');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed');
      return false;
    } finally {
      setIsCommitting(false);
    }
  }, [projectPath, refresh]);

  // Push to remote
  const push = useCallback(async (force = false): Promise<boolean> => {
    if (!projectPath) return false;

    setIsPushing(true);
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, force }),
      });

      if (res.ok) {
        await refresh();
        return true;
      }

      const data = await res.json();
      setError(data.error || 'Push failed');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed');
      return false;
    } finally {
      setIsPushing(false);
    }
  }, [projectPath, refresh]);

  // Pull from remote
  const pull = useCallback(async (rebase = false): Promise<boolean> => {
    if (!projectPath) return false;

    setIsPulling(true);
    try {
      const res = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, rebase }),
      });

      if (res.ok) {
        await refresh();
        return true;
      }

      const data = await res.json();
      setError(data.error || 'Pull failed');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pull failed');
      return false;
    } finally {
      setIsPulling(false);
    }
  }, [projectPath, refresh]);

  // Stage a file
  const stageFile = useCallback(async (file: string): Promise<boolean> => {
    if (!projectPath) return false;

    try {
      const res = await fetch('/api/git/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, files: [file] }),
      });

      if (res.ok) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [projectPath, fetchStatus]);

  // Unstage a file
  const unstageFile = useCallback(async (file: string): Promise<boolean> => {
    if (!projectPath) return false;

    try {
      const res = await fetch('/api/git/unstage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, files: [file] }),
      });

      if (res.ok) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [projectPath, fetchStatus]);

  // Stage all files
  const stageAll = useCallback(async (): Promise<boolean> => {
    if (!projectPath) return false;

    try {
      const res = await fetch('/api/git/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, all: true }),
      });

      if (res.ok) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [projectPath, fetchStatus]);

  // Create branch
  const createBranch = useCallback(async (name: string): Promise<boolean> => {
    if (!projectPath || !name.trim()) return false;

    try {
      const res = await fetch('/api/git/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, action: 'create', name }),
      });

      if (res.ok) {
        await fetchBranches();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [projectPath, fetchBranches]);

  // Checkout branch
  const checkoutBranch = useCallback(async (name: string): Promise<boolean> => {
    if (!projectPath || !name.trim()) return false;

    try {
      const res = await fetch('/api/git/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, action: 'checkout', name }),
      });

      if (res.ok) {
        await refresh();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [projectPath, refresh]);

  // Delete branch
  const deleteBranch = useCallback(async (name: string): Promise<boolean> => {
    if (!projectPath || !name.trim()) return false;

    try {
      const res = await fetch('/api/git/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, action: 'delete', name }),
      });

      if (res.ok) {
        await fetchBranches();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [projectPath, fetchBranches]);

  // Create pull request
  const createPR = useCallback(async (
    title: string,
    body?: string,
    base = 'main'
  ): Promise<{ success: boolean; url?: string }> => {
    if (!projectPath || !title.trim()) return { success: false };

    try {
      const res = await fetch('/api/git/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, title, body, base }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, url: data.url };
      }

      return { success: false };
    } catch {
      return { success: false };
    }
  }, [projectPath]);

  // Initial load
  useEffect(() => {
    if (projectPath) {
      refresh();
    }
  }, [projectPath, refresh]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && projectPath && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchStatus, refreshInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, projectPath, refreshInterval, fetchStatus]);

  return {
    status,
    commits,
    branches,
    isLoading,
    isCommitting,
    isPushing,
    isPulling,
    error,
    refresh,
    commit,
    push,
    pull,
    stageFile,
    unstageFile,
    stageAll,
    createBranch,
    checkoutBranch,
    deleteBranch,
    createPR,
  };
}

export default useGitPanel;
