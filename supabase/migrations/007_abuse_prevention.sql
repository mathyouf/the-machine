-- Additional abuse prevention measures

-- Limit sessions per user per day
create or replace function check_user_session_limit()
returns trigger
language plpgsql
as $$
declare
  v_session_count int;
begin
  -- Count active sessions for this user in the last 24 hours
  select count(*) into v_session_count
  from session_slots
  where (optimizer_id = NEW.optimizer_id or scroller_id = NEW.scroller_id)
    and created_at > now() - interval '24 hours'
    and status not in ('abandoned', 'completed');

  if v_session_count >= 10 then
    raise exception 'Session limit exceeded. Maximum 10 active sessions per 24 hours.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_session_limit on session_slots;
create trigger enforce_session_limit
  before insert on session_slots
  for each row
  execute function check_user_session_limit();

-- Add created_at index for better performance on session limit checks
create index if not exists idx_session_slots_created_at on session_slots(created_at);

-- Prevent rapid session creation (must wait 30 seconds between sessions)
create or replace function check_session_cooldown()
returns trigger
language plpgsql
as $$
declare
  v_last_session_time timestamptz;
begin
  -- Check last session creation time for this user
  select max(created_at) into v_last_session_time
  from session_slots
  where optimizer_id = NEW.optimizer_id or scroller_id = NEW.scroller_id;

  if v_last_session_time is not null and v_last_session_time > now() - interval '30 seconds' then
    raise exception 'Please wait 30 seconds before creating another session.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_session_cooldown on session_slots;
create trigger enforce_session_cooldown
  before insert on session_slots
  for each row
  execute function check_session_cooldown();

-- Add a table to track reported abuse
create table if not exists abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references users(id) not null,
  reported_user_id uuid references users(id),
  session_id uuid references session_slots(id),
  reason text not null check (char_length(reason) between 10 and 500),
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz default now()
);

alter table abuse_reports enable row level security;

-- Users can report abuse
create policy "Users can create abuse reports" on abuse_reports
  for insert with check (auth.uid() = reporter_id);

-- Users can read their own reports
create policy "Users can read own reports" on abuse_reports
  for select using (auth.uid() = reporter_id);

-- Add index for preventing spam reporting (enforced at application level)
create index if not exists idx_abuse_reports_user_session on abuse_reports(reporter_id, session_id, created_at desc);

-- Add index for admin queries
create index if not exists idx_abuse_reports_status on abuse_reports(status, created_at desc);
