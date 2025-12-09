/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState } from 'react';
import type { Feature } from './types';

export function useFeatureSelection(
  featuresData: Record<string, Feature[]>
) {
  const [step, setStep] = useState<'project-type' | 'feature-selection'>('project-type');
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleProjectTypeSelect = (typeId: string) => {
    setSelectedProjectType(typeId);
    setSelectedFeature(null); // Reset feature selection
    setStep('feature-selection');
  };

  const handleBack = () => {
    setStep('project-type');
    setSelectedFeature(null);
  };

  const handleFeatureSelect = (featureId: string) => {
    // Toggle selection (click again to deselect)
    setSelectedFeature(prev => prev === featureId ? null : featureId);
  };

  const getSelectedFeature = (): Feature | null => {
    if (!selectedProjectType || !selectedFeature) return null;
    const features = featuresData[selectedProjectType];
    return features?.find(f => f.id === selectedFeature) || null;
  };

  const currentFeatures = selectedProjectType ? featuresData[selectedProjectType] || [] : [];

  return {
    step,
    selectedProjectType,
    selectedFeature,
    hoveredType,
    currentFeatures,
    setHoveredType,
    handleProjectTypeSelect,
    handleBack,
    handleFeatureSelect,
    getSelectedFeature,
  };
}
