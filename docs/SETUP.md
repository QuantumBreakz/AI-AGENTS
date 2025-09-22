# Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- Public URL for webhooks (e.g., ngrok) for Agent-3

## Agent-2 (Lead Engine)
- Env (example):
  - OPENAI_API_KEY
  - APOLLO_API_KEY, CRUNCHBASE_API_KEY, SERPAPI_API_KEY, PROXYCURL_API_KEY
  - EMAIL_PROVIDER=ses|sendgrid
  - SES_REGION, EMAIL_FROM (for SES)
  - SENDGRID_API_KEY, EMAIL_FROM (for SendGrid)
  - HUBSPOT_API_KEY, PIPEDRIVE_API_TOKEN, SALESFORCE_CLIENT_ID/SECRET/USERNAME/PASSWORD/TOKEN, ZOHO_ACCESS_TOKEN
- Install/run:
```bash
cd Agent-2
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Agent-3 (AI Calling)
- Env:
  - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
  - PUBLIC_BASE_URL (public HTTPS base), HUMAN_AGENT_NUMBER
  - OPENAI_API_KEY
  - GOOGLE_CALENDAR_ACCESS_TOKEN, GOOGLE_CALENDAR_ID
  - HUBSPOT_API_KEY (optional)
  - TWILIO_VALIDATE_SIGNATURE=true
- Install/run:
```bash
cd Agent-3
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```
- Configure Twilio Voice webhook to: `POST {PUBLIC_BASE_URL}/api/v1/twilio/voice/answer`
- Status callback: `POST {PUBLIC_BASE_URL}/api/v1/twilio/voice/status`

## Dashboard
- Env:
  - NEXT_PUBLIC_AGENT2_API_URL=http://localhost:8001/api/v1
  - NEXT_PUBLIC_AGENT3_API_URL=http://localhost:8002/api/v1
  - ADMIN_PATH=admin-random
- Install/run:
```bash
cd dashboard
npm i
npm run dev
```
