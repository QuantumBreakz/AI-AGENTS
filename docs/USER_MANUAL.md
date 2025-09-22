# User Manual

## Lead Generation (Agent-2)
1. Scrape leads via POST /api/v1/orchestrate/one-click with filters
2. Review created leads and campaign in the Dashboard
3. Add A/B variants via POST /api/v1/campaigns/emails/{email_id}/variants
4. Enroll leads to campaigns and let scheduler send

## CRM Sync
- Configure CRM keys in env; stage and notes propagate from webhooks and calling agent

## Job Applications
- Upload resume at POST /api/v1/jobs/profile/upload-resume
- Set preferences at POST /api/v1/jobs/profile
- Trigger auto-apply at POST /api/v1/jobs/apply (provider=linkedin|handshake)

## AI Calling (Agent-3)
1. Set Business Profile at POST /api/v1/business/profile (industry, greeting, services)
2. Start sales calls at POST /api/v1/calls/start-sales
3. Start job calls at POST /api/v1/calls/start-jobs
4. Configure Twilio webhooks for inbound; transfer to human with HUMAN_AGENT_NUMBER

## Dashboard
- Visit /[ADMIN_PATH] to manage leads, campaigns, and calls
