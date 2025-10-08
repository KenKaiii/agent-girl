/**
 * Background Process Manager
 * Manages background processes spawned outside SDK control
 */

import type { Subprocess } from "bun";

export interface BackgroundProcessInfo {
  bashId: string;
  command: string;
  description?: string;
  startedAt: number;
  sessionId: string;
  subprocess: Subprocess;
  workingDir: string;
  logFile: string;
  pid: number;
}

export class BackgroundProcessManager {
  private processes = new Map<string, BackgroundProcessInfo>();

  /**
   * Spawn a background process outside SDK control
   */
  async spawn(
    command: string,
    workingDir: string,
    bashId: string,
    sessionId: string,
    description?: string
  ): Promise<{ subprocess: Subprocess; pid: number }> {
    console.log(`🚀 Spawning background process outside SDK control`);
    console.log(`   bashId: ${bashId}`);
    console.log(`   command: ${command}`);
    console.log(`   workingDir: ${workingDir}`);

    // Use nohup to fully detach and redirect output to log file
    // This prevents SIGPIPE when parent closes pipes
    const logFile = `/tmp/agent-girl-${bashId}.log`;
    const wrappedCommand = `nohup sh -c '${command.replace(/'/g, "'\"'\"'")}' > ${logFile} 2>&1 & echo $!`;

    const subprocess = Bun.spawn(['sh', '-c', wrappedCommand], {
      cwd: workingDir,
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    });

    // Read the PID from output
    const output = await new Response(subprocess.stdout).text();
    const actualPid = parseInt(output.trim());

    const processInfo: BackgroundProcessInfo = {
      bashId,
      command,
      description,
      startedAt: Date.now(),
      sessionId,
      subprocess,
      workingDir,
      logFile, // Store log file path for BashOutput
      pid: actualPid,
    };

    this.processes.set(bashId, processInfo);
    console.log(`✅ Process spawned with PID: ${actualPid}`);
    console.log(`   Log file: ${logFile}`);
    console.log(`   Registry size: ${this.processes.size}`);

    return { subprocess, pid: actualPid };
  }

  /**
   * Get a process by bashId
   */
  get(bashId: string): BackgroundProcessInfo | undefined {
    return this.processes.get(bashId);
  }

  /**
   * Check if a process exists
   */
  has(bashId: string): boolean {
    return this.processes.has(bashId);
  }

  /**
   * Get all processes for a session
   */
  getBySession(sessionId: string): BackgroundProcessInfo[] {
    return Array.from(this.processes.values()).filter(p => p.sessionId === sessionId);
  }

  /**
   * Get all process entries
   */
  entries(): [string, BackgroundProcessInfo][] {
    return Array.from(this.processes.entries());
  }

  /**
   * Get all process values
   */
  values(): BackgroundProcessInfo[] {
    return Array.from(this.processes.values());
  }

  /**
   * Get registry size
   */
  get size(): number {
    return this.processes.size;
  }

  /**
   * Delete a process from registry
   */
  delete(bashId: string): boolean {
    return this.processes.delete(bashId);
  }

  /**
   * Kill a background process
   */
  async kill(bashId: string): Promise<boolean> {
    const processInfo = this.processes.get(bashId);
    if (!processInfo) {
      return false;
    }

    const pid = processInfo.subprocess.pid;

    if (pid) {
      try {
        // Kill the entire process group (setsid makes PID the process group leader)
        // Using negative PID targets the process group
        console.log(`  Killing process group -${pid}...`);
        Bun.spawnSync(['kill', '-TERM', '--', `-${pid}`]);

        // Give processes a moment to terminate gracefully
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force kill any remaining processes in the group
        Bun.spawnSync(['kill', '-KILL', '--', `-${pid}`]);

        // Also kill the subprocess reference
        processInfo.subprocess.kill();
        console.log(`  ✅ Killed process group -${pid}`);
      } catch {
        console.log(`  ⚠️  Error during kill, forcing subprocess.kill()`);
        processInfo.subprocess.kill();
      }
    }

    // Remove from registry
    return this.processes.delete(bashId);
  }

  /**
   * Clean up all processes for a session
   */
  async cleanupSession(sessionId: string): Promise<number> {
    const processesToClean = this.getBySession(sessionId);

    if (processesToClean.length > 0) {
      console.log(`🧹 Cleaning up ${processesToClean.length} background process(es) for session ${sessionId}`);

      for (const process of processesToClean) {
        const pid = process.subprocess.pid;

        if (pid) {
          try {
            // Kill the entire process group
            Bun.spawnSync(['kill', '-TERM', '--', `-${pid}`]);
            Bun.spawnSync(['kill', '-KILL', '--', `-${pid}`]);
            process.subprocess.kill();
            console.log(`  ✅ Killed process group -${pid}: ${process.command}`);
          } catch {
            process.subprocess.kill();
            console.log(`  ⚠️  Fallback killed subprocess ${pid}: ${process.command}`);
          }
        }

        // Remove from registry
        this.processes.delete(process.bashId);
      }
    }

    return processesToClean.length;
  }

  /**
   * Find existing process for session with same command
   */
  findExistingProcess(sessionId: string, command: string): BackgroundProcessInfo | undefined {
    return this.values().find(p => p.sessionId === sessionId && p.command === command);
  }
}

// Export singleton instance
export const backgroundProcessManager = new BackgroundProcessManager();
