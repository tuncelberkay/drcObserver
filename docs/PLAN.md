# Production-to-DRC Observability Tool Implementation Plan

This is a high-performance Full-Stack Observability Tool for monitoring the 'Production-to-DRC' (Disaster Recovery) transition process. It adheres to enterprise security standards for a regulated financial environment and features a NOC-style dark mode.

## Project Type
WEB

## Success Criteria
- Dual-login system (LDAP/Local) with secure session management.
- Command Center dashboard routing.
- Customizable live widgets using Draggable Grid System.
- High-density Master-Detail table for infrastructure deep dive.
- NOC-style high-contrast dark mode implemented cleanly with Tailwind.

## Tech Stack
- **Framework**: Next.js (React) - modular and scalable.
- **Styling**: Tailwind CSS (Dark Mode first).
- **Backend/Auth**: Next-Auth or custom robust secure session layers (compatible with LDAP).
- **Database**: Prisma ORM with SQLite (or PostgreSQL for prod) for local user management.
- **Charting**: Recharts or Chart.js for Pie Charts and Gauges.
- **Grid System**: `react-grid-layout` or `dnd-kit` for draggable widgets.

## Task Breakdown (Phase 2 - Parallel Implementation)

| Priority | Task | Assigned Agent | Skills | Description |
|---|---|---|---|---|
| P0 | T1: Schema & DB | `database-architect` | `database-design` | Create Local User and RBAC schemas. |
| P0 | T2: Security & Auth | `security-auditor` | `vulnerability-scanner`, `api-patterns` | Implement dual-login (LDAP+Local) & robust session security. |
| P1 | T3: Data API | `backend-specialist` | `nodejs-best-practices` | Setup real-time endpoints (Hostnames, Agent Status, Oracle DB signals). |
| P2 | T4: Dashboard Nav | `frontend-specialist` | `frontend-design` | Setup base layout, Command Center Cards, styling, App routing. |
| P2 | T5: Widgets Grid | `frontend-specialist` | `react-best-practices` | Implement Draggable Grid UI with Pie/Gauge elements. |
| P2 | T6: Deep-Dive Table | `frontend-specialist` | `tailwind-patterns` | Master-Detail Table featuring expandable rows. |

## Phase X: Verification Plan (MANDATORY SCRIPT EXECUTION)

### Automated Tests
- Run `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- Run `npm run test` or E2E Playwright tests.

### Manual Verification
- Verify draggable grid saves state or functionally persists across clicks.
- Check dark mode contrast using Lighthouse.
- Ensure Master-Detail expansion has zero lag.
