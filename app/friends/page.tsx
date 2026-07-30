import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FollowButton from '@/components/FollowButton';

export default async function FriendsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-cream">Sign in to see your friends</h1>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
    supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, display_name)')
      .eq('follower_id', user.id),
    supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, display_name)')
      .eq('following_id', user.id),
  ]);

  const following = (followingRows ?? []).map((f: any) => f.profiles).filter(Boolean);
  const followingIdSet = new Set(following.map((p: any) => p.id));
  const followers = (followerRows ?? []).map((f: any) => f.profiles).filter(Boolean);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cream">Friends</h1>

      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
          Following ({following.length})
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

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
          Followers ({followers.length})
        </h2>
        {followers.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No one follows you yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded border border-line bg-surface px-5">
            {followers.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/u/${p.username}`} className="text-sm text-cream hover:text-amber">
                  {p.display_name || p.username}
                </Link>
                <FollowButton viewerId={user.id} targetId={p.id} initiallyFollowing={followingIdSet.has(p.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
