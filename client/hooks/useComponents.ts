/**
 * Components Hook
 *
 * State management for AI component generation and preset library.
 * Provides access to component presets and generation functionality.
 */

import { useState, useCallback, useEffect } from 'react';

export interface ComponentPreset {
  name: string;
  description: string;
  props: string[];
  category: string;
}

export interface GeneratedComponent {
  name: string;
  path: string;
  code: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  preview: string;
  tests?: string;
  stories?: string;
}

export interface ComponentGenerationOptions {
  name: string;
  description: string;
  framework?: 'react' | 'astro' | 'vue' | 'svelte';
  typescript?: boolean;
  projectPath?: string;
  styling?: 'tailwind' | 'css' | 'scss';
  generateTests?: boolean;
  generateStorybook?: boolean;
}

interface PresetCategories {
  ui: ComponentPreset[];
  layout: ComponentPreset[];
  form: ComponentPreset[];
  data: ComponentPreset[];
  marketing: ComponentPreset[];
}

interface UseComponentsReturn {
  // State
  presets: PresetCategories | null;
  categories: string[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  lastGenerated: GeneratedComponent | null;

  // Actions
  loadPresets: () => Promise<void>;
  generateComponent: (options: ComponentGenerationOptions) => Promise<GeneratedComponent | null>;
  generateFromPreset: (presetName: string, options?: Partial<ComponentGenerationOptions>) => Promise<GeneratedComponent | null>;
  getPreviewHtml: (componentCode: string, framework: string) => Promise<string>;
  clearError: () => void;
}

export function useComponents(): UseComponentsReturn {
  const [presets, setPresets] = useState<PresetCategories | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<GeneratedComponent | null>(null);

  // Load presets from API
  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/components/presets');
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets || null);
        setCategories(data.categories || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load presets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate component from description
  const generateComponent = useCallback(async (
    options: ComponentGenerationOptions
  ): Promise<GeneratedComponent | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/components/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: options.name,
          description: options.description,
          framework: options.framework || 'react',
          typescript: options.typescript ?? true,
          projectPath: options.projectPath,
          styling: options.styling || 'tailwind',
          generateTests: options.generateTests || false,
          generateStorybook: options.generateStorybook || false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.component) {
          setLastGenerated(data.component);
          return data.component;
        }
        setError(data.error || 'Generation failed');
        return null;
      }

      const errData = await res.json();
      setError(errData.error || 'Generation failed');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate from preset
  const generateFromPreset = useCallback(async (
    presetName: string,
    options?: Partial<ComponentGenerationOptions>
  ): Promise<GeneratedComponent | null> => {
    // Find preset in categories
    let preset: ComponentPreset | null = null;
    if (presets) {
      for (const category of Object.values(presets)) {
        const found = category.find((p: ComponentPreset) => p.name === presetName);
        if (found) {
          preset = found;
          break;
        }
      }
    }

    if (!preset) {
      setError(`Preset "${presetName}" not found`);
      return null;
    }

    return generateComponent({
      name: options?.name || preset.name,
      description: preset.description,
      framework: options?.framework || 'react',
      typescript: options?.typescript ?? true,
      projectPath: options?.projectPath,
      styling: options?.styling || 'tailwind',
      generateTests: options?.generateTests || false,
      generateStorybook: options?.generateStorybook || false,
    });
  }, [presets, generateComponent]);

  // Get preview HTML for component
  const getPreviewHtml = useCallback(async (
    componentCode: string,
    framework: string
  ): Promise<string> => {
    try {
      const res = await fetch('/api/components/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: componentCode, framework }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.html || '';
      }
      return '';
    } catch {
      return '';
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return {
    presets,
    categories,
    isLoading,
    isGenerating,
    error,
    lastGenerated,
    loadPresets,
    generateComponent,
    generateFromPreset,
    getPreviewHtml,
    clearError,
  };
}

export default useComponents;
