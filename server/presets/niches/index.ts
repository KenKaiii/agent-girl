/**
 * Niche-Specific Templates & Configurations
 * Auto-selects sections, SEO schema, and content structure based on business type
 */

export interface NicheSection {
  id: string;
  name: string;
  description: string;
  variants?: string[]; // Different layout variants
}

export interface NicheConfig {
  id: string;
  name: string;
  description: string;
  keywords: string[]; // For matching user input
  recommendedDesignSystem: string;
  sections: {
    required: NicheSection[];
    optional: NicheSection[];
  };
  seo: {
    schema: string; // Schema.org type
    localSEO: boolean;
    trustSignals: string[];
  };
  contentPrompts: {
    hero: string;
    about: string;
    services: string;
    cta: string;
  };
  imagePrompts: {
    hero: string;
    features: string;
    team: string;
    background: string;
  };
  integrations: string[];
  legalRequirements?: string[];
}

// Section definitions
const SECTIONS: Record<string, NicheSection> = {
  hero: {
    id: 'hero',
    name: 'Hero Section',
    description: 'Main banner with headline, subheadline, and CTA',
    variants: ['centered', 'split', 'video-background', 'slider', 'minimal'],
  },
  features: {
    id: 'features',
    name: 'Features/Services',
    description: 'Grid of features or services with icons',
    variants: ['grid-3', 'grid-4', 'alternating', 'cards', 'icons-only'],
  },
  about: {
    id: 'about',
    name: 'About Section',
    description: 'Company/personal story and values',
    variants: ['image-left', 'image-right', 'stats', 'timeline'],
  },
  testimonials: {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Customer reviews and social proof',
    variants: ['carousel', 'grid', 'featured', 'video-testimonials'],
  },
  team: {
    id: 'team',
    name: 'Team Section',
    description: 'Team member profiles',
    variants: ['grid', 'carousel', 'detailed', 'minimal'],
  },
  pricing: {
    id: 'pricing',
    name: 'Pricing Tables',
    description: 'Pricing plans and packages',
    variants: ['3-column', '2-column', 'toggle-monthly-yearly', 'comparison'],
  },
  faq: {
    id: 'faq',
    name: 'FAQ Section',
    description: 'Frequently asked questions',
    variants: ['accordion', 'two-column', 'categorized'],
  },
  contact: {
    id: 'contact',
    name: 'Contact Section',
    description: 'Contact form and information',
    variants: ['form-only', 'form-with-info', 'split', 'minimal'],
  },
  location: {
    id: 'location',
    name: 'Location/Map',
    description: 'Google Maps and address',
    variants: ['map-full', 'map-with-info', 'multiple-locations'],
  },
  cta: {
    id: 'cta',
    name: 'Call to Action',
    description: 'Conversion-focused banner',
    variants: ['simple', 'with-image', 'newsletter', 'app-download'],
  },
  gallery: {
    id: 'gallery',
    name: 'Image Gallery',
    description: 'Photo gallery or portfolio',
    variants: ['masonry', 'grid', 'carousel', 'lightbox'],
  },
  logos: {
    id: 'logos',
    name: 'Client Logos',
    description: 'Partner/client logo showcase',
    variants: ['static', 'carousel', 'with-testimonials'],
  },
  blog: {
    id: 'blog',
    name: 'Blog Preview',
    description: 'Latest blog posts',
    variants: ['grid-3', 'featured-large', 'list', 'minimal'],
  },
  products: {
    id: 'products',
    name: 'Products Section',
    description: 'Product showcase',
    variants: ['grid', 'carousel', 'featured', 'categories'],
  },
  menu: {
    id: 'menu',
    name: 'Menu/Services List',
    description: 'Detailed service or menu listing',
    variants: ['categorized', 'tabbed', 'accordion', 'cards'],
  },
  hours: {
    id: 'hours',
    name: 'Opening Hours',
    description: 'Business hours display',
    variants: ['table', 'inline', 'with-special-hours'],
  },
  booking: {
    id: 'booking',
    name: 'Booking/Reservation',
    description: 'Appointment or reservation widget',
    variants: ['calendar', 'form', 'external-widget'],
  },
  caseStudies: {
    id: 'caseStudies',
    name: 'Case Studies',
    description: 'Detailed project showcases',
    variants: ['grid', 'detailed', 'slider'],
  },
  process: {
    id: 'process',
    name: 'Process/How It Works',
    description: 'Step-by-step workflow',
    variants: ['numbered', 'timeline', 'icons', 'interactive'],
  },
  stats: {
    id: 'stats',
    name: 'Statistics',
    description: 'Key numbers and achievements',
    variants: ['counters', 'static', 'with-icons'],
  },
  newsletter: {
    id: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Email subscription form',
    variants: ['inline', 'popup', 'footer'],
  },
  video: {
    id: 'video',
    name: 'Video Section',
    description: 'Embedded video content',
    variants: ['youtube', 'vimeo', 'self-hosted', 'background'],
  },
};

