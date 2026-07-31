import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PodcastCard from '@/components/PodcastCard';

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

export default async function FriendAddedPodcasts({ followingIds }: { followingIds: string[] }) {
  const supabase = createClient();

  if (followingIds.length === 0) {
    return (
      <section className="mt-8">
        <p className="text-sm text-slate">
          You&rsquo;re not following anyone yet —{' '}
          <Link href="/friends/find" className="text-cream hover:text-amber">
            find friends
          </Link>
          .
        </p>
      </section>
    );
  }

  const { data } = await supabase
    .from('podcasts')
    .select('id, slug, title, cover_url, host_names, profiles!podcasts_added_by_fkey(username, display_name)')
    .in('added_by', followingIds)
    .order('created_at', { ascending: false })
    .limit(30);
  const addedPodcasts = data ?? [];
  const statsById = await getStatsById(
    supabase,
    addedPodcasts.map((p: any) => p.id)
  );

  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
        Recently added by friends
      </h2>
      {addedPodcasts.length === 0 ? (
        <p className="mt-3 text-sm text-slate">No one you follow has added a podcast yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {addedPodcasts.map((p: any) => (
            <div key={p.id}>
              <PodcastCard
                slug={p.slug}
                title={p.title}
                coverUrl={p.cover_url}
                hostNames={p.host_names}
                averageRating={statsById[p.id]?.average_rating}
                ratingCount={statsById[p.id]?.rating_count}
              />
              <p className="mt-1 text-xs text-slate">added by {p.profiles?.display_name || p.profiles?.username}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
