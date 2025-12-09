/**
 * ExportPanel - Premium website export and delivery
 * Handles multiple export formats and deployment options
 */

import React, { memo, useState, useCallback } from 'react';
import {
  Download,
  Cloud,
  Github,
  Globe,
  Package,
  FileArchive,
  Check,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Server,
  Rocket,
} from 'lucide-react';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: string;
  size?: string;
  premium?: boolean;
}

interface DeployOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  url?: string;
  connected?: boolean;
}

interface ExportPanelProps {
  projectName: string;
  onExport: (format: string) => Promise<{ url: string; size: string }>;
  onDeploy: (platform: string) => Promise<{ url: string }>;
  exportProgress?: number;
  deployProgress?: number;
  lastExport?: {
    format: string;
    url: string;
    size: string;
    date: Date;
  };
  deployedUrl?: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'astro',
    name: 'Astro Project',
    description: 'Full source code with all components',
    icon: <Rocket size={20} />,
    format: 'astro',
  },
  {
    id: 'static',
    name: 'Static HTML',
    description: 'Pre-built HTML, CSS, JS files',
    icon: <FileArchive size={20} />,
    format: 'static',
  },
  {
    id: 'zip',
    name: 'ZIP Archive',
    description: 'Complete project as downloadable ZIP',
    icon: <Package size={20} />,
    format: 'zip',
  },
];

const DEPLOY_OPTIONS: DeployOption[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy to Vercel with one click',
    icon: <Globe size={20} />,
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Deploy to Netlify',
    icon: <Cloud size={20} />,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Pages',
    description: 'Deploy to Cloudflare edge network',
    icon: <Server size={20} />,
  },
  {
    id: 'github',
    name: 'GitHub Repository',
    description: 'Push to new GitHub repository',
    icon: <Github size={20} />,
  },
];

export const ExportPanel = memo(function ExportPanel({
  projectName,
  onExport,
  onDeploy,
  exportProgress,
  deployProgress,
  lastExport,
  deployedUrl,
}: ExportPanelProps) {
  const [selectedExport, setSelectedExport] = useState<string | null>(null);
  const [selectedDeploy, setSelectedDeploy] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [exportResult, setExportResult] = useState<{ url: string; size: string } | null>(null);
  const [deployResult, setDeployResult] = useState<{ url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle export
  const handleExport = useCallback(async (format: string) => {
    setSelectedExport(format);
    setIsExporting(true);
    setExportResult(null);

    try {
      const result = await onExport(format);
      setExportResult(result);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);

  // Handle deploy
  const handleDeploy = useCallback(async (platform: string) => {
    setSelectedDeploy(platform);
    setIsDeploying(true);
    setDeployResult(null);

    try {
      const result = await onDeploy(platform);
      setDeployResult(result);
    } catch (error) {
      console.error('Deploy failed:', error);
    } finally {
      setIsDeploying(false);
    }
  }, [onDeploy]);

  // Copy URL to clipboard
  const handleCopyUrl = useCallback(async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-amber-400" />
            <span className="font-medium text-white">Export & Deploy</span>
          </div>
          <span className="text-sm text-zinc-500">{projectName}</span>
        </div>
      </div>

      {/* Export Options */}
      <div className="p-4 border-b border-zinc-800">
        <h4 className="text-xs uppercase text-zinc-500 font-medium mb-3">
          Download Options
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {EXPORT_OPTIONS.map((option) => (
            <ExportOptionCard
              key={option.id}
              option={option}
              isSelected={selectedExport === option.id}
              isLoading={isExporting && selectedExport === option.id}
              progress={selectedExport === option.id ? exportProgress : undefined}
              onSelect={() => handleExport(option.format)}
            />
          ))}
        </div>

        {/* Export result */}
        {exportResult && !isExporting && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-sm text-green-300">Export ready!</span>
                <span className="text-xs text-green-400/70">({exportResult.size})</span>
              </div>
              <a
                href={exportResult.url}
                download
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-black text-sm font-medium rounded-lg hover:bg-green-400 transition-colors"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Deploy Options */}
      <div className="p-4 border-b border-zinc-800">
        <h4 className="text-xs uppercase text-zinc-500 font-medium mb-3">
          One-Click Deploy
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {DEPLOY_OPTIONS.map((option) => (
            <DeployOptionCard
              key={option.id}
              option={option}
              isSelected={selectedDeploy === option.id}
              isLoading={isDeploying && selectedDeploy === option.id}
              progress={selectedDeploy === option.id ? deployProgress : undefined}
              onSelect={() => handleDeploy(option.id)}
            />
          ))}
        </div>

        {/* Deploy result */}
        {(deployResult || deployedUrl) && !isDeploying && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Globe size={16} className="text-blue-400 flex-shrink-0" />
                <span className="text-sm text-blue-300 truncate">
                  {deployResult?.url || deployedUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleCopyUrl(deployResult?.url || deployedUrl || '')}
                  className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                  title="Copy URL"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <a
                  href={deployResult?.url || deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-400 transition-colors"
                >
                  <ExternalLink size={14} />
                  Visit
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last export info */}
      {lastExport && (
        <div className="p-4 bg-zinc-800/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              Last export: {lastExport.format.toUpperCase()} ({lastExport.size})
            </span>
            <span className="text-zinc-600">
              {lastExport.date.toLocaleDateString()} at{' '}
              {lastExport.date.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

interface ExportOptionCardProps {
  option: ExportOption;
  isSelected: boolean;
  isLoading: boolean;
  progress?: number;
  onSelect: () => void;
}

const ExportOptionCard = memo(function ExportOptionCard({
  option,
  isSelected,
  isLoading,
  progress,
  onSelect,
}: ExportOptionCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className={`
        relative p-3 rounded-xl border-2 transition-all duration-200 text-left
        ${isSelected && !isLoading
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
        }
        ${isLoading ? 'pointer-events-none' : ''}
      `}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-900/80 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={20} className="animate-spin text-amber-400 mx-auto mb-1" />
            {progress !== undefined && (
              <span className="text-xs text-zinc-400">{progress}%</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="text-zinc-400">{option.icon}</div>
        <span className="font-medium text-white text-sm">{option.name}</span>
      </div>
      <p className="text-xs text-zinc-500">{option.description}</p>
    </button>
  );
});

interface DeployOptionCardProps {
  option: DeployOption;
  isSelected: boolean;
  isLoading: boolean;
  progress?: number;
  onSelect: () => void;
}

const DeployOptionCard = memo(function DeployOptionCard({
  option,
  isSelected,
  isLoading,
  progress,
  onSelect,
}: DeployOptionCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className={`
        relative p-3 rounded-xl border-2 transition-all duration-200 text-left
        ${isSelected && !isLoading
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
        }
        ${isLoading ? 'pointer-events-none' : ''}
      `}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-900/80 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={20} className="animate-spin text-blue-400 mx-auto mb-1" />
            {progress !== undefined && (
              <span className="text-xs text-zinc-400">{progress}%</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <div className="text-zinc-400">{option.icon}</div>
        <span className="font-medium text-white text-sm">{option.name}</span>
        {option.connected && (
          <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded-full">
            Connected
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500">{option.description}</p>
    </button>
  );
});

export default ExportPanel;
