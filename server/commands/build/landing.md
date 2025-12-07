---
description: "Generate complete niche-optimized landing page"
argument-hint: "[niche] [name]"
---

# /landing - Complete Landing Page Generator

Generate a complete, niche-optimized landing page with all sections using Astro 5 + Tailwind v4.

## Usage
```
/landing [niche] [name]
```

## Task

1. **Create Astro 5 project** (if not exists):
   ```bash
   npm create astro@latest [name] -- --template minimal --typescript strict
   cd [name]
   npx astro add tailwind
   ```

2. **Set niche context** based on the industry

3. **Pre-research** the niche for latest trends (quick web search)

4. **Generate complete landing page** with these sections:
   - Hero with unique ID pattern
   - Features/Benefits grid
   - Social proof (testimonials/logos)
   - CTA section
   - Footer

5. **Apply niche-specific optimizations**:
   - Color scheme from preset
   - Trust elements (badges, certifications)
   - Conversion elements (for e-commerce)
   - Compliance elements (for healthcare/fintech)

6. **Output structure**:
   ```
   src/
   ├── components/
   │   ├── Hero.astro
   │   ├── Features.astro
   │   ├── Testimonials.astro
   │   ├── CTA.astro
   │   └── Footer.astro
   ├── layouts/
   │   └── BaseLayout.astro
   ├── pages/
   │   └── index.astro
   └── styles/
       └── global.css
   ```

7. **global.css content**:
   ```css
   @import "tailwindcss";

   @theme {
     /* Custom design tokens */
   }
   ```

8. **Ensure quality**:
   - All unique IDs (no section-1, hero-section patterns)
   - PageSpeed 90+ optimized
   - WCAG 2.1 AA compliant (AAA for healthcare)
   - Mobile-first responsive
   - Dark mode ready
   - SEO meta tags and structured data

## Niche Presets

| Niche | Colors | Trust Elements |
|-------|--------|----------------|
| saas | Purple/Blue gradients | Stats, integrations |
| healthcare | Blue/Green | HIPAA badge, certifications |
| fintech | Navy/Gold | Security badges, PCI-DSS |
| ecommerce | Brand colors | Reviews, guarantees |
| creative | Vibrant gradients | Portfolio, awards |
| realestate | Navy/Gold | Agent profiles |

## Examples
```
/landing saas "AI Writing Assistant"
/landing healthcare "Dental Clinic Berlin"
/landing ecommerce "Organic Skincare Shop"
/landing creative "Design Studio Munich"
```
