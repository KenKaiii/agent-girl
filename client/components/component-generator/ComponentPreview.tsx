/**
 * Component Preview
 * Displays generated component code with copy functionality.
 */

import React, { useState } from 'react';
import { Copy, Check, Code, FileCode, TestTube, BookOpen, Download, FolderPlus } from 'lucide-react';
import type { GeneratedComponent } from '../../hooks/useComponents';

interface ComponentPreviewProps {
  component: GeneratedComponent;
  onInsertToProject?: (component: GeneratedComponent) => void;
}

type Tab = 'code' | 'tests' | 'stories';

export function ComponentPreview({ component, onInsertToProject }: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('code');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = activeTab === 'code'
      ? component.code
      : activeTab === 'tests'
        ? component.tests || ''
        : component.stories || '';

    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = component.code;
    const filename = component.path.split('/').pop() || 'component.tsx';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; available: boolean }[] = [
    { id: 'code', label: 'Code', icon: Code, available: true },
    { id: 'tests', label: 'Tests', icon: TestTube, available: !!component.tests },
    { id: 'stories', label: 'Story', icon: BookOpen, available: !!component.stories },
  ];

  const getContent = () => {
    switch (activeTab) {
      case 'tests':
        return component.tests || '';
      case 'stories':
        return component.stories || '';
      default:
        return component.code;
    }
  };

  return (
    <div style={{
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgb(30, 32, 34)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgb(38, 40, 42)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileCode style={{ width: '18px', height: '18px', color: 'rgb(168, 199, 250)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
            {component.name}
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(168, 199, 250, 0.15)',
            color: 'rgb(168, 199, 250)',
          }}>
            .tsx
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: copied ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            {copied ? (
              <>
                <Check style={{ width: '14px', height: '14px' }} />
                Kopiert!
              </>
            ) : (
              <>
                <Copy style={{ width: '14px', height: '14px' }} />
                Kopieren
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgb(156, 163, 175)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            Download
          </button>

          {onInsertToProject && (
            <button
              onClick={() => onInsertToProject(component)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgb(168, 199, 250)',
                color: 'rgb(20, 22, 24)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              <FolderPlus style={{ width: '14px', height: '14px' }} />
              In Projekt einfügen
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgb(26, 28, 30)',
      }}>
        {tabs.filter(t => t.available).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgb(107, 114, 128)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Props Summary */}
      {activeTab === 'code' && component.props.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: 'rgb(26, 28, 30)',
        }}>
          <div style={{ fontSize: '11px', color: 'rgb(107, 114, 128)', marginBottom: '8px' }}>
            PROPS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {component.props.map((prop) => (
              <span
                key={prop.name}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgb(156, 163, 175)',
                  fontFamily: 'monospace',
                }}
              >
                {prop.name}
                {prop.required && <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>}
                <span style={{ color: 'rgb(107, 114, 128)' }}>: {prop.type}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Code Block */}
      <div style={{
        maxHeight: '400px',
        overflow: 'auto',
        padding: '16px',
      }}>
        <pre style={{
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '12px',
          lineHeight: 1.6,
          color: 'rgb(209, 213, 219)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {getContent()}
        </pre>
      </div>
    </div>
  );
}

export default ComponentPreview;
