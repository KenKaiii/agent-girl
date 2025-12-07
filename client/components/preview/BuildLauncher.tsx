/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * BuildLauncher - One-Click Project Starter (like bolt.new)
 * Features: Template gallery, instant preview, zero-config start
 */

import React, { useState } from 'react';
import {
  Rocket,
  Globe,
  FileText,
  ShoppingCart,
  Briefcase,
  Code,
  Sparkles,
  ArrowRight,
  Palette,
  Layout,
  Zap,
  Target,
  Heart,
  DollarSign,
  Camera,
  Monitor,
  GraduationCap,
  Home,
  Utensils,
} from 'lucide-react';

// Template categories
type TemplateCategory = 'website' | 'landing' | 'portfolio' | 'blog' | 'shop' | 'docs';

// Template definition
interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
  command: string;
  previewUrl?: string;
  popular?: boolean;
}

// Premium Astro 5 Templates
const TEMPLATES: Template[] = [
  {
    id: 'landing-modern',
    name: 'Modern Landing',
    description: 'Conversion-optimierte Landingpage mit Hero, Features, Testimonials und CTA',
    category: 'landing',
    icon: <Rocket size={24} />,
    gradient: 'from-blue-500 to-purple-600',
    features: ['Hero Section', 'Feature Grid', 'Testimonials', 'CTA Buttons', 'SEO Ready'],
    command: '/landing saas "Modern Landing Page"',
    popular: true,
  },
  {
    id: 'portfolio-minimal',
    name: 'Minimal Portfolio',
    description: 'Elegantes Portfolio für Kreative mit Projektgalerie und About-Seite',
    category: 'portfolio',
    icon: <Palette size={24} />,
    gradient: 'from-pink-500 to-rose-600',
    features: ['Projekt Galerie', 'About Section', 'Kontaktformular', 'Responsive'],
    command: '/landing creative "Portfolio Website"',
  },
  {
    id: 'blog-starter',
    name: 'Blog Starter',
    description: 'Content-First Blog mit MDX Support, Tags und Suche',
    category: 'blog',
    icon: <FileText size={24} />,
    gradient: 'from-green-500 to-emerald-600',
    features: ['MDX Support', 'Tag System', 'Suche', 'RSS Feed', 'Dark Mode'],
    command: 'Create a blog with Astro 5, MDX support, tag system, search functionality, RSS feed, and dark mode. Use Content Collections for posts.',
  },
  {
    id: 'business-pro',
    name: 'Business Pro',
    description: 'Professionelle Firmenseite mit Team, Services und Kontakt',
    category: 'website',
    icon: <Briefcase size={24} />,
    gradient: 'from-indigo-500 to-blue-600',
    features: ['Team Section', 'Services', 'Testimonials', 'Kontakt', 'Google Maps'],
    command: '/landing fintech "Business Pro Website"',
    popular: true,
  },
  {
    id: 'shop-starter',
    name: 'Shop Starter',
    description: 'E-Commerce Ready mit Produktkatalog und Warenkorb',
    category: 'shop',
    icon: <ShoppingCart size={24} />,
    gradient: 'from-orange-500 to-amber-600',
    features: ['Produktkatalog', 'Warenkorb', 'Checkout', 'Stripe Ready'],
    command: '/landing ecommerce "Shop Starter"',
  },
  {
    id: 'docs-starlight',
    name: 'Documentation',
    description: 'Starlight-powered Dokumentation mit Suche und i18n',
    category: 'docs',
    icon: <Code size={24} />,
    gradient: 'from-violet-500 to-purple-600',
    features: ['Pagefind Suche', 'i18n', 'Dark Mode', 'Sidebar Nav', 'Code Highlight'],
    command: '/docs my-docs',
  },
];

// Niche Presets for optimized builds
type NicheType = 'healthcare' | 'fintech' | 'ecommerce' | 'creative' | 'saas' | 'education' | 'realestate' | 'restaurant';

interface NichePreset {
  id: NicheType;
  name: string;
  icon: React.ReactNode;
  description: string;
  colors: string;
  gradient: string;
}

