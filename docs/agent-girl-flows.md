# Agent Girl - Complete Function Reference

Die vollständige Funktionsreferenz für Agent Girl mit **280+ dokumentierten Funktionen**.

---

## 📑 Inhaltsverzeichnis

1. [Build & Generation](#-build--generation-1-15)
2. [Premium Builder](#-premium-builder-16-28)
3. [Autonomous Execution](#-autonomous-execution-29-40)
4. [Learning & Intelligence](#-learning--intelligence-41-52)
5. [Deploy & Export](#-deploy--export-53-62)
6. [Sessions & Chat](#-sessions--chat-63-72)
7. [Task Queue & Workers](#-task-queue--workers-73-80)
8. [German Entrepreneur](#-german-entrepreneur-81-85)
9. [MCP Server Tools](#-mcp-server-tools-86-92)
10. [Utilities & Helpers](#-utilities--helpers-93-100)
11. [WebSocket Handlers](#-websocket-handlers-101-120)
12. [API Routes](#-api-routes-121-140)
13. [Intelligence Factories](#-intelligence-factories-141-150)
14. [Cryptography & Security](#-cryptography--security-151-165)
15. [Error Handling & Result Types](#-error-handling--result-types-166-185)
16. [Retry & Timeout](#-retry--timeout-186-200)
17. [Validation & Path Security](#-validation--path-security-201-215)
18. [Logging & Cost Tracking](#-logging--cost-tracking-216-235)
19. [File Operations & Framework Detection](#-file-operations--framework-detection-236-255)
20. [OAuth & Smart Naming](#-oauth--smart-naming-256-270)
21. [Health Monitoring & Rate Limiting](#-health-monitoring--rate-limiting-271-285)

---

## 🏗️ BUILD & GENERATION (1-15)

### 1. `site(description, outputPath)`
Ultra-quick One-liner Website-Generierung.
```typescript
import { site } from './intelligence';
const result = await site('SaaS landing for TaskFlow', '/output');
```

### 2. `quickSite(options)`
Website mit erweiterten Options.
```typescript
import { quickSite } from './intelligence';
const result = await quickSite({
  description: 'Portfolio für Designer',
  outputPath: '/output',
  install: true,
  build: true,
});
// Returns: { success, files, stats, errors, warnings }
```

### 3. `SiteGenerator.generate()`
Vollständige Site-Generierung mit detaillierter Spec.
```typescript
import { SiteGenerator } from './intelligence';
const gen = new SiteGenerator({
  name: 'TaskFlow',
  type: 'saas', // saas | portfolio | blog | shop | docs | landing
  pages: [{ slug: 'index', title: 'Home', sections: [...] }],
  design: { preset: 'modern' },
  content: { source: 'generate' },
}, '/output');
const result = await gen.generate();
```

### 4. `SiteGenerator.generateQuick()`
Schnelle Parallel-Generierung ohne Validation.
```typescript
const result = await gen.generateQuick();
// 5x faster than generate()
```

### 5. `createSiteGenerator(spec, outputPath)`
Factory-Funktion für SiteGenerator.
```typescript
import { createSiteGenerator } from './intelligence';
const gen = createSiteGenerator(spec, '/output');
```

### 6. `POST /api/build`
Template-basierter Quick Build API.
```json
POST /api/build
{ "template": "landing-modern", "name": "my-project" }

// Templates: landing-modern, portfolio-minimal, blog-starter,
//            business-pro, shop-starter, docs-starlight
```

### 7. `GET /api/build/templates`
Verfügbare Templates abrufen.
```json
GET /api/build/templates
// Returns: [{ id, name, description, sections }]
```

### 8. `GET /api/build/status/:projectId`
Build-Status abfragen.
```json
GET /api/build/status/abc123
// Returns: { status, projectPath, previewUrl, errors }
```

### 9. `DELETE /api/build/server/:projectId`
Dev Server stoppen.
```json
DELETE /api/build/server/abc123
```

### 10. `POST /api/clone`
Website klonen mit Asset-Download.
```json
POST /api/clone
{ "url": "https://example.com" }
// Returns: { jobId, status, url }
```

### 11. `POST /api/clone/quick`
Quick Clone + sofort Preview Server.
```json
POST /api/clone/quick
{ "url": "https://example.com", "port": 4321 }
// Returns: { htmlDir, previewUrl, server }
```

### 12. `GET /api/clone/:jobId`
Clone Job Status abfragen.
```json
GET /api/clone/abc123
// Returns: { id, status, url, outputDir, server }
```

### 13. `GET /api/clone/:jobId/events`
SSE Stream für Clone Progress.
```javascript
const eventSource = new EventSource('/api/clone/abc123/events');
eventSource.onmessage = (e) => console.log(JSON.parse(e.data));
```

### 14. `DELETE /api/clone/:jobId/server`
Clone Preview Server stoppen.
```json
DELETE /api/clone/abc123/server
```

### 15. `cloneService.subscribe(jobId, callback)`
Programmatisch Clone Events subscriben.
```typescript
import { cloneService } from './modules/clone/service';
const unsubscribe = cloneService.subscribe(jobId, (event) => {
  console.log(event.type, event.data);
});
```

---

## 💎 PREMIUM BUILDER (16-28)

### 16. `POST /api/premium/analyze`
Business/Niche Analyse vor dem Build.
```json
POST /api/premium/analyze
{ "businessName": "Dr. Schmidt Zahnarzt", "niche": "dental" }
// Returns: { type, features, design, sections, estimatedCost }
```

### 17. `POST /api/premium/start-build`
100-Step Premium Website Builder starten.
```json
POST /api/premium/start-build
{
  "businessName": "Dr. Schmidt",
  "niche": "dental",
  "requirements": "Modern, trustworthy, online booking"
}
// Returns: { buildId, streamUrl }
```

### 18. `GET /api/premium/build-status/:id`
SSE Stream für Build Progress (100 Steps).
```javascript
const eventSource = new EventSource('/api/premium/build-status/abc123');
// Events: { stepId, stepName, phase, percentage, status }
```

### 19. `POST /api/premium/edit`
Quick Edit nach dem Build.
```json
POST /api/premium/edit
{
  "buildId": "abc123",
  "instruction": "Change hero background to gradient blue"
}
```

### 20. `POST /api/premium/regenerate`
Einzelne Section neu generieren.
```json
POST /api/premium/regenerate
{ "buildId": "abc123", "section": "hero" }
```

### 21. `POST /api/premium/export`
Export als ZIP, GitHub oder Vercel.
```json
POST /api/premium/export
{ "buildId": "abc123", "format": "zip" } // zip | github | vercel
// Returns: { downloadUrl } or { repoUrl } or { deployUrl }
```

### 22. `POST /api/premium/deploy`
One-Click Deploy zu Provider.
```json
POST /api/premium/deploy
{ "buildId": "abc123", "provider": "vercel" }
// Providers: vercel, netlify, cloudflare
```

### 23. `GET /api/premium/templates`
Premium Templates abrufen.
```json
GET /api/premium/templates
// Returns: 20+ niche-specific templates
```

### 24. `GET /api/premium/niches`
Verfügbare Nischen abrufen.
```json
GET /api/premium/niches
// Returns: dental, legal, restaurant, fitness, realestate, ...
```

### 25. `GET /api/premium/builds`
Alle Builds für User abrufen.
```json
GET /api/premium/builds
// Returns: [{ id, businessName, status, createdAt }]
```

### 26. `SmartDecomposition.decompose(config)`
100-Step Decomposition für Premium Builds.
```typescript
import { smartDecompose } from './utils/premium/smartDecomposition';
const plan = await smartDecompose({
  businessName: 'Dr. Schmidt',
  niche: 'dental',
  requirements: '...',
});
// Returns: { steps: Step[], totalSteps: 100, phases: 10 }
```

### 27. `PremiumWebsiteExecutor.execute()`
100-Step Execution mit Claude SDK.
```typescript
import { PremiumWebsiteExecutor } from './utils/premium/executor';
const executor = new PremiumWebsiteExecutor(plan, {
  projectPath: '/output',
  businessName: 'Dr. Schmidt',
  onProgress: (p) => console.log(p),
});
const result = await executor.execute();
```

### 28. `ContentGenerator.generate(section, context)`
AI Content Generation für Sections.
```typescript
import { ContentGenerator } from './utils/premium/contentGenerator';
const content = await contentGenerator.generate({
  section: 'hero',
  businessInfo: { name: '...', services: [...] },
  config: { language: 'de', tone: 'professional' },
});
// Returns: { headline, subheadline, body, cta, metadata }
```

---

## 🤖 AUTONOMOUS EXECUTION (29-40)

### 29. `AutonomousHarness.initialize(appSpec)`
Autonomous Harness initialisieren.
```typescript
import { createAutonomousHarness } from './intelligence';
const harness = createAutonomousHarness('/project');
await harness.initialize({
  name: 'MyApp',
  features: [{ name: 'Auth', status: 'pending' }],
});
```

### 30. `AutonomousHarness.runContinuous(onProgress)`
24h autonome Ausführung mit Context Resets.
```typescript
const result = await harness.runContinuous((progress) => {
  console.log(`Session ${progress.session}/${progress.totalSessions}`);
  console.log(`Feature: ${progress.currentFeature}`);
});
// Returns: { success, totalSessions, completedFeatures, duration }
```

### 31. `AutonomousHarness.runSingleSession()`
Einzelne Session ausführen.
```typescript
const result = await harness.runSingleSession();
```

### 32. `GoalDecomposer.decompose(goal)`
Ziel in ausführbare Schritte zerlegen.
```typescript
import { GoalDecomposer } from './intelligence';
const decomposer = new GoalDecomposer({ workingDirectory: '/project' });
const plan = await decomposer.decompose('Add user authentication');
// Returns: { goal, phases: [], steps: [], estimatedEffort }
```

### 33. `GoalDecomposer.executeStep(step)`
Einzelnen Step ausführen.
```typescript
const result = await decomposer.executeStep(plan.steps[0]);
```

### 34. `SessionManager.createSession(config)`
Session mit Context-Tracking erstellen.
```typescript
import { createSessionManager } from './intelligence';
const manager = createSessionManager('/project');
const session = await manager.createSession({
  mode: 'build',
  cwd: '/project',
  maxTokens: 100000,
});
```

### 35. `SessionManager.handoff(data)`
Session-Handoff für Context-Continuity.
```typescript
await manager.handoff({
  decisions: [{ topic: 'framework', choice: 'Astro' }],
  artifacts: [{ type: 'file', path: 'src/index.ts' }],
  nextSteps: ['Implement auth', 'Add tests'],
});
```

### 36. `SessionManager.restore(sessionId)`
Session wiederherstellen.
```typescript
const context = await manager.restore('session-123');
```

### 37. `ParallelExecutor.execute(tasks)`
Parallel Task Execution mit Worker Pool.
```typescript
import { ParallelExecutor } from './intelligence';
const executor = new ParallelExecutor({ maxWorkers: 4 });
const results = await executor.execute([
  { id: '1', fn: async () => fetchData() },
  { id: '2', fn: async () => processFiles() },
]);
```

### 38. `runAutonomousProject(path, spec, options)`
Quick Setup für autonome Ausführung.
```typescript
import { runAutonomousProject } from './intelligence';
const result = await runAutonomousProject('/project', appSpec, {
  onProgress: (p) => console.log(p),
  validateBefore: true,
});
```

### 39. `AUTONOM Mode Toggle`
Header-Toggle für vollautonome Ausführung.
```typescript
// Im Client: Toggle "AUTONOM" aktivieren
// Server: permission_mode = 'autonom'
// Rules: Zero questions, continuous execution, error resilience
```

### 40. `BackgroundProcessManager.spawn(command)`
Background Prozesse außerhalb SDK spawnen.
```typescript
import { BackgroundProcessManager } from './backgroundProcessManager';
const manager = new BackgroundProcessManager();
const { pid } = await manager.spawn(
  'bun dev',
  '/project',
  'bash-123',
  'session-456'
);
```

---

## 📚 LEARNING & INTELLIGENCE (41-52)

### 41. `LearningEngine.learn(category, key, value)`
Präferenz lernen mit Confidence.
```typescript
import { LearningEngine } from './intelligence';
const engine = LearningEngine.getInstance();
await engine.learn('code_style', 'indent', 'tabs');
// Confidence increases on each learning
```

### 42. `LearningEngine.getPreference(category, key)`
Gelernte Präferenz abrufen.
```typescript
const pref = await engine.getPreference('code_style', 'indent');
// Returns: { value: 'tabs', confidence: 0.95 }
```

### 43. `LearningEngine.suggest(category, context)`
Kontext-basierte Suggestion.
```typescript
const suggestion = await engine.suggest('framework', { type: 'web' });
// Returns best match based on learned preferences
```

### 44. `LearningEngine.decay()`
Confidence Decay anwenden (monatlich).
```typescript
await engine.decay();
// Reduces all confidence by 5% (0.95 factor)
```

### 45. `ProactiveSuggestionsEngine.getSuggestions()`
Proaktive Verbesserungsvorschläge.
```typescript
import { ProactiveSuggestionsEngine } from './intelligence';
const engine = new ProactiveSuggestionsEngine('/project');
const suggestions = await engine.getSuggestions();
// Returns: [{ type, title, description, priority, action }]
```

### 46. `RefactoringAssistant.analyze()`
AST-basierte Code-Analyse.
```typescript
import { RefactoringAssistant } from './intelligence';
const assistant = new RefactoringAssistant('/project');
const analysis = await assistant.analyze();
// Returns: { issues, opportunities, complexity }
```

### 47. `RefactoringAssistant.refactor(type, options)`
Automatisches Refactoring ausführen.
```typescript
await assistant.refactor('extract-function', {
  file: 'src/utils.ts',
  range: [10, 50],
  newName: 'validateUser',
});
// Types: extract-function, inline, rename, move
```

### 48. `ValidationEngine.runFullValidation()`
Multi-Layer Validation.
```typescript
import { createValidationEngine } from './intelligence';
const validator = createValidationEngine('/project');
const result = await validator.runFullValidation();
// Runs: typescript, lint, build, test, runtime, api, ui
```

### 49. `ValidationEngine.addRegressionTest(test)`
Regression Test hinzufügen.
```typescript
await validator.addRegressionTest({
  name: 'Auth Flow',
  steps: [
    { action: 'navigate', target: '/login' },
    { action: 'fill', target: '#email', value: 'test@test.com' },
    { action: 'click', target: 'button[type=submit]' },
    { action: 'assert', target: '/dashboard', type: 'url' },
  ],
});
```

### 50. `ValidationEngine.runRegression()`
Regression Tests ausführen.
```typescript
const results = await validator.runRegression();
// Returns: [{ name, passed, duration, errors }]
```

### 51. `SmartNaming.analyzeProject(path)`
Intelligente Projektanalyse mit N-gram.
```typescript
import { analyzeProject } from './smartNaming';
const analysis = await analyzeProject('/project');
// Returns: { name, framework, language, type, keywords, suggestedName }
```

### 52. `CICDGenerator.generate(options)`
CI/CD Pipeline generieren.
```typescript
import { CICDGenerator } from './intelligence';
const cicd = new CICDGenerator('/project');
await cicd.generate({
  provider: 'github-actions', // github-actions | gitlab | jenkins
  features: ['test', 'build', 'deploy'],
  environments: ['staging', 'production'],
});
```

---

## 🚀 DEPLOY & EXPORT (53-62)

### 53. `DeployManager.deploy(provider)`
One-Click Deploy zu Provider.
```typescript
import { DeployManager } from './intelligence';
const deploy = new DeployManager('/project');
await deploy.deploy('vercel');
// Providers: vercel, netlify, cloudflare, hetzner, coolify
```

### 54. `DeployManager.preview()`
Preview Deployment erstellen.
```typescript
const { url } = await deploy.preview();
// Returns: { url: 'https://preview-abc123.vercel.app' }
```

### 55. `DeployManager.rollback(version)`
Zu vorherigem Deployment zurück.
```typescript
await deploy.rollback('v2.3.1');
```

### 56. `DeployManager.getStatus()`
Deployment Status abrufen.
```typescript
const status = await deploy.getStatus();
// Returns: { provider, url, lastDeploy, status }
```

### 57. `ExportPipeline.export(format)`
Export in verschiedene Formate.
```typescript
import { ExportPipeline } from './utils/premium/exportPipeline';
await exportPipeline.export('zip');
// Formats: zip, github, vercel, netlify, tar
```

### 58. `ExportPipeline.toGitHub(repo)`
Direkt zu GitHub Repository exportieren.
```typescript
await exportPipeline.toGitHub({
  repo: 'username/my-site',
  branch: 'main',
  commitMessage: 'Initial commit from Agent Girl',
});
```

### 59. `ImageProcessor.optimize(options)`
Bilder für Web optimieren.
```typescript
import { ImageProcessor } from './utils/premium/imageProcessor';
await imageProcessor.optimize({
  inputDir: '/project/public/images',
  quality: 85,
  format: 'webp', // webp | avif | both
  maxWidth: 1920,
});
```

### 60. `ImageProcessor.generatePlaceholders()`
Blur Placeholders generieren.
```typescript
await imageProcessor.generatePlaceholders('/project/public/images');
// Creates base64 blur placeholders for lazy loading
```

### 61. `QuickEditCommands.execute(instruction)`
Natural Language Edit Commands.
```typescript
import { QuickEditCommands } from './utils/premium/quickEditCommands';
await quickEdit.execute('Make the header sticky with blur background');
// Parses instruction and applies changes
```

### 62. `QuickEditCommands.batch(instructions)`
Batch von Edit Commands ausführen.
```typescript
await quickEdit.batch([
  'Change primary color to #3B82F6',
  'Add animation to hero section',
  'Make footer three columns',
]);
```

---

## 💬 SESSIONS & CHAT (63-72)

### 63. `POST /api/sessions`
Neue Chat-Session erstellen.
```json
POST /api/sessions
{ "title": "My Project", "mode": "build", "working_directory": "/project" }
```

### 64. `GET /api/sessions`
Alle Sessions auflisten (paginiert).
```json
GET /api/sessions?limit=20&offset=0
// Returns: { data: [], total, hasMore }
```

### 65. `GET /api/sessions/:id`
Session Details abrufen.
```json
GET /api/sessions/abc123
// Returns: { id, title, mode, messages, context }
```

### 66. `PUT /api/sessions/:id/directory`
Working Directory ändern.
```json
PUT /api/sessions/abc123/directory
{ "directory": "/new/project/path" }
```

### 67. `PUT /api/sessions/:id/mode`
Session Mode ändern.
```json
PUT /api/sessions/abc123/mode
{ "mode": "build" }
// Modes: general, coder, intense-research, spark, build, unified, autonom, premium
```

### 68. `POST /api/sessions/:id/export`
Session exportieren.
```json
POST /api/sessions/abc123/export
{ "format": "markdown" }
// Formats: json, markdown, summary
```

### 69. `POST /api/sessions/import`
Session importieren.
```json
POST /api/sessions/import
{ "data": { ... } }
```

### 70. `GET /api/sessions/search`
Nachrichten durchsuchen.
```json
GET /api/sessions/search?query=authentication&limit=20
// Searches across all sessions
```

### 71. `GET /api/sessions/:id/messages`
Session Messages abrufen.
```json
GET /api/sessions/abc123/messages?limit=50
```

### 72. `DELETE /api/sessions/:id`
Session löschen.
```json
DELETE /api/sessions/abc123
```

---

## ⚙️ TASK QUEUE & WORKERS (73-80)

### 73. `TaskQueue.addTask(task)`
Task zur Queue hinzufügen.
```typescript
import { TaskQueue } from './queue/taskQueue';
const task = await queue.addTask({
  prompt: 'Generate user authentication',
  sessionId: 'session-123',
  priority: 'high', // low | medium | high | critical
  maxAttempts: 3,
  timeout: 30000,
});
```

### 74. `TaskQueue.start()`
Queue Processor starten.
```typescript
queue.start();
// Begins processing pending tasks
```

### 75. `TaskQueue.getTask(taskId)`
Task Status abrufen.
```typescript
const task = queue.getTask('task-123');
// Returns: { id, status, progress, result }
```

### 76. `TaskQueue.cancelTask(taskId)`
Task abbrechen.
```typescript
queue.cancelTask('task-123');
```

### 77. `TaskQueue.pauseTask(taskId)`
Task pausieren.
```typescript
queue.pauseTask('task-123');
```

### 78. `TaskQueue.resumeTask(taskId)`
Pausierten Task fortsetzen.
```typescript
queue.resumeTask('task-123');
```

### 79. `WorkerPool.start()`
Worker Pool starten.
```typescript
import { WorkerPool } from './queue/workerPool';
const pool = new WorkerPool(50); // 50 concurrent workers
pool.start();
```

### 80. `WorkerPool.getStats()`
Worker Statistiken abrufen.
```typescript
const stats = pool.getStats();
// Returns: { totalWorkers, activeWorkers, idleWorkers, processedTasks }
```

---

## 🇩🇪 GERMAN ENTREPRENEUR (81-85)

### 81. `createInvoice(data)` - Rechnungserstellung
§14 UStG konforme Rechnung erstellen.
```typescript
import { createInvoice } from './automations/german-entrepreneur';
const invoice = await createInvoice({
  kunde: 'Max Mustermann GmbH',
  leistung: 'Website Entwicklung',
  betrag: 5000,
  steuersatz: 19,
  rechnungsnummer: 'RE-2025-001',
});
// Returns: PDF buffer + invoice data
```

### 82. `prepareUStVA(data)` - USt-Voranmeldung
Umsatzsteuer-Voranmeldung vorbereiten.
```typescript
import { prepareUStVA } from './automations/german-entrepreneur';
const ustva = await prepareUStVA({
  zeitraum: '2025-Q1',
  umsaetze: 50000,
  vorsteuer: 2500,
});
// Returns: ELSTER-ready data structure
```

### 83. `exportDATEV(buchungen)` - DATEV Export
Buchungen im DATEV-Format exportieren.
```typescript
import { exportDATEV } from './automations/german-entrepreneur';
const datev = await exportDATEV({
  buchungen: [
    { datum: '2025-01-15', konto: '8400', gegenkonto: '1200', betrag: 1000 },
  ],
  zeitraum: '2025-01',
});
// Returns: DATEV CSV file
```

### 84. `createMahnung(data)` - Mahnwesen
§286/288 BGB konforme Mahnung erstellen.
```typescript
import { createMahnung } from './automations/german-entrepreneur';
const mahnung = await createMahnung({
  schuldner: 'Firma XYZ',
  forderung: 1500,
  faelligkeitsdatum: '2025-01-01',
  mahnstufe: 2, // 1, 2, oder 3
});
// Returns: PDF buffer + legal-compliant text
```

### 85. `kassenbuchEintrag(data)` - Kassenbuch
GoBD-konformes Kassenbuch führen.
```typescript
import { kassenbuchEintrag } from './automations/german-entrepreneur';
await kassenbuchEintrag({
  typ: 'einnahme', // einnahme | ausgabe
  betrag: 150,
  beschreibung: 'Barzahlung Kunde',
  belegnummer: 'K-2025-042',
});
```

---

## 🔌 MCP SERVER TOOLS (86-92)

### 86. `autonom_execute(task, workingDir)`
AUTONOM Mode via MCP.
```typescript
// MCP Tool: agent-girl/autonom_execute
{
  "task": "Build a complete user dashboard",
  "working_directory": "/project",
  "model": "sonnet",
  "max_steps": 50
}
```

### 87. `autonom_status(sessionId)`
AUTONOM Session Status.
```typescript
// MCP Tool: agent-girl/autonom_status
{ "session_id": "autonom-123" }
// Returns: { status, progress, currentStep, errors }
```

### 88. `autonom_stop(sessionId)`
AUTONOM Session stoppen.
```typescript
// MCP Tool: agent-girl/autonom_stop
{ "session_id": "autonom-123" }
```

### 89. `autonom_progress(workingDir)`
PROGRESS.json auslesen.
```typescript
// MCP Tool: agent-girl/autonom_progress
{ "working_directory": "/project" }
// Returns: { session_id, current_step, total_estimated, status }
```

### 90. `agent_girl_chat(message)`
Agent Girl Chat via MCP.
```typescript
// MCP Tool: agent-girl/agent_girl_chat
{ "message": "How do I add authentication?", "model": "sonnet" }
```

### 91. `german_rechnung(data)`
Deutsche Rechnung via MCP.
```typescript
// MCP Tool: agent-girl/german_rechnung
{ "kunde": "...", "leistung": "...", "betrag": 1000 }
```

### 92. `agent_girl_status()`
System Status via MCP.
```typescript
// MCP Tool: agent-girl/agent_girl_status
// Returns: { version, sessions, queue, health }
```

---

## 🔧 UTILITIES & HELPERS (93-100)

### 93. `createIntelligenceSystem(projectPath)`
Unified Factory für alle Intelligence-Module.
```typescript
import { createIntelligenceSystem } from './intelligence';
const system = createIntelligenceSystem('/project');
// Contains: learning, executor, goals, suggestions,
//           refactoring, deploy, cicd, validation
```

### 94. `CostTracker.estimateCost(usage)`
Token/Cost Schätzung für AUTONOM Mode.
```typescript
import { estimateCost } from './utils/costTracker';
const cost = estimateCost({
  inputTokens: 50000,
  outputTokens: 10000,
}, 'claude-sonnet-4-20250514');
// Returns: { inputCost, outputCost, totalCost }
```

### 95. `CostTracker.checkBudget(sessionId)`
Budget-Check für Session.
```typescript
import { checkBudget } from './utils/costTracker';
const status = checkBudget('session-123');
// Returns: { totalCost, remaining, isExceeded, warnings }
```

### 96. `Logger.info/warn/error(message, context)`
Strukturiertes Logging.
```typescript
import { logger } from './utils/logger';
logger.info('Task started', { taskId: '123', type: 'build' });
logger.error('Task failed', { error: err.message });
```

### 97. `RateLimiter.check(key)`
Rate Limiting für APIs.
```typescript
import { RateLimiter } from './utils/rateLimiter';
const limiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 });
if (!limiter.check('user-123')) {
  throw new Error('Rate limit exceeded');
}
```

### 98. `PathSecurity.validatePath(path)`
Path Traversal Schutz.
```typescript
import { validatePath } from './utils/pathSecurity';
const safe = validatePath(userInput, '/allowed/base');
// Throws if path escapes base directory
```

### 99. `Retry.withExponentialBackoff(fn, options)`
Retry mit Exponential Backoff.
```typescript
import { retry } from './utils/retry';
const result = await retry(
  () => fetchData(),
  { maxAttempts: 3, baseDelay: 1000 }
);
```

### 100. `getAvailableModes()`
Verfügbare Modes auflisten.
```typescript
import { getAvailableModes } from './modes';
const modes = getAvailableModes();
// Returns: [{ id, name, description }]
```

---

## 🔌 WEBSOCKET HANDLERS (101-120)

### 101. `handleWebSocketMessage(ws, message)`
Zentrale WebSocket-Nachrichtenverarbeitung.
```typescript
// Automatisch vom Server aufgerufen
// Routet zu spezifischen Handlern basierend auf message.type
```

### 102. `handleChatMessage(ws, message)`
Chat-Nachricht mit Claude verarbeiten.
```typescript
// WebSocket message: { type: 'message', content: 'Hello', sessionId }
// Streamt Response zurück via ws.send()
```

### 103. `handlePremiumBuildStart(ws, message)`
Premium 100-Step Build starten.
```typescript
// WebSocket: { type: 'premium:start', config }
// Startet autonomen Build-Prozess
```

### 104. `handlePremiumEdit(ws, message)`
Live-Edit während Premium Build.
```typescript
// WebSocket: { type: 'premium:edit', file, changes }
// Wendet Änderungen an und revalidiert
```

### 105. `handlePremiumUndo(ws, message)`
Undo für Premium Build.
```typescript
// WebSocket: { type: 'premium:undo' }
// Stellt vorherigen Zustand wieder her
```

### 106. `handlePremiumPreviewRequest(ws, message)`
Preview für Premium Build anfordern.
```typescript
// WebSocket: { type: 'premium:preview' }
// Startet Dev Server und sendet URL zurück
```

### 107. `handleCloneStart(ws, message)`
Website-Clone starten.
```typescript
// WebSocket: { type: 'clone:start', url, options }
// Startet GoClone mit SSE Progress
```

### 108. `handleCloneQuick(ws, message)`
Quick Clone mit Auto-Serve.
```typescript
// WebSocket: { type: 'clone:quick', url }
// Clont und startet sofort Preview Server
```

### 109. `handleCloneStatus(ws, message)`
Clone-Job Status abfragen.
```typescript
// WebSocket: { type: 'clone:status', jobId }
// Returns: { status, progress, files }
```

### 110. `handleCloneStopServer(ws, message)`
Clone Preview Server stoppen.
```typescript
// WebSocket: { type: 'clone:stop', jobId }
// Beendet running preview server
```

### 111. `handleStopGeneration(ws, message)`
Laufende Generierung abbrechen.
```typescript
// WebSocket: { type: 'stop' }
// Bricht Claude-Stream ab
```

### 112. `handleSetPermissionMode(ws, message)`
Permission Mode ändern.
```typescript
// WebSocket: { type: 'setPermissionMode', mode }
// Modes: 'default' | 'acceptEdits' | 'bypassPermissions'
```

### 113. `handleKillBackgroundProcess(ws, message)`
Background Process beenden.
```typescript
// WebSocket: { type: 'killProcess', pid }
// Terminiert Prozess sicher
```

### 114. `handleAnswerQuestion(ws, message)`
User-Antwort auf Claude-Frage.
```typescript
// WebSocket: { type: 'answer', questionId, answer }
// Fortsetzt blockierten Claude-Flow
```

### 115. `handleCancelQuestion(ws, message)`
Frage-Dialog abbrechen.
```typescript
// WebSocket: { type: 'cancelQuestion', questionId }
// Bricht wartende Frage ab
```

### 116. `handleApprovePlan(ws, message)`
Plan-Approval für Plan Mode.
```typescript
// WebSocket: { type: 'approvePlan', approved, feedback }
// Genehmigt oder lehnt Plan ab
```

### 117. `cleanupBuildConnections(ws)`
Build-Connections aufräumen bei Disconnect.
```typescript
// Automatisch aufgerufen bei ws.close
// Räumt alle Build-Ressourcen auf
```

### 118. `cleanupCloneConnections(ws)`
Clone-Connections aufräumen.
```typescript
// Automatisch bei Disconnect
// Stoppt laufende Clone-Jobs
```

### 119. `removeWebSocketFromBuilds(ws)`
WebSocket aus Build-Tracking entfernen.
```typescript
// Internal: Entfernt ws aus activeBuilds Map
```

### 120. `removeWebSocketFromClones(ws)`
WebSocket aus Clone-Tracking entfernen.
```typescript
// Internal: Entfernt ws aus activeClones Map
```

---

## 🛣️ API ROUTES (121-140)

### 121. `handleBuildRoutes(req, url)`
Build API Endpoints.
```typescript
// POST /api/build - Start build
// GET /api/build/:id - Get status
// POST /api/build/:id/deploy - Deploy
```

### 122. `handlePremiumRoutes(req, url)`
Premium Builder API.
```typescript
// POST /api/premium/analyze - Analyze project
// POST /api/premium/start-build - Start 100-step
// GET /api/premium/status/:id - Get progress
// POST /api/premium/deploy/:id - Deploy result
```

### 123. `handleCloneRoutes(req, url)`
Clone API Endpoints.
```typescript
// POST /api/clone - Start clone job
// POST /api/clone/quick - Quick clone + serve
// GET /api/clone/:id - Job status
// GET /api/clone/:id/events - SSE stream
// DELETE /api/clone/:id/server - Stop server
```

### 124. `handleSessionRoutes(req, url)`
Session Management API.
```typescript
// GET /api/sessions - List all
// POST /api/sessions - Create new
// GET /api/sessions/:id - Get session
// DELETE /api/sessions/:id - Delete
// GET /api/sessions/:id/messages - Get messages
```

### 125. `handleContentRoutes(req, url)`
Content Editing API.
```typescript
// GET /api/content/:file - Get content
// PUT /api/content/:file - Update content
// POST /api/content/style - Apply style changes
```

### 126. `handleSectionRoutes(req, url)`
Section Management API.
```typescript
// GET /api/sections - List templates
// POST /api/sections - Add section
// PUT /api/sections/:id - Update section
// DELETE /api/sections/:id - Remove section
```

### 127. `handleQueueRoutes(req, url)`
Task Queue API.
```typescript
// GET /api/queue/status - Queue status
// POST /api/queue/task - Add task
// DELETE /api/queue/task/:id - Cancel task
// GET /api/queue/metrics - Performance metrics
```

### 128. `handleFilesRoutes(req, url)`
File Operations API.
```typescript
// GET /api/files - List files
// GET /api/files/:path - Read file
// POST /api/files/:path - Write file
// DELETE /api/files/:path - Delete file
```

### 129. `handleDirectoryRoutes(req, url)`
Directory Operations API.
```typescript
// GET /api/directory - List directory
// POST /api/directory - Create directory
// DELETE /api/directory/:path - Delete directory
```

### 130. `handlePreviewRoutes(req, url)`
Preview Server API.
```typescript
// POST /api/preview/start - Start preview
// DELETE /api/preview/stop - Stop preview
// GET /api/preview/status - Get status
```

### 131. `handleProxyRoutes(req, url)`
Proxy für externe Ressourcen.
```typescript
// GET /api/proxy?url=... - Fetch external URL
// Umgeht CORS für Preview
```

### 132. `handleCommandRoutes(req, url)`
Slash Command API.
```typescript
// GET /api/commands - List available
// GET /api/commands/:mode - Commands per mode
// POST /api/commands/execute - Execute command
```

### 133. `handleUserConfigRoutes(req, url)`
User Configuration API.
```typescript
// GET /api/config - Get config
// PUT /api/config - Update config
// GET /api/config/keys - API keys status
```

### 134. `handleHealthCheck(req, url)`
Health Check Endpoint.
```typescript
// GET /api/health - Full health check
// Returns: { status, components, uptime }
```

### 135. `handleReadinessProbe(req, url)`
Kubernetes Readiness Probe.
```typescript
// GET /api/ready - Check if ready
// Returns: 200 or 503
```

### 136. `handleLivenessProbe(req, url)`
Kubernetes Liveness Probe.
```typescript
// GET /api/live - Check if alive
// Returns: 200 or 503
```

### 137. `handleCLIRequest(req, url)`
CLI Integration API.
```typescript
// POST /api/cli/execute - Execute CLI command
// POST /api/cli/autonom - Start AUTONOM mode
// GET /api/cli/status - Get CLI status
```

### 138. `initializeQueueSystem()`
Queue System initialisieren.
```typescript
// Called on server start
// Sets up worker pool and task queue
```

### 139. `runHealthCheck()`
Detaillierte Systemprüfung.
```typescript
// Checks: DB, Claude API, File system, Memory
// Returns: { healthy, checks: [...] }
```

### 140. `updateWsStats()`
WebSocket Statistiken aktualisieren.
```typescript
// Updates: connections, messages, errors
// Used for monitoring
```

---

## 🧠 INTELLIGENCE FACTORIES (141-150)

### 141. `createIntelligenceSystem(options)`
Komplettes Intelligence System erstellen.
```typescript
import { createIntelligenceSystem } from './intelligence';
const intel = createIntelligenceSystem({
  projectPath: '/project',
  enableLearning: true,
});
// Returns: { learning, goals, validation, deploy, ... }
```

### 142. `createGoalDecomposer(options)`
Goal Decomposer Factory.
```typescript
import { createGoalDecomposer } from './intelligence';
const decomposer = createGoalDecomposer({
  maxSubgoals: 10,
  validateSteps: true,
});
const goals = await decomposer.decompose('Build auth system');
// Returns: [{ goal, priority, dependencies, steps }]
```

### 143. `createValidationEngine(options)`
Validation Engine Factory.
```typescript
import { createValidationEngine } from './intelligence';
const validator = createValidationEngine({
  strictMode: true,
  autoFix: true,
});
const result = await validator.validate('/project');
// Returns: { valid, errors, warnings, fixes }
```

### 144. `createParallelExecutor(options)`
Parallel Executor Factory.
```typescript
import { createParallelExecutor } from './intelligence';
const executor = createParallelExecutor({
  maxConcurrency: 5,
  retryOnError: true,
});
const results = await executor.execute(tasks);
```

### 145. `createProactiveSuggestions(options)`
Proactive Suggestions Factory.
```typescript
import { createProactiveSuggestions } from './intelligence';
const suggester = createProactiveSuggestions({
  analyzeCode: true,
  suggestOptimizations: true,
});
const suggestions = await suggester.analyze('/project');
```

### 146. `createRefactoringAssistant(options)`
Refactoring Assistant Factory.
```typescript
import { createRefactoringAssistant } from './intelligence';
const refactor = createRefactoringAssistant({
  preserveTests: true,
  validateAfter: true,
});
await refactor.refactorFile('/src/component.tsx');
```

### 147. `createCICDGenerator(options)`
CI/CD Generator Factory.
```typescript
import { createCICDGenerator } from './intelligence';
const cicd = createCICDGenerator({
  platform: 'github-actions',
  includeTests: true,
});
const workflow = await cicd.generate('/project');
```

### 148. `createDeployManager(options)`
Deploy Manager Factory.
```typescript
import { createDeployManager } from './intelligence';
const deployer = createDeployManager({
  provider: 'vercel',
  autoRetry: true,
});
const result = await deployer.deploy('/project');
```

### 149. `createSessionManager(options)`
Session Manager Factory.
```typescript
import { createSessionManager } from './intelligence';
const sessions = createSessionManager({
  maxSessions: 100,
  autoCleanup: true,
});
const session = await sessions.create({ mode: 'build' });
```

### 150. `createAutonomousHarness(options)`
Autonomous Harness Factory.
```typescript
import { createAutonomousHarness } from './intelligence';
const harness = createAutonomousHarness({
  maxSteps: 100,
  budgetLimit: 50,
  checkpointEvery: 10,
});
await harness.initialize(projectSpec);
await harness.runContinuous();
```

---

## 📊 Quick Reference

| Kategorie | Funktionen | Hauptnutzen |
|-----------|------------|-------------|
| Build | 1-15 | Website erstellen |
| Premium | 16-28 | 100-Step AI Builder |
| Autonomous | 29-40 | Selbstständige Ausführung |
| Learning | 41-52 | Intelligente Verbesserung |
| Deploy | 53-62 | Production Delivery |
| Sessions | 63-72 | Chat Management |
| Queue | 73-80 | Task Processing |
| German | 81-85 | DE Business Compliance |
| MCP | 86-92 | Claude Code Integration |
| Utils | 93-100 | System Helpers |
| WebSocket | 101-120 | Real-time Communication |
| API Routes | 121-140 | REST Endpoints |
| Factories | 141-150 | Intelligence System Creation |

---

## 🚀 Empfohlene Flows

### MVP erstellen
```
quickSite() → DeployManager.deploy('vercel')
```

### Production Website (Premium)
```
/api/premium/analyze → /api/premium/start-build → /api/premium/deploy
```

### Autonomes Projekt
```
createAutonomousHarness() → initialize(spec) → runContinuous()
```

### Website Redesign
```
/api/clone → SiteGenerator.generate() → DeployManager.deploy()
```

### CI/CD Setup
```
CICDGenerator.generate() → github__push_files
```

### German Business
```
createInvoice() → exportDATEV() → prepareUStVA()
```

---

## 🔐 CRYPTOGRAPHY & SECURITY (151-165)

### 151. `encrypt(plaintext)`
AES-256-GCM Verschlüsselung mit scrypt Key-Derivation.
```typescript
import { encrypt } from './utils/crypto';
const encrypted = encrypt('sensitive data');
// Returns: { encrypted: string, iv: string, salt: string, tag: string }
```

### 152. `decrypt(data)`
Entschlüsselung mit Authentication Tag Validierung.
```typescript
import { decrypt } from './utils/crypto';
const plaintext = decrypt(encryptedData);
// Throws if tampered or wrong key
```

### 153. `encryptObject<T>(obj)`
JSON-Objekt verschlüsseln.
```typescript
import { encryptObject } from './utils/crypto';
const encrypted = encryptObject({ apiKey: 'sk-xxx', tokens: { access: '...' } });
```

### 154. `decryptObject<T>(data)`
Objekt entschlüsseln und deserialisieren.
```typescript
import { decryptObject } from './utils/crypto';
const tokens = decryptObject<OAuthTokens>(encrypted);
```

### 155. `isEncrypted(data)`
Type Guard für verschlüsselte Daten.
```typescript
import { isEncrypted } from './utils/crypto';
if (isEncrypted(data)) {
  const plain = decrypt(data);
}
```

### 156. `secureCompare(a, b)`
Konstante-Zeit Vergleich gegen Timing Attacks.
```typescript
import { secureCompare } from './utils/crypto';
if (secureCompare(providedToken, storedToken)) {
  // Safe comparison - no timing leak
}
```

### 157. `generateSecureToken(length?)`
Kryptographisch sichere Random Tokens.
```typescript
import { generateSecureToken } from './utils/crypto';
const token = generateSecureToken(32); // 32 bytes base64url
```

### 158. `hashValue(value)`
SHA256 One-Way Hash.
```typescript
import { hashValue } from './utils/crypto';
const hash = hashValue(password);
// Returns hex string, irreversible
```

### 159. `maskSensitive(value, visibleChars?)`
Sensible Daten für Logging maskieren.
```typescript
import { maskSensitive } from './utils/crypto';
console.log(maskSensitive('sk-ant-xxx123', 4));
// Output: "sk-a****3"
```

### 160. `getMachineSecret()`
Maschinen-spezifisches Secret für Key Derivation.
```typescript
// Internal: Kombiniert hostname, MAC address, process.env
// Ermöglicht nur lokale Entschlüsselung
```

### 161. `deriveKey(password, salt)`
scrypt Key Derivation (N=16384, r=8, p=1).
```typescript
// Internal: 256-bit key für AES-256-GCM
// Resistenter gegen GPU/ASIC Attacken
```

### 162. `validatePathSecurity(path, allowedBases)`
Path Traversal Schutz.
```typescript
import { isPathSafe } from './utils/pathSecurity';
if (!isPathSafe(userPath, [homedir(), '/tmp'])) {
  throw new Error('Path traversal detected');
}
```

### 163. `sanitizePath(requestedPath, allowedBase)`
Traversal Attempts entfernen.
```typescript
import { sanitizePath } from './utils/pathSecurity';
const safe = sanitizePath('../../../etc/passwd', '/allowed');
// Returns: null (rejected)
```

### 164. `validateDirectoryPath(dirPath, options)`
Vollständige Directory Validierung.
```typescript
import { validateDirectoryPath } from './utils/pathSecurity';
const result = validateDirectoryPath(path, {
  requireExists: true,
  maxDepth: 10,
  resolveSymlinks: true,
});
// Returns: { isValid, error?, resolvedPath? }
```

### 165. `sanitizeFilename(filename)`
Gefährliche Zeichen aus Dateinamen entfernen.
```typescript
import { sanitizeFilename } from './utils/pathSecurity';
const safe = sanitizeFilename('../../mal\x00ware.exe');
// Returns: "malware.exe"
```

---

## 🎯 ERROR HANDLING & RESULT TYPES (166-185)

### 166. `Ok<T>(value)`
Erfolgreichen Result erstellen.
```typescript
import { Ok } from './utils/Result';
const result = Ok({ user: 'John', age: 30 });
// Returns: { ok: true, value: { user: 'John', age: 30 } }
```

### 167. `Err<E>(error)`
Error Result erstellen.
```typescript
import { Err } from './utils/Result';
const result = Err(new ValidationError('Invalid email'));
// Returns: { ok: false, error: ValidationError }
```

### 168. `isOk(result)`
Type Guard für Success.
```typescript
import { isOk } from './utils/Result';
if (isOk(result)) {
  console.log(result.value); // TypeScript knows value exists
}
```

### 169. `isErr(result)`
Type Guard für Error.
```typescript
import { isErr } from './utils/Result';
if (isErr(result)) {
  console.log(result.error.message);
}
```

### 170. `unwrap(result)`
Wert extrahieren oder Error werfen.
```typescript
import { unwrap } from './utils/Result';
const value = unwrap(result); // Throws if error
```

### 171. `unwrapOr(result, defaultValue)`
Wert oder Default extrahieren.
```typescript
import { unwrapOr } from './utils/Result';
const value = unwrapOr(result, { user: 'Guest' });
```

### 172. `map(result, fn)`
Funktor Map über Result.
```typescript
import { map } from './utils/Result';
const mapped = map(result, user => user.name);
// If Ok, applies fn; if Err, returns Err unchanged
```

### 173. `mapErr(result, fn)`
Error transformieren.
```typescript
import { mapErr } from './utils/Result';
const mapped = mapErr(result, err => new UserError(err.message));
```

### 174. `andThen(result, fn)`
Monadischer Bind (flatMap).
```typescript
import { andThen } from './utils/Result';
const result = andThen(parseUser(json), validateUser);
// Chains operations that return Results
```

### 175. `tryCatch(fn)`
Sync Operation in Result wrappen.
```typescript
import { tryCatch } from './utils/Result';
const result = tryCatch(() => JSON.parse(jsonString));
// Returns: Result<T, Error>
```

### 176. `tryCatchAsync(fn)`
Async Operation in Result wrappen.
```typescript
import { tryCatchAsync } from './utils/Result';
const result = await tryCatchAsync(() => fetchUser(id));
// Returns: Promise<Result<T, Error>>
```

### 177. `all(results)`
Alle Results kombinieren.
```typescript
import { all } from './utils/Result';
const combined = all([result1, result2, result3]);
// Returns: Result<T[], E> - fails fast on first error
```

### 178. `ValidationError`
Input Validation Error.
```typescript
import { ValidationError } from './utils/Result';
throw new ValidationError('Email format invalid', { field: 'email' });
```

### 179. `NotFoundError`
Resource Not Found Error.
```typescript
import { NotFoundError } from './utils/Result';
throw new NotFoundError('Session abc123 not found');
```

### 180. `AuthenticationError`
Auth/Token Error.
```typescript
import { AuthenticationError } from './utils/Result';
throw new AuthenticationError('API key expired');
```

### 181. `PermissionError`
Permission Denied Error.
```typescript
import { PermissionError } from './utils/Result';
throw new PermissionError('Cannot access directory outside base');
```

### 182. `RateLimitError`
Rate Limit Exceeded Error.
```typescript
import { RateLimitError } from './utils/Result';
throw new RateLimitError('Too many requests', { retryAfter: 60 });
```

### 183. `toUserMessage(error)`
User-freundliche Fehlermeldung generieren.
```typescript
import { toUserMessage } from './utils/Result';
const message = toUserMessage(error);
// Returns: "Invalid email format" (not technical stack trace)
```

### 184. `parseApiError(error, stderrContext?)`
Claude API Errors parsen.
```typescript
import { parseApiError } from './utils/apiErrors';
const parsed = parseApiError(err, stderrOutput);
// Returns: { type, message, requestId?, retryAfterSeconds? }
```

### 185. `getUserFriendlyMessage(parsedError)`
API Error in User Message konvertieren.
```typescript
import { getUserFriendlyMessage } from './utils/apiErrors';
const message = getUserFriendlyMessage(parsed);
// Returns actionable guidance for each error type
```

---

## ⏱️ RETRY & TIMEOUT (186-200)

### 186. `withRetry(operation, options?)`
Async Operation mit Exponential Backoff.
```typescript
import { withRetry } from './utils/retry';
const result = await withRetry(
  () => fetchFromApi('/users'),
  { maxAttempts: 3, initialDelayMs: 2000 }
);
```

### 187. `withRetryGenerator(generatorFactory, options?)`
Generator mit Retry (für Claude SDK Streams).
```typescript
import { withRetryGenerator } from './utils/retry';
const stream = withRetryGenerator(
  () => claudeClient.query({ ... }),
  { maxAttempts: 3 }
);
for await (const chunk of stream) { ... }
```

### 188. `shouldRetry(error)`
Prüfen ob Error retryable ist.
```typescript
import { shouldRetry } from './utils/retry';
if (shouldRetry(err)) {
  await delay(1000);
  return retry();
}
```

### 189. `getRetryDelay(error, attempt, options?)`
Retry Delay berechnen (mit Rate-Limit Retry-After).
```typescript
import { getRetryDelay } from './utils/retry';
const delay = getRetryDelay(err, 2);
// Respects retry-after header if present
```

### 190. `TimeoutController`
Timeout mit Warning Notifications.
```typescript
import { TimeoutController } from './utils/timeout';
const controller = new TimeoutController({
  warningMs: 30000,
  timeoutMs: 120000,
  onWarning: () => console.log('Taking longer than expected'),
});
controller.start();
```

### 191. `ActivityTimeoutController`
Activity-basierter Hang-Detektor.
```typescript
import { ActivityTimeoutController } from './utils/timeout';
const controller = new ActivityTimeoutController({
  hangWarningMs: 90000,
  hangAbortMs: 180000,
  onHangWarning: () => console.log('Agent may be stuck'),
});
controller.recordActivity('text', 'Generated output');
```

### 192. `withTimeoutGenerator(generator, options?)`
Generator mit Timeout wrappen.
```typescript
import { withTimeoutGenerator } from './utils/timeout';
const stream = withTimeoutGenerator(
  claudeStream,
  { timeoutMs: 120000, warningMs: 60000 }
);
```

### 193. `withTimeout(promise, options?)`
Promise mit Timeout wrappen.
```typescript
import { withTimeout } from './utils/timeout';
const result = await withTimeout(
  longRunningOperation(),
  { timeoutMs: 30000 }
);
```

### 194. `TimeoutError`
Timeout Error Klasse.
```typescript
import { TimeoutError } from './utils/timeout';
if (error instanceof TimeoutError) {
  console.log('Operation timed out after', error.timeoutMs, 'ms');
}
```

### 195. `HangError`
Hang Detection Error.
```typescript
import { HangError } from './utils/timeout';
if (error instanceof HangError) {
  console.log('Agent hung after', error.hangTimeMs, 'ms without activity');
}
```

### 196. `ActivityTimeoutController.recordActivity(type, content)`
Activity für Hang-Detection aufzeichnen.
```typescript
controller.recordActivity('thinking', 'Processing...');
controller.recordActivity('tool_use', 'Running command');
controller.recordActivity('text', 'Output tokens: 15000');
```

### 197. `ActivityTimeoutController.getOutputTokenCount()`
Output Token Tracking für API Limit (25000).
```typescript
const tokens = controller.getOutputTokenCount();
if (tokens > 20000) {
  console.warn('Approaching 25000 token limit');
}
```

### 198. `TimeoutController.reset()`
Timer zurücksetzen.
```typescript
controller.reset();
// Restarts warning/timeout timers
```

### 199. `TimeoutController.clear()`
Timer beenden.
```typescript
controller.clear();
// Stops all timers, no callbacks fired
```

### 200. `TimeoutController.getElapsedMs()`
Verstrichene Zeit abrufen.
```typescript
const elapsed = controller.getElapsedMs();
console.log(`Running for ${elapsed / 1000} seconds`);
```

---

## ✅ VALIDATION & PATH SECURITY (201-215)

### 201. `validateInput(schema, data)`
Zod-basierte Input Validierung.
```typescript
import { validateInput } from './utils/validation';
const parsed = validateInput(ChatMessageSchema, userInput);
// Throws ValidationError with detailed messages
```

### 202. `withValidation(schema, handler)`
Request Handler mit Validation wrappen.
```typescript
import { withValidation } from './utils/validation';
const handler = withValidation(CreateSessionSchema, async (data) => {
  return createSession(data);
});
```

### 203. `sanitizeForDisplay(str, maxLength?)`
String für sichere Anzeige bereinigen.
```typescript
import { sanitizeForDisplay } from './utils/validation';
const safe = sanitizeForDisplay(userInput, 100);
// Removes dangerous characters, truncates
```

### 204. `ChatMessageSchema`
Zod Schema für Chat Messages.
```typescript
import { ChatMessageSchema } from './utils/validation';
const message = ChatMessageSchema.parse({
  role: 'user',
  content: 'Hello',
  attachments: [],
});
```

### 205. `SessionIdSchema`
UUID Session ID Validierung.
```typescript
import { SessionIdSchema } from './utils/validation';
const id = SessionIdSchema.parse(req.params.id);
// Must be valid UUID format
```

### 206. `DirectoryPathSchema`
Sichere Directory Path Validierung.
```typescript
import { DirectoryPathSchema } from './utils/validation';
const path = DirectoryPathSchema.parse(userPath);
// Rejects path traversal, null bytes
```

### 207. `WebSocketMessageSchema`
WebSocket Message Validierung.
```typescript
import { WebSocketMessageSchema } from './utils/validation';
const msg = WebSocketMessageSchema.parse(JSON.parse(rawMessage));
// Validates type, content, sessionId
```

### 208. `ApiKeySchema`
API Key Format Validierung.
```typescript
import { ApiKeySchema } from './utils/validation';
const key = ApiKeySchema.parse(process.env.ANTHROPIC_API_KEY);
// Must start with 'sk-ant-'
```

### 209. `isPathSafe(targetPath, allowedBases)`
Path Security Check.
```typescript
import { isPathSafe } from './utils/pathSecurity';
if (!isPathSafe('/user/data', ['/home', '/tmp'])) {
  throw new Error('Access denied');
}
```

### 210. `validateFilePath(filePath, options)`
File Path Vollvalidierung.
```typescript
import { validateFilePath } from './utils/pathSecurity';
const result = validateFilePath(path, {
  requireExists: true,
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.ts', '.tsx', '.js'],
});
```

### 211. `getSafeRelativePath(from, to)`
Sicheren relativen Pfad berechnen.
```typescript
import { getSafeRelativePath } from './utils/pathSecurity';
const rel = getSafeRelativePath('/base', '/base/sub/file.ts');
// Returns: 'sub/file.ts' or null if would escape base
```

### 212. `getDefaultAllowedBases()`
Standard erlaubte Base Directories.
```typescript
import { getDefaultAllowedBases } from './utils/pathSecurity';
const bases = getDefaultAllowedBases();
// Returns: [homedir(), '/tmp', process.cwd()]
```

### 213. `hasNullBytes(path)`
Null Byte Injection Check.
```typescript
// Internal check in validateDirectoryPath
// Detects: 'file\x00.txt' patterns
```

### 214. `hasTraversalPatterns(path)`
Path Traversal Pattern Detection.
```typescript
// Internal: Detects '../', '..\\', '%2e%2e'
```

### 215. `resolveSymlinksIfNeeded(path, shouldResolve)`
Optional Symlink Resolution.
```typescript
// Follows symlinks to detect escape attempts
// Important for security in containerized environments
```

---

## 📊 LOGGING & COST TRACKING (216-235)

### 216. `logger.info(message, context?)`
Info Level Logging.
```typescript
import { logger } from './utils/logger';
logger.info('Session started', { sessionId: '123', mode: 'build' });
```

### 217. `logger.warn(message, context?)`
Warning Level Logging.
```typescript
logger.warn('High memory usage', { heapUsed: '85%' });
```

### 218. `logger.error(message, context?)`
Error Level Logging.
```typescript
logger.error('Task failed', { taskId: '123', error: err.message });
```

### 219. `logger.debug(message, context?)`
Debug Level Logging (nur in Development).
```typescript
logger.debug('Processing chunk', { size: 1024, index: 5 });
```

### 220. `logger.fatal(message, context?)`
Fatal Error Logging.
```typescript
logger.fatal('Database connection lost', { retries: 5 });
```

### 221. `logger.time(name, fn, context?)`
Async Operation Timing.
```typescript
const result = await logger.time('fetchUsers', async () => {
  return await db.query('SELECT * FROM users');
}, { limit: 100 });
// Logs: "fetchUsers completed in 125ms"
```

### 222. `logger.child(defaultContext)`
Child Logger mit Preset Context.
```typescript
const sessionLogger = logger.child({ sessionId: '123' });
sessionLogger.info('Message received'); // Includes sessionId
```

### 223. `getModelPricing(modelId)`
Model Pricing abrufen.
```typescript
import { getModelPricing } from './utils/costTracker';
const pricing = getModelPricing('claude-sonnet-4-20250514');
// Returns: { input: 3.00, output: 15.00 } per 1M tokens
```

### 224. `calculateCost(modelId, usage)`
Kosten aus Token Usage berechnen.
```typescript
import { calculateCost } from './utils/costTracker';
const cost = calculateCost('claude-sonnet-4-20250514', {
  inputTokens: 50000,
  outputTokens: 10000,
});
// Returns: { inputCost, outputCost, totalCost }
```

### 225. `getSessionBudget(sessionId, config?)`
Session Budget abrufen/erstellen.
```typescript
import { getSessionBudget } from './utils/costTracker';
const budget = getSessionBudget('session-123');
// Returns: { totalCost, messageCount, tokensUsed, isExceeded }
```

### 226. `updateSessionBudget(sessionId, usage, modelId)`
Budget nach API Call aktualisieren.
```typescript
import { updateSessionBudget } from './utils/costTracker';
updateSessionBudget('session-123', { inputTokens: 1000, outputTokens: 500 }, 'claude-sonnet-4-20250514');
```

### 227. `getBudgetSummary(sessionId)`
Budget Status für Display formatieren.
```typescript
import { getBudgetSummary } from './utils/costTracker';
const summary = getBudgetSummary('session-123');
// Returns: "$2.50 / $10.00 (25%)"
```

### 228. `estimateTokens(text)`
Token Schätzung (~4 chars/token).
```typescript
import { estimateTokens } from './utils/costTracker';
const tokens = estimateTokens(prompt);
// Approximation: Math.ceil(text.length / 4)
```

### 229. `estimateCostBeforeCall(prompt, modelId, expectedOutputRatio?)`
Pre-Call Cost Schätzung.
```typescript
import { estimateCostBeforeCall } from './utils/costTracker';
const estimate = estimateCostBeforeCall(prompt, 'claude-sonnet-4-20250514', 0.5);
// Returns: { estimatedInputTokens, estimatedOutputTokens, estimatedCost }
```

### 230. `canAffordCall(sessionId, prompt, modelId, expectedOutputRatio?)`
Budget Check vor API Call.
```typescript
import { canAffordCall } from './utils/costTracker';
if (!canAffordCall('session-123', prompt, 'claude-sonnet-4-20250514')) {
  throw new Error('Budget exceeded');
}
```

### 231. `resetSessionBudget(sessionId, config?)`
Budget für neue Autonomous Session zurücksetzen.
```typescript
import { resetSessionBudget } from './utils/costTracker';
resetSessionBudget('session-123', AUTONOM_BUDGET_CONFIG);
```

### 232. `getEfficiencyMetrics(sessionId)`
Effizienz-Metriken berechnen.
```typescript
import { getEfficiencyMetrics } from './utils/costTracker';
const metrics = getEfficiencyMetrics('session-123');
// Returns: { tokensPerMessage, costPerMessage, efficiency }
```

### 233. `DEFAULT_BUDGET_CONFIG`
Standard Budget Konfiguration.
```typescript
// { maxCostPerSession: 10, maxCostPerMessage: 2, maxTokens: 500000 }
```

### 234. `AUTONOM_BUDGET_CONFIG`
AUTONOM Mode Budget Konfiguration.
```typescript
// { maxCostPerSession: 50, maxCostPerMessage: 5, maxTokens: 2000000 }
```

### 235. `MODEL_PRICING`
Aktuelle Claude Model Preise.
```typescript
// claude-opus-4-20250514: { input: 15.00, output: 75.00 }
// claude-sonnet-4-20250514: { input: 3.00, output: 15.00 }
// claude-haiku-3-5-20241022: { input: 0.80, output: 4.00 }
```

---

## 📁 FILE OPERATIONS & FRAMEWORK DETECTION (236-255)

### 236. `detectFramework(projectPath)`
Framework automatisch erkennen.
```typescript
import { detectFramework } from './utils/fileSync';
const info = await detectFramework('/project');
// Returns: { framework: 'astro', version: '4.0.0', packageManager: 'bun' }
```

### 237. `getFileType(filePath, framework)`
Datei-Typ klassifizieren.
```typescript
import { getFileType } from './utils/fileSync';
const type = getFileType('src/pages/index.astro', 'astro');
// Returns: 'page' | 'component' | 'layout' | 'style' | 'config' | 'api'
```

### 238. `parseFile(filePath)`
Datei analysieren (Imports, Exports, Components).
```typescript
import { parseFile } from './utils/fileSync';
const info = await parseFile('src/components/Hero.tsx');
// Returns: { imports: [...], exports: [...], components: [...] }
```

### 239. `searchReplace(filePath, search, replace, options?)`
Globales Search/Replace mit Preview.
```typescript
import { searchReplace } from './utils/fileSync';
const result = await searchReplace(
  'src/styles.css',
  /color:\s*#000/g,
  'color: #333',
  { dryRun: true }
);
// Returns: { success, changes: 5, preview }
```

### 240. `searchFiles(rootPath, search, options?)`
Cross-File Search mit Context.
```typescript
import { searchFiles } from './utils/fileSync';
const results = await searchFiles('/project', /TODO:/i, {
  include: ['**/*.ts'],
  exclude: ['node_modules'],
  contextLines: 2,
});
// Returns: [{ file, line, match, context }]
```

### 241. `applyStyleChange(filePath, selector, styles, framework)`
CSS/Tailwind Änderungen anwenden.
```typescript
import { applyStyleChange } from './utils/fileSync';
await applyStyleChange(
  'src/components/Button.tsx',
  '.btn-primary',
  { backgroundColor: '#3B82F6', borderRadius: '8px' },
  'react'
);
```

### 242. `generateComponent(name, framework, options?)`
Boilerplate Component generieren.
```typescript
import { generateComponent } from './utils/fileSync';
const code = generateComponent('UserCard', 'react', {
  typescript: true,
  styled: 'tailwind',
});
```

### 243. `LiveSyncManager`
Live File Sync Manager.
```typescript
import { LiveSyncManager } from './utils/fileSync';
const sync = new LiveSyncManager('/project', {
  onChange: (file) => reloadPreview(),
});
sync.start();
```

### 244. `LiveSyncManager.trackFile(path)`
Datei für Sync tracken.
```typescript
sync.trackFile('src/components/Hero.tsx');
```

### 245. `LiveSyncManager.applyEdit(path, edit)`
Edit anwenden und syncen.
```typescript
await sync.applyEdit('src/styles.css', {
  type: 'replace',
  search: 'old-color',
  replace: 'new-color',
});
```

### 246. `stylesToTailwind(cssStyles)`
CSS zu Tailwind konvertieren.
```typescript
import { stylesToTailwind } from './utils/fileSync';
const tailwind = stylesToTailwind({
  backgroundColor: '#3B82F6',
  padding: '1rem',
  borderRadius: '0.5rem',
});
// Returns: 'bg-blue-500 p-4 rounded-lg'
```

### 247. `saveImageToSessionPictures(base64, sessionId, workingDir)`
Bild in Session Pictures speichern.
```typescript
import { saveImageToSessionPictures } from './imageUtils';
const path = saveImageToSessionPictures(base64Data, 'session-123', '/project');
// Returns: './pictures/session-123-1234567890-abc.png'
```

### 248. `saveFileToSessionFiles(data, fileName, sessionId, workingDir)`
Datei in Session Files speichern.
```typescript
import { saveFileToSessionFiles } from './imageUtils';
const path = saveFileToSessionFiles(data, 'report.pdf', 'session-123', '/project');
```

### 249. `detectImageFormat(base64Data)`
Bildformat aus Data URL erkennen.
```typescript
import { detectImageFormat } from './imageUtils';
const format = detectImageFormat('data:image/png;base64,...');
// Returns: 'png'
```

### 250. `extractBase64Data(base64Data)`
Pure Base64 aus Data URL extrahieren.
```typescript
import { extractBase64Data } from './imageUtils';
const pure = extractBase64Data('data:image/png;base64,ABC123...');
// Returns: 'ABC123...'
```

### 251. `ensurePicturesDirectory(workingDir)`
Pictures Directory erstellen falls nicht vorhanden.
```typescript
import { ensurePicturesDirectory } from './imageUtils';
const dir = ensurePicturesDirectory('/project');
// Returns: '/project/pictures'
```

### 252. `deleteSessionPictures(workingDir)`
Session Pictures aufräumen.
```typescript
import { deleteSessionPictures } from './imageUtils';
deleteSessionPictures('/project');
// Removes: /project/pictures/
```

### 253. `applyAstroStyles(filePath, selector, styles)`
Astro-spezifische Style Changes.
```typescript
// Internal: Handles Astro's <style> tags
await applyAstroStyles('src/pages/index.astro', '.hero', { ... });
```

### 254. `applyReactStyles(filePath, selector, styles)`
React/JSX Style Changes (Tailwind/CSS-in-JS).
```typescript
// Converts CSS to className or styled-components
await applyReactStyles('src/Button.tsx', '.btn', { ... });
```

### 255. `applyVueStyles(filePath, selector, styles)`
Vue SFC Style Changes.
```typescript
// Handles Vue's <style scoped>
await applyVueStyles('src/Card.vue', '.card', { ... });
```

---

## 🔑 OAUTH & SMART NAMING (256-270)

### 256. `generatePKCE()`
PKCE Code Verifier/Challenge generieren.
```typescript
import { generatePKCE } from './oauth';
const { codeVerifier, codeChallenge } = generatePKCE();
// codeVerifier: 32 bytes base64url
// codeChallenge: SHA256(verifier) base64url
```

### 257. `getAuthorizationURL(codeChallenge, codeVerifier)`
Authorization URL bauen.
```typescript
import { getAuthorizationURL } from './oauth';
const url = getAuthorizationURL(challenge, verifier);
// Returns: 'https://console.anthropic.com/oauth/authorize?...'
```

### 258. `exchangeCodeForTokens(code, codeVerifier)`
OAuth Code gegen Tokens tauschen.
```typescript
import { exchangeCodeForTokens } from './oauth';
const tokens = await exchangeCodeForTokens(authCode, verifier);
// Returns: { accessToken, refreshToken, expiresAt }
```

### 259. `refreshAccessToken(refreshToken)`
Access Token erneuern.
```typescript
import { refreshAccessToken } from './oauth';
const newTokens = await refreshAccessToken(tokens.refreshToken);
```

### 260. `isTokenExpired(expiresAt)`
Token Ablauf prüfen.
```typescript
import { isTokenExpired } from './oauth';
if (isTokenExpired(tokens.expiresAt)) {
  tokens = await refreshAccessToken(tokens.refreshToken);
}
// Returns true if expired or expires within 5 minutes
```

### 261. `startOAuthFlow()`
OAuth Flow starten (öffnet Browser).
```typescript
import { startOAuthFlow } from './oauth';
const { authUrl, pkce } = await startOAuthFlow();
// Opens browser, returns PKCE for callback handling
```

### 262. `analyzeProject(dir)`
Projekt vollständig analysieren.
```typescript
import { analyzeProject } from './smartNaming';
const analysis = await analyzeProject('/project');
// Returns: { name, framework, language, type, keywords, suggestedName, confidence }
```

### 263. `generateNameSuggestions(dir, count?)`
Name Vorschläge generieren.
```typescript
import { generateNameSuggestions } from './smartNaming';
const names = await generateNameSuggestions('/project', 5);
// Returns: ['astro-blog', 'typescript-api', 'web-dashboard', ...]
```

### 264. `quickAnalyzeForChatName(content, workingDir?)`
Schnelle Chat-Name Analyse.
```typescript
import { quickAnalyzeForChatName } from './smartNaming';
const name = await quickAnalyzeForChatName(firstMessage, '/project');
// Returns: 'Build Auth System' or similar
```

### 265. `detectProjectFramework(dir)`
Framework aus package.json erkennen.
```typescript
// Internal: Scores frameworks based on dependencies
// Returns highest scoring framework
```

### 266. `detectLanguage(dir)`
Primäre Sprache aus Dateierweiterungen.
```typescript
// Internal: Counts .ts, .js, .py, etc.
// Returns: 'typescript' | 'javascript' | 'python' | ...
```

### 267. `detectProjectType(dir)`
Projekt-Typ klassifizieren.
```typescript
// Internal: Checks for cli, api, web-app, library, mobile patterns
// Returns: 'web-app' | 'api' | 'cli' | 'library' | 'mobile'
```

### 268. `extractKeywords(text)`
Keywords mit N-gram Analyse extrahieren.
```typescript
// Internal: Generates bigrams, filters stopwords, boosts tech terms
// Returns scored keywords
```

### 269. `extractNgrams(text, n)`
N-grams generieren.
```typescript
// Internal: 'hello world' → ['hello', 'world', 'hello world']
```

### 270. `FRAMEWORK_PATTERNS`
Framework Detection Patterns.
```typescript
// 20+ patterns for: astro, next, react, vue, svelte, angular, ...
```

---

## 🏥 HEALTH MONITORING & RATE LIMITING (271-285)

### 271. `HealthMonitor.start()`
Health Monitoring starten.
```typescript
import { HealthMonitor } from './queue/healthMonitor';
const monitor = new HealthMonitor(queue);
monitor.start();
// Checks every 60s by default
```

### 272. `HealthMonitor.stop()`
Monitoring beenden.
```typescript
monitor.stop();
```

### 273. `HealthMonitor.getLastHealthCheck()`
Letzten Health Check abrufen.
```typescript
const check = monitor.getLastHealthCheck();
// Returns: { timestamp, status, database, queue, workers, memory }
```

### 274. `HealthMonitor.getMetrics()`
Dashboard Metriken abrufen.
```typescript
const metrics = monitor.getMetrics();
// Returns: { uptime, status, database, queue, workers, memory }
```

### 275. `HealthMonitor.getHealthScore()`
Health Score (0-100) berechnen.
```typescript
const score = monitor.getHealthScore();
// Deducts for: memory usage, stalled workers, queue backlog, slow db
```

### 276. `HealthMonitor.setCheckInterval(intervalMs)`
Check Intervall ändern.
```typescript
monitor.setCheckInterval(30000); // Every 30 seconds
```

### 277. `HealthMonitor.onCriticalMemory(callback)`
Memory Warning Handler registrieren.
```typescript
monitor.onCriticalMemory(() => {
  console.warn('Memory usage > 90%!');
  triggerGC();
});
```

### 278. `HealthMonitor.onDatabaseDown(callback)`
Database Down Handler.
```typescript
monitor.onDatabaseDown(() => {
  alertOps('Database connection failed');
});
```

### 279. `HealthMonitor.onQueueStalled(callback)`
Queue Stalled Handler.
```typescript
monitor.onQueueStalled(() => {
  restartWorkers();
});
```

### 280. `TokenBucketRateLimiter.canProceed(clientId)`
Rate Limit Check.
```typescript
import { wsRateLimiter } from './utils/rateLimiter';
if (!wsRateLimiter.canProceed(clientId)) {
  throw new RateLimitError('Too many requests');
}
```

### 281. `TokenBucketRateLimiter.getRemainingTokens(clientId)`
Verbleibende Tokens abrufen.
```typescript
const remaining = wsRateLimiter.getRemainingTokens(clientId);
// Returns: 45 (of 60 max)
```

### 282. `TokenBucketRateLimiter.isBlocked(clientId)`
Block Status prüfen.
```typescript
if (wsRateLimiter.isBlocked(clientId)) {
  const remaining = wsRateLimiter.getBlockedTimeRemaining(clientId);
  return `Blocked for ${remaining / 1000} seconds`;
}
```

### 283. `wsRateLimiter`
WebSocket Rate Limiter Singleton.
```typescript
// Config: 60 tokens, 10/sec refill, 5 violations → 1 min block
```

### 284. `expensiveOpLimiter`
Limiter für teure Operationen.
```typescript
// Config: 10 tokens, 1/5sec refill, 3 violations → 5 min block
```

### 285. `premiumBuildLimiter`
Premium Build Rate Limiter.
```typescript
// Config: 5 builds, 1/min refill, 3 violations → 10 min block
```

---

## 📊 Quick Reference (Erweitert)

| Kategorie | Funktionen | Hauptnutzen |
|-----------|------------|-------------|
| Build | 1-15 | Website erstellen |
| Premium | 16-28 | 100-Step AI Builder |
| Autonomous | 29-40 | Selbstständige Ausführung |
| Learning | 41-52 | Intelligente Verbesserung |
| Deploy | 53-62 | Production Delivery |
| Sessions | 63-72 | Chat Management |
| Queue | 73-80 | Task Processing |
| German | 81-85 | DE Business Compliance |
| MCP | 86-92 | Claude Code Integration |
| Utils | 93-100 | System Helpers |
| WebSocket | 101-120 | Real-time Communication |
| API Routes | 121-140 | REST Endpoints |
| Factories | 141-150 | Intelligence System Creation |
| **Crypto** | 151-165 | Encryption & Security |
| **Result** | 166-185 | Error Handling |
| **Timeout** | 186-200 | Retry & Hang Detection |
| **Validation** | 201-215 | Input & Path Security |
| **Logging** | 216-235 | Cost & Performance Tracking |
| **FileOps** | 236-255 | Framework Detection & Editing |
| **OAuth** | 256-270 | Authentication & Naming |
| **Health** | 271-285 | Monitoring & Rate Limiting |

---

## 🔄 Erweiterte Flows

### Sichere Token Speicherung
```
generatePKCE() → exchangeCodeForTokens() → encryptObject() → saveToFile()
```

### Error-Resilient API Call
```
tryCatchAsync() → withRetry() → withTimeout() → parseApiError()
```

### Vollständige Session Validierung
```
validateInput() → isPathSafe() → checkBudget() → canAffordCall()
```

### Framework-Agnostic Editing
```
detectFramework() → parseFile() → searchReplace() → applyStyleChange()
```

### Health-Aware Queue
```
HealthMonitor.start() → wsRateLimiter.canProceed() → TaskQueue.addTask()
```
