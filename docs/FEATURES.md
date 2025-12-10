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

## 🆚 Vergleich: Agent Girl vs. Alternativen (Aktualisiert Dezember 2025)

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
| **AI Wireframing** | ❌ Nein | ✅ NEU 2025 | ⚠️ Basic | ⚠️ Basic |
| **Component Library** | ⚠️ Manual | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **Hosting inkludiert** | ❌ External | ✅ Ja | ✅ Ja | ✅ Ja |
| **Team Collaboration** | ❌ Nein | ✅ Ja | ✅ Ja | ✅ Multiplayer |
| **Version History** | ✅ Git | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **CMS Integration** | ⚠️ Manual | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **A/B Testing** | ❌ Nein | ✅ NEU 2025 | ❌ Nein | ❌ Nein |
| **Visual Element Click-Edit** | ⚠️ Basic | ✅ Ja | ✅ Ja | ✅ NEU 2.0 |
| **AI Chat Agent** | ✅ Voll | ⚠️ Limited | ✅ Ja | ✅ NEU 2.0 |

### Detailvergleich (Dezember 2025)

#### Framer (framer.com) - Spring 2025 Update

**Neueste Features (2025):**
- 🆕 **Wireframer** - AI-generierte Wireframes aus Text-Prompts mit automatischem Responsive Design
- 🆕 **Workshop** - AI-powered Custom Components ohne Code (Tab Sections, Cookie Banner, 3D Cards)
- 🆕 **Vectors 2.0** - Scalable Sets, Variable Styling, Stroke Animations, Instant SVG Editing
- 🆕 **Analytics** - Built-in A/B Testing, Funnels, User Behavior Insights
- 🆕 **Masonry Grids** - Pinterest-like Layouts mit einem Klick

**Stärken:**
- Erstklassiger Visual Editor mit WYSIWYG
- Integrierte Animations-Engine (Framer Motion)
- Figma-to-Framer Import
- CMS für Content Management
- Hosting inklusive mit Custom Domains
- Component Variants System
- **NEU:** AI Wireframing in Sekunden

**Schwächen:**
- Kein Code-Export (Vendor Lock-in)
- Keine lokale Entwicklung
- Begrenzte Backend-Logik
- Hohe Preise für Teams ($20-$60/month)

**Agent Girl kann lernen:**
- ✅ **AI Wireframer** - Text zu Layout Wireframe
- ✅ **Workshop-Style Component Generator** - Natural Language zu Component
- ✅ Visual Drag & Drop Builder
- ✅ Animation Timeline Editor mit Keyframes
- ✅ A/B Testing Integration
- ✅ Masonry Grid Support

#### Bolt.new (bolt.new) - StackBlitz

**Core Features:**
- **WebContainers** - Browser-basierte Node.js Umgebung
- **Full Environment Control** - AI hat Zugriff auf Filesystem, Server, Package Manager, Terminal
- **Multi-Framework** - Astro, Vite, Next.js, Svelte, Vue, Remix
- **Smart Error Handling** - AI erkennt und behebt Fehler automatisch
- **Claude Integration** - Powered by Anthropic Claude

**Stärken:**
- Schnelle Prototypen in Sekunden (Zero to MVP in Stunden)
- Full-Stack Apps (Frontend + Backend + DB)
- Supabase Integration
- Code Export möglich
- AI-first Workflow
- Gutes Error Recovery

**Schwächen:**
- Cloud-only (keine lokale Entwicklung)
- Begrenzte Customization
- Keine Desktop-Integration
- Weniger Control über Code-Qualität
- Token-Limits pro Tier

**Preise:**
- Free: Limited tokens
- Pro ($9/mo): Mehr tokens, private Projekte
- Team: Custom domains, SEO, Token Rollover

**Agent Girl kann lernen:**
- ✅ **Supabase Quick-Setup** - One-Click Backend
- ✅ Faster Prototyping Flow
- ✅ One-Click Full-Stack Templates
- ✅ Smart Error Detection & Auto-Fix

#### Lovable (lovable.dev) - Lovable 2.0 Update

