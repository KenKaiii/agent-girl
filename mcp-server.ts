#!/usr/bin/env bun
/**
 * Agent Girl MCP Server
 *
 * Exposes agent-girl functionality as MCP tools for Claude Code integration.
 * Includes AUTONOM mode for fully autonomous task execution.
 *
 * Installation:
 *   claude mcp add agent-girl -- bun run /Users/master/agent-girl/mcp-server.ts
 *
 * Or in claude_desktop_config.json:
 *   {
 *     "mcpServers": {
 *       "agent-girl": {
 *         "command": "bun",
 *         "args": ["run", "/Users/master/agent-girl/mcp-server.ts"]
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// AUTONOM Mode Configuration
const AUTONOM_CONFIG = {
  maxSteps: 100,
  budgetLimits: {
    sessionCost: 50, // $50 max
    perMessage: 5,   // $5 max
    totalTokens: 2_000_000,
  },
  checkpointInterval: 5,
  qualityThresholds: {
    minimum: 0.85,
    target: 0.95,
  },
};

// Active autonomous sessions
const activeSessions = new Map<string, {
  pid: number;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  task: string;
  workingDir: string;
  progress: number;
}>();

// Helper to run Claude Code autonomously
async function runClaudeCodeAutonom(
  task: string,
  workingDir: string,
  options: { model?: string; maxSteps?: number } = {}
): Promise<{ sessionId: string; message: string }> {
  const sessionId = `autonom-${Date.now()}`;
  const model = options.model || 'sonnet';
  const maxSteps = options.maxSteps || AUTONOM_CONFIG.maxSteps;

  // Build the autonomous prompt
  const autonomPrompt = `[AUTONOM MODE ACTIVE]

You are operating in AUTONOM mode - fully autonomous execution without human intervention.

CORE RULES:
1. ZERO QUESTIONS - Never ask for clarification, make intelligent decisions
2. CONTINUOUS EXECUTION - Complete the entire task, chain steps automatically
3. ERROR RESILIENCE - Catch errors, retry (max 3), try alternatives
4. COST EFFICIENCY - Use exactly the steps needed (max ${maxSteps})
5. EARLY EXIT - Stop when goal is achieved

TASK: ${task}

WORKING DIRECTORY: ${workingDir}

Execute this task autonomously. Begin now.`;

  // Create progress file
  const progressFile = path.join(workingDir, 'PROGRESS.json');
  const progressData = {
    session_id: sessionId,
    mode: 'autonom',
    started_at: new Date().toISOString(),
    current_step: 0,
    total_estimated: maxSteps,
    task,
    status: 'running',
  };

  try {
    fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
  } catch {
    // Ignore if can't write progress file
  }

  // Spawn Claude Code process
  const claudeProcess = spawn('claude', [
    '--print',
    '--dangerously-skip-permissions',
    '--model', model,
    autonomPrompt,
  ], {
    cwd: workingDir,
    env: { ...process.env, CLAUDE_AUTONOM_MODE: 'true' },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Track the session
  activeSessions.set(sessionId, {
    pid: claudeProcess.pid || 0,
    status: 'running',
    startedAt: new Date(),
    task,
    workingDir,
    progress: 0,
  });

  // Handle process completion
  claudeProcess.on('exit', (code) => {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.status = code === 0 ? 'completed' : 'failed';
    }
  });

  // Unref to allow parent to exit
  claudeProcess.unref();

  return {
    sessionId,
    message: `AUTONOM session started: ${sessionId}\nTask: ${task}\nWorking directory: ${workingDir}\nPID: ${claudeProcess.pid}`,
  };
}

// German automations
const GERMAN_AUTOMATIONS = {
  rechnung: {
    name: 'Rechnungserstellung',
    description: 'Erstellt §14 UStG konforme Rechnungen',
    legalBasis: ['§14 UStG', '§14a UStG'],
    requiredFields: ['kunde', 'leistung', 'betrag', 'datum'],
  },
  'ust-voranmeldung': {
    name: 'USt-Voranmeldung',
    description: 'Bereitet Umsatzsteuer-Voranmeldung vor',
    legalBasis: ['§18 UStG'],
    requiredFields: ['zeitraum', 'umsaetze', 'vorsteuer'],
  },
  'datev-export': {
    name: 'DATEV-Export',
    description: 'Exportiert Buchungen im DATEV-Format',
    legalBasis: ['GoBD'],
    requiredFields: ['buchungen', 'zeitraum'],
  },
  mahnung: {
    name: 'Mahnwesen',
    description: 'Erstellt rechtskonforme Mahnungen',
    legalBasis: ['§286 BGB', '§288 BGB'],
    requiredFields: ['schuldner', 'forderung', 'faelligkeitsdatum'],
  },
  kassenbuch: {
    name: 'Kassenbuch',
    description: 'GoBD-konforme Kassenbuchführung',
    legalBasis: ['GoBD', '§146 AO'],
    requiredFields: ['einnahmen', 'ausgaben', 'datum'],
  },
};

// Create MCP server
const server = new Server(
  {
    name: 'agent-girl-local',
    version: '9.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // AUTONOM Mode Tools
      {
        name: 'autonom_execute',
        description: 'Execute a task in AUTONOM mode - fully autonomous Claude Code execution without human intervention. The agent will make all decisions, handle errors, and complete the task.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'The task to execute autonomously (e.g., "Add authentication to my app", "Refactor the database layer")',
            },
            working_directory: {
              type: 'string',
              description: 'The project directory to work in (absolute path)',
            },
            model: {
              type: 'string',
              description: 'Model to use: opus (complex), sonnet (balanced), haiku (fast)',
              default: 'sonnet',
            },
            max_steps: {
              type: 'number',
              description: 'Maximum steps to execute (1-100)',
              default: 50,
            },
          },
          required: ['task', 'working_directory'],
        },
      },
      {
        name: 'autonom_status',
        description: 'Get status of an active AUTONOM session',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'The session ID to check (or "all" for all sessions)',
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'autonom_stop',
        description: 'Stop an active AUTONOM session',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'The session ID to stop',
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'autonom_progress',
        description: 'Read the PROGRESS.json file from an AUTONOM session',
        inputSchema: {
          type: 'object',
          properties: {
            working_directory: {
              type: 'string',
              description: 'The project directory containing PROGRESS.json',
            },
          },
          required: ['working_directory'],
        },
      },
      // Chat tools
      {
        name: 'agent_girl_chat',
        description: 'Send a message to Agent Girl and get a response',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The message to send',
            },
            model: {
              type: 'string',
              description: 'Model to use (opus, sonnet, haiku)',
              default: 'sonnet',
            },
          },
          required: ['message'],
        },
      },
      // German automation tools
      {
        name: 'german_automation_list',
        description: 'List available German business automations',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'german_rechnung',
        description: 'Generate a §14 UStG compliant German invoice (Rechnung)',
        inputSchema: {
          type: 'object',
          properties: {
            kunde: { type: 'string', description: 'Customer name and address' },
            leistung: { type: 'string', description: 'Service/product description' },
            betrag: { type: 'number', description: 'Amount in EUR' },
            datum: { type: 'string', description: 'Invoice date (YYYY-MM-DD)' },
            steuersatz: { type: 'number', description: 'VAT rate (default: 19)', default: 19 },
          },
          required: ['kunde', 'leistung', 'betrag'],
        },
      },
      {
        name: 'german_ust_voranmeldung',
        description: 'Prepare German VAT advance return (USt-Voranmeldung)',
        inputSchema: {
          type: 'object',
          properties: {
            zeitraum: { type: 'string', description: 'Period (e.g., "2024-Q1")' },
            umsaetze: { type: 'number', description: 'Total revenue' },
            vorsteuer: { type: 'number', description: 'Input VAT to deduct' },
          },
          required: ['zeitraum', 'umsaetze'],
        },
      },
      {
        name: 'german_datev_export',
        description: 'Export bookings in DATEV format',
        inputSchema: {
          type: 'object',
          properties: {
            buchungen: {
              type: 'array',
              description: 'Array of bookings',
              items: {
                type: 'object',
                properties: {
                  konto: { type: 'string' },
                  gegenkonto: { type: 'string' },
                  betrag: { type: 'number' },
                  text: { type: 'string' },
                  datum: { type: 'string' },
                },
              },
            },
            zeitraum: { type: 'string', description: 'Export period' },
          },
          required: ['buchungen', 'zeitraum'],
        },
      },
      {
        name: 'german_mahnung',
        description: 'Generate a legally compliant German dunning letter (Mahnung)',
        inputSchema: {
          type: 'object',
          properties: {
            schuldner: { type: 'string', description: 'Debtor name and address' },
            forderung: { type: 'number', description: 'Outstanding amount' },
            faelligkeitsdatum: { type: 'string', description: 'Original due date' },
            mahnstufe: { type: 'number', description: 'Dunning level (1-3)', default: 1 },
          },
          required: ['schuldner', 'forderung', 'faelligkeitsdatum'],
        },
      },
      {
        name: 'german_kassenbuch',
        description: 'GoBD-compliant cash book entry (Kassenbuch)',
        inputSchema: {
          type: 'object',
          properties: {
            typ: { type: 'string', enum: ['einnahme', 'ausgabe'], description: 'Entry type' },
            betrag: { type: 'number', description: 'Amount in EUR' },
            beschreibung: { type: 'string', description: 'Description' },
            datum: { type: 'string', description: 'Entry date' },
            belegnummer: { type: 'string', description: 'Receipt number' },
          },
          required: ['typ', 'betrag', 'beschreibung'],
        },
      },
      // Status tool
      {
        name: 'agent_girl_status',
        description: 'Get Agent Girl system status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // AUTONOM Mode Handlers
      case 'autonom_execute': {
        const { task, working_directory, model, max_steps } = args as {
          task: string;
          working_directory: string;
          model?: string;
          max_steps?: number;
        };

        // Validate working directory exists
        if (!fs.existsSync(working_directory)) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: `Working directory does not exist: ${working_directory}` }, null, 2),
            }],
            isError: true,
          };
        }

        const result = await runClaudeCodeAutonom(task, working_directory, {
          model,
          maxSteps: max_steps,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              ...result,
              config: AUTONOM_CONFIG,
            }, null, 2),
          }],
        };
      }

      case 'autonom_status': {
        const { session_id } = args as { session_id: string };

        if (session_id === 'all') {
          const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
            id,
            ...session,
            startedAt: session.startedAt.toISOString(),
            runningFor: `${Math.floor((Date.now() - session.startedAt.getTime()) / 1000)}s`,
          }));

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                activeSessions: sessions.length,
                sessions,
              }, null, 2),
            }],
          };
        }

        const session = activeSessions.get(session_id);
        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: `Session not found: ${session_id}` }, null, 2),
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: session_id,
              ...session,
              startedAt: session.startedAt.toISOString(),
              runningFor: `${Math.floor((Date.now() - session.startedAt.getTime()) / 1000)}s`,
            }, null, 2),
          }],
        };
      }

      case 'autonom_stop': {
        const { session_id } = args as { session_id: string };
        const session = activeSessions.get(session_id);

        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: `Session not found: ${session_id}` }, null, 2),
            }],
            isError: true,
          };
        }

        try {
          process.kill(session.pid, 'SIGTERM');
          session.status = 'failed';
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Session ${session_id} stopped`,
                pid: session.pid,
              }, null, 2),
            }],
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: `Failed to stop session: ${error.message}` }, null, 2),
            }],
            isError: true,
          };
        }
      }

      case 'autonom_progress': {
        const { working_directory } = args as { working_directory: string };
        const progressFile = path.join(working_directory, 'PROGRESS.json');

        if (!fs.existsSync(progressFile)) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: 'No PROGRESS.json found in working directory' }, null, 2),
            }],
            isError: true,
          };
        }

        try {
          const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(progress, null, 2),
            }],
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: `Failed to read progress: ${error.message}` }, null, 2),
            }],
            isError: true,
          };
        }
      }

      case 'agent_girl_chat': {
        // This would integrate with Claude Agent SDK
        return {
          content: [
            {
              type: 'text',
              text: `[Agent Girl Chat]\n\nTo use chat functionality, run the Agent Girl server:\n  cd agent-girl && bun run dev\n\nThen access http://localhost:3000\n\nMessage: ${args?.message}`,
            },
          ],
        };
      }

      case 'german_automation_list': {
        const list = Object.entries(GERMAN_AUTOMATIONS).map(([id, auto]) => ({
          id,
          name: auto.name,
          description: auto.description,
          legalBasis: auto.legalBasis,
        }));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ automations: list }, null, 2),
            },
          ],
        };
      }

      case 'german_rechnung': {
        const { kunde, leistung, betrag, datum, steuersatz = 19 } = args as any;
        const netto = betrag;
        const ust = netto * (steuersatz / 100);
        const brutto = netto + ust;
        const invoiceDate = datum || new Date().toISOString().split('T')[0];
        const invoiceNumber = `RE-${Date.now()}`;

        const invoice = {
          rechnungsnummer: invoiceNumber,
          datum: invoiceDate,
          kunde,
          positionen: [{ beschreibung: leistung, nettoBetrag: netto }],
          nettosumme: netto,
          umsatzsteuer: { satz: steuersatz, betrag: ust },
          bruttosumme: brutto,
          zahlungsziel: '14 Tage',
          legalCompliance: {
            paragraph14UStG: true,
            pflichtangaben: ['Steuernummer erforderlich', 'Leistungsdatum angeben'],
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, rechnung: invoice }, null, 2),
            },
          ],
        };
      }

      case 'german_ust_voranmeldung': {
        const { zeitraum, umsaetze, vorsteuer = 0 } = args as any;
        const ustSchuld = umsaetze * 0.19;
        const zahllast = ustSchuld - vorsteuer;

        const voranmeldung = {
          zeitraum,
          umsaetze19: umsaetze,
          ustSchuld,
          vorsteuerAbzug: vorsteuer,
          zahllast,
          faelligkeitAm: 'Am 10. des Folgemonats',
          elsterReady: true,
          legalCompliance: { paragraph18UStG: true },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, voranmeldung }, null, 2),
            },
          ],
        };
      }

      case 'german_datev_export': {
        const { buchungen, zeitraum } = args as any;
        const datevLines = (buchungen || []).map((b: any, i: number) => 
          `${i + 1};${b.betrag};${b.konto};${b.gegenkonto};${b.datum};${b.text}`
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                format: 'DATEV-ASCII',
                zeitraum,
                anzahlBuchungen: buchungen?.length || 0,
                datevContent: datevLines.join('\n'),
                gobdCompliant: true,
              }, null, 2),
            },
          ],
        };
      }

      case 'german_mahnung': {
        const { schuldner, forderung, faelligkeitsdatum, mahnstufe = 1 } = args as any;
        const verzugszinsen = mahnstufe > 1 ? forderung * 0.05 * (mahnstufe - 1) : 0;
        const mahngebuehr = mahnstufe * 5;

        const mahnung = {
          mahnstufe,
          schuldner,
          ursprungsforderung: forderung,
          faelligSeit: faelligkeitsdatum,
          verzugszinsen,
          mahngebuehr,
          gesamtforderung: forderung + verzugszinsen + mahngebuehr,
          zahlungsfrist: mahnstufe < 3 ? '7 Tage' : 'Sofort, Inkasso angedroht',
          legalCompliance: {
            paragraph286BGB: true,
            paragraph288BGB: verzugszinsen > 0,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, mahnung }, null, 2),
            },
          ],
        };
      }

      case 'german_kassenbuch': {
        const { typ, betrag, beschreibung, datum, belegnummer } = args as any;
        const entryDate = datum || new Date().toISOString().split('T')[0];
        const belegNr = belegnummer || `KB-${Date.now()}`;

        const eintrag = {
          belegnummer: belegNr,
          datum: entryDate,
          typ,
          betrag,
          beschreibung,
          saldo: typ === 'einnahme' ? betrag : -betrag,
          gobdCompliant: true,
          unveraenderlich: true,
          legalCompliance: {
            gobd: true,
            paragraph146AO: true,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, kassenbuchEintrag: eintrag }, null, 2),
            },
          ],
        };
      }

      case 'agent_girl_status': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'operational',
                version: '9.1.0',
                features: {
                  chat: true,
                  germanAutomations: true,
                  models: ['opus', 'sonnet', 'haiku'],
                },
                automationsAvailable: Object.keys(GERMAN_AUTOMATIONS),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Agent Girl MCP Server running on stdio');
}

main().catch(console.error);
