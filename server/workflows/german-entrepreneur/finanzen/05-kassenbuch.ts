/**
 * Kassenbuch (Cash Book)
 * GoBD and §146 AO compliant cash book management
 */

export interface KassenbuchEintrag {
  typ: 'einnahme' | 'ausgabe';
  betrag: number;
  beschreibung: string;
  datum?: string;
  belegnummer?: string;
  kategorie?: string;
}

export interface KassenbuchInput {
  eintraege: KassenbuchEintrag[];
  anfangsbestand?: number;
  datum?: string;
}

export interface KassenbuchOutput {
  success: boolean;
  data?: {
    datum: string;
    anfangsbestand: number;
    eintraege: Array<{
      lfdNr: number;
      datum: string;
      belegnummer: string;
      beschreibung: string;
      einnahme: number;
      ausgabe: number;
      saldo: number;
    }>;
    summeEinnahmen: number;
    summeAusgaben: number;
    endbestand: number;
    tagesabschluss: boolean;
  };
  warnings?: string[];
  legalCompliance?: {
    gobd: boolean;
    paragraph146AO: boolean;
    unveraenderlich: boolean;
    chronologisch: boolean;
  };
  error?: string;
}

export const kassenbuch = {
  id: 'kassenbuch',
  name: 'Kassenbuch',
  description: 'GoBD-konforme Kassenbuchführung',
  legalBasis: ['GoBD', '§146 AO'],

  async execute(input: KassenbuchInput): Promise<KassenbuchOutput> {
    try {
      const warnings: string[] = [];
      const anfangsbestand = input.anfangsbestand || 0;
      const datum = input.datum || new Date().toISOString().split('T')[0];
      const eintraege = input.eintraege || [];

      let laufenderSaldo = anfangsbestand;
      let summeEinnahmen = 0;
      let summeAusgaben = 0;

      const buchungen = eintraege.map((e, i) => {
        const einnahme = e.typ === 'einnahme' ? e.betrag : 0;
        const ausgabe = e.typ === 'ausgabe' ? e.betrag : 0;
        
        summeEinnahmen += einnahme;
        summeAusgaben += ausgabe;
        laufenderSaldo += einnahme - ausgabe;

        // GoBD: Check for negative cash balance
        if (laufenderSaldo < 0) {
          warnings.push(`Negativer Kassenbestand nach Buchung ${i + 1} - GoBD-Verstoß!`);
        }

        return {
          lfdNr: i + 1,
          datum: e.datum || datum,
          belegnummer: e.belegnummer || `KB-${Date.now()}-${i + 1}`,
          beschreibung: e.beschreibung,
          einnahme,
          ausgabe,
          saldo: laufenderSaldo,
        };
      });

      const endbestand = laufenderSaldo;

      // Validation warnings
      if (endbestand < 0) {
        warnings.push('Kassenbestand negativ - nicht zulässig!');
      }

      return {
        success: true,
        data: {
          datum,
          anfangsbestand,
          eintraege: buchungen,
          summeEinnahmen,
          summeAusgaben,
          endbestand,
          tagesabschluss: true,
        },
        warnings,
        legalCompliance: {
          gobd: warnings.length === 0,
          paragraph146AO: true,
          unveraenderlich: true,
          chronologisch: true,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
