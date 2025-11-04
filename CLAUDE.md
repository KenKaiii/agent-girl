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
