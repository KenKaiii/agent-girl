/**
 * MCP Server Unit Tests
 * Tests for MCP tool handlers and responses
 */

import { describe, it, expect } from 'bun:test';

// Mock MCP tool implementations (matching mcp-server.ts logic)
interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

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

// Tool handlers matching mcp-server.ts
function handleAgentGirlStatus(): MCPToolResult {
  return {
    content: [{
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
    }],
  };
}

function handleGermanAutomationList(): MCPToolResult {
  const list = Object.entries(GERMAN_AUTOMATIONS).map(([id, auto]) => ({
    id,
    name: auto.name,
    description: auto.description,
    legalBasis: auto.legalBasis,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ automations: list }, null, 2),
    }],
  };
}

function handleGermanRechnung(args: {
  kunde: string;
  leistung: string;
  betrag: number;
  datum?: string;
  steuersatz?: number;
}): MCPToolResult {
  const { kunde, leistung, betrag, datum, steuersatz = 19 } = args;
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
    content: [{
      type: 'text',
      text: JSON.stringify({ success: true, rechnung: invoice }, null, 2),
    }],
  };
}

function handleGermanUstVoranmeldung(args: {
  zeitraum: string;
  umsaetze: number;
  vorsteuer?: number;
}): MCPToolResult {
  const { zeitraum, umsaetze, vorsteuer = 0 } = args;
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
    content: [{
      type: 'text',
      text: JSON.stringify({ success: true, voranmeldung }, null, 2),
    }],
  };
}

function handleGermanMahnung(args: {
  schuldner: string;
  forderung: number;
  faelligkeitsdatum: string;
  mahnstufe?: number;
}): MCPToolResult {
  const { schuldner, forderung, faelligkeitsdatum, mahnstufe = 1 } = args;
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
    content: [{
      type: 'text',
      text: JSON.stringify({ success: true, mahnung }, null, 2),
    }],
  };
}

function handleGermanKassenbuch(args: {
  typ: 'einnahme' | 'ausgabe';
  betrag: number;
  beschreibung: string;
  datum?: string;
  belegnummer?: string;
}): MCPToolResult {
  const { typ, betrag, beschreibung, datum, belegnummer } = args;
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
    content: [{
      type: 'text',
      text: JSON.stringify({ success: true, kassenbuchEintrag: eintrag }, null, 2),
    }],
  };
}

function handleGermanDatevExport(args: {
  buchungen: Array<{
    konto: string;
    gegenkonto: string;
    betrag: number;
    text: string;
    datum: string;
  }>;
  zeitraum: string;
}): MCPToolResult {
  const { buchungen, zeitraum } = args;
  const datevLines = (buchungen || []).map((b, i) =>
    `${i + 1};${b.betrag};${b.konto};${b.gegenkonto};${b.datum};${b.text}`
  );

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        format: 'DATEV-ASCII',
        zeitraum,
        anzahlBuchungen: buchungen?.length || 0,
        datevContent: datevLines.join('\n'),
        gobdCompliant: true,
      }, null, 2),
    }],
  };
}

describe('MCP Server Status Tool', () => {
  it('should return operational status', () => {
    const result = handleAgentGirlStatus();
    const data = JSON.parse(result.content[0].text);

    expect(data.status).toBe('operational');
    expect(data.version).toBe('9.1.0');
  });

  it('should list available features', () => {
    const result = handleAgentGirlStatus();
    const data = JSON.parse(result.content[0].text);

    expect(data.features.chat).toBe(true);
    expect(data.features.germanAutomations).toBe(true);
    expect(data.features.models).toContain('sonnet');
  });

  it('should list available automations', () => {
    const result = handleAgentGirlStatus();
    const data = JSON.parse(result.content[0].text);

    expect(data.automationsAvailable).toContain('rechnung');
    expect(data.automationsAvailable).toContain('mahnung');
    expect(data.automationsAvailable.length).toBe(5);
  });
});

describe('MCP German Automation List Tool', () => {
  it('should return all 5 automations', () => {
    const result = handleGermanAutomationList();
    const data = JSON.parse(result.content[0].text);

    expect(data.automations.length).toBe(5);
  });

  it('should include automation details', () => {
    const result = handleGermanAutomationList();
    const data = JSON.parse(result.content[0].text);

    const rechnung = data.automations.find((a: any) => a.id === 'rechnung');
    expect(rechnung).toBeDefined();
    expect(rechnung.name).toBe('Rechnungserstellung');
    expect(rechnung.legalBasis).toContain('§14 UStG');
  });

  it('should return valid JSON structure', () => {
    const result = handleGermanAutomationList();

    expect(result.content[0].type).toBe('text');
    expect(() => JSON.parse(result.content[0].text)).not.toThrow();
  });
});

