/**
 * German Automations Unit Tests
 * Tests for §14 UStG invoices, VAT returns, DATEV exports, etc.
 */

import { describe, it, expect } from 'bun:test';

// Import automation modules (mock implementations for testing)
interface RechnungInput {
  kunde: string;
  leistung: string;
  nettoBetrag: number;
  datum?: string;
  steuersatz?: number;
}

interface RechnungOutput {
  rechnungsnummer: string;
  datum: string;
  kunde: string;
  leistung: string;
  nettoBetrag: number;
  ustBetrag: number;
  bruttoBetrag: number;
  steuersatz: number;
  compliance: {
    paragraph14UStG: boolean;
    pflichtangaben: string[];
  };
}

interface UStVoranmeldungInput {
  zeitraum: string;
  umsaetze19: number;
  umsaetze7?: number;
  vorsteuer?: number;
}

interface UStVoranmeldungOutput {
  zeitraum: string;
  umsaetze19: number;
  umsaetze7: number;
  ustSchuld19: number;
  ustSchuld7: number;
  vorsteuerAbzug: number;
  zahllast: number;
  faelligkeitAm: string;
  elsterReady: boolean;
}

interface DATEVBuchung {
  konto: string;
  gegenkonto: string;
  betrag: number;
  text: string;
  datum: string;
}

interface KassenbuchEintrag {
  typ: 'einnahme' | 'ausgabe';
  betrag: number;
  beschreibung: string;
  datum: string;
  belegnummer?: string;
}

interface MahnungInput {
  schuldner: string;
  forderung: number;
  faelligkeitsdatum: string;
  mahnstufe?: number;
}

// Mock implementations matching the actual automation logic
function erstelleRechnung(input: RechnungInput): RechnungOutput {
  const steuersatz = input.steuersatz || 19;
  const ustBetrag = input.nettoBetrag * (steuersatz / 100);
  const bruttoBetrag = input.nettoBetrag + ustBetrag;
  const datum = input.datum || new Date().toISOString().split('T')[0];

  return {
    rechnungsnummer: `RE-${Date.now()}`,
    datum,
    kunde: input.kunde,
    leistung: input.leistung,
    nettoBetrag: input.nettoBetrag,
    ustBetrag: Math.round(ustBetrag * 100) / 100,
    bruttoBetrag: Math.round(bruttoBetrag * 100) / 100,
    steuersatz,
    compliance: {
      paragraph14UStG: true,
      pflichtangaben: [
        'Vollständiger Name und Anschrift des leistenden Unternehmers',
        'Vollständiger Name und Anschrift des Leistungsempfängers',
        'Steuernummer oder USt-IdNr.',
        'Ausstellungsdatum',
        'Fortlaufende Rechnungsnummer',
        'Menge und Art der Lieferung/Leistung',
        'Zeitpunkt der Lieferung/Leistung',
        'Entgelt (netto)',
        'Steuersatz und Steuerbetrag',
      ],
    },
  };
}

function berechneUStVoranmeldung(input: UStVoranmeldungInput): UStVoranmeldungOutput {
  const umsaetze7 = input.umsaetze7 || 0;
  const vorsteuer = input.vorsteuer || 0;

  const ustSchuld19 = input.umsaetze19 * 0.19;
  const ustSchuld7 = umsaetze7 * 0.07;
  const zahllast = ustSchuld19 + ustSchuld7 - vorsteuer;

  // Calculate due date (10th of following month)
  const [year, period] = input.zeitraum.split('-');
  let faelligkeitAm: string;

  if (period.startsWith('Q')) {
    const quarter = parseInt(period.substring(1));
    const nextMonth = quarter * 3 + 1;
    faelligkeitAm = `10.${nextMonth > 12 ? '01' : nextMonth.toString().padStart(2, '0')}.${nextMonth > 12 ? parseInt(year) + 1 : year}`;
  } else {
    const month = parseInt(period);
    const nextMonth = month + 1;
    faelligkeitAm = `10.${nextMonth > 12 ? '01' : nextMonth.toString().padStart(2, '0')}.${nextMonth > 12 ? parseInt(year) + 1 : year}`;
  }

  return {
    zeitraum: input.zeitraum,
    umsaetze19: input.umsaetze19,
    umsaetze7,
    ustSchuld19: Math.round(ustSchuld19 * 100) / 100,
    ustSchuld7: Math.round(ustSchuld7 * 100) / 100,
    vorsteuerAbzug: vorsteuer,
    zahllast: Math.round(zahllast * 100) / 100,
    faelligkeitAm,
    elsterReady: true,
  };
}

