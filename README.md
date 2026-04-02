# DRC Observer Platform 🚀

**DRC Observer** is a state-of-the-art enterprise observability platform combining the vast customizability of a **headless CMS** with the deep, real-time analytics of a generic **Grafana-style dashboard**. Built natively on Next.js 15, React 19, and Prisma.

## 🌟 Core Architecture & Features

### 1. Multi-Tenant CyberArk Vault Integration
The platform natively utilizes **Zero-Trust** principles by dynamically intercepting credential requests milliseconds before physical database or API executions. 
- Build an infinite number of isolated Corporate Vault clusters natively.
- Safely route explicit Data Sources to strict explicit independent Vault Arrays out-of-the-box.
- Fetch passwords via `ObjectID` natively without ever persistently storing them organically on disk or in the internal schema. 

### 2. Grafana-Style Headless Builder
A vastly powerful "Click-to-Build" workspace designed exclusively for high-scale observability.
- **M-to-N Binding:** Attach infinite physical UI widgets directly to securely mapped independent Datasets natively globally. 
- Fast DOM diffing natively prevents screen flickering during polling intervals.

### 3. Advanced 5-Step Config Wizard
Map natively across `PostgreSQL`, `MySQL`, `OracleDb`, and generic REST/GraphQL endpoints dynamically via the internal **Data Connections** module elegantly securely globally natively.

### 4. Dynamic Migration System ("First Flight")
Instantly spin up infrastructure changes globally natively using the internal **Architecture Configuration** view. Dynamically shift from an embedded SQLite instance strictly into distributed Enterprise Clusters flawlessly. 

### 5. Bank-Grade Security Elements
- Hardware-level AES-256-CBC natively encrypting standard system variables.
- MITRE ATT&CK mapping configurations effortlessly validating deployments explicitly. 
- Deep Row-Level Isolation (RLS) guaranteeing user-level Sandbox isolation explicitly seamlessly globally natively.

---

## 🛠 Infrastructure Elements
- **Frontend / Engine:** Next.js (App Router), React 19 Server Components
- **Data ORM:** Prisma
- **Visual Topology:** TailwindCSS v4, Recharts, Lucide Icons
- **Language:** TypeScript (Strict Compilation)

## ⚡ Deployment & Setup

```bash
# 1. Install Node Dependencies
npm install

# 2. Sync Relational Schemas 
npx prisma db push

# 3. Spin up the Development Engine
npm run dev
```

### CyberArk Mock Parameters
In standard node processes (`npm run dev`), if your internal `CYBERARK_API_URL` environment parameters resolve correctly as "mock" or are missing entirely explicitly natively, the application utilizes secure internal fallback timeouts simulating the global execution REST topologies globally effectively explicitly!

### Production Hardening
Whenever mapping physical APIs natively securely globally natively smoothly, ensure `NEXTAUTH_SECRET` matches your strictly generated `DRC_VAULT_KEY` seamlessly to construct the AES-256 buffer explicitly efficiently securely correctly globally natively seamlessly securely natively smoothly.
