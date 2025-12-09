/**
 * BuildProgress - Premium website build progress tracker
 * Shows phases, steps, cost, and preview readiness
 */

import React, { memo, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  DollarSign,
  Zap,
  AlertCircle,
  Eye,
  Download,
  Rocket,
  Settings,
  Palette,
  Layout,
  FileText,
  Image,
  Search,
  Plug,
  Shield,
  Package,
} from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  description: string;
  steps: number;
  completedSteps: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface BuildProgressProps {
  phases: Phase[];
  currentStep: number;
  totalSteps: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  currentCost: number;
  estimatedTotalCost: number;
  previewReady: boolean;
  previewUrl?: string;
  currentActivity?: string;
  errors: string[];
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  foundation: <Settings size={16} />,
  components: <Layout size={16} />,
  sections: <Palette size={16} />,
  pages: <FileText size={16} />,
  content: <FileText size={16} />,
  images: <Image size={16} />,
  seo: <Search size={16} />,
  integrations: <Plug size={16} />,
  validation: <Shield size={16} />,
  delivery: <Package size={16} />,
};

export const BuildProgress = memo(function BuildProgress({
  phases,
  currentStep,
  totalSteps,
  elapsedTime,
  estimatedTimeRemaining,
  currentCost,
  estimatedTotalCost,
  previewReady,
  previewUrl,
  currentActivity,
  errors,
}: BuildProgressProps) {
  // Calculate overall progress
  const overallProgress = useMemo(() => {
    return Math.round((currentStep / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  // Format time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Format cost
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header with overall progress */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            <span className="font-medium text-white">Building Premium Website</span>
          </div>
          <span className="text-sm text-zinc-400">
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Current activity */}
        {currentActivity && (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin text-amber-400" />
            <span>{currentActivity}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-zinc-800 border-b border-zinc-800">
        <StatItem
          icon={<Clock size={14} />}
          label="Elapsed"
          value={formatTime(elapsedTime)}
        />
        <StatItem
          icon={<Clock size={14} />}
          label="Remaining"
          value={formatTime(estimatedTimeRemaining)}
        />
        <StatItem
          icon={<DollarSign size={14} />}
          label="Cost"
          value={formatCost(currentCost)}
          subValue={`/ ${formatCost(estimatedTotalCost)}`}
        />
        <StatItem
          icon={previewReady ? <Eye size={14} /> : <Loader2 size={14} className="animate-spin" />}
          label="Preview"
          value={previewReady ? 'Ready' : 'Building...'}
          highlight={previewReady}
        />
      </div>

      {/* Phase list */}
      <div className="p-4 space-y-3">
        {phases.map((phase) => (
          <PhaseItem key={phase.id} phase={phase} />
        ))}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
              <AlertCircle size={14} />
              <span>Errors ({errors.length})</span>
            </div>
            <ul className="space-y-1">
              {errors.slice(0, 3).map((error, i) => (
                <li key={i} className="text-xs text-red-300">
                  {error}
                </li>
              ))}
              {errors.length > 3 && (
                <li className="text-xs text-red-400">
                  +{errors.length - 3} more errors
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Preview button */}
      {previewReady && previewUrl && (
        <div className="p-4 border-t border-zinc-800 flex gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors"
          >
            <Eye size={16} />
            Open Preview
          </a>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      )}

      {/* Completion state */}
      {overallProgress === 100 && (
        <div className="p-4 border-t border-zinc-800 bg-green-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Rocket size={20} className="text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-green-400">Build Complete!</h4>
              <p className="text-sm text-green-300/70">
                Your premium website is ready for deployment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}

const StatItem = memo(function StatItem({
  icon,
  label,
  value,
  subValue,
  highlight,
}: StatItemProps) {
  return (
    <div className="p-3 text-center">
      <div className={`flex items-center justify-center gap-1 text-xs mb-1 ${highlight ? 'text-green-400' : 'text-zinc-500'}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`font-medium ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value}
        {subValue && <span className="text-zinc-500 font-normal">{subValue}</span>}
      </div>
    </div>
  );
});

interface PhaseItemProps {
  phase: Phase;
}

const PhaseItem = memo(function PhaseItem({ phase }: PhaseItemProps) {
  const progress = phase.steps > 0 ? Math.round((phase.completedSteps / phase.steps) * 100) : 0;

  const statusIcon = useMemo(() => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'in_progress':
        return <Loader2 size={16} className="text-amber-400 animate-spin" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Circle size={16} className="text-zinc-600" />;
    }
  }, [phase.status]);

  return (
    <div
      className={`
        flex items-center gap-3 p-2 rounded-lg transition-colors
        ${phase.status === 'in_progress' ? 'bg-amber-500/5' : ''}
        ${phase.status === 'completed' ? 'opacity-60' : ''}
      `}
    >
      {/* Phase icon */}
      <div
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${phase.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' : ''}
          ${phase.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
          ${phase.status === 'pending' ? 'bg-zinc-800 text-zinc-500' : ''}
          ${phase.status === 'error' ? 'bg-red-500/20 text-red-400' : ''}
        `}
      >
        {PHASE_ICONS[phase.id] || <Circle size={16} />}
      </div>

      {/* Phase info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">{phase.name}</span>
          {statusIcon}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{phase.description}</span>
          <span>•</span>
          <span>
            {phase.completedSteps}/{phase.steps} steps
          </span>
        </div>
      </div>

      {/* Progress */}
      {phase.status !== 'pending' && (
        <div className="w-16">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`
                h-full transition-all duration-300
                ${phase.status === 'completed' ? 'bg-green-500' : ''}
                ${phase.status === 'in_progress' ? 'bg-amber-500' : ''}
                ${phase.status === 'error' ? 'bg-red-500' : ''}
              `}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default BuildProgress;
