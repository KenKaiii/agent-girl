/**
 * NicheSelector - Business category picker
 * Auto-detects from input or manual selection
 */

import React, { memo, useState, useCallback } from 'react';
import {
  Stethoscope,
  Code2,
  ShoppingBag,
  UtensilsCrossed,
  Camera,
  Briefcase,
  MapPin,
  Home,
  Dumbbell,
  GraduationCap,
  Search,
  Sparkles,
  Check,
} from 'lucide-react';

interface NicheConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  color: string;
}

interface NicheSelectorProps {
  onSelect: (nicheId: string) => void;
  selectedId?: string;
  businessDescription?: string;
}

const NICHES: NicheConfig[] = [
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    description: 'Doctors, dentists, clinics, therapists',
    icon: <Stethoscope size={20} />,
    keywords: ['arzt', 'doctor', 'zahnarzt', 'dentist', 'klinik', 'clinic', 'praxis', 'therapist', 'physiotherapie', 'healthcare', 'medical'],
    color: '#3B82F6',
  },
  {
    id: 'saas',
    name: 'SaaS & Software',
    description: 'Software products, apps, digital tools',
    icon: <Code2 size={20} />,
    keywords: ['saas', 'software', 'app', 'tool', 'platform', 'startup', 'tech'],
    color: '#8B5CF6',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce & Retail',
    description: 'Online shops, product sales',
    icon: <ShoppingBag size={20} />,
    keywords: ['shop', 'store', 'ecommerce', 'products', 'verkauf', 'online shop', 'retail'],
    color: '#10B981',
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Food',
    description: 'Restaurants, cafes, bars, catering',
    icon: <UtensilsCrossed size={20} />,
    keywords: ['restaurant', 'cafe', 'bar', 'food', 'essen', 'gastronomie', 'bistro', 'catering'],
    color: '#F59E0B',
  },
  {
    id: 'portfolio',
    name: 'Portfolio & Creative',
    description: 'Designers, photographers, artists',
    icon: <Camera size={20} />,
    keywords: ['portfolio', 'designer', 'photographer', 'artist', 'freelancer', 'creative', 'fotograf'],
    color: '#EC4899',
  },
  {
    id: 'agency',
    name: 'Agency & Consulting',
    description: 'Marketing agencies, consultants',
    icon: <Briefcase size={20} />,
    keywords: ['agency', 'agentur', 'consulting', 'beratung', 'marketing', 'digital agency'],
    color: '#6366F1',
  },
  {
    id: 'localBusiness',
    name: 'Local Business',
    description: 'Local shops, services, small businesses',
    icon: <MapPin size={20} />,
    keywords: ['local', 'lokal', 'handwerk', 'service', 'dienstleistung', 'shop', 'laden'],
    color: '#14B8A6',
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    description: 'Real estate agents, property listings',
    icon: <Home size={20} />,
    keywords: ['immobilien', 'real estate', 'makler', 'property', 'wohnung', 'haus'],
    color: '#D4AF37',
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    description: 'Gyms, personal trainers, yoga studios',
    icon: <Dumbbell size={20} />,
    keywords: ['fitness', 'gym', 'yoga', 'personal trainer', 'wellness', 'spa', 'sport'],
    color: '#EF4444',
  },
  {
    id: 'education',
    name: 'Education & Courses',
    description: 'Online courses, tutoring, schools',
    icon: <GraduationCap size={20} />,
    keywords: ['education', 'course', 'kurs', 'school', 'schule', 'tutoring', 'nachhilfe', 'lernen'],
    color: '#F472B6',
  },
];

export const NicheSelector = memo(function NicheSelector({
  onSelect,
  selectedId,
  businessDescription,
}: NicheSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [detectedNiche, setDetectedNiche] = useState<string | null>(null);

  // Auto-detect niche from business description
  const detectNiche = useCallback((text: string): string | null => {
    const textLower = text.toLowerCase();
    for (const niche of NICHES) {
      for (const keyword of niche.keywords) {
        if (textLower.includes(keyword)) {
          return niche.id;
        }
      }
    }
    return null;
  }, []);

  // Update detection when business description changes
  React.useEffect(() => {
    if (businessDescription) {
      const detected = detectNiche(businessDescription);
      setDetectedNiche(detected);
      if (detected && !selectedId) {
        onSelect(detected);
      }
    }
  }, [businessDescription, detectNiche, selectedId, onSelect]);

  // Filter niches based on search
  const filteredNiches = searchTerm
    ? NICHES.filter(
        (n) =>
          n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.keywords.some((k) => k.includes(searchTerm.toLowerCase()))
      )
    : NICHES;

  return (
    <div className="space-y-4">
      {/* Auto-detection badge */}
      {detectedNiche && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-sm text-amber-200">
            Auto-detected:{' '}
            <span className="font-medium">
              {NICHES.find((n) => n.id === detectedNiche)?.name}
            </span>
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          placeholder="Search business category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Niche grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredNiches.map((niche) => (
          <NicheCard
            key={niche.id}
            niche={niche}
            isSelected={selectedId === niche.id}
            isDetected={detectedNiche === niche.id}
            onSelect={() => onSelect(niche.id)}
          />
        ))}
      </div>

      {filteredNiches.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          No matching categories found. Try a different search term.
        </div>
      )}
    </div>
  );
});

interface NicheCardProps {
  niche: NicheConfig;
  isSelected: boolean;
  isDetected: boolean;
  onSelect: () => void;
}

const NicheCard = memo(function NicheCard({
  niche,
  isSelected,
  isDetected,
  onSelect,
}: NicheCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        relative p-3 rounded-xl border-2 transition-all duration-200 text-left
        ${isSelected
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Check size={12} className="text-black" />
        </div>
      )}

      {/* Auto-detected indicator */}
      {isDetected && !isSelected && (
        <div className="absolute top-2 right-2">
          <Sparkles size={14} className="text-amber-400" />
        </div>
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
        style={{
          backgroundColor: `${niche.color}20`,
          color: niche.color,
        }}
      >
        {niche.icon}
      </div>

      {/* Name and description */}
      <h3 className="font-medium text-white text-sm mb-0.5">{niche.name}</h3>
      <p className="text-xs text-zinc-500 line-clamp-2">{niche.description}</p>
    </button>
  );
});

export default NicheSelector;
