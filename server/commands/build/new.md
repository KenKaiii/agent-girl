---
description: "Create new Astro 5 project with premium stack"
argument-hint: "[project-name]"
---

# /new - Create Premium Astro 5 Project

Create a new production-ready Astro 5.x project with the 2025 premium stack.

## Stack Includes

- **Astro 5.x** with Content Layer API & Server Islands
- **TypeScript** (strict mode)
- **Tailwind CSS v4** via Vite plugin (NOT @astrojs/tailwind)
- **Vitest** for testing
- **ESLint** flat config + Prettier

## Quick Setup (One Command)

```bash
# Create project with Astro CLI
npm create astro@latest [name] -- --template minimal --typescript strict

# Enter project
cd [name]

# Add Tailwind v4 (Astro 5.2+ native support)
npx astro add tailwind

# Add testing
npm install -D vitest @vitest/ui
```

## Manual Setup (if needed)

### 1. Create Project
```bash
npm create astro@latest [name] -- --template minimal --typescript strict
cd [name]
```

### 2. Install Tailwind v4
```bash
npm install -D @tailwindcss/vite
```

### 3. Configure astro.config.mjs
```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 4. Create src/styles/global.css
```css
@import "tailwindcss";
```

### 5. Import in Layout
```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';
---
```

## Optional: Cloudflare Deployment

```bash
# Add Cloudflare adapter
npx astro add cloudflare

# Creates wrangler.jsonc automatically
```

## Project Structure

```
[project]/
├── src/
│   ├── components/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── public/
├── tests/
├── astro.config.mjs
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

## After Setup

1. Start dev server: `npm run dev`
2. Build: `npm run build`
3. Preview: `npm run preview`

Execute the setup and create the project structure.
