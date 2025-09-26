# Agents Monorepo (Agent-2, Agent-3, Dashboard)

This repository contains:
- Agent-2: Lead generation, outreach, CRM sync, and job auto-apply (FastAPI)
- Agent-3: AI calling, sales/job calls, Twilio integration (FastAPI)
- Dashboard: Next.js admin to manage leads, campaigns, and calls

This README is an end-to-end guide: setup, environment, directory structure, how things connect, endpoints, and troubleshooting.

---

## Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)
- Public HTTPS URL for Agent-3 Twilio webhooks (ngrok or similar)

---

## Quick Start (Local)

### 1) Agent-2 (Lead Engine)
- Install and run:
```bash
cd Agent-2
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```
- API: `http://localhost:8001/docs`

### 2) Agent-3 (AI Calling)
- Install and run:
```bash
cd Agent-3
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```
- API: `http://localhost:8002/docs`

### 3) Dashboard (Next.js)
- Install and run:
```bash
cd dashboard
npm i
npm run dev
```
- App: `http://localhost:3000`
- Admin pages: `/[ADMIN_PATH]` (default `admin`)

---

## Environment Variables

Create `.env` files at the repo root and inside `Agent-2`/`Agent-3` if needed. Agent-2 auto-detects several locations and common aliases. Examples below are comprehensive; you only need what you intend to use.

### Common
- ADMIN_PATH: Dashboard admin path segment (default: `admin`)
- NEXT_PUBLIC_AGENT2_API_URL: `http://localhost:8001/api/v1`
- NEXT_PUBLIC_AGENT3_API_URL: `http://localhost:8002/api/v1`

### Agent-2
- DATABASE_URL: SQLAlchemy URL (default: `sqlite+aiosqlite:///./data.db`)
- OPENAI_API_KEY (aliases: OPENAI_KEY, OPENAI_API_TOKEN)
- OPENAI_API_BASE (aliases: OPENAI_BASE_URL)
- OPENAI_MODEL (default: gpt-4o-mini)
- ENABLE_OPENAI: `true` to enable (auto-enabled when OPENAI_API_KEY present)
- EMAIL_WEBHOOK_SECRET: secret for `/webhooks/email`
- ENABLED_SCRAPERS: comma list: `apollo,crunchbase,linkedin,clutch,web`
- REQUIRE_REAL_DATA: `true` to disallow mock fallback (default true)
- Scrapers:
  - APOLLO_API_KEY (alias: APOLLO_KEY)
  - CRUNCHBASE_API_KEY (alias: CRUNCHBASE_KEY)
  - PROXYCURL_API_KEY (aliases: PROXYCURL_KEY, PROXYCURL_TOKEN, LINKEDIN_API_KEY)
  - SERPAPI_API_KEY (aliases: SERPAPI_KEY, SERP_API_KEY)
- Email Providers:
  - EMAIL_PROVIDER: `gmail|ses|sendgrid`
  - SES_REGION, EMAIL_FROM
  - SENDGRID_API_KEY (alias: SENDGRID_KEY)
  - GMAIL_SMTP_API_KEY
- CRMs:
  - HUBSPOT_API_KEY (alias: HUBSPOT_KEY)
  - PIPEDRIVE_API_TOKEN (aliases: PIPEDRIVE_API_KEY, PIPEDRIVE_TOKEN)
  - ZOHO_ACCESS_TOKEN (aliases: ZOHO_API_KEY, ZOHO_TOKEN)
  - Salesforce: SALESFORCE_CLIENT_ID/SECRET/USERNAME/PASSWORD/TOKEN
- LinkedIn Jobs: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET

### Agent-3
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
- PUBLIC_BASE_URL: public HTTPS base for Twilio to reach
- HUMAN_AGENT_NUMBER: to transfer to a human
- OPENAI_API_KEY (optional)
- GOOGLE_CALENDAR_ACCESS_TOKEN, GOOGLE_CALENDAR_ID (optional)
- HUBSPOT_API_KEY (optional)
- TWILIO_VALIDATE_SIGNATURE: `true` in production

---

## Directory Structure

