/**
 * Deploy Panel Component
 *
 * One-click deployment UI for Vercel, Netlify, and Cloudflare.
 * Shows platform status, deployment history, and quick deploy actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  Cloud,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Settings,
  RefreshCw,
  Zap,
  Globe,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface PlatformStatus {
  vercel: { installed: boolean; authenticated: boolean };
  netlify: { installed: boolean; authenticated: boolean };
  cloudflare: { installed: boolean; authenticated: boolean };
}

interface DeploymentResult {
  success: boolean;
  platform: string;
  url?: string;
  previewUrl?: string;
  message: string;
  logs?: string[];
}

interface DeployPanelProps {
  projectPath: string;
  onDeploy?: (result: DeploymentResult) => void;
}

export function DeployPanel({ projectPath, onDeploy }: DeployPanelProps) {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'vercel' | 'netlify' | 'cloudflare' | null>(null);
  const [deployResult, setDeployResult] = useState<DeploymentResult | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  const [framework, setFramework] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const checkPlatformStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/deploy/status');
      const data = await res.json();
      setPlatformStatus(data);

      // Auto-select first authenticated platform
      if (data.vercel?.authenticated) setSelectedPlatform('vercel');
      else if (data.netlify?.authenticated) setSelectedPlatform('netlify');
      else if (data.cloudflare?.authenticated) setSelectedPlatform('cloudflare');
    } catch (error) {
      console.error('Failed to check platform status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectFramework = useCallback(async () => {
    if (!projectPath) return;

    try {
      const res = await fetch(`/api/deploy/framework?projectPath=${encodeURIComponent(projectPath)}`);
      const data = await res.json();
      setFramework(data.framework || 'other');
    } catch {
      setFramework('other');
    }
  }, [projectPath]);

  useEffect(() => {
    checkPlatformStatus();
    detectFramework();
  }, [checkPlatformStatus, detectFramework]);

  const handleDeploy = async () => {
    if (!projectPath || !selectedPlatform) return;

    try {
      setIsDeploying(true);
      setDeployResult(null);

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          platform: selectedPlatform,
          production: isProduction
        })
      });

      const data = await res.json();
      setDeployResult(data);
      onDeploy?.(data);
    } catch (error) {
      setDeployResult({
        success: false,
        platform: selectedPlatform,
        message: error instanceof Error ? error.message : 'Deployment fehlgeschlagen'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleQuickDeploy = async () => {
    if (!projectPath) return;

    try {
      setIsDeploying(true);
      setDeployResult(null);

      const res = await fetch('/api/deploy/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          production: isProduction
        })
      });

      const data = await res.json();
      setDeployResult(data);
      onDeploy?.(data);
    } catch (error) {
      setDeployResult({
        success: false,
        platform: 'auto',
        message: error instanceof Error ? error.message : 'Deployment fehlgeschlagen'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'vercel':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L24 22H0L12 1Z" />
          </svg>
        );
      case 'netlify':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .355-.177l.574-3.55-2.13-2.111-2.505 3.782zm11.933 5.491l-3.748-3.748-2.548 1.044 6.264 2.662s.053.042.032.042zm-.627 1.167l-6.96-2.954a1.044 1.044 0 0 1-.793.386c-.063 0-.124-.013-.186-.019l-1.794 3.39c.188.179.323.41.377.669l6.327-.417 3.029-.428v-.627z" />
          </svg>
        );
      case 'cloudflare':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 14.5h-9a.5.5 0 0 1-.5-.5.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5z" />
            <path d="M7.5 11.5A2.5 2.5 0 0 0 5 14a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 14a2.5 2.5 0 0 0-2.5-2.5 2.5 2.5 0 0 0-2.5-2.5 2.5 2.5 0 0 0-2.5 2.5H7.5z" />
          </svg>
        );
      default:
        return <Cloud className="w-5 h-5" />;
    }
  };

  const getPlatformStatus = (platform: 'vercel' | 'netlify' | 'cloudflare') => {
    if (!platformStatus) return { installed: false, authenticated: false };
    return platformStatus[platform];
  };

  if (!projectPath) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Wähle ein Projekt zum Deployen aus</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="w-6 h-6 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Deploy</h2>
        </div>
        <button
          onClick={checkPlatformStatus}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Framework Detection */}
      {framework && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Globe className="w-4 h-4" />
          <span>Framework erkannt: <strong className="text-gray-800 dark:text-white">{framework}</strong></span>
        </div>
      )}

      {/* Platform Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Plattform wählen
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['vercel', 'netlify', 'cloudflare'] as const).map(platform => {
            const status = getPlatformStatus(platform);
            const isSelected = selectedPlatform === platform;
            const isAvailable = status.authenticated;

            return (
              <button
                key={platform}
                onClick={() => isAvailable && setSelectedPlatform(platform)}
                disabled={!isAvailable}
                className={`
                  relative p-3 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                  ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className={isSelected ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'}>
                    {getPlatformIcon(platform)}
                  </span>
                  <span className="text-xs font-medium capitalize">{platform}</span>
                </div>
                {/* Status indicator */}
                <div className="absolute top-1 right-1">
                  {status.authenticated ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : status.installed ? (
                    <span title="Nicht eingeloggt"><AlertCircle className="w-3 h-3 text-yellow-500" /></span>
                  ) : (
                    <span title="Nicht installiert"><XCircle className="w-3 h-3 text-gray-400" /></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Production Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isProduction ? 'text-orange-500' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">Production Deployment</span>
        </div>
        <button
          onClick={() => setIsProduction(!isProduction)}
          className={`
            relative w-11 h-6 rounded-full transition-colors
            ${isProduction ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}
          `}
        >
          <span className={`
            absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
            ${isProduction ? 'translate-x-5' : 'translate-x-0.5'}
          `} />
        </button>
      </div>

      {/* Advanced Options */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
        >
          {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Settings className="w-4 h-4" />
          <span>Erweiterte Optionen</span>
        </button>
        {showAdvanced && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <p className="text-xs text-gray-500">
              Umgebungsvariablen und Build-Konfiguration können in der jeweiligen Plattform eingestellt werden.
            </p>
          </div>
        )}
      </div>

      {/* Deploy Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleDeploy}
          disabled={!selectedPlatform || isDeploying}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              {isProduction ? 'Deploy to Production' : 'Create Preview'}
            </>
          )}
        </button>

        <button
          onClick={handleQuickDeploy}
          disabled={isDeploying}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Quick Deploy (Auto-detect)
        </button>
      </div>

      {/* Deployment Result */}
      {deployResult && (
        <div className={`
          p-4 rounded-lg
          ${deployResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }
        `}>
          <div className="flex items-start gap-3">
            {deployResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${deployResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {deployResult.message}
              </p>
              {deployResult.url && (
                <a
                  href={deployResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {deployResult.url}
                </a>
              )}
              {deployResult.logs && deployResult.logs.length > 0 && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {deployResult.logs.map((log, i) => (
                    <p key={i}>{log}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!platformStatus?.vercel?.authenticated &&
       !platformStatus?.netlify?.authenticated &&
       !platformStatus?.cloudflare?.authenticated && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                Keine Plattform konfiguriert
              </p>
              <p className="mt-1 text-yellow-600 dark:text-yellow-500">
                Installiere und authentifiziere eine Plattform:
              </p>
              <ul className="mt-2 space-y-1 text-yellow-600 dark:text-yellow-500">
                <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">bun add -g vercel && vercel login</code></li>
                <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">bun add -g netlify-cli && netlify login</code></li>
                <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">bun add -g wrangler && wrangler login</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeployPanel;
