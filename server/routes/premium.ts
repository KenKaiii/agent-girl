/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Premium Builder API - $10,000 Website Builder endpoints
 * Handles premium build workflows, smart decomposition, and exports
 */

import { randomUUID } from 'crypto';
import path from 'path';
import {
  generateDecompositionPlan,
  parseEditCommand,
  generateFullPageContent,
  exportProject,
  deployProject,
  validateBeforeExport,
  type DecompositionPlan,
  type BusinessInfo,
  type ExportConfig,
  type DeployConfig,
  type EditCommand,
} from '../utils/premium';
import {
  DESIGN_SYSTEMS,
  getDesignSystem,
  getAllDesignSystems,
} from '../presets/design-systems';
import {
  NICHE_CONFIGS,
  getNiche,
  getAllNiches,
  detectNiche,
  type NicheConfig,
} from '../presets/niches';
import { premiumBuildLimiter, premiumEditLimiter } from '../utils/api/rateLimiter';

// Helper to create JSON response (matching build.ts pattern)
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// Security: Input Sanitization
// ============================================================================

const PROJECTS_BASE_PATH = '/Users/master/Projects';
const MAX_PROJECT_NAME_LENGTH = 50;

/**
 * Sanitize business name for use as project directory name
 * Prevents path traversal attacks and ensures safe filesystem operations
 */
function sanitizeProjectName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'unnamed-project';
  }

  // Normalize and sanitize: only allow lowercase alphanumeric and hyphens
  const safeName = name
    .toLowerCase()
    .normalize('NFKD')                          // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '')            // Remove diacritics
    .replace(/[^a-z0-9-]/g, '-')                // Replace unsafe chars with hyphen
    .replace(/-+/g, '-')                        // Collapse multiple hyphens
    .replace(/^-|-$/g, '')                      // Remove leading/trailing hyphens
    .slice(0, MAX_PROJECT_NAME_LENGTH);         // Length limit

  return safeName || 'unnamed-project';
}

/**
 * Create a safe project path within the base directory
 * Validates that the resulting path stays within PROJECTS_BASE_PATH
 */
function createSafeProjectPath(businessName: string): string {
  const safeName = sanitizeProjectName(businessName);
  const fullPath = path.resolve(PROJECTS_BASE_PATH, safeName);

  // Security check: ensure path stays within base directory
  if (!fullPath.startsWith(PROJECTS_BASE_PATH)) {
    throw new Error('Invalid project path: path traversal detected');
  }

  return fullPath;
}

/**
 * Extract client identifier from request for rate limiting
 * Uses X-Forwarded-For header or falls back to a hash of user-agent
 */
function getClientId(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Get first IP in chain
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  const userAgent = req.headers.get('user-agent') || 'unknown';
  // Simple hash for user-agent based identification
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    hash = ((hash << 5) - hash) + userAgent.charCodeAt(i);
    hash |= 0;
  }
  return `ua:${hash}`;
}

// Store active premium builds
interface PremiumBuildState {
  id: string;
  sessionId: string;
  status: 'analyzing' | 'planning' | 'building' | 'complete' | 'error';
  plan?: DecompositionPlan;
  currentStep: number;
  totalSteps: number;
  currentPhase?: string;
  projectPath?: string;
  previewUrl?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  businessInfo?: BusinessInfo;
  nicheId?: string;
  designSystemId?: string;
  cost: {
    tokens: number;
    apiCalls: number;
    estimatedUSD: number;
  };
}

const activePremiumBuilds = new Map<string, PremiumBuildState>();

