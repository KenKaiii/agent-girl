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
import { createPortal } from 'react-dom';
import { X, Type, Palette, Sparkles } from 'lucide-react';

interface StyleConfigModalProps {
  onComplete: (prompt: string) => void;
  onClose: () => void;
}

// Curated professional font pairings with Google Fonts
const FONT_PAIRINGS = [
  {
    id: 'inter-inter',
    name: 'Inter',
    heading: 'Inter',
    headingWeight: '600',
    body: 'Inter',
    bodyWeight: '400',
    googleFonts: 'Inter:wght@400;500;600;700',
    description: 'Modern, clean, versatile - perfect for SaaS and web apps',
    category: 'Modern Sans',
  },
  {
    id: 'playfair-source',
    name: 'Playfair + Source Sans',
    heading: 'Playfair Display',
    headingWeight: '700',
    body: 'Source Sans 3',
    bodyWeight: '400',
    googleFonts: 'Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600',
    description: 'Elegant serif + clean sans - great for editorial and content',
    category: 'Elegant Serif',
  },
  {
    id: 'montserrat-open',
    name: 'Montserrat + Open Sans',
    heading: 'Montserrat',
    headingWeight: '700',
    body: 'Open Sans',
    bodyWeight: '400',
    googleFonts: 'Montserrat:wght@700&family=Open+Sans:wght@400;600',
    description: 'Bold geometric + friendly sans - ideal for marketing sites',
    category: 'Bold Geometric',
  },
  {
    id: 'space-mono',
    name: 'Space Grotesk + Space Mono',
    heading: 'Space Grotesk',
    headingWeight: '700',
    body: 'Space Mono',
    bodyWeight: '400',
    googleFonts: 'Space+Grotesk:wght@700&family=Space+Mono:wght@400',
    description: 'Tech-forward geometric + monospace - perfect for dev tools',
    category: 'Technical',
  },
  {
    id: 'manrope-inter',
    name: 'Manrope + Inter',
    heading: 'Manrope',
    headingWeight: '700',
    body: 'Inter',
    bodyWeight: '400',
    googleFonts: 'Manrope:wght@700&family=Inter:wght@400;600',
    description: 'Rounded friendly + neutral - great for dashboards',
    category: 'Friendly Rounded',
  },
  {
    id: 'poppins-poppins',
    name: 'Poppins',
    heading: 'Poppins',
    headingWeight: '700',
    body: 'Poppins',
    bodyWeight: '400',
    googleFonts: 'Poppins:wght@400;600;700',
    description: 'Geometric sans with friendly circles - great for modern brands',
    category: 'Modern Geometric',
  },
  {
    id: 'lora-nunito',
    name: 'Lora + Nunito',
    heading: 'Lora',
    headingWeight: '700',
    body: 'Nunito',
    bodyWeight: '400',
    googleFonts: 'Lora:wght@700&family=Nunito:wght@400;600',
    description: 'Calligraphic serif + rounded sans - warm and approachable',
    category: 'Warm & Approachable',
  },
  {
    id: 'raleway-lato',
    name: 'Raleway + Lato',
    heading: 'Raleway',
    headingWeight: '700',
    body: 'Lato',
    bodyWeight: '400',
    googleFonts: 'Raleway:wght@700&family=Lato:wght@400;700',
    description: 'Elegant thin sans + neutral sans - clean and professional',
    category: 'Clean Professional',
  },
  {
    id: 'merriweather-opensans',
    name: 'Merriweather + Open Sans',
    heading: 'Merriweather',
    headingWeight: '700',
    body: 'Open Sans',
    bodyWeight: '400',
    googleFonts: 'Merriweather:wght@700&family=Open+Sans:wght@400;600',
    description: 'Traditional serif + friendly sans - classic and readable',
    category: 'Classic Serif',
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    heading: 'DM Sans',
    headingWeight: '700',
    body: 'DM Sans',
    bodyWeight: '400',
    googleFonts: 'DM+Sans:wght@400;500;700',
    description: 'Low contrast geometric - excellent for UI and readability',
    category: 'UI Optimized',
  },
  {
    id: 'bitter-raleway',
    name: 'Bitter + Raleway',
    heading: 'Bitter',
    headingWeight: '700',
    body: 'Raleway',
    bodyWeight: '400',
    googleFonts: 'Bitter:wght@700&family=Raleway:wght@400;600',
    description: 'Contemporary slab serif + elegant sans - strong and refined',
    category: 'Contemporary',
  },
  {
    id: 'archivo-roboto',
    name: 'Archivo + Roboto',
    heading: 'Archivo',
    headingWeight: '700',
    body: 'Roboto',
    bodyWeight: '400',
    googleFonts: 'Archivo:wght@700&family=Roboto:wght@400;500',
    description: 'Grotesque sans + neutral sans - versatile and balanced',
    category: 'Versatile Neutral',
  },
];

