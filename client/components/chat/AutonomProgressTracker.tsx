import React from 'react';
import { CheckCircle2, Clock, Zap, AlertTriangle, Cpu } from 'lucide-react';

interface AutonomProgressTrackerProps {
  stepNumber: number;
  maxSteps: number;
  budgetUsed: number;
  budgetRemaining: string;
  tokensRemaining: number;
  totalCost: string;
  maxCost: number;
  stepsCompleted: string[];
  selectedModel?: string;
  errorCount?: number;
  problematicSteps?: string[];
}

export const AutonomProgressTracker: React.FC<AutonomProgressTrackerProps> = ({
  stepNumber,
  maxSteps,
  budgetUsed,
  budgetRemaining,
  tokensRemaining,
  totalCost,
  maxCost,
  stepsCompleted,
  selectedModel = 'haiku',
  errorCount = 0,
  problematicSteps = [],
}) => {
  const progressPercent = (stepNumber / maxSteps) * 100;
  const budgetPercent = budgetUsed * 100;
  const tokensDisplay = tokensRemaining.toLocaleString();

  // Color based on budget usage
  const getBudgetColor = () => {
    if (budgetPercent >= 90) return 'from-red-500 to-red-600';
    if (budgetPercent >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const getProgressColor = () => {
    if (progressPercent >= 90) return 'from-blue-500 to-blue-600';
    if (progressPercent >= 50) return 'from-purple-500 to-purple-600';
    return 'from-cyan-500 to-cyan-600';
  };

  // Model color and badge styling
  const getModelColor = () => {
    switch (selectedModel?.toLowerCase()) {
      case 'opus':
        return 'bg-purple-900/50 border-purple-600 text-purple-300';
      case 'sonnet':
        return 'bg-blue-900/50 border-blue-600 text-blue-300';
      case 'haiku':
      default:
        return 'bg-cyan-900/50 border-cyan-600 text-cyan-300';
    }
  };

  const getModelLabel = () => {
    switch (selectedModel?.toLowerCase()) {
      case 'opus':
        return 'Opus 4.5 (Max Power)';
      case 'sonnet':
        return 'Sonnet 4.5 (Escalation)';
      case 'haiku':
      default:
        return 'Haiku 4.5 (Cost Optimized)';
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 mb-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            AUTONOM Execution
          </h3>
          <p className="text-sm text-slate-400 mt-1">Step {stepNumber} of {maxSteps}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">{Math.round(progressPercent)}%</div>
          <div className="text-xs text-slate-400">Complete</div>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-200">Execution Progress</span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
            {stepNumber}/{maxSteps} steps
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Budget Meter */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">Budget Usage</span>
          </div>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
            ${totalCost}/${maxCost}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getBudgetColor()} rounded-full transition-all duration-500`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-400">
          ${budgetRemaining} remaining • {tokensDisplay} tokens left
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Step Progress</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">{stepNumber}/{maxSteps}</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Budget Left</div>
          <div className="text-lg font-bold text-green-400 mt-1">${budgetRemaining}</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Budget Used</div>
          <div className="text-lg font-bold text-yellow-400 mt-1">{budgetPercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* Model Selection & Error Status */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`rounded-lg p-3 border ${getModelColor()}`}>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <div>
              <div className="text-xs opacity-75 uppercase tracking-wider">Active Model</div>
              <div className="text-sm font-bold mt-1">{getModelLabel()}</div>
            </div>
          </div>
        </div>
        {errorCount > 0 && (
          <div className="bg-amber-900/50 border border-amber-600 text-amber-300 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <div>
                <div className="text-xs opacity-75 uppercase tracking-wider">Errors on Step</div>
                <div className="text-sm font-bold mt-1">{errorCount} attempt{errorCount !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Problematic Steps */}
      {problematicSteps.length > 0 && (
        <div className="border-t border-slate-700 pt-4 mb-4">
          <div className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Problematic Steps ({problematicSteps.length})
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {problematicSteps.map((step, idx) => (
              <div
                key={idx}
                className="text-xs text-amber-200 bg-amber-900/20 rounded px-3 py-1.5 border border-amber-700/50 flex items-start gap-2"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="font-mono">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline of Completed Steps */}
      {stepsCompleted.length > 0 && (
        <div className="border-t border-slate-700 pt-4">
          <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Completed Steps ({stepsCompleted.length})
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {stepsCompleted.map((step, idx) => (
              <div
                key={idx}
                className="text-xs text-slate-300 bg-slate-700/30 rounded px-3 py-1.5 border border-slate-600/50 flex items-start gap-2"
              >
                <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="font-mono">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-slate-400">Executing step {stepNumber}...</span>
      </div>
    </div>
  );
};
