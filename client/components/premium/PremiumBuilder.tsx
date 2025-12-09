/**
 * PremiumBuilder - Main container for premium website builder
 * Orchestrates all premium components and manages build state
 */

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  usePremiumBuilder,
  premiumAPI,
  type PremiumBuild,
  type EditResult,
  type EditCommand,
  type AnalyzeBusinessInput,
} from '../../hooks/usePremiumBuilder';
import { BuildProgress } from './BuildProgress';
import { CostDisplay } from './CostDisplay';
import { ExportPanel } from './ExportPanel';
import { NicheSelector } from './NicheSelector';
import { SEOScoreCard } from './SEOScoreCard';
import { TemplateSelector } from './TemplateSelector';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Redo2,
  MessageSquare,
  X,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PremiumBuilderProps {
  sendMessage: (message: Record<string, unknown>) => void;
  sessionId: string;
  onClose?: () => void;
}

type BuilderStep = 'input' | 'configure' | 'building' | 'complete';

interface BusinessInput {
  businessName: string;
  industry: string;
  description: string;
  targetAudience: string;
  features: string[];
}

interface AnalysisResult {
  suggestedNiche: string;
  suggestedDesignSystem: string;
  businessInfo: AnalyzeBusinessInput;
  confidence: number;
}

// ============================================================================
// Default phases for build progress
// ============================================================================

type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'error';

interface Phase {
  id: string;
  name: string;
  description: string;
  steps: number;
  completedSteps: number;
  status: PhaseStatus;
}

const DEFAULT_PHASES: Phase[] = [
  { id: 'foundation', name: 'Foundation', description: 'Project setup', steps: 10, completedSteps: 0, status: 'pending' },
  { id: 'components', name: 'Components', description: 'Base components', steps: 15, completedSteps: 0, status: 'pending' },
  { id: 'sections', name: 'Sections', description: 'Page sections', steps: 15, completedSteps: 0, status: 'pending' },
  { id: 'pages', name: 'Pages', description: 'Full pages', steps: 10, completedSteps: 0, status: 'pending' },
  { id: 'content', name: 'Content', description: 'AI content generation', steps: 20, completedSteps: 0, status: 'pending' },
  { id: 'images', name: 'Images', description: 'Image optimization', steps: 10, completedSteps: 0, status: 'pending' },
  { id: 'seo', name: 'SEO', description: 'SEO optimization', steps: 5, completedSteps: 0, status: 'pending' },
  { id: 'integrations', name: 'Integrations', description: 'External services', steps: 5, completedSteps: 0, status: 'pending' },
  { id: 'validation', name: 'Validation', description: 'Quality checks', steps: 5, completedSteps: 0, status: 'pending' },
  { id: 'delivery', name: 'Delivery', description: 'Final prep', steps: 5, completedSteps: 0, status: 'pending' },
];

// ============================================================================
// Main Component
// ============================================================================

