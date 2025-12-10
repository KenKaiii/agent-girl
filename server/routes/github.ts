/**
 * GitHub Integration API
 *
 * Full Git workflow support similar to Bolt.new and Lovable.
 * Handles: init, commit, push, pull, branch, PR creation
 */

import { z } from 'zod';
import { execSync, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// Types & Schemas
// ============================================================================

const GitInitSchema = z.object({
  projectPath: z.string(),
  remote: z.string().url().optional(),
  defaultBranch: z.string().default('main'),
});

const GitCommitSchema = z.object({
  projectPath: z.string(),
  message: z.string().min(1).max(500),
  files: z.array(z.string()).optional(), // if empty, commit all
});

const GitPushSchema = z.object({
  projectPath: z.string(),
  remote: z.string().default('origin'),
  branch: z.string().optional(), // uses current branch if not specified
  force: z.boolean().default(false),
});

const GitPullSchema = z.object({
  projectPath: z.string(),
  remote: z.string().default('origin'),
  branch: z.string().optional(),
});

const GitBranchSchema = z.object({
  projectPath: z.string(),
  action: z.enum(['create', 'checkout', 'list', 'delete']),
  branchName: z.string().optional(),
});

const GitPRSchema = z.object({
  projectPath: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().optional(),
  base: z.string().default('main'),
  head: z.string().optional(), // uses current branch if not specified
  draft: z.boolean().default(false),
});

const GitCloneSchema = z.object({
  repoUrl: z.string().url(),
  targetPath: z.string(),
  branch: z.string().optional(),
});

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

// ============================================================================
// Git Utilities
// ============================================================================

async function runGit(projectPath: string, args: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`git -C "${projectPath}" ${args}`);
    return stdout.trim();
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    throw new Error(err.stderr || err.message || 'Git command failed');
  }
}

function runGitSync(projectPath: string, args: string): string {
  try {
    return execSync(`git -C "${projectPath}" ${args}`, {
      encoding: 'utf-8',
      shell: '/bin/bash'
    }).trim();
  } catch (error: unknown) {
    const err = error as { stderr?: Buffer | string };
    throw new Error(err.stderr?.toString() || 'Git command failed');
  }
}

async function getGitStatus(projectPath: string): Promise<GitStatus> {
  const isRepo = existsSync(join(projectPath, '.git'));
  if (!isRepo) {
    throw new Error('Kein Git-Repository');
  }

  const branch = await runGit(projectPath, 'branch --show-current');
  const statusOutput = await runGit(projectPath, 'status --porcelain');

  const lines = statusOutput.split('\n').filter(Boolean);
  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];

  for (const line of lines) {
    const index = line[0];
    const worktree = line[1];
    const file = line.slice(3);

    if (index === '?' && worktree === '?') {
      untracked.push(file);
    } else if (index !== ' ' && index !== '?') {
      staged.push(file);
    } else if (worktree !== ' ') {
      unstaged.push(file);
    }
  }

  // Get ahead/behind info
  let ahead = 0;
  let behind = 0;
  let remote: string | undefined;

  try {
    remote = await runGit(projectPath, 'config --get remote.origin.url');
    const counts = await runGit(projectPath, `rev-list --count --left-right @{upstream}...HEAD`);
    const [b, a] = counts.split('\t').map(Number);
    behind = b || 0;
    ahead = a || 0;
  } catch {
    // No upstream configured
  }

  return {
    branch,
    ahead,
    behind,
    staged,
    unstaged,
    untracked,
    hasChanges: staged.length > 0 || unstaged.length > 0 || untracked.length > 0,
    isClean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
    remote
  };
}

async function getGitLog(projectPath: string, count: number = 10): Promise<GitLog[]> {
  const format = '%H|%h|%an|%ar|%s';
  const output = await runGit(projectPath, `log -${count} --format="${format}"`);

  return output.split('\n').filter(Boolean).map(line => {
    const [hash, shortHash, author, date, message] = line.split('|');
    return { hash, shortHash, author, date, message };
  });
}

// ============================================================================
// Git Operations
// ============================================================================

