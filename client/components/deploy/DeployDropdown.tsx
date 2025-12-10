/**
 * Deploy Dropdown Component
 *
 * Frictionless deployment with easy token-based auth.
 * One-click login links + copy-paste tokens for all platforms.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Rocket,
  Cloud,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Zap,
  Server,
  X,
  Loader2,
  Key,
  Copy,
  Check,
  LogIn,
  Settings
} from 'lucide-react';

interface PlatformStatus {
  vercel: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  netlify: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  cloudflare: { installed: boolean; authenticated: boolean; hasToken?: boolean };
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

// Platform auth URLs - direct links to create tokens
const AUTH_URLS = {
  vercel: 'https://vercel.com/account/tokens',
  netlify: 'https://app.netlify.com/user/applications#personal-access-tokens',
  cloudflare: 'https://dash.cloudflare.com/profile/api-tokens',
};

export function DeployDropdown({ isOpen, onClose, projectPath, anchorRef }: DeployDropdownProps) {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployingPlatform, setDeployingPlatform] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeploymentResult | null>(null);
  const [isProduction, setIsProduction] = useState(false);

  // Config forms
  const [configPlatform, setConfigPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [accountId, setAccountId] = useState(''); // For Cloudflare
  const [hetznerConfig, setHetznerConfig] = useState<HetznerConfig>({
    host: '',
    user: 'root',
    path: '/var/www/html',
    port: 22
  });
  const [copied, setCopied] = useState(false);

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
      if (e.key === 'Escape') {
        if (configPlatform) {
          setConfigPlatform(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, configPlatform]);

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
      setConfigPlatform(null);
      setTokenInput('');
      setAccountId('');
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

  const handleSaveToken = async (platform: string) => {
    if (!tokenInput.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/deploy/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          token: tokenInput.trim(),
          accountId: platform === 'cloudflare' ? accountId.trim() : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setConfigPlatform(null);
        setTokenInput('');
        setAccountId('');
        checkPlatformStatus();
        setDeployResult({
          success: true,
          platform,
          message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} erfolgreich verbunden!`
        });
      } else {
        setDeployResult({
          success: false,
          platform,
          message: data.message || 'Token ungültig'
        });
      }
    } catch (error) {
      setDeployResult({
        success: false,
        platform,
        message: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen'
      });
    } finally {
      setIsLoading(false);
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
        setConfigPlatform(null);
        checkPlatformStatus();
        setDeployResult({
          success: true,
          platform: 'hetzner',
          message: 'Hetzner erfolgreich verbunden!'
        });
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

  const handleDisconnect = async (platform: string) => {
    try {
      setIsLoading(true);
      await fetch('/api/deploy/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      checkPlatformStatus();
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const isAuthenticated = (platform: string) => {
    if (!platformStatus) return false;
    if (platform === 'hetzner') return platformStatus.hetzner?.configured;
    return platformStatus[platform as keyof Omit<PlatformStatus, 'hetzner'>]?.authenticated ||
           platformStatus[platform as keyof Omit<PlatformStatus, 'hetzner'>]?.hasToken;
  };

  if (!isOpen) return null;

  // Render config form
  if (configPlatform) {
    return (
      <div
        ref={dropdownRef}
        className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        style={{ animation: 'dropdownFadeIn 0.15s ease-out' }}
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
            <span className="flex items-center justify-center w-6 h-6">
              {getPlatformIcon(configPlatform)}
            </span>
            <span className="font-semibold capitalize">{configPlatform} verbinden</span>
          </div>
          <button
            onClick={() => setConfigPlatform(null)}
            className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {configPlatform === 'hetzner' ? (
            // Hetzner SSH Config
            <>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Server IP oder Domain"
                  value={hetznerConfig.host}
                  onChange={(e) => setHetznerConfig({ ...hetznerConfig, host: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="User (root)"
                    value={hetznerConfig.user}
                    onChange={(e) => setHetznerConfig({ ...hetznerConfig, user: e.target.value })}
                    className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    placeholder="Port (22)"
                    value={hetznerConfig.port}
                    onChange={(e) => setHetznerConfig({ ...hetznerConfig, port: parseInt(e.target.value) || 22 })}
                    className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Web-Pfad (/var/www/html)"
                  value={hetznerConfig.path}
                  onChange={(e) => setHetznerConfig({ ...hetznerConfig, path: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                  SSH-Key einrichten (einmalig):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded font-mono">
                    ssh-copy-id {hetznerConfig.user || 'root'}@{hetznerConfig.host || 'server'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(`ssh-copy-id ${hetznerConfig.user || 'root'}@${hetznerConfig.host || 'server'}`)}
                    className="p-1.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-blue-600" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleConfigureHetzner}
                disabled={!hetznerConfig.host || isLoading}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Teste Verbindung...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Verbinden
                  </span>
                )}
              </button>
            </>
          ) : (
            // Token-based auth for Vercel, Netlify, Cloudflare
            <>
              {/* Step 1: Open token page */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  1. Token erstellen (öffnet neue Seite):
                </p>
                <a
                  href={AUTH_URLS[configPlatform as keyof typeof AUTH_URLS]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {configPlatform.charAt(0).toUpperCase() + configPlatform.slice(1)} Token-Seite öffnen
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Step 2: Paste token */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  2. Token hier einfügen:
                </p>
                <input
                  type="password"
                  placeholder="Token hier einfügen..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  autoFocus
                />

                {/* Cloudflare needs Account ID too */}
                {configPlatform === 'cloudflare' && (
                  <input
                    type="text"
                    placeholder="Account ID (aus Dashboard URL)"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                )}
              </div>

              <button
                onClick={() => handleSaveToken(configPlatform)}
                disabled={!tokenInput.trim() || (configPlatform === 'cloudflare' && !accountId.trim()) || isLoading}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifiziere...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Key className="w-4 h-4" />
                    Token speichern
                  </span>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Token wird sicher lokal gespeichert
              </p>
            </>
          )}
        </div>

        {/* Result in config mode */}
        {deployResult && (
          <div className={`
            p-3 border-t
            ${deployResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
            }
          `}>
            <div className="flex items-center gap-2">
              {deployResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <p className={`text-sm ${deployResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {deployResult.message}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main dropdown view
  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      style={{ animation: 'dropdownFadeIn 0.15s ease-out' }}
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
        {(['vercel', 'netlify', 'cloudflare', 'hetzner'] as const).map((platform) => {
          const authenticated = isAuthenticated(platform);
          const deploying = deployingPlatform === platform;

          return (
            <div key={platform} className="relative">
              <button
                onClick={() => authenticated ? handleDeploy(platform) : setConfigPlatform(platform)}
                disabled={deploying}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${authenticated
                    ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <span className={`
                  flex items-center justify-center w-8 h-8 rounded-lg
                  ${authenticated
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }
                `}>
                  {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : getPlatformIcon(platform)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${authenticated ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      {platform === 'hetzner' && platformStatus?.hetzner?.host && ` (${platformStatus.hetzner.host})`}
                    </span>
                    {platform === 'hetzner' && !authenticated && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">VPS</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {authenticated ? 'Bereit zum Deploy' : 'Klicken zum Verbinden'}
                  </span>
                </div>
                {authenticated ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfigPlatform(platform);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Einstellungen"
                    >
                      <Settings className="w-3 h-3 text-gray-400" />
                    </button>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ) : (
                  <Key className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          );
        })}
      </div>

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

export default DeployDropdown;
