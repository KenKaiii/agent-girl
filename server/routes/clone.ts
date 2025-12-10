/**
 * Clone Routes - Website cloning API endpoints
 */

import { cloneService } from '../features/clone/service';
import type { CloneOptions } from '../features/clone/types';
import { logger } from '../utils/core/logger';
import { projectRegistry } from '../projectRegistry';

/**
 * Handle clone-related API routes
 */
export async function handleCloneRoutes(req: Request, url: URL): Promise<Response | null> {
  // All clone routes start with /api/clone
  if (!url.pathname.startsWith('/api/clone')) {
    return null;
  }

  const path = url.pathname.replace('/api/clone', '');
  const method = req.method;

  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // POST /api/clone - Start a new clone job
    if (path === '' && method === 'POST') {
      const body = await req.json() as CloneOptions & { sessionId?: string };

      if (!body.url) {
        return Response.json({ error: 'URL is required' }, { status: 400, headers: corsHeaders });
      }

      logger.info('Starting clone job', { url: body.url });
      const job = await cloneService.clone(body);

      // Register project in registry
      const domain = new URL(body.url).hostname.replace(/^www\./, '');
      const project = projectRegistry.registerProject({
        sessionId: body.sessionId,
        name: domain,
        type: 'clone',
        path: job.outputDir!,
        sourceUrl: body.url,
        metadata: {
          originalDomain: domain,
          cloneJobId: job.id,
        },
      });

      return Response.json({
        jobId: job.id,
        projectId: project.id,
        status: job.status,
        url: job.url,
      }, { headers: corsHeaders });
    }

    // POST /api/clone/quick - Quick clone and serve
    if (path === '/quick' && method === 'POST') {
      const body = await req.json() as { url: string; port?: number; sessionId?: string };

      if (!body.url) {
        return Response.json({ error: 'URL is required' }, { status: 400, headers: corsHeaders });
      }

      logger.info('Starting quick clone', { url: body.url, port: body.port });

      try {
        const result = await cloneService.quickClone(body.url, body.port || 4321);

        // Register project in registry
        const domain = new URL(body.url).hostname.replace(/^www\./, '');
        const project = projectRegistry.registerProject({
          sessionId: body.sessionId,
          name: domain,
          type: 'clone',
          path: result.htmlDir,
          sourceUrl: body.url,
          metadata: { originalDomain: domain },
        });
        projectRegistry.updateStatus(project.id, 'serving', result.server.url, result.server.port);

        return Response.json({
          success: true,
          projectId: project.id,
          htmlDir: result.htmlDir,
          previewUrl: result.server.url,
          server: result.server,
          previewAction: `<preview-action type="open" url="${result.server.url}" />`,
        }, { headers: corsHeaders });
      } catch (err) {
        logger.error('Quick clone failed', { error: String(err) });
        return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/clone - List all jobs
    if (path === '' && method === 'GET') {
      const jobs = cloneService.listJobs();
      return Response.json(jobs, { headers: corsHeaders });
    }

    // GET /api/clone/:jobId - Get job status
    const jobIdMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (jobIdMatch && method === 'GET') {
      const jobId = jobIdMatch[1];
      const job = cloneService.getJob(jobId);

      if (!job) {
        return Response.json({ error: 'Job not found' }, { status: 404, headers: corsHeaders });
      }

      return Response.json(job, { headers: corsHeaders });
    }

    // DELETE /api/clone/:jobId/server - Stop preview server
    const serverStopMatch = path.match(/^\/([a-f0-9-]+)\/server$/);
    if (serverStopMatch && method === 'DELETE') {
      const jobId = serverStopMatch[1];
      const job = cloneService.getJob(jobId);

      if (!job) {
        return Response.json({ error: 'Job not found' }, { status: 404, headers: corsHeaders });
      }

      if (!job.server) {
        return Response.json({ error: 'No server running for this job' }, { status: 400, headers: corsHeaders });
      }

      await cloneService.stopServer(job.server.pid);
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    // GET /api/clone/:jobId/events - SSE stream for job events
    const eventsMatch = path.match(/^\/([a-f0-9-]+)\/events$/);
    if (eventsMatch && method === 'GET') {
      const jobId = eventsMatch[1];
      const job = cloneService.getJob(jobId);

      if (!job) {
        return Response.json({ error: 'Job not found' }, { status: 404, headers: corsHeaders });
      }

      const stream = new ReadableStream({
        start(controller) {
          // Send initial status
          const initialData = `data: ${JSON.stringify({ type: 'status', data: job })}\n\n`;
          controller.enqueue(new TextEncoder().encode(initialData));

          // Subscribe to events
          const unsubscribe = cloneService.subscribe(jobId, (event) => {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));

            if (event.type === 'complete' || event.type === 'error') {
              unsubscribe();
              controller.close();
            }
          });

          // If job is already complete, close immediately
          if (job.status === 'complete' || job.status === 'error') {
            unsubscribe();
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
    }

    // Not a clone route we handle
    return null;
  } catch (err) {
    logger.error('Clone route error', { error: String(err) });
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders });
  }
}
