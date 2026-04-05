-- ============================================================
-- EXPENSES
-- Records a payment made by one person on behalf of a group.
-- ============================================================
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  submitted_by_user_id uuid not null references users(id) on delete cascade,
  payer_name text not null,
  total_amount_twd integer not null check (total_amount_twd > 0),
  description text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- EXPENSE SPLITS
-- Each row = one participant's share of an expense.
-- The participant_name is a free-text label (no user account required).
-- ============================================================
create table if not exists expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  participant_name text not null,
  amount_owed_twd integer not null check (amount_owed_twd > 0)
);

-- Indexes
create index if not exists expense_splits_expense_id_idx on expense_splits(expense_id);
create index if not exists expenses_submitted_by_idx on expenses(submitted_by_user_id);
create index if not exists expenses_created_at_idx on expenses(created_at desc);