// Premium Routes Handler (following server.ts pattern)
export async function handlePremiumRoutes(
  req: Request,
  url: URL
): Promise<Response | null> {
  const path = url.pathname;

  // POST /api/premium/analyze - Analyze business input
  if (path === '/api/premium/analyze' && req.method === 'POST') {
    return await handleAnalyze(req);
  }

  // POST /api/premium/start-build - Start 100-step build
  if (path === '/api/premium/start-build' && req.method === 'POST') {
    return await handleStartBuild(req);
  }

  // GET /api/premium/build-status/:id - Get build progress
  if (path.startsWith('/api/premium/build-status/') && req.method === 'GET') {
    const buildId = path.replace('/api/premium/build-status/', '');
    return handleBuildStatus(buildId);
  }

  // POST /api/premium/edit - Quick edit command
  if (path === '/api/premium/edit' && req.method === 'POST') {
    return await handleEdit(req);
  }

  // POST /api/premium/regenerate - Regenerate content
  if (path === '/api/premium/regenerate' && req.method === 'POST') {
    return await handleRegenerate(req);
  }

  // POST /api/premium/export - Export project
  if (path === '/api/premium/export' && req.method === 'POST') {
    return await handleExport(req);
  }

  // POST /api/premium/deploy - Deploy project
  if (path === '/api/premium/deploy' && req.method === 'POST') {
    return await handleDeploy(req);
  }

  // GET /api/premium/templates - List design systems
  if (path === '/api/premium/templates' && req.method === 'GET') {
    return handleListTemplates();
  }

  // GET /api/premium/niches - List niches
  if (path === '/api/premium/niches' && req.method === 'GET') {
    return handleListNiches();
  }

  // GET /api/premium/builds - List all active builds
  if (path === '/api/premium/builds' && req.method === 'GET') {
    return handleListBuilds();
  }

  return null;
}

/**
 * POST /api/premium/analyze
 * Analyzes business description and suggests niche + design system
 */
async function handleAnalyze(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { description } = body;

    if (!description) {
      return jsonResponse({ error: 'Missing description field' }, 400);
    }

    // Auto-detect niche from description
    const detectedNicheConfig = detectNiche(description);
    const nicheConfig = detectedNicheConfig || getNiche('agency');

    if (!nicheConfig) {
      return jsonResponse({ error: 'Could not detect or find niche' }, 500);
    }

    // Suggest design systems based on niche
    const suggestedDesignSystems = getSuggestedDesignSystems(nicheConfig.id);

    // Generate questions for missing info
    const missingInfo = analyzeInfoGaps(description, nicheConfig);

    return jsonResponse({
      success: true,
      analysis: {
        detectedNiche: {
          id: nicheConfig.id,
          name: nicheConfig.name,
          confidence: calculateConfidence(description, nicheConfig),
        },
        suggestedDesignSystems,
        keywords: extractKeywords(description),
        recommendedDesignSystem: nicheConfig.recommendedDesignSystem,
      },
      missingInfo,
      recommendations: {
        designSystem: suggestedDesignSystems[0]?.id || 'modern',
        sections: nicheConfig.sections,
        seoFocus: nicheConfig.seo,
      },
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, 500);
  }
}

/**
 * POST /api/premium/start-build
 * Initiates 100-step website build
 */
async function handleStartBuild(req: Request): Promise<Response> {
  try {
    // Rate limit check - builds are expensive operations
    const clientId = getClientId(req);
    if (!premiumBuildLimiter.canProceed(clientId)) {
      const remainingMs = premiumBuildLimiter.getBlockedTimeRemaining(clientId);
      return jsonResponse({
        error: 'Rate limit exceeded',
        message: 'Too many build requests. Please wait before starting another build.',
        retryAfterMs: remainingMs || 60000,
      }, 429);
    }

    const body = await req.json();
    const {
      sessionId,
      businessInfo,
      nicheId,
      designSystemId,
      features = [],
      pages = ['index'],
      integrations = [],
    } = body;

    if (!sessionId || !businessInfo) {
      return jsonResponse({
        error: 'Missing required fields: sessionId, businessInfo'
      }, 400);
    }

    // Validate businessInfo
    if (!businessInfo.name || !businessInfo.description) {
      return jsonResponse({
        error: 'businessInfo must include name and description'
      }, 400);
    }

    const buildId = randomUUID();

    // Detect niche if not provided
    let resolvedNicheId = nicheId;
    if (!resolvedNicheId) {
      const detected = detectNiche(businessInfo.description);
      resolvedNicheId = detected?.id || 'agency';
    }

    const resolvedDesignId = designSystemId || 'modern';

    // Generate decomposition plan using the WebsiteProject interface
    const plan = generateDecompositionPlan({
      id: buildId,
      businessDescription: businessInfo.description,
      nicheId: resolvedNicheId,
      designSystemId: resolvedDesignId,
      hasExistingContent: false,
      features,
      pages,
      integrations,
    });

    // Initialize build state
    const buildState: PremiumBuildState = {
      id: buildId,
      sessionId,
      status: 'planning',
      plan,
      currentStep: 0,
      totalSteps: plan.totalSteps,
      currentPhase: plan.phases[0]?.name,
      projectPath: createSafeProjectPath(businessInfo.name),
      startedAt: new Date(),
      businessInfo,
      nicheId: resolvedNicheId,
      designSystemId: resolvedDesignId,
      cost: {
        tokens: 0,
        apiCalls: 0,
        estimatedUSD: 0,
      },
    };

    activePremiumBuilds.set(buildId, buildState);

    return jsonResponse({
      success: true,
      buildId,
      plan: {
        projectId: plan.projectId,
        totalSteps: plan.totalSteps,
        phases: plan.phases.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          stepRange: p.stepRange,
        })),
        estimatedDuration: plan.estimatedDuration,
        estimatedCost: plan.estimatedCost,
      },
      message: 'Build plan created. Use WebSocket for real-time progress.',
    });
  } catch (error) {
    console.error('Start build error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to start build'
    }, 500);
  }
}

