-- Run this once in the SQL Editor of an already-deployed Supabase project
-- that was set up before this fix. New projects get this automatically
-- from the updated supabase/schema.sql.
--
-- Fixes: podcasts/episodes you add successfully appear to vanish — browse
-- and detail pages silently return empty because they join against
-- podcast_stats / episode_stats, and those views never got SELECT granted
-- to the anon/authenticated roles.

grant select on public.podcast_stats to anon, authenticated;
grant select on public.episode_stats to anon, authenticated;