**Neueste Features (2.0 - 2025):**
- 🆕 **Chat Mode Agent** - Multi-step Reasoning, File Search, Log Check, DB Queries
- 🆕 **Visual Element Editing** - Click auf Element → direkt ändern (Farbe, Style, Text)
- 🆕 **Multiplayer** - Real-time Team Collaboration
- 🆕 **Security Scan** - Vulnerability Detection vor Deploy
- 🆕 **Supabase Integration 2.0** - Smarter Debugging, Custom Signup Pages

**Stats:** 500,000+ Users, 25,000+ neue Produkte täglich

**Stärken:**
- Sehr guter AI Code Generator (Full-Stack Engineer Qualität)
- GitHub Sync & Export
- Figma Import
- Supabase Backend Support
- React + TypeScript native
- Stripe Integration
- **NEU:** Visual Click-to-Edit ohne AI Credits

**Schwächen:**
- Cloud-based only
- Begrenzte lokale Entwicklung
- Weniger Control über Build-Prozess
- Keine deutschen Business-Features

**Agent Girl kann lernen:**
- ✅ **Visual Click-to-Edit** - Element anklicken, direkt ändern
- ✅ **Chat Mode Agent** - Multi-step AI mit Debugging
- ✅ **Security Scan** vor Deployment
- ✅ GitHub-first Workflow
- ✅ Supabase Auto-Configuration mit Custom Auth Pages

---

## 🚀 Essenzielle Features (Roadmap - Aktualisiert Dezember 2025)

Basierend auf Konkurrenzanalyse - Features die Agent Girl noch braucht um wettbewerbsfähig zu sein:

---

### 🔴 KRITISCH (Sofort implementieren)

#### 1. AI Wireframer (wie Framer)
**Priority: CRITICAL** | **Aufwand: 2-3 Wochen**
```
Text-Prompt → Responsive Wireframe in Sekunden
```
**Implementation:**
- Natural Language Parser für Layout-Beschreibungen
- Grid System Generator (CSS Grid / Flexbox)
- Automatische Breakpoint-Generierung
- Integration mit Premium Builder als Step 1-5

**Beispiel:**
```typescript
await wireframe("Landing page mit Hero, 3 Features, Testimonials, CTA");
// → Generiert HTML/Tailwind Wireframe mit responsive Breakpoints
```

#### 2. Visual Click-to-Edit (wie Lovable 2.0)
**Priority: CRITICAL** | **Aufwand: 1-2 Wochen**
```
Element anklicken → Direkt ändern (ohne AI Credits)
```
**Implementation:**
- Element Selector mit Overlay
- Inline Style Editor (Color Picker, Font, Spacing)
- Direkte Text-Bearbeitung
- Source Code Sync mit Framework

**Bereits vorhanden in Agent Girl:**
- `useContentEdit.ts` Hook - Erweitern!
- Visual Editor Mode - Verbessern!

#### 3. One-Click Supabase Setup (wie Bolt.new + Lovable)
**Priority: CRITICAL** | **Aufwand: 1 Woche**
```
"Add auth" → Komplettes Auth-System mit DB
```
**Implementation:**
- Supabase CLI Integration
- Auth Provider Setup (Google, GitHub, Email, Magic Link)
- Auto-Generate Tables (users, profiles)
- RLS Policies automatisch
- TypeScript Types Generation

---

### 🟠 HOCH (Q1 2025)

#### 4. Workshop-Style Component Generator (wie Framer Workshop)
**Priority: HIGH** | **Aufwand: 2 Wochen**
```
"Cookie Banner mit Accept/Decline" → Funktionale Component
```
**Implementation:**
- Natural Language → React/Astro Component
- Interactive Preview
- Accessibility built-in
- Export als wiederverwendbare Component

#### 5. Figma Import
**Priority: HIGH** | **Aufwand: 3-4 Wochen**
```
Figma URL/Plugin → Production-Ready Code
```
**Implementation:**
- Figma API Integration
- Design Token Extraction (Colors, Fonts, Spacing)
- Auto Layout → CSS Grid/Flexbox
- Component Detection
- Asset Download & Optimization

#### 6. Security Scan (wie Lovable 2.0)
**Priority: HIGH** | **Aufwand: 1 Woche**
```
Pre-Deploy Security Check
```
**Implementation:**
- Dependency Vulnerability Check (npm audit)
- Secret Detection (API Keys in Code)
- XSS/CSRF Pattern Detection
- OWASP Top 10 Scan
- Report mit Fix-Suggestions

---

