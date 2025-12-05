---
description: "Optimize project for production"
argument-hint: ""
---

# /optimize - Production Optimization

Optimize the current project for production deployment.

## Optimization Steps

### 1. Image Optimization
```
mcp__website2astro__optimize_images
```
- Convert to AVIF/WebP
- Quality: 85 (best balance)
- Expected: 60-80% size reduction

### 2. PageSpeed Optimization
```
mcp__website2astro__optimize_pagespeed
```
- Add defer/async to scripts
- Lazy loading for images
- Preconnect hints

### 3. SEO Optimization
```
mcp__website2astro__audit_seo
mcp__website2astro__generate_schema
```
- Add missing meta tags
- Generate structured data
- Create/update sitemap

### 4. Third-party Analysis
```
mcp__website2astro__analyze_third_party
```
- Identify heavy scripts
- Generate facade components
- Reduce blocking resources

## Target Metrics

- PageSpeed Desktop: 95+
- PageSpeed Mobile: 90+
- LCP: < 2.5s
- CLS: < 0.1
- FID: < 100ms

Run all optimization steps on the current project.
