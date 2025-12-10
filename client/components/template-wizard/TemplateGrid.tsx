/**
 * Template Grid Component
 * Displays templates with filtering by category and framework.
 */

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { TemplateCard } from './TemplateCard';
import type { Template } from '../../hooks/useTemplates';

interface TemplateGridProps {
  templates: Template[];
  categories: string[];
  frameworks: string[];
  selectedTemplate: string | null;
  selectedCategory: string | null;
  selectedFramework: string | null;
  onSelectTemplate: (templateId: string) => void;
  onSelectCategory: (category: string | null) => void;
  onSelectFramework: (framework: string | null) => void;
  isLoading: boolean;
}

const frameworkLabels: Record<string, { label: string; icon: string }> = {
  astro: { label: 'Astro', icon: '🚀' },
  nextjs: { label: 'Next.js', icon: '▲' },
  react: { label: 'React', icon: '⚛️' },
  vue: { label: 'Vue', icon: '💚' },
  svelte: { label: 'Svelte', icon: '🔥' },
};

const categoryLabels: Record<string, string> = {
  landing: 'Landing Page',
  blog: 'Blog',
  portfolio: 'Portfolio',
  saas: 'SaaS',
  dashboard: 'Dashboard',
  ecommerce: 'E-Commerce',
  docs: 'Documentation',
};

export function TemplateGrid({
  templates,
  categories,
  frameworks,
  selectedTemplate,
  selectedCategory,
  selectedFramework,
  onSelectTemplate,
  onSelectCategory,
  onSelectFramework,
  isLoading,
}: TemplateGridProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

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
        Templates werden geladen...
      </div>
    );
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!template.name.toLowerCase().includes(query) &&
          !template.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedCategory && template.category !== selectedCategory) return false;
    if (selectedFramework && template.framework !== selectedFramework) return false;
    return true;
  });

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
          placeholder="Templates durchsuchen..."
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Framework Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter style={{ width: '14px', height: '14px', color: 'rgb(107, 114, 128)' }} />
          <span style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>Framework:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onSelectFramework(null)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: selectedFramework === null ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                color: selectedFramework === null ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Alle
            </button>
            {frameworks.map((fw) => (
              <button
                key={fw}
                onClick={() => onSelectFramework(fw)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: selectedFramework === fw ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedFramework === fw ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <span>{frameworkLabels[fw]?.icon || '📦'}</span>
                {frameworkLabels[fw]?.label || fw}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>Kategorie:</span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onSelectCategory(null)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: selectedCategory === null ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                color: selectedCategory === null ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Alle
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: selectedCategory === cat ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedCategory === cat ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
      }}>
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={onSelectTemplate}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgb(156, 163, 175)' }}>
          Keine Templates gefunden
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default TemplateGrid;
