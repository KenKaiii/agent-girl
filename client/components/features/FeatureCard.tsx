/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';
import type { Feature } from './types';

interface FeatureCardProps {
  feature: Feature;
  isSelected: boolean;
  onSelect: (featureId: string) => void;
}

export function FeatureCard({ feature, isSelected, onSelect }: FeatureCardProps) {
  const FeatureIcon = feature.icon;

  return (
    <button
      onClick={() => onSelect(feature.id)}
      style={{
        padding: '16px',
        borderRadius: '10px',
        border: '2px solid',
        borderColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
        backgroundColor: isSelected ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 200ms',
      }}
    >
      {/* Icon and Title Row */}
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
        <div
          style={{
            flexShrink: 0,
            padding: '6px',
            borderRadius: '6px',
            backgroundColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
            color: isSelected ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FeatureIcon style={{ width: '20px', height: '20px' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
              {feature.name}
            </div>
            <Tooltip text={feature.tooltip}>
              <HelpCircle
                style={{
                  width: '14px',
                  height: '14px',
                  color: 'rgb(107, 114, 128)',
                  cursor: 'help',
                  flexShrink: 0,
                }}
              />
            </Tooltip>
          </div>

          {/* Template Badge */}
          <div style={{ fontSize: '11px', color: 'rgb(156, 163, 175)' }}>
            {feature.template}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: '12px', color: 'rgb(209, 213, 219)', marginBottom: '12px', lineHeight: '1.5' }}>
        {feature.description}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {feature.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(168, 199, 250, 0.15)',
              color: 'rgb(168, 199, 250)',
              fontWeight: 500,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
