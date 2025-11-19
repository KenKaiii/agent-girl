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
import { Rocket, Chrome, Layout, Package, HelpCircle, Bot, Puzzle, MessageSquare, Monitor, Zap, Smartphone, ShoppingBag, Blocks, Code2, Figma, Terminal, Palette, BookOpen, Database } from 'lucide-react';
import { PROJECT_TEMPLATES, type ProjectTemplate } from './buildConfig';

interface ProjectTypeSelectorProps {
  onSelect: (template: ProjectTemplate) => void;
}

// Simple Tooltip Component
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            backgroundColor: 'rgb(20, 22, 24)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px 16px',
            width: '420px',
            maxWidth: '90vw',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'rgb(229, 231, 235)',
            zIndex: 10000,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// Map template IDs to icons with consistent sizing
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  'nextjs': <Rocket style={{ width: '24px', height: '24px' }} />,
  'chrome-wxt': <Chrome style={{ width: '24px', height: '24px' }} />,
  'chrome-plasmo': <Chrome style={{ width: '24px', height: '24px' }} />,
  'vite-react': <Layout style={{ width: '24px', height: '24px' }} />,
  'mcp-server': <Puzzle style={{ width: '24px', height: '24px' }} />,
  'discord-bot': <Bot style={{ width: '24px', height: '24px' }} />,
  'slack-bot': <MessageSquare style={{ width: '24px', height: '24px' }} />,
  'tauri-desktop': <Monitor style={{ width: '24px', height: '24px' }} />,
  'backend-api': <Zap style={{ width: '24px', height: '24px' }} />,
  'expo-mobile': <Smartphone style={{ width: '24px', height: '24px' }} />,
  'shopify-app': <ShoppingBag style={{ width: '24px', height: '24px' }} />,
  'wordpress-plugin': <Blocks style={{ width: '24px', height: '24px' }} />,
  'vscode-extension': <Code2 style={{ width: '24px', height: '24px' }} />,
  'figma-plugin': <Figma style={{ width: '24px', height: '24px' }} />,
  'raycast-extension': <Terminal style={{ width: '24px', height: '24px' }} />,
  'adobe-uxp-plugin': <Palette style={{ width: '24px', height: '24px' }} />,
  'obsidian-plugin': <BookOpen style={{ width: '24px', height: '24px' }} />,
  'notion-integration': <Database style={{ width: '24px', height: '24px' }} />,
};

export function ProjectTypeSelector({ onSelect }: ProjectTypeSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '20px 32px',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px',
        }}>
          <Package style={{ width: '32px', height: '32px', color: 'rgba(255, 255, 255, 0.8)' }} />
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: 'white',
          marginBottom: '8px',
        }}>
          What would you like to build?
        </h2>
        <p style={{
          color: 'rgb(156, 163, 175)',
          fontSize: '14px',
        }}>
          Choose a project template to get started
        </p>
      </div>

      {/* Template Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '700px',
        }}
      >
        {PROJECT_TEMPLATES.map((template, index) => {
          const isHovered = hoveredTemplate === template.id;

          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
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
                  backgroundImage: template.gradient,
                  backgroundSize: '200% auto',
                  animation: isHovered ? 'shimmer 3s linear infinite' : 'none',
                }}
              >
                <div style={{ color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {TEMPLATE_ICONS[template.id]}
                </div>
              </div>

              {/* Template Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'white',
                }}>
                  {template.name}
                </h3>
                {template.tooltip && (
                  <Tooltip text={template.tooltip}>
                    <HelpCircle
                      style={{
                        width: '16px',
                        height: '16px',
                        color: 'rgb(107, 114, 128)',
                        cursor: 'help',
                        flexShrink: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                )}
              </div>

              {/* Description */}
              <p style={{
                color: 'rgb(156, 163, 175)',
                fontSize: '13px',
                lineHeight: '1.5',
              }}>
                {template.description}
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
                  {template.features.length} feature{template.features.length !== 1 ? 's' : ''}
                </span>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundImage: isHovered ? template.gradient : 'none',
                    backgroundColor: isHovered ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                    backgroundSize: '200% auto',
                    color: isHovered ? '#000000' : 'rgb(156, 163, 175)',
                    transition: 'all 0.3s',
                  }}
                >
                  Select
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'rgb(107, 114, 128)',
        textAlign: 'center',
        maxWidth: '448px',
      }}>
        Each template uses industry-standard tools and latest versions.
        <br />
        You&apos;ll customize features in the next step.
      </p>
    </div>
  );
}
