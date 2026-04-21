# PickleMaster System Design

> Version: 1.1
> Date: 2026-04-21
> Based on: PRD v1.1

---

## 1. Purpose

This document translates the PRD into an MVP-ready system design for PickleMaster. The design is optimized for:

- shipping quickly with a small team
- supporting the core loop of create session -> join -> pay -> confirm -> remind
- minimizing operational overhead through managed services
- preserving a clean path to post-MVP features without overbuilding v1

---

## 2. MVP Scope

### In Scope

- multi-tenant club management for independent club leaders
- public club discovery, public session discovery, club profile pages, and session detail pages
- membership applications with approval or rejection
- open-club joins and invite-link based onboarding
- session creation, publishing, roster tracking, waitlist auto-promotion, and cancellation
- member join with offline-debt payment tracking; real gateway integration remains behind the payment abstraction
- refunds on session cancellation or participant removal
- user authentication and profile management
- club board posts, moderation, pinning, and lightweight reactions
- venue and peer reviews with member reputation signals
- searchable club discovery by keyword, district, membership type, skill level, and proximity
- basic notifications for booking confirmation, application status, and session reminders
- analytics events for funnel and operational health

### Out of Scope

- non-pickleball sports
- public court marketplace
- in-app chat, public social feed, or public social graph
- franchise or enterprise club tooling
- member self-service cancellation deadlines
- LINE Pay, live card settlement, and full English UI

---

## 3. Product and Technical Principles

1. Optimize for the core transaction loop, not feature breadth.
2. Use managed infrastructure wherever it removes engineering overhead.
3. Keep payment state authoritative on the backend, never on the client.
4. Enforce tenant isolation at the database layer.
5. Favor eventual consistency with fast user feedback over distributed complexity.
6. Design every user-facing action to complete in a small number of steps on mobile.

---

## 4. High-Level Architecture

## 4.1 Architecture Summary

PickleMaster MVP is a server-rendered web application built with Next.js and backed by Supabase. The web app serves public discovery pages, authenticated club workflows, roster management, offline-debt payment tracking, reviews, and club board coordination. Supabase provides PostgreSQL, authentication, storage, realtime updates, PostGIS-backed proximity search, and scheduled jobs. Payment authorization and refunds are abstracted behind application code; the current MVP uses mocked/offline collection while preserving a path to TapPay or NewebPay. Async side effects such as payment/refund webhooks, waitlist promotion notifications, and reminder scheduling run in server-side jobs and API routes.

## 4.2 Logical Components

```text
Users (Leader / Member / Newcomer)
        |
        v
Next.js Web App (Vercel)
        |
        +-- Public pages: club discovery, session discovery, invite, club profile
        +-- Authenticated app: clubs, sessions, roster, profile, reviews, board
        +-- Server actions / API routes
        |
        v
Application Backend Layer
        |
        +-- Auth orchestration
        +-- Membership and session business rules
        +-- Debt/payment transaction creation
        +-- Waitlist promotion
        +-- Review and reputation updates
        +-- Club board moderation
        +-- Webhook verification
        +-- Notification dispatch
        |
        v
Supabase Platform
        |
        +-- Postgres
        +-- Auth
        +-- Realtime
        +-- Storage
        |
        +-- Edge Functions / scheduled jobs
        |
        v
Third Parties
        |
        +-- TapPay / NewebPay
        +-- Email provider
        +-- LINE Login
        +-- Google OAuth
```

## 4.3 Deployment Topology

- Frontend and application routes run on Vercel.
- Primary data plane runs in Supabase APAC region.
- Payment gateway is external and communicates through signed API calls and webhooks.
- File uploads are stored in Supabase Storage with CDN delivery.
- Background workflows run as Supabase Edge Functions and scheduled tasks.

---

## 5. Core User Flows

## 5.1 Session Publish -> Join -> Track Payment

