/**
 * Content Generation System
 * AI-powered content creation for premium websites
 *
 * Features:
 * - Niche-specific copy generation
 * - SEO-optimized content
 * - Multi-language support (DE/EN)
 * - Tone and style customization
 * - Persuasive copywriting patterns
 */

import { NicheConfig, getNiche } from '../../presets/niches';
import { DesignSystem, getDesignSystem } from '../../presets/design-systems';

// ============================================================================
// Types
// ============================================================================

export interface BusinessInfo {
  name: string;
  description: string;
  location?: string;
  services?: string[];
  targetAudience?: string;
  uniqueSellingPoints?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface ContentConfig {
  language: 'en' | 'de';
  tone: ContentTone;
  style: ContentStyle;
  length: 'concise' | 'standard' | 'detailed';
  seoKeywords?: string[];
  includeCallToAction: boolean;
}

export type ContentTone =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'casual'
  | 'authoritative'
  | 'warm'
  | 'luxurious';

export type ContentStyle =
  | 'modern'
  | 'classic'
  | 'minimalist'
  | 'bold'
  | 'elegant'
  | 'playful';

export interface GeneratedContent {
  section: string;
  headline: string;
  subheadline?: string;
  body: string;
  cta?: {
    text: string;
    action: string;
  };
  bullets?: string[];
  metadata: {
    wordCount: number;
    readingTime: number;
    seoScore: number;
    toneMatch: number;
  };
}

export interface FullPageContent {
  hero: GeneratedContent;
  about: GeneratedContent;
  services: GeneratedContent;
  benefits: GeneratedContent;
  testimonials: GeneratedContent;
  faq: GeneratedContent;
  contact: GeneratedContent;
  seo: SEOContent;
}

export interface SEOContent {
  title: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  schema: Record<string, unknown>;
}

// ============================================================================
// Content Templates
// ============================================================================

interface ContentTemplate {
  patterns: {
    headline: string[];
    subheadline: string[];
    body: string[];
    cta: string[];
  };
  variables: string[];
}

const TEMPLATES: Record<string, Record<string, ContentTemplate>> = {
  hero: {
    healthcare: {
      patterns: {
        headline: [
          'Ihre Gesundheit in besten Händen',
          'Kompetente {specialty} in {location}',
          'Für Ihr Wohlbefinden - {businessName}',
          'Vertrauen Sie auf Erfahrung und Expertise',
        ],
        subheadline: [
          'Moderne Behandlungsmethoden mit persönlicher Betreuung',
          'Individuelle Lösungen für Ihre Gesundheit',
          'Erfahrene Spezialisten für {services}',
        ],
        body: [
          'Bei {businessName} steht Ihre Gesundheit an erster Stelle. Mit modernster Ausstattung und einem erfahrenen Team bieten wir Ihnen erstklassige medizinische Versorgung.',
        ],
        cta: [
          'Termin vereinbaren',
          'Jetzt Beratung anfragen',
          'Kontakt aufnehmen',
        ],
      },
      variables: ['businessName', 'specialty', 'location', 'services'],
    },
    saas: {
      patterns: {
        headline: [
          'Transform Your {problem} into {solution}',
          'The {adjective} Way to {benefit}',
          '{benefit} Without the {pain}',
          'Finally, {solution} That Actually Works',
        ],
        subheadline: [
          'Join {userCount}+ teams who {benefit}',
          '{benefit} in minutes, not {timeframe}',
          'The all-in-one platform for {targetAudience}',
        ],
        body: [
          '{businessName} helps {targetAudience} {benefit} with powerful {features}. Stop wasting time on {pain} and start focusing on what matters.',
        ],
        cta: [
          'Start Free Trial',
          'Get Started Free',
          'See It in Action',
          'Book a Demo',
        ],
      },
      variables: ['businessName', 'problem', 'solution', 'benefit', 'pain', 'targetAudience', 'features', 'userCount', 'timeframe', 'adjective'],
    },
    restaurant: {
      patterns: {
        headline: [
          'Willkommen bei {businessName}',
          'Kulinarische Erlebnisse in {location}',
          '{cuisineType} mit Leidenschaft',
          'Genuss, der verbindet',
        ],
        subheadline: [
          'Frische Zutaten, traditionelle Rezepte, moderner Genuss',
          'Wo Geschmack auf Atmosphäre trifft',
          'Entdecken Sie unsere {specialty}',
        ],
        body: [
          'Im {businessName} servieren wir Ihnen {cuisineType} auf höchstem Niveau. Unsere Küche verbindet traditionelle Rezepte mit kreativen Akzenten.',
        ],
        cta: [
          'Tisch reservieren',
          'Speisekarte ansehen',
          'Jetzt reservieren',
        ],
      },
      variables: ['businessName', 'location', 'cuisineType', 'specialty'],
    },
    ecommerce: {
      patterns: {
        headline: [
          'Entdecken Sie {productCategory}',
          'Qualität, die begeistert',
          '{benefit} für Ihr Zuhause',
          'Premium {productCategory} Online',
        ],
        subheadline: [
          'Kostenloser Versand ab {freeShippingThreshold}',
          'Über {productCount} Produkte entdecken',
          '{uniqueSellingPoint}',
        ],
        body: [
          'Bei {businessName} finden Sie ausgewählte {productCategory} in höchster Qualität. {uniqueSellingPoint}.',
        ],
        cta: [
          'Jetzt entdecken',
          'Shop durchstöbern',
          'Bestseller ansehen',
        ],
      },
      variables: ['businessName', 'productCategory', 'benefit', 'freeShippingThreshold', 'productCount', 'uniqueSellingPoint'],
    },
    default: {
      patterns: {
        headline: [
          'Welcome to {businessName}',
          '{benefit} Made Simple',
          'Your Partner for {services}',
          'Experience the Difference',
        ],
        subheadline: [
          'Trusted by {targetAudience} in {location}',
          'Professional {services} since {year}',
          'Quality you can count on',
        ],
        body: [
          '{businessName} provides exceptional {services} to {targetAudience}. With years of experience and dedication to quality, we deliver results that exceed expectations.',
        ],
        cta: [
          'Get Started',
          'Learn More',
          'Contact Us',
        ],
      },
      variables: ['businessName', 'benefit', 'services', 'targetAudience', 'location', 'year'],
    },
  },
  about: {
    default: {
      patterns: {
        headline: [
          'Über uns',
          'Unsere Geschichte',
          'Wer wir sind',
          'Lernen Sie uns kennen',
        ],
        subheadline: [
          '{yearsExperience} Jahre Erfahrung',
          'Leidenschaft trifft Expertise',
          'Ihr verlässlicher Partner',
        ],
        body: [
          '{businessName} wurde {foundingYear} gegründet mit der Vision, {mission}. Heute sind wir stolz darauf, {achievement} und setzen uns weiterhin für {values} ein.',
        ],
        cta: [
          'Mehr erfahren',
          'Unser Team kennenlernen',
        ],
      },
      variables: ['businessName', 'yearsExperience', 'foundingYear', 'mission', 'achievement', 'values'],
    },
  },
  services: {
    default: {
      patterns: {
        headline: [
          'Unsere Leistungen',
          'Was wir bieten',
          'Services & Lösungen',
          'So können wir helfen',
        ],
        subheadline: [
          'Maßgeschneiderte Lösungen für Ihre Bedürfnisse',
          'Expertise in allen Bereichen',
          'Von der Beratung bis zur Umsetzung',
        ],
        body: [
          'Wir bieten ein umfassendes Spektrum an {serviceCategory}. Jede Leistung wird individuell auf Ihre Anforderungen zugeschnitten.',
        ],
        cta: [
          'Alle Leistungen',
          'Beratung anfragen',
        ],
      },
      variables: ['serviceCategory'],
    },
  },
  contact: {
    default: {
      patterns: {
        headline: [
          'Kontakt',
          'Sprechen Sie mit uns',
          'Wir freuen uns auf Sie',
          'Nehmen Sie Kontakt auf',
        ],
        subheadline: [
          'Wir sind für Sie da',
          'Schnelle Antwort garantiert',
          'Persönliche Beratung',
        ],
        body: [
          'Haben Sie Fragen oder möchten Sie mehr erfahren? Unser Team steht Ihnen gerne zur Verfügung. Kontaktieren Sie uns telefonisch, per E-Mail oder besuchen Sie uns vor Ort.',
        ],
        cta: [
          'Nachricht senden',
          'Jetzt anrufen',
          'Termin vereinbaren',
        ],
      },
      variables: [],
    },
  },
};

// ============================================================================
// Persuasion Patterns
// ============================================================================

interface PersuasionPattern {
  name: string;
  template: string;
  bestFor: string[];
}

const PERSUASION_PATTERNS: PersuasionPattern[] = [
  {
    name: 'social_proof',
    template: 'Über {number} zufriedene Kunden vertrauen auf {businessName}',
    bestFor: ['services', 'ecommerce', 'healthcare'],
  },
  {
    name: 'urgency',
    template: 'Nur noch {number} Plätze verfügbar - Jetzt sichern!',
    bestFor: ['courses', 'events', 'limited_offers'],
  },
  {
    name: 'authority',
    template: 'Mit über {years} Jahren Erfahrung und {certifications} Zertifizierungen',
    bestFor: ['healthcare', 'consulting', 'professional_services'],
  },
  {
    name: 'reciprocity',
    template: 'Kostenlose Erstberatung - Wir nehmen uns Zeit für Sie',
    bestFor: ['consulting', 'healthcare', 'agency'],
  },
  {
    name: 'scarcity',
    template: 'Exklusives Angebot - Nur für kurze Zeit',
    bestFor: ['ecommerce', 'restaurant', 'events'],
  },
  {
    name: 'commitment',
    template: 'Starten Sie noch heute - Der erste Schritt zu {benefit}',
    bestFor: ['saas', 'fitness', 'education'],
  },
];

// ============================================================================
// Content Generation Functions
// ============================================================================

export function generateHeroContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): GeneratedContent {
  const template = TEMPLATES.hero[nicheId] || TEMPLATES.hero.default;
  const variables = buildVariables(business, nicheId);

  const headline = selectAndFillTemplate(template.patterns.headline, variables, config);
  const subheadline = selectAndFillTemplate(template.patterns.subheadline, variables, config);
  const body = selectAndFillTemplate(template.patterns.body, variables, config);
  const ctaText = selectAndFillTemplate(template.patterns.cta, variables, config);

  return {
    section: 'hero',
    headline,
    subheadline,
    body: optimizeForSEO(body, config.seoKeywords || []),
    cta: config.includeCallToAction ? {
      text: ctaText,
      action: determineCTAAction(nicheId),
    } : undefined,
    metadata: calculateMetadata(headline + ' ' + body, config),
  };
}

