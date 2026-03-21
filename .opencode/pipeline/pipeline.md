# 🔁 Pipeline — Multi-Agent Kanban Workflow

> **Style:** Kanban / Continuous Flow  
> **Agents:** PO · Dev · QA · DevOps  
> **Purpose:** Workflow definition · LLM orchestration · CI/CD automation triggers

---

## Pipeline Overview

```
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ BACKLOG  │───▶│  READY   │───▶│   DEV    │───▶│ STAGING  │───▶│  PROD    │───▶│   DONE   │
  │          │    │ FOR DEV  │    │    IN    │    │   / QA   │    │ DEPLOY   │    │          │
  │  Priya   │    │  Priya   │    │ PROGRESS │    │  Quinn   │    │  Devon   │    │  Priya   │
  │  🧭 PO   │    │  🧭 PO   │    │  Dexter  │    │  🔍 QA   │    │  🚀 Ops  │    │  🧭 PO   │
  └──────────┘    └──────────┘    │  💻 Dev  │    └──────────┘    └──────────┘    └──────────┘
                                  └──────────┘
```

WIP Limits apply per column to prevent bottlenecks. No agent picks up new work if their column is at capacity.

---

## User ↔ Agent Team Interaction

The user is the **external initiator and final approver** of all work. The team does not start or close any work without a user touchpoint.

```
USER
 │
 │  1. Submits request (feature / bug / question)
 ▼
PRIYA (PO) ──── clarifies scope, asks follow-up questions ────▶ USER
 │
 │  2. Confirms scope & priority with user
 ▼
[Internal Kanban flow: Dexter → Quinn → Devon]
 │
 │  3. Delivers result / demo / release note
 ▼
USER ──── provides feedback / acceptance ────▶ PRIYA (PO)
 │
 │  4. Marks done or opens follow-up story
 ▼
DONE / NEW CYCLE
```

### User Touchpoint Map

| When | Who Talks to User | What Happens |
|------|-------------------|--------------|
| **Request intake** | Priya 🧭 | Collects requirement, clarifies goals, confirms priority |
| **Scope ambiguity** | Priya 🧭 | Asks targeted questions before writing the story |
| **Design/UX decision** | Priya 🧭 | Presents options, gets user preference |
| **Progress update** | Priya 🧭 | Notifies user when work enters QA or deployment |
| **Bug found in QA** | Priya 🧭 | Informs user of delay + expected resolution time |
| **Release ready** | Devon 🚀 | Shares deploy confirmation + release notes |
| **Validation in prod** | Priya 🧭 | Asks user to confirm feature meets expectations |
| **Incident in prod** | Devon 🚀 | Immediate alert to user + status updates during recovery |

### User Communication Rules

- **Single point of contact:** Priya is the default voice of the team. Other agents only contact the user directly for technical alerts (Devon) or demo walkthroughs (Dexter/Quinn if needed).
- **No jargon dumps:** All user-facing messages translate technical status into plain language.
- **No silent work:** The team always notifies the user when a new cycle begins and when it ends — but does not wait for approval to proceed between stages.
- **Feedback loop:** After every release, Priya checks back with the user before pulling the next item from backlog.

---

## Stage Definitions

### Stage 1 — BACKLOG `[Owner: PO]`

**What happens here:**
- PO creates and grooms user stories
- Stories are written with acceptance criteria and DoD
- Items are ranked by business priority

**Entry Condition:** New feature request or stakeholder feedback received  
**Exit Condition:** Story is fully defined and acceptance criteria signed off  
**WIP Limit:** Unlimited (backlog is a queue)

**PO Checklist before moving to READY:**
- [ ] Story follows `As a / I want / So that` format
- [ ] Acceptance criteria defined (minimum 3 scenarios)
- [ ] Definition of Done attached
- [ ] Story points estimated (if applicable)
- [ ] Dependencies identified

**Status Signal to emit:** `status: ready-for-dev`

---

### Stage 2 — READY FOR DEV `[Owner: PO → Dev]`

**What happens here:**
- Dev picks the highest-priority story from this column
- Dev reviews the story, asks clarifying questions to PO if needed
- Dev creates feature branch and begins implementation

**Entry Condition:** `status: ready-for-dev` emitted by PO  
**Exit Condition:** Implementation complete, PR opened  
**WIP Limit:** `2 items per Dev agent`

**Dev Checklist before moving to IN PROGRESS:**
- [ ] Story fully understood — no ambiguities
- [ ] Feature branch created: `feature/<story-id>-<short-description>`
- [ ] Local environment set up and working

**Status Signal to emit:** `status: in-progress`

---

### Stage 3 — DEV IN PROGRESS `[Owner: Dev]`

**What happens here:**
- Dev implements the feature
- Dev writes unit and integration tests
- Dev opens a Pull Request from feature branch targeting `main`
- Cloudflare Pages auto-generates a preview URL for the PR
- Peer code review conducted (or self-review if solo)

**Entry Condition:** `status: in-progress`  
**Exit Condition:** PR approved — ready to merge  
**WIP Limit:** `2 items per Dev agent`

**Dev Checklist before moving to STAGING/QA:**
- [ ] Feature implemented per acceptance criteria
- [ ] Unit tests written and passing
- [ ] PR description includes story ID and summary of changes
- [ ] No linting or type errors
- [ ] PR reviewed and approved
- [ ] Cloudflare preview URL confirmed live

**CI Automation Trigger:** On PR open → Cloudflare Pages generates preview deploy URL  
**Status Signal to emit:** `status: ready-for-qa`

