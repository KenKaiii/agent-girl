#!/usr/bin/env bun
/**
 * Agent Girl CLI - Terminal-based chat interface
 *
 * Usage:
 *   bun run agent-cli.ts chat "Your message here"
 *   bun run agent-cli.ts interactive
 *   bun run agent-cli.ts automations list
 *   bun run agent-cli.ts automations run rechnung --data '{...}'
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import * as readline from 'readline';
import { homedir } from 'os';
import { join } from 'path';

const args = process.argv.slice(2);
const command = args[0];

// German automations registry
const GERMAN_AUTOMATIONS = {
  rechnung: {
    name: 'Rechnungserstellung',
    description: 'Erstellt §14 UStG konforme Rechnungen',
    legalBasis: ['§14 UStG', '§14a UStG'],
  },
  'ust-voranmeldung': {
    name: 'USt-Voranmeldung',
    description: 'Bereitet Umsatzsteuer-Voranmeldung vor',
    legalBasis: ['§18 UStG'],
  },
  'datev-export': {
    name: 'DATEV-Export',
    description: 'Exportiert Buchungen im DATEV-Format',
    legalBasis: ['GoBD'],
  },
  mahnung: {
    name: 'Mahnwesen',
    description: 'Erstellt rechtskonforme Mahnungen',
    legalBasis: ['§286 BGB', '§288 BGB'],
  },
  kassenbuch: {
    name: 'Kassenbuch',
    description: 'GoBD-konforme Kassenbuchführung',
    legalBasis: ['GoBD', '§146 AO'],
  },
};

interface QueryMessage {
  type: string;
  content?: string;
  text?: string;
  subtype?: string;
}

async function chat(message: string): Promise<void> {
  console.log('\n🤖 Agent Girl CLI\n');
  console.log(`You: ${message}\n`);
  console.log('Claude: ');

  try {
    const result = query({
      prompt: message,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        maxTurns: 10,
        permissionMode: 'bypassPermissions',
      } as Record<string, unknown>
    });

    for await (const msg of result) {
      const m = msg as QueryMessage;
      // Handle assistant text output
      if (m.type === 'assistant' && m.content) {
        // Content can be array of content blocks
        const content = m.content as unknown;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && block.text) {
              process.stdout.write(block.text);
            }
          }
        } else if (typeof content === 'string') {
          process.stdout.write(content);
        }
      }
      // Handle result message with final text
      if (m.type === 'result' && m.text) {
        process.stdout.write(m.text);
      }
    }

    console.log('\n');
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

async function interactive(): Promise<void> {
  console.log('\n🤖 Agent Girl Interactive Mode');
  console.log('Type your message and press Enter. Type "exit" to quit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }

      if (!input.trim()) {
        prompt();
        return;
      }

      console.log('\nClaude: ');
      try {
        const result = query({
          prompt: input,
          options: {
            model: 'claude-sonnet-4-5-20250929',
            maxTurns: 10,
            permissionMode: 'bypassPermissions',
          } as Record<string, unknown>
        });

        for await (const msg of result) {
          const m = msg as QueryMessage;
          if (m.type === 'assistant' && m.content) {
            const content = m.content as unknown;
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block.type === 'text' && block.text) {
                  process.stdout.write(block.text);
                }
              }
            } else if (typeof content === 'string') {
              process.stdout.write(content);
            }
          }
          if (m.type === 'result' && m.text) {
            process.stdout.write(m.text);
          }
        }

        console.log('\n');
      } catch (error: unknown) {
        const err = error as Error;
        console.error(`\n❌ Error: ${err.message}\n`);
      }

      prompt();
    });
  };

  prompt();
}

async function listAutomations(): Promise<void> {
  console.log('\n📋 German Automations Available:\n');

  for (const [id, automation] of Object.entries(GERMAN_AUTOMATIONS)) {
    console.log(`  ${id}`);
    console.log(`    Name: ${automation.name}`);
    console.log(`    Description: ${automation.description}`);
    console.log(`    Legal Basis: ${automation.legalBasis.join(', ')}`);
    console.log('');
  }
}

async function runAutomation(automationId: string, data: string): Promise<void> {
  const automation = GERMAN_AUTOMATIONS[automationId as keyof typeof GERMAN_AUTOMATIONS];

  if (!automation) {
    console.error(`\n❌ Unknown automation: ${automationId}`);
    console.log('\nAvailable automations:', Object.keys(GERMAN_AUTOMATIONS).join(', '));
    process.exit(1);
  }

  console.log(`\n⚙️  Running ${automation.name}...\n`);

  let parsedData = {};
  try {
    parsedData = data ? JSON.parse(data) : {};
  } catch {
    console.error('❌ Invalid JSON data');
    process.exit(1);
  }

  // Use Claude to process the automation
  const prompt = `You are a German business automation assistant. Execute the following automation:

Automation: ${automation.name}
Description: ${automation.description}
Legal Basis: ${automation.legalBasis.join(', ')}

Input Data:
${JSON.stringify(parsedData, null, 2)}

Please process this request and provide:
1. The generated document/output
2. Compliance checklist
3. Any warnings or notes`;

  try {
    const result = query({
      prompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        maxTurns: 5,
        permissionMode: 'bypassPermissions',
      } as Record<string, unknown>
    });

    for await (const msg of result) {
      const m = msg as QueryMessage;
      if (m.type === 'assistant' && m.content) {
        const content = m.content as unknown;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && block.text) {
              process.stdout.write(block.text);
            }
          }
        } else if (typeof content === 'string') {
          process.stdout.write(content);
        }
      }
      if (m.type === 'result' && m.text) {
        process.stdout.write(m.text);
      }
    }

    console.log('\n');
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
🤖 Agent Girl CLI - Terminal Chat Interface

Usage:
  bun run agent-cli.ts <command> [options]

Commands:
  chat <message>              Send a single message to Claude
  interactive                 Start interactive chat mode
  automations list            List available German automations
  automations run <id> --data '{...}'  Run a German automation
  --help                      Show this help

Examples:
  bun run agent-cli.ts chat "What is TypeScript?"
  bun run agent-cli.ts interactive
  bun run agent-cli.ts automations list
  bun run agent-cli.ts automations run rechnung --data '{"kunde":"Test GmbH"}'

Environment:
  ANTHROPIC_API_KEY    Required for Claude API access (or use OAuth login)
`);
}

// Main
async function main(): Promise<void> {
  switch (command) {
    case 'chat': {
      const message = args.slice(1).join(' ');
      if (!message) {
        console.error('\n❌ Please provide a message');
        showHelp();
        process.exit(1);
      }
      await chat(message);
      break;
    }

    case 'interactive':
    case 'i':
      await interactive();
      break;

    case 'automations':
    case 'auto': {
      const subCommand = args[1];
      if (subCommand === 'list') {
        await listAutomations();
      } else if (subCommand === 'run') {
        const automationId = args[2];
        const dataIndex = args.indexOf('--data');
        const data = dataIndex !== -1 ? args[dataIndex + 1] : '{}';
        await runAutomation(automationId, data);
      } else {
        console.error('\n❌ Unknown automations subcommand');
        showHelp();
        process.exit(1);
      }
      break;
    }

    case '--help':
    case 'help':
    case '-h':
      showHelp();
      break;

    case undefined:
      showHelp();
      break;

    default:
      console.error(`\n❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
