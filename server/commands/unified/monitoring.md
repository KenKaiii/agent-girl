# Monitoring Dashboard

Zeigt System-Monitoring und Performance-Metriken.

## Usage

```
/monitoring [component]
```

## Components

- `system` - System health and resources
- `agents` - Agent pool status
- `workflows` - Active workflows
- `compliance` - Compliance status
- `all` - Full dashboard (default)

## Example Output

```
📊 SYSTEM MONITORING DASHBOARD
═══════════════════════════════════════

🖥️ System Health
├─ CPU: 23% | Memory: 4.2GB/16GB
├─ Disk: 45% | Network: ✓ Connected
└─ Uptime: 14h 32m

🤖 Agent Pool
├─ Active: 3/8 agents
├─ Queue: 2 pending tasks
└─ Avg Response: 1.2s

📋 Workflows
├─ Running: 2
├─ Completed Today: 47
└─ Failed: 0

✅ Compliance
├─ GoBD: Compliant
├─ DSGVO: Compliant
└─ Last Audit: 2h ago
```
