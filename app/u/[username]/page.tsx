import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DiaryEntryCard from '@/components/DiaryEntryCard';
import FollowButton from '@/components/FollowButton';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single();

  if (!profile) notFound();

  const [{ count: followerCount }, { count: followingCount }, { data: reviews }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase
      .from('reviews')
      .select(
        'id, rating, body, listened_at, created_at, episode_id, podcasts(title, slug, cover_url), episodes(title, episode_number, season_number, podcasts(title, slug, cover_url))'
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const isOwner = user?.id === profile.id;

  let alreadyFollowing = false;
  let isBlocked = false;
  if (user && user.id !== profile.id) {
    const [{ data: followRow }, { data: blockRow }] = await Promise.all([
      supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .maybeSingle(),
      supabase
        .from('blocks')
        .select('blocker_id')
        .or(
          `and(blocker_id.eq.${user.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${user.id})`
        )
        .maybeSingle(),
    ]);
    alreadyFollowing = Boolean(followRow);
    isBlocked = Boolean(blockRow);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-raised">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xl text-slate">
                {(profile.display_name || profile.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-cream">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-slate">@{profile.username}</p>
            {isOwner && (
              <Link href="/profile/edit" className="text-xs text-slate hover:text-amber">
                Edit profile
              </Link>
            )}
            {profile.bio && <p className="mt-3 max-w-xl text-cream/85">{profile.bio}</p>}
            {profile.location && <p className="mt-1 text-sm text-slate">📍 {profile.location}</p>}
            <div className="mt-3 flex gap-4 font-mono text-xs text-slate">
              <span>{followerCount ?? 0} followers</span>
              <span>{followingCount ?? 0} following</span>
            </div>
          </div>
        </div>
        {!isBlocked && (
          <FollowButton viewerId={user?.id ?? null} targetId={profile.id} initiallyFollowing={alreadyFollowing} />
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">Diary</h2>
        {!reviews || reviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No activity yet.</p>
        ) : (
          <div className="mt-4 rounded bg-surface px-5">
            {reviews.map((r: any) => (
              <DiaryEntryCard key={r.id} entry={r} isOwner={isOwner} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
