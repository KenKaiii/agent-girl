/**
 * Unified API Routes
 * Central API for all unified platform features
 */

import type { ServerWebSocket } from 'bun';
import { complianceController } from '../compliance/ComplianceController';
import { createWorkflowEngine } from '../workflows/index';
import { AutonomousMonitoring } from '../monitoring/index';
import { ExecutionBroker } from '../hybrid-execution/ExecutionBroker';
import { OrchestrationEngine } from '../orchestration/index';
import { AgentCoordinator } from '../agents-extended/AgentCoordinator';
import { AgentMemory } from '../agents-extended/AgentMemory';
import { LearningEngine } from '../agents-extended/LearningEngine';
import { TaskRouter } from '../agents-extended/TaskRouter';

// Initialize all systems
const workflowEngine = createWorkflowEngine();
const monitoring = new AutonomousMonitoring();
const orchestration = new OrchestrationEngine();
const agentCoordinator = new AgentCoordinator('mesh');
const agentMemory = new AgentMemory('./data/agent-memory.db');
const learningEngine = new LearningEngine(agentMemory);
const taskRouter = new TaskRouter(agentCoordinator, learningEngine);

// Initialize hybrid execution broker
const executionBroker = new ExecutionBroker({
  localCapacity: {
    maxConcurrentTasks: 4,
    cpuCores: 4,
    memoryGb: 16,
    hasGpu: false,
  },
  cloudConfig: {
    enabled: true,
    provider: 'aws',
    region: 'us-east-1',
    costThreshold: 1.0,
  },
  complianceRules: {
    enforceDataSovereignty: true,
    strictMode: false,
  },
  optimization: {
    preferLocal: true,
    costWeight: 0.3,
    performanceWeight: 0.4,
    complianceWeight: 0.3,
  },
});

/**
 * Register unified API routes
 */
