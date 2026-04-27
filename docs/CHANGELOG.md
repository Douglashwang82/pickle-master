# Changelog

## Unreleased

### Added

- Added a dedicated club leader management dashboard at `/clubs/[slug]/manage` with a sidebar navigation for Overview / Sessions / Members / Settings. Leaders are linked into it via a "管理後台" CTA on the club detail header.
- Overview page surfaces 4 KPI cards with sparklines plus visual analytics: a 6-month revenue bar chart with average reference line, fill-rate line chart, member-growth area chart, fee-tier donut, top-sessions horizontal bar chart, and a 7×24 attendance heatmap.
- Sessions management page supports a list / month-calendar dual view (powered by react-day-picker) with capacity dot indicators per day, clicking a day opens a Sheet with that day's sessions; toolbar offers status filters (upcoming / past / cancelled / all).
- Members management page offers a sortable, searchable data table (skill, role, joined-at, 90-day attendance, total paid, last active) plus a collapsible pending-applications panel with batch approve/reject.
- New analytics API endpoints: `GET /api/clubs/[clubId]/analytics/timeseries` (revenue / fill_rate / members), `GET /api/clubs/[clubId]/analytics/heatmap`, `GET /api/clubs/[clubId]/analytics/breakdown`, plus `POST /api/clubs/[clubId]/applications/batch` for batch application review. The original `GET /api/clubs/[clubId]/analytics` endpoint is preserved for backwards compatibility.
- Installed shadcn-compatible UI primitives written in-house: `table`, `calendar`, `chart`, `checkbox`, `command`, `tooltip`, `collapsible`, `toggle-group`, `toggle`. Added `recharts`, `react-day-picker`, `cmdk` and Radix UI primitives as runtime dependencies.
- Added optional session event image uploads for session creators, including Supabase Storage support and image display on session cards, public browse cards, and session detail pages.
- Redesigned `/dashboard` into a fuller home view with quick stats, created-club and joined-club sections, richer empty states, and upcoming confirmed sessions grouped into a dedicated panel.

### Performance

- Added `loading.tsx` streaming skeletons to dashboard, venues, profile, manage (all sub-routes), public sessions, and public clubs so users see instant content placeholders instead of blank screens during navigation.
- Memoized the Supabase client in `AppShell` with `useMemo` to prevent re-creation on every route re-render.
- Deferred the initial `NotificationBell` fetch by 2 seconds post-mount so it no longer competes with page data fetches on first load; bell also re-fetches on first open if data has not loaded yet.
- Switched `/venues` from `force-dynamic` to `revalidate = 300` so venue list responses are cached for 5 minutes (venue data does not vary per-user).
- Lazy-load all five Recharts chart components and `AttendanceHeatmap` in the manage overview page via `next/dynamic` with `ssr: false`; each shows a skeleton while its JS chunk loads, keeping Recharts out of the initial page bundle.

### Fixed

- Restyled the public `/sessions` search bar so its input and action button match the `/clubs` browse filter treatment.
- Expanded the public `/sessions` browse controls to include club-style filters, sorting, and a list/map view toggle with a district-based session map.
- Refreshed the dev seed data in `supabase/seed.sql` and `/api/dev/seed-all` so mock users, clubs, sessions, applications, debt-backed registrations, waitlist entries, and related demo records match the current implementation.
- Club map view now uses a localized vector basemap so streets and place labels can be controlled instead of relying on baked-in raster text.
- Club map view now includes a lightweight curated POI label layer for recognizable landmarks and sports venues.
- Club map POI labels now use Traditional Chinese names to match the product language.
- Club map now overlays key city and district tags in Traditional Chinese so broader place labels read consistently with the app.
- Club map pins now keep their position correctly while zooming because the custom pin transform no longer overrides MapLibre marker positioning.
- Session creation now returns leaders to the club Sessions tab and refreshes the club detail data so newly-created sessions appear immediately.
- Club session lists now show in-progress sessions until their end time, while session creation blocks start times in the past.
- Authenticated users who open the intro page at `/` are now redirected to `/clubs`.
- Club detail navigation now shows an immediate loading state and skips leader-only venue data for non-leaders.
- Added a global route loading state so navigations across the app show feedback immediately.
- Restored production build type-checking by tightening Supabase table fallback types and explicit relation result casts.
- Protected `/api/dev/*` seed and force-complete routes in production behind `DEV_ROUTE_SECRET`.
- Moved confirmed registration plus offline debt creation into a locking Postgres RPC to prevent last-slot overbooking races.
- Relaxed session registration uniqueness to only active registrations so cancelled, removed, or refunded members can rejoin later.
- Reused the shared auth guard on the dashboard so app-user/profile sync stays centralized.
- Added unit coverage for the production dev-route guard.
- Added unit coverage for the atomic registration/debt RPC helper.
- Restricted the atomic registration/debt RPC to the Supabase service role.
- Added a shared JSON body parser and consistent `INVALID_JSON` responses across API routes that accept request bodies.

