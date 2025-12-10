/**
 * Template Card Component
 * Displays a single project template with preview and selection.
 */

import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import type { Template } from '../../hooks/useTemplates';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

const frameworkIcons: Record<string, string> = {
  astro: '🚀',
  nextjs: '▲',
  react: '⚛️',
  vue: '💚',
  svelte: '🔥',
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  landing: { bg: 'rgba(168, 199, 250, 0.15)', text: 'rgb(168, 199, 250)' },
  blog: { bg: 'rgba(34, 197, 94, 0.15)', text: 'rgb(34, 197, 94)' },
  portfolio: { bg: 'rgba(251, 191, 36, 0.15)', text: 'rgb(251, 191, 36)' },
  saas: { bg: 'rgba(168, 85, 247, 0.15)', text: 'rgb(168, 85, 247)' },
  dashboard: { bg: 'rgba(236, 72, 153, 0.15)', text: 'rgb(236, 72, 153)' },
  ecommerce: { bg: 'rgba(249, 115, 22, 0.15)', text: 'rgb(249, 115, 22)' },
  docs: { bg: 'rgba(59, 130, 246, 0.15)', text: 'rgb(59, 130, 246)' },
};

export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const categoryStyle = categoryColors[template.category] || categoryColors.landing;

  return (
    <button
      onClick={() => onSelect(template.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        borderRadius: '10px',
        border: '2px solid',
        borderColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
        backgroundColor: isSelected ? 'rgba(168, 199, 250, 0.05)' : 'rgb(38, 40, 42)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 200ms',
        overflow: 'hidden',
      }}
    >
      {/* Preview Image */}
      <div
        style={{
          height: '120px',
          backgroundColor: 'rgb(30, 32, 34)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {template.preview ? (
          <img
            src={template.preview}
            alt={template.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            fontSize: '48px',
            opacity: 0.5,
          }}>
            {frameworkIcons[template.framework] || '📦'}
          </div>
        )}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'rgb(168, 199, 250)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check style={{ width: '14px', height: '14px', color: 'rgb(20, 22, 24)' }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                {template.name}
              </span>
              <span style={{ fontSize: '14px' }}>{frameworkIcons[template.framework]}</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: categoryStyle.bg,
                color: categoryStyle.text,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {template.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '12px',
          color: 'rgb(156, 163, 175)',
          margin: '0 0 12px 0',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {template.description}
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {template.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(107, 114, 128, 0.2)',
                color: 'rgb(156, 163, 175)',
              }}
            >
              {feature}
            </span>
          ))}
          {template.features.length > 3 && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(107, 114, 128, 0.2)',
                color: 'rgb(156, 163, 175)',
              }}
            >
              +{template.features.length - 3}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default TemplateCard;
