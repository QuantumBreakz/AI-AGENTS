# Agents Dashboard

A comprehensive frontend dashboard for managing Agent-2 (Lead Generation & Email Campaigns) and Agent-3 (AI Calling Agent).

## Features

### Agent-2 Integration
- **Leads Management**: View, search, and manage your lead database
- **Email Campaigns**: Create and manage email marketing sequences
- **Analytics**: Track campaign performance and lead conversion

### Agent-3 Integration  
- **Call Sessions**: Monitor and manage AI calling campaigns
- **Business Profile**: Configure company information and calling scripts
- **Call Analytics**: Track call performance and outcomes

## Getting Started

### Prerequisites
- Node.js 18+ 
- Agent-2 running on port 8001
- Agent-3 running on port 8002

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

3. Update the API URLs in `.env.local` if your agents are running on different ports.

### Development

Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3030`.

### Production

Build for production:
```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_AGENT2_API_URL`: URL for Agent-2 API (default: http://localhost:8001/api/v1)
- `NEXT_PUBLIC_AGENT3_API_URL`: URL for Agent-3 API (default: http://localhost:8002/api/v1)
- `NEXT_PUBLIC_ADMIN_PATH`: Admin path prefix (default: admin)

## Pages

- `/` - Dashboard overview with stats and quick actions
- `/admin/leads` - Lead management interface
- `/admin/campaigns` - Email campaign management
- `/admin/calls` - Call session monitoring
- `/admin/business` - Business profile configuration

## Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **Headless UI** - Accessible components
- **date-fns** - Date utilities
- **Recharts** - Data visualization