# Dashboard Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd dashboard
   npm install
   ```

2. **Start the Dashboard**
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:3030`

3. **Start the Agents** (in separate terminals)
   ```bash
   # Terminal 1 - Agent-2 (Lead Generation)
   cd Agent-2
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001

   # Terminal 2 - Agent-3 (AI Calling)
   cd Agent-3  
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8002
   ```

## Environment Configuration

Create a `.env.local` file in the dashboard directory:

```bash
# Agent API URLs
NEXT_PUBLIC_AGENT2_API_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_AGENT3_API_URL=http://localhost:8002/api/v1

# Admin path
NEXT_PUBLIC_ADMIN_PATH=admin
```

## Features Overview

### Dashboard Home (`/`)
- Real-time stats from both agents
- Quick action cards
- Recent activity feed

### Leads Management (`/admin/leads`)
- View all leads with filtering and search
- Lead statistics by stage
- Add/edit/delete leads functionality
- Stage management (new, contacted, qualified, unqualified)

### Email Campaigns (`/admin/campaigns`)
- Create and manage email sequences
- Campaign status tracking
- Email template management
- Recipient enrollment

### Call Sessions (`/admin/calls`)
- Monitor AI calling campaigns
- View call details and notes
- Status tracking (initiated, ringing, in_progress, completed, failed)
- Call analytics

### Business Profile (`/admin/business`)
- Configure company information
- Set up greeting scripts
- Manage business settings for AI calls

## API Integration

The dashboard connects to both agents via REST APIs:

- **Agent-2**: Lead generation, email campaigns, analytics
- **Agent-3**: AI calling, business profiles, call management

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure both agents have CORS enabled for `http://localhost:3030`

2. **API Connection Failed**: 
   - Check that agents are running on correct ports
   - Verify API URLs in `.env.local`
   - Check agent logs for errors

3. **Build Errors**: 
   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript configuration

### Development Tips

- Use browser dev tools to monitor API calls
- Check network tab for failed requests
- Verify agent endpoints are responding with `curl` or Postman

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Configure reverse proxy** (nginx example):
   ```nginx
   location / {
       proxy_pass http://localhost:3030;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```
