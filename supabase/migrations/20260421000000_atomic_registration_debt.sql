create or replace function app_create_confirmed_registration_with_debt(
  p_session_id uuid,
  p_user_id uuid,
  p_now timestamptz default now()
)
returns table (
  registration_id uuid,
  payment_transaction_id uuid,
  new_status text,
  amount_twd integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_confirmed_count integer;
  v_registration_id uuid;
  v_payment_transaction_id uuid;
  v_platform_fee integer;
  v_new_status text;
begin
  select id, club_id, status, capacity, fee_twd
    into v_session
    from sessions
   where id = p_session_id
   for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_session.status not in ('published', 'full') then
    raise exception 'SESSION_NOT_JOINABLE';
  end if;

  if exists (
    select 1
      from session_registrations
     where session_id = p_session_id
       and user_id = p_user_id
       and status in ('confirmed', 'payment_pending')
  ) then
    raise exception 'ALREADY_REGISTERED';
  end if;

  select count(*)
    into v_confirmed_count
    from session_registrations
   where session_id = p_session_id
     and status = 'confirmed';

  if v_confirmed_count >= v_session.capacity then
    raise exception 'SESSION_FULL';
  end if;

  insert into session_registrations (
    session_id,
    user_id,
    status,
    joined_at
  )
  values (
    p_session_id,
    p_user_id,
    'confirmed',
    p_now
  )
  returning id into v_registration_id;

  v_platform_fee := round(v_session.fee_twd * 0.05)::integer;

  insert into payment_transactions (
    session_id,
    registration_id,
    club_id,
    payer_user_id,
    gateway,
    amount_twd,
    platform_fee_twd,
    net_amount_twd,
    status
  )
  values (
    p_session_id,
    v_registration_id,
    v_session.club_id,
    p_user_id,
    'manual',
    v_session.fee_twd,
    v_platform_fee,
    v_session.fee_twd - v_platform_fee,
    'initiated'
  )
  returning id into v_payment_transaction_id;

  update session_registrations
     set payment_transaction_id = v_payment_transaction_id
   where id = v_registration_id;

  v_confirmed_count := v_confirmed_count + 1;
  v_new_status := case
    when v_confirmed_count >= v_session.capacity then 'full'
    when v_session.status = 'full' then 'published'
    else v_session.status
  end;

  if v_new_status <> v_session.status then
    update sessions
       set status = v_new_status,
           updated_at = p_now
     where id = p_session_id;
  end if;

  registration_id := v_registration_id;
  payment_transaction_id := v_payment_transaction_id;
  new_status := v_new_status;
  amount_twd := v_session.fee_twd;
  return next;
end;
$$;

revoke all on function app_create_confirmed_registration_with_debt(uuid, uuid, timestamptz)
  from public, anon, authenticated;

grant execute on function app_create_confirmed_registration_with_debt(uuid, uuid, timestamptz)
  to service_role;
