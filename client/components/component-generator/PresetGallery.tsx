/**
 * Preset Gallery Component
 * Displays component presets organized by category with filtering.
 */

import React, { useState } from 'react';
import { Layers, Layout, FormInput, Database, Megaphone, Search } from 'lucide-react';
import { PresetCard } from './PresetCard';
import type { ComponentPreset } from '../../hooks/useComponents';

interface PresetCategories {
  ui: ComponentPreset[];
  layout: ComponentPreset[];
  form: ComponentPreset[];
  data: ComponentPreset[];
  marketing: ComponentPreset[];
}

interface PresetGalleryProps {
  presets: PresetCategories | null;
  selectedPreset: string | null;
  onSelectPreset: (presetName: string) => void;
  isLoading: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  ui: Layers,
  layout: Layout,
  form: FormInput,
  data: Database,
  marketing: Megaphone,
};

const categoryLabels: Record<string, string> = {
  ui: 'UI Components',
  layout: 'Layout',
  form: 'Form Elements',
  data: 'Data Display',
  marketing: 'Marketing',
};

export function PresetGallery({ presets, selectedPreset, onSelectPreset, isLoading }: PresetGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgb(156, 163, 175)' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(168, 199, 250, 0.3)',
          borderTopColor: 'rgb(168, 199, 250)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        Presets werden geladen...
      </div>
    );
  }

  if (!presets) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgb(156, 163, 175)' }}>
        Keine Presets verfügbar
      </div>
    );
  }

  const categories = Object.keys(presets) as (keyof PresetCategories)[];

  // Filter presets by search query
  const filteredPresets = categories.reduce((acc, category) => {
    const categoryPresets = presets[category] || [];
    const filtered = categoryPresets.filter(preset =>
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Partial<PresetCategories>);

  const displayCategories = activeCategory
    ? [activeCategory as keyof PresetCategories]
    : (Object.keys(filteredPresets) as (keyof PresetCategories)[]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          color: 'rgb(107, 114, 128)',
        }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Presets durchsuchen..."
          style={{
            width: '100%',
            padding: '10px 12px 10px 40px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgb(30, 32, 34)',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeCategory === null ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
            color: activeCategory === null ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
        >
          Alle
        </button>
        {categories.map((category) => {
          const Icon = categoryIcons[category];
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeCategory === category ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                color: activeCategory === category ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              {categoryLabels[category]}
            </button>
          );
        })}
      </div>

      {/* Preset Grid */}
      {displayCategories.map((category) => {
        const categoryPresets = filteredPresets[category] || [];
        if (categoryPresets.length === 0) return null;

        return (
          <div key={category}>
            {!activeCategory && (
              <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgb(156, 163, 175)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}>
                {categoryLabels[category]}
              </h3>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              {categoryPresets.map((preset) => (
                <PresetCard
                  key={preset.name}
                  preset={preset}
                  isSelected={selectedPreset === preset.name}
                  onSelect={onSelectPreset}
                />
              ))}
            </div>
          </div>
        );
      })}

      {Object.keys(filteredPresets).length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgb(156, 163, 175)' }}>
          Keine Presets gefunden für "{searchQuery}"
        </div>
      )}
    </div>
  );
}

export default PresetGallery;
