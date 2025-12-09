/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Premium Builder React Hook
 * Manages premium website builder state and WebSocket communication
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface PremiumBuildProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  currentPhase?: string;
  currentStepName?: string;
}

export interface PremiumBuildCost {
  tokens: number;
  apiCalls: number;
  estimatedUSD: number;
}

export interface PremiumBuild {
  buildId: string;
  status: 'initializing' | 'planning' | 'building' | 'complete' | 'error';
  progress: PremiumBuildProgress;
  cost: PremiumBuildCost;
  previewUrl?: string;
  projectPath?: string;
  error?: string;
}

export interface EditCommand {
  type: 'color' | 'font' | 'text' | 'layout' | 'component' | 'style';
  target: string;
  value: string;
  scope?: string;
}

export interface ChangeOperation {
  file: string;
  type: 'modify' | 'create' | 'delete';
  changes: string[];
}

export interface EditResult {
  success: boolean;
  appliedChanges: ChangeOperation[];
  preview?: string;
  message: string;
  canUndo: boolean;
}

// WebSocket Message Types
interface PremiumBuildProgressMessage {
  type: 'premium_build_progress';
  buildId: string;
  progress: PremiumBuildProgress;
  cost: PremiumBuildCost;
  status: PremiumBuild['status'];
}

interface PremiumBuildCompleteMessage {
  type: 'premium_build_complete';
  buildId: string;
  previewUrl: string;
  projectPath: string;
  cost: PremiumBuildCost;
}

interface PremiumBuildErrorMessage {
  type: 'premium_build_error';
  buildId: string;
  error: string;
}

interface PremiumEditResultMessage {
  type: 'premium_edit_result';
  buildId: string;
  success: boolean;
  appliedChanges: ChangeOperation[];
  preview?: string;
  message: string;
  canUndo: boolean;
}

interface PremiumUndoResultMessage {
  type: 'premium_undo_result';
  buildId: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

interface PremiumPreviewRefreshMessage {
  type: 'premium_preview_refresh';
  buildId: string;
}

interface PremiumPreviewReadyMessage {
  type: 'premium_preview_ready';
  buildId: string;
  previewUrl: string | null;
  projectPath?: string;
  status: PremiumBuild['status'];
}

export type PremiumWebSocketMessage =
  | PremiumBuildProgressMessage
  | PremiumBuildCompleteMessage
  | PremiumBuildErrorMessage
  | PremiumEditResultMessage
  | PremiumUndoResultMessage
  | PremiumPreviewRefreshMessage
  | PremiumPreviewReadyMessage;

// ============================================================================
// Hook Options
// ============================================================================

interface UsePremiumBuilderOptions {
  sendMessage: (message: Record<string, unknown>) => void;
  sessionId: string;
  onBuildComplete?: (build: PremiumBuild) => void;
  onBuildError?: (error: string) => void;
  onEditComplete?: (result: EditResult) => void;
  onPreviewRefresh?: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePremiumBuilder({
  sendMessage,
  sessionId,
  onBuildComplete,
  onBuildError,
  onEditComplete,
  onPreviewRefresh,
}: UsePremiumBuilderOptions) {
  // State
  const [build, setBuild] = useState<PremiumBuild | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lastEditResult, setLastEditResult] = useState<EditResult | null>(null);

  // Refs for callbacks to prevent stale closures
  const onBuildCompleteRef = useRef(onBuildComplete);
  const onBuildErrorRef = useRef(onBuildError);
  const onEditCompleteRef = useRef(onEditComplete);
  const onPreviewRefreshRef = useRef(onPreviewRefresh);

  // Update refs when callbacks change
  useEffect(() => {
    onBuildCompleteRef.current = onBuildComplete;
    onBuildErrorRef.current = onBuildError;
    onEditCompleteRef.current = onEditComplete;
    onPreviewRefreshRef.current = onPreviewRefresh;
  }, [onBuildComplete, onBuildError, onEditComplete, onPreviewRefresh]);

  // ============================================================================
  // Message Handler
  // ============================================================================

