/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createContext, useContext, ReactNode, useCallback, useRef } from 'react';

interface PreviewContextValue {
  /** Set the preview URL and optionally open the preview panel */
  setPreviewUrl: (url: string | null) => void;
  /** Open preview with a specific URL */
  openPreview: (url: string) => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

interface PreviewProviderProps {
  children: ReactNode;
  onSetPreviewUrl?: (url: string | null) => void;
  onOpenPreview?: (url: string) => void;
}

export function PreviewProvider({
  children,
  onSetPreviewUrl,
  onOpenPreview,
}: PreviewProviderProps) {
  // Track last URL to avoid duplicate opens
  const lastUrlRef = useRef<string | null>(null);

  const setPreviewUrl = useCallback((url: string | null) => {
    if (onSetPreviewUrl) {
      onSetPreviewUrl(url);
    }
  }, [onSetPreviewUrl]);

  const openPreview = useCallback((url: string) => {
    // Avoid opening the same URL twice in quick succession
    if (url === lastUrlRef.current) {
      return;
    }
    lastUrlRef.current = url;

    if (onOpenPreview) {
      onOpenPreview(url);
    } else if (onSetPreviewUrl) {
      onSetPreviewUrl(url);
    }

    // Reset after 2 seconds to allow re-opening
    setTimeout(() => {
      if (lastUrlRef.current === url) {
        lastUrlRef.current = null;
      }
    }, 2000);
  }, [onSetPreviewUrl, onOpenPreview]);

  return (
    <PreviewContext.Provider value={{ setPreviewUrl, openPreview }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  const context = useContext(PreviewContext);
  if (!context) {
    // Return no-op functions if not wrapped in provider
    return {
      setPreviewUrl: () => {},
      openPreview: () => {},
    };
  }
  return context;
}