export function registerUnifiedRoutes(server: any) {

  // ========================================
  // WORKFLOW ENGINE ROUTES
  // ========================================

  server.post('/api/unified/workflow/execute', async (req: Request) => {
    try {
      const body = await req.json();
      const { prompt, context } = body;

      const result = await workflowEngine.executePrompt(prompt, context);

      return Response.json({
        success: true,
        workflowId: result.workflowId,
        status: result.status,
        result: result,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/workflow/:workflowId', async (req: Request) => {
    const url = new URL(req.url);
    const workflowId = url.pathname.split('/').pop();

    try {
      const status = workflowEngine.getExecutionStatus(workflowId!);
      return Response.json({
        success: true,
        workflow: status,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 404 });
    }
  });

  server.post('/api/unified/workflow/schedule', async (req: Request) => {
    try {
      const body = await req.json();
      const { workflowId, schedule } = body;

      await workflowEngine.startScheduler();
      await workflowEngine.scheduleWorkflow(workflowId, schedule);

      return Response.json({
        success: true,
        message: 'Workflow scheduled successfully',
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  // ========================================
  // COMPLIANCE ROUTES
  // ========================================

  server.post('/api/unified/compliance/data-access', async (req: Request) => {
    try {
      const body = await req.json();
      const { dataSubjectId } = body;

      const data = await complianceController.handleDataSubjectAccessRequest(dataSubjectId);

      return Response.json({
        success: true,
        data,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/compliance/data-erasure', async (req: Request) => {
    try {
      const body = await req.json();
      const { dataSubjectId } = body;

      await complianceController.handleDataErasureRequest(dataSubjectId);

      return Response.json({
        success: true,
        message: 'Data erased successfully',
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/compliance/consent', async (req: Request) => {
    try {
      const body = await req.json();
      const { dataSubjectId, purposes } = body;

      await complianceController.recordConsent(dataSubjectId, purposes);

      return Response.json({
        success: true,
        message: 'Consent recorded successfully',
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/compliance/audit-trail', async (req: Request) => {
    try {
      const url = new URL(req.url);
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const action = url.searchParams.get('action');

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (action) filters.action = action;

      const auditTrail = complianceController.getAuditTrail(filters);

      return Response.json({
        success: true,
        auditTrail,
        count: auditTrail.length,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  // ========================================
  // MONITORING ROUTES
  // ========================================

  server.get('/api/unified/monitoring/health', async (req: Request) => {
    try {
      const health = monitoring.health.getSystemOverview();

      return Response.json({
        success: true,
        health,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/monitoring/metrics', async (req: Request) => {
    try {
      const metricsMap = monitoring.performance.getAllMetrics();
      const metrics = Array.from(metricsMap.entries()).map(([component, data]) => ({
        component,
        ...data,
      }));

      return Response.json({
        success: true,
        metrics,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/monitoring/alerts', async (req: Request) => {
    try {
      const alerts = monitoring.alerts.getActiveAlerts();

      return Response.json({
        success: true,
        alerts,
        count: alerts.length,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  // ========================================
  // HYBRID EXECUTION ROUTES
  // ========================================

  server.post('/api/unified/execute', async (req: Request) => {
    try {
      const body = await req.json();
      const task = body;

      const result = await executionBroker.execute(task);

      return Response.json({
        success: true,
        result,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/execute/metrics', async (req: Request) => {
    try {
      const metrics = executionBroker.getMetrics();

      return Response.json({
        success: true,
        metrics,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  // ========================================
  // AGENT COORDINATION ROUTES
  // ========================================

  server.post('/api/unified/agents/route-task', async (req: Request) => {
    try {
      const body = await req.json();
      const task = body;

      const decision = taskRouter.routeTask(task);

      return Response.json({
        success: true,
        decision,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/agents/status', async (req: Request) => {
    try {
      const agents = agentCoordinator.getAgents();

      return Response.json({
        success: true,
        agents: agents.map(agent => ({
          id: agent.agentId,
          type: agent.agentType,
          status: agent.status,
          capabilities: agent.capabilities,
        })),
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/agents/feedback', async (req: Request) => {
    try {
      const body = await req.json();

      learningEngine.recordFeedback(body);

      return Response.json({
        success: true,
        message: 'Feedback recorded successfully',
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  // ========================================
  // ORCHESTRATION ROUTES
  // ========================================

  server.post('/api/unified/orchestration/workflow', async (req: Request) => {
    try {
      const body = await req.json();
      const { nodes, edges, executor } = body;

      const workflowId = await orchestration.registerWorkflow(
        nodes,
        edges,
        executor
      );

      return Response.json({
        success: true,
        workflowId,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/orchestration/execute/:workflowId', async (req: Request) => {
    const url = new URL(req.url);
    const workflowId = url.pathname.split('/').pop();

    try {
      const body = await req.json();
      const { input, options } = body;

      const result = await orchestration.executeWorkflow(workflowId!, input, options);

      return Response.json({
        success: true,
        result,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/orchestration/templates', async (req: Request) => {
    try {
      const templates = orchestration.listTemplates();

      return Response.json({
        success: true,
        templates: templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
        })),
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  // ========================================
  // GERMAN AUTOMATIONS ROUTES
  // ========================================

  server.post('/api/unified/automations/german/rechnung', async (req: Request) => {
    try {
      const { rechnungserstellung } = await import('../automations/german-entrepreneur/finanzen/01-rechnungserstellung');
      const body = await req.json();

      const result = await rechnungserstellung.execute(body);

      return Response.json({
        success: result.success,
        data: result.data,
        warnings: result.warnings,
        legalCompliance: result.legalCompliance,
        error: result.error,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/automations/german/ust-voranmeldung', async (req: Request) => {
    try {
      const { ustVoranmeldung } = await import('../automations/german-entrepreneur/finanzen/02-ust-voranmeldung');
      const body = await req.json();

      const result = await ustVoranmeldung.execute(body);

      return Response.json({
        success: result.success,
        data: result.data,
        warnings: result.warnings,
        legalCompliance: result.legalCompliance,
        error: result.error,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/automations/german/datev-export', async (req: Request) => {
    try {
      const { datevExport } = await import('../automations/german-entrepreneur/finanzen/03-datev-export');
      const body = await req.json();

      const result = await datevExport.execute(body);

      return Response.json({
        success: result.success,
        data: result.data,
        warnings: result.warnings,
        legalCompliance: result.legalCompliance,
        error: result.error,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/automations/german/mahnung', async (req: Request) => {
    try {
      const { mahnwesen } = await import('../automations/german-entrepreneur/finanzen/04-mahnwesen');
      const body = await req.json();

      const result = await mahnwesen.execute(body);

      return Response.json({
        success: result.success,
        data: result.data,
        warnings: result.warnings,
        legalCompliance: result.legalCompliance,
        error: result.error,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.post('/api/unified/automations/german/kassenbuch', async (req: Request) => {
    try {
      const { kassenbuch } = await import('../automations/german-entrepreneur/finanzen/05-kassenbuch');
      const body = await req.json();

      const result = await kassenbuch.execute(body);

      return Response.json({
        success: result.success,
        data: result.data,
        warnings: result.warnings,
        legalCompliance: result.legalCompliance,
        error: result.error,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/automations/german/list', async (req: Request) => {
    return Response.json({
      success: true,
      automations: [
        {
          id: 'rechnung',
          name: 'Rechnungserstellung',
          description: 'Erstellt §14 UStG konforme Rechnungen',
          endpoint: '/api/unified/automations/german/rechnung',
          legalBasis: ['§14 UStG', '§14a UStG'],
        },
        {
          id: 'ust-voranmeldung',
          name: 'USt-Voranmeldung',
          description: 'Bereitet Umsatzsteuer-Voranmeldung vor',
          endpoint: '/api/unified/automations/german/ust-voranmeldung',
          legalBasis: ['§18 UStG'],
        },
        {
          id: 'datev-export',
          name: 'DATEV-Export',
          description: 'Exportiert Buchungen im DATEV-Format',
          endpoint: '/api/unified/automations/german/datev-export',
          legalBasis: ['GoBD'],
        },
        {
          id: 'mahnung',
          name: 'Mahnwesen',
          description: 'Erstellt rechtskonforme Mahnungen',
          endpoint: '/api/unified/automations/german/mahnung',
          legalBasis: ['§286 BGB', '§288 BGB'],
        },
        {
          id: 'kassenbuch',
          name: 'Kassenbuch',
          description: 'GoBD-konforme Kassenbuchführung',
          endpoint: '/api/unified/automations/german/kassenbuch',
          legalBasis: ['GoBD', '§146 AO'],
        },
      ],
    });
  });

  // ========================================
  // AGENT POOL STATUS
  // ========================================

  server.get('/api/unified/agents/pool', async (req: Request) => {
    try {
      const agents = agentCoordinator.getAgents();
      const stats = taskRouter.getStatistics();

      return Response.json({
        success: true,
        pool: {
          totalAgents: agents.length,
          activeAgents: agents.filter(a => a.status === 'busy').length,
          idleAgents: agents.filter(a => a.status === 'idle').length,
          agents: agents.map(agent => ({
            id: agent.agentId,
            type: agent.agentType,
            status: agent.status,
            workload: agent.workload,
            capabilities: agent.capabilities,
            performance: agent.performance,
          })),
        },
        routingStats: stats,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  server.get('/api/unified/agents/stats', async (req: Request) => {
    try {
      const stats = taskRouter.getStatistics();
      const agents = agentCoordinator.getAgents();

      return Response.json({
        success: true,
        statistics: {
          routing: stats,
          agents: {
            total: agents.length,
            byType: agents.reduce((acc, a) => {
              acc[a.agentType] = (acc[a.agentType] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            byStatus: agents.reduce((acc, a) => {
              acc[a.status] = (acc[a.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          },
        },
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });

  // ========================================
  // SYSTEM STATUS
  // ========================================

  server.get('/api/unified/status', async (req: Request) => {
    try {
      const healthOverview = monitoring.health.getSystemOverview();
      const status = {
        system: 'operational',
        components: {
          workflows: 'operational',
          compliance: 'operational',
          monitoring: healthOverview.overallStatus,
          hybridExecution: 'operational',
          agents: 'operational',
          orchestration: 'operational',
        },
        uptime: process.uptime(),
        version: '1.0.0',
        features: {
          autonomousOperations: true,
          promptToWorkflow: true,
          complianceReady: true,
          hybridExecution: true,
          multiAgent: true,
          selfHealing: true,
        },
        germanAutomations: {
          available: true,
          count: 5,
          list: ['rechnung', 'ust-voranmeldung', 'datev-export', 'mahnung', 'kassenbuch'],
        },
      };

      return Response.json({
        success: true,
        status,
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
  });
}

// Start monitoring system
monitoring.start({
  components: ['workflows', 'compliance', 'agents', 'orchestration'],
  healthCheckInterval: 5000,
  performanceTrackingEnabled: true,
  autoScalingEnabled: true,
  alertingEnabled: true,
  selfHealingEnabled: true,
});

// Export for use in other modules
export {
  workflowEngine,
  monitoring,
  executionBroker,
  orchestration,
  agentCoordinator,
  agentMemory,
  learningEngine,
  taskRouter,
};
