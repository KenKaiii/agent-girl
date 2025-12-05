---
description: "Clone and convert website to Astro"
argument-hint: "<url>"
---

# /clone - Website to Astro Conversion

Clone a website and convert it to an optimized Astro project.

## Process

1. **Analyze** - Use `mcp__website2astro__smart_analyze` for strategy
2. **Clone** - Use `mcp__website2astro__clone_full` or `stealth_clone`
3. **Extract Design** - Use `mcp__website2astro__clone_design` for tokens
4. **Convert** - Use `mcp__website2astro__to_astro` for Astro structure
5. **Optimize** - Use `mcp__website2astro__optimize_images` for AVIF/WebP

## MCP Tools Workflow

```
1. mcp__website2astro__smart_analyze → Strategy
2. mcp__website2astro__clone_full → Download site
3. mcp__website2astro__clone_design → Extract colors, fonts
4. mcp__website2astro__to_astro → Convert to Astro
5. mcp__website2astro__optimize_images → Compress images
```

## Output

- Clean Astro 5 project
- Extracted design tokens
- Optimized images (AVIF/WebP)
- Reusable components
- SEO preserved

Execute the full pipeline for the provided URL.
