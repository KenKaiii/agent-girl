# /section - Smart Section Generator

Generate a niche-optimized section with unique IDs and modern effects.

## Usage
```
/section [niche] [type]
```

## Parameters
- **niche**: healthcare | fintech | ecommerce | creative | saas | education | realestate | restaurant
- **type**: hero | features | testimonials | cta | pricing | stats | logos | footer

## Examples
```
/section saas hero
/section healthcare features
/section ecommerce pricing
```

## Task

1. **Identify parameters** from the user's input
2. **Apply niche preset**:
   - Healthcare: Blue/green, minimal effects, WCAG AAA
   - Fintech: Navy/gold, glassmorphism, security focus
   - E-commerce: Brand colors, soft shadows, conversion
   - Creative: Vibrant gradients, full animations
   - SaaS: Purple/blue, modern glass, feature-focused
   - Education: Blue/orange, approachable
   - Real Estate: Navy/gold, elegant
   - Restaurant: Warm tones, minimal

3. **Generate unique IDs** using varied patterns:
   - Semantic: `s_a7x3k2`
   - Narrative: `swift-wave-3k`
   - Hash: `_x7k2m9p`
   - Mixed: `sec-3a-bloom`

4. **Apply modern effects**:
   - Soft shadows: `shadow-[0_4px_20px_rgba(0,0,0,0.08)]`
   - Hover lift: `hover:-translate-y-1 transition-all duration-200`
   - Gradients, glassmorphism, or neumorphism based on niche

5. **Output** complete Astro/React component with:
   - TypeScript types
   - Tailwind CSS styling
   - Dark mode support
   - Responsive design
   - Accessibility attributes
