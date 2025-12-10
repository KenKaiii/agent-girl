/**
 * Agent Girl - Prompt Library Component
 * Browse, search, and use workflow prompts
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { X, Search, Copy, Pencil, Zap, Clock, Tag, ChevronRight, Check, Sparkles } from 'lucide-react';
import {
  promptTemplates,
  categoryLabels,
  categoryIcons,
  searchTemplates,
  type PromptTemplate,
} from './promptTemplates';

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string, useAutonom?: boolean) => void;
  onEditPrompt: (prompt: string) => void;
  onClose: () => void;
}

type CategoryFilter = PromptTemplate['category'] | 'all';
type TierFilter = 1 | 2 | 3 | 'all';

const PromptCard = memo(function PromptCard({
  template,
  onSelect,
  onEdit,
}: {
  template: PromptTemplate;
  onSelect: (prompt: string, useAutonom?: boolean) => void;
  onEdit: (prompt: string) => void;
}) {
  const [showVariables, setShowVariables] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Build prompt with variables
  const buildPrompt = useCallback(() => {
    let prompt = template.prompt;
    if (template.variables) {
      template.variables.forEach(v => {
        const value = variables[v.key] || v.placeholder;
        prompt = prompt.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), value);
      });
    }
    return prompt;
  }, [template, variables]);

  const handleCopy = useCallback(() => {
    const prompt = buildPrompt();
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildPrompt]);

  const handleUse = useCallback((withAutonom: boolean) => {
    const prompt = buildPrompt();
    onSelect(prompt, withAutonom);
  }, [buildPrompt, onSelect]);

  const handleEdit = useCallback(() => {
    const prompt = buildPrompt();
    onEdit(prompt);
  }, [buildPrompt, onEdit]);

  const tierColors = {
    1: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    2: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    3: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  const tierLabels = {
    1: 'Essential',
    2: 'High ROI',
    3: 'Productivity',
  };

  return (
    <div
      className={`relative rounded-xl border bg-gradient-to-br ${tierColors[template.tier]} backdrop-blur-sm transition-all hover:scale-[1.01] hover:shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryIcons[template.category]}</span>
            <div>
              <h3 className="font-semibold text-white text-sm">{template.name}</h3>
              <p className="text-xs text-white/50">{categoryLabels[template.category]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {template.recommendAutonom && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30"
                title="Recommended for Autonom Mode"
              >
                <Zap size={10} className="inline mr-0.5" />
                Auto
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/60">
              {tierLabels[template.tier]}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/70 line-clamp-2">{template.description}</p>
      </div>

      {/* Meta info */}
      <div className="px-4 py-2 flex items-center gap-3 text-[10px] text-white/40">
        {template.estimatedTime && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {template.estimatedTime}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Tag size={10} />
          {template.tags.slice(0, 3).join(', ')}
        </span>
      </div>

      {/* Variables Section (collapsible) */}
      {template.variables && template.variables.length > 0 && (
        <div className="border-t border-white/10">
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-white/60 hover:text-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Pencil size={12} />
              {showVariables ? 'Hide' : 'Customize'} Variables ({template.variables.length})
            </span>
            <ChevronRight
              size={14}
              className={`transition-transform ${showVariables ? 'rotate-90' : ''}`}
            />
          </button>

          {showVariables && (
            <div className="px-4 pb-3 space-y-2">
              {template.variables.map(v => (
                <div key={v.key}>
                  <label className="text-[10px] text-white/50 mb-0.5 block">{v.description}</label>
                  <input
                    type="text"
                    placeholder={v.placeholder}
                    value={variables[v.key] || ''}
                    onChange={e => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs bg-black/30 border border-white/10 rounded-md text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 border-t border-white/10 flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
          title="Edit in chat input"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          onClick={() => handleUse(template.recommendAutonom || false)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 transition-all"
          title={template.recommendAutonom ? 'Use with Autonom Mode' : 'Use prompt'}
        >
          {template.recommendAutonom ? <Zap size={14} /> : <Sparkles size={14} />}
          Use
        </button>
      </div>
    </div>
  );
});

export const PromptLibrary = memo(function PromptLibrary({
  onSelectPrompt,
  onEditPrompt,
  onClose,
}: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let results = searchQuery ? searchTemplates(searchQuery) : promptTemplates;

    if (categoryFilter !== 'all') {
      results = results.filter(t => t.category === categoryFilter);
    }

    if (tierFilter !== 'all') {
      results = results.filter(t => t.tier === tierFilter);
    }

    return results;
  }, [searchQuery, categoryFilter, tierFilter]);

  // Group by tier for display
  const groupedTemplates = useMemo(() => {
    const tier1 = filteredTemplates.filter(t => t.tier === 1);
    const tier2 = filteredTemplates.filter(t => t.tier === 2);
    const tier3 = filteredTemplates.filter(t => t.tier === 3);
    return { tier1, tier2, tier3 };
  }, [filteredTemplates]);

  const categories: CategoryFilter[] = ['all', 'business-de', 'business-eu', 'business-us', 'development', 'productivity', 'legal'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 border-b border-white/10"
          style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #1a1a2e 100%)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Prompt Library</h2>
                <p className="text-xs text-white/50">
                  {filteredTemplates.length} workflows for real business results
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Search workflows... (e.g., invoice, GDPR, landing page)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${categoryLabels[cat]}`}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-white/40 mr-1">Tier:</span>
              {(['all', 1, 2, 3] as TierFilter[]).map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    tierFilter === tier
                      ? tier === 1
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : tier === 2
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : tier === 3
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-white/10 text-white border border-white/20'
                      : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                  }`}
                >
                  {tier === 'all' ? 'All' : tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Tier 1: Essential */}
          {groupedTemplates.tier1.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-400">1</span>
                </div>
                <h3 className="text-sm font-semibold text-white">Essential Workflows</h3>
                <span className="text-xs text-white/40">Immediate business value</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedTemplates.tier1.map(template => (
                  <PromptCard
                    key={template.id}
                    template={template}
                    onSelect={onSelectPrompt}
                    onEdit={onEditPrompt}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Tier 2: High ROI */}
          {groupedTemplates.tier2.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">2</span>
                </div>
                <h3 className="text-sm font-semibold text-white">High ROI</h3>
                <span className="text-xs text-white/40">Maximum efficiency gains</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedTemplates.tier2.map(template => (
                  <PromptCard
                    key={template.id}
                    template={template}
                    onSelect={onSelectPrompt}
                    onEdit={onEditPrompt}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Tier 3: Productivity */}
          {groupedTemplates.tier3.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-400">3</span>
                </div>
                <h3 className="text-sm font-semibold text-white">Productivity</h3>
                <span className="text-xs text-white/40">Everyday development tools</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedTemplates.tier3.map(template => (
                  <PromptCard
                    key={template.id}
                    template={template}
                    onSelect={onSelectPrompt}
                    onEdit={onEditPrompt}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/50">No workflows found</p>
              <p className="text-xs text-white/30 mt-1">Try a different search term or filter</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5">
          <p className="text-xs text-white/40 text-center">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">Esc</kbd>
            {' '}to close &bull; Click &quot;Use&quot; to send directly &bull; Click &quot;Edit&quot; to customize first
          </p>
        </div>
      </div>
    </div>
  );
});
