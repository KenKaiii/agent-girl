---
description: "Autonomous multi-agent website cloning"
argument-hint: "<url>"
---

# /clone-auto - Autonomous Website Cloning

Fully autonomous, multi-agent website cloning with parallel task execution.

**Target URL:** $ARGUMENTS

## Autonomous Execution

This command runs WITHOUT human intervention using the clone-orchestrator agent.

### Step 1: Initialize Swarm

```
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 4,
  strategy: "adaptive"
})
```

### Step 2: Spawn Specialized Agents

```
mcp__claude-flow__agent_spawn({ type: "researcher", name: "analyzer" })
mcp__claude-flow__agent_spawn({ type: "coder", name: "cloner" })
mcp__claude-flow__agent_spawn({ type: "optimizer", name: "optimizer" })
```

### Step 3: Orchestrate Tasks

**Phase 1 - Analysis (Sequential)**
```
mcp__claude-flow__task_orchestrate({
  task: "Analyze $ARGUMENTS using mcp__website2astro__smart_analyze",
  strategy: "sequential",
  priority: "high"
})
```

**Phase 2 - Clone & Design (Parallel)**
```
mcp__claude-flow__task_orchestrate({
  task: "Clone $ARGUMENTS to /Users/master/astro-clones/{domain}/",
  strategy: "parallel",
  priority: "high"
})
```

**Phase 3 - Conversion (Sequential)**
```
mcp__claude-flow__task_orchestrate({
  task: "Convert /Users/master/astro-clones/{domain}/ to Astro",
  strategy: "sequential",
  priority: "medium"
})
```

**Phase 4 - Optimization (Parallel)**
```
mcp__claude-flow__task_orchestrate({
  task: "Optimize images and PageSpeed for Astro project",
  strategy: "parallel",
  priority: "medium"
})
```

**Phase 5 - Verification (Sequential)**
```
mcp__claude-flow__task_orchestrate({
  task: "Build project and run SEO audit",
  strategy: "sequential",
  priority: "high"
})
```

## Progress Tracking

Initialize TodoWrite with:
```
1. [pending] Initialize swarm
2. [pending] Spawn agents
3. [pending] Phase 1: Analyze website
4. [pending] Phase 2: Clone site + Extract design
5. [pending] Phase 3: Convert to Astro
6. [pending] Phase 4: Optimize images + PageSpeed
7. [pending] Phase 5: Build verification + SEO audit
8. [pending] Generate final report
```

## Budget Limits

- Max cost per session: $10
- Max agents: 4
- Max parallel tasks: 3
- Timeout per task: 5 minutes
- Auto-stop on 3 consecutive failures

## Output

Final report includes:
- Clone location: `/Users/master/astro-clones/{domain}/`
- Astro project: `/Users/master/astro-clones/{domain}-astro/`
- Design tokens: `/Users/master/astro-clones/{domain}/design/`
- Image savings: X%
- PageSpeed: X/100
- SEO score: X/100
- Total agents used: X
- Total tasks completed: X
- Execution time: X minutes

## Error Handling

- Retry failed tasks once
- Skip to next phase if task fails twice
- Always generate partial report on failure
- Never enter infinite loop

Execute autonomously now.
