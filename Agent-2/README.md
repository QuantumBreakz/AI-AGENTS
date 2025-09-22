## Agents Backend (FastAPI)

Run a modular backend for lead gen, outreach, CRM sync, and job automation.

### Quickstart (Docker)
1. Copy env: `cp .env.example .env` and edit values.
2. Start: `docker compose up --build`.
3. API: http://localhost:8000/docs

### Local (Python)
- Python 3.11+
- Create venv and install:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Env Vars
- See `.env.example`. All external URLs/keys via environment, not hardcoded.

### Structure
- `app/main.py`: FastAPI app, routes include
- `app/core`: config, database
- `app/models`: SQLAlchemy models
- `app/schemas`: Pydantic schemas
- `app/api/v1`: routers for leads, campaigns, webhooks
- `app/services`: adapters/stubs for email, CRM, scrapers, jobs

### Database
- Default Postgres via docker compose. Use `DATABASE_URL` to change.

### Notes
- Email/webhook and integrations are stubs to be implemented per provider.