### 🟡 MITTEL (Q2 2025)

#### 7. Animation Timeline Editor (wie Framer)
**Priority: MEDIUM** | **Aufwand: 3 Wochen**
```
Visual Keyframe Editor für Animationen
```
**Implementation:**
- Timeline UI Component
- Keyframe-based Animation
- Easing Curves Visual Editor
- Scroll-triggered Animations
- Export als CSS/Framer Motion

#### 8. A/B Testing Integration (wie Framer)
**Priority: MEDIUM** | **Aufwand: 2 Wochen**
```
Variant Testing ohne externe Tools
```
**Implementation:**
- Variant Creation UI
- Traffic Splitting Logic
- Conversion Tracking
- Analytics Dashboard
- Winner Detection

#### 9. Integrated CMS
**Priority: MEDIUM** | **Aufwand: 3-4 Wochen**
```
Headless CMS für Content Management
```
**Implementation:**
- Content Collections (Blog, Products, Team)
- Rich Text Editor (Markdown/WYSIWYG)
- Media Library mit Optimization
- API Generation (REST + GraphQL)
- Astro Content Collections Integration

#### 10. Team Collaboration / Multiplayer (wie Lovable 2.0)
**Priority: MEDIUM** | **Aufwand: 4 Wochen**
```
Real-time Multi-User Editing
```
**Implementation:**
- WebSocket Presence System
- Cursor Sharing (wie Figma)
- Comment System
- Role-based Access (Owner, Editor, Viewer)
- Change History mit Blame

---

### 🟢 NIEDRIG (Q3+ 2025)

#### 11. Component Marketplace
**Priority: LOW** | **Aufwand: 4+ Wochen**
```
Pre-built Components kaufen/teilen
```
**Features:**
- Premium Section Templates
- Animation Presets
- Niche-specific Blocks (SaaS, Portfolio, Restaurant)
- Community Contributions
- Monetization für Creator

#### 12. Built-in Hosting
**Priority: LOW** | **Aufwand: 4+ Wochen**
```
One-Click Deploy mit Custom Domain
```
**Features:**
- Vercel/Netlify/Cloudflare abstraction
- Custom Domain Setup
- SSL automatisch
- Preview Deployments
- Analytics Dashboard

---

### 📊 Implementation Priority Matrix

| Feature | Impact | Aufwand | Priority | Empfehlung |
|---------|:------:|:-------:|:--------:|------------|
| AI Wireframer | 🔥🔥🔥 | Medium | CRITICAL | Woche 1-2 |
| Visual Click-Edit | 🔥🔥🔥 | Low | CRITICAL | Woche 1 |
| Supabase Setup | 🔥🔥🔥 | Low | CRITICAL | Woche 2 |
| Component Generator | 🔥🔥 | Medium | HIGH | Woche 3-4 |
| Figma Import | 🔥🔥 | High | HIGH | Woche 5-8 |
| Security Scan | 🔥🔥 | Low | HIGH | Woche 4 |
| Animation Editor | 🔥 | High | MEDIUM | Q2 |
| A/B Testing | 🔥 | Medium | MEDIUM | Q2 |
| CMS | 🔥 | High | MEDIUM | Q2 |
| Multiplayer | 🔥 | High | MEDIUM | Q2 |
| Marketplace | ⭐ | Very High | LOW | Q3+ |
| Hosting | ⭐ | High | LOW | Q3+ |

---

### 🎯 Quick Wins (Diese Woche machbar)

1. **Visual Click-Edit verbessern** - `useContentEdit.ts` erweitern
2. **Security Scan** - npm audit + secret detection
3. **Supabase CLI Integration** - `supabase init` + `supabase gen types`

### 💡 Agent Girl Unique Selling Points (USPs)

Diese Features haben nur wir - behalten & ausbauen:

| USP | Konkurrenz hat NICHT |
|-----|----------------------|
| **Desktop Native** | Alle cloud-only |
| **100-Step Builder** | Keine strukturierte Phasen |
| **AUTONOM Mode 24h** | Nur basic auto-continue |
| **German Compliance** | Keine DE Business Features |
| **Full File System** | Sandboxed/Limited |
| **Self-Hosted** | Vendor Lock-in |
| **MCP Integration** | Keine Tool Ecosystem |
| **Clean Code Export** | Framer locked |

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
