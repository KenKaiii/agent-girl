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

  // Subtle tier indicators - no loud gradients
  const tierStyles = {
    1: 'border-emerald-600/20 hover:border-emerald-500/30',
    2: 'border-sky-600/20 hover:border-sky-500/30',
    3: 'border-slate-500/20 hover:border-slate-400/30',
  };

  const tierAccent = {
    1: 'text-emerald-400',
    2: 'text-sky-400',
    3: 'text-slate-400',
  };

  const tierLabels = {
    1: 'Essential',
    2: 'Advanced',
    3: 'Utility',
  };

  return (
    <div
      className={`relative rounded-xl border bg-zinc-900/50 ${tierStyles[template.tier]} transition-all duration-200 hover:bg-zinc-900/80`}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-lg opacity-80">{categoryIcons[template.category]}</span>
            <div>
              <h3 className="font-medium text-zinc-100 text-sm">{template.name}</h3>
              <p className="text-xs text-zinc-500">{categoryLabels[template.category]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {template.recommendAutonom && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500/80 border border-amber-500/20"
                title="Recommended for Autonom Mode"
              >
                <Zap size={10} className="inline mr-0.5" />
                Auto
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 ${tierAccent[template.tier]}`}>
              {tierLabels[template.tier]}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">{template.description}</p>
      </div>

      {/* Meta info */}
      <div className="px-4 py-2 flex items-center gap-3 text-[10px] text-zinc-500">
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
        <div className="border-t border-zinc-800">
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Pencil size={12} />
              {showVariables ? 'Hide' : 'Customize'} Variables ({template.variables.length})
            </span>
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${showVariables ? 'rotate-90' : ''}`}
            />
          </button>

          {showVariables && (
            <div className="px-4 pb-3 space-y-2">
              {template.variables.map(v => (
                <div key={v.key}>
                  <label className="text-[10px] text-zinc-500 mb-0.5 block">{v.description}</label>
                  <input
                    type="text"
                    placeholder={v.placeholder}
                    value={variables[v.key] || ''}
                    onChange={e => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 border-t border-zinc-800 flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-all duration-150"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-all duration-150"
          title="Edit in chat input"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          onClick={() => handleUse(template.recommendAutonom || false)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-900 transition-all duration-150"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col bg-zinc-950 border border-zinc-800"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Sparkles size={18} className="text-zinc-300" />
              </div>
              <div>
                <h2 className="text-base font-medium text-zinc-100">Workflow Templates</h2>
                <p className="text-xs text-zinc-500">
                  {filteredTemplates.length} workflows available
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-1 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    categoryFilter === cat
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${categoryLabels[cat]}`}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-zinc-600 mr-1">Tier:</span>
              {(['all', 1, 2, 3] as TierFilter[]).map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all duration-150 ${
                    tierFilter === tier
                      ? tier === 1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : tier === 2
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : tier === 3
                        ? 'bg-zinc-700 text-zinc-300 border border-zinc-600'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-zinc-800/50'
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
                <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-emerald-400">1</span>
                </div>
                <h3 className="text-sm font-medium text-zinc-200">Essential</h3>
                <span className="text-xs text-zinc-600">— Immediate business value</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

          {/* Tier 2: Advanced */}
          {groupedTemplates.tier2.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-sky-500/10 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-sky-400">2</span>
                </div>
                <h3 className="text-sm font-medium text-zinc-200">Advanced</h3>
                <span className="text-xs text-zinc-600">— Complex workflows</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

          {/* Tier 3: Utility */}
          {groupedTemplates.tier3.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-zinc-400">3</span>
                </div>
                <h3 className="text-sm font-medium text-zinc-200">Utility</h3>
                <span className="text-xs text-zinc-600">— Everyday tools</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div className="text-center py-16">
              <Search size={40} className="mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-500">No workflows found</p>
              <p className="text-xs text-zinc-600 mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-600 text-center">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono text-[10px]">Esc</kbd>
            {' '}to close • Use to send directly • Edit to customize
          </p>
        </div>
      </div>
    </div>
  );
});
