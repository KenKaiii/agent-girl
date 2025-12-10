/**
 * Templates Hook
 *
 * State management for project templates and creation.
 * Provides access to template library and project scaffolding.
 */

import { useState, useCallback, useEffect } from 'react';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'landing' | 'blog' | 'portfolio' | 'saas' | 'dashboard' | 'ecommerce' | 'docs';
  framework: 'astro' | 'nextjs' | 'react' | 'vue' | 'svelte';
  features: string[];
  preview?: string;
  dependencies?: string[];
}

export interface TemplateCreationOptions {
  templateId: string;
  projectName: string;
  outputPath: string;
  customizations?: {
    name?: string;
    description?: string;
    author?: string;
  };
  installDependencies?: boolean;
}

export interface CreatedProject {
  success: boolean;
  path: string;
  name: string;
  framework: string;
  commands: {
    install: string;
    dev: string;
    build: string;
  };
  files: string[];
}

interface UseTemplatesReturn {
  // State
  templates: Template[];
  categories: string[];
  frameworks: string[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  lastCreated: CreatedProject | null;

  // Filters
  selectedCategory: string | null;
  selectedFramework: string | null;
  setSelectedCategory: (category: string | null) => void;
  setSelectedFramework: (framework: string | null) => void;
  filteredTemplates: Template[];

  // Actions
  loadTemplates: () => Promise<void>;
  getTemplate: (id: string) => Template | undefined;
  createProject: (options: TemplateCreationOptions) => Promise<CreatedProject | null>;
  clearError: () => void;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CreatedProject | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  // Load templates from API
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        setCategories(data.categories || []);
        setFrameworks(data.frameworks || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get single template by ID
  const getTemplate = useCallback((id: string): Template | undefined => {
    return templates.find(t => t.id === id);
  }, [templates]);

  // Filter templates based on selection
  const filteredTemplates = templates.filter(t => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (selectedFramework && t.framework !== selectedFramework) return false;
    return true;
  });

  // Create project from template
  const createProject = useCallback(async (
    options: TemplateCreationOptions
  ): Promise<CreatedProject | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: options.templateId,
          projectName: options.projectName,
          outputPath: options.outputPath,
          customizations: options.customizations,
          installDependencies: options.installDependencies ?? true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const created: CreatedProject = {
            success: true,
            path: data.path,
            name: data.name || options.projectName,
            framework: data.framework,
            commands: data.commands || {
              install: 'bun install',
              dev: 'bun run dev',
              build: 'bun run build',
            },
            files: data.files || [],
          };
          setLastCreated(created);
          return created;
        }
        setError(data.error || 'Creation failed');
        return null;
      }

      const errData = await res.json();
      setError(errData.error || 'Creation failed');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    categories,
    frameworks,
    isLoading,
    isCreating,
    error,
    lastCreated,
    selectedCategory,
    selectedFramework,
    setSelectedCategory,
    setSelectedFramework,
    filteredTemplates,
    loadTemplates,
    getTemplate,
    createProject,
    clearError,
  };
}

export default useTemplates;
