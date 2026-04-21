# PRD: PickleMaster

> **Version:** 1.1 | **Date:** 2026-04-21 | **Status:** Implementation-aligned draft

---

## 1. Context

### Problem Statement
Pickleball club leaders ("團主") in the greater Taipei area spend up to 80% of their time on administrative grunt work — collecting payments, scheduling courts, managing rosters — instead of growing their communities. Meanwhile, players struggle to find quality clubs that match their skill level, facing social anxiety and fragmented court availability. The result is a market where demand for organized, branded sports experiences is booming among urban middle-class consumers, but no platform exists to professionalize and scale club operations.

### Product Vision
PickleMaster transforms casual pickleball groups into professionally managed, branded sports communities — giving club leaders a one-click SaaS toolkit to run their operations, while giving players a seamless way to discover, join, and enjoy high-quality club experiences across the Taipei metro area.

### Goals
- **Validate the core loop:** Prove that session scheduling plus payment tracking reduce club leader admin time by ≥50% within the first demonstration club.
- **Achieve product-market fit:** Reach 1 active demonstration club with ≥30 recurring members and ≥80% session fill rate within Q1.
- **Establish SaaS foundation:** Ship a multi-tenant platform that enables any club leader to create, manage, and grow a club without engineering support.
- **Build brand equity:** Demonstrate that a branded, professionally operated club commands higher willingness-to-pay and retention than informal LINE-group-based clubs.

### Current Implementation Alignment
The live MVP has advanced beyond the original v1.0 draft in several places. This PRD now treats public browsing, searchable club discovery, offline-debt payment tracking, invite links, club board posts, waitlist auto-promotion, venue reviews, and peer reputation as part of the current product surface. Real payment gateway settlement remains a future integration behind the existing payment abstraction.

### Non-Goals
> Non-goals are as important as goals. Without them, every meeting becomes a negotiation about scope.

- **Not a general sports platform.** PickleMaster focuses exclusively on pickleball in v1. We will not support tennis, badminton, or other racket sports — even if the data model could accommodate them.
- **Not a venue booking marketplace.** We do not aggregate or list third-party courts for independent booking. Court management exists only within the context of a club's scheduled sessions.
- **Not a social network.** Club board posts are limited to operational announcements and member notes inside a club. There is no public social graph, open-ended feed, or direct messaging.
- **Not targeting enterprise or franchise operations.** v1 serves independent club leaders running 1–3 clubs. Multi-location franchise tooling is out of scope.
- **No offline mode.** All features require an internet connection. Offline-first architecture is not a priority for an urban Taipei audience.

---

## 2. User Experience

### Persona 1: Coach Chen — Club Leader (團主)
- **Background:** 35-year-old pickleball enthusiast who runs a semi-regular group of 40+ players. Uses LINE groups and spreadsheets to manage everything. Works a full-time job during the day.
- **Pain Point:** Spends 10+ hours/week chasing payments, manually scheduling courts, and resolving roster conflicts. Can't grow beyond 40 members because the admin overhead is already unbearable.
- **Motivation:** Wants to run a professional, respected club brand — with automated operations so he can focus on coaching and community-building instead of bookkeeping.

### Persona 2: Amy — Active Player (團員)
- **Background:** 28-year-old office worker in Taipei who plays pickleball 2–3 times per week. Currently bounces between 3 different LINE groups to find games.
- **Pain Point:** Never knows which sessions match her skill level. Has been "ghosted" by groups that felt too cliquey. Paying via bank transfer is annoying and she often forgets.
- **Motivation:** Wants a single, reliable club where she feels welcomed, can play with people at her level, and where joining a session is as easy as tapping a button.

### Persona 3: David — Newcomer (外部人士)
- **Background:** 32-year-old expat living in Taipei, curious about pickleball after seeing it on social media. Doesn't know anyone who plays.
- **Pain Point:** Has no idea how to find a club, doesn't speak fluent Mandarin, and feels intimidated by the idea of showing up to a group of strangers.
- **Motivation:** Wants a low-friction way to discover a welcoming club, see what sessions are available, and sign up without needing an insider introduction.

### Critical User Flow

**Flow Name:** "Club leader publishes a session → Members join and pay → Session happens"