  const handlePremiumMessage = useCallback((message: PremiumWebSocketMessage) => {
    switch (message.type) {
      case 'premium_build_progress':
        setBuild(prev => ({
          buildId: message.buildId,
          status: message.status,
          progress: message.progress,
          cost: message.cost,
          previewUrl: prev?.previewUrl,
          projectPath: prev?.projectPath,
        }));
        break;

      case 'premium_build_complete':
        setBuild(prev => prev ? {
          ...prev,
          status: 'complete',
          previewUrl: message.previewUrl,
          projectPath: message.projectPath,
          cost: message.cost,
        } : null);
        setIsBuilding(false);
        if (build) {
          onBuildCompleteRef.current?.({
            ...build,
            status: 'complete',
            previewUrl: message.previewUrl,
            projectPath: message.projectPath,
            cost: message.cost,
          });
        }
        break;

      case 'premium_build_error':
        setBuild(prev => prev ? {
          ...prev,
          status: 'error',
          error: message.error,
        } : null);
        setIsBuilding(false);
        onBuildErrorRef.current?.(message.error);
        break;

      case 'premium_edit_result':
        const editResult: EditResult = {
          success: message.success,
          appliedChanges: message.appliedChanges,
          preview: message.preview,
          message: message.message,
          canUndo: message.canUndo,
        };
        setLastEditResult(editResult);
        setCanUndo(message.canUndo);
        onEditCompleteRef.current?.(editResult);
        break;

      case 'premium_undo_result':
        if (!message.success && message.error) {
          setCanUndo(false);
        }
        break;

      case 'premium_preview_refresh':
        onPreviewRefreshRef.current?.();
        break;

      case 'premium_preview_ready':
        setBuild(prev => prev ? {
          ...prev,
          previewUrl: message.previewUrl || prev.previewUrl,
          projectPath: message.projectPath || prev.projectPath,
          status: message.status,
        } : null);
        break;
    }
  }, [build]);

  // ============================================================================
  // Actions
  // ============================================================================

  const startBuild = useCallback((buildId: string) => {
    setIsBuilding(true);
    setBuild({
      buildId,
      status: 'initializing',
      progress: {
        currentStep: 0,
        totalSteps: 100,
        percentage: 0,
      },
      cost: {
        tokens: 0,
        apiCalls: 0,
        estimatedUSD: 0,
      },
    });

    sendMessage({
      type: 'premium_build_start',
      buildId,
      sessionId,
    });
  }, [sendMessage, sessionId]);

  const sendEdit = useCallback((command: EditCommand) => {
    if (!build?.buildId) return;

    sendMessage({
      type: 'premium_edit',
      buildId: build.buildId,
      command,
    });
  }, [sendMessage, build?.buildId]);

  const undo = useCallback(() => {
    if (!build?.buildId || !canUndo) return;

    sendMessage({
      type: 'premium_undo',
      buildId: build.buildId,
    });
  }, [sendMessage, build?.buildId, canUndo]);

  const redo = useCallback(() => {
    if (!build?.buildId || !canRedo) return;

    sendMessage({
      type: 'premium_redo',
      buildId: build.buildId,
    });
  }, [sendMessage, build?.buildId, canRedo]);

  const requestPreview = useCallback(() => {
    if (!build?.buildId) return;

    sendMessage({
      type: 'premium_preview_request',
      buildId: build.buildId,
    });
  }, [sendMessage, build?.buildId]);

  const reset = useCallback(() => {
    setBuild(null);
    setIsBuilding(false);
    setCanUndo(false);
    setCanRedo(false);
    setLastEditResult(null);
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    build,
    isBuilding,
    canUndo,
    canRedo,
    lastEditResult,

    // Actions
    startBuild,
    sendEdit,
    undo,
    redo,
    requestPreview,
    reset,

    // Message handler (to be called from parent WebSocket handler)
    handlePremiumMessage,
  };
}

// ============================================================================
// API Helpers (for REST endpoints)
// ============================================================================

const API_BASE = '/api/premium';

export interface AnalyzeBusinessInput {
  businessName: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  features?: string[];
}

export interface StartBuildInput {
  sessionId: string;
  businessInfo: AnalyzeBusinessInput;
  nicheId: string;
  designSystemId: string;
  options?: {
    includeImages?: boolean;
    seoOptimized?: boolean;
    multiLanguage?: boolean;
  };
}

export interface ExportOptions {
  format: 'astro' | 'static' | 'zip' | 'docker';
  includeSourceMaps?: boolean;
  minify?: boolean;
}

export interface DeployOptions {
  platform: 'vercel' | 'netlify' | 'cloudflare' | 'github-pages';
  projectName?: string;
  customDomain?: string;
}

export const premiumAPI = {
  async analyze(input: AnalyzeBusinessInput) {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return response.json();
  },

  async startBuild(input: StartBuildInput) {
    const response = await fetch(`${API_BASE}/start-build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return response.json();
  },

  async getBuildStatus(buildId: string) {
    const response = await fetch(`${API_BASE}/build-status/${buildId}`);
    return response.json();
  },

  async regenerateContent(buildId: string, section: string, style?: string) {
    const response = await fetch(`${API_BASE}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildId, section, style }),
    });
    return response.json();
  },

  async exportProject(buildId: string, options: ExportOptions) {
    const response = await fetch(`${API_BASE}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildId, ...options }),
    });
    return response.json();
  },

  async deployProject(buildId: string, options: DeployOptions) {
    const response = await fetch(`${API_BASE}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildId, ...options }),
    });
    return response.json();
  },

  async getTemplates() {
    const response = await fetch(`${API_BASE}/templates`);
    return response.json();
  },

  async getNiches() {
    const response = await fetch(`${API_BASE}/niches`);
    return response.json();
  },

  async getActiveBuilds() {
    const response = await fetch(`${API_BASE}/builds`);
    return response.json();
  },
};
