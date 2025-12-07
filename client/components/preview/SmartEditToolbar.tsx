/**
 * Agent Girl - Smart Edit Toolbar
 * Magic Formula: (Erwartungs-Gap × Speed) + (Qualität × Personalisierung) - Reibung
 *
 * Design Principles:
 * - < 5 second Time-to-Value
 * - Micro-interactions for 40% perceived quality boost
 * - Show > Tell (visual feedback over text)
 * - "I made this" co-creator positioning
 */

import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import {
  Type,
  Save,
  X,
  Sparkles,
  MousePointer2,
  Code,
  Image,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Zap,
  Heading,
  Link2,
  Grid,
  Layout,
  SquareStack,
  PanelTop,
  Menu,
  Rocket,
  FileText,
  PanelBottom,
  Sidebar,
} from 'lucide-react';
import type { SelectedElement } from './ElementSelector';

// Mac keyboard symbols
const KEY = {
  cmd: '⌘',
  shift: '⇧',
  alt: '⌥',
  ctrl: '⌃',
  enter: '⏎',
  esc: '⎋',
  delete: '⌫',
  tab: '⇥',
} as const;

// Animation keyframes CSS (injected once)
const ANIMATION_STYLES = `
@keyframes toolbar-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes toolbar-success {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes toolbar-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes toolbar-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes toolbar-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(168, 85, 247, 0.3); }
  50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.6); }
}
.toolbar-pulse { animation: toolbar-pulse 1.5s ease-in-out infinite; }
.toolbar-success { animation: toolbar-success 0.3s ease-out forwards; }
.toolbar-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200% 100%;
  animation: toolbar-shimmer 1.5s infinite;
}
.toolbar-bounce { animation: toolbar-bounce 0.5s ease-in-out; }
.toolbar-glow { animation: toolbar-glow 2s ease-in-out infinite; }
`;

// Inject animation styles once
if (typeof document !== 'undefined' && !document.getElementById('smart-toolbar-animations')) {
  const style = document.createElement('style');
  style.id = 'smart-toolbar-animations';
  style.textContent = ANIMATION_STYLES;
  document.head.appendChild(style);
}

// Edit history entry
interface EditHistoryEntry {
  id: string;
  timestamp: number;
  selector: string;
  type: 'text' | 'style' | 'ai';
  oldValue: string;
  newValue: string;
  element: SelectedElement;
}

// Page section for navigation
export interface PageSection {
  id: string;
  name: string;
  tag: string;
  selector: string;
  bounds: { x: number; y: number; width: number; height: number };
  elementCount: number;
  icon: 'header' | 'nav' | 'hero' | 'content' | 'footer' | 'sidebar' | 'section';
}

interface SmartEditToolbarProps {
  isActive: boolean;
  selectedElements: SelectedElement[];
  onClearSelection: () => void;
  onTextEdit: (selector: string, newText: string) => void;
  onAIEdit: (prompt: string, elements: SelectedElement[]) => void;
  onSendToChat?: (prompt: string) => void;  // Send prompt to chat for review/edit
  onLoadToChat: () => void;
  onFindInCode?: (element: SelectedElement) => void;
  onReplaceImage?: (element: SelectedElement) => void;
  onCopySelector?: (element: SelectedElement) => void;
  onDeleteElement?: (element: SelectedElement) => void;
  onToggleVisibility?: (element: SelectedElement) => void;
  onSelectParent?: (element: SelectedElement) => void;
  onSelectChild?: (element: SelectedElement) => void;
  // Section navigation
  sections?: PageSection[];
  currentSectionIndex?: number;
  onNavigateSection?: (direction: 'prev' | 'next' | number) => void;
  onSelectSection?: (section: PageSection) => void;
}

