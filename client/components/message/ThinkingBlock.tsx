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

import React, { useState, memo } from 'react';

interface ThinkingBlockProps {
  title: string;
  content: string;
  defaultExpanded?: boolean;
}

export const ThinkingBlock = memo(function ThinkingBlock({ title, content, defaultExpanded = false }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="w-full border border-white/10 rounded-xl my-3 overflow-hidden">
      {/* Header */}
      <button
        className="flex justify-between px-4 py-2 w-full text-xs bg-[#0C0E10] border-b border-white/10"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          <div className="thinking-indicator">
            <div className="thinking-dot" />
          </div>
          <span className="text-sm font-medium leading-6 text-gradient">{title}</span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <div
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </div>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-black/30 text-sm">
          <div className="text-sm leading-5 text-white/90 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </div>
  );
});
