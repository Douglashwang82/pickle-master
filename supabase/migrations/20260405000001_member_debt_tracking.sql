-- Member Debt Tracking Migration
-- Adds: debt_notified_at to payment_transactions

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Track when a leader last sent a payment reminder for this transaction
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE payment_transactions
  ADD COLUMN debt_notified_at TIMESTAMPTZ;
