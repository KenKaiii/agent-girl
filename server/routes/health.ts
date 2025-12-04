/**
 * Health Check Endpoint
 * Provides system health information for monitoring
 */

import { sessionDb } from '../database';
import { getProviders } from '../providers';
import { logger } from '../utils/logger';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: ComponentHealth;
    providers: ComponentHealth;
    memory: MemoryHealth;
    websocket: ComponentHealth;
  };
}

interface ComponentHealth {
  status: 'ok' | 'degraded' | 'error';
  message?: string;
  latency?: number;
}

interface MemoryHealth {
  status: 'ok' | 'warning' | 'critical';
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentUsed: number;
}

// Track WebSocket connections
let wsConnectionCount = 0;
let wsLastActivity = Date.now();

export function updateWsStats(connections: number): void {
  wsConnectionCount = connections;
  wsLastActivity = Date.now();
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = performance.now();

  try {
    // Simple query to verify database is working
    const result = sessionDb.getSessionCount();
    const latency = Math.round(performance.now() - start);

    if (latency > 1000) {
      return {
        status: 'degraded',
        message: 'Database responding slowly',
        latency,
      };
    }

    return {
      status: 'ok',
      message: `${result} sessions`,
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

/**
 * Check provider configuration
 */
async function checkProviders(): Promise<ComponentHealth> {
  try {
    const providers = await getProviders();

    if (!providers.anthropic && !providers['z-ai'] && !providers.moonshot) {
      return {
        status: 'error',
        message: 'No API providers configured',
      };
    }

    const configured: string[] = [];
    if (providers.anthropic) configured.push('Anthropic');
    if (providers['z-ai']) configured.push('Z.AI');
    if (providers.moonshot) configured.push('Moonshot');

    return {
      status: 'ok',
      message: `Providers: ${configured.join(', ')}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Provider check failed',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): MemoryHealth {
  const usage = process.memoryUsage();
  const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  let status: 'ok' | 'warning' | 'critical' = 'ok';
  if (percentUsed > 90) {
    status = 'critical';
  } else if (percentUsed > 75) {
    status = 'warning';
  }

  return {
    status,
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
    percentUsed,
  };
}

/**
 * Check WebSocket status
 */
function checkWebSocket(): ComponentHealth {
  const timeSinceActivity = Date.now() - wsLastActivity;

  // If no activity in 5 minutes and no connections, might be an issue
  if (wsConnectionCount === 0 && timeSinceActivity > 5 * 60 * 1000) {
    return {
      status: 'degraded',
      message: 'No active connections',
    };
  }

  return {
    status: 'ok',
    message: `${wsConnectionCount} connection(s)`,
  };
}

/**
 * Run full health check
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
  const [database, providers] = await Promise.all([
    checkDatabase(),
    checkProviders(),
  ]);

  const memory = checkMemory();
  const websocket = checkWebSocket();

  // Determine overall status
  const checks = { database, providers, memory, websocket };
  const componentStatuses = [
    database.status,
    providers.status,
    memory.status === 'critical' ? 'error' : memory.status === 'warning' ? 'degraded' : 'ok',
    websocket.status,
  ];

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (componentStatuses.includes('error')) {
    overallStatus = 'unhealthy';
  } else if (componentStatuses.includes('degraded') || componentStatuses.includes('warning')) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };
}

/**
 * Health check route handler
 */
export async function handleHealthCheck(_req: Request): Promise<Response> {
  try {
    const health = await runHealthCheck();

    logger.debug('Health check completed', {
      status: health.status,
      uptime: health.uptime,
    });

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('Health check failed', {}, error as Error);

    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Simple liveness probe (just checks if server is running)
 */
export function handleLivenessProbe(): Response {
  return new Response('OK', { status: 200 });
}

/**
 * Readiness probe (checks if server is ready to accept traffic)
 */
export async function handleReadinessProbe(): Promise<Response> {
  try {
    const health = await runHealthCheck();

    if (health.status === 'unhealthy') {
      return new Response('NOT READY', { status: 503 });
    }

    return new Response('READY', { status: 200 });
  } catch {
    return new Response('NOT READY', { status: 503 });
  }
}