// Curated professional color palettes
const COLOR_PALETTES = [
  {
    id: 'monochrome',
    name: 'Pure Monochrome',
    primary: '#000000',
    secondary: '#404040',
    accent: '#666666',
    background: '#ffffff',
    surface: '#f5f5f5',
    description: 'Classic black & white - timeless elegance and sophistication',
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    primary: '#1e3a8a',
    secondary: '#334155',
    accent: '#3b82f6',
    background: '#ffffff',
    surface: '#f8fafc',
    description: 'Deep sophisticated blue - premium feel for professional apps',
  },
  {
    id: 'blue-slate',
    name: 'Blue Slate',
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#0ea5e9',
    background: '#ffffff',
    surface: '#f8fafc',
    description: 'Professional blue with neutral grays - versatile for all apps',
  },
  {
    id: 'crimson-rose',
    name: 'Crimson Rose',
    primary: '#dc2626',
    secondary: '#be123c',
    accent: '#fb7185',
    background: '#ffffff',
    surface: '#fef2f2',
    description: 'Bold modern red - confident and energetic for standout apps',
  },
  {
    id: 'forest-earth',
    name: 'Forest Earth',
    primary: '#166534',
    secondary: '#4d7c0f',
    accent: '#22c55e',
    background: '#ffffff',
    surface: '#f0fdf4',
    description: 'Natural green tones - organic feel for eco and outdoor apps',
  },
  {
    id: 'lunar-grey',
    name: 'Lunar Grey',
    primary: '#52525b',
    secondary: '#71717a',
    accent: '#a1a1aa',
    background: '#ffffff',
    surface: '#fafafa',
    description: 'Professional moonlit greys - sleek and modern for finance & tech',
  },
  {
    id: 'coral-sunset',
    name: 'Coral Sunset',
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#fb923c',
    background: '#ffffff',
    surface: '#fff7ed',
    description: 'Retro-futuristic warm tones - energetic and inviting',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    primary: '#7c3aed',
    secondary: '#6366f1',
    accent: '#a78bfa',
    background: '#ffffff',
    surface: '#f5f3ff',
    description: 'Bold luxury purple - sophisticated for premium products',
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    primary: '#0891b2',
    secondary: '#06b6d4',
    accent: '#22d3ee',
    background: '#ffffff',
    surface: '#ecfeff',
    description: 'Cool sophisticated cyan - crisp and professional for SaaS',
  },
  {
    id: 'sage-olive',
    name: 'Sage Olive',
    primary: '#84cc16',
    secondary: '#65a30d',
    accent: '#a3e635',
    background: '#ffffff',
    surface: '#f7fee7',
    description: 'Muted natural green - calming for wellness and lifestyle apps',
  },
  {
    id: 'carbon-graphite',
    name: 'Carbon Graphite',
    primary: '#18181b',
    secondary: '#3f3f46',
    accent: '#71717a',
    background: '#fafafa',
    surface: '#f4f4f5',
    description: 'Premium dark neutral - sleek minimalist for luxury brands',
  },
  {
    id: 'dark-slate',
    name: 'Dark Slate',
    primary: '#60a5fa',
    secondary: '#94a3b8',
    accent: '#38bdf8',
    background: '#0f172a',
    surface: '#1e293b',
    description: 'Dark mode optimized - modern dark theme with blue accents',
  },
];

// Comprehensive animation system with multiple categories
const ANIMATION_CATEGORIES = {
  hover: 'Button & Hover',
  entrance: 'Entrance',
  loading: 'Loading',
  feedback: 'Feedback',
  transition: 'Page Transition',
  micro: 'Micro-interaction',
};

