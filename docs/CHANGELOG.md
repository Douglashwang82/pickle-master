# Changelog

## [0.1.0] — 2026-04-02

### Added — Slice 1: Foundation
- Project scaffold: Next.js 16, Tailwind CSS, shadcn/ui, Supabase, Zod
- Database schema: 11 tables with CHECK constraints, indexes, RLS policies (3 migrations)
- Supabase client (browser + server), service-role admin client (`lib/db.ts`)
- Next.js middleware: session refresh + auth redirect
- Auth guard helpers: `requireAuth`, `requireClubLeader`, `requireClubMember`
- API: `GET /api/me`, `PATCH /api/me/profile`
- API: `GET /api/clubs/public`, `GET+PATCH /api/clubs/[clubId]`, `POST /api/clubs`, `POST /api/clubs/[clubId]/dissolve`
- API: `GET /api/clubs/[clubId]/members`
- UI: Login page (email + Google OAuth), app shell layout, public discovery page, club detail page, create/edit club form, profile page, dashboard

### Added — Slice 2: Membership
- API: `POST+GET /api/clubs/[clubId]/applications`, approve/reject endpoints
- UI: Apply to club page, member roster page, `ApplicationReview` component
- Hook: `useClubMembership(clubId)`
- Analytics: `membership_applied`, `membership_approved` events

### Added — Slice 3: Sessions
- State machine: `canSessionTransition`, `sessionStatusAfterRegistration`
- API: `GET+POST /api/clubs/[clubId]/sessions`
- API: `GET /api/sessions/[sessionId]`, cancel, roster, remove-participant
- UI: Session feed, session detail page, create session form, `RosterList` (Supabase Realtime), `CancelSessionButton`
- Analytics: `session_created`, `session_cancelled` events

### Added — Slice 4: Mock Payment
- Mock payment client (`lib/payment/client.ts`) — replace with TapPay when integrating
- API: `POST /api/sessions/[sessionId]/join` — capacity check, booking hold, mock payment
- API: Webhook stubs for `/api/payments/webhook`, `/api/refunds/webhook`
- Cron: `POST /api/cron/expire-holds` — expires stale booking holds every 5 minutes
- UI: `PaymentModal` (mock), `JoinButton`
- Analytics: `payment_initiated`, `payment_success`, `payment_failed` events

### Added — Slice 5: Reliability
- Cron: `POST /api/cron/close-sessions` — auto-closes sessions 2h after end time
- Cron: `POST /api/cron/send-reminders` — queues 24h session reminder notifications
- `vercel.json` cron schedule configuration
- Unit tests: state machines (session, payment, registration)
