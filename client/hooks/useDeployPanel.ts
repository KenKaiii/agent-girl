/**
 * Deploy Panel Hook
 *
 * State management for deployment operations.
 * Handles multi-platform deployments (Vercel, Netlify, Cloudflare).
 */

import { useState, useCallback, useEffect } from 'react';

export interface PlatformStatus {
  vercel: { installed: boolean; authenticated: boolean };
  netlify: { installed: boolean; authenticated: boolean };
  cloudflare: { installed: boolean; authenticated: boolean };
}

export interface DeploymentResult {
  success: boolean;
  platform: string;
  url?: string;
  previewUrl?: string;
  message: string;
  logs?: string[];
  deploymentId?: string;
}

export interface DeploymentHistory {
  id: string;
  platform: string;
  url: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  isProduction: boolean;
}

export type DeploymentPlatform = 'vercel' | 'netlify' | 'cloudflare';

interface UseDeployPanelOptions {
  projectPath: string;
}

interface UseDeployPanelReturn {
  // State
  platformStatus: PlatformStatus | null;
  framework: string;
  isLoading: boolean;
  isDeploying: boolean;
  deployResult: DeploymentResult | null;
  deploymentHistory: DeploymentHistory[];
  selectedPlatform: DeploymentPlatform | null;
  isProduction: boolean;
  error: string | null;

  // Actions
  setSelectedPlatform: (platform: DeploymentPlatform | null) => void;
  setIsProduction: (isProduction: boolean) => void;
  refresh: () => Promise<void>;
  deploy: (platform?: DeploymentPlatform) => Promise<DeploymentResult>;
  quickDeploy: () => Promise<DeploymentResult>;
  clearResult: () => void;
}

export function useDeployPanel({
  projectPath,
}: UseDeployPanelOptions): UseDeployPanelReturn {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [framework, setFramework] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeploymentResult | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentHistory[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<DeploymentPlatform | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check platform availability
  const checkPlatformStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/deploy/status');
      if (res.ok) {
        const data = await res.json();
        setPlatformStatus(data);

        // Auto-select first authenticated platform
        if (data.vercel?.authenticated) {
          setSelectedPlatform('vercel');
        } else if (data.netlify?.authenticated) {
          setSelectedPlatform('netlify');
        } else if (data.cloudflare?.authenticated) {
          setSelectedPlatform('cloudflare');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check platform status');
    }
  }, []);

  // Detect framework
  const detectFramework = useCallback(async () => {
    if (!projectPath) return;

    try {
      const res = await fetch(`/api/deploy/framework?projectPath=${encodeURIComponent(projectPath)}`);
      if (res.ok) {
        const data = await res.json();
        setFramework(data.framework || 'other');
      }
    } catch {
      setFramework('other');
    }
  }, [projectPath]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([checkPlatformStatus(), detectFramework()]);
    setIsLoading(false);
  }, [checkPlatformStatus, detectFramework]);

  // Deploy to specific platform
  const deploy = useCallback(async (platform?: DeploymentPlatform): Promise<DeploymentResult> => {
    const targetPlatform = platform || selectedPlatform;

    if (!projectPath || !targetPlatform) {
      const result: DeploymentResult = {
        success: false,
        platform: targetPlatform || 'unknown',
        message: 'No project path or platform selected',
      };
      setDeployResult(result);
      return result;
    }

    setIsDeploying(true);
    setDeployResult(null);
    setError(null);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          platform: targetPlatform,
          production: isProduction,
        }),
      });

      const data = await res.json();

      const result: DeploymentResult = {
        success: data.success || res.ok,
        platform: targetPlatform,
        url: data.url,
        previewUrl: data.previewUrl,
        message: data.message || (res.ok ? 'Deployment successful' : 'Deployment failed'),
        logs: data.logs,
        deploymentId: data.deploymentId,
      };

      setDeployResult(result);

      // Add to history on success
      if (result.success && result.url) {
        setDeploymentHistory((prev) => [
          {
            id: result.deploymentId || Date.now().toString(),
            platform: targetPlatform,
            url: result.url!,
            status: 'success',
            timestamp: new Date().toISOString(),
            isProduction,
          },
          ...prev.slice(0, 9), // Keep last 10
        ]);
      }

      return result;
    } catch (err) {
      const result: DeploymentResult = {
        success: false,
        platform: targetPlatform,
        message: err instanceof Error ? err.message : 'Deployment failed',
      };
      setDeployResult(result);
      setError(result.message);
      return result;
    } finally {
      setIsDeploying(false);
    }
  }, [projectPath, selectedPlatform, isProduction]);

  // Quick deploy (auto-detect best platform)
  const quickDeploy = useCallback(async (): Promise<DeploymentResult> => {
    if (!projectPath) {
      const result: DeploymentResult = {
        success: false,
        platform: 'auto',
        message: 'No project path specified',
      };
      setDeployResult(result);
      return result;
    }

    setIsDeploying(true);
    setDeployResult(null);
    setError(null);

    try {
      const res = await fetch('/api/deploy/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          production: isProduction,
        }),
      });

      const data = await res.json();

      const result: DeploymentResult = {
        success: data.success || res.ok,
        platform: data.platform || 'auto',
        url: data.url,
        previewUrl: data.previewUrl,
        message: data.message || (res.ok ? 'Deployment successful' : 'Deployment failed'),
        logs: data.logs,
        deploymentId: data.deploymentId,
      };

      setDeployResult(result);

      // Add to history on success
      if (result.success && result.url) {
        setDeploymentHistory((prev) => [
          {
            id: result.deploymentId || Date.now().toString(),
            platform: result.platform,
            url: result.url!,
            status: 'success',
            timestamp: new Date().toISOString(),
            isProduction,
          },
          ...prev.slice(0, 9),
        ]);
      }

      return result;
    } catch (err) {
      const result: DeploymentResult = {
        success: false,
        platform: 'auto',
        message: err instanceof Error ? err.message : 'Deployment failed',
      };
      setDeployResult(result);
      setError(result.message);
      return result;
    } finally {
      setIsDeploying(false);
    }
  }, [projectPath, isProduction]);

  // Clear result
  const clearResult = useCallback(() => {
    setDeployResult(null);
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-detect framework when project changes
  useEffect(() => {
    if (projectPath) {
      detectFramework();
    }
  }, [projectPath, detectFramework]);

  return {
    platformStatus,
    framework,
    isLoading,
    isDeploying,
    deployResult,
    deploymentHistory,
    selectedPlatform,
    isProduction,
    error,
    setSelectedPlatform,
    setIsProduction,
    refresh,
    deploy,
    quickDeploy,
    clearResult,
  };
}

export default useDeployPanel;
