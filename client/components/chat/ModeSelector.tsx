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

import React, { useState } from 'react';
import { MessageCircle, Code, Target, Zap, Hammer } from 'lucide-react';

interface ModeOption {
  id: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build';
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  isBuildMode?: boolean;
}

const MODES: ModeOption[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Chat & quick research',
    icon: <MessageCircle className="size-4" />,
    gradient: 'linear-gradient(90deg, #A8FAC7 0%, #DAFFEE 25%, #ffffff 50%, #DAFFEE 75%, #A8FAC7 100%)',
  },
  {
    id: 'coder',
    name: 'Coder',
    description: 'Build & debug apps',
    icon: <Code className="size-4" />,
    gradient: 'linear-gradient(90deg, #FAC7A8 0%, #FFDAAE 25%, #ffffff 50%, #FFDAAE 75%, #FAC7A8 100%)',
  },
  {
    id: 'intense-research',
    name: 'Research',
    description: '5 agents deep research',
    icon: <Target className="size-4" />,
    gradient: 'linear-gradient(90deg, #C7A8FA 0%, #DAAEEE 25%, #ffffff 50%, #DAAEEE 75%, #C7A8FA 100%)',
  },
  {
    id: 'spark',
    name: 'Spark',
    description: 'Brainstorm ideas interactively',
    icon: <Zap className="size-4" />,
    gradient: 'linear-gradient(90deg, #FAE9A8 0%, #FFF4DA 25%, #ffffff 50%, #FFF4DA 75%, #FAE9A8 100%)',
  },
  {
    id: 'build',
    name: 'Build',
    description: 'Create projects with guided setup',
    icon: <Hammer className="size-4" />,
    gradient: 'linear-gradient(90deg, #FFC7A8 0%, #FFE4DA 25%, #ffffff 50%, #FFE4DA 75%, #FFC7A8 100%)',
    isBuildMode: true,
  },
];

interface ModeSelectorProps {
  selectedMode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified';
  onSelectMode: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified') => void;
  onOpenBuildWizard?: () => void;
}

export function ModeSelector({ selectedMode, onSelectMode, onOpenBuildWizard }: ModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (modeId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8, // 8px above button
    });
    setHoveredMode(modeId);
  };

  const handleModeClick = (mode: ModeOption) => {
    if (mode.isBuildMode) {
      onOpenBuildWizard?.();
    } else {
      onSelectMode(mode.id as 'general' | 'coder' | 'intense-research' | 'spark' | 'unified');
    }
  };

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-none flex flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base pb-1" style={{ flexWrap: 'nowrap' }}>
        {MODES.map((mode, index) => {
          const isSelected = selectedMode === mode.id && !mode.isBuildMode;
          return (
            <button
              key={mode.id}
              onClick={() => handleModeClick(mode)}
              onMouseEnter={(e) => handleMouseEnter(mode.id, e)}
              onMouseLeave={() => setHoveredMode(null)}
              className={`promptCard waterfall flex flex-col shrink-0 px-2 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-md sm:rounded-lg group items-center justify-center text-center ${
                isSelected
                  ? 'border-none'
                  : 'border-b-2 border-white/10 hover:border-white/20 text-white/90 hover:text-white transition'
              }`}
              style={{
              ...(isSelected ? {
                backgroundImage: mode.gradient,
                backgroundSize: '200% auto',
                animationName: 'shimmer',
                animationDuration: '3s',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationDelay: `${index * 60}ms`,
                opacity: 1,
              } : {
                backgroundColor: 'rgb(38, 40, 42)', // #26282A
                animationName: 'waterfall',
                animationDuration: '0.3s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'forwards',
                animationDelay: `${index * 60}ms`,
              }),
            }}
          >
            <div className="flex gap-1.5 sm:gap-2 md:gap-3 justify-between items-center w-full h-5 sm:h-6 md:h-7"
                 style={isSelected ? { color: '#000000' } : {}}>
              <div className="flex flex-row flex-1 gap-1.5 sm:gap-2 md:gap-3 items-center min-w-0 transition">
                <div className="flex justify-center items-center [&>svg]:size-3 sm:[&>svg]:size-3.5 md:[&>svg]:size-4">
                  {mode.icon}
                </div>
                <div className="truncate font-medium">{mode.name}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>

    {/* Tooltip portal (positioned fixed to viewport, not clipped by parent) */}
    {hoveredMode && (
      <div
        className="fixed px-3 py-1.5 bg-white text-black text-xs font-medium rounded-md border border-gray-200 shadow-lg whitespace-nowrap z-[9999] pointer-events-none"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          transform: 'translate(-50%, -100%)',
          animation: 'fadeIn 100ms ease-out',
        }}
      >
        {MODES.find(m => m.id === hoveredMode)?.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45" />
      </div>
    )}
    </>
  );
}
