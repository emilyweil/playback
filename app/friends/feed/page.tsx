import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PodcastCard from '@/components/PodcastCard';
import FollowButton from '@/components/FollowButton';

export default async function FriendFeedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-cream">Sign in to see your Friend Feed</h1>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  const { data: followingProfiles } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(id, username, display_name)')
    .eq('follower_id', user.id);

  const following = (followingProfiles ?? [])
    .map((f: any) => f.profiles)
    .filter(Boolean);
  const followingIds = following.map((p: any) => p.id);

  let addedPodcasts: any[] = [];
  if (followingIds.length > 0) {
    const { data } = await supabase
      .from('podcasts')
      .select('id, slug, title, cover_url, host_names, created_at, profiles!podcasts_added_by_fkey(username, display_name)')
      .in('added_by', followingIds)
      .order('created_at', { ascending: false })
      .limit(30);
    addedPodcasts = data ?? [];
  }

  let everyonePodcasts: any[] = [];
  if (followingIds.length === 0) {
    const { data } = await supabase
      .from('podcasts')
      .select('id, slug, title, cover_url, host_names')
      .order('created_at', { ascending: false })
      .limit(12);
    everyonePodcasts = data ?? [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cream">Friend feed</h1>
      <p className="mt-1 text-sm text-slate">Recent activity from people you follow.</p>

      {followingIds.length === 0 ? (
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
      ) : (
        <section className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
            Recently added by friends
          </h2>
          {addedPodcasts.length === 0 ? (
            <p className="mt-3 text-sm text-slate">No one you follow has added a podcast yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {addedPodcasts.map((p) => (
                <div key={p.id}>
                  <PodcastCard slug={p.slug} title={p.title} coverUrl={p.cover_url} hostNames={p.host_names} />
                  <p className="mt-1 text-xs text-slate">
                    added by {p.profiles?.display_name || p.profiles?.username}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
          People you follow ({following.length})
        </h2>
        {following.length === 0 ? (
          <p className="mt-3 text-sm text-slate">
            You&rsquo;re not following anyone yet.{' '}
            <Link href="/friends/find" className="text-cream hover:text-amber">
              Find friends
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded border border-line bg-surface px-5">
            {following.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/u/${p.username}`} className="text-sm text-cream hover:text-amber">
                  {p.display_name || p.username}
                </Link>
                <FollowButton viewerId={user.id} targetId={p.id} initiallyFollowing={true} followingLabel="Unfollow" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
