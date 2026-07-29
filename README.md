# Playback

A social site for podcasts — like Goodreads for books or Letterboxd for movies,
but for podcasts and episodes. Log what you listen to, rate and review shows
and individual episodes, follow other listeners, build lists.

Built with **Next.js (App Router)** + **Supabase** (Postgres, Auth, Storage),
deployed on **Vercel**.

## Features

- Email/password auth (Supabase Auth), profile auto-created on signup
- Crowdsourced podcast + episode catalog — any signed-in user can add one
- Reviews double as diary/log entries: rating, written review, listen date,
  spoiler flag, re-listen flag — works on both podcasts and episodes
- Signature rating UI: a 5-bar waveform instead of stars
- Follow other listeners; home feed shows their recent activity
- Personal "shelf" per podcast: want to listen / listening / completed / dropped
- Public profile pages with diary, follower/following counts, lists
- Curated lists (public or private), Letterboxd-style

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.
   This creates every table, view, RLS policy, storage bucket, and the trigger
   that auto-creates a `profiles` row on signup.
3. In **Authentication > Providers**, email auth is on by default. Turn off
   "Confirm email" under **Authentication > Settings** if you want instant
   sign-in during local testing (leave it on for production).
4. Copy your **Project URL** and **anon public key** from
   **Project Settings > API**.

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the two Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run locally

```
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 4. Deploy to Vercel

```
npm i -g vercel
vercel
```

Or connect the repo in the Vercel dashboard. Either way, add the same two
environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
under **Project Settings > Environment Variables** in Vercel before your first
production deploy.

## Project structure

```
app/                     Next.js App Router pages
  page.tsx                 home / activity feed
  login/, signup/           auth
  podcasts/                 browse, add, [slug] detail, add episode
  episodes/[id]/             episode detail
  u/[username]/               public profile
  lists/                    browse, new, [id] detail
components/              shared UI (RatingWaveform, ReviewForm, PodcastCard, ...)
lib/supabase/            client/server Supabase helpers + hand-written types
supabase/schema.sql       full database schema — tables, RLS, triggers, storage
middleware.ts            refreshes the Supabase auth session cookie
```

## Notes / next steps

- `lib/supabase/types.ts` is hand-written to match `schema.sql`. Once your
  project is live you can replace it with a generated file:
  `supabase gen types typescript --project-id <id> > lib/supabase/types.ts`
- Podcast/episode data entry is fully manual (crowdsourced) by design — there's
  no external podcast-directory import wired up. That'd be a natural next
  feature (e.g. pulling metadata from an RSS URL on podcast creation).
- Comments and likes on reviews have tables + RLS policies ready in
  `schema.sql` but no UI wired up yet — a good first extension.
