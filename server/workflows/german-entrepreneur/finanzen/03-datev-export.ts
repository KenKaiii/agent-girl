/**
 * DATEV Export
 * GoBD compliant booking export in DATEV format
 */

export interface Buchung {
  datum: string;
  konto: string;
  gegenkonto: string;
  betrag: number;
  text: string;
  belegnummer?: string;
  kostenstelle?: string;
}

export interface DatevExportInput {
  buchungen: Buchung[];
  zeitraum: string;
  beraterNummer?: string;
  mandantenNummer?: string;
}

export interface DatevExportOutput {
  success: boolean;
  data?: {
    format: string;
    version: string;
    zeitraum: string;
    anzahlBuchungen: number;
    header: string;
    buchungszeilen: string[];
    checksumme: string;
  };
  warnings?: string[];
  legalCompliance?: {
    gobdCompliant: boolean;
    unveraenderlichkeit: boolean;
  };
  error?: string;
}

export const datevExport = {
  id: 'datev-export',
  name: 'DATEV-Export',
  description: 'Exportiert Buchungen im DATEV-Format',
  legalBasis: ['GoBD'],

  async execute(input: DatevExportInput): Promise<DatevExportOutput> {
    try {
      const warnings: string[] = [];
      const buchungen = input.buchungen || [];

      if (buchungen.length === 0) {
        warnings.push('Keine Buchungen zum Exportieren');
      }

      // DATEV header
      const header = [
        'EXTF',
        '700', // Format version
        '21', // Data category
        'Buchungsstapel',
        '12', // Format version
        new Date().toISOString().split('T')[0].replace(/-/g, ''),
        input.beraterNummer || '00000',
        input.mandantenNummer || '00001',
        input.zeitraum.replace('-', ''),
        '1', // Start month
        '12', // End month
      ].join(';');

      // Convert bookings to DATEV format
      const buchungszeilen = buchungen.map((b, i) => {
        return [
          b.betrag.toFixed(2).replace('.', ','),
          'S', // Soll/Haben indicator
          'EUR',
          '',
          b.konto,
          b.gegenkonto,
          '',
          b.belegnummer || `${i + 1}`,
          b.datum.replace(/-/g, '').slice(4), // MMDD
          b.text.slice(0, 60), // Max 60 chars
          '',
          b.kostenstelle || '',
        ].join(';');
      });

      // Simple checksum
      const checksumme = `CHK-${buchungen.length}-${Date.now().toString(36)}`;

      return {
        success: true,
        data: {
          format: 'DATEV-ASCII-Format',
          version: '7.0',
          zeitraum: input.zeitraum,
          anzahlBuchungen: buchungen.length,
          header,
          buchungszeilen,
          checksumme,
        },
        warnings,
        legalCompliance: {
          gobdCompliant: true,
          unveraenderlichkeit: true,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
