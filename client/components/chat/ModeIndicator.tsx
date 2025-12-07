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

import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Code, Target, Zap, ChevronDown } from 'lucide-react';

interface ModeIndicatorProps {
  mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build';
  onWidthChange?: (width: number) => void;
  onModeChange?: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => void;
}

const MODE_CONFIGS = {
  general: {
    name: 'General',
    icon: MessageCircle,
    gradient: 'linear-gradient(90deg, #A8FAC7 0%, #DAFFEE 25%, #ffffff 50%, #DAFFEE 75%, #A8FAC7 100%)',
    textColor: '#000000',
  },
  coder: {
    name: 'Coder',
    icon: Code,
    gradient: 'linear-gradient(90deg, #FAC7A8 0%, #FFDAAE 25%, #ffffff 50%, #FFDAAE 75%, #FAC7A8 100%)',
    textColor: '#000000',
  },
  'intense-research': {
    name: 'Research',
    icon: Target,
    gradient: 'linear-gradient(90deg, #C7A8FA 0%, #DAAEEE 25%, #ffffff 50%, #DAAEEE 75%, #C7A8FA 100%)',
    textColor: '#000000',
  },
  'spark': {
    name: 'Spark',
    icon: Zap,
    gradient: 'linear-gradient(90deg, #FAE9A8 0%, #FFF4DA 25%, #ffffff 50%, #FFF4DA 75%, #FAE9A8 100%)',
    textColor: '#000000',
  },
  'unified': {
    name: 'Unified',
    icon: Target,
    gradient: 'linear-gradient(90deg, #A8C7FA 0%, #DAEFFF 25%, #ffffff 50%, #DAEFFF 75%, #A8C7FA 100%)',
    textColor: '#000000',
  },
  'build': {
    name: 'Build',
    icon: Code,
    gradient: 'linear-gradient(90deg, #A8FAE4 0%, #DAFFF2 25%, #ffffff 50%, #DAFFF2 75%, #A8FAE4 100%)',
    textColor: '#000000',
  },
};

const MODES_ARRAY: Array<'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build'> = [
  'general',
  'coder',
  'intense-research',
  'spark',
  'build',
  // Note: 'unified' is intentionally not shown - it's an internal mode
];

export const ModeIndicator = memo(function ModeIndicator({ mode, onWidthChange, onModeChange }: ModeIndicatorProps) {
  const config = MODE_CONFIGS[mode];
  const Icon = config.icon;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (buttonRef.current && onWidthChange) {
      const width = buttonRef.current.offsetWidth;
      onWidthChange(width + 8);
    }
  }, [mode, onWidthChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleModeSelect = useCallback((selectedMode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => {
    setIsOpen(false);
    if (onModeChange && selectedMode !== mode) {
      onModeChange(selectedMode);
    }
  }, [mode, onModeChange]);

  const handleToggle = useCallback(() => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  }, [isOpen]);

  return (
    <div className="relative select-none">
      <div className="relative">
        {/* Main Mode Button */}
        <button
          ref={buttonRef}
          className="flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-lg transition-all hover:brightness-110"
          style={{
            backgroundImage: config.gradient,
            backgroundSize: '200% auto',
            animationName: 'shimmer',
            animationDuration: '3s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            color: config.textColor,
            border: 'none',
            cursor: 'pointer',
          }}
          type="button"
          onClick={handleToggle}
        >
          <span>
            <Icon className="size-4" strokeWidth={1.5} />
          </span>
          <span className="font-medium">{config.name}</span>
          <ChevronDown className="size-3.5 ml-0.5" strokeWidth={2} />
        </button>

        {/* Dropdown Menu - Rendered via Portal for proper z-index */}
        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            className="fixed rounded-lg shadow-2xl overflow-hidden"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              minWidth: '180px',
              backdropFilter: 'blur(12px)',
              zIndex: 99999,
              backgroundColor: 'rgba(20, 20, 24, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {MODES_ARRAY.map((modeOption) => {
              const modeConfig = MODE_CONFIGS[modeOption];
              const ModeIcon = modeConfig.icon;
              const isSelected = modeOption === mode;

              return (
                <button
                  key={modeOption}
                  onClick={() => handleModeSelect(modeOption)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-sm transition-all"
                  style={{
                    backgroundImage: isSelected ? modeConfig.gradient : 'none',
                    backgroundColor: isSelected ? undefined : 'transparent',
                    backgroundSize: '200% auto',
                    color: isSelected ? modeConfig.textColor : 'rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <ModeIcon className="size-4" strokeWidth={1.5} />
                  <span className="font-medium flex-1 text-left">{modeConfig.name}</span>
                  {isSelected && (
                    <span className="text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
});
