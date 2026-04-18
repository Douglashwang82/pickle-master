create table if not exists session_waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'promoted', 'left')),
  joined_at timestamptz not null default now(),
  promoted_at timestamptz,
  left_at timestamptz,
  promoted_registration_id uuid references session_registrations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_session_waitlist_active_user
  on session_waitlist_entries(session_id, user_id)
  where status = 'active';

create index if not exists idx_session_waitlist_session_status_joined
  on session_waitlist_entries(session_id, status, joined_at);

alter table session_waitlist_entries enable row level security;

drop policy if exists "waitlist_select" on session_waitlist_entries;
create policy "waitlist_select" on session_waitlist_entries
  for select using (
    user_id = get_app_user_id()
    or exists (
      select 1
      from sessions s
      where s.id = session_waitlist_entries.session_id
        and is_club_leader(s.club_id)
    )
  );
