/**
 * Component Generator Panel
 * Main panel combining preset gallery, form, and preview.
 */

import React, { useState, useCallback } from 'react';
import { X, Minimize2, Maximize2, Sparkles, Layers } from 'lucide-react';
import { useComponents } from '../../hooks/useComponents';
import { PresetGallery } from './PresetGallery';
import { ComponentForm } from './ComponentForm';
import { ComponentPreview } from './ComponentPreview';
import type { ComponentGenerationOptions, GeneratedComponent } from '../../hooks/useComponents';

interface ComponentGeneratorPanelProps {
  projectPath?: string;
  isOpen: boolean;
  onClose: () => void;
}

type View = 'presets' | 'form' | 'preview';

export function ComponentGeneratorPanel({ projectPath, isOpen, onClose }: ComponentGeneratorPanelProps) {
  const {
    presets,
    isLoading,
    isGenerating,
    error,
    lastGenerated,
    generateComponent,
    generateFromPreset,
    clearError,
  } = useComponents();

  const [view, setView] = useState<View>('presets');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSelectPreset = useCallback((presetName: string) => {
    setSelectedPreset(presetName);
    setView('form');
  }, []);

  const handleGenerate = useCallback(async (options: ComponentGenerationOptions) => {
    clearError();
    const result = await generateComponent(options);
    if (result) {
      setView('preview');
    }
  }, [generateComponent, clearError]);

  const handleGenerateFromPreset = useCallback(async () => {
    if (!selectedPreset) return;
    clearError();
    const result = await generateFromPreset(selectedPreset, { projectPath });
    if (result) {
      setView('preview');
    }
  }, [selectedPreset, projectPath, generateFromPreset, clearError]);

  const handleInsertToProject = useCallback((component: GeneratedComponent) => {
    // This would trigger actual file write via API
    console.log('Insert to project:', component.path);
    // TODO: Implement actual file insertion
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'preview') {
      setView('form');
    } else if (view === 'form') {
      setView('presets');
      setSelectedPreset(null);
    }
  }, [view]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMinimized ? '20px' : '80px',
        right: '20px',
        width: isMinimized ? 'auto' : '700px',
        maxHeight: isMinimized ? 'auto' : 'calc(100vh - 160px)',
        backgroundColor: 'rgb(26, 28, 30)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgb(38, 40, 42)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles style={{ width: '18px', height: '18px', color: 'rgb(168, 199, 250)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
            AI Component Generator
          </span>
          {view === 'form' && selectedPreset && (
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(168, 199, 250, 0.15)',
              color: 'rgb(168, 199, 250)',
            }}>
              {selectedPreset}
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
          {/* Navigation Breadcrumb */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgb(30, 32, 34)',
          }}>
            <button
              onClick={() => { setView('presets'); setSelectedPreset(null); }}
              style={{
                fontSize: '12px',
                color: view === 'presets' ? 'white' : 'rgb(168, 199, 250)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: view === 'presets' ? 'none' : 'underline',
              }}
            >
              Presets
            </button>
            {(view === 'form' || view === 'preview') && (
              <>
                <span style={{ color: 'rgb(75, 85, 99)' }}>/</span>
                <button
                  onClick={() => setView('form')}
                  style={{
                    fontSize: '12px',
                    color: view === 'form' ? 'white' : 'rgb(168, 199, 250)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: view === 'form' ? 'none' : 'underline',
                  }}
                >
                  Konfiguration
                </button>
              </>
            )}
            {view === 'preview' && (
              <>
                <span style={{ color: 'rgb(75, 85, 99)' }}>/</span>
                <span style={{ fontSize: '12px', color: 'white' }}>Preview</span>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              padding: '12px 16px',
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
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {view === 'presets' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                    Wähle ein Preset oder erstelle eine eigene Komponente
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                    21 vorgefertigte Komponenten in 5 Kategorien verfügbar
                  </p>
                </div>
                <PresetGallery
                  presets={presets}
                  selectedPreset={selectedPreset}
                  onSelectPreset={handleSelectPreset}
                  isLoading={isLoading}
                />
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    onClick={() => setView('form')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '2px dashed rgba(168, 199, 250, 0.3)',
                      backgroundColor: 'transparent',
                      color: 'rgb(168, 199, 250)',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                  >
                    <Layers style={{ width: '18px', height: '18px' }} />
                    Eigene Komponente erstellen
                  </button>
                </div>
              </div>
            )}

            {view === 'form' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                    {selectedPreset ? `${selectedPreset} konfigurieren` : 'Neue Komponente'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                    Beschreibe deine Komponente und wähle die Optionen
                  </p>
                </div>
                <ComponentForm
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  projectPath={projectPath}
                  selectedPreset={selectedPreset}
                />
              </div>
            )}

            {view === 'preview' && lastGenerated && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                    Komponente generiert!
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                    {lastGenerated.path}
                  </p>
                </div>
                <ComponentPreview
                  component={lastGenerated}
                  onInsertToProject={projectPath ? handleInsertToProject : undefined}
                />
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => { setView('presets'); setSelectedPreset(null); }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'transparent',
                      color: 'rgb(156, 163, 175)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                  >
                    Weitere Komponente erstellen
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ComponentGeneratorPanel;
