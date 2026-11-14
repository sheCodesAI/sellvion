# SELLVION — Autonomous AI Teammate for Indian Merchants

SELLVION is a multi-tenant web platform built for Indian retail stores, kiranas, SMBs, and D2C sellers. It helps merchants manage customer relationships, flag Cash-on-Delivery (COD) return risks, track digital udhaar balances, and draft polite multilingual WhatsApp follow-ups inside a strict **Human-in-the-Loop** safety architecture.

## Core Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide icons, multilingual UI (`English`, `Hindi`, `Telugu`), and Web Speech API voice command bar with confirmation before execution.
- **Backend**: Express + TypeScript (`server.ts`), built-in SQLite (`node:sqlite`) with automatic SQL migrations (`migrations/001_init.sql`), scrypt password hashing, httpOnly + Bearer sessions, RBAC, and AES-256-GCM encrypted integration credentials.
- **5 Specialized Agents Under 1 Central Orchestrator** (`server/services/agents.ts`):
  1. **Customer Intelligence Agent** — Reads customer order, payment, and udhaar memory.
  2. **Behaviour & Prediction Agent** — Evaluates reorder cycles and explainable COD order risks.
  3. **Engagement & Copy Agent** — Drafts courteous messages via Gemini (`gemini-4-hydrogen`) or multilingual deterministic templates.
  4. **Policy & Safety Guard** — Enforces consent, opt-outs, quiet hours (IST), 48-hour frequency caps, and emergency pause.
  5. **Execution & Measurement Agent** — Dispatches approved messages via verified WhatsApp credentials and logs outcomes.

## Demo Mode vs Live Mode Isolation

- **Demo Mode**: Unauthenticated visitors explore an isolated sample workspace (`demo-biz-01`) where dispatches are clearly marked as simulated and can be reset anytime.
- **Live Mode**: Signing up creates a completely separate business tenant (`mode = 'live'`). Live Mode never leaks sample data and never fakes WhatsApp/Shopify/Shiprocket/Razorpay connections—sending requires verified provider credentials.

## Local Development & Verification

```bash
npm install
npm run dev      # Starts Express + Vite on http://localhost:3000
npm test         # Runs automated API & agent safety tests
npm run lint     # TypeScript typecheck (tsc --noEmit)
npm run build    # Builds frontend bundle into dist/
```

See `DEPLOYMENT.md` for production deployment, webhook configuration, and database backup guidance.
