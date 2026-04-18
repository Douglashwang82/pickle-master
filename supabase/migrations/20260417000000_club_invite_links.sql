-- ============================================================
-- CLUB INVITE LINKS
-- ============================================================
create table if not exists club_invite_links (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  token text unique not null,
  created_by uuid not null references users(id) on delete cascade,
  expires_at timestamptz,
  max_uses int,
  use_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_invite_links_token on club_invite_links(token);
create index if not exists idx_invite_links_club_id on club_invite_links(club_id);

-- RLS
alter table club_invite_links enable row level security;

-- Leaders can read invite links for their clubs
drop policy if exists "invite_links_select_leader" on club_invite_links;
create policy "invite_links_select_leader" on club_invite_links
  for select using (is_club_leader(club_id));

-- Anyone can read active, non-expired invite links by token
-- (needed for the public invite page — handled via supabaseAdmin in API)

-- Leaders can insert invite links
drop policy if exists "invite_links_insert_leader" on club_invite_links;
create policy "invite_links_insert_leader" on club_invite_links
  for insert with check (is_club_leader(club_id));

-- Leaders can update (deactivate) invite links for their clubs
drop policy if exists "invite_links_update_leader" on club_invite_links;
create policy "invite_links_update_leader" on club_invite_links
  for update using (is_club_leader(club_id));