```
Step 1: Club leader creates a new session (date, time, court, capacity, fee) → System publishes session to club activity feed
Step 2: Member browses upcoming sessions → System shows available sessions with spots remaining and fee
Step 3: Member taps "Join Session" → System checks capacity and confirms the roster spot
Step 4: System creates an outstanding payment record for offline collection; leader can notify or mark paid
Step 5: Session day arrives → System sends reminder notifications to all confirmed participants
```

**Why this flow is the core:** This is the fundamental value exchange of PickleMaster. If club leaders can't effortlessly publish sessions and members can't seamlessly join and pay, nothing else matters. Every other feature (profiles, club discovery, analytics) exists to support this loop.

**High-risk drop-off points:**
- **Step 3 → Step 4 (Payment):** Until a live gateway is connected, debt tracking must make unpaid balances obvious and easy for leaders to follow up.
- **Step 1 (Session creation):** If creating a session requires more than 60 seconds or too many fields, club leaders will revert to LINE messages.
- **Step 2 (Session discovery):** If members don't receive timely notifications about new sessions, they won't check the app and the session won't fill.

### User Stories

| # | As a... | I want to... | So that... | Priority |
|---|---------|--------------|------------|----------|
| 1 | Club leader | Create a new session with date, time, court, capacity, and fee | Members can discover and join the session | P0 |
| 2 | Club leader | See a real-time roster of who has joined and paid for each session | I know exactly who's coming without chasing people on LINE | P0 |
| 3 | Club leader | Create and manage my club (name, description, rules, branding) | My club has a professional identity that attracts members | P0 |
| 4 | Club leader | Dissolve a club I no longer want to operate | I can cleanly wind down without loose ends | P1 |
| 5 | Member | Browse upcoming sessions in my club and see available spots | I can pick sessions that fit my schedule | P0 |
| 6 | Member | Join a session and pay in one seamless flow | I don't have to deal with bank transfers or cash | P0 |
| 7 | Member | Manage my profile (name, skill level, photo, contact) | Other members and club leaders know who I am | P0 |
| 8 | Newcomer | Discover clubs and view their information publicly | I can evaluate whether a club is right for me before committing | P0 |
| 9 | Newcomer | Apply to join a club and create a profile | I can start participating in sessions | P0 |
| 10 | Club leader | Approve or reject membership applications | I can maintain club quality and culture | P0 |
| 11 | Member | Receive notifications when new sessions are posted or when my booking is confirmed | I never miss a session opportunity | P1 |
| 12 | Club leader | View basic analytics (attendance rate, payment status, member growth) | I can make data-driven decisions about my club | P1 |
| 13 | Member | Cancel my session registration before a configurable deadline | I free up my spot for someone else and get a refund if applicable | P1 |
| 14 | Member | Join a waitlist for full sessions | I can still get a spot when someone is removed | P0 |
| 15 | Club leader | Generate invite links for a club | I can onboard members from LINE or direct outreach quickly | P1 |
| 16 | Club member | Post notes or announcements to the club board | The club can coordinate without scattering updates across chat threads | P1 |
| 17 | Member | Review venues and session peers after play | Future players can trust venue quality and member reputation | P1 |
| 18 | Newcomer | Filter clubs by district, skill level, membership type, and proximity | I can find a club that matches my location and level | P1 |

*P0 = Must-have for MVP, P1 = Important, P2 = Nice-to-have*

---

## 3. Requirements

### 3.1 Functional Requirements (P0 — MVP)

#### Feature 1: Club Management
- **Description:** Club leaders can create, configure, and manage their clubs. This is the foundational entity around which all other features revolve.
- **Functional Requirements:**
  - FR-01: Club leader can create a club with name, description, sport type (pickleball), cover image, and club rules.
  - FR-02: Club leader can edit club details at any time.
  - FR-03: Club leader can dissolve a club. Dissolution triggers notification to all members, cancels all future sessions, and processes any pending refunds.
  - FR-04: Each club has a unique public URL/slug for discovery.
  - FR-05: Club leader can view a member roster with join date and status (active, pending, removed).
  - FR-05a: Club leader can configure district, membership type (open or application), supported skill levels, and an optional cover image.
  - FR-05b: Club leader can generate, view, regenerate, and revoke invite links.