/**
 * GET /api/premium/build-status/:id
 * Returns current build progress
 */
function handleBuildStatus(buildId: string): Response {
  const build = activePremiumBuilds.get(buildId);

  if (!build) {
    return jsonResponse({ error: 'Build not found' }, 404);
  }

  return jsonResponse({
    buildId: build.id,
    status: build.status,
    progress: {
      currentStep: build.currentStep,
      totalSteps: build.totalSteps,
      percentage: Math.round((build.currentStep / build.totalSteps) * 100),
      currentPhase: build.currentPhase,
    },
    projectPath: build.projectPath,
    previewUrl: build.previewUrl,
    cost: build.cost,
    startedAt: build.startedAt,
    completedAt: build.completedAt,
    error: build.error,
  });
}

/**
 * POST /api/premium/edit
 * Execute quick edit command
 */
async function handleEdit(req: Request): Promise<Response> {
  try {
    // Rate limit check for edit operations
    const clientId = getClientId(req);
    if (!premiumEditLimiter.canProceed(clientId)) {
      const remainingMs = premiumEditLimiter.getBlockedTimeRemaining(clientId);
      return jsonResponse({
        error: 'Rate limit exceeded',
        message: 'Too many edit requests. Please slow down.',
        retryAfterMs: remainingMs || 10000,
      }, 429);
    }

    const body = await req.json();
    const { buildId, command } = body;

    if (!buildId || !command) {
      return jsonResponse({
        error: 'Missing required fields: buildId, command'
      }, 400);
    }

    const build = activePremiumBuilds.get(buildId);
    if (!build) {
      return jsonResponse({ error: 'Build not found' }, 404);
    }

    // Parse natural language command
    const parsed: EditCommand | null = parseEditCommand(command);

    if (!parsed) {
      return jsonResponse({
        error: 'Could not parse command',
        suggestions: [
          'Try: "change headline to Welcome"',
          'Try: "make button blue"',
          'Try: "add testimonials section"',
        ],
      }, 400);
    }

    // Update cost tracking
    build.cost.apiCalls++;

    return jsonResponse({
      success: true,
      parsedCommand: {
        type: parsed.type,
        target: parsed.parsed.target,
        value: parsed.parsed.value,
      },
      message: 'Command parsed successfully. Execute via WebSocket for real-time updates.',
    });
  } catch (error) {
    console.error('Edit error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Edit failed'
    }, 500);
  }
}

/**
 * POST /api/premium/regenerate
 * Regenerate content section
 */
async function handleRegenerate(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { buildId, section, instructions } = body;

    if (!buildId || !section) {
      return jsonResponse({
        error: 'Missing required fields: buildId, section'
      }, 400);
    }

    const build = activePremiumBuilds.get(buildId);
    if (!build) {
      return jsonResponse({ error: 'Build not found' }, 404);
    }

    if (!build.businessInfo) {
      return jsonResponse({ error: 'No business info for regeneration' }, 400);
    }

    // Get niche config for content generation
    const nicheConfig = getNiche(build.nicheId || 'agency');

    if (!nicheConfig) {
      return jsonResponse({ error: 'Invalid niche configuration' }, 500);
    }

    // Generate new content based on section
    const newContent = await generateFullPageContent(
      build.businessInfo,
      build.nicheId || 'agency',
      build.designSystemId || 'modern',
      {
        language: 'de',
        tone: 'professional',
        style: 'modern',
        length: 'standard',
        includeCallToAction: true,
      }
    );

    // Update cost
    build.cost.apiCalls++;
    build.cost.tokens += 1000; // Estimate

    return jsonResponse({
      success: true,
      content: newContent[section as keyof typeof newContent] || newContent,
      message: `${section} content regenerated`,
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Regeneration failed'
    }, 500);
  }
}