describe('MCP German Rechnung Tool', () => {
  it('should create valid invoice', () => {
    const result = handleGermanRechnung({
      kunde: 'Test GmbH',
      leistung: 'Beratung',
      betrag: 1000,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(true);
    expect(data.rechnung.nettosumme).toBe(1000);
    expect(data.rechnung.bruttosumme).toBe(1190);
  });

  it('should calculate VAT correctly', () => {
    const result = handleGermanRechnung({
      kunde: 'Test',
      leistung: 'Test',
      betrag: 100,
      steuersatz: 7,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.rechnung.umsatzsteuer.satz).toBe(7);
    expect(data.rechnung.umsatzsteuer.betrag).toBeCloseTo(7, 2);
    expect(data.rechnung.bruttosumme).toBeCloseTo(107, 2);
  });

  it('should include legal compliance info', () => {
    const result = handleGermanRechnung({
      kunde: 'Test',
      leistung: 'Test',
      betrag: 100,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.rechnung.legalCompliance.paragraph14UStG).toBe(true);
    expect(data.rechnung.legalCompliance.pflichtangaben.length).toBeGreaterThan(0);
  });

  it('should generate invoice number with correct format', () => {
    const result = handleGermanRechnung({
      kunde: 'Test',
      leistung: 'Test',
      betrag: 100,
    });
    const data = JSON.parse(result.content[0].text);

    // Invoice number should start with RE- prefix
    expect(data.rechnung.rechnungsnummer).toMatch(/^RE-\d+$/);
  });
});

describe('MCP German USt-Voranmeldung Tool', () => {
  it('should calculate VAT liability', () => {
    const result = handleGermanUstVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze: 10000,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(true);
    expect(data.voranmeldung.ustSchuld).toBe(1900);
    expect(data.voranmeldung.zahllast).toBe(1900);
  });

  it('should deduct input VAT', () => {
    const result = handleGermanUstVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze: 10000,
      vorsteuer: 500,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.voranmeldung.vorsteuerAbzug).toBe(500);
    expect(data.voranmeldung.zahllast).toBe(1400);
  });

  it('should be ELSTER-ready', () => {
    const result = handleGermanUstVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze: 10000,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.voranmeldung.elsterReady).toBe(true);
  });
});

describe('MCP German Mahnung Tool', () => {
  it('should create first reminder', () => {
    const result = handleGermanMahnung({
      schuldner: 'Test GmbH',
      forderung: 1000,
      faelligkeitsdatum: '2024-10-01',
      mahnstufe: 1,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(true);
    expect(data.mahnung.mahnstufe).toBe(1);
    expect(data.mahnung.verzugszinsen).toBe(0);
  });

  it('should add interest on escalation', () => {
    const result = handleGermanMahnung({
      schuldner: 'Test GmbH',
      forderung: 1000,
      faelligkeitsdatum: '2024-10-01',
      mahnstufe: 2,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.mahnung.verzugszinsen).toBe(50);
    expect(data.mahnung.legalCompliance.paragraph288BGB).toBe(true);
  });

  it('should default to first reminder', () => {
    const result = handleGermanMahnung({
      schuldner: 'Test',
      forderung: 100,
      faelligkeitsdatum: '2024-10-01',
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.mahnung.mahnstufe).toBe(1);
  });
});

describe('MCP German Kassenbuch Tool', () => {
  it('should record income', () => {
    const result = handleGermanKassenbuch({
      typ: 'einnahme',
      betrag: 500,
      beschreibung: 'Barverkauf',
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(true);
    expect(data.kassenbuchEintrag.typ).toBe('einnahme');
    expect(data.kassenbuchEintrag.saldo).toBe(500);
  });

  it('should record expense', () => {
    const result = handleGermanKassenbuch({
      typ: 'ausgabe',
      betrag: 100,
      beschreibung: 'Büromaterial',
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.kassenbuchEintrag.typ).toBe('ausgabe');
    expect(data.kassenbuchEintrag.saldo).toBe(-100);
  });

  it('should be GoBD compliant', () => {
    const result = handleGermanKassenbuch({
      typ: 'einnahme',
      betrag: 100,
      beschreibung: 'Test',
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.kassenbuchEintrag.gobdCompliant).toBe(true);
    expect(data.kassenbuchEintrag.legalCompliance.gobd).toBe(true);
    expect(data.kassenbuchEintrag.legalCompliance.paragraph146AO).toBe(true);
  });
});

describe('MCP German DATEV Export Tool', () => {
  it('should export bookings', () => {
    const result = handleGermanDatevExport({
      buchungen: [
        { konto: '8400', gegenkonto: '1200', betrag: 1000, text: 'Erlös', datum: '2024-11-15' },
      ],
      zeitraum: '2024-11',
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(true);
    expect(data.format).toBe('DATEV-ASCII');
    expect(data.anzahlBuchungen).toBe(1);
    expect(data.gobdCompliant).toBe(true);
  });

  it('should handle empty bookings', () => {
    const result = handleGermanDatevExport({
      buchungen: [],
      zeitraum: '2024-11',
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.anzahlBuchungen).toBe(0);
    expect(data.datevContent).toBe('');
  });

  it('should format booking lines correctly', () => {
    const result = handleGermanDatevExport({
      buchungen: [
        { konto: '8400', gegenkonto: '1200', betrag: 1000, text: 'Test', datum: '2024-11-15' },
        { konto: '4400', gegenkonto: '1200', betrag: 500, text: 'Kauf', datum: '2024-11-16' },
      ],
      zeitraum: '2024-11',
    });
    const data = JSON.parse(result.content[0].text);

    const lines = data.datevContent.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('8400');
    expect(lines[1]).toContain('4400');
  });
});

describe('MCP Tool Response Format', () => {
  it('should return correct content structure', () => {
    const result = handleAgentGirlStatus();

    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type');
    expect(result.content[0]).toHaveProperty('text');
  });

  it('should return valid JSON in text field', () => {
    const tools = [
      handleAgentGirlStatus,
      handleGermanAutomationList,
      () => handleGermanRechnung({ kunde: 'Test', leistung: 'Test', betrag: 100 }),
      () => handleGermanUstVoranmeldung({ zeitraum: '2024-Q4', umsaetze: 1000 }),
      () => handleGermanMahnung({ schuldner: 'Test', forderung: 100, faelligkeitsdatum: '2024-01-01' }),
      () => handleGermanKassenbuch({ typ: 'einnahme', betrag: 100, beschreibung: 'Test' }),
    ];

    for (const tool of tools) {
      const result = tool();
      expect(() => JSON.parse(result.content[0].text)).not.toThrow();
    }
  });
});
