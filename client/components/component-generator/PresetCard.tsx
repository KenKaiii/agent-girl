/**
 * Preset Card Component
 * Displays a single component preset with selection state.
 */

import React from 'react';
import { Component, Check } from 'lucide-react';
import type { ComponentPreset } from '../../hooks/useComponents';

interface PresetCardProps {
  preset: ComponentPreset;
  isSelected: boolean;
  onSelect: (presetName: string) => void;
}

export function PresetCard({ preset, isSelected, onSelect }: PresetCardProps) {
  return (
    <button
      onClick={() => onSelect(preset.name)}
      style={{
        padding: '14px',
        borderRadius: '8px',
        border: '2px solid',
        borderColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
        backgroundColor: isSelected ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 200ms',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
              color: isSelected ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Component style={{ width: '16px', height: '16px' }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
            {preset.name}
          </span>
        </div>
        {isSelected && (
          <Check style={{ width: '16px', height: '16px', color: 'rgb(168, 199, 250)' }} />
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: '12px', color: 'rgb(156, 163, 175)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        {preset.description}
      </p>

      {/* Props */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {preset.props.slice(0, 4).map((prop) => (
          <span
            key={prop}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(107, 114, 128, 0.2)',
              color: 'rgb(156, 163, 175)',
            }}
          >
            {prop}
          </span>
        ))}
        {preset.props.length > 4 && (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(107, 114, 128, 0.2)',
              color: 'rgb(156, 163, 175)',
            }}
          >
            +{preset.props.length - 4}
          </span>
        )}
      </div>
    </button>
  );
}

export default PresetCard;