```
Agents/
├─ Agent-2/
│  ├─ app/
│  │  ├─ main.py                         # FastAPI app, CORS, startup scheduler
│  │  ├─ core/
│  │  │  ├─ config.py                    # Settings + .env detection + env fallbacks
│  │  │  └─ db.py                        # Async DB session helpers
│  │  ├─ api/
│  │  │  └─ v1/
│  │  │     ├─ router.py                 # Registers routes under /api/v1
│  │  │     └─ routes/
│  │  │        ├─ leads.py               # CRUD, scrape, debug-scrapers
│  │  │        ├─ campaigns.py           # Campaigns, variants, enroll
│  │  │        ├─ orchestrate.py         # One-click scrape→campaign→enroll
│  │  │        ├─ ai.py                  # AI suggest
│  │  │        ├─ jobs.py                # Resume upload, auto-apply
│  │  │        ├─ analytics.py           # Campaign analytics
│  │  │        ├─ scoring.py             # Lead scoring rules and calc
│  │  │        └─ webhooks.py            # Inbound email webhook
│  │  ├─ models/                         # SQLAlchemy models (lead, campaign, etc.)
│  │  ├─ schemas/                        # Pydantic schemas
│  │  └─ services/
│  │     ├─ ai/suggest.py                # OpenAI calls (chat completions)
│  │     ├─ campaigns/                   # scheduler, analytics
│  │     ├─ jobs/                         # LinkedIn/Handshake auto apply
│  │     ├─ leads/scoring.py             # Scoring service
│  │     └─ scrapers/
│  │        ├─ aggregator.py             # Provider selection + de-dupe
│  │        ├─ providers/
│  │        │  ├─ apollo.py              # Apollo API people/org search
│  │        │  ├─ crunchbase.py          # Crunchbase search + web fallback
│  │        │  ├─ proxycurl.py           # LinkedIn via Proxycurl API
│  │        │  ├─ serpapi_clutch.py      # Clutch via SerpAPI + DDG fallback
│  │        │  └─ web_generic.py         # Generic DDG web fallback (no API key)
│  ├─ requirements.txt
│  └─ Dockerfile / docker-compose.yml
│
├─ Agent-3/
│  ├─ app/
│  │  ├─ main.py                         # FastAPI app, CORS
│  │  ├─ core/
│  │  │  ├─ config.py                    # Settings/DB
│  │  │  └─ db.py
│  │  ├─ api/
│  │  │  └─ v1/
│  │  │     ├─ router.py
│  │  │     └─ routes/
│  │  │        ├─ business.py            # Business profile for prompts
│  │  │        ├─ calls.py               # List, start, webhook
│  │  │        ├─ inbound.py             # FAQ/reservations pipelines
│  │  │        └─ twilio.py              # Voice webhooks
│  │  ├─ models/                         # call, business, appointment
│  │  └─ services/                       # calling, voice agent, crm
│  ├─ requirements.txt
│  └─ init_db.py
│
├─ dashboard/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                        # Home linking to admin pages
│  │  └─ [admin]/
│  │     ├─ leads/page.tsx               # Fetches from Agent-2 /leads
│  │     ├─ campaigns/page.tsx           # Fetches from Agent-2 /campaigns
│  │     └─ calls/page.tsx               # Fetches from Agent-3 /calls
│  ├─ next.config.js
│  ├─ package.json
│  └─ README.md
│
├─ docs/
│  ├─ DEMO_GUIDE.md
│  ├─ SETUP.md
│  └─ USER_MANUAL.md
└─ README.md (this file)
```

---

## How Components Connect
- Dashboard → Agent-2: via `NEXT_PUBLIC_AGENT2_API_URL` (default `http://localhost:8001/api/v1`). CORS is enabled in Agent-2.
- Dashboard → Agent-3: via `NEXT_PUBLIC_AGENT3_API_URL` (default `http://localhost:8002/api/v1`). CORS is enabled in Agent-3.
- Agent-2 scheduler: runs every 60s to send due emails.
- Webhooks: Agent-2 `/api/v1/webhooks/email` accepts inbound events; Agent-3 exposes `/api/v1/twilio/...` for Twilio.

---

## Core Flows

