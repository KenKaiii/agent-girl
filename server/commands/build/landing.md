# /landing - Complete Landing Page Generator

Generate a complete, niche-optimized landing page with all sections.

## Usage
```
/landing [niche] [name]
```

## Task

1. **Set niche context** based on the industry
2. **Pre-research** the niche for latest trends
3. **Generate complete landing page** with these sections:
   - Hero with unique ID pattern
   - Features/Benefits grid
   - Social proof (testimonials/logos)
   - CTA section
   - Footer

4. **Apply niche-specific optimizations**:
   - Color scheme from preset
   - Trust elements (badges, certifications)
   - Conversion elements (for e-commerce)
   - Compliance elements (for healthcare/fintech)

5. **Output structure**:
   ```
   src/
   ├── components/
   │   ├── Hero.astro
   │   ├── Features.astro
   │   ├── Testimonials.astro
   │   ├── CTA.astro
   │   └── Footer.astro
   ├── pages/
   │   └── index.astro
   └── styles/
       └── global.css (with Tailwind v4)
   ```

6. **Ensure quality**:
   - All unique IDs (no section-1, hero-section patterns)
   - PageSpeed 90+ optimized
   - WCAG 2.1 AA compliant (AAA for healthcare)
   - Mobile-first responsive
   - Dark mode ready
   - SEO meta tags and structured data

## Examples
```
/landing saas "AI Writing Assistant"
/landing healthcare "Dental Clinic Berlin"
/landing ecommerce "Organic Skincare Shop"
```