/**
 * POST /api/premium/export
 * Export project in specified format
 */
async function handleExport(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { buildId, format = 'astro', optimize = true } = body;

    if (!buildId) {
      return jsonResponse({ error: 'Missing buildId' }, 400);
    }

    const build = activePremiumBuilds.get(buildId);
    if (!build) {
      return jsonResponse({ error: 'Build not found' }, 404);
    }

    if (!build.projectPath) {
      return jsonResponse({ error: 'Project not yet built' }, 400);
    }

    // Validate before export
    const validation = await validateBeforeExport(build.projectPath);
    const criticalChecks = validation.checks.filter(c => !c.passed && c.severity === 'error');
    if (criticalChecks.length > 0) {
      return jsonResponse({
        error: 'Project has critical issues',
        validation,
      }, 400);
    }

    // Build export config
    const exportConfig: ExportConfig = {
      format: format as ExportConfig['format'],
      outputDir: `${build.projectPath}/dist`,
      projectName: build.businessInfo?.name || 'website',
      optimize: {
        images: optimize,
        css: optimize,
        js: optimize,
        html: optimize,
      },
      include: {
        sourceCode: format === 'astro',
        assets: true,
        config: true,
        readme: true,
      },
    };

    // Export project
    const result = await exportProject(build.projectPath, exportConfig);

    return jsonResponse({
      success: result.success,
      format: result.format,
      outputPath: result.outputPath,
      size: result.size,
      fileCount: result.fileCount,
      downloadUrl: result.downloadUrl,
      warnings: validation.checks.filter(c => !c.passed).map(c => c.message),
    });
  } catch (error) {
    console.error('Export error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Export failed'
    }, 500);
  }
}

/**
 * POST /api/premium/deploy
 * Deploy project to platform
 */
async function handleDeploy(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { buildId, platform, customDomain, envVars } = body;

    if (!buildId || !platform) {
      return jsonResponse({
        error: 'Missing required fields: buildId, platform'
      }, 400);
    }

    const build = activePremiumBuilds.get(buildId);
    if (!build) {
      return jsonResponse({ error: 'Build not found' }, 404);
    }

    if (!build.projectPath) {
      return jsonResponse({ error: 'Project not yet built' }, 400);
    }

    // Build deploy config
    const deployConfig: DeployConfig = {
      platform: platform as DeployConfig['platform'],
      projectName: sanitizeProjectName(build.businessInfo?.name || 'website'),
      environment: 'production',
      customDomain,
      envVars,
    };

    // Deploy to platform
    const result = await deployProject(build.projectPath, deployConfig);

    // Update build with deployed URL
    if (result.success && result.url) {
      build.previewUrl = result.url;
    }

    return jsonResponse({
      success: result.success,
      platform: result.platform,
      url: result.url,
      status: result.status,
      deployId: result.deployId,
      logs: result.logs,
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Deployment failed'
    }, 500);
  }
}

/**
 * GET /api/premium/templates
 * List all design systems
 */
function handleListTemplates(): Response {
  const templates = getAllDesignSystems().map(ds => ({
    id: ds.id,
    name: ds.name,
    description: ds.description,
    preview: ds.preview,
    colors: {
      primary: ds.colors.primary,
      secondary: ds.colors.secondary,
      accent: ds.colors.accent,
    },
    bestFor: ds.bestFor,
  }));

  return jsonResponse({ templates });
}

/**
 * GET /api/premium/niches
 * List all niche configurations
 */
function handleListNiches(): Response {
  const niches = getAllNiches().map(nc => ({
    id: nc.id,
    name: nc.name,
    description: nc.description,
    keywords: nc.keywords.slice(0, 5),
    recommendedDesignSystem: nc.recommendedDesignSystem,
    sectionCount: nc.sections.required.length + nc.sections.optional.length,
  }));

  return jsonResponse({ niches });
}

/**
 * GET /api/premium/builds
 * List all active builds
 */