- **Constraints & NFRs:** Club creation must complete within 3 seconds. Club data must support Traditional Chinese (zh-TW) and English (en-US) input.
- **Acceptance Criteria:**
  - [ ] A new user can create a club and see it appear on the public discovery page within 10 seconds.
  - [ ] Dissolving a club sends notifications to all active members and cancels all future sessions.
  - [ ] Club details (name, description, rules) render correctly in both zh-TW and en-US.

#### Feature 2: Session Scheduling & Roster
- **Description:** Club leaders publish sessions (games/practices) with all relevant details. Members can view available sessions and join them. This is the operational heartbeat of the platform.
- **Functional Requirements:**
  - FR-06: Club leader can create a session with: date, time, duration, court/location, maximum capacity, fee per person, and optional notes.
  - FR-07: Club leader can cancel a session. Cancellation triggers refunds for all paid participants and sends notifications.
  - FR-08: Members see a list of upcoming sessions in their club, showing available spots, date/time, location, and fee.
  - FR-09: System enforces capacity limits — once a session is full, the "Join" button is disabled.
  - FR-10: Club leader can view a real-time roster for each session (who joined, who paid, who cancelled).
  - FR-11: Club leader can remove a participant from a session (triggers refund and notification).
  - FR-11a: When a full session has an active waitlist, eligible members can join or leave the waitlist.
  - FR-11b: When a leader removes a participant and capacity reopens, the oldest active waitlist entry is promoted automatically.
- **Constraints & NFRs:** Session list must load within 1 second. Roster updates must reflect within 5 seconds of a state change (join, cancel, payment).
- **Acceptance Criteria:**
  - [ ] Creating a session with all required fields publishes it to the club's session feed.
  - [ ] A member cannot join a session that is already at full capacity.
  - [ ] Cancelling a session triggers refund processing for all paid participants.
  - [ ] Roster accurately reflects current join/payment status in real-time.

#### Feature 3: Payment Tracking and Future Automated Collection
- **Description:** When a member joins a session, payment is collected automatically — eliminating the #1 admin burden for club leaders.
- **Functional Requirements:**
  - MVP note: Real gateway collection is mocked/deferred. Joining confirms the roster spot immediately and creates an outstanding `initiated` payment transaction for offline collection. Leaders can see paid/unpaid status, send in-app payment reminders, and mark debts as paid.
  - FR-12: When a member taps "Join Session," the system confirms the roster spot if eligibility and capacity checks pass.
  - FR-13: The MVP creates a payment transaction with status `initiated` to represent offline debt.
  - FR-14: Club leaders can see paid/unpaid status per roster member and aggregate collected/outstanding totals.
  - FR-15: Club leaders can send an in-app payment reminder and mark a member's debt as paid.
  - FR-16: Refunds are triggered automatically on session cancellation or participant removal. Refund status is visible to both club leader and member.
  - FR-17: Platform collects a service fee (configurable, default 5%) on each transaction. Net amount is settled to club leader's designated account.
- **Constraints & NFRs:** Payment flow must complete within 10 seconds end-to-end. PCI-DSS compliance is required — the platform must never store raw card data (use tokenization via payment gateway). All payment amounts displayed in TWD (NT$).
- **Acceptance Criteria:**
  - [ ] A member can join a session and immediately appear as confirmed with unpaid status.
  - [ ] Club leader can notify unpaid members and mark payment as received.
  - [ ] Refund is automatically initiated when a session is cancelled by the club leader.
  - [ ] Club leader can see transaction history with amounts, fees, and settlement status.

#### Feature 4: User Profiles & Authentication
- **Description:** All users (club leaders, members, newcomers) have profiles. Authentication gates access to club-specific features.
- **Functional Requirements:**
  - FR-18: Users can sign up and log in via email + password or social login (Google, LINE).
  - FR-19: Users can create and edit their profile: display name, photo, skill level (beginner / intermediate / advanced), short bio, and contact preference.
  - FR-20: Profile is visible to other members within the same club.
  - FR-21: A user can be a member of multiple clubs simultaneously.
  - FR-22: A user can also be a club leader of one or more clubs while being a member of others.
