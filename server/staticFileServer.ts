/**
 * Static File Server Module
 * Handles all static file serving including HTML, CSS, TypeScript, and media files
 */

import path from 'path';
import { sanitizePath } from './utils/core/pathSecurity';
import { logger } from './utils/core/logger';

interface StaticFileServerOptions {
  binaryDir: string;
  isStandalone: boolean;
}

// Lazy-loaded PostCSS modules (to avoid loading @tailwindcss/oxide at startup)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let postcssCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tailwindcssCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let autoprefixerCache: any = null;
let postcssLoaded = false;

/**
 * Lazy-load PostCSS and its plugins on first CSS request
 * This avoids loading @tailwindcss/oxide native bindings at startup,
 * which causes 100% CPU due to file watcher initialization
 */
async function getPostCSS(): Promise<{ postcss: any; tailwindcss: any; autoprefixer: any } | null> {
  if (postcssLoaded) {
    return postcssCache ? { postcss: postcssCache, tailwindcss: tailwindcssCache, autoprefixer: autoprefixerCache } : null;
  }

  postcssLoaded = true;

  try {
    logger.debug('Lazy-loading PostCSS for CSS processing...');
    postcssCache = (await import('postcss')).default;
    tailwindcssCache = (await import('@tailwindcss/postcss')).default;
    autoprefixerCache = (await import('autoprefixer')).default;
    logger.debug('PostCSS loaded successfully');
    return { postcss: postcssCache, tailwindcss: tailwindcssCache, autoprefixer: autoprefixerCache };
  } catch (error) {
    logger.error('Failed to load PostCSS', { error });
    return null;
  }
}

/**
 * Validate and resolve a file path, preventing path traversal attacks
 */
function resolveSecurePath(basePath: string, requestPath: string): string | null {
  // Remove leading slash and decode URI components
  const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, '');

  // Use sanitizePath to prevent traversal
  const resolved = sanitizePath(cleanPath, basePath);

  if (!resolved) {
    logger.warn('Path traversal attempt blocked', { requestPath, basePath });
    return null;
  }

  return resolved;
}

/**
 * Handles static file requests
 * Returns Response if the request was handled, undefined otherwise
 */
export async function handleStaticFile(
  req: Request,
  options: StaticFileServerOptions
): Promise<Response | undefined> {
  const { binaryDir, isStandalone } = options;
  const url = new URL(req.url);

  // Serve index.html
  if (url.pathname === '/') {
    const file = Bun.file(path.join(binaryDir, 'client/index.html'));
    let html = await file.text();

    // In standalone mode, replace raw tsx with pre-built bundle
    if (isStandalone) {
      html = html.replace('/client/index.tsx', '/dist/index.js');
    } else {
      // Inject hot reload script only in dev mode
      // Uses window.location.host to automatically use the correct port
      const hotReloadScript = `
        <script>
          (function() {
            const ws = new WebSocket('ws://' + window.location.host + '/hot-reload');
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              if (data.type === 'reload') {
                window.location.reload();
              }
            };
            ws.onclose = () => {
              setTimeout(() => window.location.reload(), 1000);
            };
          })();
        </script>
      `;

      html = html.replace('</body>', `${hotReloadScript}</body>`);
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  // Serve CSS files from client directory
  if (url.pathname.startsWith('/client/') && url.pathname.endsWith('.css')) {
    const filePath = resolveSecurePath(binaryDir, url.pathname);
    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }
    const file = Bun.file(filePath);

    if (await file.exists()) {
      try {
        const cssContent = await file.text();

        // In standalone mode, CSS is pre-built - serve directly
        if (isStandalone) {
          return new Response(cssContent, {
            headers: {
              'Content-Type': 'text/css',
            },
          });
        }

        // In dev mode, process CSS with PostCSS (lazy-loaded)
        const postcssModules = await getPostCSS();
        if (postcssModules) {
          const { postcss, tailwindcss, autoprefixer } = postcssModules;
          const result = await postcss([
            tailwindcss(),
            autoprefixer,
          ]).process(cssContent, {
            from: filePath,
            to: undefined
          });

          return new Response(result.css, {
            headers: {
              'Content-Type': 'text/css',
            },
          });
        }

        // Fallback: serve raw CSS (PostCSS not available)
        return new Response(cssContent, {
          headers: {
            'Content-Type': 'text/css',
          },
        });
      } catch {
        return new Response('CSS processing failed', { status: 500 });
      }
    }
  }

  // Serve pre-built globals.css
  if (url.pathname === '/dist/globals.css') {
    const distCssPath = path.join(binaryDir, 'dist/globals.css');
    const distCssFile = Bun.file(distCssPath);

    // In standalone mode or if built CSS exists, serve it directly
    if (await distCssFile.exists()) {
      return new Response(distCssFile, {
        headers: {
          'Content-Type': 'text/css',
        },
      });
    }

    // In dev mode, serve raw CSS directly (PostCSS/Tailwind v4 hangs on M4 Mac)
    // Build CSS using `bun run build:css` for full Tailwind support
    if (!isStandalone) {
      const sourceCssPath = path.join(binaryDir, 'client/globals.css');
      const sourceCssFile = Bun.file(sourceCssPath);

      if (await sourceCssFile.exists()) {
        const cssContent = await sourceCssFile.text();
        logger.debug('Serving raw CSS (no PostCSS processing)');

        return new Response(cssContent, {
          headers: {
            'Content-Type': 'text/css',
          },
        });
      }
    }
  }

  // Serve local Tailwind runtime
  if (url.pathname === '/dist/tailwind.min.js') {
    const filePath = path.join(binaryDir, 'dist/tailwind.min.js');
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    }
  }

  // Serve pre-built bundle in standalone mode
  if (isStandalone && url.pathname === '/dist/index.js') {
    const filePath = path.join(binaryDir, 'dist/index.js');
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          'Content-Type': 'application/javascript',
        },
      });
    }
  }

  // Transpile TypeScript on-the-fly (dev mode only)
  if (!isStandalone && url.pathname.startsWith('/client/') && (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts'))) {
    const filePath = resolveSecurePath(binaryDir, url.pathname);
    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }
    const file = Bun.file(filePath);

    if (await file.exists()) {
      try {
        const transpiled = await Bun.build({
          entrypoints: [filePath],
          target: 'browser',
          format: 'esm',
        });

        if (transpiled.success) {
          const jsCode = await transpiled.outputs[0].text();
          return new Response(jsCode, {
            headers: {
              'Content-Type': 'application/javascript',
            },
          });
        } else {
          console.error('Build failed for', filePath);
          console.error(transpiled.logs);
          return new Response(`Transpilation failed: ${transpiled.logs.join('\n')}`, { status: 500 });
        }
      } catch (error) {
        console.error('Transpilation error:', error);
        return new Response(`Transpilation error: ${error}`, { status: 500 });
      }
    }
  }

  // Serve MP3 files
  if (url.pathname.endsWith('.mp3')) {
    const filePath = resolveSecurePath(binaryDir, url.pathname);
    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      });
    }
  }

  // Serve SVG files
  if (url.pathname.startsWith('/client/') && url.pathname.endsWith('.svg')) {
    const filePath = resolveSecurePath(binaryDir, url.pathname);
    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      });
    }
  }

  // Not handled by this module
  return undefined;
}