export const PremiumBuilder = memo(function PremiumBuilder({
  sendMessage,
  sessionId,
  onClose,
}: PremiumBuilderProps) {
  // Local state
  const [step, setStep] = useState<BuilderStep>('input');
  const [businessInput, setBusinessInput] = useState<BusinessInput>({
    businessName: '',
    industry: '',
    description: '',
    targetAudience: '',
    features: [],
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [selectedDesignSystem, setSelectedDesignSystem] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickEditInput, setQuickEditInput] = useState('');
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Premium builder hook
  const {
    build,
    isBuilding,
    canUndo,
    canRedo,
    lastEditResult,
    startBuild,
    sendEdit,
    undo,
    redo,
    requestPreview,
    reset,
    handlePremiumMessage,
  } = usePremiumBuilder({
    sendMessage,
    sessionId,
    onBuildComplete: (completedBuild) => {
      setStep('complete');
    },
    onBuildError: (errorMsg) => {
      setError(errorMsg);
    },
    onEditComplete: (result) => {
      // Handle edit completion
    },
    onPreviewRefresh: () => {
      // Trigger iframe refresh
    },
  });

  // Timer for elapsed time
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isBuilding) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBuilding]);

  // Update phases based on build progress
  useEffect(() => {
    if (build?.progress) {
      const currentStep = build.progress.currentStep;
      const totalSteps = build.progress.totalSteps;

      setPhases(prev => {
        let stepsRemaining = currentStep;
        return prev.map((phase): Phase => {
          if (stepsRemaining <= 0) {
            return { ...phase, status: 'pending', completedSteps: 0 };
          }
          if (stepsRemaining >= phase.steps) {
            stepsRemaining -= phase.steps;
            return { ...phase, status: 'completed', completedSteps: phase.steps };
          }
          const completed = stepsRemaining;
          stepsRemaining = 0;
          return { ...phase, status: 'in_progress', completedSteps: completed };
        });
      });
    }
  }, [build?.progress]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAnalyze = useCallback(async () => {
    if (!businessInput.businessName.trim()) {
      setError('Please enter your business name');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await premiumAPI.analyze({
        businessName: businessInput.businessName,
        industry: businessInput.industry || undefined,
        description: businessInput.description || undefined,
        targetAudience: businessInput.targetAudience || undefined,
        features: businessInput.features.length > 0 ? businessInput.features : undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setAnalysisResult({
        suggestedNiche: result.suggestedNiche || 'general',
        suggestedDesignSystem: result.suggestedDesignSystem || 'modern-saas',
        businessInfo: result.businessInfo,
        confidence: result.confidence || 0.8,
      });
      setSelectedNiche(result.suggestedNiche || 'general');
      setSelectedDesignSystem(result.suggestedDesignSystem || 'modern-saas');
      setStep('configure');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [businessInput]);

  const handleStartBuild = useCallback(async () => {
    if (!analysisResult) return;

    setError(null);
    setElapsedTime(0);
    setPhases(DEFAULT_PHASES);

    try {
      const result = await premiumAPI.startBuild({
        sessionId,
        businessInfo: analysisResult.businessInfo,
        nicheId: selectedNiche,
        designSystemId: selectedDesignSystem,
        options: {
          includeImages: true,
          seoOptimized: true,
          multiLanguage: false,
        },
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Start WebSocket build tracking
      startBuild(result.buildId);
      setStep('building');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start build');
    }
  }, [analysisResult, selectedNiche, selectedDesignSystem, sessionId, startBuild]);

  const handleQuickEdit = useCallback(() => {
    if (!quickEditInput.trim()) return;

    // Parse natural language edit command
    const input = quickEditInput.toLowerCase();
    let commandType: EditCommand['type'] = 'style';

    if (input.includes('color') || input.includes('background')) {
      commandType = 'color';
    } else if (input.includes('font') || input.includes('text size')) {
      commandType = 'font';
    } else if (input.includes('text') || input.includes('change') || input.includes('update')) {
      commandType = 'text';
    } else if (input.includes('layout') || input.includes('section')) {
      commandType = 'layout';
    }

    const command: EditCommand = {
      type: commandType,
      target: 'general',
      value: quickEditInput,
    };

    sendEdit(command);
    setQuickEditInput('');
  }, [quickEditInput, sendEdit]);

  const handleReset = useCallback(() => {
    reset();
    setStep('input');
    setBusinessInput({
      businessName: '',
      industry: '',
      description: '',
      targetAudience: '',
      features: [],
    });
    setAnalysisResult(null);
    setSelectedNiche('');
    setSelectedDesignSystem('');
    setError(null);
    setPhases(DEFAULT_PHASES);
    setElapsedTime(0);
  }, [reset]);

  // ============================================================================
  // Computed values
  // ============================================================================

  const estimatedTimeRemaining = useMemo(() => {
    if (!build?.progress) return 0;
    const progress = build.progress.percentage / 100;
    if (progress === 0) return 300; // 5 min estimate
    const totalEstimate = elapsedTime / progress;
    return Math.max(0, Math.round(totalEstimate - elapsedTime));
  }, [build?.progress, elapsedTime]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Premium Builder</h2>
            <p className="text-sm text-zinc-400">AI-powered 100-step website builder</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded"
          >
            <X size={14} className="text-red-400" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Business Input */}
        {step === 'input' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">Tell us about your business</h3>
              <p className="text-zinc-400">We'll analyze your needs and create a customized website plan</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessInput.businessName}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="e.g., Acme Corp"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={businessInput.industry}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Healthcare, Restaurant, Law"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  value={businessInput.description}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us what your business does..."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={businessInput.targetAudience}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="e.g., Small businesses, Young professionals"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !businessInput.businessName.trim()}
              className="w-full mt-6 px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze & Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 'configure' && analysisResult && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm mb-3">
                <CheckCircle2 size={14} />
                Analysis Complete
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Configure Your Website</h3>
              <p className="text-zinc-400">Review our suggestions or customize your preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Design System</h4>
                <TemplateSelector
                  selectedId={selectedDesignSystem}
                  onSelect={setSelectedDesignSystem}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Industry Template</h4>
                <NicheSelector
                  selectedId={selectedNiche}
                  onSelect={setSelectedNiche}
                  businessDescription={businessInput.description}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('input')}
                className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleStartBuild}
                className="flex-1 px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                Start 100-Step Build
                <Sparkles size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Building */}
        {step === 'building' && build && (
          <div className="space-y-6">
            <BuildProgress
              phases={phases}
              currentStep={build.progress.currentStep}
              totalSteps={build.progress.totalSteps}
              elapsedTime={elapsedTime}
              estimatedTimeRemaining={estimatedTimeRemaining}
              currentCost={build.cost.estimatedUSD}
              estimatedTotalCost={5.00}
              previewReady={!!build.previewUrl}
              previewUrl={build.previewUrl}
              currentActivity={build.progress.currentStepName}
              errors={build.error ? [build.error] : []}
            />

            {/* Cost tracking */}
            <CostDisplay
              currentCost={build.cost.estimatedUSD}
              estimatedTotal={5.00}
              budget={10.00}
              breakdown={phases.map(p => ({
                phase: p.id,
                phaseName: p.name,
                tokens: Math.round(build.cost.tokens * (p.completedSteps / 100)),
                cost: build.cost.estimatedUSD * (p.completedSteps / 100),
                status: p.status === 'error' ? 'pending' as const : p.status,
              }))}
              tokensUsed={build.cost.tokens}
              tokensEstimated={500000}
              savingsFromCache={0}
            />
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && build && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Build Complete!</h3>
              <p className="text-zinc-400">Your premium website is ready</p>
            </div>

            {/* Quick edit section */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <MessageSquare size={16} />
                Quick Edits
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickEditInput}
                  onChange={(e) => setQuickEditInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickEdit()}
                  placeholder="e.g., 'change hero background to blue'"
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleQuickEdit}
                  disabled={!quickEditInput.trim()}
                  className="px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  Apply
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  <Undo2 size={14} />
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  <Redo2 size={14} />
                  Redo
                </button>
              </div>
              {lastEditResult && (
                <div className={`mt-3 p-2 rounded-lg text-sm ${lastEditResult.success ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                  {lastEditResult.message}
                </div>
              )}
            </div>

            {/* SEO Score */}
            <SEOScoreCard
              overallScore={85}
              categories={[
                { id: 'meta', name: 'Meta Tags', score: 90, maxScore: 100, issues: [], passed: ['Title tag', 'Meta description'] },
                { id: 'content', name: 'Content', score: 80, maxScore: 100, issues: ['Missing alt text on 2 images'], passed: ['H1 tags', 'Content length'] },
                { id: 'performance', name: 'Performance', score: 85, maxScore: 100, issues: [], passed: ['Image optimization', 'Minification'] },
                { id: 'accessibility', name: 'Accessibility', score: 82, maxScore: 100, issues: ['Low contrast text'], passed: ['ARIA labels', 'Skip links'] },
              ]}
              recommendations={[
                'Add alt text to remaining images',
                'Improve mobile loading speed',
              ]}
              localSEO={{
                enabled: true,
                hasSchema: true,
                hasGoogleBusiness: false,
                hasNAP: true,
              }}
            />

            {/* Export panel */}
            <ExportPanel
              projectName={businessInput.businessName || 'website'}
              onExport={async (format) => {
                const result = await premiumAPI.exportProject(build.buildId, { format: format as 'astro' | 'static' | 'zip' | 'docker' });
                return { url: result.downloadUrl || '', size: result.size || '0KB' };
              }}
              onDeploy={async (platform) => {
                const result = await premiumAPI.deployProject(build.buildId, { platform: platform as 'vercel' | 'netlify' | 'cloudflare' | 'github-pages' });
                return { url: result.deployUrl || '' };
              }}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Build Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default PremiumBuilder;