1. Club leader creates a session.
2. Backend validates leader permission, session fields, and club status.
3. Session is inserted with status `published`.
4. Members view upcoming sessions from the club feed.
5. Member taps join.
6. Backend checks membership, duplicate registration, capacity, and session status.
7. Backend creates a confirmed registration and an `initiated` payment transaction representing offline debt.
8. Roster and leader debt progress update from database state.
9. Leader can send a payment reminder or mark the payment transaction `succeeded`.
10. Future gateway mode can replace steps 7-9 with payment intent creation, tokenization, webhook verification, and confirmation.
11. Reminder job sends notifications before session start.

## 5.2 Membership Application

1. Logged-in user opens a public club page.
2. User submits application and optional intro message.
3. Backend prevents duplicate active application or existing membership.
4. Club leader receives in-app and email notification.
5. Leader approves or rejects.
6. Approved user becomes active member and gains feed access.

## 5.3 Session Cancellation with Refund

1. Club leader cancels a future session.
2. Backend marks session `cancelled`.
3. All confirmed registrations are marked `refund_pending`.
4. Refund jobs call gateway refund API.
5. Payment and registration states update on webhook or API confirmation.
6. Participants receive cancellation and refund notifications.

## 5.4 Waitlist Promotion

1. A full session exposes waitlist join/leave actions to eligible members.
2. Backend inserts one active `session_waitlist_entries` row per user/session.
3. When a leader removes a participant, the backend checks capacity and selects the oldest active waitlist entry.
4. The selected entry becomes `promoted`, a confirmed registration is created, a debt payment transaction is created, and the member receives an in-app notification.

## 5.5 Club Board

1. Active members submit board posts as `pending_review`.
2. Leaders publish directly or approve/reject submitted posts.
3. Published posts can be pinned and reacted to by active members.
4. Important published announcements can fan out to in-app notifications.

## 5.6 Reviews and Reputation

1. After a session is completed, participants can fetch reviewable players.
2. Peer reviews are inserted once per reviewer/reviewee/session and cannot be self-reviews.
3. Venue reviews are inserted once per reviewer/session.
4. Profile reputation aggregates are updated from peer reviews.

---

## 6. Domain Model

## 6.1 Primary Entities

- User
- Profile
- Club
- ClubMembership
- MembershipApplication
- Session
- SessionRegistration
- SessionWaitlistEntry
- PaymentTransaction
- RefundTransaction
- ClubInviteLink
- ClubBoardPost
- ClubBoardReaction
- Venue
- PeerReview
- VenueReview
- Notification
- AuditEvent
- AnalyticsEvent

## 6.2 Key Relationships

- A user can lead many clubs.
- A user can belong to many clubs.
- A club has many sessions.
- A session has many registrations.
- A registration has zero or one successful payment transaction.
- A payment transaction can have zero or more refund transactions.
- A session can have many waitlist entries; only one active waitlist entry per user/session is allowed.
- A club can have invite links, board posts, and board reactions scoped to active members.
- A session can optionally reference a venue.
- A completed session can produce peer reviews and venue reviews.

## 6.3 Suggested Tables

### users

- id
- auth_provider_user_id
- email
- created_at
- last_active_at
- status

### profiles

- user_id
- display_name
- photo_url
- skill_level
- bio
- contact_preference
- locale
- reputation_score
- review_count
- created_at
- updated_at

### clubs

- id
- owner_user_id
- slug
- name
- description
- sport_type
- cover_image_url
- district
- membership_type (`open`, `application`)
- skill_levels
- location_point
- fts
- rules
- public_status
- status
- created_at
- updated_at
- dissolved_at

### club_memberships

- id
- club_id
- user_id
- role (`leader`, `member`)
- status (`active`, `pending`, `removed`)
- joined_at
- removed_at

### membership_applications

- id
- club_id
- user_id
- intro_message
- status (`pending`, `approved`, `rejected`)
- reviewed_by
- reviewed_at
- created_at

### sessions

- id
- club_id
- venue_id
- title
- notes
- scheduled_start_at
- scheduled_end_at
- duration_minutes
- location_name
- capacity
- fee_twd
- currency
- status (`draft`, `published`, `full`, `cancelled`, `completed`, `auto_closed`)
- created_by
- created_at
- updated_at
- cancelled_at

### session_waitlist_entries

- id
- session_id
- user_id
- status (`active`, `promoted`, `left`)
- joined_at
- promoted_at
- left_at
- promoted_registration_id
- created_at
- updated_at

