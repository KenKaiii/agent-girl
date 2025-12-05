---
description: "Create Starlight documentation site"
argument-hint: "[project-name]"
---

# /docs - Astro Starlight Documentation

Create a documentation site using Astro Starlight.

## Setup Command

```bash
npm create astro@latest -- [name] --template starlight
```

## Starlight Features

- Built-in search (Pagefind)
- Dark/light theme
- i18n support
- TypeScript frontmatter validation
- Sidebar navigation
- Code highlighting

## Project Structure

```
[project]/
├── src/
│   └── content/
│       └── docs/
│           ├── index.mdx
│           ├── getting-started.mdx
│           └── guides/
├── astro.config.mjs
└── package.json
```

## Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      sidebar: [
        { label: 'Getting Started', link: '/getting-started/' },
        { label: 'Guides', autogenerate: { directory: 'guides' } },
      ],
    }),
  ],
});
```

Create the Starlight project and set up the initial structure.
