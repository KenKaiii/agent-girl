/**
 * Agent Girl - Prompt Templates Data
 * Business-focused workflow prompts for real-world use cases
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business-de' | 'business-eu' | 'business-us' | 'development' | 'productivity' | 'legal';
  tags: string[];
  prompt: string;
  variables?: { key: string; placeholder: string; description: string }[];
  estimatedTime?: string;
  recommendAutonom?: boolean;
  tier: 1 | 2 | 3; // 1 = immediate value, 2 = high ROI, 3 = productivity
}

export const promptTemplates: PromptTemplate[] = [
  // === TIER 1: Immediate Business Value ===
  {
    id: 'e-rechnung',
    name: 'E-Rechnung Generator',
    description: 'XRechnung 3.0 / ZUGFeRD 2.2 konforme E-Rechnungen erstellen - PFLICHT ab 01.01.2025',
    category: 'business-de',
    tags: ['invoice', 'germany', 'compliance', 'xrechnung', 'zugferd'],
    tier: 1,
    estimatedTime: '2-5 min',
    recommendAutonom: true,
    variables: [
      { key: 'rechnungsnummer', placeholder: 'RE-2025-001', description: 'Rechnungsnummer' },
      { key: 'firma_absender', placeholder: 'Mustermann GmbH', description: 'Ihr Firmenname' },
      { key: 'firma_empfaenger', placeholder: 'Beispiel AG', description: 'Empfänger Firma' },
      { key: 'betrag', placeholder: '1.000,00', description: 'Rechnungsbetrag in EUR' },
    ],
    prompt: `/workflow e-rechnung

Erstelle eine rechtskonforme E-Rechnung:

RECHNUNGSDATEN:
- Rechnungsnummer: [{{rechnungsnummer}}]
- Datum: [${new Date().toISOString().split('T')[0]}]
- Leistungszeitraum: [Aktueller Monat]

ABSENDER (Ihr Unternehmen):
- Firma: [{{firma_absender}}]
- USt-IdNr: [DE___]
- IBAN: [DE___]

EMPFÄNGER:
- Firma: [{{firma_empfaenger}}]
- USt-IdNr: [DE___]

POSITIONEN:
1. [Leistungsbeschreibung] | [Menge] | [{{betrag}}] EUR | [19]% MwSt

FORMAT: XRechnung
AUSGABE: ./rechnungen/`,
  },
  {
    id: 'dsgvo-kit',
    name: 'DSGVO Compliance Kit',
    description: 'Vollständiges Datenschutz-Paket: Datenschutzerklärung, Cookie-Banner, Verarbeitungsverzeichnis',
    category: 'business-eu',
    tags: ['gdpr', 'privacy', 'compliance', 'cookie', 'legal'],
    tier: 1,
    estimatedTime: '5-10 min',
    recommendAutonom: true,
    variables: [
      { key: 'domain', placeholder: 'example.com', description: 'Website Domain' },
      { key: 'firma', placeholder: 'Mustermann GmbH', description: 'Firmenname' },
      { key: 'typ', placeholder: 'E-Commerce', description: 'Website-Typ' },
    ],
    prompt: `/workflow dsgvo-kit

Erstelle ein vollständiges DSGVO-Compliance-Kit für:

WEBSITE/APP:
- Domain: [{{domain}}]
- Typ: [{{typ}}]
- Tracking: [Google Analytics / Matomo / Keins]
- Newsletter: [Ja / Nein]
- Kontaktformular: [Ja / Nein]
- User-Accounts: [Ja / Nein]

UNTERNEHMEN:
- Firma: [{{firma}}]
- Anschrift: [Straße, PLZ Ort]
- E-Mail: [datenschutz@...]
- Datenschutzbeauftragter: [falls erforderlich]

ERSTELLE:
1. Datenschutzerklärung (rechtssicher für DE/AT/CH)
2. Cookie-Banner mit Opt-in/Opt-out
3. Verarbeitungsverzeichnis
4. AVV-Vorlage für Auftragsverarbeiter`,
  },
  {
    id: 'multilang-shop',
    name: 'Multi-Language E-Commerce',
    description: 'Internationaler Online-Shop mit lokalisierter UX, Zahlungen und rechtlichen Texten',
    category: 'business-eu',
    tags: ['ecommerce', 'i18n', 'localization', 'shop', 'international'],
    tier: 1,
    estimatedTime: '15-30 min',
    recommendAutonom: true,
    variables: [
      { key: 'shop_name', placeholder: 'MyShop', description: 'Shop Name' },
      { key: 'produkte', placeholder: 'Fashion', description: 'Produktkategorie' },
      { key: 'laender', placeholder: 'DE, AT, CH, FR', description: 'Zielländer' },
    ],
    prompt: `/workflow multilang-shop

Erstelle einen vollständig lokalisierten E-Commerce Shop:

SHOP:
- Name: [{{shop_name}}]
- Produkte: [{{produkte}}]
- Zielländer: [{{laender}}]

ANFORDERUNGEN:
1. Multi-Language UI (DE, EN, FR, ...)
2. Lokalisierte Preise und Währungen
3. Länderspezifische Zahlungsmethoden
   - DE: PayPal, Klarna, SEPA
   - FR: Carte Bancaire
   - NL: iDEAL
4. Rechtliche Texte pro Land
5. DSGVO-konformes Cookie-Management
6. Responsive Design (Mobile-first)

TECH-STACK:
- Next.js 14+ App Router
- Tailwind CSS
- i18n mit next-intl
- Stripe / Mollie für Payments`,
  },
  {
    id: 'saas-landing',
    name: 'SaaS Landing Page',
    description: 'Conversion-optimierte Landing Page mit Lighthouse 100, SEO und Analytics',
    category: 'business-us',
    tags: ['saas', 'landing', 'conversion', 'seo', 'marketing'],
    tier: 1,
    estimatedTime: '10-20 min',
    recommendAutonom: true,
    variables: [
      { key: 'product_name', placeholder: 'MyApp', description: 'Produktname' },
      { key: 'tagline', placeholder: 'The best way to...', description: 'Tagline/Slogan' },
      { key: 'features', placeholder: 'Feature 1, Feature 2', description: 'Hauptfeatures' },
    ],
    prompt: `/workflow saas-landing

Erstelle eine hochkonvertierende SaaS Landing Page:

PRODUKT:
- Name: [{{product_name}}]
- Tagline: [{{tagline}}]
- Hauptfeatures: [{{features}}]

SEKTIONEN:
1. Hero mit animiertem CTA
2. Problem → Solution Story
3. Feature Showcase mit Icons
4. Social Proof / Testimonials
5. Pricing Table (3 Tiers)
6. FAQ Accordion
7. Final CTA

TECHNISCH:
- Next.js 14+ mit App Router
- Tailwind CSS
- Framer Motion für Animationen
- Lighthouse Score 100
- SEO-optimierte Meta-Tags
- Analytics-ready (GA4 / Plausible)`,
  },

  // === TIER 2: High ROI ===
  {
    id: 'website-clone',
    name: 'Website Clone & Modernize',
    description: 'Bestehende Website klonen und mit modernem Stack neu aufbauen',
    category: 'development',
    tags: ['clone', 'modernize', 'migration', 'refactor'],
    tier: 2,
    estimatedTime: '10-30 min',
    recommendAutonom: true,
    variables: [
      { key: 'url', placeholder: 'https://example.com', description: 'URL der zu klonenden Website' },
      { key: 'verbesserungen', placeholder: 'Dark Mode, Mobile', description: 'Gewünschte Verbesserungen' },
    ],
    prompt: `/workflow clone-modernize

Klone und modernisiere diese Website:

SOURCE: [{{url}}]

MODERNISIERUNGEN:
- [{{verbesserungen}}]
- Performance-Optimierung
- Accessibility (WCAG 2.1 AA)
- SEO-Verbesserungen

TECH-STACK:
- Next.js 14+ App Router
- Tailwind CSS
- TypeScript
- Responsive Design

AUSGABE:
- Vollständiger Code
- README mit Setup-Anleitung
- Deployment-Config (Vercel/Netlify)`,
  },
  {
    id: 'rapid-prototype',
    name: 'Rapid Prototype',
    description: 'Schnell einen funktionsfähigen Prototyp erstellen für MVP-Validierung',
    category: 'development',
    tags: ['prototype', 'mvp', 'rapid', 'validation'],
    tier: 2,
    estimatedTime: '15-45 min',
    recommendAutonom: true,
    variables: [
      { key: 'idea', placeholder: 'Task Management App', description: 'Produktidee' },
      { key: 'core_features', placeholder: 'Tasks, Lists, Sharing', description: 'Kernfeatures (3-5)' },
    ],
    prompt: `/workflow rapid-prototype

Erstelle einen funktionsfähigen Prototyp:

IDEE: [{{idea}}]

KERN-FEATURES:
[{{core_features}}]

ANFORDERUNGEN:
- Funktionsfähige Demo (kein Mock)
- Schönes, modernes UI
- Mobile-responsive
- Authentifizierung (optional)
- Datenbank (SQLite/Supabase)

TECH-STACK:
- Next.js 14+ oder Astro
- Tailwind CSS + shadcn/ui
- TypeScript
- Lokale Datenpersistenz`,
  },
  {
    id: 'api-builder',
    name: 'REST API Builder',
    description: 'Vollständige REST API mit Auth, Validation und Dokumentation',
    category: 'development',
    tags: ['api', 'rest', 'backend', 'auth', 'swagger'],
    tier: 2,
    estimatedTime: '10-25 min',
    recommendAutonom: true,
    variables: [
      { key: 'resource', placeholder: 'users', description: 'Hauptressource' },
      { key: 'features', placeholder: 'CRUD, Auth, Pagination', description: 'API Features' },
    ],
    prompt: `/workflow api-builder

Erstelle eine vollständige REST API:

RESSOURCE: [{{resource}}]
FEATURES: [{{features}}]

ENDPOINTS:
- GET /api/{{resource}} - Liste mit Pagination
- GET /api/{{resource}}/:id - Einzelnes Item
- POST /api/{{resource}} - Erstellen
- PUT /api/{{resource}}/:id - Aktualisieren
- DELETE /api/{{resource}}/:id - Löschen

ANFORDERUNGEN:
- Input Validation (Zod)
- Error Handling
- Rate Limiting
- JWT Authentication
- OpenAPI/Swagger Dokumentation
- Tests (Vitest)`,
  },
  {
    id: 'deploy-pipeline',
    name: 'One-Click Deploy',
    description: 'Projekt auf Vercel, Netlify, Cloudflare oder Hetzner deployen',
    category: 'development',
    tags: ['deploy', 'vercel', 'netlify', 'cloudflare', 'ci-cd'],
    tier: 2,
    estimatedTime: '2-5 min',
    recommendAutonom: true,
    variables: [
      { key: 'platform', placeholder: 'vercel', description: 'Deploy Platform' },
      { key: 'project_path', placeholder: './my-project', description: 'Projekt-Pfad' },
    ],
    prompt: `/deploy [{{platform}}]

Deploye das Projekt:

PROJEKT: [{{project_path}}]
PLATFORM: [{{platform}}]

SCHRITTE:
1. Build verifizieren
2. Environment Variables prüfen
3. Production Build erstellen
4. Deploy ausführen
5. Domain/URL zurückgeben

OPTIONEN:
- Production: true
- Preview: false`,
  },

  // === TIER 3: Productivity ===
  {
    id: 'doc-generator',
    name: 'Documentation Generator',
    description: 'Automatische Dokumentation für Code, APIs und Projekte erstellen',
    category: 'productivity',
    tags: ['docs', 'readme', 'api-docs', 'jsdoc'],
    tier: 3,
    estimatedTime: '5-15 min',
    recommendAutonom: false,
    variables: [
      { key: 'project_path', placeholder: './src', description: 'Zu dokumentierender Pfad' },
      { key: 'type', placeholder: 'README', description: 'Dokumentationstyp' },
    ],
    prompt: `/workflow documentation

Erstelle Dokumentation für:

PFAD: [{{project_path}}]
TYP: [{{type}}]

AUSGABE:
- README.md mit Projektübersicht
- API-Dokumentation (falls API)
- Setup-Anleitung
- Beispiele und Code-Snippets
- Changelog (falls Git-History)

FORMAT:
- Markdown
- Klare Struktur
- Code-Beispiele
- Mermaid-Diagramme (optional)`,
  },
  {
    id: 'impressum-generator',
    name: 'Impressum Generator',
    description: 'Rechtskonformes Impressum nach TMG/DDG für Deutschland',
    category: 'legal',
    tags: ['impressum', 'legal', 'germany', 'tmg'],
    tier: 3,
    estimatedTime: '1-2 min',
    recommendAutonom: false,
    variables: [
      { key: 'firma', placeholder: 'Mustermann GmbH', description: 'Firmenname' },
      { key: 'inhaber', placeholder: 'Max Mustermann', description: 'Inhaber/Geschäftsführer' },
      { key: 'adresse', placeholder: 'Musterstr. 1, 12345 Musterstadt', description: 'Geschäftsadresse' },
    ],
    prompt: `/workflow impressum

Erstelle ein rechtskonformes Impressum:

ANGABEN:
- Firma: [{{firma}}]
- Inhaber/GF: [{{inhaber}}]
- Adresse: [{{adresse}}]
- E-Mail: [kontakt@...]
- Telefon: [+49 ...]
- USt-IdNr: [DE...]
- Handelsregister: [HRB ...]
- Aufsichtsbehörde: [falls erforderlich]

PRÜFE:
- TMG §5 Anforderungen
- DDG Anforderungen (neu)
- Berufsrechtliche Angaben (falls nötig)`,
  },
  {
    id: 'agb-generator',
    name: 'AGB Generator',
    description: 'Allgemeine Geschäftsbedingungen für Online-Shops und Dienstleister',
    category: 'legal',
    tags: ['agb', 'legal', 'germany', 'terms'],
    tier: 3,
    estimatedTime: '5-10 min',
    recommendAutonom: false,
    variables: [
      { key: 'business_type', placeholder: 'Online-Shop', description: 'Geschäftstyp' },
      { key: 'firma', placeholder: 'Mustermann GmbH', description: 'Firmenname' },
    ],
    prompt: `/workflow agb

Erstelle rechtskonforme AGB für:

GESCHÄFT:
- Typ: [{{business_type}}]
- Firma: [{{firma}}]
- Zielgruppe: [B2C / B2B / Beide]

INHALTE:
1. Geltungsbereich
2. Vertragsschluss
3. Preise und Zahlung
4. Lieferung
5. Widerrufsrecht (B2C)
6. Gewährleistung
7. Haftung
8. Datenschutz (Verweis)
9. Schlussbestimmungen

HINWEIS: Rechtliche Prüfung empfohlen!`,
  },
  {
    id: 'newsletter-setup',
    name: 'Newsletter Setup',
    description: 'DSGVO-konformes Newsletter-System mit Double-Opt-In',
    category: 'productivity',
    tags: ['newsletter', 'email', 'marketing', 'gdpr'],
    tier: 3,
    estimatedTime: '5-10 min',
    recommendAutonom: false,
    variables: [
      { key: 'provider', placeholder: 'Brevo', description: 'Newsletter-Provider' },
      { key: 'website', placeholder: 'example.com', description: 'Website für Integration' },
    ],
    prompt: `/workflow newsletter

Richte ein DSGVO-konformes Newsletter-System ein:

PROVIDER: [{{provider}}]
WEBSITE: [{{website}}]

KOMPONENTEN:
1. Anmeldeformular (React)
2. Double-Opt-In Flow
3. Abmelde-Link
4. Datenschutz-Checkbox
5. API-Integration

FEATURES:
- Responsive Form Design
- Validierung
- Erfolgsmeldung
- Error Handling
- Analytics Tracking`,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Umfassende Code-Analyse mit Verbesserungsvorschlägen',
    category: 'productivity',
    tags: ['review', 'quality', 'refactor', 'best-practices'],
    tier: 3,
    estimatedTime: '5-15 min',
    recommendAutonom: false,
    variables: [
      { key: 'file_path', placeholder: './src/components', description: 'Zu prüfender Code-Pfad' },
      { key: 'focus', placeholder: 'performance', description: 'Review-Fokus' },
    ],
    prompt: `Führe ein Code-Review durch:

PFAD: [{{file_path}}]
FOKUS: [{{focus}}]

PRÜFE:
1. Code-Qualität und Lesbarkeit
2. Performance-Probleme
3. Security-Issues
4. Best Practices
5. TypeScript-Typisierung
6. Error Handling

AUSGABE:
- Problemliste mit Priorität
- Konkrete Verbesserungsvorschläge
- Code-Beispiele für Fixes`,
  },
  {
    id: 'component-builder',
    name: 'React Component Builder',
    description: 'Wiederverwendbare React-Komponente mit TypeScript und Tests',
    category: 'development',
    tags: ['react', 'component', 'typescript', 'testing'],
    tier: 3,
    estimatedTime: '5-10 min',
    recommendAutonom: false,
    variables: [
      { key: 'name', placeholder: 'Button', description: 'Komponenten-Name' },
      { key: 'features', placeholder: 'variants, sizes, loading', description: 'Features' },
    ],
    prompt: `Erstelle eine React-Komponente:

NAME: [{{name}}]
FEATURES: [{{features}}]

ANFORDERUNGEN:
- TypeScript mit strikter Typisierung
- Props Interface
- Tailwind CSS Styling
- Varianten (primary, secondary, etc.)
- Accessibility (ARIA)
- Storybook Story
- Unit Tests (Vitest)

AUSGABE:
- Komponenten-Datei
- Types-Datei
- Test-Datei
- Story-Datei (optional)`,
  },
];

// Helper functions
export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return promptTemplates.filter(t => t.category === category);
}

export function getTemplatesByTier(tier: 1 | 2 | 3): PromptTemplate[] {
  return promptTemplates.filter(t => t.tier === tier);
}

export function searchTemplates(query: string): PromptTemplate[] {
  const q = query.toLowerCase();
  return promptTemplates.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

export const categoryLabels: Record<PromptTemplate['category'], string> = {
  'business-de': 'Deutschland',
  'business-eu': 'Europa',
  'business-us': 'USA/Global',
  'development': 'Development',
  'productivity': 'Produktivität',
  'legal': 'Legal',
};

export const categoryIcons: Record<PromptTemplate['category'], string> = {
  'business-de': '🇩🇪',
  'business-eu': '🇪🇺',
  'business-us': '🇺🇸',
  'development': '💻',
  'productivity': '⚡',
  'legal': '⚖️',
};
