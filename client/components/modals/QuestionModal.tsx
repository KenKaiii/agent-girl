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
import { HelpCircle, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export interface QuestionOption {
  label: string;
  description: string;
}

export interface Question {
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect: boolean;
}

interface QuestionModalProps {
  toolId: string;
  questions: Question[];
  onSubmit: (toolId: string, answers: Record<string, string>) => void;
  onCancel: (toolId: string) => void;
}

export function QuestionModal({ toolId, questions, onSubmit, onCancel }: QuestionModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [otherInputs, setOtherInputs] = useState<Record<number, string>>({});

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const isFirstStep = currentStep === 0;
  const totalSteps = questions.length;

  const handleOptionSelect = (optionLabel: string) => {
    if (currentQuestion.multiSelect) {
      const currentAnswers = answers[currentStep] || [];
      if (currentAnswers.includes(optionLabel)) {
        setAnswers({
          ...answers,
          [currentStep]: currentAnswers.filter(a => a !== optionLabel)
        });
      } else {
        // Deselect "Other" when selecting a regular option in multi-select
        setAnswers({
          ...answers,
          [currentStep]: [...currentAnswers.filter(a => a !== '__other__'), optionLabel]
        });
      }
    } else {
      // Single select: replace and deselect "Other"
      setAnswers({
        ...answers,
        [currentStep]: [optionLabel]
      });
      setOtherInputs({
        ...otherInputs,
        [currentStep]: ''
      });
    }
  };

  const handleOtherSelect = () => {
    if (currentQuestion.multiSelect) {
      const currentAnswers = answers[currentStep] || [];
      if (currentAnswers.includes('__other__')) {
        setAnswers({
          ...answers,
          [currentStep]: currentAnswers.filter(a => a !== '__other__')
        });
      } else {
        setAnswers({
          ...answers,
          [currentStep]: [...currentAnswers, '__other__']
        });
      }
    } else {
      setAnswers({
        ...answers,
        [currentStep]: ['__other__']
      });
    }
  };

  const handleOtherInputChange = (value: string) => {
    setOtherInputs({
      ...otherInputs,
      [currentStep]: value
    });
  };

  const isOptionSelected = (optionLabel: string) => {
    return (answers[currentStep] || []).includes(optionLabel);
  };

  const isOtherSelected = () => {
    return (answers[currentStep] || []).includes('__other__');
  };

  const canProceed = () => {
    const currentAnswers = answers[currentStep] || [];
    if (currentAnswers.length === 0) return false;
    if (currentAnswers.includes('__other__') && !otherInputs[currentStep]?.trim()) return false;
    return true;
  };

  const handleNext = () => {
    if (isLastStep) {
      const finalAnswers: Record<string, string> = {};
      questions.forEach((q, idx) => {
        const stepAnswers = answers[idx] || [];
        const answerList = stepAnswers.map(a => {
          if (a === '__other__') return otherInputs[idx] || '';
          return a;
        }).filter(Boolean);
        finalAnswers[q.header] = answerList.join(', ');
      });
      onSubmit(toolId, finalAnswers);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    onCancel(toolId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        style={{
          background: 'rgb(var(--bg-input))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '32rem',
          minHeight: '24rem',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed height */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HelpCircle size={22} style={{ color: 'rgb(var(--blue-accent))', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'linear-gradient(90deg, rgba(168, 199, 250, 0.2), rgba(218, 238, 255, 0.2))',
                  color: 'rgb(var(--blue-accent))',
                  border: '1px solid rgba(218, 238, 255, 0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentQuestion.header}
              </span>
              {totalSteps > 1 && (
                <span style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
                  {currentStep + 1} of {totalSteps}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgb(var(--text-secondary))',
              padding: '0.375rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgb(var(--text-primary))';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgb(var(--text-secondary))';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Question Content - scrollable */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'rgb(var(--text-primary))',
              marginBottom: '1.25rem',
              lineHeight: 1.5,
            }}
          >
            {currentQuestion.question}
          </h3>

          {/* Options - fixed layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = isOptionSelected(option.label);
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option.label)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.625rem',
                    border: isSelected
                      ? '2px solid rgb(var(--blue-accent))'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    background: isSelected
                      ? 'rgba(218, 238, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                    // Prevent layout shift by using consistent padding
                    boxSizing: 'border-box',
                    marginLeft: isSelected ? '0' : '0.5px',
                    marginRight: isSelected ? '0' : '0.5px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '1.125rem',
                        height: '1.125rem',
                        borderRadius: currentQuestion.multiSelect ? '0.25rem' : '50%',
                        border: `2px solid ${isSelected ? 'rgb(var(--blue-accent))' : 'rgba(255, 255, 255, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '0.0625rem',
                        background: isSelected ? 'rgb(var(--blue-accent))' : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected && <Check size={12} style={{ color: '#000' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'rgb(var(--text-primary))',
                          marginBottom: option.description ? '0.125rem' : 0,
                        }}
                      >
                        {option.label}
                      </div>
                      {option.description && (
                        <div
                          style={{
                            fontSize: '0.8125rem',
                            color: 'rgb(var(--text-secondary))',
                            lineHeight: 1.4,
                          }}
                        >
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Other option */}
            <button
              onClick={handleOtherSelect}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.625rem',
                border: isOtherSelected()
                  ? '2px solid rgb(var(--blue-accent))'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                background: isOtherSelected()
                  ? 'rgba(218, 238, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                boxSizing: 'border-box',
                marginLeft: isOtherSelected() ? '0' : '0.5px',
                marginRight: isOtherSelected() ? '0' : '0.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '1.125rem',
                    height: '1.125rem',
                    borderRadius: currentQuestion.multiSelect ? '0.25rem' : '50%',
                    border: `2px solid ${isOtherSelected() ? 'rgb(var(--blue-accent))' : 'rgba(255, 255, 255, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isOtherSelected() ? 'rgb(var(--blue-accent))' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {isOtherSelected() && <Check size={12} style={{ color: '#000' }} />}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgb(var(--text-primary))' }}>
                  Other
                </div>
              </div>
            </button>

            {/* Other text input - appears below with animation */}
            <div
              style={{
                overflow: 'hidden',
                maxHeight: isOtherSelected() ? '4rem' : '0',
                opacity: isOtherSelected() ? 1 : 0,
                transition: 'max-height 0.2s ease, opacity 0.2s ease',
              }}
            >
              <input
                type="text"
                value={otherInputs[currentStep] || ''}
                onChange={(e) => handleOtherInputChange(e.target.value)}
                placeholder="Enter your answer..."
                autoFocus={isOtherSelected()}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.625rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgb(var(--text-primary))',
                  fontSize: '0.875rem',
                  outline: 'none',
                  marginTop: '0.5rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer - fixed height */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          {/* Progress dots - only show for multi-step */}
          {totalSteps > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.375rem',
              }}
            >
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '0.375rem',
                    height: '0.375rem',
                    borderRadius: '50%',
                    background: idx === currentStep
                      ? 'rgb(var(--blue-accent))'
                      : idx < currentStep
                        ? 'rgba(218, 238, 255, 0.6)'
                        : 'rgba(255, 255, 255, 0.2)',
                    transition: 'background 0.15s',
                  }}
                />
              ))}
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: totalSteps > 1 ? 'space-between' : 'flex-end',
            }}
          >
            {totalSteps > 1 && (
              <button
                onClick={handleBack}
                disabled={isFirstStep}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: 'rgb(var(--text-primary))',
                  cursor: isFirstStep ? 'not-allowed' : 'pointer',
                  opacity: isFirstStep ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'opacity 0.15s',
                }}
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="send-button-active"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: '0.5rem',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                opacity: canProceed() ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: 'none',
              }}
            >
              {isLastStep ? (
                <>
                  Submit
                  <Check size={14} />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