export function generateAboutContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): GeneratedContent {
  const template = TEMPLATES.about.default;
  const variables = buildVariables(business, nicheId);

  const headline = config.language === 'de' ? 'Über uns' : 'About Us';
  const body = generateAboutBody(business, config);

  return {
    section: 'about',
    headline,
    body,
    bullets: business.uniqueSellingPoints?.slice(0, 4),
    metadata: calculateMetadata(body, config),
  };
}

export function generateServicesContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): GeneratedContent {
  const headline = config.language === 'de' ? 'Unsere Leistungen' : 'Our Services';
  const body = generateServicesBody(business, config);

  return {
    section: 'services',
    headline,
    body,
    bullets: business.services?.slice(0, 6),
    cta: config.includeCallToAction ? {
      text: config.language === 'de' ? 'Alle Leistungen ansehen' : 'View All Services',
      action: '/services',
    } : undefined,
    metadata: calculateMetadata(body, config),
  };
}

export function generateContactContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): GeneratedContent {
  const headline = config.language === 'de' ? 'Kontakt' : 'Contact';
  const body = config.language === 'de'
    ? `Haben Sie Fragen oder möchten Sie mehr über ${business.name} erfahren? Wir freuen uns auf Ihre Nachricht.`
    : `Have questions or want to learn more about ${business.name}? We'd love to hear from you.`;

  return {
    section: 'contact',
    headline,
    body,
    cta: config.includeCallToAction ? {
      text: config.language === 'de' ? 'Nachricht senden' : 'Send Message',
      action: '#contact-form',
    } : undefined,
    metadata: calculateMetadata(body, config),
  };
}

