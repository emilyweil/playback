-- Wipes all app data so you can test signup/add-podcast flows from scratch.
-- Run in the Supabase SQL Editor. Safe to run repeatedly.
--
-- This does NOT drop any tables or change your schema — it only deletes rows.

-- Cascades to episodes, reviews, podcast_statuses, podcast_genres, and any
-- list_items referencing a podcast or episode.
truncate table public.podcasts restart identity cascade;

-- Cascades to profiles (and from there to follows, lists, review_likes,
-- review_comments, and any remaining podcast_statuses/reviews).
delete from auth.users;