## [0.6.1] — 2026-04-19

### Changed — Homepage Redesign

- **Landing page direction**: redesigned the intro page into a fuller editorial-style homepage with a stronger visual hierarchy, warmer brand atmosphere, and clearer section-to-section pacing.
- **Homepage copy**: rewrote the English and zh-TW landing-page messaging to focus on club operations, session flow, payments, and public discovery instead of generic SaaS language.
- **Hero experience**: replaced the simple centered hero with a split-layout hero that uses the existing home photography, layered motion, and richer editorial framing.
- **Homepage sections**: added new proof, feature-story, audience, discovery, and closing CTA sections to turn the page into a complete marketing flow.
- **Motion polish**: extended the intro-page animation utilities with softer ambient drift and glow effects while preserving reduced-motion behavior.
- **Public-page consistency**: updated the public shell, club browse, session browse, session detail, and login entry surfaces so the editorial homepage direction carries through the rest of the first-click journey.

## [0.6.0] — 2026-04-18

### Added — Session Waitlist

- **DB migration** `20260418010000_session_waitlist.sql`: adds `session_waitlist_entries` with FIFO queue state (`active`, `promoted`, `left`), active-entry uniqueness, queue indexes, and RLS read access for the queued member and club leaders.
- **API `POST+DELETE /api/sessions/[sessionId]/waitlist`**: active club members can join the waitlist when a session is full, see their current position, and leave the queue later.
- **Automatic promotion on participant removal**: when a leader removes a confirmed participant and a spot opens, the oldest active waitlist entry is promoted into the session automatically, receives the same debt-style payment record as a direct join, and gets an in-app notification.
- **Session join flow refactor**: direct joins now share the same registration + payment creation helper as waitlist promotions, so payment tracking stays consistent across both paths.
- **Session detail page**: full sessions now show `加入候補` for eligible members, and queued members see their current waitlist position with an exit action.
- **Notification bell**: adds a `waitlist_promoted` message so promoted members are told they are in the roster and still owe the session fee.

## [0.5.0] — 2026-04-18

### Added — Club Board

- **DB migration** `20260418000000_club_board.sql`: adds `club_board_posts` and `club_board_reactions` for persistent club announcements/notes, moderation status, pinning, and lightweight emoji reactions, plus member/leader RLS policies.
- **API `GET+POST /api/clubs/[clubId]/board`**: active members can fetch the board feed; members submit posts for review; leaders can publish directly.
- **API `POST /api/clubs/[clubId]/board/[postId]/review`**: leaders approve or reject member-submitted board items.
- **API `POST /api/clubs/[clubId]/board/[postId]/pin`**: leaders pin or unpin published board items.
- **API `POST /api/clubs/[clubId]/board/[postId]/reactions`**: active members add or remove emoji reactions on published posts.
- **Club detail page**: adds a fixed board section above the tabbed content, including a featured pinned item, a vertical editorial-style feed, leader moderation queue, and publish/submit composer.
- **Notifications + analytics**: important published announcements continue to fan out through the existing in-app notification bell, and new analytics events track board submission, publish, and reaction activity.