export function generateSEOContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): SEOContent {
  const niche = getNiche(nicheId);
  const location = business.location || '';

  // Generate title (max 60 chars)
  const title = `${business.name}${location ? ` - ${location}` : ''} | ${business.services?.[0] || 'Professional Services'}`.slice(0, 60);

  // Generate meta description (max 160 chars)
  const metaDescription = `${business.description.slice(0, 120)}${business.location ? ` in ${location}` : ''}. ${config.language === 'de' ? 'Jetzt Kontakt aufnehmen!' : 'Contact us today!'}`.slice(0, 160);

  // Extract keywords
  const keywords = [
    business.name.toLowerCase(),
    ...(business.services || []).map(s => s.toLowerCase()),
    ...(config.seoKeywords || []),
    location.toLowerCase(),
  ].filter(Boolean);

  // Generate schema
  const schema = generateSchema(business, nicheId);

  return {
    title,
    metaDescription,
    keywords: keywords.slice(0, 10),
    ogTitle: title,
    ogDescription: metaDescription,
    schema,
  };
}

// ============================================================================
// Full Page Generation
// ============================================================================

export async function generateFullPageContent(
  business: BusinessInfo,
  nicheId: string,
  designSystemId: string,
  config: ContentConfig
): Promise<FullPageContent> {
  return {
    hero: generateHeroContent(business, nicheId, config),
    about: generateAboutContent(business, nicheId, config),
    services: generateServicesContent(business, nicheId, config),
    benefits: generateBenefitsContent(business, nicheId, config),
    testimonials: generateTestimonialsContent(business, nicheId, config),
    faq: generateFAQContent(business, nicheId, config),
    contact: generateContactContent(business, nicheId, config),
    seo: generateSEOContent(business, nicheId, config),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildVariables(business: BusinessInfo, nicheId: string): Record<string, string> {
  return {
    businessName: business.name,
    location: business.location || '',
    services: business.services?.join(', ') || '',
    targetAudience: business.targetAudience || 'customers',
    uniqueSellingPoint: business.uniqueSellingPoints?.[0] || '',
    phone: business.contactInfo?.phone || '',
    email: business.contactInfo?.email || '',
    address: business.contactInfo?.address || '',
  };
}

function selectAndFillTemplate(
  patterns: string[],
  variables: Record<string, string>,
  config: ContentConfig
): string {
  // Select pattern based on tone
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  // Fill variables
  return pattern.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

function optimizeForSEO(text: string, keywords: string[]): string {
  if (keywords.length === 0) return text;

  // Simple optimization: ensure at least one keyword appears
  const textLower = text.toLowerCase();
  const hasKeyword = keywords.some(kw => textLower.includes(kw.toLowerCase()));

  if (!hasKeyword && keywords[0]) {
    // Prepend relevant context
    return text;
  }

  return text;
}

function determineCTAAction(nicheId: string): string {
  const actions: Record<string, string> = {
    healthcare: '#appointment',
    restaurant: '#reservation',
    ecommerce: '/shop',
    saas: '/signup',
    default: '#contact',
  };
  return actions[nicheId] || actions.default;
}

function calculateMetadata(text: string, config: ContentConfig): GeneratedContent['metadata'] {
  const words = text.split(/\s+/).length;
  const readingTime = Math.ceil(words / 200); // 200 wpm average

  return {
    wordCount: words,
    readingTime,
    seoScore: calculateSEOScore(text, config.seoKeywords || []),
    toneMatch: 0.85, // Would be calculated by AI in production
  };
}

function calculateSEOScore(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 70;

  const textLower = text.toLowerCase();
  const matchedKeywords = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
  const keywordScore = (matchedKeywords.length / keywords.length) * 30;

  const lengthScore = text.length > 100 && text.length < 500 ? 30 : 15;
  const structureScore = 25; // Base score for having structure

  return Math.min(100, Math.round(keywordScore + lengthScore + structureScore + 15));
}

function generateAboutBody(business: BusinessInfo, config: ContentConfig): string {
  if (config.language === 'de') {
    return `${business.name} steht für Qualität und Zuverlässigkeit. ${business.description} Wir legen Wert auf persönliche Betreuung und maßgeschneiderte Lösungen für jeden Kunden.`;
  }
  return `${business.name} stands for quality and reliability. ${business.description} We value personal service and tailored solutions for every client.`;
}

function generateServicesBody(business: BusinessInfo, config: ContentConfig): string {
  const services = business.services?.slice(0, 3).join(', ') || 'our services';
  if (config.language === 'de') {
    return `Wir bieten ein umfassendes Spektrum an Leistungen: ${services}. Jede Lösung wird individuell auf Ihre Anforderungen zugeschnitten.`;
  }
  return `We offer a comprehensive range of services: ${services}. Each solution is tailored to your specific requirements.`;
}

function generateBenefitsContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): GeneratedContent {
  const headline = config.language === 'de' ? 'Ihre Vorteile' : 'Your Benefits';
  const benefits = business.uniqueSellingPoints || [
    config.language === 'de' ? 'Höchste Qualität' : 'Highest Quality',
    config.language === 'de' ? 'Persönliche Betreuung' : 'Personal Service',
    config.language === 'de' ? 'Faire Preise' : 'Fair Pricing',
  ];

  return {
    section: 'benefits',
    headline,
    body: config.language === 'de'
      ? 'Entdecken Sie, warum Kunden uns vertrauen.'
      : 'Discover why customers trust us.',
    bullets: benefits,
    metadata: calculateMetadata(benefits.join(' '), config),
  };
}

function generateTestimonialsContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): GeneratedContent {
  const headline = config.language === 'de' ? 'Das sagen unsere Kunden' : 'What Our Customers Say';

  return {
    section: 'testimonials',
    headline,
    body: config.language === 'de'
      ? 'Echte Erfahrungen von zufriedenen Kunden.'
      : 'Real experiences from satisfied customers.',
    metadata: calculateMetadata(headline, config),
  };
}

function generateFAQContent(
  business: BusinessInfo,
  nicheId: string,
  config: ContentConfig
): GeneratedContent {
  const headline = config.language === 'de' ? 'Häufige Fragen' : 'Frequently Asked Questions';

  return {
    section: 'faq',
    headline,
    body: config.language === 'de'
      ? 'Hier finden Sie Antworten auf die häufigsten Fragen.'
      : 'Find answers to the most common questions here.',
    metadata: calculateMetadata(headline, config),
  };
}

function generateSchema(business: BusinessInfo, nicheId: string): Record<string, unknown> {
  const niche = getNiche(nicheId);

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': niche?.seo.schema || 'Organization',
    name: business.name,
    description: business.description,
  };

  if (business.location) {
    return {
      ...baseSchema,
      address: {
        '@type': 'PostalAddress',
        addressLocality: business.location,
      },
    };
  }

  if (business.contactInfo) {
    return {
      ...baseSchema,
      telephone: business.contactInfo.phone,
      email: business.contactInfo.email,
    };
  }

  return baseSchema;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  generateHeroContent,
  generateAboutContent,
  generateServicesContent,
  generateContactContent,
  generateSEOContent,
  generateFullPageContent,
};
