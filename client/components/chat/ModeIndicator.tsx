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

import React, { useRef, useEffect, useState } from 'react';
import { MessageCircle, Code, Target, Zap, ChevronDown } from 'lucide-react';

interface ModeIndicatorProps {
  mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified';
  onWidthChange?: (width: number) => void;
  onModeChange?: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified') => void;
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
    name: 'Intense Research',
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
};

const MODES_ARRAY: Array<'general' | 'coder' | 'intense-research' | 'spark' | 'unified'> = [
  'general',
  'coder',
  'intense-research',
  'spark',
  // Note: 'unified' is intentionally not shown in selector - it's an internal mode
];

export function ModeIndicator({ mode, onWidthChange, onModeChange }: ModeIndicatorProps) {
  const config = MODE_CONFIGS[mode];
  const Icon = config.icon;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (buttonRef.current && onWidthChange) {
      const width = buttonRef.current.offsetWidth;
      onWidthChange(width + 8);
    }
  }, [mode, onWidthChange]);

  const handleModeSelect = (selectedMode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified') => {
    setIsOpen(false);
    if (onModeChange && selectedMode !== mode) {
      onModeChange(selectedMode);
    }
  };

  return (
    <div className="absolute py-2 select-none" style={{ zIndex: 100 }}>
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
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>
            <Icon className="size-4" strokeWidth={1.5} />
          </span>
          <span className="font-medium">{config.name}</span>
          <ChevronDown className="size-3.5 ml-0.5" strokeWidth={2} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-1 rounded-lg shadow-2xl" style={{ minWidth: '200px', backdropFilter: 'blur(8px)', zIndex: 9999, backgroundColor: 'rgba(31, 41, 55, 0.95)' }}>
            {MODES_ARRAY.map((modeOption) => {
              const modeConfig = MODE_CONFIGS[modeOption];
              const ModeIcon = modeConfig.icon;
              const isSelected = modeOption === mode;

              return (
                <button
                  key={modeOption}
                  onClick={() => handleModeSelect(modeOption)}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-sm transition-all hover:brightness-110"
                  style={{
                    backgroundImage: isSelected ? modeConfig.gradient : 'linear-gradient(90deg, rgba(100, 100, 100, 0.3) 0%, rgba(100, 100, 100, 0.2) 100%)',
                    backgroundSize: '200% auto',
                    color: modeConfig.textColor,
                    border: 'none',
                    cursor: 'pointer',
                    borderLeft: isSelected ? '3px solid rgba(255, 255, 255, 0.5)' : 'none',
                    paddingLeft: isSelected ? 'calc(1rem - 3px)' : '1rem',
                  }}
                >
                  <ModeIcon className="size-4" strokeWidth={1.5} />
                  <span className="font-medium flex-1 text-left">{modeConfig.name}</span>
                  {isSelected && (
                    <span className="text-xs font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