async function gitInit(
  projectPath: string,
  remote?: string,
  defaultBranch: string = 'main'
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if already a repo
    if (existsSync(join(projectPath, '.git'))) {
      return { success: true, message: 'Git-Repository existiert bereits' };
    }

    // Initialize
    await runGit(projectPath, 'init');
    await runGit(projectPath, `branch -M ${defaultBranch}`);

    // Create .gitignore if not exists
    const gitignorePath = join(projectPath, '.gitignore');
    if (!existsSync(gitignorePath)) {
      writeFileSync(gitignorePath, `node_modules/
.env
.env.local
.DS_Store
dist/
build/
.turbo/
*.log
`, 'utf-8');
    }

    // Add remote if provided
    if (remote) {
      await runGit(projectPath, `remote add origin ${remote}`);
    }

    return {
      success: true,
      message: `Git-Repository initialisiert${remote ? ` mit Remote: ${remote}` : ''}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Fehler bei Git init: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function gitCommit(
  projectPath: string,
  message: string,
  files?: string[]
): Promise<{ success: boolean; message: string; hash?: string }> {
  try {
    // Add files
    if (files && files.length > 0) {
      for (const file of files) {
        await runGit(projectPath, `add "${file}"`);
      }
    } else {
      await runGit(projectPath, 'add -A');
    }

    // Check if there's anything to commit
    const status = await getGitStatus(projectPath);
    if (status.staged.length === 0) {
      return { success: false, message: 'Keine Änderungen zum Committen' };
    }

    // Commit
    await runGit(projectPath, `commit -m "${message.replace(/"/g, '\\"')}"`);
    const hash = await runGit(projectPath, 'rev-parse --short HEAD');

    return {
      success: true,
      message: `Commit erstellt: ${hash}`,
      hash
    };
  } catch (error) {
    return {
      success: false,
      message: `Fehler bei Commit: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function gitPush(
  projectPath: string,
  remote: string = 'origin',
  branch?: string,
  force: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const status = await getGitStatus(projectPath);
    const targetBranch = branch || status.branch;

    const forceFlag = force ? '--force' : '';
    const setUpstream = status.remote ? '' : '-u';

    await runGit(projectPath, `push ${setUpstream} ${forceFlag} ${remote} ${targetBranch}`);

    return {
      success: true,
      message: `Erfolgreich gepusht zu ${remote}/${targetBranch}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Fehler bei Push: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function gitPull(
  projectPath: string,
  remote: string = 'origin',
  branch?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const status = await getGitStatus(projectPath);
    const targetBranch = branch || status.branch;

    await runGit(projectPath, `pull ${remote} ${targetBranch}`);

    return {
      success: true,
      message: `Erfolgreich von ${remote}/${targetBranch} gepullt`
    };
  } catch (error) {
    return {
      success: false,
      message: `Fehler bei Pull: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function gitBranch(
  projectPath: string,
  action: 'create' | 'checkout' | 'list' | 'delete',
  branchName?: string
): Promise<{ success: boolean; message: string; branches?: string[] }> {
  try {
    switch (action) {
      case 'list': {
        const output = await runGit(projectPath, 'branch -a');
        const branches = output.split('\n')
          .map(b => b.trim().replace('* ', ''))
          .filter(Boolean);
        return { success: true, message: 'Branches aufgelistet', branches };
      }

      case 'create': {
        if (!branchName) {
          return { success: false, message: 'Branch-Name erforderlich' };
        }
        await runGit(projectPath, `checkout -b ${branchName}`);
        return { success: true, message: `Branch "${branchName}" erstellt und ausgecheckt` };
      }

      case 'checkout': {
        if (!branchName) {
          return { success: false, message: 'Branch-Name erforderlich' };
        }
        await runGit(projectPath, `checkout ${branchName}`);
        return { success: true, message: `Zu Branch "${branchName}" gewechselt` };
      }

      case 'delete': {
        if (!branchName) {
          return { success: false, message: 'Branch-Name erforderlich' };
        }
        await runGit(projectPath, `branch -d ${branchName}`);
        return { success: true, message: `Branch "${branchName}" gelöscht` };
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Fehler bei Branch-Operation: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

async function createPullRequest(
  projectPath: string,
  title: string,
  body?: string,
  base: string = 'main',
  head?: string,
  draft: boolean = false
): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    // Get current branch if head not specified
    const status = await getGitStatus(projectPath);
    const headBranch = head || status.branch;

    // Use gh CLI
    const draftFlag = draft ? '--draft' : '';
    const bodyFlag = body ? `--body "${body.replace(/"/g, '\\"')}"` : '';

    const cmd = `gh pr create --title "${title.replace(/"/g, '\\"')}" ${bodyFlag} --base ${base} --head ${headBranch} ${draftFlag}`;

    const { stdout } = await execAsync(cmd, { cwd: projectPath });
    const url = stdout.trim();

    return {
      success: true,
      message: `Pull Request erstellt`,
      url
    };
  } catch (error) {
    return {
      success: false,
      message: `Fehler bei PR-Erstellung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}. Ist gh CLI installiert?`
    };
  }
}