### session_registrations

- id
- session_id
- user_id
- status (`payment_pending`, `confirmed`, `cancelled`, `removed`, `refund_pending`, `refunded`)
- booking_hold_expires_at
- payment_transaction_id
- joined_at
- cancelled_at

### payment_transactions

- id
- session_id
- registration_id
- club_id
- payer_user_id
- gateway
- gateway_payment_id
- amount_twd
- platform_fee_twd
- net_amount_twd
- status (`initiated`, `authorized`, `succeeded`, `failed`, `refund_pending`, `partially_refunded`, `refunded`)
- failure_code
- failure_message
- debt_notified_at
- settled_at
- created_at
- updated_at

### club_invite_links

- id
- club_id
- token
- created_by
- expires_at
- max_uses
- use_count
- is_active
- created_at

### club_board_posts

- id
- club_id
- author_user_id
- reviewed_by
- kind (`announcement`, `note`)
- title
- body
- status (`pending_review`, `published`, `rejected`, `archived`)
- importance (`normal`, `important`)
- is_pinned
- rejection_reason
- published_at
- reviewed_at
- created_at
- updated_at

### club_board_reactions

- id
- post_id
- user_id
- emoji
- created_at

### venues

- id
- name
- address
- district
- created_at

### peer_reviews

- id
- session_id
- reviewer_user_id
- reviewee_user_id
- rating
- badges
- created_at

### venue_reviews

- id
- venue_id
- session_id
- reviewer_user_id
- facilities_rating
- lighting_rating
- floor_rating
- transport_rating
- comment
- created_at

### refund_transactions

- id
- payment_transaction_id
- gateway_refund_id
- amount_twd
- reason
- status (`pending`, `succeeded`, `failed`)
- retry_count
- created_at
- updated_at

### notifications

- id
- user_id
- channel (`email`, `in_app`)
- type
- payload_json
- status (`pending`, `sent`, `failed`)
- send_at
- created_at

### analytics_events

- id
- event_name
- user_id
- club_id
- session_id
- properties_json
- occurred_at

---

## 7. State Machines

## 7.1 Membership Application State

```text
pending -> approved
pending -> rejected
```

## 7.2 Session State

```text
draft -> published -> full
published -> cancelled
full -> published        (if a spot reopens)
published -> completed
full -> completed
published -> auto_closed
full -> auto_closed
```

## 7.3 Registration State

```text
payment_pending -> confirmed
payment_pending -> cancelled      (hold expired or payment failed)
confirmed -> refund_pending
confirmed -> cancelled            (future P1 self-cancel path)
confirmed -> removed
refund_pending -> refunded
```

## 7.4 Payment State

```text
initiated -> succeeded
initiated -> failed
succeeded -> refund_pending
refund_pending -> refunded
refund_pending -> failed
```

## 7.5 Waitlist Entry State

```text
active -> promoted
active -> left
```

## 7.6 Club Board Post State

```text
pending_review -> published
pending_review -> rejected
published -> archived
```

---

## 8. API Design

The MVP should prefer server actions where practical for first-party UI flows, with HTTP endpoints retained for webhook handlers and externally triggered workflows.

## 8.1 Auth and Profile

- `GET /api/auth/callback`
- `GET /api/me`
- `PATCH /api/me/profile`

## 8.2 Clubs

- `GET /api/clubs/public`
- `GET /api/clubs/:slug`
- `POST /api/clubs`
- `PATCH /api/clubs/:clubId`
- `POST /api/clubs/:clubId/dissolve`
- `GET /api/clubs/:clubId/members`
- `GET /api/clubs/:clubId/analytics`
- `POST /api/clubs/:clubId/announce`
- `GET /api/clubs/:clubId/invite`
- `POST /api/clubs/:clubId/invite`
- `DELETE /api/clubs/:clubId/invite`
- `GET /api/invite/:token`
- `POST /api/invite/:token/join`

## 8.3 Membership Applications

- `POST /api/clubs/:clubId/applications`
- `GET /api/clubs/:clubId/applications`
- `POST /api/clubs/:clubId/applications/:applicationId/approve`
- `POST /api/clubs/:clubId/applications/:applicationId/reject`
- `DELETE /api/clubs/:clubId/applications/:applicationId`

