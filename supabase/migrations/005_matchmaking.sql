-- Matchmaking RPC: bypasses RLS to allow joining open sessions
-- Uses SECURITY DEFINER to run with table-owner privileges

create or replace function find_or_create_session(p_role text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_slot session_slots%rowtype;
  v_opposite_col text;
  v_my_col text;
  v_new_id uuid;
begin
  -- Get the calling user's ID
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Determine column names based on role
  if p_role = 'scroller' then
    v_my_col := 'scroller_id';
    v_opposite_col := 'optimizer_id';
  elsif p_role = 'optimizer' then
    v_my_col := 'optimizer_id';
    v_opposite_col := 'scroller_id';
  else
    raise exception 'Invalid role: %', p_role;
  end if;

  -- Step 1: Look for an open session created <10min ago where the OPPOSITE role
  -- is filled and MY role is null. Lock the row to prevent race conditions.
  if p_role = 'scroller' then
    select * into v_slot
    from session_slots
    where status = 'open'
      and optimizer_id is not null
      and scroller_id is null
      and created_at > now() - interval '10 minutes'
    order by created_at asc
    limit 1
    for update skip locked;
  else
    select * into v_slot
    from session_slots
    where status = 'open'
      and scroller_id is not null
      and optimizer_id is null
      and created_at > now() - interval '10 minutes'
    order by created_at asc
    limit 1
    for update skip locked;
  end if;

  -- Step 2: If found, assign my user ID and set status to 'matched'
  if v_slot.id is not null then
    if p_role = 'scroller' then
      update session_slots
      set scroller_id = v_user_id, status = 'matched'
      where id = v_slot.id;
    else
      update session_slots
      set optimizer_id = v_user_id, status = 'matched'
      where id = v_slot.id;
    end if;

    -- Re-fetch the updated row
    select * into v_slot from session_slots where id = v_slot.id;

    return json_build_object(
      'session_id', v_slot.id,
      'status', v_slot.status,
      'optimizer_id', v_slot.optimizer_id,
      'scroller_id', v_slot.scroller_id,
      'matched', true
    );
  end if;

  -- Step 3: No open session found \u2014 create a new one
  v_new_id := gen_random_uuid();

  if p_role = 'scroller' then
    insert into session_slots (id, starts_at, scroller_id, status)
    values (v_new_id, now(), v_user_id, 'open');
  else
    insert into session_slots (id, starts_at, optimizer_id, status)
    values (v_new_id, now(), v_user_id, 'open');
  end if;

  select * into v_slot from session_slots where id = v_new_id;

  return json_build_object(
    'session_id', v_slot.id,
    'status', v_slot.status,
    'optimizer_id', v_slot.optimizer_id,
    'scroller_id', v_slot.scroller_id,
    'matched', false
  );
end;
$$;

-- Grant execute to authenticated users
grant execute on function find_or_create_session(text) to authenticated;

-- Also add a realtime publication for session_summaries so we can watch opt-in changes
alter publication supabase_realtime add table session_summaries;