- **Constraints & NFRs:** Authentication must use OAuth 2.0 / OpenID Connect. Passwords must be hashed with bcrypt (cost factor ≥12). Session tokens expire after 7 days of inactivity.
- **Acceptance Criteria:**
  - [ ] A new user can sign up, create a profile, and browse clubs within 2 minutes.
  - [ ] LINE login works correctly for the primary Taiwan user base.
  - [ ] Profile changes are reflected immediately across all club contexts.

#### Feature 5: Club Discovery & Membership Application
- **Description:** Newcomers and non-members can discover clubs, view their public information, and apply to join.
- **Functional Requirements:**
  - FR-23: A public discovery page lists all active clubs with name, description, member count, and next upcoming session.
  - FR-24: Each club has a public profile page viewable without login.
  - FR-25: A logged-in user can submit a membership application to a club (optional: short intro message).
  - FR-26: Club leader receives notification of new applications and can approve or reject them.
  - FR-27: Approved applicants become club members and gain access to the club's session feed.
  - FR-28: Rejected applicants receive a notification (no reason required).
  - FR-29: Public club discovery supports keyword search, district filtering, membership-type filtering, skill-level filtering, proximity search, and sorting by newest, member count, activity, or nearest.
  - FR-30: Public session discovery lists upcoming sessions across active clubs and routes unauthenticated users to login before gated actions.
- **Constraints & NFRs:** Discovery page must load within 2 seconds. Search/filter queries must be paginated and backed by database indexes or RPCs.
- **Acceptance Criteria:**
  - [ ] An unauthenticated user can view the discovery page and individual club profiles.
  - [ ] A logged-in user can apply to a club and the club leader receives the application.
  - [ ] Approved members immediately see the club's session feed.

#### Feature 6: Club Board
- **Description:** Clubs can keep lightweight operational posts close to their membership workflows.
- **Functional Requirements:**
  - FR-31: Active members can submit notes or announcements to a club board.
  - FR-32: Leaders can publish directly, review member submissions, reject submissions with an optional reason, and pin important posts.
  - FR-33: Active members can react to published posts with a constrained emoji set.
  - FR-34: Important published announcements can create in-app notifications.
- **Constraints & NFRs:** Board posts are club-private. Body content is limited to 1,000 characters and titles to 120 characters.

#### Feature 7: Reviews, Reputation, and Venues
- **Description:** The product captures structured trust signals after sessions without becoming a public social network.
- **Functional Requirements:**
  - FR-35: Completed-session participants can submit peer reviews for other eligible players.
  - FR-36: Peer reviews update member reputation score and review count.
  - FR-37: Members can review venues by facilities, lighting, floor, transport, and optional short comment.
  - FR-38: Public venue pages expose aggregate venue quality signals.
- **Constraints & NFRs:** A reviewer can review each peer once per session and cannot review themselves. A member can submit one venue review per session.

### 3.2 Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Payment fails mid-transaction (e.g., card declined) | Spot is NOT reserved. Member sees "Payment failed — please try again or use a different card." Session capacity unchanged. |
| Two members try to take the last spot simultaneously | Optimistic locking on capacity count. First successful payment gets the spot; second receives "Sorry, this session just filled up." |
| Club leader cancels a session after members have paid | All paid members receive automatic refunds. Notification sent: "Session on [date] has been cancelled. Your refund of NT$[amount] is being processed." Refund completes within 5–7 business days. |
| Club leader dissolves a club with future sessions | All future sessions cancelled first (triggering refunds), then all members notified, then club marked as dissolved. Dissolved clubs are hidden from discovery but data retained for 90 days. |
| Member tries to join a session they already joined | System prevents duplicate join. Message: "You're already registered for this session." |
| Full session has an active waitlist | Eligible members can join the waitlist. When a leader removes a participant, the oldest active waitlist entry is promoted and notified. |
| User applies to a club they're already a member of | Application is blocked. Message: "You're already a member of this club." |
| Invite link is expired, revoked, or exhausted | Public invite preview is blocked and authenticated join/apply action is rejected. |
| Member submits a board post | Leaders can approve, reject, or pin. Authors can see their own pending/rejected submissions. |
| User tries to review themselves or duplicate a review | Review is rejected by validation and database constraints. |
| Club leader removes themselves from their own club | Not allowed. Club leader must transfer ownership or dissolve the club. |
| Session time has passed but club leader never marked it complete | System auto-closes sessions 2 hours after scheduled end time. |
| Empty state: Club has no upcoming sessions | Member sees: "No upcoming sessions yet. Stay tuned — your club leader will post new sessions soon!" |
| Empty state: Discovery page has no clubs | Visitor sees: "No clubs available yet. Want to start one?" with a CTA to create a club. |
| User uploads an invalid image for profile/club | Reject with message: "Please upload a JPG or PNG image under 5MB." |
| Refund fails (gateway error) | Log the failure, alert the club leader and platform admin. Retry automatically up to 3 times over 24 hours. |

