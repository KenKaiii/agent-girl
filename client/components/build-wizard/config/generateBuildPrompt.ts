/**
 * Generate build prompt for project scaffolding
 */

import type { ProjectTemplate } from './types';

export function generateBuildPrompt(
  template: ProjectTemplate,
  projectName: string,
  selectedFeatures: Set<string>,
  configurations: Record<string, string | boolean | number>
): string {
  // AUTO-BUNDLING: Expand selected features with dependencies
  const expandedFeatures = new Set(selectedFeatures);

  selectedFeatures.forEach(fId => {
    const feature = template.features.find(f => f.id === fId);
    if (feature?.autoBundles) {
      feature.autoBundles.forEach(bundledId => expandedFeatures.add(bundledId));
    }
  });

  // Include hidden features
  template.features.forEach(f => {
    if (f.hidden && !f.autoBundles) expandedFeatures.add(f.id);
  });

  const featuresList = Array.from(expandedFeatures)
    .map(fId => {
      const feature = template.features.find(f => f.id === fId);
      if (!feature || feature.hidden) return null;

      const configs = feature.configOptions
        ?.map(opt => {
          const value = configurations[opt.id];
          if (value) {
            return `  - ${opt.label}: ${typeof value === 'string' ? value : (value ? 'Yes' : 'No')}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');

      return `- ${feature.name}${configs ? '\n' + configs : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  // Build command
  let command = `${template.command} ${projectName}`;
  if (template.commandFlags) {
    Object.entries(template.commandFlags).forEach(([flag, buildFlag]) => {
      const value = configurations[flag];
      if (value !== undefined && value !== false) {
        command += ` ${buildFlag(value as string | boolean | number)}`;
      }
    });
  }

  // Build research tasks
  const researchTasks = buildResearchTasks(template, expandedFeatures, configurations);

  // Build auto-bundled features list
  const autoBundled = Array.from(expandedFeatures)
    .filter(fId => {
      const feature = template.features.find(f => f.id === fId);
      return feature && !selectedFeatures.has(fId) && !feature.hidden;
    })
    .map(fId => {
      const feature = template.features.find(f => f.id === fId);
      return `- ${feature?.name} (auto-included for security/functionality)`;
    })
    .filter(Boolean)
    .join('\n') || '(None)';

  // Build features list
  const featuresToImplement = Array.from(expandedFeatures)
    .map(fId => {
      const feature = template.features.find(f => f.id === fId);
      if (!feature || feature.hidden) return '';
      return `- ${feature.name}: ${feature.description}`;
    })
    .filter(Boolean)
    .join('\n');

  return `I want to create a ${template.name} project with the following specifications:

PROJECT NAME: ${projectName}

SELECTED FEATURES:
${featuresList || '(None selected)'}

IMPORTANT: Follow these steps in order:

STEP 1: RESEARCH PHASE (Spawn Parallel build-researcher Agents)
Before building anything, spawn multiple 'build-researcher' agents in parallel to verify the latest setup instructions.

Spawn these build-researcher agents in parallel using the Task tool with subagent_type='build-researcher':

${researchTasks.map((task, i) => `build-researcher Agent ${i + 1}: "${task}"`).join('\n')}

build-researcher Agent ${researchTasks.length + 1}: "latest ${template.command} CLI flags and options"

build-researcher Agent ${researchTasks.length + 2}: "professional folder structure for ${template.name} production projects"

CRITICAL: Wait for ALL build-researcher agents to complete before proceeding.

STEP 2: PROJECT STRUCTURE PLANNING
Based on research, design a professional folder structure following ${template.name} conventions.

STEP 3: INITIALIZE PROJECT
\`\`\`bash
${command}
cd ${projectName}
\`\`\`

STEP 4: INSTALL AND CONFIGURE FEATURES
AUTO-BUNDLED dependencies:
${autoBundled}

Features to implement:
${featuresToImplement}

STEP 5: CONFIGURATION FILES (Spawn config-writer Agents)
Spawn config-writer agents in parallel for tsconfig.json, ESLint, Prettier, .env.example

STEP 6: GIT & HOOKS SETUP

STEP 7: VERIFICATION & ERROR FIXING
If errors occur, spawn a quick-fixer agent.

STEP 8: SUMMARY
Provide what was created, folder structure, commands, and next steps.`;
}

function buildResearchTasks(
  template: ProjectTemplate,
  expandedFeatures: Set<string>,
  configurations: Record<string, string | boolean | number>
): string[] {
  return Array.from(expandedFeatures)
    .map(fId => {
      const feature = template.features.find(f => f.id === fId);
      if (!feature || feature.hidden) return null;
      return getResearchQuery(fId, template, configurations);
    })
    .filter((task): task is string => Boolean(task));
}

function getResearchQuery(
  featureId: string,
  template: ProjectTemplate,
  configurations: Record<string, string | boolean | number>
): string {
  const commonMap: Record<string, string> = {
    'auth': `Latest ${configurations['authProvider'] || 'NextAuth.js'} setup with ${template.name}`,
    'styling': `Current ${configurations['uiLibrary'] || 'shadcn/ui'} installation for ${template.name}`,
    'api': `Latest ${configurations['apiType'] || 'tRPC'} setup with ${template.name}`,
    'code-quality': 'Latest ESLint flat config + Prettier + Husky v9 setup',
    'env-validation': 'Current @t3-oss/env-nextjs or Zod env validation pattern',
    'framework': `Latest ${configurations['uiFramework'] || 'React'} setup with WXT`,
    'routing': 'Current React Router v6 setup patterns',
    'state': `Latest ${configurations['stateLibrary'] || 'Zustand'} integration patterns`,
    'ai-integration': `Latest ${configurations['aiProvider'] || 'Vercel AI SDK'} setup with ${template.name}`,
    'payments': `Latest ${configurations['paymentProvider'] || 'Stripe'} integration with ${template.name}`,
    'email': `Latest ${configurations['emailProvider'] || 'Resend'} setup with ${template.name}`,
    'file-storage': `Latest ${configurations['storageProvider'] || 'UploadThing'} integration`,
    'error-tracking': `Latest Sentry integration for ${template.name}`,
    'ui-library': `Latest ${configurations['componentLib'] || 'shadcn/ui'} installation`,
    'database': `Latest ${configurations['orm'] || 'Prisma'} + ${configurations['dbType'] || 'PostgreSQL'} setup`,
    'testing': `Current ${configurations['testingTools'] || 'Vitest + Playwright'} configuration`,
    'deployment': `Latest ${configurations['deployTarget'] || 'Vercel'} deployment config`,
    'transport': `Latest MCP ${configurations['transportType'] || 'STDIO'} transport patterns`,
    'capabilities': 'Current MCP SDK patterns for tools, resources, and prompts',
    'popup': 'Latest Chrome extension popup implementation patterns',
    'content-script': 'Current content script injection patterns',
    'background': 'Latest service worker patterns for extensions',
    'storage': 'Current Chrome storage API patterns',
    'slash-commands': `Latest ${template.id === 'discord-bot' ? 'Discord.js v14' : 'Slack Bolt'} slash command patterns`,
    'interactions': 'Current Discord.js button and modal patterns',
    'events': `Best practices for ${template.id} event handlers`,
    'permissions': 'Latest permission checking patterns',
    'logging': `Latest ${configurations['logLevel'] || 'console'} logging setup`,
    'frontend-framework': `Latest Tauri 2.0 setup with ${configurations['framework'] || 'React'}`,
    'tauri-features': 'Current Tauri plugin patterns',
    'window-config': 'Best practices for Tauri window configuration',
    'updater': 'Latest Tauri updater plugin setup',
    'ipc-patterns': 'Current Tauri IPC patterns',
    'security': 'Latest Tauri security configuration',
    'packaging': 'Current Tauri build configuration',
    'runtime': `Latest Hono setup for ${configurations['runtime'] || 'Bun'}`,
    'api-docs': `Latest ${configurations['docsType'] || 'OpenAPI'} documentation setup`,
    'middleware': 'Current Hono middleware patterns',
    'template-type': `Latest Expo ${configurations['templateType'] || 'blank-typescript'} template`,
    'navigation': `Current ${configurations['navigation'] || 'expo-router'} setup patterns`,
    'ui-styling': `Latest ${configurations['uiLibrary'] || 'NativeWind'} setup for Expo`,
    'state-management': `Current ${configurations['stateLibrary'] || 'Zustand'} for React Native`,
    'native-features': 'Best practices for Expo native features',
    'backend-integration': `Latest ${configurations['backendType'] || 'Supabase'} integration for Expo`,
    'analytics': `Current ${configurations['analyticsProvider'] || 'PostHog'} setup`,
  };

  return commonMap[featureId] || '';
}
