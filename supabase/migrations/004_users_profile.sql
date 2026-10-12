-- Align users table with Supabase Auth ids

alter table users alter column google_id drop not null;