### 3.3 Analytics & Telemetry Requirements

| Event Name | Trigger | Properties | Purpose |
|------------|---------|------------|---------|
| `club_created` | Club leader creates a new club | `club_id`, `leader_id`, `timestamp` | Track supply-side growth |
| `session_created` | Club leader publishes a new session | `session_id`, `club_id`, `capacity`, `fee`, `scheduled_at` | Measure session supply and pricing patterns |
| `session_join_click` | Member taps "Join Session" | `session_id`, `user_id`, `source` (feed/notification/direct) | Measure top-of-funnel engagement |
| `payment_initiated` | Payment flow begins | `session_id`, `user_id`, `amount`, `method` | Track payment funnel entry |
| `payment_success` | Payment confirmed | `session_id`, `user_id`, `amount`, `method`, `duration_ms` | Track revenue, conversion, and payment UX performance |
| `payment_failed` | Payment fails | `session_id`, `user_id`, `error_code`, `method` | Diagnose payment drop-off |
| `session_cancelled` | Club leader cancels session | `session_id`, `club_id`, `participants_affected`, `refund_total` | Track operational reliability |
| `membership_applied` | User applies to join a club | `club_id`, `user_id`, `source` | Measure discovery-to-application conversion |
| `membership_approved` | Club leader approves application | `club_id`, `user_id`, `time_to_approve_hours` | Track onboarding speed |
| `signup_completed` | New user finishes registration | `user_id`, `method` (email/google/line), `duration_seconds` | Measure activation funnel |
| `profile_completed` | User fills in all profile fields | `user_id`, `skill_level`, `has_photo` | Track profile completeness |
| `board_post_submitted` | Member submits a board post | `club_id`, `user_id`, `kind`, `importance` | Measure club board usage |
| `board_post_published` | Leader publishes or approves a post | `club_id`, `post_id`, `kind`, `importance` | Track operational communication |
| `board_reaction_added` | Member reacts to a board post | `club_id`, `post_id`, `emoji` | Measure engagement quality |
| `waitlist_joined` | Member joins a session waitlist | `session_id`, `user_id`, `position` | Measure unmet demand |
| `waitlist_promoted` | Waitlisted member receives a spot | `session_id`, `user_id`, `wait_minutes` | Track waitlist effectiveness |

### 3.4 Post-MVP Features (P1/P2)
The current implementation has already pulled waitlist auto-promotion, searchable skill/location discovery, basic club analytics, and the internal club board into the MVP surface. The remaining roadmap should focus on replacing offline-debt mode with real gateway settlement and adding deeper automation.

- **LINE Pay integration:** Add LINE Pay as a payment method alongside credit cards — P1
- **Push notifications:** Real-time push for new sessions, booking confirmations, and reminders — P1
- **Session cancellation by member:** Members can cancel before a configurable deadline with automatic refund — P1
- **Advanced analytics dashboard:** Revenue, cohorts, utilization, and member growth beyond the current basic club analytics — P1
- **Recurring sessions:** Club leader can set up weekly/biweekly recurring sessions — P2
- **Multi-language UI:** Full English UI for expat players — P2
- **In-app chat per session:** Lightweight chat for session-specific coordination — P2

---

## 4. Constraints

