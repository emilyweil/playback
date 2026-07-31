import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PodcastTile from '@/components/PodcastTile';

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
      {addedPodcasts.length === 0 ? (
        <p className="mt-3 text-sm text-slate">No one you follow has added a podcast yet.</p>
      ) : (
        <div className="mt-4 flex gap-5 overflow-x-auto pb-2">
          {addedPodcasts.map((p: any) => (
            <PodcastTile
              key={p.id}
              slug={p.slug}
              title={p.title}
              coverUrl={p.cover_url}
              averageRating={statsById[p.id]?.average_rating}
              ratingCount={statsById[p.id]?.rating_count}
              caption={`added by ${p.profiles?.display_name || p.profiles?.username}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
