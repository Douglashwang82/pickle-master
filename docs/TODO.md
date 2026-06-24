# PickleMaster — TODO

> Last updated: 2026-04-05
> Branch: `claude/generate-todo-docs-yRIlG`

## Open Architecture Decisions (Resolve Before Coding Affected Features)

These are unresolved and block implementation of payment and billing features:

- [ ] **Payouts:** Direct to club leaders via gateway, or platform as merchant-of-record?
- [ ] **Service fees:** Global 5% platform config, or configurable per-club?
- [ ] **Session pricing:** Single flat rate only, or tiered by membership level?
- [ ] **Email provider:** Resend, SendGrid, or Supabase-native?
- [ ] **Reminder timing:** 24h before session, 2h before, or both?

---

## P0 — MVP Blockers (Must Ship Before Launch)

### Payment Gateway Integration
- [ ] Replace mock `src/lib/payment/client.ts` with real TapPay/NewebPay SDK
- [ ] Implement `initiatePayment()` with card tokenization flow
- [ ] Implement `initiateRefund()` calling real gateway refund API
- [ ] Implement TapPay webhook signature verification in `POST /api/payments/webhook`
- [ ] Implement refund webhook handler in `POST /api/refunds/webhook`
- [ ] Add idempotency key handling on all webhook events
- [ ] Handle payment gateway timeout and failure UX (user-facing error messages)
- [ ] Test all flows against TapPay/NewebPay sandbox

### Email Notifications
- [ ] Select email provider (see open decision above)
- [ ] Create `src/lib/notifications/email.ts` dispatcher
- [ ] Send booking confirmation email on successful registration
- [ ] Send refund confirmation email on refund completion
- [ ] Send application approval/rejection emails
- [ ] Send 24h session reminder (cron at `/api/cron/send-reminders` already wired)
- [ ] Handle email delivery failures gracefully (log, don't crash)

### Refund Reliability
- [ ] Implement refund retry logic (3 retries over 24h) for failed gateway calls
- [ ] Alert club leader and admin after retry limit exceeded
- [ ] Surface refund failure states in club leader dashboard

### In-App Notifications
- [ ] Add unread/read tracking to `notifications` table queries
- [ ] Build notification inbox UI component on dashboard
- [ ] Wire Supabase Realtime subscription for live notification delivery

---

## P1 — High Priority (Ship in First Iteration After Launch)

### Member Self-Cancellation
- [ ] Build `POST /api/sessions/[sessionId]/cancel-registration` endpoint
- [ ] Enforce cancellation deadline logic (no cancel within N hours of start)
- [ ] Trigger automatic refund on valid cancellation
- [ ] Add cancel button to session detail page (`src/app/(app)/sessions/[sessionId]/page.tsx`)

### Club Leader Analytics Dashboard
- [ ] Revenue summary (total collected, pending settlement, refunded)
- [ ] Session attendance trends (fill rate per session over time)
- [ ] Member growth chart (new members per week/month)
- [ ] Join-to-pay conversion funnel
- [ ] Wire all remaining analytics events into `src/lib/analytics.ts`

### Error Monitoring & Observability
- [ ] Integrate error tracking (Sentry or similar)
- [ ] Set up log aggregation for production debugging
- [ ] Alert on repeated payment webhook failures
- [ ] Alert on elevated join-to-pay dropoff rate
- [ ] Alert on email delivery failures

---

## P2 — Post-Launch Improvements

### Waitlist Automation
- [ ] Auto-promote first waitlisted member when a confirmed spot opens
- [ ] Notify promoted member with time-limited payment window
- [ ] Build waitlist position UI on session detail page

### Recurring Sessions
- [ ] Design schema for recurring session templates
- [ ] Add "repeat weekly/bi-weekly" option to session creation form
- [ ] Auto-generate upcoming instances from template

### Skill-Level Matching
- [ ] Add skill level field to user profiles
- [ ] Filter/sort session discovery by skill level
- [ ] Session creation: set required skill level range

### LINE Login & LINE Pay (Taiwan UX)
- [ ] Integrate LINE Login as an auth provider
- [ ] Add LINE Pay as payment method option in `PaymentModal`

### Testing
- [ ] Integration tests for all 28 API routes
- [ ] E2E tests for critical user journeys:
  - Signup → create club → publish session
  - Member applies → leader approves → member joins → pays
  - Member cancels → refund issued
- [ ] Payment gateway mock/stub for test environments

---

## Implementation Status by Slice

| Slice | Status | Remaining |
|-------|--------|-----------|
| Foundation (Auth, Profiles, Club CRUD) | ✅ ~90% | Harden error handling |
| Membership (Apply, Approve, Reject) | ✅ ~95% | Pending applications view |
| Sessions (Create, List, Detail, Cancel) | ✅ ~95% | Self-cancel, waitlist, recurring |
| Payments (Join → Pay → Confirm) | 🟡 ~40% | Real gateway, webhooks, refunds |
| Reliability (Cron, State Machines, Notifications) | 🟡 ~50% | Email delivery, refund retries, analytics |

---

## Known Bugs / Stubs

| File | Issue |
|------|-------|
| `src/app/api/payments/webhook/route.ts` | TODO: implement TapPay signature verification |
| `src/app/api/refunds/webhook/route.ts` | TODO: implement TapPay refund webhook handling |
| `src/lib/payment/client.ts` | Mock always returns success — cannot test failure paths |
| `src/lib/analytics.ts` | Not integrated into all event paths (profile_completed, some payment events missing) |
