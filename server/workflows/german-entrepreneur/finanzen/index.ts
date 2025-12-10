/**
 * German Entrepreneur Finance Automations
 * All §14 UStG, GoBD, and BGB compliant
 */

export { rechnungserstellung } from './01-rechnungserstellung';
export { ustVoranmeldung } from './02-ust-voranmeldung';
export { datevExport } from './03-datev-export';
export { mahnwesen } from './04-mahnwesen';
export { kassenbuch } from './05-kassenbuch';

export const GERMAN_FINANCE_AUTOMATIONS = [
  {
    id: 'rechnung',
    name: 'Rechnungserstellung',
    description: 'Erstellt §14 UStG konforme Rechnungen',
    legalBasis: ['§14 UStG', '§14a UStG'],
  },
  {
    id: 'ust-voranmeldung',
    name: 'USt-Voranmeldung',
    description: 'Bereitet Umsatzsteuer-Voranmeldung vor',
    legalBasis: ['§18 UStG'],
  },
  {
    id: 'datev-export',
    name: 'DATEV-Export',
    description: 'Exportiert Buchungen im DATEV-Format',
    legalBasis: ['GoBD'],
  },
  {
    id: 'mahnung',
    name: 'Mahnwesen',
    description: 'Erstellt rechtskonforme Mahnungen',
    legalBasis: ['§286 BGB', '§288 BGB'],
  },
  {
    id: 'kassenbuch',
    name: 'Kassenbuch',
    description: 'GoBD-konforme Kassenbuchführung',
    legalBasis: ['GoBD', '§146 AO'],
  },
];