## 8.4 Sessions

- `GET /api/clubs/:clubId/sessions`
- `POST /api/clubs/:clubId/sessions`
- `GET /api/sessions/:sessionId`
- `POST /api/sessions/:sessionId/cancel`
- `GET /api/sessions/:sessionId/roster`
- `POST /api/sessions/:sessionId/remove-participant`
- `POST /api/sessions/:sessionId/waitlist`
- `DELETE /api/sessions/:sessionId/waitlist`
- `POST /api/sessions/:sessionId/notify-payment`
- `POST /api/sessions/:sessionId/mark-debt-paid`
- `GET /api/sessions/:sessionId/reviewable-players`
- `POST /api/sessions/:sessionId/peer-reviews`

## 8.5 Payments and Booking

- `POST /api/sessions/:sessionId/join`
  - validates eligibility
  - creates booking hold
  - creates payment intent
  - returns payment client token
- `POST /api/payments/webhook`
  - verifies gateway signature
  - updates payment and registration state
- `POST /api/refunds/webhook`
  - processes refund result callbacks when supported by gateway

## 8.6 Club Board

- `GET /api/clubs/:clubId/board`
- `POST /api/clubs/:clubId/board`
- `POST /api/clubs/:clubId/board/:postId/review`
- `POST /api/clubs/:clubId/board/:postId/pin`
- `POST /api/clubs/:clubId/board/:postId/reactions`

## 8.7 Venues and Reviews

- `GET /api/venues`
- `GET /api/venues/:venueId`
- `GET /api/venues/:venueId/reviews`
- `POST /api/venues/:venueId/reviews`

## 8.8 Notifications and Cron

- `GET /api/me/notifications`
- `PATCH /api/me/notifications`
- `GET /api/cron/expire-holds`
- `GET /api/cron/close-sessions`
- `GET /api/cron/send-reminders`

---

## 9. Concurrency and Consistency Design

## 9.1 Last Spot Contention

To avoid overbooking, the system should use a transactional capacity check.

Recommended approach:

1. Lock the target session row in the database.
2. Count current confirmed registrations.
3. Reject if capacity is reached.
4. Current MVP: create a `confirmed` registration and an `initiated` payment transaction in one write path.
5. Future gateway mode: create a short-lived `payment_pending` registration hold and convert it to `confirmed` on payment success.
6. Expire unpaid holds with a scheduled cleanup job when gateway mode is enabled.

This is simpler and safer than trying to reserve capacity entirely in memory or in the client.

## 9.1a Waitlist Ordering

- Enforce one active waitlist row per session/user with a partial unique index.
- Promote by `joined_at asc` inside the same participant-removal workflow that reopens capacity.
- Mark the waitlist row `promoted` and store `promoted_registration_id` so retries are idempotent.

## 9.2 Realtime Roster Updates

- Use Supabase Realtime subscriptions for session and registration changes.
- Treat database commits as the source of truth.
- The UI should optimistically show payment progress but only show confirmed booking after backend confirmation.

## 9.3 Webhook Idempotency

- Store gateway webhook event IDs when available.
- Reject duplicate webhook processing.
- Make payment success handlers idempotent so retries do not create duplicate confirmations or refunds.

---

## 10. Security Design

## 10.1 Authentication

- Supabase Auth handles email/password, Google OAuth, and LINE Login.
- JWT access tokens are short-lived.
- Refresh tokens support 7-day inactivity windows.
- Password hashing uses bcrypt with cost factor 12 or higher.

## 10.2 Authorization

- Enforce multi-tenant access with Postgres Row-Level Security.
- Club leaders can manage only clubs they own or lead.
- Members can view only club-private data for clubs they belong to.
- Public discovery and club pages expose only explicitly public fields.
- Club board posts are readable by active club members, leaders, and their authors while pending.
- Invite links are managed by leaders; public token resolution is validated through API logic for active, non-expired, non-exhausted links.
- Peer and venue reviews are insert-only for authenticated users and constrained by uniqueness/self-review database rules.