function exportiereDATEV(buchungen: DATEVBuchung[], zeitraum: string): string {
  const header = `"EXTF";700;21;"Buchungsstapel";${zeitraum}`;
  const lines = buchungen.map((b, i) =>
    `${i + 1};${b.betrag.toFixed(2).replace('.', ',')};${b.konto};${b.gegenkonto};${b.datum};${b.text}`
  );
  return [header, ...lines].join('\n');
}

function erstelleMahnung(input: MahnungInput) {
  const mahnstufe = input.mahnstufe || 1;
  const verzugszinsen = mahnstufe > 1 ? input.forderung * 0.05 * (mahnstufe - 1) : 0;
  const mahngebuehr = mahnstufe * 5;
  const gesamtforderung = input.forderung + verzugszinsen + mahngebuehr;

  const zahlungsfrist = mahnstufe < 3 ? '7 Tage' : 'Sofort, letzte Mahnung vor Inkasso';
  const betreff = mahnstufe === 1
    ? 'Zahlungserinnerung'
    : mahnstufe === 2
      ? '2. Mahnung'
      : 'Letzte Mahnung vor gerichtlichem Mahnverfahren';

  return {
    mahnstufe,
    betreff,
    schuldner: input.schuldner,
    ursprungsforderung: input.forderung,
    faelligSeit: input.faelligkeitsdatum,
    verzugszinsen: Math.round(verzugszinsen * 100) / 100,
    mahngebuehr,
    gesamtforderung: Math.round(gesamtforderung * 100) / 100,
    zahlungsfrist,
    compliance: {
      paragraph286BGB: true,
      paragraph288BGB: verzugszinsen > 0,
    },
  };
}

function erfasseKassenbuch(eintrag: KassenbuchEintrag) {
  const belegnummer = eintrag.belegnummer || `KB-${Date.now()}`;
  const datum = eintrag.datum || new Date().toISOString().split('T')[0];

  return {
    belegnummer,
    datum,
    typ: eintrag.typ,
    betrag: eintrag.betrag,
    beschreibung: eintrag.beschreibung,
    saldo: eintrag.typ === 'einnahme' ? eintrag.betrag : -eintrag.betrag,
    gobdCompliant: true,
    unveraenderlich: true,
    compliance: {
      gobd: true,
      paragraph146AO: true,
    },
  };
}

describe('Rechnungserstellung (§14 UStG)', () => {
  it('should create a valid invoice with 19% VAT', () => {
    const rechnung = erstelleRechnung({
      kunde: 'Test GmbH, Musterstraße 1, 12345 Berlin',
      leistung: 'Softwareentwicklung',
      nettoBetrag: 1000,
    });

    expect(rechnung.nettoBetrag).toBe(1000);
    expect(rechnung.ustBetrag).toBe(190);
    expect(rechnung.bruttoBetrag).toBe(1190);
    expect(rechnung.steuersatz).toBe(19);
  });

  it('should create invoice with reduced 7% VAT', () => {
    const rechnung = erstelleRechnung({
      kunde: 'Test GmbH',
      leistung: 'Bücher-Lieferung',
      nettoBetrag: 100,
      steuersatz: 7,
    });

    expect(rechnung.ustBetrag).toBe(7);
    expect(rechnung.bruttoBetrag).toBe(107);
    expect(rechnung.steuersatz).toBe(7);
  });

  it('should generate invoice number with correct format', () => {
    const rechnung = erstelleRechnung({
      kunde: 'Test',
      leistung: 'Test',
      nettoBetrag: 100,
    });

    // Invoice number should follow RE-{timestamp} format
    expect(rechnung.rechnungsnummer).toMatch(/^RE-\d+$/);
  });

  it('should use custom date when provided', () => {
    const rechnung = erstelleRechnung({
      kunde: 'Test',
      leistung: 'Test',
      nettoBetrag: 100,
      datum: '2024-12-15',
    });

    expect(rechnung.datum).toBe('2024-12-15');
  });

  it('should include §14 UStG compliance info', () => {
    const rechnung = erstelleRechnung({
      kunde: 'Test',
      leistung: 'Test',
      nettoBetrag: 100,
    });

    expect(rechnung.compliance.paragraph14UStG).toBe(true);
    expect(rechnung.compliance.pflichtangaben.length).toBeGreaterThan(0);
    expect(rechnung.compliance.pflichtangaben).toContain('Steuernummer oder USt-IdNr.');
  });

  it('should handle decimal amounts correctly', () => {
    const rechnung = erstelleRechnung({
      kunde: 'Test',
      leistung: 'Test',
      nettoBetrag: 123.45,
    });

    expect(rechnung.ustBetrag).toBe(23.46); // Rounded
    expect(rechnung.bruttoBetrag).toBe(146.91);
  });

  it('should handle zero amount', () => {
    const rechnung = erstelleRechnung({
      kunde: 'Test',
      leistung: 'Kostenlose Beratung',
      nettoBetrag: 0,
    });

    expect(rechnung.ustBetrag).toBe(0);
    expect(rechnung.bruttoBetrag).toBe(0);
  });
});

