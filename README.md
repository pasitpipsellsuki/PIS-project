# 🤖 Multi-Agent Team — README

> **Project Type:** Software Product Development  
> **Workflow Model:** Multi-Agent / Kanban Continuous Flow  
> **Stack:** Full-stack · Cloudflare Pages (frontend) · Cloudflare Workers (API)

---

## What is this?

This project uses a multi-agent AI team to handle the full software development lifecycle — from requirement intake to production deployment. You just describe what you want, the team handles the rest.

**Your workflow:**
```
Open opencode → say what you want → come back and review the result
```

---

## Team

| Member | Nickname | Role |
|--------|----------|------|
| PO | Priya 🧭 | Product Owner |
| Dev | Dexter 💻 | Software Developer |
| QA | Quinn 🔍 | QA Engineer |
| DevOps | Devon 🚀 | DevOps Engineer |

---

## Folder Structure

```
your-project/
├── AGENTS.md                    ← coding standards (untouched)
├── README.md                    ← this file
├── agents/
│   └── team_agent.md            ← team roster & autonomy rules
├── skills/
│   ├── skills-po.md             ← Priya's skills & backlog ownership rules
│   ├── skills-dev.md            ← Dexter's skills & behavior rules
│   ├── skills-qa.md             ← Quinn's skills & behavior rules
│   └── skills-devops.md         ← Devon's skills & deployment config
├── pipeline/
│   └── pipeline.md              ← workflow stages, handoff signals, CI/CD hooks
└── backlog/
    └── backlog.md               ← shared memory, managed by Priya
```

---

## Quick Edit Guide

| What you want to change | File to edit |
|-------------------------|-------------|
| Workflow stages or handoff signals | `pipeline/pipeline.md` |
| What an agent knows or how they behave | `skills/skills-*.md` |
| Team structure or autonomy rules | `agents/team_agent.md` |
| Project context, current task, decisions | `backlog/backlog.md` (or just tell Priya) |

---

## How to start

```bash
cd your-project
opencode
```

Then just talk to the team naturally. Priya will read `backlog/backlog.md` to restore context and pick up where you left off.