async function gitClone(
  repoUrl: string,
  targetPath: string,
  branch?: string
): Promise<{ success: boolean; message: string; path?: string }> {
  try {
    const branchFlag = branch ? `-b ${branch}` : '';
    const projectName = basename(repoUrl).replace('.git', '');
    const fullPath = join(targetPath, projectName);

    execSync(`git clone ${branchFlag} "${repoUrl}" "${fullPath}"`, {
      shell: '/bin/bash'
    });

    return {
      success: true,
      message: `Repository geklont nach ${fullPath}`,
      path: fullPath
    };
  } catch (error) {
    return {
      success: false,
      message: `Fehler beim Klonen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

// ============================================================================
// Route Handler
// ============================================================================

export async function handleGitHubRoutes(req: Request, url: URL): Promise<Response> {
  const path = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // GET /api/git/status - Get git status
    if (path === '/api/git/status' && req.method === 'GET') {
      const projectPath = url.searchParams.get('projectPath');

      if (!projectPath) {
        return new Response(JSON.stringify({
          error: 'projectPath erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const status = await getGitStatus(projectPath);
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: corsHeaders
      });
    }

    // GET /api/git/log - Get git log
    if (path === '/api/git/log' && req.method === 'GET') {
      const projectPath = url.searchParams.get('projectPath');
      const count = parseInt(url.searchParams.get('count') || '10');

      if (!projectPath) {
        return new Response(JSON.stringify({
          error: 'projectPath erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const log = await getGitLog(projectPath, count);
      return new Response(JSON.stringify({ log }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // POST /api/git/init - Initialize git repo
    if (path === '/api/git/init' && req.method === 'POST') {
      const body = await req.json();
      const parsed = GitInitSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await gitInit(
        parsed.data.projectPath,
        parsed.data.remote,
        parsed.data.defaultBranch
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/git/commit - Create commit
    if (path === '/api/git/commit' && req.method === 'POST') {
      const body = await req.json();
      const parsed = GitCommitSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await gitCommit(
        parsed.data.projectPath,
        parsed.data.message,
        parsed.data.files
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/git/push - Push changes
    if (path === '/api/git/push' && req.method === 'POST') {
      const body = await req.json();
      const parsed = GitPushSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await gitPush(
        parsed.data.projectPath,
        parsed.data.remote,
        parsed.data.branch,
        parsed.data.force
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/git/pull - Pull changes
    if (path === '/api/git/pull' && req.method === 'POST') {
      const body = await req.json();
      const parsed = GitPullSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await gitPull(
        parsed.data.projectPath,
        parsed.data.remote,
        parsed.data.branch
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/git/branch - Branch operations
    if (path === '/api/git/branch' && req.method === 'POST') {
      const body = await req.json();
      const parsed = GitBranchSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await gitBranch(
        parsed.data.projectPath,
        parsed.data.action,
        parsed.data.branchName
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/git/pr - Create pull request
    if (path === '/api/git/pr' && req.method === 'POST') {
      const body = await req.json();
      const parsed = GitPRSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await createPullRequest(
        parsed.data.projectPath,
        parsed.data.title,
        parsed.data.body,
        parsed.data.base,
        parsed.data.head,
        parsed.data.draft
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // POST /api/git/clone - Clone repository
    if (path === '/api/git/clone' && req.method === 'POST') {
      const body = await req.json();
      const parsed = GitCloneSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(JSON.stringify({
          error: 'Ungültige Anfrage',
          details: parsed.error.flatten()
        }), { status: 400, headers: corsHeaders });
      }

      const result = await gitClone(
        parsed.data.repoUrl,
        parsed.data.targetPath,
        parsed.data.branch
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: corsHeaders
      });
    }

    // GET /api/git/diff - Get diff
    if (path === '/api/git/diff' && req.method === 'GET') {
      const projectPath = url.searchParams.get('projectPath');
      const staged = url.searchParams.get('staged') === 'true';

      if (!projectPath) {
        return new Response(JSON.stringify({
          error: 'projectPath erforderlich'
        }), { status: 400, headers: corsHeaders });
      }

      const diff = await runGit(projectPath, staged ? 'diff --staged' : 'diff');
      return new Response(JSON.stringify({ diff }), {
        status: 200,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: 'Nicht gefunden',
      availableEndpoints: [
        'GET /api/git/status?projectPath=...',
        'GET /api/git/log?projectPath=...',
        'GET /api/git/diff?projectPath=...',
        'POST /api/git/init',
        'POST /api/git/commit',
        'POST /api/git/push',
        'POST /api/git/pull',
        'POST /api/git/branch',
        'POST /api/git/pr',
        'POST /api/git/clone'
      ]
    }), { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('GitHub API error:', error);
    return new Response(JSON.stringify({
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }), { status: 500, headers: corsHeaders });
  }
}