const NICHE_PRESETS: NichePreset[] = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: <Heart size={18} />,
    description: 'Arztpraxen, Kliniken, Wellness',
    colors: 'Blau/Grün, beruhigend',
    gradient: 'from-blue-500 to-green-500',
  },
  {
    id: 'fintech',
    name: 'Fintech',
    icon: <DollarSign size={18} />,
    description: 'Banken, Versicherungen, Invest',
    colors: 'Navy/Gold, vertrauensvoll',
    gradient: 'from-blue-900 to-amber-500',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    icon: <ShoppingCart size={18} />,
    description: 'Shops, Marktplätze, D2C',
    colors: 'Brand-Farben, conversion-optimiert',
    gradient: 'from-orange-500 to-pink-500',
  },
  {
    id: 'creative',
    name: 'Kreativ',
    icon: <Camera size={18} />,
    description: 'Agenturen, Designer, Fotografen',
    colors: 'Mutige Gradienten, expressiv',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'saas',
    name: 'SaaS',
    icon: <Monitor size={18} />,
    description: 'Software, Apps, Plattformen',
    colors: 'Modern Purple/Blue',
    gradient: 'from-violet-600 to-blue-600',
  },
  {
    id: 'education',
    name: 'Bildung',
    icon: <GraduationCap size={18} />,
    description: 'Schulen, Kurse, E-Learning',
    colors: 'Blau/Orange, einladend',
    gradient: 'from-blue-600 to-orange-500',
  },
  {
    id: 'realestate',
    name: 'Immobilien',
    icon: <Home size={18} />,
    description: 'Makler, Listings, Projekte',
    colors: 'Navy/Gold, elegant',
    gradient: 'from-slate-800 to-amber-400',
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: <Utensils size={18} />,
    description: 'Restaurants, Cafés, Catering',
    colors: 'Warm, einladend',
    gradient: 'from-amber-700 to-rose-600',
  },
];

// Quick Actions
const QUICK_ACTIONS = [
  {
    id: 'niche',
    label: 'Nischen-optimiert',
    description: 'Branchenspezifische Best Practices',
    icon: <Target size={20} />,
    action: 'niche',
  },
  {
    id: 'clone',
    label: 'Website klonen',
    description: 'Bestehende Website zu Astro konvertieren',
    icon: <Globe size={20} />,
    action: 'clone',
  },
  {
    id: 'blank',
    label: 'Leeres Projekt',
    description: 'Starte mit einem leeren Astro 5 Projekt',
    icon: <Layout size={20} />,
    action: 'blank',
  },
  {
    id: 'ai',
    label: 'Mit AI erstellen',
    description: 'Beschreibe was du brauchst, AI baut es',
    icon: <Sparkles size={20} />,
    action: 'ai',
  },
];

interface BuildLauncherProps {
  onSelectTemplate: (template: Template) => void;
  onQuickAction: (action: string, input?: string) => void;
  onClose?: () => void;
}

