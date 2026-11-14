# SELLVION Production Deployment Guide

## 1. Environment Variables

Configure these variables in your runtime secrets manager (never commit `.env`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Defaults to `3000` |
| `SESSION_SECRET` | Yes | 32+ char random secret used to encrypt stored provider credentials (AES-256-GCM) |
| `GEMINI_API_KEY` | Recommended | Enables server-side Gemini (`gemini-4-hydrogen`) message drafting & copilot |
| `WHATSAPP_VERIFY_TOKEN` | Optional | Meta webhook verification challenge token (`GET /api/webhooks/whatsapp`) |
| `APP_URL` | Optional | Public HTTPS URL of the deployed app |

## 2. Database & Migrations

- Default storage uses SQLite WAL mode at `data/sellvion.db` initialized from `migrations/001_init.sql`.
- Back up `data/sellvion.db` regularly via SQLite online backup (`.backup`) or persistent volume snapshots.
- To migrate to managed PostgreSQL for horizontal multi-instance scaling, apply `migrations/001_init.sql` (standard SQL tables with foreign keys and indexes) to PostgreSQL and replace `node:sqlite` queries with `pg` parameterized statements (`$1, $2...`).

## 3. Provider Integrations & Webhooks

Merchants connect their own credentials inside **Workspace → Integrations**:
- **WhatsApp Cloud API**: Verified against `https://graph.facebook.com/v20.0/{phoneNumberId}`. Point Meta webhooks to `https://<your-domain>/api/webhooks/whatsapp?businessId=<business_id>`. Inbound `STOP` / `unsubscribe` messages automatically set `opted_out = 1`.
- **Shopify**: Verified against `https://{shopDomain}/admin/api/2024-10/shop.json`.
- **Shiprocket**: Verified against `https://apiv2.shiprocket.in/v1/external/auth/login`.
- **Razorpay**: Verified against `https://api.razorpay.com/v1/payments?count=1`. Configure Razorpay webhook secret in Integrations and point webhooks to `/api/webhooks/razorpay?businessId=<business_id>`.

## 4. Build & Start Commands

```bash
npm run build
npm run start
```

Verify health & monitoring after deployment:
- `GET /api/health` returns `200 OK` with `{ "status": "ok" }`.
- `GET /api/system/status` returns uptime, SQLite WAL status, connected integrations, and workflow metrics for the active tenant.
- `GET /api/business/backup` downloads a tenant-isolated JSON snapshot of store records (also accessible in **Workspace → Settings → Store Profile**).

