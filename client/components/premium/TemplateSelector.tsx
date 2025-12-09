/**
 * TemplateSelector - Visual design system picker
 * Shows 5 design system options with previews
 */

import React, { memo, useState } from 'react';
import { Check, Palette, Type, Sparkles } from 'lucide-react';

interface DesignSystem {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  bestFor: string[];
}

interface TemplateSelectorProps {
  onSelect: (designSystemId: string) => void;
  selectedId?: string;
}

const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines, bold typography, tech-forward',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      background: '#FFFFFF',
      text: '#1E293B',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    bestFor: ['Tech', 'SaaS', 'Startups', 'Agencies'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Whitespace-focused, elegant, content-first',
    colors: {
      primary: '#18181B',
      secondary: '#71717A',
      background: '#FFFFFF',
      text: '#18181B',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Outfit',
    },
    bestFor: ['Portfolio', 'Photography', 'Architecture', 'Design'],
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional, trustworthy, established',
    colors: {
      primary: '#1E40AF',
      secondary: '#0369A1',
      background: '#FFFFFF',
      text: '#0F172A',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans',
    },
    bestFor: ['Finance', 'Legal', 'Healthcare', 'Consulting'],
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Colorful, friendly, approachable',
    colors: {
      primary: '#8B5CF6',
      secondary: '#F472B6',
      background: '#FFFBEB',
      text: '#1F2937',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Nunito',
    },
    bestFor: ['Kids', 'Education', 'Food', 'Lifestyle'],
  },
  {
    id: 'premiumDark',
    name: 'Premium Dark',
    description: 'Luxurious, exclusive, high-end',
    colors: {
      primary: '#D4AF37',
      secondary: '#C0C0C0',
      background: '#0A0A0A',
      text: '#FAFAFA',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
    },
    bestFor: ['Luxury', 'Fashion', 'Restaurants', 'Real Estate'],
  },
];

export const TemplateSelector = memo(function TemplateSelector({
  onSelect,
  selectedId,
}: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
        <Sparkles size={16} className="text-amber-400" />
        <span>Choose your design style</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DESIGN_SYSTEMS.map((system) => (
          <DesignSystemCard
            key={system.id}
            system={system}
            isSelected={selectedId === system.id}
            isHovered={hoveredId === system.id}
            onSelect={() => onSelect(system.id)}
            onHover={() => setHoveredId(system.id)}
            onLeave={() => setHoveredId(null)}
          />
        ))}
      </div>

      {selectedId && (
        <div className="mt-6 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <DesignSystemPreview system={DESIGN_SYSTEMS.find((s) => s.id === selectedId)!} />
        </div>
      )}
    </div>
  );
});

interface DesignSystemCardProps {
  system: DesignSystem;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}

const DesignSystemCard = memo(function DesignSystemCard({
  system,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: DesignSystemCardProps) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200 text-left
        ${isSelected
          ? 'border-amber-500 bg-amber-500/10'
          : isHovered
            ? 'border-zinc-600 bg-zinc-800/50'
            : 'border-zinc-700 bg-zinc-900/50'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
          <Check size={14} className="text-black" />
        </div>
      )}

      {/* Color palette preview */}
      <div className="flex gap-1.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg shadow-sm"
          style={{ backgroundColor: system.colors.primary }}
          title="Primary"
        />
        <div
          className="w-8 h-8 rounded-lg shadow-sm"
          style={{ backgroundColor: system.colors.secondary }}
          title="Secondary"
        />
        <div
          className="w-8 h-8 rounded-lg shadow-sm border border-zinc-600"
          style={{ backgroundColor: system.colors.background }}
          title="Background"
        />
        <div
          className="w-8 h-8 rounded-lg shadow-sm"
          style={{ backgroundColor: system.colors.text }}
          title="Text"
        />
      </div>

      {/* Name and description */}
      <h3 className="font-semibold text-white mb-1">{system.name}</h3>
      <p className="text-sm text-zinc-400 mb-3">{system.description}</p>

      {/* Best for tags */}
      <div className="flex flex-wrap gap-1.5">
        {system.bestFor.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-300"
          >
            {tag}
          </span>
        ))}
        {system.bestFor.length > 3 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-500">
            +{system.bestFor.length - 3}
          </span>
        )}
      </div>
    </button>
  );
});

interface DesignSystemPreviewProps {
  system: DesignSystem;
}

const DesignSystemPreview = memo(function DesignSystemPreview({
  system,
}: DesignSystemPreviewProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-white flex items-center gap-2">
        <Palette size={16} className="text-amber-400" />
        {system.name} Design System Preview
      </h4>

      <div className="grid grid-cols-2 gap-4">
        {/* Colors */}
        <div className="space-y-2">
          <h5 className="text-xs uppercase text-zinc-500 font-medium">Colors</h5>
          <div className="space-y-1.5">
            {Object.entries(system.colors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border border-zinc-600"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-zinc-300 capitalize">{name}</span>
                <span className="text-xs text-zinc-500 font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <h5 className="text-xs uppercase text-zinc-500 font-medium flex items-center gap-1">
            <Type size={12} />
            Typography
          </h5>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-zinc-500">Heading</span>
              <p
                className="text-lg font-semibold text-white"
                style={{ fontFamily: system.fonts.heading }}
              >
                {system.fonts.heading}
              </p>
            </div>
            <div>
              <span className="text-xs text-zinc-500">Body</span>
              <p
                className="text-sm text-zinc-300"
                style={{ fontFamily: system.fonts.body }}
              >
                {system.fonts.body} - The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mini preview */}
      <div
        className="rounded-lg overflow-hidden border border-zinc-700"
        style={{ backgroundColor: system.colors.background }}
      >
        <div className="p-4 space-y-3">
          <div
            className="h-2 w-24 rounded"
            style={{ backgroundColor: system.colors.primary }}
          />
          <div
            className="h-6 w-48 rounded"
            style={{
              backgroundColor: system.colors.text,
              opacity: 0.9,
            }}
          />
          <div
            className="h-3 w-64 rounded"
            style={{
              backgroundColor: system.colors.text,
              opacity: 0.5,
            }}
          />
          <div className="flex gap-2 pt-2">
            <div
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: system.colors.primary,
                color: system.colors.background,
              }}
            >
              Primary Button
            </div>
            <div
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{
                borderColor: system.colors.primary,
                color: system.colors.primary,
              }}
            >
              Secondary
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TemplateSelector;
