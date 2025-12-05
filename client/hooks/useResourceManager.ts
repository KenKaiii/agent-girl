/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * useResourceManager - Smart resource management for optimal performance
 * Handles caching, lazy loading, cleanup of unused resources, and quick loading
 */

import { useCallback, useRef, useEffect } from 'react';

// LRU Cache implementation for efficient memory management
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; lastAccessed: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      item.lastAccessed = Date.now();
      return item.value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    this.cache.set(key, { value, lastAccessed: Date.now() });
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldest(): void {
    let oldestKey: K | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }

  // Get memory usage estimate
  get size(): number {
    return this.cache.size;
  }
}

// Image cache for thumbnails and previews
const imageCache = new LRUCache<string, string>(50);

// API response cache
const apiCache = new LRUCache<string, { data: unknown; timestamp: number }>(100);
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Pending requests tracking to prevent duplicate requests
const pendingRequests = new Map<string, Promise<unknown>>();

export interface ResourceManagerOptions {
  enableImageCaching?: boolean;
  enableApiCaching?: boolean;
  maxImageCacheSize?: number;
  maxApiCacheSize?: number;
  apiCacheTTL?: number;
}

export function useResourceManager(options: ResourceManagerOptions = {}) {
  const {
    enableImageCaching = true,
    enableApiCaching = true,
  } = options;

  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup old cache entries periodically
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      // Clean up expired API cache entries
      const now = Date.now();
      for (const [key, value] of apiCache['cache']) {
        if (now - value.value.timestamp > API_CACHE_TTL) {
          apiCache.delete(key);
        }
      }
    }, 60000); // Run every minute

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  // Cache an image URL and return cached version
  const cacheImage = useCallback((url: string, dataUrl?: string): string | undefined => {
    if (!enableImageCaching) return dataUrl;

    if (dataUrl) {
      imageCache.set(url, dataUrl);
      return dataUrl;
    }

    return imageCache.get(url);
  }, [enableImageCaching]);

  // Get cached image or undefined
  const getCachedImage = useCallback((url: string): string | undefined => {
    if (!enableImageCaching) return undefined;
    return imageCache.get(url);
  }, [enableImageCaching]);

  // Fetch with caching and deduplication
  const fetchWithCache = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    const cacheKey = `${url}${JSON.stringify(options || {})}`;

    // Check cache first
    if (enableApiCaching) {
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
        return cached.data as T;
      }
    }

    // Check if request is already in flight
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey) as Promise<T>;
    }

    // Make the request
    const request = fetch(url, options)
      .then(async (res) => {
        const data = await res.json();

        // Cache the response
        if (enableApiCaching) {
          apiCache.set(cacheKey, { data, timestamp: Date.now() });
        }

        pendingRequests.delete(cacheKey);
        return data as T;
      })
      .catch((error) => {
        pendingRequests.delete(cacheKey);
        throw error;
      });

    pendingRequests.set(cacheKey, request);
    return request;
  }, [enableApiCaching]);

  // Invalidate cache for a specific key pattern
  const invalidateCache = useCallback((pattern?: string) => {
    if (!pattern) {
      apiCache.clear();
      return;
    }
    // Note: Would need to iterate and check pattern matching
    // For simplicity, just clear all for now
    apiCache.clear();
  }, []);

  // Preload an image for quick display
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Could optionally create a data URL here
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }, []);

  // Lazy load multiple images
  const lazyLoadImages = useCallback((urls: string[]): void => {
    // Use Intersection Observer would be ideal, but for now just preload
    urls.slice(0, 5).forEach(url => {
      preloadImage(url).catch(() => {
        // Silently fail on preload errors
      });
    });
  }, [preloadImage]);

  // Get cache statistics for debugging
  const getCacheStats = useCallback(() => {
    return {
      imageCacheSize: imageCache.size,
      apiCacheSize: apiCache.size,
      pendingRequests: pendingRequests.size,
    };
  }, []);

  // Clear all caches (useful when switching sessions)
  const clearAllCaches = useCallback(() => {
    imageCache.clear();
    apiCache.clear();
    pendingRequests.clear();
  }, []);

  return {
    cacheImage,
    getCachedImage,
    fetchWithCache,
    invalidateCache,
    preloadImage,
    lazyLoadImages,
    getCacheStats,
    clearAllCaches,
  };
}

// Singleton cache instances for global access
export const globalImageCache = imageCache;
export const globalApiCache = apiCache;

// Utility: Debounce function for reducing re-renders
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Utility: Throttle function for rate limiting
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Utility: Request idle callback polyfill
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 1);

// Utility: Cancel idle callback polyfill
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);
