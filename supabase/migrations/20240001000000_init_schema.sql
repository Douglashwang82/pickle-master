-- ============================================================
-- USERS
-- ============================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_provider_user_id text unique not null,
  email text not null,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'deactivated'))
);

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  display_name text not null,
  photo_url text,
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro')),
  bio text,
  contact_preference text default 'email' check (contact_preference in ('email', 'line')),
  locale text not null default 'zh-TW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CLUBS
-- ============================================================
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete restrict,
  slug text unique not null,
  name text not null,
  description text,
  sport_type text not null default 'pickleball',
  cover_image_url text,
  rules text,
  public_status text not null default 'public'
    check (public_status in ('public', 'private')),
  status text not null default 'active'
    check (status in ('active', 'dissolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dissolved_at timestamptz
);

-- ============================================================
-- CLUB MEMBERSHIPS
-- ============================================================
create table if not exists club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('leader', 'member')),
  status text not null default 'active'
    check (status in ('active', 'pending', 'removed')),
  joined_at timestamptz not null default now(),
  removed_at timestamptz
);

-- ============================================================
-- MEMBERSHIP APPLICATIONS
-- ============================================================
create table if not exists membership_applications (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  intro_message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SESSIONS
-- ============================================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  title text not null,
  notes text,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  duration_minutes integer not null,
  location_name text not null,
  capacity integer not null check (capacity > 0),
  fee_twd integer not null default 0 check (fee_twd >= 0),
  currency text not null default 'TWD',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'full', 'cancelled', 'completed', 'auto_closed')),
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz
);

-- ============================================================
-- SESSION REGISTRATIONS
-- ============================================================
create table if not exists session_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'payment_pending'
    check (status in ('payment_pending', 'confirmed', 'cancelled', 'removed', 'refund_pending', 'refunded')),
  booking_hold_expires_at timestamptz,
  payment_transaction_id uuid,
  joined_at timestamptz not null default now(),
  cancelled_at timestamptz
);

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================
create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete restrict,
  registration_id uuid not null references session_registrations(id) on delete restrict,
  club_id uuid not null references clubs(id) on delete restrict,
  payer_user_id uuid not null references users(id) on delete restrict,
  gateway text not null default 'mock',
  gateway_payment_id text,
  amount_twd integer not null check (amount_twd >= 0),
  platform_fee_twd integer not null default 0,
  net_amount_twd integer not null default 0,
  status text not null default 'initiated'
    check (status in ('initiated', 'authorized', 'succeeded', 'failed', 'refund_pending', 'partially_refunded', 'refunded')),
  failure_code text,
  failure_message text,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Back-fill FK on session_registrations now that payment_transactions exists
alter table session_registrations
  add constraint session_registrations_payment_transaction_id_fkey
  foreign key (payment_transaction_id) references payment_transactions(id) on delete set null;

-- ============================================================
-- REFUND TRANSACTIONS
-- ============================================================
create table if not exists refund_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_transaction_id uuid not null references payment_transactions(id) on delete restrict,
  gateway_refund_id text,
  amount_twd integer not null check (amount_twd > 0),
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed')),
  retry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  channel text not null check (channel in ('email', 'in_app')),
  type text not null,
  payload_json jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  send_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references users(id) on delete set null,
  club_id uuid references clubs(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  properties_json jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);
