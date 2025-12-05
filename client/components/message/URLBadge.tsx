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

import React, { memo } from 'react';
import { formatUrlForBadge } from '../../utils/urlFormatter';

interface URLBadgeProps {
  href: string;
  children?: React.ReactNode;
}

/**
 * URL badge component that displays URLs as compact, styled badges.
 * - Always shows full domain
 * - Truncates path to fit within 20 characters total
 * - Font size is 2px smaller than body text (14px vs 16px)
 */
export const URLBadge = memo(function URLBadge({ href, children }: URLBadgeProps) {
  const displayText = children ? String(children) : formatUrlForBadge(href);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md border transition-all no-underline"
      style={{
        fontSize: '14px', // 2px smaller than body text (16px)
        fontFamily: 'var(--font-sans)',
        backgroundColor: 'rgba(218, 238, 255, 0.1)',
        borderColor: 'rgba(218, 238, 255, 0.2)',
        color: 'rgb(218, 238, 255)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(218, 238, 255, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(218, 238, 255, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(218, 238, 255, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(218, 238, 255, 0.2)';
      }}
    >
      {/* Link icon */}
      <svg
        className="flex-shrink-0"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span>{displayText}</span>
    </a>
  );
});
