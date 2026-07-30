-- ============================================================================
-- PLAYBACK — social site for podcasts (Goodreads/Letterboxd, but for podcasts)
-- Supabase / Postgres schema
-- ============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh
-- project. Safe to re-run top-to-bottom on an empty schema.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- 1. PROFILES
-- One row per auth.users row. Created automatically on signup (trigger below).
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  location text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint username_format check (username ~ '^[a-z0-9_]{3,30}$');

-- Auto-create a profile row whenever someone signs up.
-- Username defaults from metadata passed at signup, falling back to a
-- generated handle; the app should let the user change it afterwards if
-- there's a collision.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));
  if base_username is null or length(base_username) < 3 then
    base_username := 'listener';
  end if;
  final_username := base_username;
  loop
    exit when not exists (select 1 from public.profiles where username = final_username);
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, coalesce(new.raw_user_meta_data ->> 'display_name', base_username));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 2. PODCASTS  (crowdsourced — any signed-in user can add one)
-- ============================================================================

create table public.podcasts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_url text,
  rss_url text,
  website_url text,
  host_names text,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create extension if not exists pg_trgm;
create index podcasts_added_by_idx on public.podcasts (added_by);
create index podcasts_title_trgm_idx on public.podcasts using gin (title gin_trgm_ops);

-- ============================================================================
-- 3. EPISODES (crowdsourced, belong to a podcast)
-- ============================================================================

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  podcast_id uuid not null references public.podcasts (id) on delete cascade,
  title text not null,
  season_number int,
  episode_number int,
  description text,
  audio_url text,
  duration_seconds int,
  published_at date,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index episodes_podcast_id_idx on public.episodes (podcast_id);
create index episodes_added_by_idx on public.episodes (added_by);

-- ============================================================================
-- 4. GENRES  (simple tagging, many-to-many with podcasts)
-- ============================================================================

create table public.genres (
  id serial primary key,
  name text not null unique
);

create table public.podcast_genres (
  podcast_id uuid not null references public.podcasts (id) on delete cascade,
  genre_id int not null references public.genres (id) on delete cascade,
  primary key (podcast_id, genre_id)
);

insert into public.genres (name) values
  ('Comedy'), ('True Crime'), ('News'), ('Society & Culture'), ('Technology'),
  ('Business'), ('Health & Fitness'), ('Science'), ('History'), ('Sports'),
  ('Fiction'), ('Education'), ('Arts'), ('Music'), ('Politics')
on conflict do nothing;

-- ============================================================================
-- 5. REVIEWS  (doubles as a diary/log entry, like Letterboxd — a review can
-- carry just a listen date, just a rating, just text, or all three. Attaches
-- to exactly one of a podcast or a specific episode.)
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  podcast_id uuid references public.podcasts (id) on delete cascade,
  episode_id uuid references public.episodes (id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  body text,
  contains_spoilers boolean not null default false,
  is_relisten boolean not null default false,
  listened_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_target_check check (
    (podcast_id is not null and episode_id is null) or
    (podcast_id is null and episode_id is not null)
  )
);

