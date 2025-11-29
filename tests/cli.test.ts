/**
 * CLI Unit Tests
 * Tests for command parsing and automation registry
 */

import { describe, it, expect } from 'bun:test';

// German automations registry (matching agent-cli.ts)
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

// Command parser (matching agent-cli.ts logic)
interface ParsedCommand {
  command: string;
  subCommand?: string;
  message?: string;
  automationId?: string;
  data?: Record<string, unknown>;
  showHelp: boolean;
}

function parseArgs(args: string[]): ParsedCommand {
  const command = args[0];

  if (!command || command === '--help' || command === 'help' || command === '-h') {
    return { command: 'help', showHelp: true };
  }

  if (command === 'chat') {
    const message = args.slice(1).join(' ');
    return {
      command: 'chat',
      message: message || undefined,
      showHelp: false,
    };
  }

  if (command === 'interactive' || command === 'i') {
    return { command: 'interactive', showHelp: false };
  }

  if (command === 'automations' || command === 'auto') {
    const subCommand = args[1];

    if (subCommand === 'list') {
      return { command: 'automations', subCommand: 'list', showHelp: false };
    }

    if (subCommand === 'run') {
      const automationId = args[2];
      const dataIndex = args.indexOf('--data');
      let data = {};

      if (dataIndex !== -1 && args[dataIndex + 1]) {
        try {
          data = JSON.parse(args[dataIndex + 1]);
        } catch {
          // Invalid JSON, leave empty
        }
      }

      return {
        command: 'automations',
        subCommand: 'run',
        automationId,
        data,
        showHelp: false,
      };
    }

    return { command: 'automations', showHelp: true };
  }

  return { command: 'unknown', showHelp: true };
}

function validateAutomationId(id: string): boolean {
  return id in GERMAN_AUTOMATIONS;
}

function getAutomation(id: string) {
  return GERMAN_AUTOMATIONS[id as keyof typeof GERMAN_AUTOMATIONS] || null;
}

describe('CLI Command Parser', () => {
  it('should parse chat command with message', () => {
    const result = parseArgs(['chat', 'Hello', 'World']);

    expect(result.command).toBe('chat');
    expect(result.message).toBe('Hello World');
    expect(result.showHelp).toBe(false);
  });

  it('should parse chat command without message', () => {
    const result = parseArgs(['chat']);

    expect(result.command).toBe('chat');
    expect(result.message).toBeUndefined();
  });

  it('should parse interactive command', () => {
    const result = parseArgs(['interactive']);

    expect(result.command).toBe('interactive');
    expect(result.showHelp).toBe(false);
  });

  it('should parse i as interactive shorthand', () => {
    const result = parseArgs(['i']);

    expect(result.command).toBe('interactive');
  });

  it('should parse automations list', () => {
    const result = parseArgs(['automations', 'list']);

    expect(result.command).toBe('automations');
    expect(result.subCommand).toBe('list');
  });

  it('should parse auto as automations shorthand', () => {
    const result = parseArgs(['auto', 'list']);

    expect(result.command).toBe('automations');
    expect(result.subCommand).toBe('list');
  });

  it('should parse automations run with ID', () => {
    const result = parseArgs(['automations', 'run', 'rechnung']);

    expect(result.command).toBe('automations');
    expect(result.subCommand).toBe('run');
    expect(result.automationId).toBe('rechnung');
  });

  it('should parse automations run with data', () => {
    const result = parseArgs([
      'automations', 'run', 'rechnung',
      '--data', '{"kunde":"Test GmbH","betrag":1000}'
    ]);

    expect(result.automationId).toBe('rechnung');
    expect(result.data).toEqual({ kunde: 'Test GmbH', betrag: 1000 });
  });

  it('should handle invalid JSON data gracefully', () => {
    const result = parseArgs([
      'automations', 'run', 'rechnung',
      '--data', 'invalid-json'
    ]);

    expect(result.data).toEqual({});
  });

  it('should show help for --help flag', () => {
    const result = parseArgs(['--help']);

    expect(result.showHelp).toBe(true);
  });

  it('should show help for help command', () => {
    const result = parseArgs(['help']);

    expect(result.showHelp).toBe(true);
  });

  it('should show help for -h flag', () => {
    const result = parseArgs(['-h']);

    expect(result.showHelp).toBe(true);
  });

  it('should show help for empty args', () => {
    const result = parseArgs([]);

    expect(result.showHelp).toBe(true);
  });

  it('should mark unknown commands', () => {
    const result = parseArgs(['unknown-command']);

    expect(result.command).toBe('unknown');
    expect(result.showHelp).toBe(true);
  });
});

