/**
 * Template Wizard Panel
 * Main panel for browsing templates and creating projects.
 */

import React, { useState, useCallback } from 'react';
import { X, Minimize2, Maximize2, Layout, ChevronLeft } from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';
import { TemplateGrid } from './TemplateGrid';
import { ProjectCreationForm } from './ProjectCreationForm';
import { ProjectCreatedSuccess } from './ProjectCreatedSuccess';
import type { TemplateCreationOptions, CreatedProject } from '../../hooks/useTemplates';

interface TemplateWizardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOutputPath?: string;
  onOpenProject?: (path: string) => void;
}

type Step = 'browse' | 'configure' | 'success';

export function TemplateWizardPanel({
  isOpen,
  onClose,
  defaultOutputPath = '/Users/master/Documents/projects',
  onOpenProject,
}: TemplateWizardPanelProps) {
  const {
    templates,
    categories,
    frameworks,
    filteredTemplates,
    isLoading,
    isCreating,
    error,
    lastCreated,
    selectedCategory,
    selectedFramework,
    setSelectedCategory,
    setSelectedFramework,
    getTemplate,
    createProject,
    clearError,
  } = useTemplates();

  const [step, setStep] = useState<Step>('browse');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const selectedTemplate = selectedTemplateId ? getTemplate(selectedTemplateId) : null;

  const handleSelectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setStep('configure');
  }, []);

  const handleCreate = useCallback(async (options: TemplateCreationOptions) => {
    clearError();
    const result = await createProject(options);
    if (result) {
      setStep('success');
    }
  }, [createProject, clearError]);

  const handleBack = useCallback(() => {
    if (step === 'configure') {
      setStep('browse');
      setSelectedTemplateId(null);
    } else if (step === 'success') {
      setStep('browse');
      setSelectedTemplateId(null);
    }
  }, [step]);

  const handleCreateAnother = useCallback(() => {
    setStep('browse');
    setSelectedTemplateId(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMinimized ? '300px' : '900px',
        maxWidth: '95vw',
        maxHeight: isMinimized ? 'auto' : '85vh',
        backgroundColor: 'rgb(26, 28, 30)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1001,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgb(38, 40, 42)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step !== 'browse' && !isMinimized && (
            <button
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgb(156, 163, 175)',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>
          )}
          <Layout style={{ width: '20px', height: '20px', color: 'rgb(168, 199, 250)' }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>
            {step === 'browse' && 'Neues Projekt erstellen'}
            {step === 'configure' && 'Projekt konfigurieren'}
            {step === 'success' && 'Projekt erstellt'}
          </span>
          {selectedTemplate && step === 'configure' && (
            <span style={{
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: 'rgba(168, 199, 250, 0.15)',
              color: 'rgb(168, 199, 250)',
            }}>
              {selectedTemplate.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgb(156, 163, 175)',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            {isMinimized ? (
              <Maximize2 style={{ width: '14px', height: '14px' }} />
            ) : (
              <Minimize2 style={{ width: '14px', height: '14px' }} />
            )}
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgb(156, 163, 175)',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Error Display */}
          {error && (
            <div style={{
              padding: '12px 20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'rgb(239, 68, 68)' }}>{error}</span>
                <button
                  onClick={clearError}
                  style={{
                    fontSize: '12px',
                    color: 'rgb(239, 68, 68)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {step === 'browse' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 6px' }}>
                    Wähle ein Template
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgb(156, 163, 175)', margin: 0 }}>
                    {templates.length} professionelle Templates in {categories.length} Kategorien
                  </p>
                </div>
                <TemplateGrid
                  templates={filteredTemplates}
                  categories={categories}
                  frameworks={frameworks}
                  selectedTemplate={selectedTemplateId}
                  selectedCategory={selectedCategory}
                  selectedFramework={selectedFramework}
                  onSelectTemplate={handleSelectTemplate}
                  onSelectCategory={setSelectedCategory}
                  onSelectFramework={setSelectedFramework}
                  isLoading={isLoading}
                />
              </div>
            )}

            {step === 'configure' && selectedTemplate && (
              <ProjectCreationForm
                template={selectedTemplate}
                onSubmit={handleCreate}
                isCreating={isCreating}
                defaultOutputPath={defaultOutputPath}
              />
            )}

            {step === 'success' && lastCreated && (
              <ProjectCreatedSuccess
                project={lastCreated}
                onOpenProject={onOpenProject}
                onCreateAnother={handleCreateAnother}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Backdrop component
export function TemplateWizardBackdrop({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
      }}
    />
  );
}

export default TemplateWizardPanel;
