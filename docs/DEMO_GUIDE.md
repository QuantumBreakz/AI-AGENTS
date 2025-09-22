# Demo Guide

## Prep
- Set all env vars per SETUP.md for Agent-2 and Agent-3
- Expose Agent-3 with PUBLIC_BASE_URL via ngrok/cloud
- Seed a few leads (use one-click orchestrate) and a BusinessProfile

## Flow
1. Lead scrape: Call Agent-2 /orchestrate/one-click to generate 5-10 leads
2. Outreach: Show created campaign and that scheduler can send emails
3. Inbound pause: Trigger /api/v1/webhooks/email with a note+stage to auto-pause
4. Sales call: Start a sales call from Agent-3 /calls/start-sales to your phone
5. Dialogue: Answer call; speak; watch Twilio webhooks respond; notes appear
6. Booking: Use inbound /inbound/webhook with book_meeting intent to create calendar event
7. CRM: Show HubSpot updated with stage or added note
8. Dashboard: Navigate /[ADMIN_PATH]/calls to view calls and notes

## Tips
- Keep logs visible for both services
- Use distinct Caller IDs and clear offers in pitch context
