# DRC Observer Platform

DRC Observer is a state-of-the-art headless CMS and telemetry observability platform mapped natively to Grafana-style visual dashboards. Built entirely on Next.js 15, React 19, and Prisma.

## Core Features
1. **Dynamic Architecture Shifter ("First Flight"):** Instantly re-routes physical hardware configurations (SQLite, PostgreSQL, MySQL, Oracle) structurally in real-time via the Admin System configurations natively.
2. **Zero-Trust CyberArk Integration:** Numbed and mocked in development, fully active on live pods. Completely isolates sensitive configurations (DB Passwords, REST API Headers) mapping directly `{{VAULT_TOKEN}}` natively using CCP injections.
3. **Headless Visual Dashboard Builder:** Grafana-style component dropping architecture parsing instantaneous visual React topologies mapped tightly to Recharts.
4. **Live Data Orchestration:** Custom MasterDetailTable & Visual Widgets with polling data configurations natively parsing headless APIs seamlessly with smart DOM diffing to prevent visual flickering.
5. **AES-256 Secured Secrets:** Fallback physical AES-256-CBC natively encrypting standard configuration payloads to guarantee absolute internal endpoint security.

## Infrastructure
- **Framework:** Next.js (App Router)
- **Database:** Prisma ORM (+ multi-driver orchestration logic)
- **UI & Charts:** TailwindCSS, Recharts, Lucide Icons
- **Security Protocols:** AES-256 Encryption, MITRE ATT&CK mapping, RBAC (MANAGE_PAGES, MANAGE_SOURCES) & Row-Level Isolation Security

## Setup & Running
1. `npm install`
2. `npx prisma db push`
3. `npm run dev`

### CyberArk Vault Variables
For production usage, configure the vault endpoint locally inside `.env`:
`CYBERARK_API_URL=https://corporate.cyberark.local/ccp`

### Dynamic Database Mappings
If simulating migrating to Postgres, use the internal `/admin/system` module ("Architecture Configuration") which executes native migrations dynamically backing up local models instantaneously safely.
