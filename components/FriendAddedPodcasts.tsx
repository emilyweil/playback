import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PodcastCard from '@/components/PodcastCard';

export default async function FriendAddedPodcasts({ followingIds }: { followingIds: string[] }) {
  const supabase = createClient();

  if (followingIds.length === 0) {
    const { data } = await supabase
      .from('podcasts')
      .select('id, slug, title, cover_url, host_names')
      .order('created_at', { ascending: false })
      .limit(12);
    const everyonePodcasts = data ?? [];

    return (
      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
          Recently added podcasts from everyone
        </h2>
        <p className="mt-2 text-sm text-slate">
          You&rsquo;re not following anyone yet —{' '}
          <Link href="/friends/find" className="text-cream hover:text-amber">
            find friends
          </Link>{' '}
          to see what they&rsquo;ve added here instead.
        </p>
        {everyonePodcasts.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {everyonePodcasts.map((p) => (
              <PodcastCard key={p.id} slug={p.slug} title={p.title} coverUrl={p.cover_url} hostNames={p.host_names} />
            ))}
          </div>
        )}
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
              <PodcastCard slug={p.slug} title={p.title} coverUrl={p.cover_url} hostNames={p.host_names} />
              <p className="mt-1 text-xs text-slate">added by {p.profiles?.display_name || p.profiles?.username}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
