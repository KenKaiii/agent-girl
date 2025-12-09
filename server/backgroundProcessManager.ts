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
        Bun.spawnSync(['kill', '-TERM', '--', `-${pid}`]);

        // Give processes a moment to terminate gracefully
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force kill any remaining processes in the group
        Bun.spawnSync(['kill', '-KILL', '--', `-${pid}`]);

        // Also kill the subprocess reference
        processInfo.subprocess.kill();
      } catch {
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
      for (const process of processesToClean) {
        const pid = process.subprocess.pid;

        if (pid) {
          try {
            // Kill the entire process group
            Bun.spawnSync(['kill', '-TERM', '--', `-${pid}`]);
            Bun.spawnSync(['kill', '-KILL', '--', `-${pid}`]);
            process.subprocess.kill();
          } catch {
            process.subprocess.kill();
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

  /**
   * Wait for a background process to complete with output streaming
   */
  async waitForCompletion(
    bashId: string,
    options: {
      onOutput?: (chunk: string) => void;
      timeout?: number; // Total timeout in ms (default 10 minutes)
      hangTimeout?: number; // No-output timeout in ms (default 2 minutes)
    } = {}
  ): Promise<{ exitCode: number; output: string }> {
    const processInfo = this.processes.get(bashId);
    if (!processInfo) {
      throw new Error(`Process ${bashId} not found`);
    }

    const timeout = options.timeout || 600000; // 10 minutes default
    const hangTimeout = options.hangTimeout || 300000; // 5 minutes default (increased for slower hardware)
    const startTime = Date.now();

    let lastOutputTime = Date.now();
    let lastOutputSize = 0;
    let fullOutput = '';

    // STABILITY FIX: Use refs to track intervals for proper cleanup
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let pollForExit: ReturnType<typeof setInterval> | null = null;
    let isResolved = false;

    const cleanupIntervals = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      if (pollForExit) {
        clearInterval(pollForExit);
        pollForExit = null;
      }
    };

    // Wait for process to exit
    return new Promise((resolve, reject) => {
      const safeResolve = (result: { exitCode: number; output: string }) => {
        if (isResolved) return;
        isResolved = true;
        cleanupIntervals();
        resolve(result);
      };

      const safeReject = (error: Error) => {
        if (isResolved) return;
        isResolved = true;
        cleanupIntervals();
        reject(error);
      };

      // Poll for output
      checkInterval = setInterval(async () => {
        if (isResolved) return;

        try {
          // Check if log file exists and read its size
          const file = Bun.file(processInfo.logFile);
          const exists = await file.exists();

          if (exists) {
            const currentSize = file.size;

            // If output has grown, read new content
            if (currentSize > lastOutputSize) {
              const text = await file.text();
              const newOutput = text.slice(lastOutputSize);

              if (newOutput) {
                lastOutputTime = Date.now();
                lastOutputSize = currentSize;
                fullOutput += newOutput;

                // Stream to callback
                options.onOutput?.(newOutput);
              }
            }
          }

          // Check for hang (no output for hangTimeout)
          const timeSinceOutput = Date.now() - lastOutputTime;
          if (timeSinceOutput > hangTimeout) {
            safeReject(new Error(`Command appears to be hanging (no output for ${hangTimeout / 1000}s)`));
            return;
          }

          // Check for total timeout
          const elapsed = Date.now() - startTime;
          if (elapsed > timeout) {
            safeReject(new Error(`Command timed out after ${timeout / 1000}s`));
            return;
          }
        } catch (error) {
          safeReject(error instanceof Error ? error : new Error(String(error)));
        }
      }, 1000); // Check every second

      // Poll for process exit
      const maxWaitTime = timeout;
      const pollInterval = 1000;
      let elapsed = 0;

      pollForExit = setInterval(() => {
        if (isResolved) return;

        elapsed += pollInterval;

        // Check if process is still alive
        try {
          process.kill(processInfo.pid, 0);
          // Still alive, continue waiting
          if (elapsed >= maxWaitTime) {
            safeReject(new Error(`Process did not exit within ${maxWaitTime / 1000}s`));
          }
        } catch {
          // Process is dead - read final output
          setTimeout(async () => {
            try {
              const file = Bun.file(processInfo.logFile);
              const exists = await file.exists();
              if (exists) {
                fullOutput = await file.text();
              }

              // Remove from registry
              this.processes.delete(bashId);

              safeResolve({ exitCode: 0, output: fullOutput });
            } catch (error) {
              safeReject(error instanceof Error ? error : new Error(String(error)));
            }
          }, 500); // Brief delay to ensure all output is written
        }
      }, pollInterval);
    });
  }
}

// Export singleton instance
export const backgroundProcessManager = new BackgroundProcessManager();
