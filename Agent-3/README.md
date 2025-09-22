# Agent-3 — AI Calling Agent

An AI cold-calling and inbound agent that can auto-dial leads or CRM contacts, deliver a natural voice pitch, qualify, handle objections, and auto-log notes back to the system and CRM. It can also handle inbound calls for FAQs, bookings, and reservations.

## Quickstart

- Create and activate a virtualenv
- Install requirements
- Run the API

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

- OPENAI_API_KEY: optional for AI stubs
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN: optional if using Twilio adapter
- HUMAN_AGENT_NUMBER: optional for transfer-to-human
- DATABASE_URL: default `sqlite+aiosqlite:///./agent3.db`
- ENABLED_CRMS: comma-separated (mock by default)

## API

- Calls:
  - POST `/api/v1/calls/start` — Start calls with purpose/context
  - POST `/api/v1/calls/start-sales` — Convenience for sales calls
  - POST `/api/v1/calls/start-jobs` — Convenience for job-application calls
  - POST `/api/v1/calls/webhook` — Inbound events (notes, dispositions)
- Inbound:
  - POST `/api/v1/inbound/webhook` — Handle FAQs, booking (Google Calendar stub), reservations stub, transfer-to-human
- Business:
  - GET/POST `/api/v1/business/profile` — Get/update industry templates and customization

## Notes

This is a functional scaffold with stubs for dialer/voice and Google Calendar. Replace stubs with production adapters as needed.
