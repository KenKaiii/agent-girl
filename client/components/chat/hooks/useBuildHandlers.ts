/**
 * Agent Girl - Build and AI Edit Request handlers hook
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useCallback } from 'react';
import type { Message, SystemMessage, PreviewActionMetadata, PreviewElement, FileAttachment } from '../../message/types';
import type { AIEditRequest } from '../types';
import type { Template } from '../../preview/BuildLauncher';

interface UseBuildHandlersProps {
  setIsBuildWizardOpen: (open: boolean) => void;
  setCurrentSessionId: (id: string | null) => void;
  setCurrentSessionMode: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build') => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onBuildPreviewStart?: (url: string) => void;
  handleSubmit: (files?: FileAttachment[], mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'unified' | 'build', messageOverride?: string) => Promise<void>;
}

export function useBuildHandlers({
  setIsBuildWizardOpen,
  setCurrentSessionId,
  setCurrentSessionMode,
  setMessages,
  onBuildPreviewStart,
  handleSubmit,
}: UseBuildHandlersProps) {
  const handleOpenBuildWizard = useCallback(() => {
    setIsBuildWizardOpen(true);
  }, [setIsBuildWizardOpen]);

  const handleCloseBuildWizard = useCallback(() => {
    setIsBuildWizardOpen(false);
  }, [setIsBuildWizardOpen]);

  // Handle template selection from BuildLauncher - FULLY AUTOMATED
  const handleSelectTemplate = useCallback(async (template: Template) => {
    setIsBuildWizardOpen(false);
    setCurrentSessionId(null);
    setCurrentSessionMode('build');
    setMessages([]);

    // AUTO-START BUILD WORKFLOW: Create project, start dev server, show preview
    try {
      const projectName = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const response = await fetch('/api/build/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          projectName,
          workingDir: '/Users/master/Projects'
        })
      });

      const buildResult = await response.json();

      if (buildResult.success && onBuildPreviewStart) {
        // Trigger split-screen layout with live preview
        onBuildPreviewStart(buildResult.previewUrl);
        console.log('[BUILD] Auto-started project:', buildResult.projectPath, 'Preview:', buildResult.previewUrl);
      }
    } catch (error) {
      console.error('[BUILD] Auto-start failed:', error);
    }

    // Continue with normal flow - submit template command to AI
    setTimeout(() => {
      handleSubmit(undefined, 'build', template.command);
    }, 100);
  }, [setIsBuildWizardOpen, setCurrentSessionId, setCurrentSessionMode, setMessages, onBuildPreviewStart, handleSubmit]);

  // Handle quick actions from BuildLauncher (clone, ai, blank, niche)
  const handleQuickAction = useCallback((action: string, input?: string) => {
    let prompt = '';
    switch (action) {
      case 'clone':
        prompt = `/clone ${input || ''}`;
        break;
      case 'ai':
        prompt = input || 'Create a modern Astro 5 website with landing page, about, and contact sections';
        break;
      case 'blank':
        prompt = '/new my-project';
        break;
      case 'niche':
        prompt = `/landing ${input || 'saas'} "My Project"`;
        break;
      default:
        prompt = action;
    }

    if (prompt) {
      setIsBuildWizardOpen(false);
      setCurrentSessionId(null);
      setCurrentSessionMode('build');
      setMessages([]);

      setTimeout(() => {
        handleSubmit(undefined, 'build', prompt);
      }, 100);
    }
  }, [setIsBuildWizardOpen, setCurrentSessionId, setCurrentSessionMode, setMessages, handleSubmit]);

  // Handle BuildWizard completion (step-by-step custom project)
  const handleBuildComplete = useCallback((prompt: string) => {
    setIsBuildWizardOpen(false);
    setCurrentSessionId(null);
    setCurrentSessionMode('coder');
    setMessages([]);

    setTimeout(() => {
      handleSubmit(undefined, 'coder', prompt);
    }, 100);
  }, [setIsBuildWizardOpen, setCurrentSessionId, setCurrentSessionMode, setMessages, handleSubmit]);

  // Handle AI edit request from preview element selection
  const handleAIEditRequest = useCallback(async (request: AIEditRequest) => {
    // First, add a preview action system message to show context in chat
    const previewElements: PreviewElement[] = request.elements.map(el => ({
      id: el.id,
      tagName: el.tagName,
      selector: el.selector,
      textContent: el.textContent,
      className: el.className,
      elementId: el.elementId,
      path: el.path,
      styles: el.styles ? {
        color: el.styles.color,
        backgroundColor: el.styles.backgroundColor,
        fontSize: el.styles.fontSize,
      } : undefined,
    }));

    const previewMetadata: PreviewActionMetadata = {
      type: 'preview',
      action: 'ai_request',
      previewUrl: request.previewUrl,
      elements: previewElements,
      fileContext: request.fileContext ? {
        framework: request.fileContext.framework || 'unknown',
        routePattern: request.fileContext.routePattern,
        possibleFiles: request.fileContext.possibleFiles,
        componentHints: request.fileContext.componentHints,
      } : undefined,
      viewport: request.viewport ? {
        device: request.viewport.device,
        width: request.viewport.width,
        height: request.viewport.height,
      } : undefined,
      screenshot: request.screenshot,
      userRequest: request.prompt,
    };

    // Add preview action message to chat
    const previewMessage: SystemMessage = {
      id: `preview-${Date.now()}`,
      type: 'system',
      content: `Preview AI Edit: ${request.prompt}`,
      timestamp: new Date().toISOString(),
      metadata: previewMetadata,
    };

    // Add the preview action message to messages first
    setMessages(prev => [...prev, previewMessage]);

    // Build the edit prompt with full context
    const elementDetails = request.elements.map(el =>
      `  - **Element ${el.id}**: \`<${el.tagName}>\` (${el.selector})${el.textContent ? ` - "${el.textContent.slice(0, 50)}${el.textContent.length > 50 ? '...' : ''}"` : ''}`
    ).join('\n');

    let fullPrompt = `🎯 **Preview Edit Request**\n\n`;
    fullPrompt += `**Target URL:** ${request.previewUrl}\n\n`;

    // Add file path context for AI to find the right files
    if (request.fileContext) {
      fullPrompt += `**📁 File Detection:**\n`;
      if (request.fileContext.framework) {
        fullPrompt += `  - Framework: ${request.fileContext.framework}\n`;
        fullPrompt += `  - Routing: ${request.fileContext.routePattern}\n`;
      }
      if (request.fileContext.possibleFiles.length > 0) {
        fullPrompt += `  - Likely source files:\n`;
        request.fileContext.possibleFiles.slice(0, 5).forEach(file => {
          fullPrompt += `    • \`${file}\`\n`;
        });
      }
      if (request.fileContext.componentHints.length > 0) {
        fullPrompt += `  - Component locations: ${request.fileContext.componentHints.join(', ')}\n`;
      }
      fullPrompt += '\n';
    }

    // Add viewport context
    if (request.viewport) {
      fullPrompt += `**📱 Viewport:** ${request.viewport.device} (${request.viewport.width}×${request.viewport.height}px)\n\n`;
    }

    fullPrompt += `**Selected Elements (${request.elements.length}):**\n${elementDetails}\n\n`;

    // Add detailed element info for each selected element
    if (request.elements.length > 0) {
      fullPrompt += `**Element Details:**\n`;
      request.elements.forEach(el => {
        fullPrompt += `  **${el.id}. \`<${el.tagName}>\`**\n`;
        fullPrompt += `    - Selector: \`${el.selector}\`\n`;
        if (el.className) fullPrompt += `    - Class: \`${el.className}\`\n`;
        if (el.elementId) fullPrompt += `    - ID: \`${el.elementId}\`\n`;
        if (el.path) fullPrompt += `    - Path: \`${el.path}\`\n`;
        if (el.textContent) fullPrompt += `    - Text: "${el.textContent.slice(0, 100)}${el.textContent.length > 100 ? '...' : ''}"\n`;
        if (el.styles) {
          fullPrompt += `    - Styles: color=${el.styles.color}, bg=${el.styles.backgroundColor}, font=${el.styles.fontSize}\n`;
        }
      });
      fullPrompt += '\n';
    }

    // Add local data if available
    if (request.localData && Object.keys(request.localData).length > 0) {
      fullPrompt += `**Local Data to Use:**\n`;
      Object.entries(request.localData).forEach(([key, value]) => {
        fullPrompt += `  - ${key}: ${value}\n`;
      });
      fullPrompt += '\n';
    }

    fullPrompt += `**User Request:** ${request.prompt}\n\n`;
    fullPrompt += `Please use the file detection hints above to find and edit the correct source files. Start by reading the suggested files to verify they match the preview content, then make the requested changes.`;

    // If screenshot is available, include it as an image attachment
    const files: FileAttachment[] = [];
    if (request.screenshot) {
      files.push({
        id: `screenshot-${Date.now()}`,
        name: 'screenshot.png',
        type: 'image/png',
        size: request.screenshot.length,
        preview: request.screenshot,
      });
    }

    // Submit the edit request with optional screenshot
    await handleSubmit(files.length > 0 ? files : undefined, 'coder', fullPrompt);
  }, [setMessages, handleSubmit]);

  return {
    handleOpenBuildWizard,
    handleCloseBuildWizard,
    handleSelectTemplate,
    handleQuickAction,
    handleBuildComplete,
    handleAIEditRequest,
  };
}