function handleListBuilds(): Response {
  const builds = Array.from(activePremiumBuilds.values()).map(b => ({
    id: b.id,
    sessionId: b.sessionId,
    status: b.status,
    progress: Math.round((b.currentStep / b.totalSteps) * 100),
    currentPhase: b.currentPhase,
    projectPath: b.projectPath,
    startedAt: b.startedAt,
    completedAt: b.completedAt,
  }));

  return jsonResponse({ builds, count: builds.length });
}

// Helper functions

function getSuggestedDesignSystems(nicheId: string): Array<{ id: string; name: string; description: string }> {
  const nicheToDesign: Record<string, string[]> = {
    'medical': ['minimal', 'modern'],
    'restaurant': ['modern', 'minimal'],
    'handwerk': ['modern', 'minimal'],
    'legal': ['minimal', 'modern'],
    'realestate': ['modern', 'minimal'],
    'ecommerce': ['modern', 'minimal'],
    'agency': ['modern', 'minimal'],
    'fitness': ['modern', 'minimal'],
    'coaching': ['minimal', 'modern'],
    'event': ['modern', 'minimal'],
  };

  const suggested = nicheToDesign[nicheId] || ['modern', 'minimal'];
  return suggested.map(id => {
    const ds = getDesignSystem(id);
    if (!ds) {
      return { id, name: id, description: '' };
    }
    return {
      id: ds.id,
      name: ds.name,
      description: ds.description,
    };
  });
}

function calculateConfidence(description: string, nicheConfig: NicheConfig): number {
  const lowerDesc = description.toLowerCase();
  const matchedKeywords = nicheConfig.keywords.filter((k: string) =>
    lowerDesc.includes(k.toLowerCase())
  );
  return Math.min(0.95, 0.3 + (matchedKeywords.length * 0.15));
}

function extractKeywords(description: string): string[] {
  // Simple keyword extraction
  const words = description.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Return unique words with some frequency
  const wordCount = new Map<string, number>();
  words.forEach(w => wordCount.set(w, (wordCount.get(w) || 0) + 1));

  return Array.from(wordCount.entries())
    .filter(([_, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function analyzeInfoGaps(description: string, nicheConfig: NicheConfig) {
  const gaps: Array<{ field: string; question: string; importance: 'high' | 'medium' | 'low' }> = [];

  // Check for common missing info
  if (!description.includes('@') && !description.includes('email')) {
    gaps.push({
      field: 'email',
      question: 'Was ist Ihre Kontakt-E-Mail?',
      importance: 'high',
    });
  }

  if (!description.match(/\d{2,}/)) {
    gaps.push({
      field: 'phone',
      question: 'Was ist Ihre Telefonnummer?',
      importance: 'high',
    });
  }

  if (!description.match(/straße|str\.|weg|platz|allee/i)) {
    gaps.push({
      field: 'address',
      question: 'Was ist Ihre Geschäftsadresse?',
      importance: 'medium',
    });
  }

  return gaps;
}

// ============================================================================
// Memory Management - Cleanup Functions
// ============================================================================

/**
 * Remove completed/errored builds older than maxAge
 * Called periodically to prevent memory leaks
 */
function cleanupOldBuilds(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [buildId, build] of activePremiumBuilds) {
    const age = now - build.startedAt.getTime();

    // Remove if too old OR completed/errored and older than 1 hour
    const isOld = age > maxAgeMs;
    const isStale = (build.status === 'complete' || build.status === 'error') &&
                    age > 60 * 60 * 1000; // 1 hour for completed builds

    if (isOld || isStale) {
      activePremiumBuilds.delete(buildId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Premium] Cleaned up ${cleaned} old builds. Active: ${activePremiumBuilds.size}`);
  }

  return cleaned;
}

/**
 * Get a specific build and optionally mark it as accessed
 */
function getBuild(buildId: string): PremiumBuildState | undefined {
  return activePremiumBuilds.get(buildId);
}

/**
 * Remove a specific build
 */
function removeBuild(buildId: string): boolean {
  return activePremiumBuilds.delete(buildId);
}

// Start periodic cleanup every 30 minutes
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
setInterval(() => cleanupOldBuilds(), CLEANUP_INTERVAL_MS);

// Export for use in WebSocket handlers
export {
  activePremiumBuilds,
  cleanupOldBuilds,
  getBuild,
  removeBuild,
  type PremiumBuildState,
};
