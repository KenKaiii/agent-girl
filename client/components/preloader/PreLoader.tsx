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

import React, { useEffect, useState } from 'react';

interface PreLoaderProps {
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds (default: 2000ms)
}

export function PreLoader({ onComplete, duration = 300 }: PreLoaderProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Give time for fade-out animation before calling onComplete
      setTimeout(() => {
        onComplete?.();
      }, 100);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={`preloader-container ${isFadingOut ? 'preloader-fade-out' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgb(20, 22, 24)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        margin: 0,
        padding: 0,
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.1s ease-in-out',
        willChange: 'opacity',
      }}
    >
      <div className="preloader-content" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img
          src="/client/agent-boy.svg"
          alt="Agent Girl"
          className="preloader-icon"
          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
          loading="eager"
        />
        <div className="preloader-text text-gradient" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '2.5rem', fontWeight: 500 }}>
          Agent Girl
        </div>
      </div>
    </div>
  );
}
