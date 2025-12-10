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

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  PROJECT_TYPES,
  FEATURES_BY_TYPE,
  ProjectTypeCard,
  FeatureCard,
  useFeatureSelection,
} from '../../features';

interface FeaturesModalProps {
  onComplete: (prompt: string) => void;
  onClose: () => void;
}

export function FeaturesModal({ onComplete, onClose }: FeaturesModalProps) {
  const {
    step,
    selectedFeature,
    hoveredType,
    currentFeatures,
    setHoveredType,
    handleProjectTypeSelect,
    handleBack,
    handleFeatureSelect,
    getSelectedFeature,
  } = useFeatureSelection(FEATURES_BY_TYPE);

  const handleGenerate = () => {
    const feature = getSelectedFeature();
    if (!feature) return;
    onComplete(feature.prompt);
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
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1152px',
          height: '90vh',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          backgroundColor: 'rgb(20, 22, 24)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgb(20, 22, 24)',
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              background: 'linear-gradient(90deg, rgb(168, 199, 250) 0%, rgb(255, 255, 255) 50%, rgb(168, 199, 250) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
            }}
          >
            Feature Templates
          </h1>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            paddingBottom: step === 'feature-selection' ? '80px' : '0',
          }}
        >
          {step === 'project-type' ? (
            /* Project Type Selection */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              padding: '32px',
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '32px',
                textAlign: 'center',
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px',
                }}>
                  What&apos;s your tech stack?
                </h2>
                <p style={{
                  color: 'rgb(156, 163, 175)',
                  fontSize: '14px',
                }}>
                  Select your project type to see available features
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
                {PROJECT_TYPES.map((type, index) => (
                  <ProjectTypeCard
                    key={type.id}
                    type={type}
                    isHovered={hoveredType === type.id}
                    index={index}
                    onSelect={handleProjectTypeSelect}
                    onHover={setHoveredType}
                  />
                ))}
              </div>

              {/* Helper Text */}
              <p style={{
                marginTop: '16px',
                fontSize: '13px',
                color: 'rgb(107, 114, 128)',
                textAlign: 'center',
                lineHeight: '1.6',
                maxWidth: '600px',
              }}>
                Each feature uses official templates and best-in-class tools.
                <br />
                Select your stack to see available features.
              </p>
            </div>
          ) : (
            /* Feature Selection */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              padding: '20px 32px',
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px',
                }}>
                  Choose a Feature
                </h2>
                <p style={{
                  color: 'rgb(156, 163, 175)',
                  fontSize: '14px',
                }}>
                  Select one feature to implement using best-in-class tools
                </p>
              </div>

              {/* Features Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '700px',
                margin: '0 auto 32px',
              }}>
                {currentFeatures.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    isSelected={selectedFeature === feature.id}
                    onSelect={handleFeatureSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Action Buttons */}
        {step === 'feature-selection' && (
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
              onClick={handleBack}
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
              ← Back
            </button>

            {selectedFeature && (
              <div style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                1 feature selected
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedFeature}
              className={selectedFeature ? 'send-button-active' : ''}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: selectedFeature ? 'pointer' : 'not-allowed',
                transition: 'all 200ms',
                ...(selectedFeature
                  ? {}
                  : {
                      backgroundColor: 'rgb(75, 85, 99)',
                      color: 'rgba(255, 255, 255, 0.4)',
                      border: 'none',
                    }),
              }}
            >
              Generate Implementation
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
