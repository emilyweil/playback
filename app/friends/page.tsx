import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FollowButton from '@/components/FollowButton';
import BlockButton from '@/components/BlockButton';
import Avatar from '@/components/Avatar';

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

  const [{ data: followingRows }, { data: followerRows }, { data: blockedRows }] = await Promise.all([
    supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, display_name, avatar_url)')
      .eq('follower_id', user.id),
    supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)')
      .eq('following_id', user.id),
    supabase
      .from('blocks')
      .select('blocked_id, profiles!blocks_blocked_id_fkey(id, username, display_name, avatar_url)')
      .eq('blocker_id', user.id),
  ]);

  const following = (followingRows ?? []).map((f: any) => f.profiles).filter(Boolean);

  // Followers = anyone currently following you, plus anyone you've blocked
  // (blocking removes the follow relationship, but they should stay visible
  // here with an Unblock option rather than just vanishing).
  const activeFollowers = (followerRows ?? []).map((f: any) => f.profiles).filter(Boolean);
  const blockedProfiles = (blockedRows ?? []).map((b: any) => b.profiles).filter(Boolean);
  const blockedIds = new Set(blockedProfiles.map((p: any) => p.id));

  const followerMap = new Map<string, any>();
  for (const p of activeFollowers) followerMap.set(p.id, p);
  for (const p of blockedProfiles) followerMap.set(p.id, p);
  const followers = Array.from(followerMap.values());

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
          <ul className="mt-4 divide-y divide-line rounded bg-surface px-5">
            {following.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/u/${p.username}`} className="flex min-w-0 items-center gap-3">
                  <Avatar avatarUrl={p.avatar_url} name={p.display_name || p.username} />
                  <span className="truncate text-sm text-cream hover:text-amber">
                    {p.display_name || p.username}
                  </span>
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
          <ul className="mt-4 divide-y divide-line rounded bg-surface px-5">
            {followers.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/u/${p.username}`} className="flex min-w-0 items-center gap-3">
                  <Avatar avatarUrl={p.avatar_url} name={p.display_name || p.username} />
                  <span className="truncate text-sm text-cream hover:text-amber">
                    {p.display_name || p.username}
                  </span>
                </Link>
                <BlockButton viewerId={user.id} targetId={p.id} initiallyBlocked={blockedIds.has(p.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
