/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';

interface AutonomToggleProps {
  isActive: boolean;
  onToggle: () => void;
  isCompact?: boolean;
}

export function AutonomToggle({ isActive, onToggle, isCompact = false }: AutonomToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`${isActive ? 'autonom-active' : 'btn-icon'} rounded-lg`}
      title={isActive ? 'AUTONOM Active - 100 Steps Autonomous' : 'Activate AUTONOM Mode'}
      type="button"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: isCompact ? '0.375rem 0.5rem' : '0.375rem 0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: isActive
          ? 'linear-gradient(135deg, #ff6b35, #f72585, #7209b7)'
          : 'transparent',
        backgroundSize: isActive ? '200% 200%' : '100% 100%',
        animation: isActive ? 'autonom-gradient 2s ease infinite' : 'none',
        boxShadow: isActive
          ? '0 0 12px rgba(247, 37, 133, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.1)'
          : 'none',
        color: isActive ? '#fff' : 'inherit',
      }}
    >
      {/* Mushroom emoji */}
      <span
        style={{
          fontSize: isCompact ? '0.875rem' : '1rem',
          filter: isActive ? 'drop-shadow(0 0 4px rgba(255, 107, 53, 0.8))' : 'none',
          animation: isActive ? 'autonom-bounce 1s ease-in-out infinite' : 'none',
        }}
      >
        🍄
      </span>

      {/* Text */}
      <span
        style={{
          textShadow: isActive ? '0 0 6px rgba(255, 255, 255, 0.6)' : 'none',
        }}
      >
        {isCompact ? 'Auto' : 'AUTONOM'}
      </span>

      {/* Robot emoji */}
      <span
        style={{
          fontSize: isCompact ? '0.875rem' : '1rem',
          filter: isActive ? 'drop-shadow(0 0 4px rgba(114, 9, 183, 0.8))' : 'none',
          animation: isActive ? 'autonom-bounce 1s ease-in-out infinite 0.3s' : 'none',
        }}
      >
        🤖
      </span>

      {/* Power indicator dot when active */}
      {isActive && (
        <span
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 6px #00ff88',
            animation: 'autonom-blink 1s ease-in-out infinite',
          }}
        />
      )}

      <style>{`
        @keyframes autonom-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes autonom-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @keyframes autonom-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .autonom-active {
          background: linear-gradient(135deg, #ff6b35, #f72585, #7209b7) !important;
        }

        .autonom-active:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }
      `}</style>
    </button>
  );
}
