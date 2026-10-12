-- THE MACHINE — Initial Database Schema
-- Run this in Supabase SQL Editor or via CLI migrations

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  google_id text unique not null,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now()
);

-- Session slots (scheduled)
create table if not exists session_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  optimizer_id uuid references users(id),
  scroller_id uuid references users(id),
  status text default 'open'
    check (status in ('open','matched','lobby','active','reveal','call','completed','abandoned')),
  created_at timestamptz default now()
);

-- Video corpus
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  title text,
  duration_seconds int,
  dim_communal float default 0,
  dim_aesthetic float default 0,
  dim_dark float default 0,
  dim_thrilling float default 0,
  dim_cerebral float default 0,
  attr_pace text check (attr_pace in ('slow','medium','fast')),
  attr_valence text check (attr_valence in ('warm','neutral','dark')),
  attr_complexity text check (attr_complexity in ('simple','moderate','complex')),
  attr_social_density text check (attr_social_density in ('solo','small_group','crowd')),
  attr_novelty text check (attr_novelty in ('familiar','moderate','strange')),
  attr_production text check (attr_production in ('raw','moderate','polished')),
  diag_openness float default 0.5,
  diag_conscientiousness float default 0.5,
  diag_extraversion float default 0.5,
  diag_agreeableness float default 0.5,
  diag_neuroticism float default 0.5,
  added_at timestamptz default now()
);

-- Scroll events (the raw behavioral signal)
create table if not exists scroll_events (
  id bigint generated always as identity primary key,
  session_id uuid references session_slots(id) not null,
  video_id uuid references videos(id) not null,
  dwell_ms int not null,
  scroll_velocity float,
  queued_by text default 'system'
    check (queued_by in ('system','optimizer')),
  timestamp_ms bigint not null,
  info_gain float,
  cumulative_info float
);

-- Optimizer text cards
create table if not exists text_cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references session_slots(id) not null,
  content text not null check (char_length(content) <= 140),
  sent_at_ms bigint not null,
  sent_at timestamptz default now()
);

-- Session summary (computed at session end)
create table if not exists session_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references session_slots(id) unique not null,
  duration_seconds int not null,
  total_videos_shown int not null,
  optimizer_videos_shown int not null,
  system_videos_shown int not null,
  avg_dwell_optimizer_ms float,
  avg_dwell_system_ms float,
  engagement_multiplier float,
  total_info_gain float,
  dimensions_explored int,
  exploration_entropy float,
  optimizer_score float not null,
  final_feature_vector jsonb not null,
  final_umap_coords jsonb not null,
  scroller_accepted_call boolean,
  optimizer_accepted_call boolean,
  call_duration_seconds int,
  created_at timestamptz default now()
);

-- Field reports (post-reveal)
create table if not exists field_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references session_slots(id) not null,
  user_id uuid references users(id) not null,
  role text not null check (role in ('optimizer','scroller')),
  content text not null check (char_length(content) <= 2000),
  share_consent boolean default false,
  created_at timestamptz default now()
);

-- Leaderboard (materialized view)
create materialized view if not exists leaderboard as
select
  u.id as user_id,
  u.display_name,
  count(ss.id) as sessions_played,
  max(ss.optimizer_score) as best_score,
  avg(ss.optimizer_score) as avg_score,
  avg(ss.duration_seconds) as avg_retention_seconds,
  avg(ss.total_info_gain) as avg_info_gain
from users u
join session_summaries ss on ss.session_id in (
  select id from session_slots where optimizer_id = u.id and status = 'completed'
)
group by u.id, u.display_name
order by max(ss.optimizer_score) desc;

-- Indexes for performance
create index if not exists idx_scroll_events_session on scroll_events(session_id);
create index if not exists idx_scroll_events_video on scroll_events(video_id);
create index if not exists idx_text_cards_session on text_cards(session_id);
create index if not exists idx_session_slots_status on session_slots(status);
create index if not exists idx_session_slots_optimizer on session_slots(optimizer_id);
create index if not exists idx_session_slots_scroller on session_slots(scroller_id);
create index if not exists idx_videos_dimensions on videos(dim_communal, dim_aesthetic, dim_dark, dim_thrilling, dim_cerebral);

-- Row Level Security policies
alter table users enable row level security;
alter table session_slots enable row level security;
alter table videos enable row level security;
alter table scroll_events enable row level security;
alter table text_cards enable row level security;
alter table session_summaries enable row level security;
alter table field_reports enable row level security;

-- Videos are readable by everyone
create policy "Videos are publicly readable" on videos for select using (true);

-- Users can read their own data
create policy "Users can read own data" on users for select using (auth.uid() = id);
create policy "Users can update own data" on users for update using (auth.uid() = id);

-- Session slots readable by participants
create policy "Session slots readable by participants" on session_slots
  for select using (
    auth.uid() = optimizer_id or auth.uid() = scroller_id or status = 'open'
  );

-- Scroll events readable by session participants
create policy "Scroll events readable by session participants" on scroll_events
  for select using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );

-- Text cards readable by session participants
create policy "Text cards readable by session participants" on text_cards
  for select using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );

-- Session summaries readable by session participants
create policy "Summaries readable by session participants" on session_summaries
  for select using (
    session_id in (
      select id from session_slots
      where optimizer_id = auth.uid() or scroller_id = auth.uid()
    )
  );

-- Field reports: users can read/write their own
create policy "Users can read own field reports" on field_reports
  for select using (auth.uid() = user_id);
create policy "Users can insert own field reports" on field_reports
  for insert with check (auth.uid() = user_id);

-- Enable Realtime for key tables
alter publication supabase_realtime add table session_slots;
alter publication supabase_realtime add table scroll_events;
alter publication supabase_realtime add table text_cards;