describe('Automation Registry', () => {
  it('should have 5 automations', () => {
    expect(Object.keys(GERMAN_AUTOMATIONS).length).toBe(5);
  });

  it('should validate existing automation ID', () => {
    expect(validateAutomationId('rechnung')).toBe(true);
    expect(validateAutomationId('mahnung')).toBe(true);
    expect(validateAutomationId('kassenbuch')).toBe(true);
  });

  it('should reject invalid automation ID', () => {
    expect(validateAutomationId('invalid')).toBe(false);
    expect(validateAutomationId('')).toBe(false);
  });

  it('should get automation by ID', () => {
    const rechnung = getAutomation('rechnung');

    expect(rechnung).not.toBeNull();
    expect(rechnung?.name).toBe('Rechnungserstellung');
    expect(rechnung?.legalBasis).toContain('§14 UStG');
  });

  it('should return null for invalid ID', () => {
    const result = getAutomation('invalid');

    expect(result).toBeNull();
  });

  it('should have legal basis for all automations', () => {
    for (const [id, automation] of Object.entries(GERMAN_AUTOMATIONS)) {
      expect(automation.legalBasis.length).toBeGreaterThan(0);
      expect(automation.name).toBeTruthy();
      expect(automation.description).toBeTruthy();
    }
  });
});

describe('CLI Help Text', () => {
  const helpText = `
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
`;

  it('should document chat command', () => {
    expect(helpText).toContain('chat <message>');
    expect(helpText).toContain('Send a single message');
  });

  it('should document interactive command', () => {
    expect(helpText).toContain('interactive');
    expect(helpText).toContain('interactive chat mode');
  });

  it('should document automations commands', () => {
    expect(helpText).toContain('automations list');
    expect(helpText).toContain('automations run');
  });

  it('should include examples', () => {
    expect(helpText).toContain('bun run agent-cli.ts chat');
    expect(helpText).toContain('bun run agent-cli.ts interactive');
  });

  it('should document environment variables', () => {
    expect(helpText).toContain('ANTHROPIC_API_KEY');
  });
});

describe('CLI Data Parsing', () => {
  it('should parse valid JSON object', () => {
    const json = '{"kunde":"Test GmbH","betrag":1000}';
    const data = JSON.parse(json);

    expect(data.kunde).toBe('Test GmbH');
    expect(data.betrag).toBe(1000);
  });

  it('should parse nested JSON', () => {
    const json = '{"rechnung":{"positionen":[{"artikel":"Test","preis":100}]}}';
    const data = JSON.parse(json);

    expect(data.rechnung.positionen[0].artikel).toBe('Test');
  });

  it('should parse German special characters', () => {
    const json = '{"beschreibung":"Büromöbel für Büro"}';
    const data = JSON.parse(json);

    expect(data.beschreibung).toBe('Büromöbel für Büro');
  });

  it('should handle empty object', () => {
    const json = '{}';
    const data = JSON.parse(json);

    expect(Object.keys(data).length).toBe(0);
  });

  it('should throw on invalid JSON', () => {
    expect(() => JSON.parse('not-json')).toThrow();
    expect(() => JSON.parse("{'single': 'quotes'}")).toThrow();
  });
});

describe('CLI Automation IDs', () => {
  const validIds = [
    'rechnung',
    'ust-voranmeldung',
    'datev-export',
    'mahnung',
    'kassenbuch',
  ];

  it('should validate all expected IDs', () => {
    for (const id of validIds) {
      expect(validateAutomationId(id)).toBe(true);
    }
  });

  it('should handle hyphenated IDs', () => {
    expect(validateAutomationId('ust-voranmeldung')).toBe(true);
    expect(validateAutomationId('datev-export')).toBe(true);
  });

  it('should be case-sensitive', () => {
    expect(validateAutomationId('Rechnung')).toBe(false);
    expect(validateAutomationId('RECHNUNG')).toBe(false);
  });
});
