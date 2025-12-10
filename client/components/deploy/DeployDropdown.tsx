/**
 * Deploy Dropdown Component
 *
 * Elegant dropdown menu for one-click deployments.
 * Shows all platforms inline with status and quick actions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Rocket,
  Cloud,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Zap,
  Server,
  ChevronDown,
  Settings,
  X,
  Loader2
} from 'lucide-react';

interface PlatformStatus {
  vercel: { installed: boolean; authenticated: boolean };
  netlify: { installed: boolean; authenticated: boolean };
  cloudflare: { installed: boolean; authenticated: boolean };
  hetzner: { configured: boolean; host?: string };
}

interface DeploymentResult {
  success: boolean;
  platform: string;
  url?: string;
  previewUrl?: string;
  message: string;
  logs?: string[];
}

interface HetznerConfig {
  host: string;
  user: string;
  path: string;
  port: number;
}

interface DeployDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function DeployDropdown({ isOpen, onClose, projectPath, anchorRef }: DeployDropdownProps) {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployingPlatform, setDeployingPlatform] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeploymentResult | null>(null);
  const [showHetznerConfig, setShowHetznerConfig] = useState(false);
  const [hetznerConfig, setHetznerConfig] = useState<HetznerConfig>({
    host: '',
    user: 'root',
    path: '/var/www/html',
    port: 22
  });
  const [isProduction, setIsProduction] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (anchorRef?.current && anchorRef.current.contains(e.target as Node)) return;
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const checkPlatformStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/deploy/status');
      const data = await res.json();
      setPlatformStatus(data);
    } catch (error) {
      console.error('Failed to check platform status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkPlatformStatus();
      setDeployResult(null);
    }
  }, [isOpen, checkPlatformStatus]);

  const handleDeploy = async (platform: 'vercel' | 'netlify' | 'cloudflare' | 'hetzner') => {
    if (!projectPath) return;

    try {
      setIsDeploying(true);
      setDeployingPlatform(platform);
      setDeployResult(null);

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          platform,
          production: isProduction
        })
      });

      const data = await res.json();
      setDeployResult(data);
    } catch (error) {
      setDeployResult({
        success: false,
        platform,
        message: error instanceof Error ? error.message : 'Deployment fehlgeschlagen'
      });
    } finally {
      setIsDeploying(false);
      setDeployingPlatform(null);
    }
  };

  const handleQuickDeploy = async () => {
    if (!projectPath) return;

    try {
      setIsDeploying(true);
      setDeployingPlatform('auto');
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
    } catch (error) {
      setDeployResult({
        success: false,
        platform: 'auto',
        message: error instanceof Error ? error.message : 'Deployment fehlgeschlagen'
      });
    } finally {
      setIsDeploying(false);
      setDeployingPlatform(null);
    }
  };

  const handleConfigureHetzner = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/deploy/hetzner/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hetznerConfig)
      });

      const data = await res.json();
      if (data.success) {
        setShowHetznerConfig(false);
        checkPlatformStatus();
      } else {
        setDeployResult({
          success: false,
          platform: 'hetzner',
          message: data.message
        });
      }
    } catch (error) {
      setDeployResult({
        success: false,
        platform: 'hetzner',
        message: error instanceof Error ? error.message : 'Konfiguration fehlgeschlagen'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'vercel':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L24 22H0L12 1Z" />
          </svg>
        );
      case 'netlify':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .355-.177l.574-3.55-2.13-2.111-2.505 3.782z" />
          </svg>
        );
      case 'cloudflare':
        return <Cloud className="w-4 h-4" />;
      case 'hetzner':
        return <Server className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      style={{
        animation: 'dropdownFadeIn 0.15s ease-out'
      }}
    >
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center gap-2 text-white">
          <Rocket className="w-5 h-5" />
          <span className="font-semibold">Deploy</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkPlatformStatus}
            disabled={isLoading}
            className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Deploy */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={handleQuickDeploy}
          disabled={isDeploying || !projectPath}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
        >
          {deployingPlatform === 'auto' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Quick Deploy
            </>
          )}
        </button>

        {/* Production Toggle */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Production</span>
          <button
            onClick={() => setIsProduction(!isProduction)}
            className={`
              relative w-9 h-5 rounded-full transition-colors
              ${isProduction ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span className={`
              absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
              ${isProduction ? 'translate-x-4' : 'translate-x-0.5'}
            `} />
          </button>
        </div>
      </div>

      {/* Platforms */}
      <div className="p-2 space-y-1">
        {/* Vercel */}
        <PlatformButton
          platform="vercel"
          label="Vercel"
          icon={getPlatformIcon('vercel')}
          status={platformStatus?.vercel}
          isDeploying={deployingPlatform === 'vercel'}
          onDeploy={() => handleDeploy('vercel')}
        />

        {/* Netlify */}
        <PlatformButton
          platform="netlify"
          label="Netlify"
          icon={getPlatformIcon('netlify')}
          status={platformStatus?.netlify}
          isDeploying={deployingPlatform === 'netlify'}
          onDeploy={() => handleDeploy('netlify')}
        />

        {/* Cloudflare */}
        <PlatformButton
          platform="cloudflare"
          label="Cloudflare"
          icon={getPlatformIcon('cloudflare')}
          status={platformStatus?.cloudflare}
          isDeploying={deployingPlatform === 'cloudflare'}
          onDeploy={() => handleDeploy('cloudflare')}
        />

        {/* Hetzner */}
        <div className="relative">
          {platformStatus?.hetzner?.configured ? (
            <PlatformButton
              platform="hetzner"
              label={`Hetzner (${platformStatus.hetzner.host})`}
              icon={getPlatformIcon('hetzner')}
              status={{ installed: true, authenticated: true }}
              isDeploying={deployingPlatform === 'hetzner'}
              onDeploy={() => handleDeploy('hetzner')}
              onConfigure={() => setShowHetznerConfig(true)}
            />
          ) : (
            <button
              onClick={() => setShowHetznerConfig(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                <Server className="w-4 h-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Hetzner VPS</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">Neu</span>
                </div>
                <span className="text-xs text-gray-500">Konfigurieren...</span>
              </div>
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Hetzner Config Form */}
      {showHetznerConfig && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hetzner VPS einrichten</span>
            <button
              onClick={() => setShowHetznerConfig(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Server IP oder Domain"
              value={hetznerConfig.host}
              onChange={(e) => setHetznerConfig({ ...hetznerConfig, host: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="User (root)"
                value={hetznerConfig.user}
                onChange={(e) => setHetznerConfig({ ...hetznerConfig, user: e.target.value })}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Port (22)"
                value={hetznerConfig.port}
                onChange={(e) => setHetznerConfig({ ...hetznerConfig, port: parseInt(e.target.value) || 22 })}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <input
              type="text"
              placeholder="Web-Pfad (/var/www/html)"
              value={hetznerConfig.path}
              onChange={(e) => setHetznerConfig({ ...hetznerConfig, path: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SSH-Key muss eingerichtet sein: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ssh-copy-id user@host</code>
            </p>
            <button
              onClick={handleConfigureHetzner}
              disabled={!hetznerConfig.host || isLoading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Teste Verbindung...' : 'Speichern & Testen'}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {deployResult && (
        <div className={`
          p-3 border-t
          ${deployResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
          }
        `}>
          <div className="flex items-start gap-2">
            {deployResult.success ? (
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${deployResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {deployResult.message}
              </p>
              {deployResult.url && (
                <a
                  href={deployResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline truncate"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{deployResult.url}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Path */}
      {projectPath && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={projectPath}>
            {projectPath}
          </p>
        </div>
      )}
    </div>
  );
}

// Platform Button Component
interface PlatformButtonProps {
  platform: string;
  label: string;
  icon: React.ReactNode;
  status?: { installed: boolean; authenticated: boolean };
  isDeploying: boolean;
  onDeploy: () => void;
  onConfigure?: () => void;
}

function PlatformButton({ platform, label, icon, status, isDeploying, onDeploy, onConfigure }: PlatformButtonProps) {
  const isAvailable = status?.authenticated;

  return (
    <button
      onClick={isAvailable ? onDeploy : undefined}
      disabled={!isAvailable || isDeploying}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
        ${isAvailable
          ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer'
          : 'opacity-60 cursor-not-allowed'
        }
      `}
    >
      <span className={`
        flex items-center justify-center w-8 h-8 rounded-lg
        ${isAvailable
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
        }
      `}>
        {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      </span>
      <div className="flex-1">
        <span className={`font-medium text-sm ${isAvailable ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
          {label}
        </span>
        {!status?.authenticated && (
          <span className="block text-xs text-gray-400">
            {status?.installed ? 'Nicht eingeloggt' : 'Nicht installiert'}
          </span>
        )}
      </div>
      {isAvailable && (
        <div className="flex items-center gap-1">
          {onConfigure && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Settings className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
      )}
      {!isAvailable && status?.installed && (
        <Clock className="w-4 h-4 text-yellow-500" />
      )}
    </button>
  );
}

export default DeployDropdown;
