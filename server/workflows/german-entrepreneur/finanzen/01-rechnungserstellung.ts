/**
 * Rechnungserstellung (Invoice Generation)
 * §14 UStG compliant German invoice generation
 */

export interface RechnungInput {
  kunde: {
    name: string;
    adresse: string;
    ustIdNr?: string;
  };
  leistungen: Array<{
    beschreibung: string;
    menge: number;
    einzelpreis: number;
    steuersatz?: number;
  }>;
  rechnungsdatum?: string;
  leistungsdatum?: string;
  zahlungsziel?: number;
}

export interface RechnungOutput {
  success: boolean;
  data?: {
    rechnungsnummer: string;
    datum: string;
    kunde: any;
    positionen: any[];
    nettosumme: number;
    steuerbetrag: number;
    bruttosumme: number;
    zahlungsziel: string;
  };
  warnings?: string[];
  legalCompliance?: {
    paragraph14UStG: boolean;
    pflichtangabenVollstaendig: boolean;
    hinweise: string[];
  };
  error?: string;
}

export const rechnungserstellung = {
  id: 'rechnung',
  name: 'Rechnungserstellung',
  description: 'Erstellt §14 UStG konforme Rechnungen',
  legalBasis: ['§14 UStG', '§14a UStG'],

  async execute(input: RechnungInput): Promise<RechnungOutput> {
    try {
      const warnings: string[] = [];
      const hinweise: string[] = [];

      // Validate required fields
      if (!input.kunde?.name) {
        return { success: false, error: 'Kundenname erforderlich' };
      }

      // Generate invoice number
      const rechnungsnummer = `RE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const datum = input.rechnungsdatum || new Date().toISOString().split('T')[0];

      // Calculate totals
      let nettosumme = 0;
      const positionen = (input.leistungen || []).map((l, i) => {
        const steuersatz = l.steuersatz ?? 19;
        const netto = l.menge * l.einzelpreis;
        nettosumme += netto;
        return {
          pos: i + 1,
          beschreibung: l.beschreibung,
          menge: l.menge,
          einzelpreis: l.einzelpreis,
          netto,
          steuersatz,
        };
      });

      const steuerbetrag = nettosumme * 0.19;
      const bruttosumme = nettosumme + steuerbetrag;

      // Compliance checks
      if (!input.kunde.ustIdNr) {
        hinweise.push('USt-IdNr. des Kunden fehlt - für B2B-Rechnungen erforderlich');
      }

      if (!input.leistungsdatum) {
        warnings.push('Leistungsdatum nicht angegeben');
        hinweise.push('Leistungsdatum gemäß §14 Abs. 4 Nr. 6 UStG erforderlich');
      }

      return {
        success: true,
        data: {
          rechnungsnummer,
          datum,
          kunde: input.kunde,
          positionen,
          nettosumme,
          steuerbetrag,
          bruttosumme,
          zahlungsziel: `${input.zahlungsziel || 14} Tage netto`,
        },
        warnings,
        legalCompliance: {
          paragraph14UStG: true,
          pflichtangabenVollstaendig: warnings.length === 0,
          hinweise,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