// Template Card Component
function TemplateCard({
  template,
  onSelect,
}: {
  template: Template;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative text-left p-4 rounded-xl border transition-all duration-300"
      style={{
        background: isHovered
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.03)',
        borderColor: isHovered
          ? 'rgba(255, 255, 255, 0.2)'
          : 'rgba(255, 255, 255, 0.06)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : 'none',
      }}
    >
      {/* Popular badge */}
      {template.popular && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          BELIEBT
        </div>
      )}

      {/* Icon with gradient background */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${template.gradient}`}
      >
        <div className="text-white">{template.icon}</div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
        {template.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-400 mb-3 line-clamp-2">
        {template.description}
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-1">
        {template.features.slice(0, 3).map((feature, i) => (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500"
          >
            {feature}
          </span>
        ))}
        {template.features.length > 3 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
            +{template.features.length - 3}
          </span>
        )}
      </div>

      {/* Hover arrow */}
      <div
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ArrowRight size={16} className="text-blue-400" />
      </div>
    </button>
  );
}

// Quick Action Card
function QuickActionCard({
  action,
  onClick,
}: {
  action: (typeof QUICK_ACTIONS)[0];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
        {action.icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{action.label}</div>
        <div className="text-xs text-gray-500">{action.description}</div>
      </div>
      <ArrowRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
    </button>
  );
}

export function BuildLauncher({
  onSelectTemplate,
  onQuickAction,
  onClose,
}: BuildLauncherProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [cloneUrl, setCloneUrl] = useState('');
  const [showCloneInput, setShowCloneInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [showNicheSelector, setShowNicheSelector] = useState(false);

  const filteredTemplates =
    selectedCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const categories: { id: TemplateCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'landing', label: 'Landing' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'blog', label: 'Blog' },
    { id: 'website', label: 'Business' },
    { id: 'shop', label: 'Shop' },
    { id: 'docs', label: 'Docs' },
  ];

  const handleQuickAction = (action: string) => {
    if (action === 'clone') {
      setShowCloneInput(true);
      setShowAiInput(false);
      setShowNicheSelector(false);
    } else if (action === 'ai') {
      setShowAiInput(true);
      setShowCloneInput(false);
      setShowNicheSelector(false);
    } else if (action === 'niche') {
      setShowNicheSelector(true);
      setShowCloneInput(false);
      setShowAiInput(false);
    } else {
      onQuickAction(action);
    }
  };

  const handleNicheSelect = (niche: NichePreset) => {
    // Pass niche info to create optimized project
    onQuickAction('niche', niche.id);
    setShowNicheSelector(false);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium mb-4">
          <Zap size={12} />
          Build Mode
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Was möchtest du bauen?
        </h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Wähle ein Template oder starte mit einer leeren Leinwand. Alles mit Astro 5, Tailwind und Performance-optimiert.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.id}
            action={action}
            onClick={() => handleQuickAction(action.action)}
          />
        ))}
      </div>

      {/* Clone URL Input */}
      {showCloneInput && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm font-medium text-white mb-2">Website URL eingeben:</div>
          <div className="flex gap-2">
            <input
              type="url"
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50"
              autoFocus
            />
            <button
              onClick={() => {
                if (cloneUrl) onQuickAction('clone', cloneUrl);
              }}
              disabled={!cloneUrl}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Klonen
            </button>
          </div>
        </div>
      )}

      {/* AI Prompt Input */}
      {showAiInput && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-blue-400" />
            Beschreibe dein Projekt:
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="z.B. Eine Portfolio-Website für einen Fotografen mit Galerie, Über mich Seite und Kontaktformular..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 resize-none mb-2"
            autoFocus
          />
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (aiPrompt) onQuickAction('ai', aiPrompt);
              }}
              disabled={!aiPrompt}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles size={14} />
              Mit AI erstellen
            </button>
          </div>
        </div>
      )}

      {/* Niche Selector */}
      {showNicheSelector && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20">
          <div className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Target size={14} className="text-violet-400" />
            Wähle deine Branche:
          </div>
          <div className="grid grid-cols-4 gap-2">
            {NICHE_PRESETS.map((niche) => (
              <button
                key={niche.id}
                onClick={() => handleNicheSelect(niche)}
                className="group p-3 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${niche.gradient} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform`}>
                  {niche.icon}
                </div>
                <div className="text-xs font-medium text-white truncate">{niche.name}</div>
                <div className="text-[10px] text-gray-500 truncate">{niche.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-gray-500 text-center">
            Jede Nische beinhaltet optimierte Farben, Trust-Elemente und Compliance-Standards
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500">oder wähle ein Template</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate(template)}
          />
        ))}
      </div>

      {/* Footer tip */}
      <div className="mt-8 text-center text-xs text-gray-600">
        Alle Templates sind PageSpeed 90+, SEO-optimiert und WCAG 2.1 AA konform.
      </div>
    </div>
  );
}

export { TEMPLATES };
export type { Template, TemplateCategory };
