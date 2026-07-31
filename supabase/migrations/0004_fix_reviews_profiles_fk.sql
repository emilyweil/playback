-- Fixes: "Could not embed because more than one relationship was found for
-- 'reviews' and 'profiles'". This happens when there are two (or more)
-- foreign key constraints between reviews.user_id and profiles.id in the
-- live database — PostgREST can't tell which one to use for the embed.
--
-- Run this once in the SQL Editor. Safe to re-run.

-- See what's actually there first, if you're curious:
-- select conname from pg_constraint
-- where conrelid = 'public.reviews'::regclass
--   and confrelid = 'public.profiles'::regclass
--   and contype = 'f';

do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and confrelid = 'public.profiles'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.reviews drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.reviews
  add constraint reviews_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
