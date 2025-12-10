/**
 * Agent Girl - Chat Input Section Component
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import { ChatInput } from './ChatInput';
import { CommandQueueDisplay } from '../queue/CommandQueueDisplay';
import { ActivityProgressBar } from './ActivityProgressBar';
import { WorkingDirectoryPanel } from './WorkingDirectoryPanel';
import { ProjectsPanel } from './ProjectsPanel';
import type { BackgroundProcess } from '../process/BackgroundProcessMonitor';
import type { SlashCommand } from '../../hooks/useWebSocket';
import type { AIProgressState } from './types';
import type { SelectedElement } from '../preview/ElementSelector';
import type { Project } from '../../hooks/useSessionAPI';

interface ChatInputSectionProps {
  // Session info
  currentSessionId: string | null;
  sessionWorkingDirectory?: string;

  // Input state
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (files?: import('../message/types').FileAttachment[], mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build', messageOverride?: string) => void;
  onStop: () => void;
  disabled: boolean;
  isGenerating: boolean;

  // Mode and permissions
  mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build';
  onModeChange: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => void;
  isPlanMode: boolean;
  onTogglePlanMode: () => void;
  isAutonomMode: boolean;
  onToggleAutonomMode: () => void;

  // Context and commands
  availableCommands: SlashCommand[];
  contextUsage?: {
    inputTokens: number;
    contextWindow: number;
    contextPercentage: number;
  };
  selectedModel: string;

  // Background processes
  backgroundProcesses: BackgroundProcess[];
  onKillProcess: (bashId: string) => void;

  // Layout
  layoutMode?: 'chat-only' | 'split-screen';
  onOpenBuildWizard: () => void;
  onOpenPromptLibrary: () => void;

  // Preview integration
  previewUrl?: string;
  selectedElements?: SelectedElement[];
  onClearSelection?: () => void;

  // Activity progress
  activityProgress: AIProgressState;

  // Command queue
  commandQueue: Array<{ id: string; content: string; status: 'pending' | 'running' | 'completed' }>;
  onClearQueue: () => void;

  // Working directory
  onDirectoryChange: (newPath: string) => void;
  onInsertText: (text: string) => void;
  isWorkingDirPanelCollapsed: boolean;
  onToggleWorkingDirCollapse: () => void;

  // Projects
  projects?: Project[];
  isProjectsPanelCollapsed?: boolean;
  onToggleProjectsCollapse?: () => void;
  onOpenProjectPreview?: (url: string) => void;
}

export function ChatInputSection({
  currentSessionId,
  sessionWorkingDirectory,
  inputValue,
  onInputChange,
  onSubmit,
  onStop,
  disabled,
  isGenerating,
  mode,
  onModeChange,
  isPlanMode,
  onTogglePlanMode,
  isAutonomMode,
  onToggleAutonomMode,
  availableCommands,
  contextUsage,
  selectedModel,
  backgroundProcesses,
  onKillProcess,
  layoutMode,
  onOpenBuildWizard,
  onOpenPromptLibrary,
  previewUrl,
  selectedElements,
  onClearSelection,
  activityProgress,
  commandQueue,
  onClearQueue,
  onDirectoryChange,
  onInsertText,
  isWorkingDirPanelCollapsed,
  onToggleWorkingDirCollapse,
  // Projects
  projects,
  isProjectsPanelCollapsed,
  onToggleProjectsCollapse,
  onOpenProjectPreview,
}: ChatInputSectionProps) {
  return (
    <>
      {/* Command Queue Display */}
      <CommandQueueDisplay
        queue={commandQueue}
        onClearQueue={onClearQueue}
      />

      {/* Input - with integrated selection display */}
      <ChatInput
        key={currentSessionId || 'new-chat'}
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSubmit}
        onStop={onStop}
        disabled={disabled}
        isGenerating={isGenerating}
        isPlanMode={isPlanMode}
        onTogglePlanMode={onTogglePlanMode}
        isAutonomMode={isAutonomMode}
        onToggleAutonomMode={onToggleAutonomMode}
        backgroundProcesses={backgroundProcesses}
        onKillProcess={onKillProcess}
        mode={mode}
        onModeChange={onModeChange}
        availableCommands={availableCommands}
        contextUsage={contextUsage}
        selectedModel={selectedModel}
        layoutMode={layoutMode}
        onOpenBuildWizard={onOpenBuildWizard}
        onOpenPromptLibrary={onOpenPromptLibrary}
        previewUrl={previewUrl}
        selectedElements={selectedElements}
        onClearSelection={onClearSelection}
      />

      {/* Activity Progress Bar - below chat input with nice effects */}
      <ActivityProgressBar
        progress={activityProgress}
        isGenerating={isGenerating}
      />

      {/* Working Directory Panel */}
      <WorkingDirectoryPanel
        workingDirectory={sessionWorkingDirectory || null}
        chatFolder={sessionWorkingDirectory}
        onDirectoryChange={onDirectoryChange}
        onInsertText={onInsertText}
        sessionId={currentSessionId || undefined}
        isCollapsed={isWorkingDirPanelCollapsed}
        onToggleCollapse={onToggleWorkingDirCollapse}
      />

      {/* Projects Panel */}
      <ProjectsPanel
        projects={projects}
        isCollapsed={isProjectsPanelCollapsed}
        onToggleCollapse={onToggleProjectsCollapse}
        onOpenPreview={onOpenProjectPreview}
      />
    </>
  );
}