## 10.3 Payment Security

- Raw card data never touches PickleMaster servers.
- Client uses gateway SDK to tokenize payment details.
- Backend stores only gateway references and masked metadata if needed.
- Webhook endpoints verify signatures and source authenticity.
- In current offline-debt mode, payment state changes are leader-driven application actions, and `debt_notified_at` records reminder follow-up.

## 10.4 Data Protection

- Encrypt email and phone fields at rest when supported by platform patterns.
- Use TLS for all client and service traffic.
- Store audit logs for membership changes, session cancellations, refunds, and club dissolution.

## 10.5 Abuse Prevention

- Rate limit authenticated and unauthenticated APIs.
- Add bot protection to signup and application endpoints if abuse appears.
- Restrict image upload MIME type and file size.

---

## 11. Notification Design

## 11.1 MVP Channels

- email
- in-app notification center

## 11.2 Notification Triggers

- membership application submitted
- membership approved or rejected
- session published
- session booking confirmed
- payment failed
- payment reminder sent
- payment marked paid
- session cancelled
- participant removed
- waitlist promoted
- board post published
- reminder before session start
- club dissolved

## 11.3 Delivery Strategy

- Write notifications to a durable table first.
- Use async workers for dispatch.
- Retry transient failures.
- Avoid blocking critical write paths on email provider latency.

---

## 12. Analytics and Observability

## 12.1 Product Analytics

Capture the PRD events as first-class analytics events:

- `club_created`
- `session_created`
- `session_join_click`
- `payment_initiated`
- `payment_success`
- `payment_failed`
- `session_cancelled`
- `membership_applied`
- `membership_approved`
- `signup_completed`
- `profile_completed`
- `waitlist_joined`
- `waitlist_promoted`
- `board_post_submitted`
- `board_post_published`
- `board_reaction_added`

## 12.2 Operational Metrics

- API latency p50, p95, p99
- payment success rate
- webhook processing lag
- refund success rate
- email delivery success rate
- realtime event delivery lag
- session capacity utilization

## 12.3 Logging

Structured logs should include:

- request_id
- user_id when authenticated
- club_id when relevant
- session_id when relevant
- payment_transaction_id for payment flows
- webhook event id

Sensitive fields must be redacted.

## 12.4 Alerting

- repeated payment webhook failures
- refund failures after retry limit
- elevated join-to-pay dropoff
- API p95 above SLA for sustained periods
- realtime or notification backlog growth

---

## 13. Performance Design

## 13.1 Target Alignment

- page load under 2s on 4G for public pages
- session feed p95 under 500ms API time
- payment flow under 10s end-to-end
- roster state visible within 5s
- support 500 concurrent users at MVP scale

## 13.2 Performance Tactics

- SSR and caching for public discovery and club profile pages
- indexed queries on `clubs.slug`, `sessions.club_id + scheduled_start_at`, and registration lookup paths
- pagination for session history and member rosters
- minimal joins on hot feed paths
- use background jobs for refunds and reminders

---

## 14. Data Access and Indexing

Recommended indexes:

- `clubs(slug)` unique
- `clubs(district)` partial for public active discovery
- `clubs(membership_type)` partial for public active discovery
- `clubs(fts)` GIN for keyword search
- `clubs(skill_levels)` GIN for skill filtering
- `clubs(location_point)` GIST for PostGIS proximity sorting/filtering
- `club_memberships(club_id, user_id)` unique
- `membership_applications(club_id, user_id, status)`
- `sessions(club_id, scheduled_start_at)`
- `sessions(status, scheduled_start_at)`
- `session_registrations(session_id, user_id)` unique
- `session_registrations(session_id, status)`
- `session_waitlist_entries(session_id, user_id)` partial unique where status is `active`
- `session_waitlist_entries(session_id, status, joined_at)`
- `payment_transactions(registration_id)` unique
- `payment_transactions(gateway_payment_id)` unique
- `club_invite_links(token)` unique
- `club_board_posts(club_id, status, created_at desc)`
- `club_board_reactions(post_id)`
- `peer_reviews(reviewee_user_id)`
- `venue_reviews(venue_id)`
- `notifications(user_id, status, send_at)`