## [0.4.0] — 2026-04-17

### Added — Club Invite Links

- **DB migration** `20260417000000_club_invite_links.sql`: new `club_invite_links` table (token, club_id, creator, use_count, expires_at, max_uses, is_active) with RLS policies for leader write access.
- **API `POST /api/clubs/[clubId]/invite`**: leader generates a new invite link (deactivates any existing active link first).
- **API `GET /api/clubs/[clubId]/invite`**: leader retrieves the current active invite link.
- **API `DELETE /api/clubs/[clubId]/invite`**: leader revokes the active invite link.
- **API `GET /api/invite/[token]`**: public endpoint — resolves token to club preview info; validates link is active, not expired, and not exhausted.
- **API `POST /api/invite/[token]/join`**: authenticated endpoint — joins club immediately (open clubs) or submits a membership application (application-required clubs) via invite link; increments use_count on the token.
- **Page `/invite/[token]`**: public invite landing page. Unauthenticated visitors see club info and a "Sign In / Sign Up" button that redirects to login with a `next` param pointing back to the invite URL. Authenticated visitors can join or apply in one click. Already-members and pending applicants see appropriate status messages.
- **`InviteLinkManager` component**: leader-only UI in the club Settings tab to generate, copy, regenerate, and revoke invite links with use-count display.

## [0.3.0] — 2026-04-15

### Added — Guest Browse: Public Clubs & Sessions

- **Public club detail** (`/clubs/[slug]`): moved from the auth-gated `(app)` route group to the `(public)` group. Guests see club info, description, rules, and upcoming session list without logging in.
- **Public session detail** (`/sessions/[sessionId]`): moved to the `(public)` route group. Guests see full session details (time, location, capacity, fee, notes) without logging in. Roster is hidden until authenticated.
- **Public sessions browse page** (`/sessions`): new page listing all upcoming published/full sessions across all active clubs with keyword search and pagination.
- **`PublicSessionSearch` component**: search bar client component (uses `useSearchParams`) for the sessions browse page.
- **Auth-gated actions**: `JoinButton` and `ApplyDialog` now accept an `isAuthenticated` prop. When `false`, both buttons redirect to `/login?next=<return-url>` instead of triggering their respective flows.
- **Auth-aware public layout**: `(public)/layout.tsx` now checks the Supabase session server-side. Authenticated users see a "我的儀表板" link; guests see "登入 / 開始使用". Public nav also includes "瀏覽場次" and "探索社團" links.

## [0.2.0] — 2026-04-05

### Added — Member Debt Tracking

- **Join flow reworked**: member registration is immediately `confirmed` on join; payment transaction is created with status `initiated`, representing an outstanding debt to be collected offline
- **DB migration** `20260405000001_member_debt_tracking.sql`: adds `debt_notified_at` to `payment_transactions`
- **API** `POST /api/sessions/[sessionId]/notify-payment`: leader sends an in-app payment reminder to a specific member; stamps `debt_notified_at` on the transaction
- **API** `POST /api/sessions/[sessionId]/mark-debt-paid`: leader marks a member's outstanding debt as `succeeded`; sends member a payment-received notification
- **Roster API** updated: each row now includes `payment { id, status, amount_twd, debt_notified_at }` so the UI can render per-member payment state
- **`RosterList` component**: shows green "Paid" / amber "Unpaid · NT$X" badge per member; leaders see "Notify" and "Mark Paid" action buttons for unpaid members
- **`DebtProgressBar` component**: progress bar (amber → green when fully paid) showing collected vs outstanding amount and member count — rendered for leaders on the session detail page
- **`domain.ts`**: added `DebtInfo` and `RegistrationWithPayment` types
- **`database.types.ts`**: added `debt_notified_at` field to `payment_transactions` Row/Insert/Update

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
