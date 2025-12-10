# Agent Girl - Complete Feature Documentation

Umfassende Feature-Dokumentation für Agent Girl - Desktop-First AI Development Platform mit **280+ Funktionen**.

---

## 📑 Inhaltsverzeichnis

1. [Core Features](#-core-features)
2. [Premium Builder (100-Step)](#-premium-builder-100-step-system)
3. [AUTONOM Mode](#-autonom-mode)
4. [Intelligence System](#-intelligence-system)
5. [Site Generation](#-site-generation)
6. [Website Cloning](#-website-cloning)
7. [Deploy & Export](#-deploy--export)
8. [German Business Compliance](#-german-business-compliance)
9. [Security Features](#-security-features)
10. [Task Queue System](#-task-queue-system)
11. [Cost & Performance Tracking](#-cost--performance-tracking)
12. [Real-Time Communication](#-real-time-communication)
13. [File System Operations](#-file-system-operations)
14. [Session Management](#-session-management)
15. [Error Handling](#-error-handling)
16. [Visual Editor](#-visual-editor)
17. [Vergleich mit Alternativen](#-vergleich-agent-girl-vs-alternativen)
18. [Fehlende Essential Features](#-essenzielle-features-roadmap)

---

## 🎯 Core Features

### 1. Desktop-First Chat Interface
- **Native Desktop App** - Electron-basiert mit vollem File System Zugriff
- **WebSocket Real-Time** - Bidirektionale Kommunikation für Streaming
- **Session Persistence** - SQLite-basierte Session-Speicherung
- **Multi-Mode Support** - 8+ spezialisierte Modes (Build, Premium, AUTONOM, etc.)

### 2. Claude Agent SDK Integration
- **Direct SDK Access** - Vollständige Claude SDK Integration
- **Streaming Responses** - Real-time Token Streaming
- **Tool Use** - Native Tool Calling mit 50+ Tools
- **Permission Modes** - default, acceptEdits, bypassPermissions

### 3. Working Directory Control
- **Project Context** - Arbeitet direkt im Projekt-Verzeichnis
- **File System Access** - Lesen, Schreiben, Erstellen, Löschen
- **Git Integration** - Commits, Branches, Push/Pull
- **Path Security** - Traversal Protection, Symlink Resolution

### 4. Model Support

| Model | Provider | Features |
|-------|----------|----------|
| Claude Sonnet 4 | Anthropic | Default, balanced |
| Claude Opus 4 | Anthropic | Complex tasks |
| Claude Haiku 3.5 | Anthropic | Fast, cost-efficient |
| Extended Thinking | Anthropic | Up to 10k thinking tokens |

### 5. Tool Integration
- **File Operations**: Read, Write, Edit with incremental saves
- **Bash Execution**: Background process management
- **Web Search/Fetch**: External data retrieval
- **MCP Servers**: Extensible tool ecosystem
- **Custom Agents**: Task-specific sub-agents

### 6. Permission Modes

| Mode | Description |
|------|-------------|
| `bypassPermissions` | Auto-approve all actions (default) |
| `plan` | Review before execution |
| `acceptEdits` | Auto-approve file edits only |
| `default` | Ask for each action |

---

## 💎 PREMIUM BUILDER (100-Step System)

### Intelligent Decomposition
```
10 Phasen × 10 Schritte = 100 optimale Tasks
```

| Phase | Steps | Output |
|-------|-------|--------|
| 1. Foundation | 1-10 | Astro Project Setup, Tailwind, Directory Structure |
| 2. Design System | 11-20 | Colors, Typography, Components, CSS Variables |
| 3. Layout | 21-30 | Header, Footer, Navigation, Responsive Grid |
| 4. Hero Section | 31-40 | Headlines, CTAs, Animations, Background |
| 5. Content Sections | 41-50 | Features, Services, About, Benefits |
| 6. Social Proof | 51-60 | Testimonials, Logos, Case Studies |
| 7. Conversion | 61-70 | Pricing, FAQ, Contact Forms, CTA Sections |
| 8. SEO & Performance | 71-80 | Meta Tags, Sitemap, Image Optimization |
| 9. Testing | 81-90 | Accessibility, Mobile, Lighthouse Audit |
| 10. Delivery | 91-100 | Build, Deploy Preview, Export |

### Nische-Spezifische Templates
- **Dental** - Praxiswebsite mit Terminbuchung
- **Legal** - Kanzleiwebsite mit Kontaktformular
- **Restaurant** - Speisekarte, Reservierung
- **Fitness** - Kursplan, Mitgliedschaft
- **Real Estate** - Immobilienlisting

### Live Editing
- **Visual Preview** - Echtzeit-Vorschau während Build
- **Quick Edit** - Natural Language Änderungen
- **Section Regeneration** - Einzelne Sections neu generieren
- **Undo/Redo** - Vollständige History

---

## 🤖 AUTONOM Mode

### Zero-Intervention Execution
```
AUTONOM aktivieren → Task beschreiben → Vollständige Ausführung
```

### Core Capabilities
- **Self-Healing** - Automatische Error Recovery
- **Budget Control** - $50/Session, $5/Message Limits
- **Progress Tracking** - PROGRESS.json Checkpointing
- **Context Continuation** - Session-übergreifende Handoffs

### Autonomous Patterns
```typescript
const harness = createAutonomousHarness('/project');
await harness.initialize(appSpec);
await harness.runContinuous((progress) => {
  // 24h autonome Entwicklung mit Context Resets
});
```

### Error Resilience

| Layer | Strategy |
|-------|----------|
| 1. Prevention | Validate before action |
| 2. Detection | Catch and classify |
| 3. Recovery | Fix and retry (max 5x) |
| 4. Continuation | Resume from checkpoint |

---

## 🧠 Intelligence System

### Learning Engine
- **Preference Learning** - Lernt Code-Style, Framework-Präferenzen
- **Confidence Tracking** - Steigt mit Wiederholung
- **Monthly Decay** - Alte Präferenzen verblassen (0.95 factor)
- **Context-Based Suggestions** - Intelligente Vorschläge

### Goal Decomposition
```
"Build Auth System"
     ↓
┌────────────────────┐
│ 1. User Model      │
│ 2. Register EP     │
│ 3. Login EP        │
│ 4. JWT Middleware  │
│ 5. Protected Routes│
│ 6. Password Reset  │
└────────────────────┘
```

### Validation Engine
- **TypeScript Check** - `bunx tsc --noEmit`
- **ESLint** - Code Quality
- **Unit Tests** - Vitest Integration
- **Build Verification** - Production Build Test
- **API Tests** - Endpoint Validation
- **UI Regression** - Visual Comparison

---

## 📦 Site Generation

### Quick Site
```typescript
await site('SaaS landing for TaskFlow', '/output');

await quickSite({
  description: 'Portfolio für Designer',
  outputPath: '/output',
  install: true,
  build: true,
});
```

### Site Types

| Type | Templates | Sections |
|------|-----------|----------|
| SaaS | Landing, Dashboard | Hero, Features, Pricing, FAQ |
| Portfolio | Creative, Minimal | Hero, Projects, About, Contact |
| Blog | Tech, Personal | Posts, Categories, Author |
| Shop | Product, Service | Catalog, Cart, Checkout |
| Docs | Technical, API | Sidebar, Search, Code Blocks |

### Auto-Detection
- **Framework Detection** - Astro, Next.js, React, Vue, Svelte
- **Language Detection** - TypeScript, JavaScript, Python
- **Project Type** - web-app, api, cli, library, mobile
- **N-gram Analysis** - Intelligent naming suggestions

---

## 🔌 Website Cloning

### GoClone Integration
```typescript
POST /api/clone/quick
{ "url": "https://example.com", "port": 4321 }
```

### Features
- **Complete Asset Download** - HTML, CSS, JS, Images
- **JS Rendering** - Chrome Headless für SPAs
- **Auto-Serve** - Lokaler Preview Server
- **SSE Progress** - Real-time Clone Status

---

## 🚀 Deploy & Export

### One-Click Deploy
```typescript
await deploy.deploy('vercel');
// Providers: vercel, netlify, cloudflare, hetzner, coolify
```

### Export Formats
- **ZIP** - Downloadable Archive
- **GitHub** - Direct Repository Push
- **Vercel/Netlify** - CLI Deploy
- **Docker** - Containerized Export

---

## 🇩🇪 German Business Compliance

### Rechnungserstellung (§14 UStG)
```typescript
await createInvoice({
  kunde: 'Max Mustermann GmbH',
  leistung: 'Website Entwicklung',
  betrag: 5000,
  steuersatz: 19,
});
```

### USt-Voranmeldung
```typescript
await prepareUStVA({
  zeitraum: '2025-Q1',
  umsaetze: 50000,
  vorsteuer: 2500,
});
```

### DATEV Export & Mahnwesen
- DATEV CSV Export für Steuerberater
- 3-Stufen Mahnung (§286/288 BGB)
- GoBD Kassenbuch

---

## 🔐 Security Features

### Cryptography
- **AES-256-GCM** - Symmetrische Verschlüsselung
- **scrypt Key Derivation** - N=16384, r=8, p=1
- **Machine-Specific Secrets** - Nur lokale Entschlüsselung
- **Constant-Time Comparison** - Timing Attack Prevention

### Path Security
- **Traversal Protection** - `../` Pattern Detection
- **Null Byte Detection** - `\x00` Injection Prevention
- **Symlink Resolution** - Escape Attempt Detection

### Rate Limiting
- **Token Bucket Algorithm** - Fair Resource Distribution
- **Violation Tracking** - Progressive Penalties
- **Client Blocking** - Abuse Prevention

---

## ⚙️ Task Queue System

### Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Task Queue  │────▶│ Worker Pool │────▶│  Results    │
│  (SQLite)   │     │  (50 conc.) │     │  (Stream)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Features
- **Priority Levels** - low, medium, high, critical
- **Retry Logic** - Exponential Backoff
- **Timeout Handling** - Configurable per Task
- **Health Monitoring** - Database, Queue, Workers, Memory

---

## 📊 Cost & Performance Tracking

### Token Tracking
```typescript
const budget = getSessionBudget('session-123');
// { totalCost: 2.50, remaining: 7.50, tokensUsed: 125000 }
```

### Model Pricing (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| Opus 4 | $15.00 | $75.00 |
| Sonnet 4 | $3.00 | $15.00 |
| Haiku 3.5 | $0.80 | $4.00 |

### Budget Limits
- **Standard** - $10/session, $2/message
- **AUTONOM** - $50/session, $5/message

---

## 📡 Real-Time Communication

### WebSocket Events

**Client → Server:**
```typescript
{ type: 'message', content: '...', sessionId: '...' }
{ type: 'stop' }
{ type: 'setPermissionMode', mode: 'bypassPermissions' }
{ type: 'premium:start', config: {...} }
```

**Server → Client:**
```typescript
{ type: 'text', content: '...' }
{ type: 'thinking', content: '...' }
{ type: 'tool_use', name: '...', input: {...} }
{ type: 'done' }
```

---

## 📁 File System Operations

### Framework Detection
```typescript
const info = await detectFramework('/project');
// { framework: 'astro', version: '4.0.0', packageManager: 'bun' }
```

### Live Sync
```typescript
const sync = new LiveSyncManager('/project', {
  onChange: (file) => reloadPreview(),
});
await sync.applyEdit('src/styles.css', { search: 'old', replace: 'new' });
```

---

## 💬 Session Management

### Session Types
- **General** - Allgemeine Unterstützung
- **Coder** - Code-fokussiert
- **Build** - Website Generation
- **Premium** - 100-Step Builder
- **AUTONOM** - Zero-Intervention
- **Unified** - Kombiniert alle Modes

### Features
- **Persistence** - SQLite Storage
- **Export** - JSON, Markdown, Summary
- **Search** - Cross-Session Search
- **History** - Message Pagination

---

## 🛠️ Error Handling

### Result Type Pattern
```typescript
const result = await tryCatchAsync(() => fetchUser(id));
if (isErr(result)) {
  const message = toUserMessage(result.error);
  return Err(new UserError(message));
}
return Ok(result.value);
```

### Custom Error Classes
- ValidationError, NotFoundError, AuthenticationError
- PermissionError, RateLimitError

---

## 🎨 Visual Editor

### Edit Modes
| Mode | Description |
|------|-------------|
| **Direct** | Instant CSS/text edits |
| **AI** | Claude-powered suggestions |
| **Hybrid** | Combined approach |

### Features
- **Element Selection** - Click to edit
- **Style Editor** - Visual CSS
- **Image Editor** - Replace, optimize
- **Source Code Sync** - Live framework sync
- **Tailwind Generation** - CSS → Tailwind

---

## 🆚 Vergleich: Agent Girl vs. Alternativen

### Feature Matrix

| Feature | Agent Girl | Framer | Bolt.new | Lovable |
|---------|:----------:|:------:|:--------:|:-------:|
| **Desktop App** | ✅ Native | ❌ Web | ❌ Web | ❌ Web |
| **File System Zugriff** | ✅ Voll | ❌ Nein | ⚠️ Limited | ⚠️ Limited |
| **100-Step Builder** | ✅ Ja | ❌ Nein | ❌ Nein | ❌ Nein |
| **AUTONOM Mode (24h)** | ✅ Ja | ❌ Nein | ⚠️ Basic | ⚠️ Basic |
| **Clean Code Export** | ✅ Ja | ⚠️ Locked | ✅ Ja | ✅ Ja |
| **German Compliance** | ✅ Voll | ❌ Nein | ❌ Nein | ❌ Nein |
| **Custom Models** | ✅ Claude | ❌ Nein | ⚠️ Limited | ⚠️ Limited |
| **MCP Integration** | ✅ Ja | ❌ Nein | ❌ Nein | ❌ Nein |
| **Self-Hosted** | ✅ Ja | ❌ Nein | ❌ Nein | ❌ Nein |
| **Privacy (Lokal)** | ✅ Ja | ❌ Cloud | ❌ Cloud | ❌ Cloud |
| **Visual Editor** | ✅ Ja | ✅ Besser | ✅ Ja | ✅ Ja |
| **Drag & Drop** | ⚠️ Basic | ✅ Advanced | ✅ Ja | ✅ Ja |
| **Figma Import** | ❌ Nein | ✅ Ja | ⚠️ Limited | ✅ Ja |
| **Animation Builder** | ⚠️ CSS | ✅ Visual | ⚠️ Basic | ⚠️ Basic |
| **Component Library** | ⚠️ Manual | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **Hosting inkludiert** | ❌ External | ✅ Ja | ✅ Ja | ✅ Ja |
| **Team Collaboration** | ❌ Nein | ✅ Ja | ✅ Ja | ✅ Ja |
| **Version History** | ✅ Git | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **CMS Integration** | ⚠️ Manual | ⚠️ Limited | ✅ Built-in | ✅ Built-in |

### Detailvergleich

#### Framer (framer.com)
**Stärken:**
- Erstklassiger Visual Editor mit WYSIWYG
- Integrierte Animations-Engine (Motion)
- Figma-to-Framer Import
- CMS für Content Management
- Hosting inklusive
- Component Variants System

**Schwächen:**
- Kein Code-Export (Vendor Lock-in)
- Keine lokale Entwicklung
- Begrenzte Backend-Logik
- Hohe Preise für Teams

**Agent Girl kann lernen:**
- ✅ Visual Drag & Drop Builder
- ✅ Animation Timeline Editor
- ✅ Figma Plugin für Import

#### Bolt.new (bolt.new)
**Stärken:**
- Schnelle Prototypen in Sekunden
- Full-Stack Apps (Frontend + Backend)
- Supabase Integration
- Code Export möglich
- AI-first Workflow

**Schwächen:**
- Cloud-only (keine lokale Entwicklung)
- Begrenzte Customization
- Keine Desktop-Integration
- Weniger Control über Code-Qualität

**Agent Girl kann lernen:**
- ✅ Supabase Quick-Setup Integration
- ✅ Faster Prototyping Flow
- ✅ One-Click Full-Stack Templates

#### Lovable (lovable.dev)
**Stärken:**
- Sehr guter AI Code Generator
- GitHub Integration
- Figma Import
- Supabase Backend Support
- Iterative Refinement

**Schwächen:**
- Cloud-based
- Begrenzte lokale Entwicklung
- Weniger Control über Build-Prozess
- Keine deutschen Business-Features

**Agent Girl kann lernen:**
- ✅ GitHub-first Workflow
- ✅ Bessere AI Refinement Loops
- ✅ Supabase Auto-Configuration

---

## 🚀 Essenzielle Features (Roadmap)

Basierend auf dem Vergleich - Features die Agent Girl noch braucht:

### 1. Visual Drag & Drop Builder
**Priority: HIGH**
```
Wie Framer/Webflow - aber mit Clean Code Export
- Canvas-basierter Editor
- Drag & Drop Components
- Visual Responsive Breakpoints
- Animation Timeline
```

### 2. Figma Import
**Priority: HIGH**
```
Figma Design → Agent Girl → Production Website
- Figma Plugin oder URL Import
- Auto-Extract Design Tokens
- Component Mapping
- Asset Download
```

### 3. Integrated CMS
**Priority: MEDIUM**
```
Headless CMS für Content Management
- Collections (Blog, Products, etc.)
- Content Types
- Media Library
- API Endpoint Generation
```

### 4. Animation Builder
**Priority: MEDIUM**
```
Visual Animation Editor
- Keyframe Timeline
- Scroll Animations
- Hover/Click Triggers
- Export als CSS/Framer Motion
```

### 5. Team Collaboration
**Priority: MEDIUM**
```
Multi-User Support
- Real-time Editing
- Comments/Feedback
- Role-based Access
- Change History
```

### 6. One-Click Supabase
**Priority: MEDIUM**
```
Backend in Sekunden
- Auth Setup (Google, GitHub, Email)
- Database Tables
- Row Level Security
- API Generation
```

### 7. Component Marketplace
**Priority: LOW**
```
Pre-built Components kaufen/teilen
- Premium Sections
- Animation Presets
- Niche-specific Blocks
- Community Contributions
```

### 8. Hosting Integration
**Priority: LOW**
```
One-Click Deploy mit Custom Domains
- Vercel/Netlify simplified
- SSL automatisch
- Analytics Dashboard
- Preview Deployments
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
| Factories | 141-150 | Intelligence System |
| Crypto | 151-165 | Encryption & Security |
| Result | 166-185 | Error Handling |
| Timeout | 186-200 | Retry & Hang Detection |
| Validation | 201-215 | Input & Path Security |
| Logging | 216-235 | Cost & Performance |
| FileOps | 236-255 | Framework Detection |
| OAuth | 256-270 | Authentication & Naming |
| Health | 271-285 | Monitoring & Rate Limiting |

---

## 🛠️ Development

### Start Development Server
```bash
bun run dev
```

### Type Checking
```bash
bunx tsc --noEmit
```

### MCP Server
```json
{
  "mcpServers": {
    "agent-girl": {
      "command": "bun",
      "args": ["run", "/path/to/agent-girl/mcp-server/index.ts"]
    }
  }
}
```

---

*Letzte Aktualisierung: Dezember 2025*