create index reviews_user_id_idx on public.reviews (user_id);
create index reviews_podcast_id_idx on public.reviews (podcast_id);
create index reviews_episode_id_idx on public.reviews (episode_id);
create index reviews_created_at_idx on public.reviews (created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- 6. FOLLOWS
-- ============================================================================

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

-- ============================================================================
-- 6b. BLOCKS
-- ============================================================================

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create index blocks_blocked_id_idx on public.blocks (blocked_id);

-- Blocking someone immediately removes any existing follow relationship
-- between the two of you, in either direction.
create or replace function public.handle_new_block()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;

create trigger on_block_created
  after insert on public.blocks
  for each row execute procedure public.handle_new_block();

-- ============================================================================
-- 7. REVIEW LIKES + COMMENTS
-- ============================================================================

create table public.review_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_id uuid not null references public.reviews (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index review_comments_review_id_idx on public.review_comments (review_id);

-- ============================================================================
-- 8. PODCAST STATUSES  (a listener's shelf: want to listen / listening / etc)
-- ============================================================================

create table public.podcast_statuses (
  user_id uuid not null references public.profiles (id) on delete cascade,
  podcast_id uuid not null references public.podcasts (id) on delete cascade,
  status text not null check (status in ('want_to_listen', 'listening', 'completed', 'dropped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, podcast_id)
);

create trigger podcast_statuses_set_updated_at
  before update on public.podcast_statuses
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- 9. LISTS + LIST ITEMS  (Letterboxd-style curated lists)
-- ============================================================================

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  podcast_id uuid references public.podcasts (id) on delete cascade,
  episode_id uuid references public.episodes (id) on delete cascade,
  position int not null default 0,
  note text,
  created_at timestamptz not null default now(),
  constraint list_items_target_check check (
    (podcast_id is not null and episode_id is null) or
    (podcast_id is null and episode_id is not null)
  )
);

create index list_items_list_id_idx on public.list_items (list_id);

-- ============================================================================
-- 10. AGGREGATE VIEWS (average ratings + counts, computed on read)
-- ============================================================================

create view public.podcast_stats as
select
  p.id as podcast_id,
  count(r.*) filter (where r.rating is not null) as rating_count,
  avg(r.rating) filter (where r.rating is not null) as average_rating,
  count(r.*) as log_count
from public.podcasts p
left join public.reviews r on r.podcast_id = p.id
group by p.id;

create view public.episode_stats as
select
  e.id as episode_id,
  count(r.*) filter (where r.rating is not null) as rating_count,
  avg(r.rating) filter (where r.rating is not null) as average_rating,
  count(r.*) as log_count
from public.episodes e
left join public.reviews r on r.episode_id = e.id
group by e.id;

-- Views don't reliably inherit Supabase's default role grants the way
-- ordinary tables do — without this, any query joining against these views
-- (e.g. the podcast/episode browse and detail pages) fails silently for the
-- anon/authenticated roles even though RLS on the underlying tables is fine.
grant select on public.podcast_stats to anon, authenticated;
grant select on public.episode_stats to anon, authenticated;

-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.podcasts enable row level security;
alter table public.episodes enable row level security;
alter table public.genres enable row level security;
alter table public.podcast_genres enable row level security;
alter table public.reviews enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;
alter table public.podcast_statuses enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- profiles: public read, self write
create policy "profiles are publicly readable" on public.profiles
  for select using (true);
create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- podcasts: public read, any signed-in user can add, only the adder can edit/delete
create policy "podcasts are publicly readable" on public.podcasts
  for select using (true);
create policy "signed-in users can add podcasts" on public.podcasts
  for insert with check (auth.uid() is not null and auth.uid() = added_by);
create policy "adders can update their podcasts" on public.podcasts
  for update using (auth.uid() = added_by);
create policy "adders can delete their podcasts" on public.podcasts
  for delete using (auth.uid() = added_by);

-- episodes: same pattern
create policy "episodes are publicly readable" on public.episodes
  for select using (true);
create policy "signed-in users can add episodes" on public.episodes
  for insert with check (auth.uid() is not null and auth.uid() = added_by);
create policy "adders can update their episodes" on public.episodes
  for update using (auth.uid() = added_by);
create policy "adders can delete their episodes" on public.episodes
  for delete using (auth.uid() = added_by);

-- genres: public read, any signed-in user can propose a new tag
create policy "genres are publicly readable" on public.genres
  for select using (true);
create policy "signed-in users can add genres" on public.genres
  for insert with check (auth.uid() is not null);

create policy "podcast_genres are publicly readable" on public.podcast_genres
  for select using (true);
create policy "signed-in users can tag podcasts" on public.podcast_genres
  for insert with check (auth.uid() is not null);
create policy "signed-in users can untag podcasts" on public.podcast_genres
  for delete using (auth.uid() is not null);

-- reviews: public read (app can hide spoilers client-side), owner write
create policy "reviews are publicly readable" on public.reviews
  for select using (true);
create policy "users can create their own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "users can update their own reviews" on public.reviews
  for update using (auth.uid() = user_id);
create policy "users can delete their own reviews" on public.reviews
  for delete using (auth.uid() = user_id);

-- follows: public read, only the follower can create/remove their own edge
create policy "follows are publicly readable" on public.follows
  for select using (true);
create policy "users can follow as themselves" on public.follows
  for insert with check (
    auth.uid() = follower_id
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = follower_id and b.blocked_id = following_id)
         or (b.blocker_id = following_id and b.blocked_id = follower_id)
    )
  );
create policy "users can unfollow as themselves" on public.follows
  for delete using (auth.uid() = follower_id);

-- blocks: only the blocker can see, create, or remove their own blocks
create policy "users can view their own blocks" on public.blocks
  for select using (auth.uid() = blocker_id);
create policy "users can create their own blocks" on public.blocks
  for insert with check (auth.uid() = blocker_id);
create policy "users can remove their own blocks" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- review_likes
create policy "review_likes are publicly readable" on public.review_likes
  for select using (true);
create policy "users can like as themselves" on public.review_likes
  for insert with check (auth.uid() = user_id);
create policy "users can unlike as themselves" on public.review_likes
  for delete using (auth.uid() = user_id);

-- review_comments
create policy "review_comments are publicly readable" on public.review_comments
  for select using (true);
create policy "users can comment as themselves" on public.review_comments
  for insert with check (auth.uid() = user_id);
create policy "users can delete their own comments" on public.review_comments
  for delete using (auth.uid() = user_id);

-- podcast_statuses: public read (so shelves are visible on profiles), owner write
create policy "podcast_statuses are publicly readable" on public.podcast_statuses
  for select using (true);
create policy "users can set their own status" on public.podcast_statuses
  for insert with check (auth.uid() = user_id);
create policy "users can update their own status" on public.podcast_statuses
  for update using (auth.uid() = user_id);
create policy "users can delete their own status" on public.podcast_statuses
  for delete using (auth.uid() = user_id);

-- lists: read own + public lists, owner write
create policy "lists are readable if public or own" on public.lists
  for select using (is_public = true or auth.uid() = user_id);
create policy "users can create their own lists" on public.lists
  for insert with check (auth.uid() = user_id);
create policy "users can update their own lists" on public.lists
  for update using (auth.uid() = user_id);
create policy "users can delete their own lists" on public.lists
  for delete using (auth.uid() = user_id);

-- list_items: readable if the parent list is readable; writable only by list owner
create policy "list_items are readable via parent list" on public.list_items
  for select using (
    exists (
      select 1 from public.lists l
      where l.id = list_items.list_id
        and (l.is_public = true or l.user_id = auth.uid())
    )
  );
create policy "list owners can add items" on public.list_items
  for insert with check (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );
create policy "list owners can update items" on public.list_items
  for update using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );
create policy "list owners can delete items" on public.list_items
  for delete using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

-- ============================================================================
-- 12. STORAGE (avatar + podcast cover uploads)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('podcast-covers', 'podcast-covers', true)
on conflict (id) do nothing;

create policy "avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "users can upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
create policy "users can update their own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and owner = auth.uid());

create policy "podcast covers are publicly accessible" on storage.objects
  for select using (bucket_id = 'podcast-covers');
create policy "signed-in users can upload podcast covers" on storage.objects
  for insert with check (bucket_id = 'podcast-covers' and auth.uid() is not null);

-- ============================================================================
-- Done. Next: set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
-- in your Vercel project env vars from Project Settings > API in Supabase.
-- ============================================================================
