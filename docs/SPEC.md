# PickleMaster — Specification

> Single source of truth for implementation. Full details in `mvp-system-design-v-1-0-0.md` and `prd-v-1-0-0.md`.

## Tech Stack
- Next.js 16 (App Router, TypeScript strict)
- Tailwind CSS + shadcn/ui (`@/components/ui`)
- Supabase (PostgreSQL + Auth + Realtime + Storage)
- Payment: **mocked** for MVP (replace `src/lib/payment/client.ts` for TapPay)
- Vercel deployment

## Domain Model
12 tables: users, profiles, clubs, club_memberships, membership_applications, sessions, session_registrations, session_waitlist_entries, payment_transactions, refund_transactions, notifications, analytics_events

## MVP Slices
1. Foundation — auth, profiles, club CRUD, public discovery
2. Membership — apply/approve/reject, roster
3. Sessions — CRUD, feed, realtime roster, FIFO waitlist auto-promotion
4. Payments — mocked join flow, booking holds
5. Reliability — refunds, reminders, cron jobs, analytics

## Out of Scope (MVP)
TapPay real integration, LINE Pay, LINE Login, push notifications, member self-cancel, recurring sessions, multi-language UI.
