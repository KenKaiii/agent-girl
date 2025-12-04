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

// Check for --setup flag before starting the server
if (process.argv.includes('--setup')) {
  const { runSetup } = await import('../setup');
  await runSetup();
  process.exit(0);
}

// Check for OAuth flags before starting the server
// Run cli.ts as a separate process to avoid importing server modules
const oauthFlag = process.argv.find(arg =>
  arg === '--login' || arg === 'login' ||
  arg === '--logout' || arg === 'logout' ||
  arg === '--status' || arg === 'status' || arg === '--auth-status'
);

if (oauthFlag) {
  const proc = Bun.spawn(['bun', 'run', 'cli.ts', oauthFlag], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await proc.exited;
  process.exit(exitCode);
}

import { watch } from "fs";
import { getDefaultWorkingDirectory, ensureDirectory } from "./directoryUtils";
import { handleStaticFile } from "./staticFileServer";
import { initializeStartup, checkNodeAvailability } from "./startup";
import { handleSessionRoutes } from "./routes/sessions";
import { handleDirectoryRoutes } from "./routes/directory";
import { handleUserConfigRoutes } from "./routes/userConfig";
import { handleCommandRoutes } from "./routes/commands";
import { handleWebSocketMessage } from "./websocket/messageHandlers";
import { handleHealthCheck, handleLivenessProbe, handleReadinessProbe, updateWsStats } from "./routes/health";
import { logger } from "./utils/logger";
import type { ServerWebSocket, Server as ServerType } from "bun";

// Initialize startup configuration (loads env vars, sets up PostCSS)
const { isStandalone: IS_STANDALONE, binaryDir: BINARY_DIR, postcss, tailwindcss, autoprefixer } = await initializeStartup();

// Check Node.js availability for Claude SDK subprocess
await checkNodeAvailability();

// Initialize default working directory
const DEFAULT_WORKING_DIR = getDefaultWorkingDirectory();
ensureDirectory(DEFAULT_WORKING_DIR);

// Hot reload WebSocket clients
interface HotReloadClient {
  send: (message: string) => void;
}

// Chat WebSocket clients
interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

// Store active queries for mid-stream control
const activeQueries = new Map<string, unknown>();

const hotReloadClients = new Set<HotReloadClient>();

// Watch for file changes (hot reload) - only in dev mode
if (!IS_STANDALONE) {
  watch('./client', { recursive: true }, (_eventType, filename) => {
    if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.css') || filename.endsWith('.html'))) {
      // Notify all hot reload clients
      hotReloadClients.forEach(client => {
        try {
          client.send(JSON.stringify({ type: 'reload' }));
        } catch {
          hotReloadClients.delete(client);
        }
      });
    }
  });
}

const server = Bun.serve({
  port: 3001,
  idleTimeout: 255, // 4.25 minutes (Bun's maximum) - keepalive messages every 30s prevent timeout

  websocket: {
    open(ws: ServerWebSocket<ChatWebSocketData>) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.add(ws);
      }
      // Session ID is assigned in first message, not on connection
    },

    async message(ws: ServerWebSocket<ChatWebSocketData>, message: string) {
      await handleWebSocketMessage(ws, message, activeQueries);
    },

    close(ws: ServerWebSocket<ChatWebSocketData>) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.delete(ws);
      } else if (ws.data?.type === 'chat' && ws.data?.sessionId) {
        logger.debug('WebSocket disconnected', { sessionId: ws.data.sessionId.substring(0, 8) });
      }
      // Update health check stats (count remaining connections)
      updateWsStats(hotReloadClients.size);
    }
  },

  async fetch(req: Request, server: ServerType<ChatWebSocketData>) {
    const url = new URL(req.url);

    // WebSocket endpoints
    if (url.pathname === '/hot-reload') {
      const upgraded = server.upgrade(req, { data: { type: 'hot-reload' } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }

    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req, { data: { type: 'chat' } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }

    // Health check endpoints
    if (url.pathname === '/health') {
      return handleHealthCheck(req);
    }
    if (url.pathname === '/health/live' || url.pathname === '/livez') {
      return handleLivenessProbe();
    }
    if (url.pathname === '/health/ready' || url.pathname === '/readyz') {
      return handleReadinessProbe();
    }

    // Try session routes
    const sessionResponse = await handleSessionRoutes(req, url, activeQueries);
    if (sessionResponse) {
      return sessionResponse;
    }

    // Try directory routes
    const directoryResponse = await handleDirectoryRoutes(req, url);
    if (directoryResponse) {
      return directoryResponse;
    }

    // Try user config routes
    const userConfigResponse = await handleUserConfigRoutes(req, url);
    if (userConfigResponse) {
      return userConfigResponse;
    }

    // Try command routes
    const commandResponse = await handleCommandRoutes(req, url);
    if (commandResponse) {
      return commandResponse;
    }

    // Try to handle as static file
    const staticResponse = await handleStaticFile(req, {
      binaryDir: BINARY_DIR,
      isStandalone: IS_STANDALONE,
      postcss,
      tailwindcss,
      autoprefixer,
    });

    if (staticResponse) {
      return staticResponse;
    }

    return new Response('Not Found', { status: 404 });
  },
});

// ASCII Art Banner
console.log('\n');
console.log('  █████╗  ██████╗ ███████╗███╗   ██╗████████╗     ██████╗ ██╗██████╗ ██╗     ');
console.log(' ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝    ██╔════╝ ██║██╔══██╗██║     ');
console.log(' ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║       ██║  ███╗██║██████╔╝██║     ');
console.log(' ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║       ██║   ██║██║██╔══██╗██║     ');
console.log(' ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║       ╚██████╔╝██║██║  ██║███████╗');
console.log(' ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝        ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝');
console.log('\n');
console.log(`  👉 Open here: http://localhost:${server.port}`);
console.log('\n');
console.log('  ═══════════════════════════════════════════════════════════════════════════');
console.log('\n');
console.log('  All logs will show below this:');
console.log('\n');