const ANIMATION_PRESETS = [
  // BUTTON & HOVER ANIMATIONS
  {
    id: 'subtle-hover',
    name: 'Subtle Lift',
    duration: '150ms',
    easing: 'ease-out',
    category: 'hover',
    preview: 'hover',
    description: 'Minimal 1px lift - professional and understated',
    specs: {
      hover: 'translateY(-1px)',
      shadow: '0 2px 8px rgba(0,0,0,0.1)',
      active: 'translateY(0px)',
    },
  },
  {
    id: 'modern-hover',
    name: 'Modern Scale',
    duration: '250ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    category: 'hover',
    preview: 'hover',
    description: 'Smooth lift + scale - modern SaaS feel',
    specs: {
      hover: 'translateY(-2px) scale(1.02)',
      shadow: '0 4px 12px rgba(0,0,0,0.15)',
      active: 'translateY(0px) scale(0.98)',
    },
  },
  {
    id: 'playful-hover',
    name: 'Spring Bounce',
    duration: '400ms',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    category: 'hover',
    preview: 'hover',
    description: 'Elastic bounce - playful and energetic',
    specs: {
      hover: 'scale(1.05)',
      shadow: '0 6px 16px rgba(0,0,0,0.2)',
      active: 'scale(0.95)',
    },
  },

  // ENTRANCE ANIMATIONS
  {
    id: 'fade-in',
    name: 'Fade In',
    duration: '400ms',
    easing: 'ease-out',
    category: 'entrance',
    preview: 'entrance',
    description: 'Simple opacity fade - clean and classic',
    specs: {
      from: 'opacity: 0',
      to: 'opacity: 1',
    },
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    duration: '500ms',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    category: 'entrance',
    preview: 'entrance',
    description: 'Slide from bottom with fade - elegant reveal',
    specs: {
      from: 'translateY(20px), opacity: 0',
      to: 'translateY(0), opacity: 1',
    },
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    duration: '350ms',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    category: 'entrance',
    preview: 'entrance',
    description: 'Scale from small with bounce - attention-grabbing',
    specs: {
      from: 'scale(0.8), opacity: 0',
      to: 'scale(1), opacity: 1',
    },
  },

  // LOADING ANIMATIONS
  {
    id: 'spinner',
    name: 'Spinner',
    duration: '800ms',
    easing: 'linear',
    category: 'loading',
    preview: 'loading',
    description: 'Classic rotating spinner - universal loading state',
    specs: {
      animation: 'rotate(360deg)',
      infinite: true,
    },
  },
  {
    id: 'pulse',
    name: 'Pulse',
    duration: '1500ms',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    category: 'loading',
    preview: 'loading',
    description: 'Gentle pulse - skeleton loading, waiting states',
    specs: {
      animation: 'scale(1) -> scale(1.05) -> scale(1), opacity: 1 -> 0.5 -> 1',
      infinite: true,
    },
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    duration: '2000ms',
    easing: 'linear',
    category: 'loading',
    preview: 'loading',
    description: 'Gradient shimmer - skeleton screens, content loading',
    specs: {
      animation: 'translateX(-100%) -> translateX(100%)',
      infinite: true,
    },
  },

  // FEEDBACK ANIMATIONS
  {
    id: 'success-scale',
    name: 'Success Pop',
    duration: '500ms',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    category: 'feedback',
    preview: 'feedback',
    description: 'Bouncy scale - success confirmations, checkmarks',
    specs: {
      from: 'scale(0)',
      to: 'scale(1)',
    },
  },
  {
    id: 'error-shake',
    name: 'Error Shake',
    duration: '400ms',
    easing: 'ease-in-out',
    category: 'feedback',
    preview: 'feedback',
    description: 'Horizontal shake - validation errors, failed actions',
    specs: {
      animation: 'translateX(0) -> translateX(-10px) -> translateX(10px) -> translateX(-10px) -> translateX(0)',
    },
  },
  {
    id: 'ripple',
    name: 'Ripple Effect',
    duration: '600ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    category: 'feedback',
    preview: 'feedback',
    description: 'Material ripple - click feedback on buttons/cards',
    specs: {
      animation: 'scale(0), opacity: 1 -> scale(4), opacity: 0',
    },
  },

  // PAGE TRANSITIONS
  {
    id: 'fade-transition',
    name: 'Fade Cross',
    duration: '300ms',
    easing: 'ease-in-out',
    category: 'transition',
    preview: 'transition',
    description: 'Simple cross-fade - minimal, professional',
    specs: {
      exit: 'opacity: 1 -> 0',
      enter: 'opacity: 0 -> 1',
    },
  },
  {
    id: 'slide-transition',
    name: 'Slide Horizontal',
    duration: '400ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    category: 'transition',
    preview: 'transition',
    description: 'Slide navigation - mobile apps, wizards',
    specs: {
      exit: 'translateX(0) -> translateX(-30%)',
      enter: 'translateX(100%) -> translateX(0)',
    },
  },

  // MICRO-INTERACTIONS
  {
    id: 'checkbox-check',
    name: 'Checkbox Check',
    duration: '200ms',
    easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
    category: 'micro',
    preview: 'micro',
    description: 'Smooth checkmark draw - checkboxes, todos',
    specs: {
      animation: 'stroke-dashoffset: 20 -> 0',
    },
  },
  {
    id: 'toggle-slide',
    name: 'Toggle Slide',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    category: 'micro',
    preview: 'micro',
    description: 'Smooth toggle switch - settings, preferences',
    specs: {
      animation: 'translateX(0) -> translateX(20px)',
    },
  },
];

