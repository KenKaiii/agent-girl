/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ReactNode } from 'react';

export interface FeatureOption {
  id: string;
  name: string;
  description: string;
  tooltip?: string;
  recommended?: boolean;
  configOptions?: ConfigOption[];
  autoBundles?: string[];
  hidden?: boolean;
}

export interface ConfigOption {
  id: string;
  label: string;
  type: 'select' | 'toggle';
  options?: { value: string; label: string; tooltip?: string; recommended?: boolean }[];
  defaultValue?: string | boolean;
  tooltip?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  tooltip?: string;
  icon: ReactNode;
  gradient: string;
  command: string;
  commandFlags?: Record<string, (value: string | boolean | number) => string>;
  features: FeatureOption[];
}
