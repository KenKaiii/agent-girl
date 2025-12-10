/**
 * Developer Tools Panel
 *
 * Unified panel containing Git and Deploy functionality.
 * Can be toggled from the main UI for quick access to dev workflows.
 */

import React, { useState, useCallback } from 'react';
import {
  GitBranch,
  Rocket,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { GitPanel } from '../git/GitPanel';
import { DeployPanel } from '../deploy/DeployPanel';

type DevToolsTab = 'git' | 'deploy';

interface DevToolsPanelProps {
  projectPath: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: DevToolsTab;
}

export function DevToolsPanel({
  projectPath,
  isOpen,
  onClose,
  defaultTab = 'git',
}: DevToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<DevToolsTab>(defaultTab);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleTabChange = useCallback((tab: DevToolsTab) => {
    setActiveTab(tab);
    if (isMinimized) {
      setIsMinimized(false);
    }
  }, [isMinimized]);

  if (!isOpen) return null;

  return (
    <div
      className="devtools-panel"
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        width: isMinimized ? '200px' : '380px',
        maxHeight: isMinimized ? '48px' : 'calc(100vh - 8rem)',
        backgroundColor: 'rgb(var(--bg-secondary, 17 19 21))',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => handleTabChange('git')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'git'
                ? 'rgba(59, 130, 246, 0.2)'
                : 'transparent',
              color: activeTab === 'git'
                ? '#3b82f6'
                : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            <GitBranch size={14} />
            <span>Git</span>
          </button>
          <button
            onClick={() => handleTabChange('deploy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'deploy'
                ? 'rgba(168, 85, 247, 0.2)'
                : 'transparent',
              color: activeTab === 'deploy'
                ? '#a855f7'
                : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            <Rocket size={14} />
            <span>Deploy</span>
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              padding: '0.375rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.375rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {activeTab === 'git' && (
            <GitPanel projectPath={projectPath} />
          )}
          {activeTab === 'deploy' && (
            <DeployPanel projectPath={projectPath} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Floating DevTools Toggle Button
 *
 * Fixed button to open the DevTools panel.
 */
interface DevToolsToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  hasChanges?: boolean;
}

export function DevToolsToggle({
  isOpen,
  onToggle,
  hasChanges = false,
}: DevToolsToggleProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
        zIndex: 999,
        transition: 'all 0.2s',
      }}
      title="Open DevTools (Git & Deploy)"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Settings size={22} />
      {hasChanges && (
        <span
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '12px',
            height: '12px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            border: '2px solid rgb(var(--bg-primary, 12 14 16))',
          }}
        />
      )}
    </button>
  );
}

export default DevToolsPanel;
