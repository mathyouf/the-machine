-- Server-side rate limiting via RLS policies
-- Limits: 10 text cards per minute per session, 120 scroll events per minute per session

-- Text cards: max 10 per session per minute
drop policy if exists "Text cards insert by participants" on text_cards;
create policy "Text cards insert by participants (rate limited)" on text_cards
  for insert with check (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
    and char_length(content) between 1 and 140
    and (
      select count(*) from text_cards tc
      where tc.session_id = text_cards.session_id
        and tc.sent_at > now() - interval '1 minute'
    ) < 10
  );

-- Scroll events: max 120 per session per minute
drop policy if exists "Scroll events insert by participants" on scroll_events;
create policy "Scroll events insert by participants (rate limited)" on scroll_events
  for insert with check (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
    and (
      select count(*) from scroll_events se
      where se.session_id = scroll_events.session_id
        and se.timestamp_ms > (extract(epoch from now()) * 1000 - 60000)::bigint
    ) < 120
  );

-- Validate field report length on insert
drop policy if exists "Field reports insert by participants" on field_reports;
create policy "Field reports insert by participants (validated)" on field_reports
  for insert with check (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
    and auth.uid() = user_id
    and char_length(content) between 1 and 2000
  );
