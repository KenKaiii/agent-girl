/**
 * SEOScoreCard - Comprehensive SEO metrics display
 * Shows overall score, category breakdown, and actionable recommendations
 */

import React, { memo, useMemo } from 'react';
import {
  Search,
  Globe,
  Smartphone,
  Zap,
  FileText,
  Link2,
  Image,
  Shield,
  CheckCircle2,
  XCircle,
  TrendingUp,
  MapPin,
} from 'lucide-react';

interface SEOCategory {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  issues: string[];
  passed: string[];
}

interface SEOScoreCardProps {
  overallScore: number;
  categories: SEOCategory[];
  recommendations: string[];
  localSEO?: {
    enabled: boolean;
    hasSchema: boolean;
    hasGoogleBusiness: boolean;
    hasNAP: boolean;
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  meta: <FileText size={16} />,
  content: <Search size={16} />,
  technical: <Zap size={16} />,
  mobile: <Smartphone size={16} />,
  links: <Link2 size={16} />,
  images: <Image size={16} />,
  security: <Shield size={16} />,
  performance: <Zap size={16} />,
  schema: <Globe size={16} />,
  local: <MapPin size={16} />,
};

export const SEOScoreCard = memo(function SEOScoreCard({
  overallScore,
  categories,
  recommendations,
  localSEO,
}: SEOScoreCardProps) {
  // Determine score status
  const scoreStatus = useMemo(() => {
    if (overallScore >= 90) return 'excellent';
    if (overallScore >= 70) return 'good';
    if (overallScore >= 50) return 'needs-work';
    return 'poor';
  }, [overallScore]);

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-amber-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get score background
  const _getScoreBg = (score: number): string => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-amber-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header with overall score */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-blue-400" />
            <span className="font-medium text-white text-lg">SEO Score</span>
          </div>
          <ScoreStatusBadge status={scoreStatus} />
        </div>

        {/* Score circle */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-zinc-800"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={getScoreColor(overallScore)}
                strokeDasharray={`${(overallScore / 100) * 251.2} 251.2`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className={`text-xl font-semibold mb-1 ${getScoreColor(overallScore)}`}>
              {scoreStatus === 'excellent' && 'Excellent!'}
              {scoreStatus === 'good' && 'Good'}
              {scoreStatus === 'needs-work' && 'Needs Work'}
              {scoreStatus === 'poor' && 'Poor'}
            </h3>
            <p className="text-sm text-zinc-400">
              {scoreStatus === 'excellent' && 'Your website is well-optimized for search engines.'}
              {scoreStatus === 'good' && 'Good foundation with room for improvement.'}
              {scoreStatus === 'needs-work' && 'Several areas need attention.'}
              {scoreStatus === 'poor' && 'Significant improvements needed.'}
            </p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-4 border-b border-zinc-800">
        <h4 className="text-xs uppercase text-zinc-500 font-medium mb-3">
          Category Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </div>
      </div>

      {/* Local SEO section */}
      {localSEO?.enabled && (
        <div className="p-4 border-b border-zinc-800 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-blue-400" />
            <span className="font-medium text-white text-sm">Local SEO</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <LocalSEOItem
              label="Schema.org"
              passed={localSEO.hasSchema}
            />
            <LocalSEOItem
              label="Google Business"
              passed={localSEO.hasGoogleBusiness}
            />
            <LocalSEOItem
              label="NAP Consistency"
              passed={localSEO.hasNAP}
            />
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-amber-400" />
            <span className="font-medium text-white text-sm">
              Quick Wins ({recommendations.length})
            </span>
          </div>
          <ul className="space-y-2">
            {recommendations.slice(0, 5).map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-400"
              >
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
            {recommendations.length > 5 && (
              <li className="text-xs text-zinc-500">
                +{recommendations.length - 5} more recommendations
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

interface ScoreStatusBadgeProps {
  status: 'excellent' | 'good' | 'needs-work' | 'poor';
}

const ScoreStatusBadge = memo(function ScoreStatusBadge({
  status,
}: ScoreStatusBadgeProps) {
  const config = {
    excellent: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Excellent' },
    good: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Good' },
    'needs-work': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Needs Work' },
    poor: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Poor' },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
});

interface CategoryItemProps {
  category: SEOCategory;
}

const CategoryItem = memo(function CategoryItem({ category }: CategoryItemProps) {
  const percent = Math.round((category.score / category.maxScore) * 100);
  const icon = CATEGORY_ICONS[category.id] || <Search size={16} />;

  const getBarColor = (pct: number): string => {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 70) return 'bg-amber-500';
    if (pct >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-2 rounded-lg bg-zinc-800/50">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-zinc-400">
          {icon}
          <span className="text-xs font-medium">{category.name}</span>
        </div>
        <span className="text-xs text-zinc-500">
          {category.score}/{category.maxScore}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {category.issues.length > 0 && (
        <div className="mt-1.5 text-xs text-red-400/70">
          {category.issues.length} issue{category.issues.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
});

interface LocalSEOItemProps {
  label: string;
  passed: boolean;
}

const LocalSEOItem = memo(function LocalSEOItem({ label, passed }: LocalSEOItemProps) {
  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs
        ${passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
      `}
    >
      {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      <span>{label}</span>
    </div>
  );
});

export default SEOScoreCard;
