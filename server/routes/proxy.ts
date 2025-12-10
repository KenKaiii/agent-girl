/**
 * Proxy Route Handler
 * Proxies external URLs through the same origin to enable iframe DOM access
 * Solves cross-origin restrictions for element selection
 */

import { logger } from "../utils/core/logger";

// Cache for responses to reduce latency
const responseCache = new Map<string, { content: string; contentType: string; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache

/**
 * Rewrite URLs in HTML content to go through proxy
 */
function rewriteUrls(html: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const baseOrigin = base.origin;
  const basePath = base.pathname.replace(/\/[^/]*$/, '');

  // Rewrite src and href attributes to go through proxy
  return html
    // Rewrite absolute URLs on same origin
    .replace(/(src|href)=["'](\/[^"']*?)["']/g, (match, attr, path) => {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(baseOrigin + path)}`;
      return `${attr}="${proxyUrl}"`;
    })
    // Rewrite relative URLs
    .replace(/(src|href)=["'](?!https?:\/\/|\/\/|data:|#|javascript:)([^"']*?)["']/g, (match, attr, path) => {
      if (path.startsWith('/')) {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(baseOrigin + path)}`;
        return `${attr}="${proxyUrl}"`;
      }
      const fullPath = basePath + '/' + path;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(baseOrigin + fullPath)}`;
      return `${attr}="${proxyUrl}"`;
    })
    // Rewrite @import CSS urls
    .replace(/@import\s+["']([^"']+)["']/g, (match, path) => {
      if (path.startsWith('http')) {
        return `@import "/api/proxy?url=${encodeURIComponent(path)}"`;
      }
      if (path.startsWith('/')) {
        return `@import "/api/proxy?url=${encodeURIComponent(baseOrigin + path)}"`;
      }
      return `@import "/api/proxy?url=${encodeURIComponent(baseOrigin + basePath + '/' + path)}"`;
    })
    // Rewrite url() in CSS
    .replace(/url\(["']?(?!data:|#)([^"')]+)["']?\)/g, (match, path) => {
      if (path.startsWith('http')) {
        return `url("/api/proxy?url=${encodeURIComponent(path)}")`;
      }
      if (path.startsWith('/')) {
        return `url("/api/proxy?url=${encodeURIComponent(baseOrigin + path)}")`;
      }
      return `url("/api/proxy?url=${encodeURIComponent(baseOrigin + basePath + '/' + path)}")`;
    });
}

/**
 * Handle proxy requests
 * GET /api/proxy?url=<encoded-url>
 */
export async function handleProxyRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {
  const { pathname } = url;
  const { method } = req;

  // Only handle /api/proxy
  if (pathname !== '/api/proxy') {
    return undefined;
  }

  if (method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
    // Only allow http/https and localhost
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response('Invalid protocol', { status: 400 });
    }
    // Security: Only allow localhost for now
    if (!parsedUrl.hostname.match(/^(localhost|127\.0\.0\.1|\[::1\])$/)) {
      return new Response('Only localhost proxying is allowed', { status: 403 });
    }
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  // Check cache
  const cached = responseCache.get(targetUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(cached.content, {
      headers: {
        'Content-Type': cached.contentType,
        'X-Proxy-Cached': 'true',
      },
    });
  }

  try {
    logger.debug('Proxying request', { url: targetUrl });

    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'AgentGirl/1.0 (Preview Proxy)',
      },
    });

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    let content = await response.text();

    // Rewrite URLs in HTML content
    if (contentType.includes('text/html')) {
      content = rewriteUrls(content, targetUrl);

      // Inject base tag for relative URLs that we might miss
      if (!content.includes('<base')) {
        content = content.replace(
          /<head([^>]*)>/i,
          `<head$1><base href="${parsedUrl.origin}${parsedUrl.pathname.replace(/\/[^/]*$/, '/')}">`,
        );
      }
    }

    // Rewrite URLs in CSS content
    if (contentType.includes('text/css')) {
      content = rewriteUrls(content, targetUrl);
    }

    // Cache the response
    responseCache.set(targetUrl, {
      content,
      contentType,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (responseCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of responseCache) {
        if (now - value.timestamp > CACHE_TTL) {
          responseCache.delete(key);
        }
      }
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Proxy-Original-Url': targetUrl,
      },
    });
  } catch (error) {
    logger.error('Proxy error', { url: targetUrl, error: String(error) });
    return new Response(`Proxy error: ${error}`, { status: 502 });
  }
}