---

### Stage 4 — STAGING / QA `[Owner: QA]`

**What happens here:**
- QA picks up the story and tests against the Cloudflare preview URL
- Functional, regression, edge case, and API tests run
- Bugs filed if found; Dev fixes and pushes to the same PR (preview URL updates automatically)
- QA issues sign-off when all criteria are met

**Entry Condition:** `status: ready-for-qa` + Cloudflare preview URL confirmed live  
**Exit Condition:** `status: qa-approved` issued by QA  
**WIP Limit:** `3 items per QA agent`

**QA Checklist before issuing qa-approved:**
- [ ] All acceptance criteria scenarios tested on preview URL
- [ ] No `critical` or `high` severity bugs open
- [ ] Regression suite passed
- [ ] API contracts verified
- [ ] Performance within acceptable thresholds
- [ ] `qa-sign-off.md` artifact created

**Bug Loop (if defects found):**
```
QA files bug-report.md
  → status: blocked (assigned to Dev)
    → Dev fixes and pushes to feature branch (preview URL auto-updates)
      → status: ready-for-qa (re-enters this stage)
        → QA re-tests affected scenarios
```

**Status Signal to emit:** `status: qa-approved`

---

### Stage 5 — PROD DEPLOY `[Owner: DevOps]`

**What happens here:**
- DevOps receives `qa-approved` signal
- PR is merged to `main` — Cloudflare Pages auto-deploys frontend
- Devon runs `npx wrangler deploy` for any API/Workers changes
- Deployment health verified via Cloudflare Analytics
- Rollback plan confirmed ready

**Entry Condition:** `status: qa-approved`  
**Exit Condition:** Deployment stable for observation period (default: 30 min)  
**WIP Limit:** `1 active deployment at a time`

**DevOps Checklist before marking deployed:**
- [ ] PR merged to `main` — Cloudflare Pages build passed
- [ ] Workers deployed via `npx wrangler deploy` (if API changes exist)
- [ ] Production URL live and returning correct response
- [ ] No error rate spike in Cloudflare Analytics
- [ ] Rollback command documented in `deploy-log.md`
- [ ] No anomalies in first 30 minutes

**CI/CD Automation Trigger:** PR merge to `main` → Cloudflare Pages auto-deploys  
**Status Signal to emit:** `status: deployed`

**Rollback Trigger:** If error rate > threshold during observation window → `status: rolled-back` → notify all agents

---

### Stage 6 — DONE `[Owner: PO]`

**What happens here:**
- PO validates the deployed feature against original acceptance criteria in production
- Story marked complete
- Any follow-up stories or improvements captured in backlog

**Entry Condition:** `status: deployed` + observation window passed  
**Exit Condition:** PO confirms acceptance in production  
**WIP Limit:** N/A

**PO Checklist:**
- [ ] Feature verified in production environment
- [ ] Acceptance criteria met end-to-end
- [ ] Stakeholders notified of release
- [ ] Follow-up stories logged (if any)

**Status Signal to emit:** `status: done`

---

## Full Status Signal Map

```
BACKLOG
  └── PO approves story ──────────────────────▶ status: ready-for-dev

READY FOR DEV
  └── Dev picks up story ─────────────────────▶ status: in-progress

DEV IN PROGRESS
  └── PR open + preview URL live ─────────────▶ status: ready-for-qa
  └── Blocker raised ─────────────────────────▶ status: blocked

STAGING / QA
  └── All tests pass ─────────────────────────▶ status: qa-approved
  └── Bug found ──────────────────────────────▶ status: blocked → back to Dev

PROD DEPLOY
  └── Deployment stable ──────────────────────▶ status: deployed
  └── Anomaly detected ───────────────────────▶ status: rolled-back

DONE
  └── PO confirms ────────────────────────────▶ status: done
```

---

## CI/CD Automation Hooks

| Trigger Event | Automation Action | Owner |
|---------------|-------------------|-------|
| PR opened to `staging` | Run lint, type-check, unit tests | Dev / CI |
| PR opened to feature branch | Cloudflare Pages generates preview URL | DevOps / CI |
| `status: ready-for-qa` | Notify QA agent, run smoke test suite | QA / CI |
| `status: qa-approved` | Trigger production pipeline | DevOps / CI |
| Deploy completes | Run post-deploy health checks | DevOps |
| Health check fails | Auto-rollback + Cloudflare alert | DevOps |
| `status: deployed` | Notify PO for final validation | PO |

---

## WIP Limit Summary

| Stage | WIP Limit | Rationale |
|-------|-----------|-----------|
| Backlog | ∞ | It's a queue — no limit needed |
| Ready for Dev | 5 | Prevent over-planning ahead of capacity |
| Dev In Progress | 2 per Dev | Focus; avoid context switching |
| Staging / QA | 3 per QA | Allow parallel testing where possible |
| Prod Deploy | 1 at a time | Reduce blast radius of issues |
| Done | ∞ | Completed work is never blocked |

---

## Escalation Protocol

Any agent may emit `status: blocked` at any time. When this occurs:

1. Blocking agent documents the blocker clearly in the card
2. All agents are notified
3. PO triages and assigns resolution owner within **1 business day**
4. If unresolved after **2 business days**, escalate to project stakeholder

---

*See `agents/team_agent.md` for agent roles and responsibilities.*  
*See `skills/skills-po.md` · `skills/skills-dev.md` · `skills/skills-qa.md` · `skills/skills-devops.md` for capabilities and LLM behavior rules per agent.*
