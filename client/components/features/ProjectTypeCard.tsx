/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import type { ProjectType } from './projectTypes';

interface ProjectTypeCardProps {
  type: ProjectType;
  isHovered: boolean;
  index: number;
  onSelect: (typeId: string) => void;
  onHover: (typeId: string | null) => void;
}

export function ProjectTypeCard({ type, isHovered, index, onSelect, onHover }: ProjectTypeCardProps) {
  const Icon = type.icon;

  return (
    <button
      onClick={() => onSelect(type.id)}
      onMouseEnter={() => onHover(type.id)}
      onMouseLeave={() => onHover(null)}
      className="promptCard waterfall"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        borderRadius: '10px',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        textAlign: 'left',
        animationDelay: `${index * 80}ms`,
        backgroundColor: 'rgb(38, 40, 42)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 8px 24px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 300ms',
        position: 'relative',
        zIndex: isHovered ? 10001 : 1,
      }}
    >
      {/* Icon with gradient background */}
      <div
        style={{
          marginBottom: '10px',
          padding: '8px',
          borderRadius: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'fit-content',
          backgroundImage: type.gradient,
          backgroundSize: '200% auto',
          ...(isHovered ? {
            animationName: 'shimmer',
            animationDuration: '3s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          } : {}),
        }}
      >
        <div style={{ color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: '20px', height: '20px' }} />
        </div>
      </div>

      {/* Template Name */}
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'white',
        marginBottom: '4px',
      }}>
        {type.name}
      </h3>

      {/* Description */}
      <p style={{
        color: 'rgb(156, 163, 175)',
        fontSize: '13px',
        lineHeight: '1.5',
      }}>
        {type.description}
      </p>

      {/* Feature Count Badge */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '11px',
          color: 'rgb(107, 114, 128)',
        }}>
          {type.featureCount} feature{type.featureCount !== 1 ? 's' : ''}
        </span>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            padding: '3px 10px',
            borderRadius: '9999px',
            ...(isHovered ? {
              backgroundImage: type.gradient,
              backgroundSize: '200% auto',
            } : {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }),
            color: isHovered ? '#000000' : 'rgb(156, 163, 175)',
            transition: 'all 0.3s',
          }}
        >
          Select
        </div>
      </div>
    </button>
  );
}