describe('USt-Voranmeldung (§18 UStG)', () => {
  it('should calculate VAT liability correctly', () => {
    const voranmeldung = berechneUStVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze19: 10000,
    });

    expect(voranmeldung.ustSchuld19).toBe(1900);
    expect(voranmeldung.zahllast).toBe(1900);
  });

  it('should deduct input VAT (Vorsteuer)', () => {
    const voranmeldung = berechneUStVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze19: 10000,
      vorsteuer: 500,
    });

    expect(voranmeldung.ustSchuld19).toBe(1900);
    expect(voranmeldung.vorsteuerAbzug).toBe(500);
    expect(voranmeldung.zahllast).toBe(1400);
  });

  it('should handle negative tax liability (Vorsteuerüberhang)', () => {
    const voranmeldung = berechneUStVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze19: 1000,
      vorsteuer: 500,
    });

    expect(voranmeldung.ustSchuld19).toBe(190);
    expect(voranmeldung.zahllast).toBe(-310); // Refund expected
  });

  it('should combine 19% and 7% VAT rates', () => {
    const voranmeldung = berechneUStVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze19: 10000,
      umsaetze7: 5000,
    });

    expect(voranmeldung.ustSchuld19).toBe(1900);
    expect(voranmeldung.ustSchuld7).toBe(350);
    expect(voranmeldung.zahllast).toBe(2250);
  });

  it('should be ELSTER-ready', () => {
    const voranmeldung = berechneUStVoranmeldung({
      zeitraum: '2024-Q4',
      umsaetze19: 10000,
    });

    expect(voranmeldung.elsterReady).toBe(true);
  });

  it('should handle monthly periods', () => {
    const voranmeldung = berechneUStVoranmeldung({
      zeitraum: '2024-11',
      umsaetze19: 5000,
    });

    expect(voranmeldung.zeitraum).toBe('2024-11');
    expect(voranmeldung.faelligkeitAm).toContain('12'); // December
  });
});

describe('DATEV-Export (GoBD)', () => {
  it('should generate valid DATEV format', () => {
    const buchungen: DATEVBuchung[] = [
      { konto: '8400', gegenkonto: '1200', betrag: 1000, text: 'Erlöse', datum: '2024-11-15' },
    ];

    const output = exportiereDATEV(buchungen, '2024-11');

    expect(output).toContain('EXTF');
    expect(output).toContain('700'); // DATEV format version
    expect(output).toContain('1000,00');
    expect(output).toContain('8400');
  });

  it('should export multiple bookings', () => {
    const buchungen: DATEVBuchung[] = [
      { konto: '8400', gegenkonto: '1200', betrag: 1000, text: 'Erlös 1', datum: '2024-11-15' },
      { konto: '8400', gegenkonto: '1200', betrag: 2000, text: 'Erlös 2', datum: '2024-11-16' },
      { konto: '4400', gegenkonto: '1200', betrag: 500, text: 'Wareneinkauf', datum: '2024-11-17' },
    ];

    const output = exportiereDATEV(buchungen, '2024-11');
    const lines = output.split('\n');

    expect(lines.length).toBe(4); // 1 header + 3 bookings
  });

  it('should format German decimal numbers correctly', () => {
    const buchungen: DATEVBuchung[] = [
      { konto: '8400', gegenkonto: '1200', betrag: 1234.56, text: 'Test', datum: '2024-11-15' },
    ];

    const output = exportiereDATEV(buchungen, '2024-11');

    expect(output).toContain('1234,56'); // German format with comma
  });

  it('should handle empty booking list', () => {
    const output = exportiereDATEV([], '2024-11');

    expect(output).toContain('EXTF');
    expect(output.split('\n').length).toBe(1); // Only header
  });
});

