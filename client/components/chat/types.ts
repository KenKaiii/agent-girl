/**
 * Agent Girl - Shared types for chat components
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { SelectedElement } from '../preview/ElementSelector';

// AI Edit request from preview element selection
export interface AIEditRequest {
  prompt: string;
  elements: Array<{
    id: number;
    tagName: string;
    selector: string;
    className?: string;
    elementId?: string;
    textContent?: string;
    path?: string;
    bounds?: { x: number; y: number; width: number; height: number };
    styles?: {
      color: string;
      backgroundColor: string;
      fontSize: string;
      fontFamily: string;
    };
  }>;
  previewUrl: string;
  screenshot?: string; // base64 data URL
  localData?: Record<string, string>;
  // Enhanced file path context for finding source files
  fileContext?: {
    framework: string | null;
    possibleFiles: string[];
    componentHints: string[];
    routePattern: string;
  };
  // Viewport info for responsive context
  viewport?: {
    width: number;
    height: number;
    device: string;
  };
}

// Action history entry for tracking AI tool usage
export interface ActionHistoryEntry {
  id: string;
  timestamp: number;
  tool: string;
  toolDisplayName: string;
  file?: string;
  status: 'running' | 'success' | 'error';
  duration?: number; // ms
  errorMessage?: string;
}

// AI progress state for preview integration
export interface AIProgressState {
  isActive: boolean;
  currentTool?: string;
  currentFile?: string;
  status: 'idle' | 'thinking' | 'writing' | 'tool_use' | 'completed' | 'error';
  toolDisplayName?: string; // Human-readable tool name
  isFileEdit?: boolean; // True when Edit/Write tool is used (trigger refresh)
  completedAction?: string; // Last completed action for brief display
  editedFilesCount?: number; // Number of files edited in this session
  startTime?: number; // Timestamp when AI started working
  errorMessage?: string; // Error message if status is 'error'
  actionHistory?: ActionHistoryEntry[]; // Recent actions for history log
  currentToolId?: string; // Track current tool for result matching
}

// AUTONOM progress tracker state
export interface AutonomProgressData {
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

export interface ChatContainerProps {
  layoutMode?: 'chat-only' | 'split-screen';
  onLayoutModeChange?: (mode: 'chat-only' | 'split-screen') => void;
  previewUrl?: string | null;
  onSetPreviewUrl?: () => void;
  onDetectPreviewUrl?: () => void;
  onAIEditRequestHandler?: (handler: (request: AIEditRequest) => void) => void;
  onAIProgressChange?: (progress: AIProgressState) => void;
  // Expose setInputValue so preview selection can load context into chat
  onInputValueSetter?: (setter: (value: string) => void) => void;
  // Selected elements from preview for displaying in chat
  selectedElements?: Array<{
    id: number;
    tagName: string;
    selector: string;
    className?: string;
    elementId?: string;
  }>;
  onClearSelection?: () => void;
  // BUILD MODE: Auto-start preview with specific URL
  onBuildPreviewStart?: (url: string) => void;
}
