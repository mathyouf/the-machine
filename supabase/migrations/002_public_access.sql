-- Public policies for demo-mode access (no auth)

-- Allow public read access for core tables
create policy "Public read users" on users for select using (true);
create policy "Public read session slots" on session_slots for select using (true);
create policy "Public read scroll events" on scroll_events for select using (true);
create policy "Public read text cards" on text_cards for select using (true);
create policy "Public read session summaries" on session_summaries for select using (true);
create policy "Public read field reports" on field_reports for select using (true);

-- Allow public inserts for demo sessions
create policy "Public insert users" on users for insert with check (true);
create policy "Public insert session slots" on session_slots for insert with check (true);
create policy "Public update session slots" on session_slots for update using (true);
create policy "Public insert scroll events" on scroll_events for insert with check (true);
create policy "Public insert text cards" on text_cards for insert with check (true);
create policy "Public insert session summaries" on session_summaries for insert with check (true);
create policy "Public insert field reports" on field_reports for insert with check (true);

-- Allow leaderboard reads
grant select on leaderboard to anon, authenticated;
