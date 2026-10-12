-- Replace demo public policies with authenticated policies

-- Drop demo policies if they exist
drop policy if exists "Public read users" on users;
drop policy if exists "Public read session slots" on session_slots;
drop policy if exists "Public read scroll events" on scroll_events;
drop policy if exists "Public read text cards" on text_cards;
drop policy if exists "Public read session summaries" on session_summaries;
drop policy if exists "Public read field reports" on field_reports;
drop policy if exists "Public insert users" on users;
drop policy if exists "Public insert session slots" on session_slots;
drop policy if exists "Public update session slots" on session_slots;
drop policy if exists "Public insert scroll events" on scroll_events;
drop policy if exists "Public insert text cards" on text_cards;
drop policy if exists "Public insert session summaries" on session_summaries;
drop policy if exists "Public insert field reports" on field_reports;

-- Users: only self
drop policy if exists "Users can read own data" on users;
drop policy if exists "Users can update own data" on users;
create policy "Users can read own data" on users
  for select using (auth.uid() = id);
create policy "Users can insert own data" on users
  for insert with check (auth.uid() = id);
create policy "Users can update own data" on users
  for update using (auth.uid() = id);

-- Session slots: participants + open sessions
create policy "Session slots readable by participants" on session_slots
  for select using (
    status = 'open' or auth.uid() = optimizer_id or auth.uid() = scroller_id
  );
create policy "Session slots insert by participant" on session_slots
  for insert with check (
    auth.uid() = optimizer_id or auth.uid() = scroller_id
  );
create policy "Session slots update by participant" on session_slots
  for update using (
    auth.uid() = optimizer_id or auth.uid() = scroller_id
  );

-- Scroll events: participants only
create policy "Scroll events readable by participants" on scroll_events
  for select using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );
create policy "Scroll events insert by participants" on scroll_events
  for insert with check (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );

-- Text cards: participants only
create policy "Text cards readable by participants" on text_cards
  for select using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );
create policy "Text cards insert by participants" on text_cards
  for insert with check (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );

-- Session summaries: participants only
create policy "Summaries readable by participants" on session_summaries
  for select using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );
create policy "Summaries insert by participants" on session_summaries
  for insert with check (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );
create policy "Summaries update by participants" on session_summaries
  for update using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );

-- Field reports: participants only
create policy "Field reports readable by participants" on field_reports
  for select using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );
create policy "Field reports insert by participants" on field_reports
  for insert with check (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );

-- Leaderboard read access
grant select on leaderboard to anon, authenticated;
