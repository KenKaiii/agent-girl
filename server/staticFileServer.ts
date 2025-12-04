/**
 * Static File Server Module
 * Handles all static file serving including HTML, CSS, TypeScript, and media files
 */

import path from 'path';
import { sanitizePath } from './utils/pathSecurity';
import { logger } from './utils/logger';

interface StaticFileServerOptions {
  binaryDir: string;
  isStandalone: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postcss: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tailwindcss: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoprefixer: any;
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
  const { binaryDir, isStandalone, postcss, tailwindcss, autoprefixer } = options;
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
      const hotReloadScript = `
        <script>
          (function() {
            const ws = new WebSocket('ws://localhost:3001/hot-reload');
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

        // In dev mode, process CSS with PostCSS
        if (postcss && tailwindcss && autoprefixer) {
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

        // Fallback: serve raw CSS
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

    // In dev mode, process CSS with PostCSS on-the-fly
    if (!isStandalone && postcss && tailwindcss && autoprefixer) {
      const sourceCssPath = path.join(binaryDir, 'client/globals.css');
      const sourceCssFile = Bun.file(sourceCssPath);

      if (await sourceCssFile.exists()) {
        try {
          const cssContent = await sourceCssFile.text();
          const result = await postcss([
            tailwindcss(),
            autoprefixer,
          ]).process(cssContent, {
            from: sourceCssPath,
            to: undefined
          });

          return new Response(result.css, {
            headers: {
              'Content-Type': 'text/css',
            },
          });
        } catch (error) {
          console.error('CSS processing error:', error);
          return new Response('CSS processing failed', { status: 500 });
        }
      }
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
