/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { LucideIcon } from 'lucide-react';

export interface Feature {
  id: string;
  name: string;
  description: string;
  tags: string[];
  template: string;
  icon: LucideIcon;
  tooltip: string;
  prompt: string;
}

export type FeaturesByType = Record<string, Feature[]>;
