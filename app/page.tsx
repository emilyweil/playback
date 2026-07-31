import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ReviewCard from '@/components/ReviewCard';
import RatingStars from '@/components/RatingStars';
import PodcastTile from '@/components/PodcastTile';
import FriendAddedPodcasts from '@/components/FriendAddedPodcasts';

const REVIEW_SELECT = `
  id, rating, body, contains_spoilers, is_relisten, listened_at, created_at, episode_id,
  profiles!reviews_user_id_fkey ( username, display_name ),
  podcasts ( title, slug ),
  episodes ( title, episode_number, season_number, podcasts ( title, slug ) )
`;

async function getRecentlyReviewedPodcasts(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, body, created_at, profiles!reviews_user_id_fkey(username, display_name), podcasts(title, slug, cover_url)')
    .not('podcast_id', 'is', null)
    .not('body', 'is', null)
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

async function getRecentlyAddedPodcasts(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from('podcasts')
    .select('id, slug, title, cover_url, host_names')
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

async function getStatsById(supabase: ReturnType<typeof createClient>, podcastIds: string[]) {
  const statsById: Record<string, { average_rating: number | null; rating_count: number }> = {};
  if (podcastIds.length === 0) return statsById;
  const { data } = await supabase
    .from('podcast_stats')
    .select('podcast_id, average_rating, rating_count')
    .in('podcast_id', podcastIds);
  for (const s of data ?? []) statsById[s.podcast_id] = s;
  return statsById;
}

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select(REVIEW_SELECT)
      .order('created_at', { ascending: false })
      .limit(8);
    const recentlyReviewed = await getRecentlyReviewedPodcasts(supabase);

    return (
      <div>
        <Hero />
        <RecentlyReviewed items={recentlyReviewed} />
        {recentReviews && recentReviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
              Recently logged
            </h2>
            <div className="mt-4 rounded border border-line bg-surface px-5">
              {recentReviews.map((r: any) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Signed in
  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);
  const followingIds = (followingRows ?? []).map((f) => f.following_id);

  const recentlyReviewed = await getRecentlyReviewedPodcasts(supabase);
  const recentlyAdded = await getRecentlyAddedPodcasts(supabase);

  const q = searchParams.q?.trim();
  let browseQuery = supabase
    .from('podcasts')
    .select('id, slug, title, cover_url, host_names')
    .order('created_at', { ascending: false })
    .limit(24);
  if (q) browseQuery = browseQuery.ilike('title', `%${q}%`);
  const { data: browsePodcasts } = await browseQuery;

  const recentlyAddedStats = await getStatsById(
    supabase,
    recentlyAdded.map((p) => p.id)
  );
  const browseStats = await getStatsById(
    supabase,
    (browsePodcasts ?? []).map((p) => p.id)
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cream">Friend feed</h1>
      <FriendAddedPodcasts followingIds={followingIds} />

      <RecentlyAdded items={recentlyAdded} statsById={recentlyAddedStats} />
      <RecentlyReviewed items={recentlyReviewed} />
      <BrowseAll items={browsePodcasts ?? []} statsById={browseStats} q={q} />
    </div>
  );
}

function BrowseAll({ items, statsById, q }: { items: any[]; statsById: Record<string, any>; q?: string }) {
  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold text-cream">Browse all podcasts</h2>

      <form className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="input w-full max-w-md"
        />
      </form>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-slate">{q ? `No podcasts matching "${q}".` : 'No podcasts yet.'}</p>
      ) : (
        <div className="mt-6 flex gap-5 overflow-x-auto pb-2">
          {items.map((p) => (
            <PodcastTile
              key={p.id}
              slug={p.slug}
              title={p.title}
              coverUrl={p.cover_url}
              averageRating={statsById[p.id]?.average_rating}
              ratingCount={statsById[p.id]?.rating_count}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecentlyAdded({ items, statsById }: { items: any[]; statsById: Record<string, any> }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-cream">Recently added podcasts from everyone</h2>
        <Link href="/podcasts/new" className="btn-secondary text-sm">
          + Add a podcast
        </Link>
      </div>
      <div className="mt-4 flex gap-5 overflow-x-auto pb-2">
        {items.map((p) => (
          <PodcastTile
            key={p.id}
            slug={p.slug}
            title={p.title}
            coverUrl={p.cover_url}
            averageRating={statsById[p.id]?.average_rating}
            ratingCount={statsById[p.id]?.rating_count}
          />
        ))}
      </div>
    </section>
  );
}

function RecentlyReviewed({ items }: { items: any[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold text-cream">Recently reviewed podcasts</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((r) => (
          <Link
            key={r.id}
            href={`/podcasts/${r.podcasts?.slug}`}
            className="flex gap-3 rounded border border-line bg-surface p-4 transition-colors hover:border-amber"
          >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-raised">
              {r.podcasts?.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.podcasts.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-lg text-slate">
                  {r.podcasts?.title?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-sm font-medium text-cream">{r.podcasts?.title}</h3>
                <RatingStars rating={r.rating} size="sm" />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-cream/80">{r.body}</p>
              <p className="mt-1 text-xs text-slate">— {r.profiles?.display_name || r.profiles?.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Hero() {
  // Wide, slow bars in the back; a denser, faster row up front — reads like
  // a scrubber paused mid-episode rather than a generic audio-visualizer.
  const back = Array.from({ length: 28 }, (_, i) => ({
    h: 0.2 + Math.abs(Math.sin(i * 0.9)) * 0.8,
    dur: 2.6 + (i % 5) * 0.3,
    delay: (i % 7) * 0.15,
  }));

  return (
    <section className="relative overflow-hidden rounded border border-line bg-surface">
      <div className="absolute inset-0 flex items-end justify-center gap-[3px] px-6 pb-0 opacity-40">
        {back.map((b, i) => (
          <span
            key={i}
            className="wave-bar w-full max-w-[6px] rounded-t-sm bg-amber"
            style={{
              height: `${b.h * 100}%`,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-gradient-to-t from-surface via-surface/85 to-surface/20 px-8 py-20 text-center">
        <h1 className="mx-auto max-w-xl font-display text-2xl font-semibold leading-tight text-cream sm:text-3xl">
          <span className="whitespace-nowrap">Track podcasts you&rsquo;ve listened to.</span>
          <br />
          Save those you want to hear.
          <br />
          Tell your friends what&rsquo;s good.
        </h1>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="rounded bg-amber px-5 py-2.5 font-medium text-ink hover:bg-amber/90">
            Get started — it&rsquo;s free!
          </Link>
          <Link
            href="/podcasts"
            className="rounded border border-line px-5 py-2.5 text-cream hover:border-amber"
          >
            Browse podcasts
          </Link>
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-wide2 text-signal">
          The social network for podcast lovers.
        </p>
      </div>
    </section>
  );
}