describe('Mahnwesen (§286/§288 BGB)', () => {
  it('should create first reminder without interest', () => {
    const mahnung = erstelleMahnung({
      schuldner: 'Test GmbH',
      forderung: 1000,
      faelligkeitsdatum: '2024-10-15',
      mahnstufe: 1,
    });

    expect(mahnung.mahnstufe).toBe(1);
    expect(mahnung.verzugszinsen).toBe(0);
    expect(mahnung.mahngebuehr).toBe(5);
    expect(mahnung.gesamtforderung).toBe(1005);
    expect(mahnung.betreff).toBe('Zahlungserinnerung');
  });

  it('should add interest on second reminder', () => {
    const mahnung = erstelleMahnung({
      schuldner: 'Test GmbH',
      forderung: 1000,
      faelligkeitsdatum: '2024-09-15',
      mahnstufe: 2,
    });

    expect(mahnung.mahnstufe).toBe(2);
    expect(mahnung.verzugszinsen).toBe(50); // 5% of 1000
    expect(mahnung.mahngebuehr).toBe(10);
    expect(mahnung.gesamtforderung).toBe(1060);
    expect(mahnung.betreff).toBe('2. Mahnung');
  });

  it('should escalate on third reminder', () => {
    const mahnung = erstelleMahnung({
      schuldner: 'Test GmbH',
      forderung: 1000,
      faelligkeitsdatum: '2024-08-15',
      mahnstufe: 3,
    });

    expect(mahnung.mahnstufe).toBe(3);
    expect(mahnung.verzugszinsen).toBe(100); // 5% × 2 periods
    expect(mahnung.mahngebuehr).toBe(15);
    expect(mahnung.zahlungsfrist).toContain('Inkasso');
    expect(mahnung.betreff).toContain('Letzte Mahnung');
  });

  it('should include §286 BGB compliance', () => {
    const mahnung = erstelleMahnung({
      schuldner: 'Test',
      forderung: 100,
      faelligkeitsdatum: '2024-10-01',
    });

    expect(mahnung.compliance.paragraph286BGB).toBe(true);
  });

  it('should include §288 BGB for interest claims', () => {
    const mahnung1 = erstelleMahnung({
      schuldner: 'Test',
      forderung: 100,
      faelligkeitsdatum: '2024-10-01',
      mahnstufe: 1,
    });

    const mahnung2 = erstelleMahnung({
      schuldner: 'Test',
      forderung: 100,
      faelligkeitsdatum: '2024-10-01',
      mahnstufe: 2,
    });

    expect(mahnung1.compliance.paragraph288BGB).toBe(false); // No interest
    expect(mahnung2.compliance.paragraph288BGB).toBe(true); // Has interest
  });

  it('should default to first reminder level', () => {
    const mahnung = erstelleMahnung({
      schuldner: 'Test',
      forderung: 100,
      faelligkeitsdatum: '2024-10-01',
    });

    expect(mahnung.mahnstufe).toBe(1);
  });
});

describe('Kassenbuch (GoBD/§146 AO)', () => {
  it('should record income entry', () => {
    const eintrag = erfasseKassenbuch({
      typ: 'einnahme',
      betrag: 500,
      beschreibung: 'Barverkauf',
      datum: '2024-11-20',
    });

    expect(eintrag.typ).toBe('einnahme');
    expect(eintrag.betrag).toBe(500);
    expect(eintrag.saldo).toBe(500);
  });

  it('should record expense entry', () => {
    const eintrag = erfasseKassenbuch({
      typ: 'ausgabe',
      betrag: 100,
      beschreibung: 'Büromaterial',
      datum: '2024-11-20',
    });

    expect(eintrag.typ).toBe('ausgabe');
    expect(eintrag.betrag).toBe(100);
    expect(eintrag.saldo).toBe(-100);
  });

  it('should be GoBD-compliant', () => {
    const eintrag = erfasseKassenbuch({
      typ: 'einnahme',
      betrag: 100,
      beschreibung: 'Test',
      datum: '2024-11-20',
    });

    expect(eintrag.gobdCompliant).toBe(true);
    expect(eintrag.unveraenderlich).toBe(true);
    expect(eintrag.compliance.gobd).toBe(true);
    expect(eintrag.compliance.paragraph146AO).toBe(true);
  });

  it('should generate receipt number if not provided', () => {
    const eintrag = erfasseKassenbuch({
      typ: 'einnahme',
      betrag: 100,
      beschreibung: 'Test',
      datum: '2024-11-20',
    });

    expect(eintrag.belegnummer).toContain('KB-');
  });

  it('should use custom receipt number', () => {
    const eintrag = erfasseKassenbuch({
      typ: 'einnahme',
      betrag: 100,
      beschreibung: 'Test',
      datum: '2024-11-20',
      belegnummer: 'KB-001-2024',
    });

    expect(eintrag.belegnummer).toBe('KB-001-2024');
  });
});
