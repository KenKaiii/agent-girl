/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Custom hook for responsive breakpoints and window size detection
 */

import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;      // < 640px
  isTablet: boolean;      // 640px - 1024px
  isDesktop: boolean;     // > 1024px
  isLargeDesktop: boolean; // > 1440px
  width: number;
  height: number;
}

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  largeDesktop: 1440,
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        width: 1200,
        height: 800,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      isLargeDesktop: width >= BREAKPOINTS.largeDesktop,
      width,
      height,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
        isLargeDesktop: width >= BREAKPOINTS.largeDesktop,
        width,
        height,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

// Hook for detecting if sidebar should auto-collapse
export function useSidebarAutoCollapse(
  isOpen: boolean,
  onToggle: () => void
): void {
  const { isMobile } = useResponsive();

  useEffect(() => {
    // Auto-collapse sidebar when switching to mobile
    if (isMobile && isOpen) {
      onToggle();
    }
  }, [isMobile]); // Only trigger on breakpoint change, not on isOpen/onToggle changes
}