### Lead Generation (Agent-2)
1) Scrape leads:
```bash
curl -X POST "http://localhost:8001/api/v1/leads/scrape?role=CTO&industry=Technology&location=Remote"
```
2) One-click orchestration (scrape → campaign → enroll):
```bash
curl -X POST http://localhost:8001/api/v1/orchestrate/one-click \
  -H 'Content-Type: application/json' \
  -d '{"role":"CTO","industry":"Technology","location":"Remote","offer":"Demo Offer","steps":2,"limit":5,"send_now":false}'
```
3) Campaigns and variants:
```bash
curl http://localhost:8001/api/v1/campaigns
curl -X POST http://localhost:8001/api/v1/campaigns/emails/1/variants \
  -H 'Content-Type: application/json' -d '{"label":"B","weight":1}'
```

### AI Suggestions (Agent-2)
```bash
curl -X POST http://localhost:8001/api/v1/ai/suggest \
  -H 'Content-Type: application/json' \
  -d '{"kind":"reply","context":{"role":"CTO","offer":"Demo"}}'
```
Requires `OPENAI_API_KEY` (or alias) and `ENABLE_OPENAI=true` (auto-set if key present).

### Job Applications (Agent-2)
```bash
# Upload resume
curl -F 'file=@/path/to/resume.pdf' http://localhost:8001/api/v1/jobs/profile/upload-resume
# Update preferences
curl -X POST http://localhost:8001/api/v1/jobs/profile -H 'Content-Type: application/json' -d '{"job_title_pref":"Software Engineer"}'
# Trigger auto apply
curl -X POST 'http://localhost:8001/api/v1/jobs/auto-apply?provider=linkedin' -H 'Content-Type: application/json' -d '{}'
```

### Calls (Agent-3)
```bash
# List calls
curl http://localhost:8002/api/v1/calls
# Start sales calls
curl -X POST http://localhost:8002/api/v1/calls/start-sales \
  -H 'Content-Type: application/json' \
  -d '{"targets":[{"phone":"+15551234567","email":"lead@example.com"}],"campaign_offer":"Demo"}'
```

### Twilio Webhooks (Agent-3)
- Configure in Twilio Console:
  - Voice Answer: `POST {PUBLIC_BASE_URL}/api/v1/twilio/voice/answer`
  - Status Callback: `POST {PUBLIC_BASE_URL}/api/v1/twilio/voice/status`

---

## Running with Docker (Optional)
```bash
cp .env.example .env
docker compose up --build
```
- Agent-2: `http://localhost:8001`
- Agent-3: `http://localhost:8002`
- Dashboard: `http://localhost:3000`

---

## Troubleshooting
- Port already in use (8001/8002/3000): stop the other process or change port.
- Dashboard cannot reach backend: ensure backends running; CORS enabled in both agents; verify `NEXT_PUBLIC_*` env.
- Scrapers return empty results:
  - Confirm outbound network access.
  - Provide at least one of `PROXYCURL_API_KEY` or `SERPAPI_API_KEY` for broader public discovery.
  - Loosen filters (e.g., `location=US`, `industry=Technology`).
  - Use `/api/v1/leads/debug-scrapers` to verify keys detected by Agent-2.
- OpenAI returns empty text: ensure `OPENAI_API_KEY` and optionally `OPENAI_API_BASE`; `ENABLE_OPENAI` auto-enabled if key present.

---

## Security Notes
- Do not commit real API keys. Use `.env` and secret managers.
- Validate inbound webhooks with configured secrets and Twilio signature validation in production.

---

## Development Tips
- Agent-2 and Agent-3 both use FastAPI with async SQLAlchemy. Prefer async DB operations.
- Add new scrapers under `app/services/scrapers/providers/` and register in `aggregator.py`.
- The dashboard pages fetch server-side (`cache: 'no-store'`). Expand into richer UI with actions as needed.

---

## Appendix: Useful Endpoints (Agent-2)
- Leads: `GET /api/v1/leads`, `POST /api/v1/leads`, `POST /api/v1/leads/scrape`
- Orchestrate: `POST /api/v1/orchestrate/one-click`
- Campaigns: `GET /api/v1/campaigns`, `POST /api/v1/campaigns`
- Analytics: `GET /api/v1/analytics/overall`
- AI: `POST /api/v1/ai/suggest`
- Webhooks: `POST /api/v1/webhooks/email`

Appendix: Useful Endpoints (Agent-3)
- Calls: `GET /api/v1/calls`, `POST /api/v1/calls/start`, `POST /api/v1/calls/start-sales`, `POST /api/v1/calls/start-jobs`
- Twilio: `POST /api/v1/twilio/voice/answer`, `POST /api/v1/twilio/voice/status`
