/**
 * Website Clone Service
 * Core cloning logic using website-scraper + Puppeteer
 */

import { spawn, type Subprocess } from 'bun';
import { existsSync, readdirSync, copyFileSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { mkdir, readdir, writeFile, readFile, rm } from 'fs/promises';
import { randomUUID } from 'crypto';
import type {
  CloneOptions,
  CloneResult,
  SanitizeResult,
  ServerInfo,
  CloneJob,
  CloneEvent,
} from './types';

const DEFAULT_OUTPUT_BASE = '/Users/master/astro-clones';
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export class CloneService {
  private jobs: Map<string, CloneJob> = new Map();
  private servers: Map<string, Subprocess> = new Map();
  private eventListeners: Map<string, ((event: CloneEvent) => void)[]> = new Map();

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/https?:\/\//, '').replace(/\/.*/, '').replace(/^www\./, '');
    }
  }

  /**
   * Generate clone script content
   */
  private generateCloneScript(url: string, outputDir: string, options: CloneOptions): string {
    const domain = this.extractDomain(url);
    return `
import scrape from 'website-scraper';
import PuppeteerPlugin from 'website-scraper-puppeteer';

const TARGET_URL = '${url}';
const OUTPUT_DIR = '${outputDir}';
const DOMAIN = '${domain}';

const options = {
  urls: [TARGET_URL],
  directory: OUTPUT_DIR,
  plugins: [
    new PuppeteerPlugin({
      launchOptions: {
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      scrollToBottom: ${options.scrollToBottom !== false ? '{ timeout: 10000, viewportN: 10 }' : 'false'},
      blockNavigation: true
    })
  ],
  request: {
    headers: {
      'User-Agent': '${options.userAgent || DEFAULT_USER_AGENT}'
    }
  },
  sources: [
    { selector: 'img', attr: 'src' },
    { selector: 'img', attr: 'srcset' },
    { selector: 'link[rel="stylesheet"]', attr: 'href' },
    { selector: 'link[rel="icon"]', attr: 'href' },
    { selector: 'link[rel="preload"]', attr: 'href' },
    { selector: 'script', attr: 'src' },
    { selector: 'video', attr: 'src' },
    { selector: 'video source', attr: 'src' },
    { selector: 'video', attr: 'poster' },
    { selector: 'source', attr: 'src' },
    { selector: 'source', attr: 'srcset' },
    { selector: 'a[href$=".pdf"]', attr: 'href' },
    { selector: '[style*="background"]', attr: 'style' }
  ],
  subdirectories: [
    { directory: 'images', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.ico', '.bmp'] },
    { directory: 'css', extensions: ['.css'] },
    { directory: 'js', extensions: ['.js', '.mjs'] },
    { directory: 'fonts', extensions: ['.woff', '.woff2', '.ttf', '.eot', '.otf'] },
    { directory: 'media', extensions: ['.mp4', '.webm', '.mp3', '.ogg', '.wav'] },
    { directory: 'docs', extensions: ['.pdf', '.doc', '.docx'] }
  ],
  filenameGenerator: 'bySiteStructure',
  prettifyUrls: true,
  recursive: true,
  maxRecursiveDepth: ${options.maxDepth || 3},
  urlFilter: (url) => url.includes(DOMAIN) || url.includes('cdn') || url.includes('static'),
  ignoreRobotsTxt: true
};

console.log(JSON.stringify({ type: 'start', url: TARGET_URL }));

scrape(options)
  .then(result => {
    console.log(JSON.stringify({
      type: 'complete',
      files: result.length,
      outputDir: OUTPUT_DIR
    }));
  })
  .catch(err => {
    console.log(JSON.stringify({
      type: 'error',
      message: err.message
    }));
    process.exit(1);
  });
`;
  }

  /**
   * Find HTML directory (where index.html is)
   */
  private async findHtmlDir(outputDir: string): Promise<string | null> {
    const findIndexHtml = async (dir: string): Promise<string | null> => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isFile() && entry.name === 'index.html') {
            return dir;
          }
          if (entry.isDirectory()) {
            const found = await findIndexHtml(fullPath);
            if (found) return found;
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
      }
      return null;
    };
    return findIndexHtml(outputDir);
  }

  /**
   * Sanitize asset filenames (remove query strings)
   */
  async sanitizeAssets(htmlDir: string): Promise<SanitizeResult> {
    const result: SanitizeResult = { fixed: 0, files: [] };
    const assetDirs = ['fonts', 'css', 'js', 'images'];

    for (const dirName of assetDirs) {
      const dirPath = join(htmlDir, dirName);
      if (!existsSync(dirPath)) continue;

      try {
        const files = readdirSync(dirPath);
        for (const file of files) {
          if (file.includes('?')) {
            const cleanName = file.split('?')[0];
            const sourcePath = join(dirPath, file);
            const targetPath = join(dirPath, cleanName);

            if (!existsSync(targetPath)) {
              copyFileSync(sourcePath, targetPath);
              result.fixed++;
              result.files.push(`${dirName}/${cleanName}`);
            }
          }
        }
      } catch (err) {
        console.error(`Error sanitizing ${dirName}:`, err);
      }
    }

    return result;
  }

  /**
   * Start a preview server
   */
  async startServer(htmlDir: string, port: number = 4321): Promise<ServerInfo> {
    // Kill any existing process on this port
    try {
      const killProc = spawn(['lsof', '-ti', `:${port}`]);
      const pids = await new Response(killProc.stdout).text();
      if (pids.trim()) {
        spawn(['kill', '-9', ...pids.trim().split('\n')]);
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch {
      // No process to kill
    }

    const server = spawn(['python3', '-m', 'http.server', String(port)], {
      cwd: htmlDir,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // Wait for server to start
    await new Promise((r) => setTimeout(r, 1500));

    const info: ServerInfo = {
      pid: server.pid,
      port,
      url: `http://localhost:${port}`,
      htmlDir,
    };

    this.servers.set(String(server.pid), server);
    return info;
  }

  /**
   * Stop a preview server
   */
  async stopServer(pid: number): Promise<void> {
    const server = this.servers.get(String(pid));
    if (server) {
      server.kill();
      this.servers.delete(String(pid));
    } else {
      // Try to kill by PID directly
      try {
        spawn(['kill', '-9', String(pid)]);
      } catch {
        // Already dead
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(jobId: string, event: CloneEvent): void {
    const listeners = this.eventListeners.get(jobId) || [];
    for (const listener of listeners) {
      listener(event);
    }
  }

  /**
   * Subscribe to job events
   */
  subscribe(jobId: string, listener: (event: CloneEvent) => void): () => void {
    const listeners = this.eventListeners.get(jobId) || [];
    listeners.push(listener);
    this.eventListeners.set(jobId, listeners);

    return () => {
      const current = this.eventListeners.get(jobId) || [];
      this.eventListeners.set(
        jobId,
        current.filter((l) => l !== listener)
      );
    };
  }

  /**
   * Clone a website
   */
  async clone(options: CloneOptions): Promise<CloneJob> {
    const jobId = randomUUID();
    const domain = this.extractDomain(options.url);
    const outputDir = options.outputDir || join(DEFAULT_OUTPUT_BASE, `cloned-${domain}`);

    const job: CloneJob = {
      id: jobId,
      url: options.url,
      status: 'pending',
      progress: 0,
      outputDir,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.emit(jobId, { type: 'status', jobId, data: { status: job.status, progress: job.progress } });

    // Run clone in background
    this.runClone(job, options).catch((err) => {
      job.status = 'error';
      job.error = err.message;
      job.updatedAt = new Date();
      this.emit(jobId, { type: 'error', jobId, data: { error: err.message } });
    });

    return job;
  }

  /**
   * Run the actual clone process
   */
  private async runClone(job: CloneJob, options: CloneOptions): Promise<void> {
    const startTime = Date.now();

    // Update status
    job.status = 'cloning';
    job.progress = 10;
    job.updatedAt = new Date();
    this.emit(job.id, { type: 'progress', jobId: job.id, data: { progress: 10, status: 'cloning' } });

    // Clear output directory if it exists (website-scraper requires directory to NOT exist)
    if (existsSync(job.outputDir!)) {
      await rm(job.outputDir!, { recursive: true, force: true });
    }
    // Note: Do NOT mkdir here - website-scraper creates the directory itself

    // Generate and save clone script in agent-girl directory (where node_modules lives)
    // Node resolves packages from script location, not cwd
    const tempDir = join(process.cwd(), '.clone-temp');
    await mkdir(tempDir, { recursive: true });
    const scriptPath = join(tempDir, `clone-${job.id}.mjs`);
    const scriptContent = this.generateCloneScript(options.url, job.outputDir!, options);
    await writeFile(scriptPath, scriptContent);

    // Run clone script
    const cloneProc = spawn(['node', scriptPath], {
      cwd: process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // Process output
    const reader = cloneProc.stdout.getReader();
    const stderrReader = cloneProc.stderr.getReader();
    let filesDownloaded = 0;
    let stderrOutput = '';

    // Read stderr in background
    (async () => {
      try {
        while (true) {
          const { done, value } = await stderrReader.read();
          if (done) break;
          stderrOutput += new TextDecoder().decode(value);
        }
      } catch {
        // Stream ended
      }
    })();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'complete') {
              filesDownloaded = data.files || 0;
            }
          } catch {
            // Not JSON, ignore
          }
        }
      }
    } catch {
      // Stream ended
    }

    // Wait for process with timeout (5 minutes default)
    const timeout = options.timeout || 300000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        cloneProc.kill();
        reject(new Error(`Clone timeout after ${timeout / 1000}s`));
      }, timeout);
    });

    const exitCode = await Promise.race([cloneProc.exited, timeoutPromise]);
    if (exitCode !== 0) {
      const errorMsg = stderrOutput.trim() || 'Clone process failed with exit code ' + exitCode;
      throw new Error(errorMsg);
    }

    job.progress = 60;
    this.emit(job.id, { type: 'progress', jobId: job.id, data: { progress: 60, status: 'sanitizing' } });

    // Find HTML directory
    const htmlDir = await this.findHtmlDir(job.outputDir!);
    if (!htmlDir) {
      throw new Error('Could not find index.html in cloned output');
    }

    // Sanitize assets
    job.status = 'sanitizing';
    job.updatedAt = new Date();
    await this.sanitizeAssets(htmlDir);

    job.progress = 80;
    this.emit(job.id, { type: 'progress', jobId: job.id, data: { progress: 80, status: 'serving' } });

    // Start server
    job.status = 'serving';
    job.updatedAt = new Date();
    const server = await this.startServer(htmlDir);
    job.server = server;

    // Cleanup temp script
    try {
      const tempDir = join(process.cwd(), '.clone-temp');
      const scriptPath = join(tempDir, `clone-${job.id}.mjs`);
      if (existsSync(scriptPath)) {
        await rm(scriptPath);
      }
    } catch {
      // Ignore cleanup errors
    }

    // Complete
    job.status = 'complete';
    job.progress = 100;
    job.updatedAt = new Date();
    job.result = {
      success: true,
      url: options.url,
      outputDir: job.outputDir!,
      htmlDir,
      filesDownloaded,
      duration: Date.now() - startTime,
    };

    this.emit(job.id, {
      type: 'complete',
      jobId: job.id,
      data: {
        ...job.result,
        server,
        previewUrl: server.url,
      },
    });
  }

  /**
   * Get job status
   */
  getJob(jobId: string): CloneJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * List all jobs
   */
  listJobs(): CloneJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Quick clone and serve (synchronous-style for simple use)
   */
  async quickClone(url: string, port: number = 4321): Promise<{ htmlDir: string; server: ServerInfo }> {
    const domain = this.extractDomain(url);
    const outputDir = join(DEFAULT_OUTPUT_BASE, `cloned-${domain}`);

    // Clone
    const job = await this.clone({ url, outputDir });

    // Wait for completion
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const current = this.getJob(job.id);
        if (current?.status === 'complete' && current.server) {
          clearInterval(checkInterval);
          resolve({
            htmlDir: current.result!.htmlDir,
            server: current.server,
          });
        } else if (current?.status === 'error') {
          clearInterval(checkInterval);
          reject(new Error(current.error));
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Clone timeout'));
      }, 300000);
    });
  }
}

// Singleton instance
export const cloneService = new CloneService();
