# Agent Girl

A desktop-first chat interface for Claude Agent SDK with real-time streaming, persistent sessions, and specialized sub-agents, running locally with full file system access.

## Project Structure

```
agent-boy2/
├── server/               # Backend (Bun + WebSocket)
│   ├── server.ts         # Main entry point (port 3001)
│   ├── agents.ts         # Agent configuration
│   ├── routes/           # API endpoints
│   ├── commands/         # Slash commands per mode
│   ├── modes/            # System prompts per mode
│   ├── templates/        # CLAUDE.md templates per mode
│   └── websocket/        # Real-time messaging
├── client/               # Frontend (React 19 + TypeScript)
│   ├── App.tsx           # Main React component
│   ├── components/       # UI components
│   │   ├── chat/         # Chat interface
│   │   ├── message/      # Message rendering
│   │   ├── sidebar/      # Navigation
│   │   └── ui/           # Base components (Radix UI)
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Client utilities
├── data/                 # SQLite session database
└── dist/                 # Build output
```

## Organization Rules

**Modularity principles:**
- API routes → `/server/routes`, one file per resource
- React components → `/client/components`, one component per file
- Slash commands → `/server/commands/[mode]`, one command per .md file
- Utilities → grouped by domain (server/utils, client/utils)
- Tests → co-located with code being tested

**Single responsibility:**
- Keep files focused and under 300 lines
- Extract shared logic to utilities
- Mode-specific features stay in mode folders

## Code Quality - Zero Tolerance

After editing ANY file, run ALL checks:

```bash
bunx tsc --noEmit
bunx eslint .
```

Fix ALL errors/warnings before continuing.

**Server restart (if needed):**
```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null; bun run dev
```

Read server output and fix ALL warnings/errors.

---

## Long-Running Agent Patterns (Anthropic Best Practices)

### Session Resume Protocol

Every session should start with structured onboarding:

```bash
# 1. Verify location
pwd

# 2. Check for existing progress
cat PROGRESS.json 2>/dev/null

# 3. Review recent work
git log --oneline -10

# 4. Validate environment
bunx tsc --noEmit && bun test

# 5. Resume from last checkpoint
```

### Checkpointing System

Maintain `PROGRESS.json` for resumable workflows:

```json
{
  "session_id": "uuid",
  "current_step": 15,
  "total_planned": 40,
  "features": [
    {"name": "Auth System", "status": "done", "step": 5},
    {"name": "User Dashboard", "status": "in_progress", "step": 15}
  ],
  "last_checkpoint": "timestamp",
  "can_resume_from": 15
}
```

**Rules:**
- Update after every milestone
- Git commit after significant progress
- Leave code in "clean state" (mergeable to main)

### Feature Decomposition

Break complex tasks into discrete, testable units:

```
BAD:  "Build authentication system"

GOOD:
[ ] User model erstellen
[ ] Register endpoint
[ ] Login endpoint
[ ] JWT middleware
[ ] Protected routes
[ ] Password reset
```

### Quality Gates (Per Step)

Before proceeding to next step:

| Level | Check | Command |
|-------|-------|---------|
| 1 | TypeScript | `bunx tsc --noEmit` |
| 2 | Lint | `bunx eslint .` |
| 3 | Tests | `bun test` |
| 4 | Build | `bun run build` |

**Minimum quality: 0.85 | Target: 0.95**

### Fail-Safe Mechanisms

```
Layer 1 - PREVENTION: Validate before action
Layer 2 - DETECTION: Catch and classify errors
Layer 3 - RECOVERY: Fix and retry (max 5 attempts)
Layer 4 - CONTINUATION: Resume from last good state
```

**Error Recovery Matrix:**

| Error Type | Recovery |
|------------|----------|
| TypeScript | Read error → Fix type → Recompile |
| Build | Check config → Clear cache → Reinstall deps |
| Missing Dep | `bun add` → Check version → Use alternative |
| Loop Detection | 3x same error → Force different approach |

### Context Window Management

For long sessions:
1. Create checkpoint (PROGRESS.json)
2. Summarize important decisions
3. On compaction: structured artifacts survive
4. On resume: run onboarding sequence

### Cost & Resource Awareness

```
EFFICIENCY RULES:
✅ Read only relevant files
✅ Use Edit (not Write) for small changes
✅ Batch similar operations
✅ Early exit when goal achieved

ANTI-PATTERNS:
❌ Reading entire project
❌ Rewriting whole files
❌ 100 steps when 10 suffice
```

### Complexity Classification

| Type | Steps | Examples |
|------|-------|----------|
| TRIVIAL | 1-3 | Single function, config change |
| SIMPLE | 4-10 | Component, API endpoint |
| MEDIUM | 11-30 | Feature, integration |
| COMPLEX | 31-60 | Module, auth system |
| MASSIVE | 61-100 | Full app, production deploy |

---

## AUTONOM Mode

When AUTONOM mode is active (via header toggle):

**Core Rules:**
1. NO questions - decide autonomously
2. NO confirmations - proceed to next step
3. FIX errors and continue - never stop
4. SMART steps (1-100) - use exactly what's needed
5. EARLY EXIT - stop when goal achieved
6. COST AWARE - no wasted tokens

**Budget Limits (AUTONOM):**
- Max per session: $50
- Max per message: $5
- Max tokens: 2M
- Warning at 50% usage

**Step Chain Protocol:**
```
STEP N COMPLETE:
├── 1. VALIDATE: Output correct?
├── 2. PREPARE: What does N+1 need?
├── 3. CONTEXT: What info to pass?
├── 4. DECIDE: Optimal next step?
└── 5. EXECUTE: Continue with full context
```

---

## Tech Stack Defaults

| Decision | Standard |
|----------|----------|
| Styling | Tailwind CSS |
| UI | shadcn/ui + Radix |
| State | React Context / Zustand |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query |
| Package Manager | Bun |
| Testing | Vitest + Playwright |
| Validation | Zod |
