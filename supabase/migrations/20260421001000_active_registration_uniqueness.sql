drop index if exists idx_session_regs_session_user;

create unique index if not exists idx_session_regs_active_session_user
  on session_registrations(session_id, user_id)
  where status in ('payment_pending', 'confirmed');
