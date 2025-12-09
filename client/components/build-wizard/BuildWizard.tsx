/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { X } from 'lucide-react';
import { ProjectTypeSelector } from './ProjectTypeSelector';
import { FeatureSelector } from './FeatureSelector';
import { ConfigurationStep } from './ConfigurationStep';
import { ReviewStep } from './ReviewStep';
import { generateBuildPrompt, type ProjectTemplate } from './buildConfig';

type WizardStep = 'project-type' | 'features' | 'configuration' | 'review';

interface BuildWizardProps {
  onComplete: (prompt: string) => void;
  onClose: () => void;
}

/**
 * PERFORMANCE: Wrapped in React.memo to prevent unnecessary re-renders
 * when parent components update but props haven't changed
 */
export const BuildWizard = memo(function BuildWizard({ onComplete, onClose }: BuildWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('project-type');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [configurations, setConfigurations] = useState<Record<string, string | boolean | number>>({});
  const [projectName, setProjectName] = useState('my-project');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Ref for scrollable content container
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Smooth transition helper
  const transitionToStep = (nextStep: WizardStep) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsTransitioning(false);
    }, 150);
  };

  // Step 1: Select project type
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setSelectedFeatures(new Set());
    setConfigurations({});

    // Initialize default configurations
    const defaults: Record<string, string | boolean | number> = {};
    template.features.forEach(feature => {
      feature.configOptions?.forEach(opt => {
        if (opt.defaultValue !== undefined) {
          defaults[opt.id] = opt.defaultValue;
        }
      });
    });
    setConfigurations(defaults);

    transitionToStep('features');
  };

  // Step 2: Toggle features
  const handleToggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  // Step 3: Update configuration
  const handleUpdateConfig = (key: string, value: string | boolean | number) => {
    setConfigurations(prev => ({ ...prev, [key]: value }));
  };

  // Step 4: Start building
  const handleStartBuilding = () => {
    if (!selectedTemplate) return;

    const prompt = generateBuildPrompt(
      selectedTemplate,
      projectName,
      selectedFeatures,
      configurations
    );

    onComplete(prompt);
  };

  // Progress indicator
  const steps = ['project-type', 'features', 'configuration', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Render inline within ChatModals - no createPortal to allow tab switching
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
      }}
    >
      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundImage: 'linear-gradient(90deg, #A8C7FA 0%, #DAEEFF 50%, #A8C7FA 100%)',
            backgroundSize: '200% auto',
            animation: 'shimmer 3s linear infinite',
            transition: 'width 500ms ease-out',
          }}
        />
      </div>

      {/* Spacer for progress bar */}
      <div style={{ height: '20px', flexShrink: 0 }} />

      {/* Step Content with Transitions */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
          {currentStep === 'project-type' && (
            <ProjectTypeSelector onSelect={handleTemplateSelect} />
          )}

          {currentStep === 'features' && selectedTemplate && (
            <FeatureSelector
              template={selectedTemplate}
              selectedFeatures={selectedFeatures}
              onToggleFeature={handleToggleFeature}
            />
          )}

          {currentStep === 'configuration' && selectedTemplate && (
            <ConfigurationStep
              template={selectedTemplate}
              selectedFeatures={selectedFeatures}
              configurations={configurations}
              onUpdateConfig={handleUpdateConfig}
              projectName={projectName}
              onProjectNameChange={setProjectName}
            />
          )}

          {currentStep === 'review' && selectedTemplate && (
            <ReviewStep
              template={selectedTemplate}
              projectName={projectName}
              selectedFeatures={selectedFeatures}
              configurations={configurations}
            />
          )}
        </div>

      {/* Action Buttons */}
      {currentStep !== 'project-type' && (
        <div
          style={{
            padding: '16px 32px',
            backgroundColor: 'transparent',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
            <button
              onClick={() => {
                if (currentStep === 'features') transitionToStep('project-type');
                else if (currentStep === 'configuration') transitionToStep('features');
                else if (currentStep === 'review') transitionToStep('configuration');
              }}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ← Back
            </button>

            {currentStep === 'features' && (
              <div style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                {selectedFeatures.size} feature{selectedFeatures.size !== 1 ? 's' : ''} selected
              </div>
            )}

            <button
              onClick={() => {
                if (currentStep === 'features') {
                  if (selectedFeatures.size > 0) transitionToStep('configuration');
                } else if (currentStep === 'configuration') {
                  if (projectName.trim().length > 0) transitionToStep('review');
                } else if (currentStep === 'review') {
                  handleStartBuilding();
                }
              }}
              disabled={
                (currentStep === 'features' && selectedFeatures.size === 0) ||
                (currentStep === 'configuration' && projectName.trim().length === 0)
              }
              className={
                (currentStep === 'features' && selectedFeatures.size > 0) ||
                (currentStep === 'configuration' && projectName.trim().length > 0) ||
                currentStep === 'review'
                  ? 'send-button-active'
                  : ''
              }
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor:
                  (currentStep === 'features' && selectedFeatures.size === 0) ||
                  (currentStep === 'configuration' && projectName.trim().length === 0)
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'all 200ms',
                ...((currentStep === 'features' && selectedFeatures.size === 0) ||
                (currentStep === 'configuration' && projectName.trim().length === 0)
                  ? {
                      backgroundColor: 'rgb(75, 85, 99)',
                      color: 'rgba(255, 255, 255, 0.4)',
                      border: 'none',
                    }
                  : currentStep === 'review'
                  ? {
                      backgroundImage: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)',
                      backgroundSize: '200% auto',
                      animation: 'shimmer 3s linear infinite',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)',
                      border: 'none',
                    }
                  : {}),
              }}
            >
              {currentStep === 'review' ? 'Start Building' : 'Next →'}
            </button>
          </div>
        )}

      {/* Step Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '16px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'transparent',
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              width: index === currentStepIndex ? '32px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: index <= currentStepIndex
                ? 'rgb(218, 238, 255)'
                : 'rgba(255, 255, 255, 0.2)',
              transition: 'all 300ms',
            }}
          />
        ))}
      </div>
    </div>
  );
});
