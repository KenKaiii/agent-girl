/**
 * Lazy loading utilities for heavy components
 * Async preloading during idle time for better perceived performance
 */

// Track preloaded modules
const preloadedModules = new Set<string>();
const preloadPromises = new Map<string, Promise<unknown>>();

/**
 * Schedule preloading during idle time using requestIdleCallback
 */
function scheduleIdlePreload(preloadFn: () => Promise<unknown>, key: string): void {
  if (preloadedModules.has(key) || preloadPromises.has(key)) return;

  const doPreload = () => {
    const promise = preloadFn();
    preloadPromises.set(key, promise);
    promise.then(() => {
      preloadedModules.add(key);
      preloadPromises.delete(key);
    }).catch(() => {
      preloadPromises.delete(key);
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(doPreload, { timeout: 3000 });
  } else {
    // Fallback for Safari
    setTimeout(doPreload, 100);
  }
}

/**
 * Preload heavy components during browser idle time
 * Call this after initial render to warm the cache
 */
export function preloadHeavyComponents(): void {
  // Stagger preloads to avoid blocking
  const components = [
    { fn: () => import('../components/message/MermaidDiagram'), key: 'mermaid' },
    { fn: () => import('../components/message/DiffViewer'), key: 'diff' },
    { fn: () => import('../utils/syntaxHighlighter'), key: 'syntax' },
  ];

  components.forEach(({ fn, key }, index) => {
    // Stagger by 500ms to spread the load
    setTimeout(() => {
      scheduleIdlePreload(fn, key);
    }, index * 500);
  });
}

/**
 * Check if a component is already preloaded
 */
export function isPreloaded(key: string): boolean {
  return preloadedModules.has(key);
}
