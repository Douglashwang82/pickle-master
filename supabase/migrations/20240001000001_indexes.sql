-- Clubs
create unique index if not exists idx_clubs_slug on clubs(slug);

-- Club memberships
create unique index if not exists idx_club_memberships_club_user on club_memberships(club_id, user_id);
create index if not exists idx_club_memberships_user on club_memberships(user_id);

-- Membership applications
create index if not exists idx_membership_apps_club_status on membership_applications(club_id, status);
create index if not exists idx_membership_apps_club_user on membership_applications(club_id, user_id);

-- Sessions
create index if not exists idx_sessions_club_start on sessions(club_id, scheduled_start_at);
create index if not exists idx_sessions_status_start on sessions(status, scheduled_start_at);

-- Session registrations
create unique index if not exists idx_session_regs_session_user on session_registrations(session_id, user_id);
create index if not exists idx_session_regs_session_status on session_registrations(session_id, status);
create index if not exists idx_session_regs_hold_expiry on session_registrations(booking_hold_expires_at)
  where status = 'payment_pending';

-- Payment transactions
create unique index if not exists idx_payment_tx_registration on payment_transactions(registration_id);
create unique index if not exists idx_payment_tx_gateway_id on payment_transactions(gateway_payment_id)
  where gateway_payment_id is not null;

-- Notifications
create index if not exists idx_notifications_user_status on notifications(user_id, status, send_at);