### Performance
| Requirement | Target |
|-------------|--------|
| Page load time (first contentful paint) | < 2s on 4G connection |
| API response time (p95) | < 500ms |
| Join + payment-record creation | < 10s |
| Real-time roster update | < 5s after state change |
| Concurrent users (MVP) | Support 500 simultaneous |

### Security
| Requirement | Details |
|-------------|---------|
| Authentication | OAuth 2.0 + JWT tokens (access token: 1hr, refresh token: 7 days) |
| Password storage | bcrypt with cost factor ≥ 12 |
| Data encryption | AES-256 at rest, TLS 1.3 in transit |
| Payment data | PCI-DSS compliant — tokenization only, no raw card storage |
| Rate limiting | 100 requests/min per authenticated user, 20/min for unauthenticated |
| Session fixation | Regenerate session ID on login |

### Privacy & Compliance
- **Applicable regulations:** Taiwan's Personal Data Protection Act (PDPA); if serving foreign nationals, GDPR awareness recommended but not strictly required for MVP.
- **PII handling:** Phone numbers and email addresses encrypted at rest. User real names never exposed publicly without consent — display names used instead. Payment details handled entirely by the payment gateway (never stored on PickleMaster servers).
- **Data retention:** User data retained while account is active. Deleted 30 days after account deactivation request. Dissolved club data retained for 90 days for dispute resolution, then purged.
- **Consent requirements:** Explicit opt-in for marketing/promotional communications. Terms of service and privacy policy acceptance required at signup.
- **Data residency:** All user data stored in a data center within the Asia-Pacific region (Taiwan or nearest available).

### Localization & Accessibility
- **Languages:** Primary: zh-TW (Traditional Chinese). Secondary: en-US (English — P2 for full UI, MVP supports en-US for user-generated content input).
- **Accessibility:** WCAG 2.1 AA compliance for core user flows (session joining, payment, profile management). High-contrast text, touch targets ≥ 44px.

---

## 5. Technical Implementation (Reference)

> **Note:** This section is a reference for engineering, not a mandate. Engineers often prefer to design the schema and architecture themselves based on the requirements above. Treat this as "Proposed — Reference Only."

> **MVP Philosophy:** Development speed is the primary constraint. Choose tools that let a small team ship in days, not weeks. Prefer managed services that eliminate configuration overhead.

### Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js (App Router) | Full-stack framework with SSR, API routes, and built-in routing. Excellent developer experience for rapid iteration. |
| UI Framework | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built accessible components. Fast to style without custom CSS overhead. |
| Backend | Next.js API Routes + Supabase Edge Functions | Eliminates a separate backend service. API routes handle CRUD; Edge Functions handle webhooks and async jobs. |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime + Storage) | Managed Postgres with built-in auth (supports LINE OAuth), real-time subscriptions for roster updates, and file storage for images — all in one service. |
| Payments | TapPay or NewebPay | Taiwan-native payment gateways with credit card tokenization, refund APIs, and TWD settlement. TapPay has better developer docs; NewebPay has wider merchant adoption. |
| Hosting | Vercel | Zero-config CI/CD with preview deployments. Shipping is a git push. Edge network for fast loading in Taiwan. |
| Notifications | Supabase Edge Functions + LINE Notify (P1) | MVP: email via Supabase. P1: LINE Notify for push notifications to LINE users. |

### System Architecture Overview
The application is a server-rendered Next.js app deployed on Vercel. All data is stored in Supabase's managed PostgreSQL instance, with Row-Level Security (RLS) policies enforcing access control at the database level. Authentication is handled by Supabase Auth, supporting email/password, Google OAuth, and LINE Login. Payment processing is fully delegated to TapPay/NewebPay — the platform receives webhook callbacks on payment success/failure and updates session rosters accordingly. Real-time roster updates use Supabase Realtime subscriptions so members see live capacity changes without polling. Static assets (club images, profile photos) are stored in Supabase Storage with a CDN layer.

### API & Third-Party Integrations
| Integration | Purpose | Notes |
|-------------|---------|-------|
| TapPay / NewebPay | Credit card payment processing | Sandbox available for testing. Tokenization-only integration (no raw card data). |
| LINE Login | Social authentication for Taiwan users | OAuth 2.0 provider via Supabase Auth. Requires LINE Developer account. |
| Google OAuth | Social authentication (secondary) | Standard OpenID Connect flow via Supabase Auth. |
| LINE Notify (P1) | Push notifications to LINE users | Free API. Requires user to link their LINE account. |
| Supabase Realtime | Live roster & session updates | WebSocket-based. Included in Supabase plan. |