export const NICHE_CONFIGS: Record<string, NicheConfig> = {
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    description: 'Doctors, dentists, clinics, therapists',
    keywords: ['arzt', 'doctor', 'zahnarzt', 'dentist', 'klinik', 'clinic', 'praxis', 'therapist', 'physiotherapie', 'healthcare', 'medical', 'health'],
    recommendedDesignSystem: 'corporate',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.features, // Services
        SECTIONS.team,
        SECTIONS.testimonials,
        SECTIONS.contact,
        SECTIONS.location,
      ],
      optional: [
        SECTIONS.faq,
        SECTIONS.hours,
        SECTIONS.booking,
        SECTIONS.blog,
        SECTIONS.gallery,
      ],
    },
    seo: {
      schema: 'MedicalBusiness',
      localSEO: true,
      trustSignals: ['Certifications', 'Years of Experience', 'Patient Reviews', 'Insurance Partners'],
    },
    contentPrompts: {
      hero: 'Caring, professional healthcare headline emphasizing patient wellbeing and expertise',
      about: 'Story of the practice, qualifications, patient-centered approach',
      services: 'Medical services with clear, non-intimidating descriptions',
      cta: 'Appointment booking focused, emphasizing easy access to care',
    },
    imagePrompts: {
      hero: 'Modern medical clinic interior, bright and welcoming, professional equipment, soft lighting, clean white and blue color scheme, photorealistic',
      features: 'Medical service icons, clean line art, professional healthcare symbols',
      team: 'Professional medical staff portraits, white coats, friendly smiles, neutral background',
      background: 'Abstract medical patterns, subtle DNA helixes, soft blue tones',
    },
    integrations: ['Google Maps', 'Doctolib', 'Calendly', 'Contact Form'],
    legalRequirements: ['Impressum', 'Datenschutz', 'Berufsordnung Hinweis'],
  },

  saas: {
    id: 'saas',
    name: 'SaaS & Software',
    description: 'Software products, apps, digital tools',
    keywords: ['saas', 'software', 'app', 'tool', 'platform', 'startup', 'tech'],
    recommendedDesignSystem: 'modern',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.features,
        SECTIONS.pricing,
        SECTIONS.testimonials,
        SECTIONS.cta,
        SECTIONS.faq,
      ],
      optional: [
        SECTIONS.video,
        SECTIONS.logos,
        SECTIONS.caseStudies,
        SECTIONS.blog,
        SECTIONS.process,
        SECTIONS.stats,
      ],
    },
    seo: {
      schema: 'SoftwareApplication',
      localSEO: false,
      trustSignals: ['Customer Count', 'Uptime SLA', 'Security Badges', 'Integrations'],
    },
    contentPrompts: {
      hero: 'Bold value proposition, emphasizing productivity/efficiency gains',
      about: 'Company mission, team expertise, technology approach',
      services: 'Feature highlights with clear benefits, not just features',
      cta: 'Free trial or demo focused, low-friction signup',
    },
    imagePrompts: {
      hero: 'Abstract 3D illustration of connected data nodes, gradient purple to blue, floating geometric shapes, modern tech aesthetic',
      features: 'Isometric 3D icons representing software features, clean gradients, modern style',
      team: 'Casual tech team portraits, modern office setting, diverse group',
      background: 'Abstract gradient mesh, soft tech patterns, grid elements',
    },
    integrations: ['Stripe', 'Analytics', 'Intercom', 'HubSpot'],
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce & Retail',
    description: 'Online shops, product sales',
    keywords: ['shop', 'store', 'ecommerce', 'products', 'verkauf', 'online shop', 'retail'],
    recommendedDesignSystem: 'modern',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.products,
        SECTIONS.testimonials,
        SECTIONS.faq,
        SECTIONS.contact,
      ],
      optional: [
        SECTIONS.gallery,
        SECTIONS.newsletter,
        SECTIONS.blog,
        SECTIONS.logos,
        SECTIONS.process,
      ],
    },
    seo: {
      schema: 'Product',
      localSEO: false,
      trustSignals: ['Customer Reviews', 'Secure Payment', 'Return Policy', 'Shipping Info'],
    },
    contentPrompts: {
      hero: 'Product-focused headline with clear value proposition',
      about: 'Brand story, craftsmanship, quality commitment',
      services: 'Product categories and unique selling points',
      cta: 'Shop now, limited offers, urgency elements',
    },
    imagePrompts: {
      hero: 'Lifestyle product photography, clean white background or contextual setting, professional lighting',
      features: 'Product detail shots, texture and quality focus, studio lighting',
      team: 'Behind the scenes of production, craftsmanship',
      background: 'Subtle product patterns, brand-colored abstracts',
    },
    integrations: ['Shopify', 'Stripe', 'PayPal', 'Klarna', 'Trustpilot'],
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Food',
    description: 'Restaurants, cafes, bars, catering',
    keywords: ['restaurant', 'cafe', 'bar', 'food', 'essen', 'gastronomie', 'bistro', 'catering'],
    recommendedDesignSystem: 'premiumDark',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.menu,
        SECTIONS.gallery,
        SECTIONS.testimonials,
        SECTIONS.location,
        SECTIONS.hours,
      ],
      optional: [
        SECTIONS.about,
        SECTIONS.booking,
        SECTIONS.team,
        SECTIONS.blog,
        SECTIONS.newsletter,
      ],
    },
    seo: {
      schema: 'Restaurant',
      localSEO: true,
      trustSignals: ['Google Reviews', 'Tripadvisor', 'Awards', 'Press Mentions'],
    },
    contentPrompts: {
      hero: 'Appetizing, atmospheric headline evoking taste and experience',
      about: 'Chef story, ingredient philosophy, restaurant history',
      services: 'Menu descriptions that make mouths water',
      cta: 'Reservation focused, special events, delivery options',
    },
    imagePrompts: {
      hero: 'Gourmet dish presentation, warm ambient lighting, shallow depth of field, appetizing food photography',
      features: 'Individual dish photography, styled plating, professional food photography',
      team: 'Chef and staff portraits, kitchen action shots, personality',
      background: 'Restaurant interior atmosphere, warm lighting, elegant ambiance',
    },
    integrations: ['OpenTable', 'Google Maps', 'Lieferando', 'Instagram Feed'],
    legalRequirements: ['Impressum', 'Allergene', 'Datenschutz'],
  },

  portfolio: {
    id: 'portfolio',
    name: 'Portfolio & Creative',
    description: 'Designers, photographers, artists, freelancers',
    keywords: ['portfolio', 'designer', 'photographer', 'artist', 'freelancer', 'creative', 'fotograf'],
    recommendedDesignSystem: 'minimal',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.gallery, // Work
        SECTIONS.about,
        SECTIONS.contact,
      ],
      optional: [
        SECTIONS.testimonials,
        SECTIONS.process,
        SECTIONS.blog,
        SECTIONS.caseStudies,
        SECTIONS.logos,
      ],
    },
    seo: {
      schema: 'Person',
      localSEO: false,
      trustSignals: ['Clients', 'Awards', 'Publications', 'Years Experience'],
    },
    contentPrompts: {
      hero: 'Personality-driven, showcasing unique style and approach',
      about: 'Personal story, creative philosophy, what drives the work',
      services: 'Service offerings with examples of past work',
      cta: 'Collaboration/inquiry focused, personal connection',
    },
    imagePrompts: {
      hero: 'Abstract creative background, paint splashes or geometric patterns, artistic style',
      features: 'Work samples, project thumbnails, consistent editing style',
      team: 'Personal portrait, creative setting, personality showing',
      background: 'Textured paper, canvas, or subtle creative patterns',
    },
    integrations: ['Calendly', 'Behance', 'Dribbble', 'Instagram'],
  },

  agency: {
    id: 'agency',
    name: 'Agency & Consulting',
    description: 'Marketing agencies, consultants, professional services',
    keywords: ['agency', 'agentur', 'consulting', 'beratung', 'marketing', 'digital agency'],
    recommendedDesignSystem: 'modern',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.features, // Services
        SECTIONS.caseStudies,
        SECTIONS.team,
        SECTIONS.testimonials,
        SECTIONS.contact,
      ],
      optional: [
        SECTIONS.process,
        SECTIONS.logos,
        SECTIONS.blog,
        SECTIONS.pricing,
        SECTIONS.stats,
        SECTIONS.faq,
      ],
    },
    seo: {
      schema: 'ProfessionalService',
      localSEO: true,
      trustSignals: ['Clients Served', 'Team Size', 'Years in Business', 'Industry Awards'],
    },
    contentPrompts: {
      hero: 'Results-focused headline, emphasizing outcomes over process',
      about: 'Agency story, methodology, team expertise',
      services: 'Service descriptions with measurable outcomes',
      cta: 'Strategy call or audit focused',
    },
    imagePrompts: {
      hero: 'Modern office space, team collaboration, creative environment',
      features: 'Abstract service illustrations, isometric business concepts',
      team: 'Professional team portraits, approachable, diverse',
      background: 'Subtle grid patterns, data visualization elements',
    },
    integrations: ['Calendly', 'HubSpot', 'Slack', 'Analytics'],
  },

  localBusiness: {
    id: 'localBusiness',
    name: 'Local Business',
    description: 'Local shops, services, small businesses',
    keywords: ['local', 'lokal', 'handwerk', 'service', 'dienstleistung', 'shop', 'laden'],
    recommendedDesignSystem: 'corporate',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.features, // Services
        SECTIONS.about,
        SECTIONS.testimonials,
        SECTIONS.location,
        SECTIONS.contact,
        SECTIONS.hours,
      ],
      optional: [
        SECTIONS.gallery,
        SECTIONS.team,
        SECTIONS.faq,
        SECTIONS.blog,
        SECTIONS.booking,
      ],
    },
    seo: {
      schema: 'LocalBusiness',
      localSEO: true,
      trustSignals: ['Google Reviews', 'Years in Business', 'Local Awards', 'Certifications'],
    },
    contentPrompts: {
      hero: 'Community-focused, local trust, personal service emphasis',
      about: 'Local roots, family history, community involvement',
      services: 'Clear service descriptions with local relevance',
      cta: 'Visit us or call now focused',
    },
    imagePrompts: {
      hero: 'Storefront or service in action, friendly staff, local feel',
      features: 'Service-specific imagery, professional quality',
      team: 'Owner and staff portraits, approachable, trustworthy',
      background: 'Local area, community elements, warm tones',
    },
    integrations: ['Google Maps', 'Google Business Profile', 'WhatsApp', 'Phone Click-to-Call'],
    legalRequirements: ['Impressum', 'Datenschutz'],
  },

  realestate: {
    id: 'realestate',
    name: 'Real Estate',
    description: 'Real estate agents, property listings',
    keywords: ['immobilien', 'real estate', 'makler', 'property', 'wohnung', 'haus'],
    recommendedDesignSystem: 'premiumDark',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.products, // Listings
        SECTIONS.features, // Services
        SECTIONS.testimonials,
        SECTIONS.about,
        SECTIONS.contact,
      ],
      optional: [
        SECTIONS.team,
        SECTIONS.blog,
        SECTIONS.stats,
        SECTIONS.faq,
        SECTIONS.video,
      ],
    },
    seo: {
      schema: 'RealEstateAgent',
      localSEO: true,
      trustSignals: ['Properties Sold', 'Years Experience', 'Client Reviews', 'Certifications'],
    },
    contentPrompts: {
      hero: 'Dream home focused, lifestyle aspirations, local expertise',
      about: 'Agent expertise, market knowledge, success stories',
      services: 'Buying/selling process, unique advantages',
      cta: 'Free valuation or viewing request',
    },
    imagePrompts: {
      hero: 'Luxury property exterior, golden hour lighting, aspirational living',
      features: 'Property interior shots, lifestyle photography, beautiful homes',
      team: 'Professional realtor portraits, confident, trustworthy',
      background: 'Architectural elements, property patterns, elegant textures',
    },
    integrations: ['Immoscout24', 'Calendly', 'Virtual Tours', 'WhatsApp'],
  },

  fitness: {
    id: 'fitness',
    name: 'Fitness & Wellness',
    description: 'Gyms, personal trainers, yoga studios, spas',
    keywords: ['fitness', 'gym', 'yoga', 'personal trainer', 'wellness', 'spa', 'sport'],
    recommendedDesignSystem: 'modern',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.features, // Classes/Services
        SECTIONS.pricing,
        SECTIONS.team, // Trainers
        SECTIONS.testimonials,
        SECTIONS.contact,
        SECTIONS.location,
      ],
      optional: [
        SECTIONS.gallery,
        SECTIONS.hours,
        SECTIONS.booking,
        SECTIONS.blog,
        SECTIONS.faq,
      ],
    },
    seo: {
      schema: 'SportsActivityLocation',
      localSEO: true,
      trustSignals: ['Certifications', 'Member Success Stories', 'Years Experience', 'Equipment Quality'],
    },
    contentPrompts: {
      hero: 'Motivation-focused, transformation promise, energy-filled',
      about: 'Training philosophy, success stories, community focus',
      services: 'Class/program descriptions with benefits and results',
      cta: 'Free trial or first session offer',
    },
    imagePrompts: {
      hero: 'Dynamic fitness action shot, energetic movement, motivational atmosphere',
      features: 'Class and equipment photography, action shots, community vibe',
      team: 'Trainer portraits, fitness attire, motivational poses',
      background: 'Gym interior, equipment silhouettes, energetic gradients',
    },
    integrations: ['Mindbody', 'Calendly', 'Instagram Feed', 'Google Maps'],
  },

  education: {
    id: 'education',
    name: 'Education & Courses',
    description: 'Online courses, tutoring, schools',
    keywords: ['education', 'course', 'kurs', 'school', 'schule', 'tutoring', 'nachhilfe', 'lernen'],
    recommendedDesignSystem: 'playful',
    sections: {
      required: [
        SECTIONS.hero,
        SECTIONS.features, // Courses
        SECTIONS.testimonials,
        SECTIONS.pricing,
        SECTIONS.faq,
        SECTIONS.contact,
      ],
      optional: [
        SECTIONS.team, // Instructors
        SECTIONS.video,
        SECTIONS.blog,
        SECTIONS.stats,
        SECTIONS.process,
      ],
    },
    seo: {
      schema: 'EducationalOrganization',
      localSEO: false,
      trustSignals: ['Students Taught', 'Success Rate', 'Instructor Credentials', 'Reviews'],
    },
    contentPrompts: {
      hero: 'Transformation promise, skill acquisition, career advancement',
      about: 'Teaching philosophy, instructor expertise, success methodology',
      services: 'Course descriptions with learning outcomes',
      cta: 'Enroll now, free preview, or consultation',
    },
    imagePrompts: {
      hero: 'Learning environment, diverse students, engaged expressions',
      features: 'Educational icons, course topic illustrations, friendly graphics',
      team: 'Instructor portraits, approachable, knowledgeable appearance',
      background: 'Subtle educational patterns, notebooks, geometric learning shapes',
    },
    integrations: ['Teachable', 'Stripe', 'Calendly', 'Zoom'],
  },
};

/**
 * Detect niche from user input
 */
export function detectNiche(input: string): NicheConfig | null {
  const inputLower = input.toLowerCase();

  for (const config of Object.values(NICHE_CONFIGS)) {
    for (const keyword of config.keywords) {
      if (inputLower.includes(keyword)) {
        return config;
      }
    }
  }

  return null;
}

/**
 * Get all niches
 */
export function getAllNiches(): NicheConfig[] {
  return Object.values(NICHE_CONFIGS);
}

/**
 * Get niche by ID
 */
export function getNiche(id: string): NicheConfig | undefined {
  return NICHE_CONFIGS[id];
}

/**
 * Generate section order for a niche
 */
export function getSectionOrder(nicheId: string): string[] {
  const niche = NICHE_CONFIGS[nicheId];
  if (!niche) return [];

  const required = niche.sections.required.map(s => s.id);
  const optional = niche.sections.optional.map(s => s.id);

  return [...required, ...optional];
}

export default NICHE_CONFIGS;
