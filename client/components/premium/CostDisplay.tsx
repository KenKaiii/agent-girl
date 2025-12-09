/**
 * CostDisplay - Real-time cost tracker for premium builds
 * Shows current spend, estimated total, and breakdown by phase
 */

import React, { memo, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface CostBreakdown {
  phase: string;
  phaseName: string;
  tokens: number;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed';
}

interface CostDisplayProps {
  currentCost: number;
  estimatedTotal: number;
  budget: number;
  breakdown: CostBreakdown[];
  tokensUsed: number;
  tokensEstimated: number;
  savingsFromCache: number;
}

export const CostDisplay = memo(function CostDisplay({
  currentCost,
  estimatedTotal,
  budget,
  breakdown,
  tokensUsed,
  tokensEstimated,
  savingsFromCache,
}: CostDisplayProps) {
  // Calculate percentages
  const budgetUsedPercent = useMemo(() => {
    return Math.min(100, Math.round((currentCost / budget) * 100));
  }, [currentCost, budget]);

  const estimatedPercent = useMemo(() => {
    return Math.min(100, Math.round((estimatedTotal / budget) * 100));
  }, [estimatedTotal, budget]);

  // Determine status
  const budgetStatus = useMemo(() => {
    if (estimatedTotal > budget) return 'over';
    if (estimatedTotal > budget * 0.9) return 'warning';
    return 'ok';
  }, [estimatedTotal, budget]);

  // Format currency
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  // Format tokens
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-green-400" />
            <span className="font-medium text-white">Build Cost</span>
          </div>
          <StatusBadge status={budgetStatus} />
        </div>

        {/* Main cost display */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-white">
            {formatCost(currentCost)}
          </span>
          <span className="text-zinc-500">
            / {formatCost(budget)} budget
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
          {/* Estimated total marker */}
          {estimatedPercent < 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-zinc-600 z-10"
              style={{ left: `${estimatedPercent}%` }}
            />
          )}
          {/* Current spend */}
          <div
            className={`
              h-full transition-all duration-300
              ${budgetStatus === 'ok' ? 'bg-green-500' : ''}
              ${budgetStatus === 'warning' ? 'bg-amber-500' : ''}
              ${budgetStatus === 'over' ? 'bg-red-500' : ''}
            `}
            style={{ width: `${budgetUsedPercent}%` }}
          />
        </div>

        {/* Estimated total */}
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Estimated total: {formatCost(estimatedTotal)}
          </span>
          {estimatedTotal < budget ? (
            <span className="flex items-center gap-1 text-green-400">
              <TrendingDown size={14} />
              {formatCost(budget - estimatedTotal)} under budget
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-400">
              <TrendingUp size={14} />
              {formatCost(estimatedTotal - budget)} over budget
            </span>
          )}
        </div>
      </div>

      {/* Token usage */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-800/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Tokens Used</div>
            <div className="font-medium text-white">{formatTokens(tokensUsed)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Est. Total</div>
            <div className="font-medium text-white">{formatTokens(tokensEstimated)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Cache Savings</div>
            <div className="font-medium text-green-400">{formatCost(savingsFromCache)}</div>
          </div>
        </div>
      </div>

      {/* Phase breakdown */}
      <div className="p-4">
        <h4 className="text-xs uppercase text-zinc-500 font-medium mb-3">
          Cost by Phase
        </h4>
        <div className="space-y-2">
          {breakdown.map((phase) => (
            <PhaseRow key={phase.phase} phase={phase} totalCost={estimatedTotal} />
          ))}
        </div>
      </div>

      {/* Savings callout */}
      {savingsFromCache > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-green-400" />
              <span className="text-sm text-green-300">
                Saved {formatCost(savingsFromCache)} with intelligent caching
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'over';
}

const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'ok') {
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
        <CheckCircle2 size={12} />
        On Budget
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">
        <AlertTriangle size={12} />
        Near Limit
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
      <AlertTriangle size={12} />
      Over Budget
    </span>
  );
});

interface PhaseRowProps {
  phase: CostBreakdown;
  totalCost: number;
}

const PhaseRow = memo(function PhaseRow({ phase, totalCost }: PhaseRowProps) {
  const percent = totalCost > 0 ? Math.round((phase.cost / totalCost) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      <div
        className={`
          w-2 h-2 rounded-full
          ${phase.status === 'completed' ? 'bg-green-400' : ''}
          ${phase.status === 'in_progress' ? 'bg-amber-400 animate-pulse' : ''}
          ${phase.status === 'pending' ? 'bg-zinc-600' : ''}
        `}
      />

      {/* Phase name */}
      <span
        className={`
          flex-1 text-sm
          ${phase.status === 'pending' ? 'text-zinc-500' : 'text-zinc-300'}
        `}
      >
        {phase.phaseName}
      </span>

      {/* Cost */}
      <span
        className={`
          text-sm font-mono
          ${phase.status === 'pending' ? 'text-zinc-600' : 'text-zinc-400'}
        `}
      >
        ${phase.cost.toFixed(2)}
      </span>

      {/* Percent bar */}
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`
            h-full transition-all duration-300
            ${phase.status === 'completed' ? 'bg-green-500' : ''}
            ${phase.status === 'in_progress' ? 'bg-amber-500' : ''}
            ${phase.status === 'pending' ? 'bg-zinc-700' : ''}
          `}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
});

export default CostDisplay;
