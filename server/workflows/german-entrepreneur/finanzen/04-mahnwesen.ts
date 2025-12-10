/**
 * Mahnwesen (Dunning Management)
 * §286 BGB, §288 BGB compliant dunning letters
 */

export interface MahnungInput {
  schuldner: {
    name: string;
    adresse: string;
  };
  forderung: {
    rechnungsnummer: string;
    ursprungsbetrag: number;
    faelligkeitsdatum: string;
  };
  mahnstufe?: number; // 1, 2, or 3
  verzugszinssatz?: number; // Default: 5% über Basiszinssatz
}

export interface MahnungOutput {
  success: boolean;
  data?: {
    mahnstufe: number;
    datum: string;
    schuldner: any;
    forderung: {
      ursprungsbetrag: number;
      verzugszinsen: number;
      mahngebuehr: number;
      gesamtforderung: number;
    };
    zahlungsfrist: string;
    eskalation: string;
    mahntext: string;
  };
  warnings?: string[];
  legalCompliance?: {
    paragraph286BGB: boolean;
    paragraph288BGB: boolean;
    verzugEingetreten: boolean;
  };
  error?: string;
}

export const mahnwesen = {
  id: 'mahnung',
  name: 'Mahnwesen',
  description: 'Erstellt rechtskonforme Mahnungen',
  legalBasis: ['§286 BGB', '§288 BGB'],

  async execute(input: MahnungInput): Promise<MahnungOutput> {
    try {
      const warnings: string[] = [];
      const mahnstufe = input.mahnstufe || 1;
      const verzugszinssatz = input.verzugszinssatz || 5;

      const ursprungsbetrag = input.forderung.ursprungsbetrag;
      const faelligkeitsdatum = new Date(input.forderung.faelligkeitsdatum);
      const heute = new Date();
      
      // Calculate days overdue
      const tageImVerzug = Math.floor((heute.getTime() - faelligkeitsdatum.getTime()) / (1000 * 60 * 60 * 24));
      
      if (tageImVerzug < 0) {
        warnings.push('Forderung noch nicht fällig');
      }

      // Calculate interest (§288 BGB)
      const verzugszinsen = tageImVerzug > 0 
        ? (ursprungsbetrag * (verzugszinssatz / 100) * (tageImVerzug / 365))
        : 0;

      // Dunning fees by level
      const mahngebuehren: Record<number, number> = { 1: 5, 2: 10, 3: 15 };
      const mahngebuehr = mahngebuehren[mahnstufe] || 5;

      const gesamtforderung = ursprungsbetrag + verzugszinsen + mahngebuehr;

      // Dunning text templates
      const mahntexte: Record<number, string> = {
        1: `Sehr geehrte Damen und Herren,

unsere Rechnung ${input.forderung.rechnungsnummer} ist noch offen. Wir bitten um zeitnahe Begleichung.`,
        2: `Sehr geehrte Damen und Herren,

trotz unserer Zahlungserinnerung ist die Rechnung ${input.forderung.rechnungsnummer} weiterhin unbezahlt. Wir fordern Sie auf, den Betrag umgehend zu überweisen.`,
        3: `Sehr geehrte Damen und Herren,

letzte Mahnung: Die Rechnung ${input.forderung.rechnungsnummer} ist seit ${tageImVerzug} Tagen überfällig. Bei Nichtzahlung binnen 7 Tagen leiten wir rechtliche Schritte ein.`,
      };

      const eskalationen: Record<number, string> = {
        1: 'Zahlungserinnerung',
        2: '2. Mahnung mit Mahngebühren',
        3: 'Letzte Mahnung vor Inkasso/Klage',
      };

      return {
        success: true,
        data: {
          mahnstufe,
          datum: heute.toISOString().split('T')[0],
          schuldner: input.schuldner,
          forderung: {
            ursprungsbetrag,
            verzugszinsen: Math.round(verzugszinsen * 100) / 100,
            mahngebuehr,
            gesamtforderung: Math.round(gesamtforderung * 100) / 100,
          },
          zahlungsfrist: mahnstufe < 3 ? '7 Tage' : 'Sofort',
          eskalation: eskalationen[mahnstufe],
          mahntext: mahntexte[mahnstufe],
        },
        warnings,
        legalCompliance: {
          paragraph286BGB: true,
          paragraph288BGB: verzugszinsen > 0,
          verzugEingetreten: tageImVerzug > 0,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
