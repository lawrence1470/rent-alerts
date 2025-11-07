# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 rental notifications application using the App Router architecture. The app helps users track rental listings with saved searches, notifications, and dashboard analytics.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Tech Stack & Architecture

**Framework**: Next.js 16 (App Router) with React 19
**Database**: Neon Postgres with Drizzle ORM
**Authentication**: Clerk
**Styling**: Tailwind CSS 4 with shadcn/ui components
**UI Components**: shadcn/ui (New York style)
**Icons**: lucide-react
**Forms**: react-hook-form with zod validation
**Type Safety**: TypeScript with strict mode
**External API**: StreetEasy Rentals (via RapidAPI)

## Project Structure

```
app/
├── layout.tsx          # Root layout with Geist fonts
├── page.tsx            # Landing page
└── dashboard/
    └── page.tsx        # Main dashboard with stats and listings

components/
├── ui/                 # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── badge.tsx
│   └── table.tsx
└── dashboard/          # Dashboard-specific components
    ├── dashboard-layout.tsx   # Layout with sidebar navigation
    ├── sidebar.tsx            # Desktop sidebar component
    ├── mobile-nav.tsx         # Mobile header navigation
    └── index.ts               # Barrel export

lib/
├── db.ts               # Database connection (Neon + Drizzle)
├── schema.ts           # Complete database schema with all tables
├── utils.ts            # Utility functions (cn for className merging)
└── services/           # Business logic services
    ├── alert-batching.service.ts       # Smart batching algorithm
    ├── streeteasy-api.service.ts       # StreetEasy API client
    ├── listing-deduplication.service.ts # Deduplication logic
    ├── notification.service.ts          # Notification management
    └── cron-job.service.ts             # Main cron orchestration
```

## Key Patterns

### Import Aliases
Use `@/` prefix for imports (configured in tsconfig.json):
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### Component Organization
- Base UI components go in `components/ui/` (shadcn/ui managed)
- Feature-specific components in `components/[feature]/`
- Use barrel exports (`index.ts`) for feature directories

### Dashboard Layout Pattern
The dashboard uses a client-side layout wrapper (`DashboardLayout`) that handles:
- Desktop sidebar (always visible on md+ screens)
- Mobile sidebar with overlay (controlled by state)
- Mobile navigation header with hamburger menu
- Responsive padding: p-4 (mobile) → p-6 (tablet) → p-8 (desktop)

### Styling Conventions
- Use Tailwind's semantic color tokens: `text-foreground`, `bg-background`, `border-border`, `text-muted-foreground`
- Use `cn()` utility for conditional className merging
- Follow shadcn/ui component patterns for consistency
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)

### Client vs Server Components
- Dashboard layout is client component ("use client") for state management
- Page components default to server components unless interactivity needed
- Use "use client" directive only when necessary (state, effects, event handlers)

## shadcn/ui Integration

This project uses shadcn/ui with the following configuration:
- Style: "new-york"
- Base color: "neutral"
- CSS variables enabled
- Icon library: lucide-react

To add new components:
```bash
npx shadcn@latest add [component-name]
```

Components are added to `components/ui/` and can be customized after installation.

## Database Architecture

### Schema Overview
Complete production-ready database schema with 7 core tables:
- `alerts` - User rental search criteria
- `alert_batches` - Grouped alerts for cost-efficient API calls
- `alert_batch_memberships` - Many-to-many relationships
- `listings` - Rental listings from StreetEasy API
- `user_seen_listings` - Deduplication tracking
- `notifications` - Notification queue
- `cron_job_logs` - Execution monitoring

### Key Optimizations
1. **Smart Batching**: Groups similar alerts to reduce API calls by 90-95%
2. **Deduplication**: Tracks seen listings per user to prevent duplicate notifications
3. **Indexes**: Composite indexes on critical query paths for <50ms performance
4. **Serverless**: Neon HTTP client for fast cold starts

### API Endpoints
- `GET/POST /api/alerts` - Alert CRUD operations
- `GET/PATCH/DELETE /api/alerts/[id]` - Individual alert management
- `GET/PATCH /api/notifications` - Notification retrieval and updates
- `GET /api/cron/check-alerts` - Automated alert checking (every 15 min)

### Documentation
Comprehensive documentation available in `claudedocs/`:
- `database-architecture.md` - Complete technical architecture (600+ lines)
- `setup-guide.md` - Step-by-step setup instructions (400+ lines)
- `api-reference.md` - Full API documentation (500+ lines)
- `architecture-flow.md` - Visual flow diagrams
- `implementation-summary.md` - Quick reference guide

### Current State
- Database schema implemented with Drizzle ORM
- All service layer functions completed
- API routes implemented with Clerk authentication
- Vercel Cron configuration ready
- Ready for database migration and deployment