### Key Technical Decisions & Trade-offs
- **Supabase over custom backend:** Trades architectural flexibility for massive speed-to-ship. RLS policies handle authorization at the DB layer, eliminating the need for a middleware auth layer. Trade-off: vendor lock-in and less control over query optimization.
- **Server-side rendering over SPA:** Better SEO for club discovery pages and faster initial load. Trade-off: slightly more complex state management for real-time features.
- **Taiwan-native payment gateway over Stripe:** Stripe's Taiwan support is limited and settlement in TWD is not straightforward. TapPay/NewebPay are purpose-built for the local market. Trade-off: smaller developer community and less polished documentation.
- **No mobile app for MVP:** A responsive web app is sufficient for MVP validation. Building native apps doubles development time without proving product-market fit first. Trade-off: no push notifications (until LINE Notify P1) and slightly worse mobile UX.

---

## 6. Strategy & Success

### Strategic Assumptions

| # | Assumption | How to Test | Invalidation Signal |
|---|-----------|-------------|---------------------|
| 1 | Club leaders will adopt a SaaS tool to replace LINE groups and spreadsheets | Onboard 3 existing club leaders to the demo club's workflow and measure admin time reduction | < 30% reduction in self-reported admin time after 4 weeks |
| 2 | Members will pay online for sessions instead of cash/bank transfer | Track payment completion rate for the first 50 session bookings | < 60% of join-clicks result in successful payment |
| 3 | A branded club experience commands higher retention than informal groups | Compare 4-week retention of the PickleMaster demo club vs. baseline (informal LINE groups) | Demo club retention is not measurably higher than informal group baseline (~40%) |
| 4 | Newcomers will discover and apply to clubs through the platform | Track organic applications (non-referral) to demo club over 4 weeks | < 5 organic applications in 4 weeks |
| 5 | The core session-join-pay flow can be completed in under 60 seconds | Time 10 users completing the flow in usability testing | Average completion time > 120 seconds |

### Pivot Triggers
If after 8 weeks of operating the demonstration club, weekly active session participants plateau below 15 people despite marketing efforts, or if fewer than 50% of members who join a session complete the payment flow online (preferring to pay cash/transfer instead), we should pause feature development and conduct deep-dive user interviews. These signals would indicate that either the core value proposition (automated club operations) doesn't resonate, or the payment UX has a fundamental friction problem that no amount of feature-building will solve.

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Club leader admin time reduction | ≥ 50% (self-reported) | Pre/post survey after 4 weeks of platform use |
| Session fill rate | ≥ 80% of published session capacity | `session_created` capacity vs. `payment_success` count |
| Payment conversion (join-click → paid) | ≥ 70% | `session_join_click` → `payment_success` funnel |
| Member activation (signup → first session joined) | ≥ 60% within first 7 days | `signup_completed` → `payment_success` cohort analysis |
| Week-4 retention (members who attend ≥1 session in week 4) | ≥ 40% | Cohort analysis from `payment_success` events |
| Newcomer application-to-approval rate | ≥ 80% | `membership_applied` → `membership_approved` funnel |
| NPS (Net Promoter Score) | ≥ 40 | In-app survey after 3rd session attended |

### Rollout Plan

| Phase | Audience | Goal | Duration |
|-------|----------|------|----------|
| Alpha | Internal team + 5 trusted club leaders | Validate core flow (create session → join → pay). Catch critical bugs. | 2 weeks |
| Beta (Demo Club) | 1 self-operated demonstration club (30–50 members) | Prove the model: automated payments, fill rate, retention. Collect qualitative feedback. | 6 weeks |
| Early Access | 3–5 external club leaders (invited) | Test multi-tenant SaaS: can independent leaders run their clubs effectively? Identify onboarding friction. | 4 weeks |
| Public Launch | Open registration for club leaders in Taipei metro area | Scale supply side. Target: 10+ active clubs within 4 weeks of launch. | Ongoing |
