/**
 * Project Routes
 * API endpoints for project management
 */

import { projectRegistry, type ProjectType, type ProjectStatus } from '../projectRegistry';

export async function handleProjectRoutes(req: Request, url: URL): Promise<Response | null> {
  const method = req.method;
  const path = url.pathname;

  // GET /api/projects - List all projects
  if (path === '/api/projects' && method === 'GET') {
    const type = url.searchParams.get('type') as ProjectType | null;
    const status = url.searchParams.get('status') as ProjectStatus | null;
    const limit = url.searchParams.get('limit');
    const sessionId = url.searchParams.get('sessionId');

    try {
      let projects;
      if (sessionId) {
        projects = projectRegistry.getProjectsBySession(sessionId);
      } else {
        projects = projectRegistry.getAllProjects({
          type: type || undefined,
          status: status || undefined,
          limit: limit ? parseInt(limit) : undefined,
        });
      }

      return new Response(JSON.stringify({ projects }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/projects/orphaned - List orphaned projects
  if (path === '/api/projects/orphaned' && method === 'GET') {
    try {
      const projects = projectRegistry.getOrphanedProjects();
      return new Response(JSON.stringify({ projects }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/projects/discover - Scan and discover projects
  if (path === '/api/projects/discover' && method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const baseDir = body.baseDir as string | undefined;

      const result = await projectRegistry.discoverProjects(baseDir);

      return new Response(JSON.stringify({
        discovered: result.discovered.length,
        projects: result.discovered,
        errors: result.errors,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/projects/cleanup - Remove missing projects
  if (path === '/api/projects/cleanup' && method === 'POST') {
    try {
      const result = await projectRegistry.cleanupMissing();

      return new Response(JSON.stringify({
        removed: result.removed,
        errors: result.errors,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/projects/:id - Get single project
  const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch && method === 'GET') {
    const projectId = projectMatch[1];

    try {
      const project = projectRegistry.getProject(projectId);

      if (!project) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ project }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/projects - Register new project
  if (path === '/api/projects' && method === 'POST') {
    try {
      const body = await req.json();

      if (!body.name || !body.type || !body.path) {
        return new Response(JSON.stringify({ error: 'name, type, and path are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const project = projectRegistry.registerProject({
        sessionId: body.sessionId,
        name: body.name,
        type: body.type,
        path: body.path,
        sourceUrl: body.sourceUrl,
        metadata: body.metadata,
      });

      return new Response(JSON.stringify({ project }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/projects/:id/duplicate - Duplicate a project
  const duplicateMatch = path.match(/^\/api\/projects\/([^/]+)\/duplicate$/);
  if (duplicateMatch && method === 'POST') {
    const projectId = duplicateMatch[1];

    try {
      const body = await req.json().catch(() => ({}));
      const newName = body.name as string | undefined;
      const targetSessionId = body.sessionId as string | undefined;

      const duplicated = await projectRegistry.duplicateProject(projectId, newName, targetSessionId);

      if (!duplicated) {
        return new Response(JSON.stringify({ error: 'Project not found or duplication failed' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ project: duplicated }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/projects/:id/link - Link project to session
  const linkMatch = path.match(/^\/api\/projects\/([^/]+)\/link$/);
  if (linkMatch && method === 'POST') {
    const projectId = linkMatch[1];

    try {
      const body = await req.json();

      if (!body.sessionId) {
        return new Response(JSON.stringify({ error: 'sessionId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const success = projectRegistry.linkToSession(projectId, body.sessionId);

      if (!success) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/projects/:id/unlink - Unlink project from session
  const unlinkMatch = path.match(/^\/api\/projects\/([^/]+)\/unlink$/);
  if (unlinkMatch && method === 'POST') {
    const projectId = unlinkMatch[1];

    try {
      const success = projectRegistry.unlinkFromSession(projectId);

      if (!success) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // PATCH /api/projects/:id/status - Update project status
  const statusMatch = path.match(/^\/api\/projects\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const projectId = statusMatch[1];

    try {
      const body = await req.json();

      if (!body.status) {
        return new Response(JSON.stringify({ error: 'status is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const success = projectRegistry.updateStatus(
        projectId,
        body.status,
        body.previewUrl,
        body.previewPort
      );

      if (!success) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // DELETE /api/projects/:id - Delete project
  const deleteMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const projectId = deleteMatch[1];

    try {
      const deleteFiles = url.searchParams.get('deleteFiles') === 'true';
      const success = await projectRegistry.deleteProject(projectId, deleteFiles);

      if (!success) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/projects/auto-match - Auto-match projects for a session
  if (path === '/api/projects/auto-match' && method === 'POST') {
    try {
      const body = await req.json();

      if (!body.sessionId || !body.workingDirectory) {
        return new Response(JSON.stringify({ error: 'sessionId and workingDirectory are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const matched = projectRegistry.autoMatchForSession(body.sessionId, body.workingDirectory);

      return new Response(JSON.stringify({
        matched: matched.length,
        projects: matched,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return null;
}
