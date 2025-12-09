/**
 * Agent Girl - Chat Modals Component
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import { PlanApprovalModal } from '../plan/PlanApprovalModal';
import { QuestionModal, type Question } from '../question/QuestionModal';
import { BuildLauncher, type Template } from '../preview/BuildLauncher';
import { BuildWizard } from '../build-wizard/BuildWizard';
import { KeyboardShortcuts } from '../ui/KeyboardShortcuts';
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
            {/* Header with Tabs */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-1">
                {/* Website Builder Tab */}
                <button
                  onClick={() => onBuildModeChange('launcher')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    buildMode === 'launcher'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Rocket size={16} />
                  Website Builder
                </button>
                {/* Custom Project Tab */}
                <button
                  onClick={() => onBuildModeChange('wizard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    buildMode === 'wizard'
                      ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white border border-orange-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Hammer size={16} />
                  Custom Project
                </button>
              </div>
              {/* Close Button */}
              <button
                onClick={onCloseBuildWizard}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
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
    </>
  );
}