// Enhanced tooltip with animation
const Tooltip = memo(({ children, label, shortcut, color = 'gray' }: {
  children: React.ReactNode;
  label: string;
  shortcut?: string;
  color?: string;
}) => {
  const colorAccent = {
    gray: 'border-gray-600',
    blue: 'border-blue-500/50',
    green: 'border-green-500/50',
    orange: 'border-orange-500/50',
    purple: 'border-purple-500/50',
    red: 'border-red-500/50',
    amber: 'border-amber-500/50',
  }[color] || 'border-gray-600';

  return (
    <div className="group relative">
      {children}
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-900/95 backdrop-blur-sm border ${colorAccent} text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-xl transform scale-95 group-hover:scale-100`}>
        <span className="font-medium">{label}</span>
        {shortcut && (
          <span className="ml-2 px-1.5 py-0.5 rounded bg-black/30 text-gray-300 font-mono text-[9px]">{shortcut}</span>
        )}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900/95" />
      </div>
    </div>
  );
});

// Magic action button with micro-interactions
const ActionButton = memo(({
  onClick,
  icon: Icon,
  label,
  shortcut,
  color = 'gray',
  disabled = false,
  active = false,
  pulse = false,
  badge,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  shortcut?: string;
  color?: 'gray' | 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'amber';
  disabled?: boolean;
  active?: boolean;
  pulse?: boolean;
  badge?: string;
}) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    setClicked(true);
    onClick();
    setTimeout(() => setClicked(false), 200);
  }, [disabled, onClick]);

  const colors = {
    gray: {
      base: 'text-gray-400 hover:text-white',
      bg: 'hover:bg-white/10',
      active: 'bg-white/15 ring-1 ring-white/30 text-white',
      glow: '',
    },
    blue: {
      base: 'text-blue-400 hover:text-blue-300',
      bg: 'hover:bg-blue-500/20',
      active: 'bg-blue-500/25 ring-1 ring-blue-400/50 text-blue-300',
      glow: 'hover:shadow-blue-500/20 hover:shadow-lg',
    },
    green: {
      base: 'text-green-400 hover:text-green-300',
      bg: 'hover:bg-green-500/20',
      active: 'bg-green-500/25 ring-1 ring-green-400/50 text-green-300',
      glow: 'hover:shadow-green-500/20 hover:shadow-lg',
    },
    orange: {
      base: 'text-orange-400 hover:text-orange-300',
      bg: 'hover:bg-orange-500/20',
      active: 'bg-orange-500/25 ring-1 ring-orange-400/50 text-orange-300',
      glow: 'hover:shadow-orange-500/20 hover:shadow-lg',
    },
    purple: {
      base: 'text-purple-400 hover:text-purple-300',
      bg: 'hover:bg-purple-500/20',
      active: 'bg-purple-500/25 ring-1 ring-purple-400/50 text-purple-300',
      glow: 'hover:shadow-purple-500/20 hover:shadow-lg',
    },
    red: {
      base: 'text-red-400 hover:text-red-300',
      bg: 'hover:bg-red-500/20',
      active: 'bg-red-500/25 ring-1 ring-red-400/50 text-red-300',
      glow: '',
    },
    amber: {
      base: 'text-amber-400 hover:text-amber-300',
      bg: 'hover:bg-amber-500/20',
      active: 'bg-amber-500/25 ring-1 ring-amber-400/50 text-amber-300',
      glow: 'hover:shadow-amber-500/20 hover:shadow-lg',
    },
  };

  const c = colors[color];

  return (
    <Tooltip label={label} shortcut={shortcut} color={color}>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative p-1.5 rounded-lg transition-all duration-150 ${c.base} ${c.bg} ${c.glow}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${active ? c.active : ''}
          ${clicked ? 'scale-90' : 'hover:scale-105'}
          ${pulse ? 'toolbar-pulse' : ''}
        `}
      >
        <Icon size={14} className={clicked ? 'toolbar-bounce' : ''} />
        {badge && (
          <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-purple-500 text-[8px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>
    </Tooltip>
  );
});

// Separator with subtle gradient
const Separator = () => (
  <div className="w-px h-5 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />
);

// Prompt preset type with category
interface PromptPreset {
  id: string;
  label: string;
  prompt: string;
  emoji: string;
  category: 'quick' | 'astro' | 'design' | 'content' | 'seo' | 'performance' | 'autonomous';
}

// Comprehensive AI Prompts - 50 total (30 Astro + 20 Webdesign)
const ALL_PROMPTS: PromptPreset[] = [
  // === QUICK ACTIONS (Element-spezifisch) ===
  { id: 'improve', label: 'Verbessern', prompt: 'Verbessere dieses Element - moderner, ansprechender, professioneller', emoji: '✨', category: 'quick' },
  { id: 'simplify', label: 'Vereinfachen', prompt: 'Vereinfache dieses Element - weniger Text, klarere Aussage', emoji: '🎯', category: 'quick' },
  { id: 'punch', label: 'Mehr Impact', prompt: 'Mach diese Überschrift packender und aufmerksamkeitsstärker', emoji: '💥', category: 'quick' },
  { id: 'shorter', label: 'Kürzer', prompt: 'Kürze diesen Text auf das Wesentliche', emoji: '✂️', category: 'quick' },
  { id: 'cta', label: 'CTA verbessern', prompt: 'Mach diesen Call-to-Action überzeugender und handlungsorientierter', emoji: '🚀', category: 'quick' },

  // === ASTRO BEST PRACTICES (30) ===
  // Struktur & Layout
  { id: 'astro-layout', label: 'Layout optimieren', prompt: 'Analysiere diese Astro-Seite und optimiere das Layout mit @apply und Tailwind-Klassen für bessere Responsivität', emoji: '📐', category: 'astro' },
  { id: 'astro-components', label: 'Komponente extrahieren', prompt: 'Extrahiere wiederverwendbare Teile in separate Astro-Komponenten unter src/components/', emoji: '🧩', category: 'astro' },
  { id: 'astro-slots', label: 'Slots verwenden', prompt: 'Nutze Astro Slots für flexiblere Komponenten-Komposition', emoji: '🔲', category: 'astro' },
  { id: 'astro-layouts', label: 'Layout nutzen', prompt: 'Wende ein konsistentes Layout aus src/layouts/ an für einheitliches Design', emoji: '📋', category: 'astro' },
  { id: 'astro-sections', label: 'Sections strukturieren', prompt: 'Teile die Seite in semantische <section>-Blöcke mit klaren IDs für Navigation', emoji: '📑', category: 'astro' },

  // Performance
  { id: 'astro-islands', label: 'Island Architecture', prompt: 'Nutze client:visible oder client:idle für JavaScript-Komponenten zur Performance-Optimierung', emoji: '🏝️', category: 'astro' },
  { id: 'astro-images', label: 'Image optimieren', prompt: 'Ersetze <img> durch <Image> Komponente mit optimierten Formaten (webp/avif) und lazy loading', emoji: '🖼️', category: 'astro' },
  { id: 'astro-fonts', label: 'Fonts optimieren', prompt: 'Optimiere Font-Loading mit font-display: swap und lokalen Fallbacks', emoji: '🔤', category: 'astro' },
  { id: 'astro-prefetch', label: 'Prefetching', prompt: 'Füge data-astro-prefetch für wichtige Links hinzu für schnellere Navigation', emoji: '⚡', category: 'astro' },
  { id: 'astro-inline', label: 'Critical CSS', prompt: 'Inline kritisches CSS im <head> für schnelleres First Contentful Paint', emoji: '🎨', category: 'astro' },

  // SEO & Meta
  { id: 'astro-meta', label: 'Meta Tags', prompt: 'Füge vollständige Meta-Tags hinzu: title, description, og:image, twitter:card', emoji: '🏷️', category: 'astro' },
  { id: 'astro-schema', label: 'Schema.org', prompt: 'Füge strukturierte Daten (JSON-LD) für besseres SEO hinzu', emoji: '📊', category: 'astro' },
  { id: 'astro-sitemap', label: 'Sitemap Check', prompt: 'Stelle sicher, dass alle Seiten in der Sitemap sind und richtig priorisiert', emoji: '🗺️', category: 'astro' },
  { id: 'astro-canonical', label: 'Canonical URLs', prompt: 'Setze korrekte canonical URLs für alle Seiten', emoji: '🔗', category: 'astro' },
  { id: 'astro-robots', label: 'robots.txt', prompt: 'Prüfe und optimiere robots.txt für Crawler-Zugriff', emoji: '🤖', category: 'astro' },

  // Styling & Tailwind
  { id: 'astro-tailwind', label: 'Tailwind nutzen', prompt: 'Konvertiere inline Styles zu Tailwind-Utility-Klassen für konsistentes Design', emoji: '🌊', category: 'astro' },
  { id: 'astro-dark', label: 'Dark Mode', prompt: 'Füge Dark-Mode Unterstützung mit Tailwind dark: Prefix hinzu', emoji: '🌙', category: 'astro' },
  { id: 'astro-responsive', label: 'Responsive Design', prompt: 'Optimiere für alle Breakpoints: sm:, md:, lg:, xl: mit Mobile-First Ansatz', emoji: '📱', category: 'astro' },
  { id: 'astro-hover', label: 'Hover States', prompt: 'Füge ansprechende hover: und focus: States für Interaktivität hinzu', emoji: '👆', category: 'astro' },
  { id: 'astro-animations', label: 'Animationen', prompt: 'Füge subtile CSS-Animationen und Transitions für bessere UX hinzu', emoji: '✨', category: 'astro' },

  // Content & Markdown
  { id: 'astro-content', label: 'Content Collections', prompt: 'Nutze Astro Content Collections für strukturierte Inhalte', emoji: '📚', category: 'astro' },
  { id: 'astro-mdx', label: 'MDX nutzen', prompt: 'Erweitere Markdown mit MDX-Komponenten für reichere Inhalte', emoji: '📝', category: 'astro' },
  { id: 'astro-prose', label: 'Prose Styling', prompt: 'Wende @tailwindcss/typography prose Klassen für schöne Textformatierung an', emoji: '📖', category: 'astro' },

  // Integration & APIs
  { id: 'astro-api', label: 'API Endpoints', prompt: 'Erstelle API Endpoint in src/pages/api/ für dynamische Daten', emoji: '🔌', category: 'astro' },
  { id: 'astro-fetch', label: 'Data Fetching', prompt: 'Optimiere Daten-Fetching mit Astro.glob() oder fetch() im Frontmatter', emoji: '📥', category: 'astro' },
  { id: 'astro-env', label: 'Environment Vars', prompt: 'Nutze import.meta.env für sichere Umgebungsvariablen', emoji: '🔐', category: 'astro' },

  // Accessibility
  { id: 'astro-a11y', label: 'Accessibility', prompt: 'Verbessere Barrierefreiheit: ARIA-Labels, Kontrast, Fokus-Management', emoji: '♿', category: 'astro' },
  { id: 'astro-semantics', label: 'Semantik', prompt: 'Nutze semantische HTML5-Tags: main, article, aside, nav, header, footer', emoji: '🏗️', category: 'astro' },
  { id: 'astro-alt', label: 'Alt-Texte', prompt: 'Füge beschreibende alt-Texte für alle Bilder hinzu', emoji: '📸', category: 'astro' },
  { id: 'astro-skip', label: 'Skip Links', prompt: 'Füge Skip-to-Content Links für Tastaturnavigation hinzu', emoji: '⏭️', category: 'astro' },

  // === WEBDESIGN AI FUNKTIONEN (20) ===
  // Content Creation
  { id: 'design-headline', label: 'Headline Generator', prompt: 'Erstelle 5 alternative Headlines für diesen Bereich, fokussiert auf Nutzenversprechen und Emotion', emoji: '📢', category: 'content' },
  { id: 'design-tagline', label: 'Tagline', prompt: 'Generiere eine kurze, einprägsame Tagline (max 8 Wörter) für diese Section', emoji: '💡', category: 'content' },
  { id: 'design-cta-text', label: 'CTA Varianten', prompt: 'Erstelle 5 verschiedene Call-to-Action Texte mit unterschiedlichen Tonfällen', emoji: '🎯', category: 'content' },
  { id: 'design-benefits', label: 'Benefits Liste', prompt: 'Erstelle eine Liste von 5-7 klaren Vorteilen/Benefits für den Kunden', emoji: '✅', category: 'content' },
  { id: 'design-faq', label: 'FAQ generieren', prompt: 'Generiere 5 relevante FAQ-Einträge für diesen Bereich basierend auf dem Inhalt', emoji: '❓', category: 'content' },

  // Visual Design
  { id: 'design-gradient', label: 'Gradient Design', prompt: 'Erstelle einen modernen Farbverlauf-Hintergrund passend zum aktuellen Farbschema', emoji: '🌈', category: 'design' },
  { id: 'design-spacing', label: 'Whitespace', prompt: 'Optimiere Abstände und Whitespace für bessere visuelle Hierarchie und Lesbarkeit', emoji: '↔️', category: 'design' },
  { id: 'design-cards', label: 'Card Layout', prompt: 'Wandle diesen Bereich in ein ansprechendes Card-Grid-Layout um', emoji: '🃏', category: 'design' },
  { id: 'design-hero', label: 'Hero Section', prompt: 'Optimiere diese Hero-Section: großer Impact, klare Hierarchie, starker CTA', emoji: '🦸', category: 'design' },
  { id: 'design-testimonial', label: 'Testimonial', prompt: 'Erstelle ein ansprechendes Testimonial-Design mit Zitat, Name und Bild-Platzhalter', emoji: '💬', category: 'design' },

  // UX Improvements
  { id: 'design-form', label: 'Form UX', prompt: 'Verbessere dieses Formular: bessere Labels, Validierung, User Feedback', emoji: '📋', category: 'design' },
  { id: 'design-nav', label: 'Navigation', prompt: 'Optimiere die Navigation für bessere Usability und Mobile-Experience', emoji: '🧭', category: 'design' },
  { id: 'design-footer', label: 'Footer', prompt: 'Erstelle einen professionellen Footer mit Links, Social Media, Newsletter-Signup', emoji: '👇', category: 'design' },
  { id: 'design-cta-button', label: 'Button Design', prompt: 'Verbessere diesen Button: auffälliger, bessere hover-States, klare Affordance', emoji: '🔘', category: 'design' },
  { id: 'design-social-proof', label: 'Social Proof', prompt: 'Füge Social Proof hinzu: Logos, Kundenzahlen, Bewertungen, Auszeichnungen', emoji: '⭐', category: 'design' },

  // SEO & Performance
  { id: 'seo-title', label: 'SEO Title', prompt: 'Generiere einen SEO-optimierten Title-Tag (50-60 Zeichen) mit Keyword', emoji: '🔍', category: 'seo' },
  { id: 'seo-description', label: 'Meta Description', prompt: 'Erstelle eine überzeugende Meta-Description (150-160 Zeichen) mit Call-to-Action', emoji: '📝', category: 'seo' },
  { id: 'seo-headings', label: 'Heading Struktur', prompt: 'Optimiere die Heading-Hierarchie (H1-H6) für SEO und Lesbarkeit', emoji: '📊', category: 'seo' },
  { id: 'perf-lazy', label: 'Lazy Loading', prompt: 'Implementiere Lazy Loading für alle Bilder und iframes unterhalb des Folds', emoji: '💤', category: 'performance' },
  { id: 'perf-critical', label: 'Critical Path', prompt: 'Identifiziere und optimiere den kritischen Rendering-Pfad für schnelleres LCP', emoji: '⚡', category: 'performance' },

  // === AUTONOMOUS MASTER PROMPTS ===
  // ULTIMATIVER FULL-AUTONOM PROMPT - ERSTER UND WICHTIGSTER
  {
    id: 'auto-ultimate',
    label: '🔥 ULTIMATE AUTONOM',
    prompt: `# 🔥 ULTIMATIVER AUTONOMER WEBSITE-PERFEKTIONIERER

## ⚠️ KRITISCHE REGELN - LIES ZUERST
1. **KEINE FRAGEN STELLEN** - Handle einfach. Triff Entscheidungen selbst.
2. **KEINE BESTÄTIGUNGEN FORDERN** - Mache einfach weiter zum nächsten Schritt.
3. **BEI FEHLERN: FIX UND WEITER** - Nie stoppen, immer lösen.
4. **BIS ZU 100 SCHRITTE** - Arbeite bis ALLES perfekt ist.
5. **HALBFERTIGES FERTIGMACHEN** - Vervollständige alles was fehlt.

Du bist ein Elite Full-Stack Astro-Experte. Deine Mission: Diese Website PERFEKT machen.

---

## PHASE 1: VOLLSTÄNDIGE ANALYSE (Schritte 1-10)
1. Lies ALLE Dateien: src/**/*.astro, src/**/*.tsx, src/**/*.css
2. Analysiere package.json - fehlende Dependencies hinzufügen
3. Prüfe astro.config.mjs - optimiere Konfiguration
4. Identifiziere ALLE Probleme und Lücken
5. Erstelle mentale Checkliste was fehlt
6. Prüfe ob Layouts existieren
7. Prüfe ob Components strukturiert sind
8. Analysiere Content-Struktur
9. Identifiziere fehlende Seiten
10. Plane die komplette Optimierung

## PHASE 2: STRUKTUR & ARCHITEKTUR (Schritte 11-25)
11. Erstelle fehlende Layouts (Base.astro, Page.astro)
12. Erstelle SEO.astro Komponente mit ALLEN Meta-Tags
13. Erstelle Header.astro mit Navigation
14. Erstelle Footer.astro mit Links, Social, Legal
15. Erstelle 404.astro Error Page
16. Erstelle 500.astro Error Page
17. Strukturiere src/components/ sauber
18. Erstelle src/lib/ für Utilities
19. Erstelle src/content/ für Content Collections
20. Konfiguriere TypeScript strict mode
21. Füge alle nötigen Dependencies hinzu
22. Optimiere astro.config.mjs für Production
23. Erstelle .env.example
24. Erstelle robots.txt
25. Konfiguriere sitemap

## PHASE 3: PERFORMANCE MAXIMUM (Schritte 26-40)
26. Ersetze ALLE <img> durch <Image> mit format="avif"
27. Setze width/height für CLS=0
28. loading="lazy" für below-fold
29. loading="eager" für above-fold
30. Optimiere alle Fonts mit font-display: swap
31. Preload kritische Fonts
32. Implementiere Critical CSS
33. Code-Split JavaScript
34. Nutze client:visible statt client:load
35. Entferne ungenutzte Dependencies
36. Komprimiere alle Assets
37. Implementiere Prefetching
38. Optimiere Build für minimal Bundle
39. Prüfe und fixe Core Web Vitals
40. Ziel: Lighthouse 100/100

## PHASE 4: SEO VOLLSTÄNDIG (Schritte 41-55)
41. Title Tag optimiert (50-60 chars)
42. Meta Description (150-160 chars)
43. Open Graph Tags komplett
44. Twitter Card Tags
45. Canonical URLs
46. JSON-LD Organization Schema
47. JSON-LD WebPage Schema
48. JSON-LD BreadcrumbList
49. JSON-LD FAQPage (wenn FAQ vorhanden)
50. Heading Hierarchie (nur 1x H1)
51. Alt-Texte für ALLE Bilder
52. Interne Verlinkung optimieren
53. XML Sitemap generieren
54. robots.txt optimieren
55. Strukturierte Daten validieren

## PHASE 5: ACCESSIBILITY WCAG 2.1 AA (Schritte 56-70)
56. Semantische HTML5 Tags (main, nav, article, aside)
57. ARIA Labels für alle interaktiven Elemente
58. Skip-to-Content Link
59. Fokus-Management
60. Keyboard Navigation testen
61. Farbkontrast min 4.5:1
62. Focus-Visible Styles
63. Form Labels verknüpft
64. Error States accessible
65. Tabindex korrekt
66. Screen Reader optimiert
67. Reduce Motion Support
68. Alt-Texte beschreibend
69. Link-Texte aussagekräftig
70. Touch Targets min 44x44px

## PHASE 6: MOBILE & RESPONSIVE (Schritte 71-80)
71. Mobile-First Tailwind
72. Breakpoints: sm → md → lg → xl
73. Touch-optimierte Buttons
74. Hamburger Menu für Mobile
75. Fluid Typography mit clamp()
76. Responsive Images mit srcset
77. Viewport Meta korrekt
78. Forms mobile-optimiert
79. Scroll-Performance
80. Test auf 375px (iPhone SE)

## PHASE 7: DARK MODE & THEMING (Schritte 81-85)
81. Dark Mode Setup mit Tailwind dark:
82. System Preference Detection
83. localStorage Persistence
84. Toggle Button mit Icons
85. Alle Komponenten Dark Mode fähig

## PHASE 8: INTERNATIONALISIERUNG (Schritte 86-90)
86. Sprache in <html lang="...">
87. hreflang Tags wenn mehrsprachig
88. Lokalisierte Meta Tags
89. Datumsformate lokalisiert
90. Währungsformate wenn relevant

## PHASE 9: CONTENT OPTIMIERUNG (Schritte 91-95)
91. Headlines impact-orientiert
92. CTAs action-orientiert
93. Copy auf Wesentliches gekürzt
94. Bullet Points statt Fließtext
95. Micro-Copy (Buttons, Forms, Errors)

## PHASE 10: FINAL VALIDATION (Schritte 96-100)
96. bun run build - MUSS erfolgreich sein
97. bunx tsc --noEmit - 0 Errors
98. Alle Links funktionieren
99. Alle Bilder laden
100. Finale Summary der Änderungen

---

## FEHLERBEHANDLUNG
- Build Error? → Fix und rebuild
- TypeScript Error? → Fix Type
- Missing File? → Create it
- Broken Link? → Fix href
- Missing Image? → Placeholder oder fix path

## ENTSCHEIDUNGSREGELN
- Unsicher über Farbe? → Nutze Primary Brand Color
- Unsicher über Text? → Schreibe professionellen Placeholder
- Unsicher über Feature? → Implementiere Best Practice Version
- Unsicher über Layout? → Mobile-First, clean, minimalistisch

---

**START JETZT. KEINE FRAGEN. NUR HANDELN. BIS ALLES PERFEKT IST.**`,
    emoji: '🔥',
    category: 'autonomous'
  },
  {
    id: 'auto-full-optimize',
    label: '🚀 Full Site Optimize',
    prompt: `Du bist ein Astro-Website-Optimierungs-Experte. Führe eine VOLLSTÄNDIGE autonome Optimierung durch in mehreren Schritten:

## PHASE 1: ANALYSE (Lies zuerst alle relevanten Dateien)
1. Analysiere die komplette Projektstruktur
2. Identifiziere alle .astro, .tsx, .css Dateien
3. Prüfe astro.config.mjs für aktuelle Konfiguration
4. Analysiere package.json für Dependencies

## PHASE 2: PERFORMANCE OPTIMIERUNG
1. Ersetze ALLE <img> durch <Image> Komponente mit:
   - format="avif" oder format="webp"
   - loading="lazy" für below-fold
   - width/height für CLS-Vermeidung
2. Implementiere Astro Islands mit client:visible/client:idle
3. Optimiere Font-Loading mit font-display: swap
4. Füge data-astro-prefetch für wichtige Links hinzu
5. Inline kritisches CSS

## PHASE 3: SEO VOLLOPTIMIERUNG
1. Erstelle/optimiere SEO-Komponente in src/components/SEO.astro
2. Generiere vollständige Meta-Tags für jede Seite:
   - title (50-60 Zeichen, mit Keyword)
   - description (150-160 Zeichen)
   - og:title, og:description, og:image
   - twitter:card, twitter:title, twitter:description
3. Füge JSON-LD Schema.org Daten hinzu
4. Optimiere Heading-Hierarchie (nur 1x H1)
5. Füge canonical URLs hinzu

## PHASE 4: CONTENT & UX
1. Verbessere alle Headlines für mehr Impact
2. Optimiere CTAs für höhere Conversion
3. Füge Alt-Texte für alle Bilder hinzu
4. Verbessere Whitespace und Lesbarkeit
5. Optimiere Mobile-Responsive Design

## PHASE 5: ACCESSIBILITY
1. Füge ARIA-Labels hinzu
2. Prüfe Farbkontraste
3. Implementiere Skip-to-Content Link
4. Optimiere Fokus-Management
5. Nutze semantische HTML5-Tags

## PHASE 6: FINAL CHECK
1. Führe "bun run build" aus und behebe Fehler
2. Prüfe TypeScript Errors mit "bunx tsc --noEmit"
3. Validiere mit Lighthouse (mental checklist)
4. Erstelle kurze Summary der Änderungen

WICHTIG: Arbeite autonom durch alle Phasen. Bei Fehlern: Fix und weitermachen. Ziel: 100/100 Lighthouse Score.`,
    emoji: '🎯',
    category: 'autonomous'
  },
  {
    id: 'auto-landing-page',
    label: '🏠 Landing Page Build',
    prompt: `Du bist ein Astro Landing Page Architekt. Erstelle/optimiere eine conversion-optimierte Landing Page autonom:

## SCHRITT 1: STRUKTUR ANALYSIEREN
Lies alle existierenden Dateien und verstehe die aktuelle Struktur.

## SCHRITT 2: HERO SECTION (Above the Fold)
- Headline: Klar, benefit-orientiert, emotional
- Subheadline: 1-2 Sätze Erklärung
- Primary CTA: Auffällig, action-orientiert
- Hero Image/Video: Optimiert mit <Image> Komponente
- Social Proof Leiste: Logos/Zahlen

## SCHRITT 3: PROBLEM/SOLUTION
- Pain Points des Users ansprechen
- Solution klar präsentieren
- Before/After Kontrast

## SCHRITT 4: FEATURES/BENEFITS
- 3-6 Key Benefits mit Icons
- Card-Grid Layout
- Kurze, scanbare Texte

## SCHRITT 5: SOCIAL PROOF
- Testimonials mit Bild, Name, Titel
- Case Studies / Ergebnisse
- Trust Badges / Logos

## SCHRITT 6: PRICING (falls relevant)
- Klare Preisstruktur
- Feature-Vergleich
- Empfohlene Option hervorheben

## SCHRITT 7: FAQ
- 5-7 häufige Fragen
- Accordion-Style
- Einwände behandeln

## SCHRITT 8: FINAL CTA
- Wiederholung des Hauptangebots
- Dringlichkeit erzeugen
- Keine Ablenkungen

## SCHRITT 9: FOOTER
- Wichtige Links
- Social Media
- Newsletter Signup
- Impressum/Datenschutz

## TECHNISCHE UMSETZUNG
- Mobile-First mit Tailwind
- Alle Bilder optimiert
- SEO Meta-Tags komplett
- Schema.org JSON-LD
- PageSpeed optimiert

Arbeite autonom durch alle Schritte. Erstelle fehlende Komponenten. Fix alle Errors.`,
    emoji: '🏠',
    category: 'autonomous'
  },
  {
    id: 'auto-content-refresh',
    label: '📝 Content Refresh',
    prompt: `Du bist ein Content-Stratege und Copywriter. Führe einen vollständigen Content-Refresh durch:

## ANALYSE
1. Lies alle Content-Dateien (.astro, .md, .mdx)
2. Identifiziere schwache Texte, unklare CTAs, veraltete Infos

## HEADLINES OPTIMIEREN
- Jede H1, H2, H3 auf Impact prüfen
- Benefit-orientiert formulieren
- Emotion + Klarheit + Action
- Power Words einsetzen

## COPY VERBESSERN
- Alle Texte kürzen auf das Wesentliche
- Bullet Points statt Fließtext
- "Du/Sie" Ansprache konsistent
- Aktive Sprache, keine Passiv-Konstruktionen

## CTAs OPTIMIEREN
- Action-orientierte Verben
- Benefit kommunizieren
- Dringlichkeit ohne Spam
- Visuell hervorheben

## SEO CONTENT
- Keywords natürlich einbauen
- Meta Descriptions überarbeiten
- Alt-Texte für alle Bilder
- Interne Verlinkung optimieren

## MICRO-COPY
- Button-Texte
- Form Labels
- Error Messages
- Success Messages
- Empty States

Arbeite alle Seiten durch. Jede Änderung direkt umsetzen.`,
    emoji: '📝',
    category: 'autonomous'
  },
  {
    id: 'auto-performance-100',
    label: '⚡ PageSpeed 100',
    prompt: `Du bist ein Web Performance Engineer. Ziel: Lighthouse 100/100. Führe alle Optimierungen autonom durch:

## IMAGES (größter Impact!)
1. Finde ALLE <img> Tags in allen Dateien
2. Ersetze durch Astro <Image> Komponente:
   \`\`\`astro
   import { Image } from 'astro:assets';
   <Image src={import('./image.jpg')} alt="..." width={800} height={600} format="avif" loading="lazy" />
   \`\`\`
3. Definiere width/height für CLS=0
4. Nutze loading="eager" nur für above-fold

## FONTS
1. Prüfe @font-face Regeln
2. Setze font-display: swap
3. Preload wichtige Fonts
4. Nutze system-ui Fallback Stack

## JAVASCRIPT
1. Identifiziere client: Direktiven
2. Nutze client:visible statt client:load wo möglich
3. Entferne ungenutzte JS-Dependencies
4. Code-Split große Komponenten

## CSS
1. Inline kritisches CSS im <head>
2. Entferne ungenutzte Tailwind-Klassen
3. Minimiere CSS-Bundles

## HTML
1. Minimiere DOM-Tiefe
2. Nutze semantische Tags
3. Entferne unnötige Wrapper-Divs

## CACHING & HEADERS
1. Prüfe astro.config.mjs
2. Optimiere Build-Output

## VALIDATION
1. Führe "bun run build" aus
2. Prüfe Build-Output Größe
3. Teste mit "bun run preview"

Arbeite autonom bis PageSpeed 100 erreicht ist.`,
    emoji: '⚡',
    category: 'autonomous'
  },
  {
    id: 'auto-seo-complete',
    label: '🔍 SEO Complete',
    prompt: `Du bist ein SEO-Experte. Führe eine vollständige SEO-Optimierung durch:

## TECHNISCHES SEO
1. Erstelle/optimiere src/components/SEO.astro:
\`\`\`astro
---
interface Props {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article';
}
const { title, description, image, canonical, type = 'website' } = Astro.props;
const siteUrl = import.meta.env.SITE || 'https://example.com';
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical || Astro.url.href} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content={type} />
<meta property="og:image" content={image || siteUrl + '/og-default.jpg'} />
<meta name="twitter:card" content="summary_large_image" />
\`\`\`

2. Implementiere auf allen Seiten

## STRUKTURIERTE DATEN
1. JSON-LD für Organization
2. JSON-LD für WebPage
3. JSON-LD für Breadcrumbs
4. JSON-LD für FAQPage (wenn FAQ vorhanden)

## ON-PAGE SEO
1. H1 auf jeder Seite (nur 1x)
2. Heading-Hierarchie H1→H2→H3
3. Keyword in ersten 100 Wörtern
4. Alt-Texte mit Keywords
5. Interne Verlinkung optimieren

## SITEMAP & ROBOTS
1. Prüfe @astrojs/sitemap Integration
2. Optimiere robots.txt
3. XML Sitemap validieren

## PERFORMANCE = SEO
1. Core Web Vitals prüfen
2. Mobile-First sicherstellen
3. HTTPS überall

Arbeite alle Punkte ab. Jede Änderung direkt umsetzen.`,
    emoji: '🔍',
    category: 'autonomous'
  },
  {
    id: 'auto-mobile-first',
    label: '📱 Mobile Perfect',
    prompt: `Du bist ein Mobile-First Design Experte. Optimiere die komplette Website für mobile Geräte:

## ANALYSE
1. Identifiziere alle Layout-Komponenten
2. Prüfe aktuelle Tailwind Breakpoints
3. Finde Desktop-First Patterns

## RESPONSIVE LAYOUT
1. Mobile-First: Basis-Styles ohne Breakpoint
2. sm: → md: → lg: → xl: Progressive Enhancement
3. Flexbox/Grid für flexible Layouts
4. Container max-widths anpassen

## TOUCH-OPTIMIERUNG
1. Buttons min 44x44px Touch Target
2. Ausreichend Padding um klickbare Elemente
3. Swipe-Gesten wo sinnvoll

## TYPOGRAPHY
1. Fluid Typography mit clamp()
2. Lesbare Schriftgrößen (min 16px)
3. Zeilenhöhe optimieren (1.5-1.8)
4. Kontrast prüfen

## NAVIGATION
1. Mobile Hamburger Menu
2. Sticky Header (aber nicht zu groß)
3. Bottom Navigation Option
4. Breadcrumbs responsive

## BILDER
1. srcset für verschiedene Größen
2. Aspect-Ratio beibehalten
3. Full-Width auf Mobile wo sinnvoll

## FORMS
1. Große Input-Felder
2. Native Input-Types (tel, email, etc.)
3. Auto-Complete aktivieren
4. Keyboard-optimiert

## PERFORMANCE MOBILE
1. Reduzierte Animationen (prefers-reduced-motion)
2. Kleinere Bilder für Mobile
3. Lazy Loading aggressiver

Teste mental auf iPhone SE (375px) und iPhone 15 Pro (393px).`,
    emoji: '📱',
    category: 'autonomous'
  },
  {
    id: 'auto-accessibility',
    label: '♿ A11y Complete',
    prompt: `Du bist ein Accessibility-Experte (WCAG 2.1 AA). Mache die Website barrierefrei:

## SEMANTIK
1. Korrekte Landmark-Regionen: header, nav, main, aside, footer
2. Heading-Hierarchie ohne Sprünge
3. Listen für Listen-Content
4. Buttons vs Links korrekt nutzen

## BILDER
1. Alt-Texte für alle informativen Bilder
2. Dekorative Bilder: alt="" oder role="presentation"
3. Komplexe Bilder: aria-describedby
4. SVG Icons: aria-hidden="true" + sr-only Text

## FORMULARE
1. Labels mit for/id Verknüpfung
2. aria-required für Pflichtfelder
3. aria-invalid für Fehler
4. Hilfstexte mit aria-describedby
5. Fehler-Zusammenfassung

## NAVIGATION
1. Skip-to-Content Link:
\`\`\`html
<a href="#main" class="sr-only focus:not-sr-only">Zum Inhalt springen</a>
\`\`\`
2. aria-current="page" für aktive Links
3. Fokus-Reihenfolge logisch
4. Keyboard-Navigation testen

## FOKUS-MANAGEMENT
1. Sichtbare Focus-States:
\`\`\`css
:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
\`\`\`
2. Focus Trap in Modals
3. Fokus nach Aktionen setzen

## FARBE & KONTRAST
1. Kontrast min 4.5:1 (Text)
2. Kontrast min 3:1 (große Text, UI)
3. Farbe nicht einziger Indikator
4. Dark Mode a11y prüfen

## ARIA
1. aria-label für Icon-Only Buttons
2. aria-expanded für Dropdowns
3. aria-live für dynamische Inhalte
4. role nur wenn nötig

Teste mit Keyboard-Only Navigation (Tab, Enter, Escape, Pfeile).`,
    emoji: '♿',
    category: 'autonomous'
  },
  {
    id: 'auto-dark-mode',
    label: '🌙 Dark Mode',
    prompt: `Du bist ein Dark Mode Design Experte. Implementiere vollständigen Dark Mode:

## SETUP
1. Prüfe/erstelle Theme-Toggle Komponente
2. System-Preference Detection:
\`\`\`astro
<script is:inline>
  const theme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
</script>
\`\`\`

## FARB-KONVERTIERUNG
1. Hintergründe: bg-white → bg-white dark:bg-gray-900
2. Text: text-gray-900 → text-gray-900 dark:text-white
3. Borders: border-gray-200 → border-gray-200 dark:border-gray-700
4. Shadows: Subtiler im Dark Mode

## BILDER
1. Prüfe Bilder auf Dark Mode Tauglichkeit
2. Logos mit Transparenz anpassen
3. Illustrations-Farben prüfen

## KOMPONENTEN
1. Cards: Hintergrund + Schatten anpassen
2. Inputs: Border + Background
3. Buttons: Hover-States für Dark
4. Code-Blöcke: Syntax-Highlighting

## KONTRAST
1. Mindestens 4.5:1 im Dark Mode
2. Nicht zu hell (eye strain)
3. Nicht zu dunkel (Lesbarkeit)

## TOGGLE UI
1. Schöner Toggle mit Sun/Moon Icons
2. Smooth Transition
3. State in localStorage persistieren

Arbeite alle Dateien durch. Konsistentes Dark Mode überall.`,
    emoji: '🌙',
    category: 'autonomous'
  },
  {
    id: 'auto-animations',
    label: '✨ Smooth Animations',
    prompt: `Du bist ein Motion Design Experte. Füge professionelle Animationen hinzu:

## SCROLL ANIMATIONS
1. Fade-In beim Scrollen:
\`\`\`css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-on-scroll {
  animation: fadeInUp 0.6s ease-out forwards;
}
\`\`\`

2. Intersection Observer Setup:
\`\`\`astro
<script>
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
</script>
\`\`\`

## MICRO-INTERACTIONS
1. Button Hover: Scale + Shadow
2. Link Hover: Underline Animation
3. Card Hover: Lift Effect
4. Input Focus: Border Animation

## TRANSITIONS
1. Page Transitions mit View Transitions API
2. Smooth Scrolling: scroll-behavior: smooth
3. Color Transitions für Dark Mode

## PERFORMANCE
1. Nutze transform statt top/left
2. will-change sparsam einsetzen
3. prefers-reduced-motion respektieren:
\`\`\`css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
\`\`\`

## LOADING STATES
1. Skeleton Screens
2. Spinner für Async Actions
3. Progress Indicators

Subtil und professionell. Keine Überanimation.`,
    emoji: '✨',
    category: 'autonomous'
  },
  {
    id: 'auto-forms-ux',
    label: '📋 Forms Perfection',
    prompt: `Du bist ein Forms UX Experte. Optimiere alle Formulare:

## STRUKTUR
1. Logische Gruppierung mit fieldset/legend
2. Labels über Inputs (nicht daneben)
3. Einspaltiges Layout (Mobile-freundlich)
4. Klare Hierarchie

## LABELS & PLACEHOLDERS
1. Label immer sichtbar (nicht nur Placeholder!)
2. Placeholder für Beispiele, nicht Beschreibung
3. Required-Indikator: * nach Label

## INPUT TYPES
1. type="email" für E-Mails
2. type="tel" für Telefon
3. type="url" für URLs
4. autocomplete Attribute setzen

## VALIDATION
1. Inline-Validation (nicht nur Submit)
2. Klare Fehlermeldungen unter Input
3. Success-State nach Korrektur
4. Form-Level Zusammenfassung bei vielen Fehlern

## BUTTONS
1. Submit Button klar erkennbar
2. Loading State während Submit
3. Disabled State wenn ungültig
4. Success/Error Feedback nach Submit

## ACCESSIBILITY
1. aria-invalid für Fehler
2. aria-describedby für Hilfstexte
3. Fokus auf erstes Fehlerfeld
4. Screen Reader Announcements

## UX PATTERNS
1. Autofocus auf erstes Feld
2. Tab-Reihenfolge logisch
3. Enter = Submit
4. Passwort Show/Hide Toggle

## STYLING
\`\`\`css
input:focus { ring-2 ring-blue-500 }
input:invalid:not(:placeholder-shown) { ring-2 ring-red-500 }
\`\`\`

Arbeite alle Formulare durch. Konsistente UX überall.`,
    emoji: '📋',
    category: 'autonomous'
  },
];

// Get contextual AI presets based on element type and category
const getAIPresets = (element: SelectedElement | null, category?: string): PromptPreset[] => {
  // If category filter is set, return all prompts of that category
  if (category && category !== 'quick') {
    return ALL_PROMPTS.filter(p => p.category === category);
  }

  // Default quick actions based on element type
  const quickPresets = ALL_PROMPTS.filter(p => p.category === 'quick');

  if (!element) return quickPresets.slice(0, 3);

  const tag = element.tagName.toLowerCase();

  // Contextual quick actions based on element type
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    return [
      quickPresets.find(p => p.id === 'punch')!,
      quickPresets.find(p => p.id === 'shorter')!,
      quickPresets.find(p => p.id === 'improve')!,
    ].filter(Boolean);
  }

  if (tag === 'p' || tag === 'span') {
    return [
      quickPresets.find(p => p.id === 'simplify')!,
      quickPresets.find(p => p.id === 'improve')!,
      ALL_PROMPTS.find(p => p.id === 'design-headline')!,
    ].filter(Boolean);
  }

  if (tag === 'button' || tag === 'a') {
    return [
      quickPresets.find(p => p.id === 'cta')!,
      ALL_PROMPTS.find(p => p.id === 'design-cta-text')!,
      ALL_PROMPTS.find(p => p.id === 'design-cta-button')!,
    ].filter(Boolean);
  }

  if (tag === 'img') {
    return [
      ALL_PROMPTS.find(p => p.id === 'astro-images')!,
      ALL_PROMPTS.find(p => p.id === 'astro-alt')!,
      ALL_PROMPTS.find(p => p.id === 'perf-lazy')!,
    ].filter(Boolean);
  }

  if (tag === 'div' || tag === 'section' || tag === 'article') {
    return [
      ALL_PROMPTS.find(p => p.id === 'astro-layout')!,
      ALL_PROMPTS.find(p => p.id === 'design-spacing')!,
      ALL_PROMPTS.find(p => p.id === 'astro-responsive')!,
    ].filter(Boolean);
  }

  if (tag === 'nav') {
    return [
      ALL_PROMPTS.find(p => p.id === 'design-nav')!,
      ALL_PROMPTS.find(p => p.id === 'astro-responsive')!,
      ALL_PROMPTS.find(p => p.id === 'astro-a11y')!,
    ].filter(Boolean);
  }

  if (tag === 'footer') {
    return [
      ALL_PROMPTS.find(p => p.id === 'design-footer')!,
      ALL_PROMPTS.find(p => p.id === 'astro-responsive')!,
      ALL_PROMPTS.find(p => p.id === 'design-social-proof')!,
    ].filter(Boolean);
  }

  if (tag === 'form') {
    return [
      ALL_PROMPTS.find(p => p.id === 'design-form')!,
      ALL_PROMPTS.find(p => p.id === 'astro-a11y')!,
      quickPresets.find(p => p.id === 'improve')!,
    ].filter(Boolean);
  }

  return quickPresets.slice(0, 3);
};

// Get prompts by category for the menu
const getPromptCategories = () => [
  { id: 'autonomous', label: 'Autonom', emoji: '🤖', color: 'pink' },
  { id: 'quick', label: 'Quick', emoji: '⚡', color: 'purple' },
  { id: 'astro', label: 'Astro', emoji: '🚀', color: 'orange' },
  { id: 'design', label: 'Design', emoji: '🎨', color: 'blue' },
  { id: 'content', label: 'Content', emoji: '📝', color: 'green' },
  { id: 'seo', label: 'SEO', emoji: '🔍', color: 'amber' },
  { id: 'performance', label: 'Perf', emoji: '⚡', color: 'cyan' },
];

// Element type icon
const getElementIcon = (element: SelectedElement) => {
  const tag = element.tagName.toLowerCase();
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return Heading;
  if (tag === 'p' || tag === 'span') return Type;
  if (tag === 'img') return Image;
  if (tag === 'a') return Link2;
  if (tag === 'button') return Zap;
  if (['div', 'section', 'article'].includes(tag)) return Grid;
  return MousePointer2;
};

// Section icon based on type - visually distinct icons
const getSectionIcon = (iconType: PageSection['icon']) => {
  switch (iconType) {
    case 'header': return PanelTop;
    case 'nav': return Menu;
    case 'hero': return Rocket;
    case 'content': return FileText;
    case 'footer': return PanelBottom;
    case 'sidebar': return Sidebar;
    case 'section': return Layout;
    default: return Grid;
  }
};

export const SmartEditToolbar = memo(function SmartEditToolbar({
  isActive,
  selectedElements,
  onClearSelection,
  onTextEdit,
  onAIEdit,
  onSendToChat,
  onLoadToChat,
  onFindInCode,
  onReplaceImage,
  onCopySelector,
  onDeleteElement,
  onToggleVisibility,
  onSelectParent,
  onSelectChild,
  // Section navigation
  sections = [],
  currentSectionIndex = 0,
  onNavigateSection,
  onSelectSection,
}: SmartEditToolbarProps) {
  const [mode, setMode] = useState<'default' | 'edit' | 'ai' | 'ai-menu'>('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('quick');
  const [editText, setEditText] = useState('');
  const [aiPrompt, setAIPrompt] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isHidden, setIsHidden] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const hasSelection = selectedElements.length > 0;
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const isEditable = singleElement?.isEditable ?? false;
  const isImage = singleElement?.tagName === 'img';

  // Contextual AI presets based on element and selected category
  const aiPresets = useMemo(() => getAIPresets(singleElement, selectedCategory), [singleElement, selectedCategory]);
  const promptCategories = useMemo(() => getPromptCategories(), []);
  const ElementIcon = singleElement ? getElementIcon(singleElement) : MousePointer2;

  // Show success feedback
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: '' }), 2000);
  }, []);

  // Send prompt to chat for review/editing (instead of direct execution)
  const sendPromptToChat = useCallback((prompt: string) => {
    if (onSendToChat) {
      onSendToChat(prompt);
      showFeedback('success', 'Prompt in Chat geladen');
      setMode('default');
    } else {
      // Fallback: put in AI textarea for editing
      setAIPrompt(prompt);
      setMode('ai');
      setTimeout(() => aiInputRef.current?.focus(), 50);
    }
  }, [onSendToChat, showFeedback]);

  // Reset mode when selection changes
  useEffect(() => {
    setMode('default');
    setEditText('');
    setAIPrompt('');
    setIsHidden(false);
  }, [selectedElements]);

  // Start inline editing
  const startEditing = useCallback(() => {
    if (singleElement?.isEditable) {
      setEditText(singleElement.textContent || '');
      setMode('edit');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [singleElement]);

  // Save text edit with feedback
  const saveEdit = useCallback(() => {
    if (singleElement && editText.trim()) {
      onTextEdit(singleElement.selector, editText);
      showFeedback('success', 'Gespeichert!');
      setMode('default');
      setEditText('');
    }
  }, [singleElement, editText, onTextEdit, showFeedback]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setMode('default');
    setEditText('');
    setAIPrompt('');
  }, []);

  // Submit AI prompt with feedback
  const submitAI = useCallback((prompt?: string) => {
    const finalPrompt = prompt || aiPrompt;
    if (finalPrompt.trim() && selectedElements.length > 0) {
      onAIEdit(finalPrompt, selectedElements);
      showFeedback('success', 'KI arbeitet...');
      setMode('default');
      setAIPrompt('');
    }
  }, [aiPrompt, selectedElements, onAIEdit, showFeedback]);

  // Copy selector with animated feedback
  const handleCopy = useCallback(() => {
    if (singleElement) {
      const text = singleElement.selector;
      navigator.clipboard.writeText(text);
      showFeedback('success', 'Kopiert!');
      onCopySelector?.(singleElement);
    }
  }, [singleElement, onCopySelector, showFeedback]);

  // Toggle visibility with state tracking
  const handleToggleVisibility = useCallback(() => {
    if (singleElement && onToggleVisibility) {
      onToggleVisibility(singleElement);
      setIsHidden(!isHidden);
      showFeedback('success', isHidden ? 'Sichtbar' : 'Versteckt');
    }
  }, [singleElement, onToggleVisibility, isHidden, showFeedback]);

  // Delete with confirmation feedback
  const handleDelete = useCallback(() => {
    if (singleElement && onDeleteElement) {
      onDeleteElement(singleElement);
      showFeedback('success', 'Gelöscht!');
    }
  }, [singleElement, onDeleteElement, showFeedback]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || !hasSelection) return;

      // Don't interfere with input fields
      if (mode === 'edit' || mode === 'ai') {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
        return;
      }

      // ⏎ Enter - Start editing
      if (e.key === 'Enter' && isEditable && mode === 'default') {
        e.preventDefault();
        startEditing();
        return;
      }

      // ⎋ Escape - Clear selection or close menu
      if (e.key === 'Escape') {
        e.preventDefault();
        if (mode !== 'default') {
          setMode('default');
        } else {
          onClearSelection();
        }
        return;
      }

      // ⌘K - AI Edit
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMode('ai');
        setTimeout(() => aiInputRef.current?.focus(), 50);
        return;
      }

      // ⌘C - Copy selector
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !window.getSelection()?.toString()) {
        e.preventDefault();
        handleCopy();
        return;
      }

      // ⌘⇧C - Find in code
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c' && singleElement && onFindInCode) {
        e.preventDefault();
        onFindInCode(singleElement);
        return;
      }

      // ⌫ Delete - Delete element
      if (e.key === 'Backspace' && singleElement && onDeleteElement) {
        e.preventDefault();
        handleDelete();
        return;
      }

      // H - Toggle visibility
      if (e.key === 'h' && singleElement && onToggleVisibility) {
        e.preventDefault();
        handleToggleVisibility();
        return;
      }

      // ↑ Up arrow - Select parent
      if (e.key === 'ArrowUp' && singleElement && onSelectParent) {
        e.preventDefault();
        onSelectParent(singleElement);
        return;
      }

      // ↓ Down arrow - Select child
      if (e.key === 'ArrowDown' && singleElement && onSelectChild) {
        e.preventDefault();
        onSelectChild(singleElement);
        return;
      }

      // [ - Previous section
      if (e.key === '[' && sections.length > 0 && onNavigateSection) {
        e.preventDefault();
        onNavigateSection('prev');
        return;
      }

      // ] - Next section
      if (e.key === ']' && sections.length > 0 && onNavigateSection) {
        e.preventDefault();
        onNavigateSection('next');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, hasSelection, mode, isEditable, singleElement, sections, startEditing, cancelEdit, handleCopy, handleDelete, handleToggleVisibility, onClearSelection, onFindInCode, onDeleteElement, onToggleVisibility, onSelectParent, onSelectChild, onNavigateSection]);

  // Focus AI input when shown
  useEffect(() => {
    if (mode === 'ai') {
      setTimeout(() => aiInputRef.current?.focus(), 50);
    }
  }, [mode]);

  if (!isActive) return null;

  // Feedback overlay
  const FeedbackOverlay = () => {
    if (!feedback.type) return null;
    return (
      <div className={`absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none z-10 ${
        feedback.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
      }`}>
        <span className={`flex items-center gap-1.5 text-xs font-medium toolbar-success ${
          feedback.type === 'success' ? 'text-green-400' : 'text-red-400'
        }`}>
          {feedback.type === 'success' ? <Check size={14} /> : <X size={14} />}
          {feedback.message}
        </span>
      </div>
    );
  };

  // Inline text editing mode
  if (mode === 'edit') {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl toolbar-gradient shadow-lg">
        <FeedbackOverlay />
        <Type size={14} className="text-blue-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg text-xs bg-black/50 text-white border border-blue-500/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 placeholder-gray-500 transition-all"
          placeholder="Text eingeben..."
          autoFocus
        />
        <ActionButton onClick={saveEdit} icon={Save} label="Speichern" shortcut={KEY.enter} color="green" />
        <ActionButton onClick={cancelEdit} icon={X} label="Abbrechen" shortcut={KEY.esc} color="red" />
      </div>
    );
  }

  // AI prompt mode
  if (mode === 'ai') {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl toolbar-gradient shadow-lg toolbar-glow">
        <FeedbackOverlay />
        <Sparkles size={14} className="text-purple-400 shrink-0 toolbar-pulse" />
        <textarea
          ref={aiInputRef}
          value={aiPrompt}
          onChange={(e) => setAIPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAI();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="flex-1 min-w-[250px] h-9 px-3 py-2 rounded-lg text-xs bg-black/50 text-white border border-purple-500/30 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none placeholder-gray-500 transition-all"
          placeholder="Was soll die KI ändern? ✨"
          rows={1}
          autoFocus
        />
        <ActionButton
          onClick={() => submitAI()}
          icon={Sparkles}
          label="Ausführen"
          shortcut={`${KEY.cmd}${KEY.enter}`}
          color="purple"
          disabled={!aiPrompt.trim()}
          pulse={!!aiPrompt.trim()}
        />
        <ActionButton onClick={cancelEdit} icon={X} label="Abbrechen" shortcut={KEY.esc} color="red" />
      </div>
    );
  }

  // AI quick actions menu with category tabs and prompts
  if (mode === 'ai-menu') {
    // Static class maps for Tailwind (dynamic classes don't work)
    const categoryStyles: Record<string, { active: string; inactive: string }> = {
      autonomous: { active: 'bg-pink-500/20 text-pink-300 border border-pink-500/40', inactive: '' },
      quick: { active: 'bg-purple-500/20 text-purple-300 border border-purple-500/40', inactive: '' },
      astro: { active: 'bg-orange-500/20 text-orange-300 border border-orange-500/40', inactive: '' },
      design: { active: 'bg-blue-500/20 text-blue-300 border border-blue-500/40', inactive: '' },
      content: { active: 'bg-green-500/20 text-green-300 border border-green-500/40', inactive: '' },
      seo: { active: 'bg-amber-500/20 text-amber-300 border border-amber-500/40', inactive: '' },
      performance: { active: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40', inactive: '' },
    };

    const promptStyles: Record<string, string> = {
      autonomous: 'text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/30 border-pink-500/20 hover:border-pink-400/40',
      quick: 'text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/30 border-purple-500/20 hover:border-purple-400/40',
      astro: 'text-orange-300 hover:text-white bg-orange-500/10 hover:bg-orange-500/30 border-orange-500/20 hover:border-orange-400/40',
      design: 'text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 border-blue-500/20 hover:border-blue-400/40',
      content: 'text-green-300 hover:text-white bg-green-500/10 hover:bg-green-500/30 border-green-500/20 hover:border-green-400/40',
      seo: 'text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/30 border-amber-500/20 hover:border-amber-400/40',
      performance: 'text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/30 border-cyan-500/20 hover:border-cyan-400/40',
    };

    return (
      <div className="relative flex flex-col gap-2 px-3 py-2 rounded-xl toolbar-gradient shadow-lg max-w-[600px]">
        <FeedbackOverlay />

        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/10">
          {promptCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? categoryStyles[cat.id]?.active || categoryStyles.quick.active
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Prompt buttons - sends to chat for review */}
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
          {aiPresets.map((preset) => (
            <Tooltip key={preset.id} label={preset.prompt}>
              <button
                onClick={() => sendPromptToChat(preset.prompt)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 hover:scale-105 border ${
                  promptStyles[selectedCategory] || promptStyles.quick
                }`}
              >
                <span>{preset.emoji}</span>
                {preset.label}
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <span className="text-[9px] text-gray-500">Prompt wird im Chat bearbeitbar</span>
          <div className="flex items-center gap-1">
            <ActionButton
              onClick={() => setMode('ai')}
              icon={MessageSquare}
              label="Eigene Anweisung"
              shortcut={`${KEY.cmd}K`}
              color="purple"
            />
            <ActionButton onClick={() => setMode('default')} icon={X} label="Zurück" shortcut={KEY.esc} color="gray" />
          </div>
        </div>
      </div>
    );
  }

  // No selection state - Minimal elegant hint
  if (!hasSelection) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl toolbar-gradient shadow-lg">
        <div className="flex items-center gap-2 text-amber-400/60">
          <MousePointer2 size={14} className="toolbar-bounce" />
          <span className="text-[11px] font-medium">Element auswählen</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-[10px] text-gray-500">Klicken zum Bearbeiten</span>
      </div>
    );
  }

  // Default toolbar with magic micro-interactions
  return (
    <div className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl toolbar-gradient shadow-lg">
      <FeedbackOverlay />

      {/* Element indicator with type icon and multi-select */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/40 mr-1.5 border border-white/5">
        {singleElement ? (
          <>
            <ElementIcon size={12} className="text-amber-400" />
            <span className="text-[11px] text-white font-mono font-medium">
              {`<${singleElement.tagName}>`}
            </span>
            {singleElement.className && (
              <span className="text-[9px] text-gray-500 max-w-[80px] truncate">
                .{singleElement.className.split(' ')[0]}
              </span>
            )}
          </>
        ) : (
          <>
            {/* Multi-select indicator with count badge */}
            <div className="relative">
              <SquareStack size={12} className="text-purple-400" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-purple-500 text-[8px] font-bold text-white px-1">
                {selectedElements.length}
              </span>
            </div>
            <span className="text-[11px] text-white font-medium">
              Multi-Auswahl
            </span>
            <span className="text-[9px] text-purple-300/70 font-medium">
              {KEY.shift}+Klick
            </span>
          </>
        )}
      </div>

      {/* Section Navigation */}
      {sections.length > 0 && onNavigateSection && (
        <>
          <Separator />
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-black/30 border border-cyan-500/20">
            <ActionButton
              onClick={() => onNavigateSection('prev')}
              icon={ChevronLeft}
              label="Vorherige Sektion"
              shortcut="["
              color="gray"
              disabled={currentSectionIndex <= 0}
            />

            {/* Current section indicator */}
            <Tooltip label={sections[currentSectionIndex]?.name || 'Sektion'}>
              <button
                onClick={() => {
                  const section = sections[currentSectionIndex];
                  if (section && onSelectSection) onSelectSection(section);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
              >
                {(() => {
                  const section = sections[currentSectionIndex];
                  if (!section) return <Layout size={10} />;
                  const SectionIcon = getSectionIcon(section.icon);
                  return <SectionIcon size={10} />;
                })()}
                <span className="max-w-[60px] truncate">
                  {sections[currentSectionIndex]?.name || 'Sektion'}
                </span>
                <span className="text-[8px] text-cyan-400/60 font-mono">
                  {currentSectionIndex + 1}/{sections.length}
                </span>
              </button>
            </Tooltip>

            <ActionButton
              onClick={() => onNavigateSection('next')}
              icon={ChevronRight}
              label="Nächste Sektion"
              shortcut="]"
              color="gray"
              disabled={currentSectionIndex >= sections.length - 1}
            />
          </div>
        </>
      )}

      <Separator />

      {/* Primary actions group */}
      <div className="flex items-center gap-0.5">
        {/* Text editing */}
        {isEditable && (
          <ActionButton
            onClick={startEditing}
            icon={Type}
            label="Text bearbeiten"
            shortcut={KEY.enter}
            color="blue"
          />
        )}

        {/* Image replacement */}
        {isImage && onReplaceImage && singleElement && (
          <ActionButton
            onClick={() => onReplaceImage(singleElement)}
            icon={Image}
            label="Bild ersetzen"
            color="green"
          />
        )}

        {/* AI Edit - Hero action */}
        <ActionButton
          onClick={() => setMode('ai-menu')}
          icon={Sparkles}
          label="KI bearbeiten"
          shortcut={`${KEY.cmd}K`}
          color="purple"
          badge={aiPresets.length > 2 ? String(aiPresets.length) : undefined}
        />
      </div>

      <Separator />

      {/* Navigation group */}
      {singleElement && (onSelectParent || onSelectChild) && (
        <div className="flex items-center gap-0.5">
          {onSelectParent && (
            <ActionButton
              onClick={() => onSelectParent(singleElement)}
              icon={ChevronUp}
              label="Parent Element"
              shortcut="↑"
              color="gray"
            />
          )}
          {onSelectChild && (
            <ActionButton
              onClick={() => onSelectChild(singleElement)}
              icon={ChevronDown}
              label="Child Element"
              shortcut="↓"
              color="gray"
            />
          )}
        </div>
      )}

      <Separator />

      {/* Utility actions group */}
      <div className="flex items-center gap-0.5">
        {singleElement && (
          <ActionButton
            onClick={handleCopy}
            icon={Copy}
            label="Selektor kopieren"
            shortcut={`${KEY.cmd}C`}
            color="gray"
          />
        )}

        {singleElement && onFindInCode && (
          <ActionButton
            onClick={() => onFindInCode(singleElement)}
            icon={Code}
            label="Im Code finden"
            shortcut={`${KEY.cmd}${KEY.shift}C`}
            color="orange"
          />
        )}

        {singleElement && onToggleVisibility && (
          <ActionButton
            onClick={handleToggleVisibility}
            icon={isHidden ? EyeOff : Eye}
            label={isHidden ? 'Einblenden' : 'Ausblenden'}
            shortcut="H"
            color="gray"
            active={isHidden}
          />
        )}
      </div>

      <Separator />

      {/* Chat integration - Feature action */}
      <Tooltip label="Element im Chat bearbeiten" color="green">
        <button
          onClick={onLoadToChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-green-400 hover:text-green-300 bg-green-500/15 hover:bg-green-500/25 border border-green-500/20 hover:border-green-400/40 transition-all duration-150 hover:scale-105"
        >
          <MessageSquare size={12} />
          Chat
        </button>
      </Tooltip>

      {/* Delete - Danger zone */}
      {singleElement && onDeleteElement && (
        <ActionButton
          onClick={handleDelete}
          icon={Trash2}
          label="Element löschen"
          shortcut={KEY.delete}
          color="red"
        />
      )}

      {/* Clear selection */}
      <ActionButton
        onClick={onClearSelection}
        icon={X}
        label="Auswahl aufheben"
        shortcut={KEY.esc}
        color="gray"
      />
    </div>
  );
});

// Hook for managing edit history
export function useEditHistory(maxSteps = 50) {
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addEntry = useCallback((entry: Omit<EditHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: EditHistoryEntry = {
      ...entry,
      id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      const updated = [...newHistory, newEntry].slice(-maxSteps);
      return updated;
    });
    setCurrentIndex(prev => Math.min(prev + 1, maxSteps - 1));

    return newEntry;
  }, [currentIndex, maxSteps]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(0);
  }, []);

  return {
    history,
    currentIndex,
    addEntry,
    undo,
    redo,
    clear,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}

export type { EditHistoryEntry };
