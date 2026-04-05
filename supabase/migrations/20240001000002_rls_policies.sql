-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table users enable row level security;
alter table profiles enable row level security;
alter table clubs enable row level security;
alter table club_memberships enable row level security;
alter table membership_applications enable row level security;
alter table sessions enable row level security;
alter table session_registrations enable row level security;
alter table payment_transactions enable row level security;
alter table refund_transactions enable row level security;
alter table notifications enable row level security;
alter table analytics_events enable row level security;

-- Helper: get the app user id from auth.uid()
-- auth.uid() returns the Supabase auth UUID; we map it to users.id via auth_provider_user_id
create or replace function get_app_user_id()
returns uuid language sql stable security definer as $$
  select id from users where auth_provider_user_id = auth.uid()::text limit 1;
$$;

-- Helper: check if current user is a leader of a given club
create or replace function is_club_leader(p_club_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from club_memberships
    where club_id = p_club_id
      and user_id = get_app_user_id()
      and role = 'leader'
      and status = 'active'
  );
$$;

-- Helper: check if current user is an active member of a given club
create or replace function is_club_member(p_club_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from club_memberships
    where club_id = p_club_id
      and user_id = get_app_user_id()
      and status = 'active'
  );
$$;

-- ============================================================
-- USERS
-- ============================================================
drop policy if exists "users_select_self" on users;
create policy "users_select_self" on users
  for select using (auth_provider_user_id = auth.uid()::text);

drop policy if exists "users_update_self" on users;
create policy "users_update_self" on users
  for update using (auth_provider_user_id = auth.uid()::text);

drop policy if exists "users_insert_self" on users;
create policy "users_insert_self" on users
  for insert with check (auth_provider_user_id = auth.uid()::text);

-- ============================================================
-- PROFILES
-- ============================================================
drop policy if exists "profiles_select_co_member" on profiles;
create policy "profiles_select_co_member" on profiles
  for select using (
    user_id = get_app_user_id()
    or exists (
      select 1 from club_memberships cm1
      join club_memberships cm2 on cm1.club_id = cm2.club_id
      where cm1.user_id = get_app_user_id()
        and cm2.user_id = profiles.user_id
        and cm1.status = 'active'
        and cm2.status = 'active'
    )
  );

drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self" on profiles
  for update using (user_id = get_app_user_id());

drop policy if exists "profiles_insert_self" on profiles;
create policy "profiles_insert_self" on profiles
  for insert with check (user_id = get_app_user_id());

-- ============================================================
-- CLUBS
-- ============================================================
drop policy if exists "clubs_select_public_or_member" on clubs;
create policy "clubs_select_public_or_member" on clubs
  for select using (
    public_status = 'public'
    or is_club_member(id)
  );

drop policy if exists "clubs_insert_authenticated" on clubs;
create policy "clubs_insert_authenticated" on clubs
  for insert with check (
    auth.uid() is not null
    and owner_user_id = get_app_user_id()
  );

drop policy if exists "clubs_update_leader" on clubs;
create policy "clubs_update_leader" on clubs
  for update using (is_club_leader(id));

-- ============================================================
-- CLUB MEMBERSHIPS
-- ============================================================
drop policy if exists "memberships_select_club_member" on club_memberships;
create policy "memberships_select_club_member" on club_memberships
  for select using (is_club_member(club_id) or user_id = get_app_user_id());

drop policy if exists "memberships_insert_leader" on club_memberships;
create policy "memberships_insert_leader" on club_memberships
  for insert with check (is_club_leader(club_id) or user_id = get_app_user_id());

drop policy if exists "memberships_update_leader" on club_memberships;
create policy "memberships_update_leader" on club_memberships
  for update using (is_club_leader(club_id));

-- ============================================================
-- MEMBERSHIP APPLICATIONS
-- ============================================================
drop policy if exists "applications_select" on membership_applications;
create policy "applications_select" on membership_applications
  for select using (
    user_id = get_app_user_id()
    or is_club_leader(club_id)
  );

drop policy if exists "applications_insert_authenticated" on membership_applications;
create policy "applications_insert_authenticated" on membership_applications
  for insert with check (
    auth.uid() is not null
    and user_id = get_app_user_id()
  );

drop policy if exists "applications_update_leader" on membership_applications;
create policy "applications_update_leader" on membership_applications
  for update using (is_club_leader(club_id));

-- ============================================================
-- SESSIONS
-- ============================================================
drop policy if exists "sessions_select_member" on sessions;
create policy "sessions_select_member" on sessions
  for select using (
    is_club_member(club_id)
    or exists (select 1 from clubs where clubs.id = sessions.club_id and clubs.public_status = 'public')
  );

drop policy if exists "sessions_insert_leader" on sessions;
create policy "sessions_insert_leader" on sessions
  for insert with check (is_club_leader(club_id));

drop policy if exists "sessions_update_leader" on sessions;
create policy "sessions_update_leader" on sessions
  for update using (is_club_leader(club_id));

-- ============================================================
-- SESSION REGISTRATIONS
-- ============================================================
drop policy if exists "registrations_select" on session_registrations;
create policy "registrations_select" on session_registrations
  for select using (
    user_id = get_app_user_id()
    or exists (
      select 1 from sessions s
      join clubs c on c.id = s.club_id
      where s.id = session_registrations.session_id
        and is_club_leader(c.id)
    )
  );

-- Inserts happen via service role only (join route)

-- ============================================================
-- PAYMENT TRANSACTIONS — service role only for writes
-- ============================================================
drop policy if exists "payments_select_own" on payment_transactions;
create policy "payments_select_own" on payment_transactions
  for select using (payer_user_id = get_app_user_id());

-- ============================================================
-- REFUND TRANSACTIONS — service role only for writes
-- ============================================================
drop policy if exists "refunds_select_payer" on refund_transactions;
create policy "refunds_select_payer" on refund_transactions
  for select using (
    exists (
      select 1 from payment_transactions pt
      where pt.id = refund_transactions.payment_transaction_id
        and pt.payer_user_id = get_app_user_id()
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications
  for select using (user_id = get_app_user_id());

-- ============================================================
-- ANALYTICS EVENTS — insert only for authenticated users, select none via RLS
-- ============================================================
drop policy if exists "analytics_insert_authenticated" on analytics_events;
create policy "analytics_insert_authenticated" on analytics_events
  for insert with check (auth.uid() is not null);
