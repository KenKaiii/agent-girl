/**
 * Queue API Routes - Provides REST endpoints for queue management
 * Handles task, trigger, and workflow operations
 */

import { getQueueSystem, type QueueSystem } from '../queue';

/**
 * Handle queue API routes
 */
export async function handleQueueRoutes(req: Request, url: URL): Promise<Response | undefined> {
  const queueSystem = getQueueSystem();

  if (!queueSystem) {
    return new Response(JSON.stringify({ error: 'Queue system not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ==================== TASK ROUTES ====================

  // POST /api/queue/tasks/batch - Create multiple tasks at once
  if (url.pathname === '/api/queue/tasks/batch' && req.method === 'POST') {
    try {
      const body = await req.json() as any;

      if (!body.sessionId || !body.tasks || !Array.isArray(body.tasks)) {
        return new Response(JSON.stringify({ error: 'sessionId and tasks array required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (body.tasks.length > 100) {
        return new Response(JSON.stringify({ error: 'Maximum 100 tasks per batch' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const createdTasks = await queueSystem.taskQueue.addTasksBatch(
        body.tasks.map((t: any) => ({
          sessionId: body.sessionId,
          prompt: t.prompt,
          mode: t.mode || 'general',
          model: t.model || 'claude-3-5-sonnet',
          status: 'pending' as const,
          priority: t.priority || 'normal',
          attempts: 0,
          maxAttempts: t.maxAttempts || 3,
          timeout: t.timeout,
          metadata: t.metadata,
          tags: t.tags,
        }))
      );

      return new Response(JSON.stringify({
        success: true,
        created: createdTasks.length,
        tasks: createdTasks
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // PUT /api/queue/tasks/reprioritize - Update task priorities
  if (url.pathname === '/api/queue/tasks/reprioritize' && req.method === 'PUT') {
    try {
      const body = await req.json() as { sessionId: string; priorities: Record<string, string> };

      if (!body.sessionId || !body.priorities) {
        return new Response(JSON.stringify({ error: 'sessionId and priorities required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let updated = 0;
      for (const [taskId, priority] of Object.entries(body.priorities)) {
        const task = queueSystem.taskQueue.getTask(taskId);
        if (task && task.sessionId === body.sessionId && task.status === 'pending') {
          // Access db through taskQueue's internal db reference
          (queueSystem.taskQueue as any).db.updateTaskPriority(taskId, priority);
          updated++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        updated,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/queue/tasks - Create a new task
  if (url.pathname === '/api/queue/tasks' && req.method === 'POST') {
    try {
      const body = await req.json() as any;

      const task = await queueSystem.taskQueue.addTask({
        sessionId: body.sessionId,
        prompt: body.prompt,
        mode: body.mode || 'general',
        model: body.model || 'claude-3-5-sonnet',
        status: 'pending' as const,
        priority: body.priority || 'normal',
        attempts: 0,
        maxAttempts: body.maxAttempts || 3,
        timeout: body.timeout,
        metadata: body.metadata,
        tags: body.tags,
      });

      return new Response(JSON.stringify({ success: true, task }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/queue/tasks/:taskId - Get task by ID
  if (url.pathname.match(/^\/api\/queue\/tasks\/[^/]+$/) && req.method === 'GET') {
    const taskId = url.pathname.split('/').pop();
    const task = queueSystem.taskQueue.getTask(taskId!);

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ task }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /api/queue/tasks?sessionId=:sessionId - Get session tasks
  if (url.pathname === '/api/queue/tasks' && req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId');
    const status = url.searchParams.get('status') as any;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tasks = queueSystem.taskQueue.getSessionTasks(sessionId, status);

    return new Response(JSON.stringify({ tasks, count: tasks.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT /api/queue/tasks/:taskId/cancel - Cancel a task
  if (url.pathname.match(/^\/api\/queue\/tasks\/[^/]+\/cancel$/) && req.method === 'PUT') {
    const taskId = url.pathname.split('/')[4];
    const success = queueSystem.taskQueue.cancelTask(taskId);

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT /api/queue/tasks/:taskId/pause - Pause a task
  if (url.pathname.match(/^\/api\/queue\/tasks\/[^/]+\/pause$/) && req.method === 'PUT') {
    const taskId = url.pathname.split('/')[4];
    const success = queueSystem.taskQueue.pauseTask(taskId);

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT /api/queue/tasks/:taskId/resume - Resume a task
  if (url.pathname.match(/^\/api\/queue\/tasks\/[^/]+\/resume$/) && req.method === 'PUT') {
    const taskId = url.pathname.split('/')[4];
    const success = queueSystem.taskQueue.resumeTask(taskId);

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ==================== TRIGGER ROUTES ====================

  // POST /api/queue/triggers - Create a new trigger
  if (url.pathname === '/api/queue/triggers' && req.method === 'POST') {
    try {
      const body = await req.json() as any;

      const trigger = queueSystem.triggerEngine.createTrigger({
        sessionId: body.sessionId,
        type: body.type,
        name: body.name,
        description: body.description,
        targetTaskId: body.targetTaskId,
        taskTemplate: body.taskTemplate,
        condition: body.condition,
        schedule: body.schedule,
        webhookUrl: body.webhookUrl,
        isActive: body.isActive !== false,
        metadata: body.metadata,
      });

      return new Response(JSON.stringify({ success: true, trigger }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/queue/triggers?sessionId=:sessionId - Get session triggers
  if (url.pathname === '/api/queue/triggers' && req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const triggers = queueSystem.triggerEngine.getActiveTriggers(sessionId);

    return new Response(JSON.stringify({ triggers, count: triggers.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/queue/triggers/:triggerId/fire - Manually fire a trigger
  if (url.pathname.match(/^\/api\/queue\/triggers\/[^/]+\/fire$/) && req.method === 'POST') {
    const triggerId = url.pathname.split('/')[4];
    const task = await queueSystem.triggerEngine.manuallyFireTrigger(triggerId);

    return new Response(JSON.stringify({ success: !!task, task }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ==================== QUEUE STATS ROUTES ====================

  // GET /api/queue/stats - Get queue statistics
  if (url.pathname === '/api/queue/stats' && req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId');
    const taskQueueStats = queueSystem.taskQueue.getStats(sessionId || undefined);
    const workerStats = queueSystem.workerPool.getStats();
    const healthMetrics = queueSystem.healthMonitor.getMetrics();
    const aiStats = queueSystem.aiIntegration.getUsageStats();

    return new Response(
      JSON.stringify({
        taskQueue: taskQueueStats,
        workers: workerStats,
        health: healthMetrics,
        ai: aiStats,
        timestamp: Date.now(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // GET /api/queue/health - Get system health
  if (url.pathname === '/api/queue/health' && req.method === 'GET') {
    const healthMetrics = queueSystem.healthMonitor.getMetrics();
    const healthScore = queueSystem.healthMonitor.getHealthScore();

    return new Response(
      JSON.stringify({
        ...healthMetrics,
        healthScore,
        timestamp: Date.now(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // ==================== QUEUE CONTROL ROUTES ====================

  // POST /api/queue/start - Start the queue
  if (url.pathname === '/api/queue/start' && req.method === 'POST') {
    queueSystem.taskQueue.start();
    queueSystem.workerPool.start();
    queueSystem.triggerEngine.start();
    queueSystem.healthMonitor.start();

    return new Response(JSON.stringify({ success: true, message: 'Queue started' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/queue/stop - Stop the queue
  if (url.pathname === '/api/queue/stop' && req.method === 'POST') {
    queueSystem.taskQueue.stop();
    await queueSystem.workerPool.stop();
    queueSystem.triggerEngine.stop();
    queueSystem.healthMonitor.stop();

    return new Response(JSON.stringify({ success: true, message: 'Queue stopped' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/queue/reset - Reset the queue
  if (url.pathname === '/api/queue/reset' && req.method === 'POST') {
    queueSystem.taskQueue.stop();
    await queueSystem.workerPool.stop();
    queueSystem.triggerEngine.stop();
    queueSystem.healthMonitor.stop();

    queueSystem.taskQueue.start();
    queueSystem.workerPool.start();
    queueSystem.triggerEngine.start();
    queueSystem.healthMonitor.start();

    return new Response(JSON.stringify({ success: true, message: 'Queue reset' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Route not handled by this module
  return undefined;
}