// Animation preview card component
function AnimationPreviewCard({ preset, isSelected, onSelect }: {
  preset: typeof ANIMATION_PRESETS[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const triggerAnimation = () => {
    setIsAnimating(false); // Reset first
    setTimeout(() => {
      setIsAnimating(true);
      // Auto-reset after animation duration
      if (!preset.specs.infinite) {
        setTimeout(() => setIsAnimating(false), parseFloat(preset.duration));
      }
    }, 10); // Small delay to ensure state change is detected
  };

  const renderPreview = () => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60px',
      cursor: 'pointer',
    };

    switch (preset.preview) {
      case 'hover':
        return (
          <div style={baseStyle} onMouseEnter={triggerAnimation}>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'rgb(59, 130, 246)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 500,
                transition: `all ${preset.duration} ${preset.easing}`,
                transform: isAnimating ? preset.specs.hover : 'none',
                boxShadow: isAnimating ? preset.specs.shadow : 'none',
              }}
            >
              Hover Me
            </div>
          </div>
        );

      case 'entrance':
        return (
          <div style={baseStyle} onClick={triggerAnimation}>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'rgb(168, 85, 247)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 500,
                transition: `all ${preset.duration} ${preset.easing}`,
                opacity: isAnimating ? 1 : 0,
                transform: isAnimating
                  ? 'translateY(0) scale(1)'
                  : (preset.id === 'fade-in' ? 'none' : preset.id === 'slide-up' ? 'translateY(20px)' : 'scale(0.8)'),
              }}
            >
              Click to Reveal
            </div>
          </div>
        );

      case 'loading':
        return (
          <div style={baseStyle}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: preset.id === 'spinner' ? '3px solid rgba(59, 130, 246, 0.3)' : 'none',
                borderTopColor: preset.id === 'spinner' ? 'rgb(59, 130, 246)' : 'transparent',
                backgroundColor: preset.id === 'pulse' ? 'rgb(59, 130, 246)' : preset.id === 'shimmer' ? 'rgb(59, 130, 246)' : 'transparent',
                ...(preset.id === 'spinner' ? {
                  animationName: 'spin',
                  animationDuration: preset.duration,
                  animationTimingFunction: preset.easing,
                  animationIterationCount: 'infinite',
                } : preset.id === 'pulse' ? {
                  animationName: 'pulse',
                  animationDuration: preset.duration,
                  animationTimingFunction: preset.easing,
                  animationIterationCount: 'infinite',
                } : {}),
              }}
            />
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.1); }
              }
            `}</style>
          </div>
        );

      case 'feedback':
        if (preset.id === 'ripple') {
          return (
            <div style={baseStyle} onClick={triggerAnimation}>
              <div
                style={{
                  position: 'relative',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'rgb(59, 130, 246)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  overflow: 'hidden',
                }}
              >
                Click Me
                {isAnimating && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      transform: 'translate(-50%, -50%)',
                      animationName: 'ripple',
                      animationDuration: preset.duration,
                      animationTimingFunction: preset.easing,
                    }}
                  />
                )}
                <style>{`
                  @keyframes ripple {
                    from {
                      transform: translate(-50%, -50%) scale(0);
                      opacity: 1;
                    }
                    to {
                      transform: translate(-50%, -50%) scale(4);
                      opacity: 0;
                    }
                  }
                `}</style>
              </div>
            </div>
          );
        }

        if (preset.id === 'error-shake') {
          return (
            <div style={baseStyle} onClick={triggerAnimation}>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'rgb(239, 68, 68)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  ...(isAnimating ? {
                    animationName: 'shake',
                    animationDuration: preset.duration,
                    animationTimingFunction: preset.easing,
                  } : {}),
                }}
              >
                ✗ Error
              </div>
              <style>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(-8px); }
                  50% { transform: translateX(8px); }
                  75% { transform: translateX(-8px); }
                }
              `}</style>
            </div>
          );
        }

        return (
          <div style={baseStyle} onClick={triggerAnimation}>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'rgb(16, 185, 129)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 500,
                transition: `all ${preset.duration} ${preset.easing}`,
                transform: isAnimating ? 'scale(1)' : 'scale(0.7)',
              }}
            >
              ✓ Success
            </div>
          </div>
        );

      case 'transition':
        return (
          <div style={baseStyle} onClick={triggerAnimation}>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'rgb(99, 102, 241)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 500,
                transition: `all ${preset.duration} ${preset.easing}`,
                opacity: isAnimating ? 0.3 : 1,
                transform: isAnimating ? (preset.id === 'slide-transition' ? 'translateX(-20px)' : 'none') : 'translateX(0)',
              }}
            >
              Page A → B
            </div>
          </div>
        );

      case 'micro':
        return (
          <div style={baseStyle} onClick={triggerAnimation}>
            {preset.id === 'checkbox-check' ? (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: '2px solid rgb(59, 130, 246)',
                  backgroundColor: isAnimating ? 'rgb(59, 130, 246)' : 'transparent',
                  transition: `all ${preset.duration} ${preset.easing}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                }}
              >
                {isAnimating && '✓'}
              </div>
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: isAnimating ? 'rgb(59, 130, 246)' : 'rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  transition: `all ${preset.duration} ${preset.easing}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: isAnimating ? '18px' : '2px',
                    top: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transition: `all ${preset.duration} ${preset.easing}`,
                  }}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <button
      onClick={onSelect}
      style={{
        padding: '12px',
        borderRadius: '8px',
        border: '2px solid',
        borderColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
        backgroundColor: isSelected ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 200ms',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
        {preset.name}
      </div>
      <div style={{ fontSize: '10px', color: 'rgb(156, 163, 175)', marginBottom: '8px' }}>
        {preset.duration} • {preset.easing.length > 20 ? 'custom' : preset.easing}
      </div>
      {renderPreview()}
      <div style={{ fontSize: '11px', color: 'rgb(107, 114, 128)', marginTop: '8px', lineHeight: '1.3' }}>
        {preset.description}
      </div>
    </button>
  );
}

export function StyleConfigModal({ onComplete, onClose }: StyleConfigModalProps) {
  const [selectedFontPairing, setSelectedFontPairing] = useState<string | null>(null);
  const [selectedColorPalette, setSelectedColorPalette] = useState<string | null>(null);
  const [selectedAnimations, setSelectedAnimations] = useState<Record<string, string>>({});
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Calculate selection counts
  const animationCount = Object.keys(selectedAnimations).length;
  const hasAnySelection = selectedFontPairing || selectedColorPalette || animationCount > 0;

  // Load all Google Fonts when modal opens
  React.useEffect(() => {
    // Create a link element for Google Fonts
    const linkId = 'style-config-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';

      // Build font families string
      const fontFamilies = FONT_PAIRINGS.map(p => p.googleFonts).join('&family=');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;

      document.head.appendChild(link);

      // Mark fonts as loaded after a delay
      setTimeout(() => setFontsLoaded(true), 500);
    } else {
      setFontsLoaded(true);
    }

    return () => {
      // Clean up font link when modal closes
      const existingLink = document.getElementById(linkId);
      if (existingLink) {
        existingLink.remove();
      }
    };
  }, []);

  const handleApply = () => {
    if (!hasAnySelection) return;

    const fontPairing = selectedFontPairing ? FONT_PAIRINGS.find(f => f.id === selectedFontPairing) : null;
    const colorPalette = selectedColorPalette ? COLOR_PALETTES.find(c => c.id === selectedColorPalette) : null;

    // Get selected animations for each category
    const selectedAnimationDetails = Object.entries(selectedAnimations).map(([category, id]) => {
      const preset = ANIMATION_PRESETS.find(p => p.id === id);
      return { category, preset };
    }).filter(item => item.preset);

    // Build agent tasks
    const agentTasks: string[] = [];
    const agentTypes: string[] = [];

    if (fontPairing) {
      agentTypes.push('typography-specialist');
      agentTasks.push(`Typography Agent:
Spawn a typography-specialist agent with this prompt:
"Implement the following typography system:
- Heading Font: ${fontPairing.heading} (weight: ${fontPairing.headingWeight})
- Body Font: ${fontPairing.body} (weight: ${fontPairing.bodyWeight})
- Font Pairing: "${fontPairing.name}"
- Description: ${fontPairing.description}
- Google Fonts URL: https://fonts.googleapis.com/css2?family=${fontPairing.googleFonts}&display=swap

Set up Google Fonts loading using the URL above.
Create a typography scale with proper sizes, line heights, and letter spacing.
Implement CSS variables or utility classes for consistent usage.
Ensure responsive typography and system font fallbacks.
Use the specified font weights for headings and body text."`);
    }

    if (colorPalette) {
      agentTypes.push('color-specialist');
      agentTasks.push(`Color Agent:
Spawn a color-specialist agent with this prompt:
"Implement the following color system:
- Primary: ${colorPalette.primary}
- Secondary: ${colorPalette.secondary}
- Accent: ${colorPalette.accent}
- Background: ${colorPalette.background}
- Surface: ${colorPalette.surface}
- Palette: "${colorPalette.name}"
- Description: ${colorPalette.description}

Create CSS custom properties for all colors with semantic naming.
Ensure WCAG AA accessibility (4.5:1 contrast for text).
Include hover/active/disabled state colors.
Document color usage in a central location."`);
    }

    if (selectedAnimationDetails.length > 0) {
      agentTypes.push('animation-specialist');
      const animationSection = selectedAnimationDetails.map(({ category, preset }) => `
${ANIMATION_CATEGORIES[category as keyof typeof ANIMATION_CATEGORIES]}:
  - Animation: "${preset!.name}"
  - Duration: ${preset!.duration}
  - Easing: ${preset!.easing}
  - Usage: ${preset!.description}
  - Specs: ${JSON.stringify(preset!.specs, null, 2)}`).join('\n');

      agentTasks.push(`Animation Agent:
Spawn an animation-specialist agent with this prompt:
"Implement the following animation system:
${animationSection}

Create reusable animation utilities for all categories.
Use hardware-accelerated properties (transform, opacity).
Add @media (prefers-reduced-motion: reduce) for accessibility.
Apply animations consistently across interactive elements.
Document animation tokens in a central location."`);
    }

    const selectedSystems: string[] = [];
    if (fontPairing) selectedSystems.push('Typography');
    if (colorPalette) selectedSystems.push('colors');
    if (selectedAnimationDetails.length > 0) selectedSystems.push('animations');

    const prompt = `Implement the design system by spawning specialized agents in parallel.

STEP 1: Spawn ALL of the following agents in PARALLEL using the Task tool with the specified subagent_type:

${agentTasks.join('\n\n')}

IMPORTANT: Use a SINGLE message with MULTIPLE Task tool calls to spawn all ${agentTypes.length} agents in parallel (subagent_type: ${agentTypes.map(t => `'${t}'`).join(', ')}).

STEP 2: After all ${agentTypes.length} agents complete their work, verify that:
- ${selectedSystems.join(', ')} ${selectedSystems.length > 1 ? 'are' : 'is'} properly configured
- All design tokens are documented in a central location (e.g., globals.css, design-tokens.css, or similar)
- The implementation is cohesive and follows modern best practices
- Files are created or updated as needed`;

    onComplete(prompt);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1152px',
          height: '90vh',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgb(20, 22, 24)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          aria-label="Close modal"
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Spacer for close button */}
        <div style={{ height: '60px', flexShrink: 0 }} />

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: '80px',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0 32px 24px',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'white',
                marginBottom: '8px',
              }}
            >
              Style Configuration
            </h2>
            <p style={{ color: 'rgb(156, 163, 175)', fontSize: '14px' }}>
              Configure professional fonts and colors following best practices
            </p>
          </div>

          {/* Scrollable content */}
          <div style={{ padding: '0 32px' }}>
          {/* Font Pairings */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Type style={{ width: '20px', height: '20px', color: 'rgb(168, 199, 250)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
                Font Pairing
              </h3>
              <span style={{
                fontSize: '12px',
                color: selectedFontPairing ? 'rgb(34, 197, 94)' : 'rgb(107, 114, 128)',
                backgroundColor: selectedFontPairing ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 500,
              }}>
                {selectedFontPairing ? '1 selected' : 'None selected'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {FONT_PAIRINGS.map((pairing) => (
                <button
                  key={pairing.id}
                  onClick={() => setSelectedFontPairing(prev => prev === pairing.id ? null : pairing.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px solid',
                    borderColor: selectedFontPairing === pairing.id ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: selectedFontPairing === pairing.id ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 200ms',
                  }}
                >
                  {/* Font Name */}
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                    {pairing.name}
                  </div>

                  {/* Category Badge */}
                  <div style={{ fontSize: '11px', color: 'rgb(156, 163, 175)', marginBottom: '12px' }}>
                    {pairing.category}
                  </div>

                  {/* Font Preview - Heading */}
                  <div
                    style={{
                      fontFamily: `"${pairing.heading}", sans-serif`,
                      fontWeight: pairing.headingWeight,
                      fontSize: '20px',
                      color: 'white',
                      marginBottom: '6px',
                      opacity: fontsLoaded ? 1 : 0.5,
                      transition: 'opacity 300ms',
                    }}
                  >
                    Heading Style
                  </div>

                  {/* Font Preview - Body */}
                  <div
                    style={{
                      fontFamily: `"${pairing.body}", sans-serif`,
                      fontWeight: pairing.bodyWeight,
                      fontSize: '14px',
                      color: 'rgb(209, 213, 219)',
                      marginBottom: '12px',
                      opacity: fontsLoaded ? 1 : 0.5,
                      transition: 'opacity 300ms',
                    }}
                  >
                    Body text with good readability
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', lineHeight: '1.4' }}>
                    {pairing.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Palette style={{ width: '20px', height: '20px', color: 'rgb(168, 199, 250)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
                Color Palette
              </h3>
              <span style={{
                fontSize: '12px',
                color: selectedColorPalette ? 'rgb(34, 197, 94)' : 'rgb(107, 114, 128)',
                backgroundColor: selectedColorPalette ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 500,
              }}>
                {selectedColorPalette ? '1 selected' : 'None selected'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => setSelectedColorPalette(prev => prev === palette.id ? null : palette.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px solid',
                    borderColor: selectedColorPalette === palette.id ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: selectedColorPalette === palette.id ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 200ms',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
                    {palette.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: palette.primary }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: palette.secondary }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: palette.accent }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: palette.surface, border: '1px solid rgba(255,255,255,0.2)' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                    {palette.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Animation System - Grouped by Category */}
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Sparkles style={{ width: '20px', height: '20px', color: 'rgb(168, 199, 250)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
                Animation System
              </h3>
              <span style={{
                fontSize: '12px',
                color: animationCount > 0 ? 'rgb(34, 197, 94)' : 'rgb(107, 114, 128)',
                backgroundColor: animationCount > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 500,
              }}>
                {animationCount > 0 ? `${animationCount} of 6 selected` : 'None selected'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgb(156, 163, 175)', marginBottom: '20px' }}>
              Choose animations for each interaction type. Hover or click to preview. Click again to deselect.
            </div>

            {/* Render categories */}
            {Object.entries(ANIMATION_CATEGORIES).map(([categoryKey, categoryName]) => {
              const categoryPresets = ANIMATION_PRESETS.filter(p => p.category === categoryKey);
              return (
                <div key={categoryKey} style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>
                    {categoryName}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {categoryPresets.map((preset) => (
                      <AnimationPreviewCard
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedAnimations[categoryKey] === preset.id}
                        onSelect={() => setSelectedAnimations(prev => {
                          if (prev[categoryKey] === preset.id) {
                            const { [categoryKey]: _, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, [categoryKey]: preset.id };
                        })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 32px',
            backgroundColor: 'rgb(20, 22, 24)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!hasAnySelection}
            className="send-button-active"
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: hasAnySelection ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: hasAnySelection ? 1 : 0.5,
            }}
          >
            <Sparkles style={{ width: '16px', height: '16px' }} />
            Apply Configuration
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
