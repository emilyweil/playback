// Hand-written types matching supabase/schema.sql.
// Once the project is deployed you can replace this file with a generated
// one via: `supabase gen types typescript --project-id <id> > lib/supabase/types.ts`

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Podcast = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  rss_url: string | null;
  website_url: string | null;
  host_names: string | null;
  added_by: string | null;
  created_at: string;
};

export type Episode = {
  id: string;
  podcast_id: string;
  title: string;
  season_number: number | null;
  episode_number: number | null;
  description: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  added_by: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  podcast_id: string | null;
  episode_id: string | null;
  rating: number | null;
  body: string | null;
  contains_spoilers: boolean;
  is_relisten: boolean;
  listened_at: string;
  created_at: string;
  updated_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type PodcastStatus = {
  user_id: string;
  podcast_id: string;
  status: 'want_to_listen' | 'listening' | 'completed' | 'dropped';
  created_at: string;
  updated_at: string;
};

export type List = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
};

export type ListItem = {
  id: string;
  list_id: string;
  podcast_id: string | null;
  episode_id: string | null;
  position: number;
  note: string | null;
  created_at: string;
};

export type PodcastStats = {
  podcast_id: string;
  rating_count: number;
  average_rating: number | null;
  log_count: number;
};

export type EpisodeStats = {
  episode_id: string;
  rating_count: number;
  average_rating: number | null;
  log_count: number;
};

// Loosely-typed row shapes — good enough for typing component props and
// query results by hand. Once the project is deployed you can generate a
// real Database type and re-introduce it as the supabase-js client generic:
//   supabase gen types typescript --project-id <id> > lib/supabase/types.ts
