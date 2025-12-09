/**
 * Agent Girl - Content Editing Hook
 * Framer-style inline content editing with persistence
 */

import { useState, useCallback } from 'react';

// Types for the Content API
interface TextEditRequest {
  projectPath: string;
  file?: string;
  selector: string;
  oldText: string;
  newText: string;
  context?: {
    tagName?: string;
    className?: string;
    path?: string[];
  };
}

interface ImageUploadRequest {
  projectPath: string;
  targetPath: string;
  image: string; // Base64 or URL
  sourceFile?: string;
  oldSrc?: string;
  optimize?: {
    format?: 'avif' | 'webp' | 'jpg' | 'png';
    maxWidth?: number;
    quality?: number;
  };
}

interface AIGenerateRequest {
  context: {
    currentText: string;
    surroundingText?: string;
    pageType?: string;
    siteDescription?: string;
    targetLanguage?: string;
  };
  action: 'rewrite' | 'expand' | 'shorten' | 'translate' | 'improve' | 'custom';
  customPrompt?: string;
  targetLanguage?: string;
}

interface EditResult {
  success: boolean;
  file?: string;
  lineNumber?: number;
  message?: string;
  error?: string;
}

interface Backup {
  path: string;
  originalFile: string;
  timestamp: number;
}

export function useContentEdit(projectPath: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);

  /**
   * Save text content change to source file
   */
  const saveTextEdit = useCallback(async (
    selector: string,
    oldText: string,
    newText: string,
    options?: {
      file?: string;
      tagName?: string;
      className?: string;
      path?: string[];
    }
  ): Promise<EditResult> => {
    if (!projectPath) {
      return { success: false, error: 'No project path set' };
    }

    setIsLoading(true);
    setLastError(null);

    try {
      const response = await fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          file: options?.file,
          selector,
          oldText,
          newText,
          context: {
            tagName: options?.tagName,
            className: options?.className,
            path: options?.path,
          },
        } as TextEditRequest),
      });

      const result = await response.json();

      if (!result.success) {
        setLastError(result.error || 'Failed to save changes');
      }

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;
      setLastError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  /**
   * Upload or replace an image
   */
  const uploadImage = useCallback(async (
    targetPath: string,
    image: string | File,
    options?: {
      sourceFile?: string;
      oldSrc?: string;
      optimize?: ImageUploadRequest['optimize'];
    }
  ): Promise<EditResult> => {
    if (!projectPath) {
      return { success: false, error: 'No project path set' };
    }

    setIsLoading(true);
    setLastError(null);

    try {
      // Convert File to base64 if needed
      let imageData: string;
      if (image instanceof File) {
        imageData = await fileToBase64(image);
      } else {
        imageData = image;
      }

      const response = await fetch('/api/content/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          targetPath,
          image: imageData,
          sourceFile: options?.sourceFile,
          oldSrc: options?.oldSrc,
          optimize: options?.optimize,
        } as ImageUploadRequest),
      });

      const result = await response.json();

      if (!result.success) {
        setLastError(result.error || 'Failed to upload image');
      }

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;
      setLastError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  /**
   * Generate AI content suggestion
   */
  const generateAIContent = useCallback(async (
    currentText: string,
    action: AIGenerateRequest['action'],
    options?: {
      customPrompt?: string;
      targetLanguage?: string;
      pageType?: string;
      siteDescription?: string;
    }
  ): Promise<{ success: boolean; prompt?: string; error?: string }> => {
    setIsLoading(true);
    setLastError(null);

    try {
      const response = await fetch('/api/content/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            currentText,
            pageType: options?.pageType,
            siteDescription: options?.siteDescription,
            targetLanguage: options?.targetLanguage,
          },
          action,
          customPrompt: options?.customPrompt,
          targetLanguage: options?.targetLanguage,
        } as AIGenerateRequest),
      });

      const result = await response.json();

      if (!result.success) {
        setLastError(result.error || 'Failed to generate AI content');
      }

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;
      setLastError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Find source file containing specific text
   */
  const findSourceFile = useCallback(async (
    text: string,
    context?: { tagName?: string; className?: string }
  ): Promise<{ success: boolean; file?: string; lineNumber?: number; error?: string }> => {
    if (!projectPath) {
      return { success: false, error: 'No project path set' };
    }

    try {
      const response = await fetch('/api/content/find-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, text, context }),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [projectPath]);

  /**
   * Load edit history (backups)
   */
  const loadHistory = useCallback(async (): Promise<Backup[]> => {
    if (!projectPath) return [];

    try {
      const response = await fetch(`/api/content/history?projectPath=${encodeURIComponent(projectPath)}`);
      const result = await response.json();

      if (result.success) {
        setBackups(result.backups);
        return result.backups;
      }
      return [];
    } catch {
      return [];
    }
  }, [projectPath]);

  /**
   * Restore from backup
   */
  const restoreBackup = useCallback(async (
    backupPath: string,
    targetPath?: string
  ): Promise<EditResult> => {
    setIsLoading(true);
    setLastError(null);

    try {
      const response = await fetch('/api/content/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupPath, targetPath }),
      });

      const result = await response.json();

      if (!result.success) {
        setLastError(result.error || 'Failed to restore backup');
      }

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;
      setLastError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isLoading,
    lastError,
    backups,

    // Actions
    saveTextEdit,
    uploadImage,
    generateAIContent,
    findSourceFile,
    loadHistory,
    restoreBackup,

    // Helpers
    clearError: () => setLastError(null),
  };
}

// Helper to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default useContentEdit;
