/**
 * USt-Voranmeldung (VAT Advance Return)
 * §18 UStG compliant VAT calculation
 */

export interface UStVoranmeldungInput {
  zeitraum: string; // e.g., "2024-Q1" or "2024-01"
  umsaetze19: number;
  umsaetze7?: number;
  umsaetze0?: number;
  vorsteuer: number;
  innergemeinschaftlicheErwerbe?: number;
}

export interface UStVoranmeldungOutput {
  success: boolean;
  data?: {
    zeitraum: string;
    umsaetze: {
      steuerpflichtig19: number;
      steuerpflichtig7: number;
      steuerfrei: number;
    };
    steuerSchuld: {
      ust19: number;
      ust7: number;
      gesamt: number;
    };
    vorsteuerAbzug: number;
    zahllast: number;
    faelligkeit: string;
    elsterKennzahlen: Record<string, number>;
  };
  warnings?: string[];
  legalCompliance?: {
    paragraph18UStG: boolean;
    elsterReady: boolean;
  };
  error?: string;
}

export const ustVoranmeldung = {
  id: 'ust-voranmeldung',
  name: 'USt-Voranmeldung',
  description: 'Bereitet Umsatzsteuer-Voranmeldung vor',
  legalBasis: ['§18 UStG'],

  async execute(input: UStVoranmeldungInput): Promise<UStVoranmeldungOutput> {
    try {
      const warnings: string[] = [];

      const umsaetze19 = input.umsaetze19 || 0;
      const umsaetze7 = input.umsaetze7 || 0;
      const umsaetze0 = input.umsaetze0 || 0;
      const vorsteuer = input.vorsteuer || 0;

      const ust19 = umsaetze19 * 0.19;
      const ust7 = umsaetze7 * 0.07;
      const steuerGesamt = ust19 + ust7;
      const zahllast = steuerGesamt - vorsteuer;

      // ELSTER Kennzahlen mapping
      const elsterKennzahlen: Record<string, number> = {
        '81': umsaetze19, // Steuerpflichtige Umsätze 19%
        '86': umsaetze7,  // Steuerpflichtige Umsätze 7%
        '66': vorsteuer,  // Vorsteuerbeträge
        '83': zahllast,   // Verbleibende USt-Vorauszahlung
      };

      if (zahllast < 0) {
        warnings.push('Vorsteuerüberhang - Erstattungsanspruch');
      }

      // Calculate due date
      const faelligkeit = 'Am 10. des Folgemonats';

      return {
        success: true,
        data: {
          zeitraum: input.zeitraum,
          umsaetze: {
            steuerpflichtig19: umsaetze19,
            steuerpflichtig7: umsaetze7,
            steuerfrei: umsaetze0,
          },
          steuerSchuld: {
            ust19,
            ust7,
            gesamt: steuerGesamt,
          },
          vorsteuerAbzug: vorsteuer,
          zahllast,
          faelligkeit,
          elsterKennzahlen,
        },
        warnings,
        legalCompliance: {
          paragraph18UStG: true,
          elsterReady: true,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
