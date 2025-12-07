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

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Shield, Rocket } from 'lucide-react';

type PermissionMode = 'bypassPermissions' | 'plan' | 'autonom';

interface PermissionModeToggleProps {
  selectedMode: PermissionMode;
  onModeChange: (mode: PermissionMode) => void;
}

const MODES = [
  {
    id: 'bypassPermissions' as const,
    name: 'Auto Mode',
    icon: Zap,
    description: 'Executes immediately without confirmation',
  },
  {
    id: 'plan' as const,
    name: 'Plan Mode',
    icon: Shield,
    description: 'Review changes before execution',
  },
  {
    id: 'autonom' as const,
    name: 'Autonom Mode',
    icon: Rocket,
    description: '100-step autonomous execution, no questions',
  },
];

export function PermissionModeToggle({ selectedMode, onModeChange }: PermissionModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentMode = MODES.find(m => m.id === selectedMode) || MODES[0];
  const CurrentIcon = currentMode.icon;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleModeSelect = (modeId: PermissionMode) => {
    onModeChange(modeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/5"
        style={{ color: 'rgb(var(--text-primary))' }}
      >
        <CurrentIcon size={16} />
        <span className="font-heading text-sm">{currentMode.name}</span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: '0.5rem',
            background: 'rgb(var(--bg-input))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            width: '20rem',
            maxWidth: 'calc(100vw - 1rem)',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ padding: '1rem 1.75rem 0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            Permission Mode
          </div>
          <div style={{ padding: '0 1rem 1rem' }}>
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    marginBottom: '0.25rem',
                    background: selectedMode === mode.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background 0.075s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedMode !== mode.id) {
                      e.currentTarget.style.background = 'rgba(244, 246, 248, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMode !== mode.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={20} style={{ color: 'rgb(var(--text-secondary))' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div
                      className="font-medium"
                      style={{
                        color: 'rgb(var(--text-primary))',
                        fontSize: '0.875rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {mode.name}
                    </div>
                    <div
                      style={{
                        color: 'rgb(var(--text-secondary))',
                        fontSize: '0.75rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {mode.description}
                    </div>
                  </div>
                  {selectedMode === mode.id && (
                    <div style={{ paddingRight: '0.5rem' }}>
                      <Check size={16} strokeWidth={1.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
