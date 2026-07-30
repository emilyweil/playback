-- Run once in the SQL Editor of an already-deployed Supabase project.
-- New projects get this automatically from the updated supabase/schema.sql.
alter table public.profiles add column if not exists location text;
