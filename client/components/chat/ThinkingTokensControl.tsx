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
import { Brain, Check } from 'lucide-react';

interface ThinkingTokensControlProps {
  currentValue: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const PRESET_OPTIONS = [
  { value: 0, label: 'Off', shortLabel: 'Off' },
  { value: 5000, label: 'Light Thinking', shortLabel: '5K' },
  { value: 10000, label: 'Standard Thinking', shortLabel: '10K' },
  { value: 20000, label: 'Deep Thinking', shortLabel: '20K' },
  { value: 30000, label: 'Maximum Thinking', shortLabel: '30K' },
];

export function ThinkingTokensControl({ currentValue, onChange, disabled }: ThinkingTokensControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Find current preset or show custom
  const currentPreset = PRESET_OPTIONS.find(opt => opt.value === currentValue);
  const buttonLabel = currentPreset ? currentPreset.label : `${currentValue / 1000}K Tokens`;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`btn-icon rounded-lg flex items-center gap-1.5 px-2 ${isOpen ? 'bg-gray-700' : ''}`}
        title={`Extended Thinking: ${buttonLabel}`}
        type="button"
      >
        <Brain size={18} />
        <span className="text-xs font-medium text-gray-300">{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: '100%',
            marginBottom: '0.5rem',
            background: 'rgb(var(--bg-input))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            width: '16rem',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ padding: '1rem 1.25rem 0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            Extended Thinking
          </div>
          <div style={{ padding: '0 0.75rem 0.75rem' }}>
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  marginBottom: '0.25rem',
                  background: currentValue === option.value ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'background 0.075s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (currentValue !== option.value) {
                    e.currentTarget.style.background = 'rgba(244, 246, 248, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentValue !== option.value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    className="font-medium"
                    style={{
                      color: 'rgb(var(--text-primary))',
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                    }}
                  >
                    {option.label}
                  </div>
                </div>
                {currentValue === option.value && (
                  <div style={{ paddingRight: '0.5rem' }}>
                    <Check size={16} strokeWidth={1.5} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
