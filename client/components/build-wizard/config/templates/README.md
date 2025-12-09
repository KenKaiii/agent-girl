# Build Wizard Templates

This directory contains all project templates for the Build Wizard, extracted from the monolithic `buildConfig.ts` into modular, maintainable files.

## Directory Structure

```
templates/
├── README.md                       # This file
├── index.ts                        # Barrel export (64 lines)
├── nextjs.ts                       # 159 lines
├── chrome-wxt.ts                   # 113 lines
├── chrome-plasmo.ts                # 70 lines
├── vite-react.ts                   # 232 lines
├── mcp-server.ts                   # 349 lines
├── discord-bot.ts                  # 362 lines
├── slack-bot.ts                    # 381 lines
├── tauri-desktop.ts                # 405 lines
├── backend-api.ts                  # 449 lines
├── expo-mobile.ts                  # 482 lines
├── shopify-app.ts                  # 367 lines
├── wordpress-plugin.ts             # 328 lines
├── vscode-extension.ts             # 263 lines
├── figma-plugin.ts                 # 286 lines
├── raycast-extension.ts            # 230 lines
├── adobe-uxp-plugin.ts             # 281 lines
├── obsidian-plugin.ts              # 269 lines
└── notion-integration.ts           # 333 lines
```

**Total: 19 files, 5,623 lines of code**

## Template Categories

### Web Applications
- **nextjs.ts** - Full-stack Next.js applications with SSR/SSG
- **vite-react.ts** - Frontend-only React SPAs with Vite

### Browser Extensions
- **chrome-wxt.ts** - Chrome extensions with WXT framework
- **chrome-plasmo.ts** - Chrome extensions with Plasmo framework

### Desktop Applications
- **tauri-desktop.ts** - Cross-platform desktop apps with Tauri

### Mobile Applications
- **expo-mobile.ts** - React Native mobile apps with Expo

### Integrations & Bots
- **mcp-server.ts** - Model Context Protocol servers
- **discord-bot.ts** - Discord bot applications
- **slack-bot.ts** - Slack bot applications
- **notion-integration.ts** - Notion API integrations

### IDE/Editor Extensions
- **vscode-extension.ts** - Visual Studio Code extensions
- **figma-plugin.ts** - Figma plugins
- **raycast-extension.ts** - Raycast extensions
- **adobe-uxp-plugin.ts** - Adobe Creative Cloud plugins
- **obsidian-plugin.ts** - Obsidian knowledge base plugins

### E-commerce & CMS
- **shopify-app.ts** - Shopify app integrations
- **wordpress-plugin.ts** - WordPress plugins

### Backend Services
- **backend-api.ts** - RESTful/GraphQL backend APIs

## File Structure

Each template file follows this structure:

```typescript
import type { ProjectTemplate } from '../types';

export const templateNameTemplate: ProjectTemplate = {
  id: 'unique-id',
  name: 'Display Name',
  description: 'Short description',
  tooltip: 'Detailed tooltip with use cases',
  icon: null,
  gradient: 'linear-gradient(...)',
  command: 'create command',
  commandFlags?: {
    flag: () => 'value',
  },
  features: [
    {
      id: 'feature-id',
      name: 'Feature Name',
      description: 'Feature description',
      tooltip: 'Detailed feature explanation',
      recommended?: true,
      hidden?: true,
      autoBundles?: ['dependency-feature-id'],
      configOptions?: [
        {
          id: 'config-id',
          label: 'Config Label',
          type: 'select' | 'toggle',
          tooltip: 'Config explanation',
          options: [...],
          defaultValue: 'default',
        },
      ],
    },
    // ... more features
  ],
};
```

## Usage

### Import All Templates

```typescript
import { PROJECT_TEMPLATES } from './config/templates';

// Use in component
const templates = PROJECT_TEMPLATES;
```

### Import Specific Template

```typescript
import { nextjsTemplate } from './config/templates';
import { viteReactTemplate } from './config/templates';

// Use directly
const template = nextjsTemplate;
```

### Import by Category (Future Enhancement)

The barrel export can be extended to provide category-based imports:

```typescript
// Not yet implemented, but possible:
import { webTemplates, extensionTemplates } from './config/templates/categories';
```

## Adding New Templates

1. Create a new file: `templates/your-template.ts`
2. Follow the template structure shown above
3. Add import to `index.ts`:
   ```typescript
   import { yourTemplate } from './your-template';
   ```
4. Add to `PROJECT_TEMPLATES` array in `index.ts`
5. Add to re-exports section in `index.ts`

## TypeScript Validation

All templates are type-checked against the `ProjectTemplate` interface from `../types`.

Run TypeScript validation:
```bash
bunx tsc --noEmit
```

## Benefits of Modular Structure

1. **Maintainability**: Each template is in its own file, easy to find and update
2. **Scalability**: Adding new templates doesn't bloat existing files
3. **Type Safety**: Each template is individually type-checked
4. **Code Review**: Changes to one template don't affect others
5. **Reusability**: Templates can be imported individually or as a group
6. **Performance**: Only load templates you need (tree-shaking support)

## Migration Status

✅ **Complete**: All 18 templates extracted and validated
✅ **Type-Safe**: All files pass TypeScript compilation
✅ **Barrel Export**: Single entry point via `index.ts`
⏳ **Pending**: Update `buildConfig.ts` to import from this directory

## Related Files

- `../types.ts` - TypeScript interfaces for templates
- `../buildConfig.ts` - Original monolithic file (to be refactored)
- `../../BuildWizard.tsx` - Main wizard component that uses these templates
