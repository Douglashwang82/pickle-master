-- ============================================================
-- CLUB BOARD
-- ============================================================
create table if not exists club_board_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  author_user_id uuid not null references users(id) on delete cascade,
  reviewed_by uuid references users(id) on delete set null,
  kind text not null default 'note'
    check (kind in ('announcement', 'note')),
  title text,
  body text not null,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'published', 'rejected', 'archived')),
  importance text not null default 'normal'
    check (importance in ('normal', 'important')),
  is_pinned boolean not null default false,
  rejection_reason text,
  published_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint club_board_posts_title_length
    check (title is null or char_length(title) <= 120),
  constraint club_board_posts_body_length
    check (char_length(body) between 1 and 1000),
  constraint club_board_posts_rejection_reason_length
    check (rejection_reason is null or char_length(rejection_reason) <= 300)
);

create index if not exists idx_club_board_posts_club_status
  on club_board_posts(club_id, status, created_at desc);
create index if not exists idx_club_board_posts_club_published
  on club_board_posts(club_id, is_pinned desc, published_at desc nulls last, created_at desc);

create table if not exists club_board_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references club_board_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  emoji text not null
    check (emoji in ('👍', '🎉', '👏', '🔥')),
  created_at timestamptz not null default now(),

  constraint uq_club_board_reaction unique (post_id, user_id, emoji)
);

create index if not exists idx_club_board_reactions_post_id
  on club_board_reactions(post_id);

alter table club_board_posts enable row level security;
alter table club_board_reactions enable row level security;

drop policy if exists "club_board_posts_select_member_or_author" on club_board_posts;
create policy "club_board_posts_select_member_or_author" on club_board_posts
  for select using (
    (status = 'published' and is_club_member(club_id))
    or author_user_id = get_app_user_id()
    or is_club_leader(club_id)
  );

drop policy if exists "club_board_posts_insert_member" on club_board_posts;
create policy "club_board_posts_insert_member" on club_board_posts
  for insert with check (
    auth.uid() is not null
    and author_user_id = get_app_user_id()
    and is_club_member(club_id)
  );

drop policy if exists "club_board_posts_update_leader" on club_board_posts;
create policy "club_board_posts_update_leader" on club_board_posts
  for update using (is_club_leader(club_id));

drop policy if exists "club_board_reactions_select_member" on club_board_reactions;
create policy "club_board_reactions_select_member" on club_board_reactions
  for select using (
    exists (
      select 1
      from club_board_posts post
      where post.id = club_board_reactions.post_id
        and post.status = 'published'
        and is_club_member(post.club_id)
    )
  );

drop policy if exists "club_board_reactions_insert_member" on club_board_reactions;
create policy "club_board_reactions_insert_member" on club_board_reactions
  for insert with check (
    user_id = get_app_user_id()
    and exists (
      select 1
      from club_board_posts post
      where post.id = club_board_reactions.post_id
        and post.status = 'published'
        and is_club_member(post.club_id)
    )
  );

drop policy if exists "club_board_reactions_delete_own" on club_board_reactions;
create policy "club_board_reactions_delete_own" on club_board_reactions
  for delete using (user_id = get_app_user_id());