---

## 15. Background Jobs

## 15.1 Required Jobs for MVP

- expire unpaid booking holds
- auto-close sessions after scheduled end + 2 hours
- send session reminders
- promote waitlist entries during participant removal when capacity reopens
- queue notifications for waitlist promotions and important board announcements
- retry failed refunds
- reconcile payment settlement status if gateway requires polling

## 15.2 Scheduling Guidance

- hold expiry: every minute
- reminder dispatch: every 5 minutes
- auto-close sessions: every 15 minutes
- refund retry worker: hourly

---

## 16. Failure Handling Strategy

## 16.1 Payment Failure

- do not confirm the registration
- release or expire the hold
- return actionable error copy to the user
- record failure analytics and gateway code

## 16.2 Refund Failure

- keep registration in `refund_pending`
- log and alert
- retry up to 3 times over 24 hours
- expose status to leader and member

## 16.3 Notification Failure

- do not fail the underlying business action
- mark notification as failed and retry asynchronously

## 16.4 Partial Outage Mode

If realtime is degraded, the app should fall back to manual refresh while preserving correctness from database reads.

---

## 17. MVP Delivery Plan

## 17.1 Release Slices

### Slice 1: Foundation

- auth
- user profile
- club creation and editing
- public discovery and club profile pages

### Slice 2: Membership

- apply to club
- leader approval or rejection
- member roster

### Slice 3: Core Session Operations

- session CRUD for leaders
- session feed for members
- realtime roster updates
- waitlist join/leave and auto-promotion

### Slice 4: Payments

- join flow
- offline-debt payment transaction creation
- leader payment reminders and mark-paid workflow
- future payment intent creation
- future payment success and failure handling
- transaction history

### Slice 5: Operational Reliability

- refunds
- reminders
- club dissolution workflow
- analytics and alerting baseline

### Slice 6: Growth and Trust

- invite links
- public session browsing
- club board
- venue reviews
- peer reputation
- searchable skill/location discovery

## 17.2 Recommended Build Order

1. Public discovery and auth
2. Club management and membership
3. Session publishing and roster
4. Payment integration
5. Refunds, reminders, analytics, and hardening

---

## 18. Key Risks and Mitigations

| Risk | Why It Matters | Mitigation |
|------|----------------|------------|
| Payment gateway complexity | Core funnel depends on smooth payment | Choose one gateway only for MVP, build against sandbox first, keep payment abstraction thin |
| Overbooking under concurrency | Directly breaks trust in session booking | Use transactional capacity checks and short-lived holds |
| Poor notification reliability | Members miss sessions and leaders lose fill rate | Queue notifications durably and add retries |
| Overuse of realtime features | Can complicate simple flows | Restrict realtime to roster and capacity updates only |
| Vendor coupling to Supabase | Speeds MVP but may constrain scale | Keep domain logic in application layer and avoid database-specific sprawl |

---

## 19. Recommended MVP Decisions

1. Use Supabase Auth for all login methods instead of building custom identity flows.
2. Keep the current payment abstraction and offline-debt MVP mode until TapPay or NewebPay is selected.
3. Support email and in-app notifications only in MVP.
4. Implement refund automation only for platform-triggered cases in live gateway mode.
5. Ship as a responsive web app only; no native mobile app.
6. Use RLS plus service-role backend operations for privileged workflows.

---

## 20. Open Questions

These do not block architecture, but they should be resolved before implementation:

1. Will club leaders receive payouts directly from the gateway, or will the platform act as merchant of record?
2. Is service fee configuration global only, or per club?
3. Should session fees always be one flat amount, or can clubs later support member tiers?
4. Which notification provider will send transactional email in MVP?
5. What exact reminder timing should be used: 24 hours, 2 hours, or both?

---

## 21. Conclusion

This MVP design keeps PickleMaster centered on a single reliable operational loop: club leaders publish sessions, members discover them, payments confirm attendance, and rosters stay accurate in real time. The architecture deliberately prioritizes speed, managed infrastructure, and correctness around payments and capacity. That is the right trade for validating the business in one demonstration club before expanding into broader club SaaS capabilities.
