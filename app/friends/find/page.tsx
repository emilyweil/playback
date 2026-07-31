import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FollowButton from '@/components/FollowButton';

export default async function FindFriendsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const q = searchParams.q?.trim();

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-cream">Sign in to find friends</h1>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  let results: { id: string; username: string; display_name: string | null; bio: string | null }[] = [];
  if (q && q.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq('id', user.id)
      .limit(20);
    results = data ?? [];
  }

  const followingSet = new Set<string>();
  const blockedSet = new Set<string>();
  if (results.length > 0) {
    const resultIds = results.map((r) => r.id);
    const [{ data: followRows }, { data: blocksAsBlocker }, { data: blocksAsBlocked }] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', resultIds),
      supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id).in('blocked_id', resultIds),
      supabase.from('blocks').select('blocker_id').eq('blocked_id', user.id).in('blocker_id', resultIds),
    ]);
    for (const f of followRows ?? []) followingSet.add(f.following_id);
    for (const b of blocksAsBlocker ?? []) blockedSet.add(b.blocked_id);
    for (const b of blocksAsBlocked ?? []) blockedSet.add(b.blocker_id);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cream">Find friends</h1>
      <p className="mt-1 text-sm text-slate">Search by username to follow other listeners.</p>

      <form className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search usernames…"
          className="input w-full max-w-md"
        />
      </form>

      {q && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-sm text-slate">No one found matching &ldquo;{q}&rdquo;.</p>
          ) : (
            <ul className="divide-y divide-line rounded border border-line bg-surface px-5">
              {results.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-4">
                  <Link href={`/u/${r.username}`} className="min-w-0">
                    <p className="font-display text-sm font-medium text-cream hover:text-amber">
                      {r.display_name || r.username}
                    </p>
                    <p className="text-xs text-slate">@{r.username}</p>
                  </Link>
                  {!blockedSet.has(r.id) && (
                    <FollowButton viewerId={user.id} targetId={r.id} initiallyFollowing={followingSet.has(r.id)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
