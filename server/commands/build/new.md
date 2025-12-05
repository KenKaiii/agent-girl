---
description: "Create new Astro 5 project with premium stack"
argument-hint: "[project-name]"
---

# /new - Create Premium Astro Project

Create a new production-ready Astro 5 project with the premium stack.

## Stack Includes

- Astro 5.x with latest features
- TypeScript (strict mode)
- Tailwind CSS v4
- Vitest for testing
- ESLint flat config
- Prettier

## Setup Steps

1. Run: `npm create astro@latest -- [name] --template minimal --typescript strict`
2. Install dependencies: `npm install @astrojs/tailwind vitest @vitest/ui`
3. Configure astro.config.mjs with Tailwind integration
4. Set up vitest.config.ts
5. Create base layout and components

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
├── tailwind.config.mjs
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

Execute the setup and create the project structure.
