/**
 * Agent Girl - Chat Modals Component
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import { PlanApprovalModal } from '../../plan/PlanApprovalModal';
import { QuestionModal, type Question } from '../../question/QuestionModal';
import { BuildLauncher, type Template } from '../../preview/BuildLauncher';
import { BuildWizard } from '../../build-wizard/BuildWizard';
import { KeyboardShortcuts } from '../../ui/KeyboardShortcuts';
import { PromptLibrary } from '../../prompts/PromptLibrary';
import { Rocket, Hammer, X } from 'lucide-react';

interface ChatModalsProps {
  // Plan approval modal
  pendingPlan: string | null;
  isLoading: boolean;
  onApprovePlan: () => void;
  onRejectPlan: () => void;

  // Question modal
  pendingQuestion: {
    toolId: string;
    questions: Question[];
  } | null;
  onQuestionSubmit: (toolId: string, answers: Record<string, string>) => void;
  onQuestionCancel: (toolId: string) => void;

  // Build wizard
  isBuildWizardOpen: boolean;
  buildMode: 'launcher' | 'wizard';
  onBuildModeChange: (mode: 'launcher' | 'wizard') => void;
  onSelectTemplate: (template: Template) => void;
  onQuickAction: (action: string, input?: string) => void;
  onBuildComplete: (prompt: string) => void;
  onCloseBuildWizard: () => void;

  // Keyboard shortcuts
  showKeyboardShortcuts: boolean;
  onCloseKeyboardShortcuts: () => void;

  // Prompt library
  isPromptLibraryOpen: boolean;
  onSelectPrompt: (prompt: string, useAutonom?: boolean) => void;
  onEditPrompt: (prompt: string) => void;
  onClosePromptLibrary: () => void;
}

export function ChatModals({
  pendingPlan,
  isLoading,
  onApprovePlan,
  onRejectPlan,
  pendingQuestion,
  onQuestionSubmit,
  onQuestionCancel,
  isBuildWizardOpen,
  buildMode,
  onBuildModeChange,
  onSelectTemplate,
  onQuickAction,
  onBuildComplete,
  onCloseBuildWizard,
  showKeyboardShortcuts,
  onCloseKeyboardShortcuts,
  isPromptLibraryOpen,
  onSelectPrompt,
  onEditPrompt,
  onClosePromptLibrary,
}: ChatModalsProps) {
  return (
    <>
      {/* Plan Approval Modal */}
      {pendingPlan && (
        <PlanApprovalModal
          plan={pendingPlan}
          onApprove={onApprovePlan}
          onReject={onRejectPlan}
          isResponseInProgress={isLoading}
        />
      )}

      {/* Question Modal */}
      {pendingQuestion && (
        <QuestionModal
          toolId={pendingQuestion.toolId}
          questions={pendingQuestion.questions}
          onSubmit={onQuestionSubmit}
          onCancel={onQuestionCancel}
        />
      )}

      {/* Build Mode - Tab Selection */}
      {isBuildWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header with Tabs - Always visible for mode switching */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #1a1a2e 100%)' }}>
              <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Website Builder Tab */}
                <button
                  onClick={() => onBuildModeChange('launcher')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    buildMode === 'launcher'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Rocket size={18} />
                  <span>Website Builder</span>
                </button>
                {/* Custom Project Tab */}
                <button
                  onClick={() => onBuildModeChange('wizard')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    buildMode === 'wizard'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Hammer size={18} />
                  <span>Custom Project</span>
                </button>
              </div>
              {/* Close Button */}
              <button
                onClick={onCloseBuildWizard}
                className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close (Esc)"
              >
                <X size={20} />
              </button>
            </div>
            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
              {buildMode === 'launcher' ? (
                <BuildLauncher
                  onSelectTemplate={onSelectTemplate}
                  onQuickAction={onQuickAction}
                  onClose={onCloseBuildWizard}
                />
              ) : (
                <BuildWizard
                  onComplete={onBuildComplete}
                  onClose={onCloseBuildWizard}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={onCloseKeyboardShortcuts}
      />

      {/* Prompt Library Modal */}
      {isPromptLibraryOpen && (
        <PromptLibrary
          onSelectPrompt={onSelectPrompt}
          onEditPrompt={onEditPrompt}
          onClose={onClosePromptLibrary}
        />
      )}
    </>
  );
}
