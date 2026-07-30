import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReviewCard from '@/components/ReviewCard';
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
        'id, rating, body, contains_spoilers, is_relisten, listened_at, created_at, episode_id, podcasts(title, slug), episodes(title, episode_number, season_number, podcasts(title, slug))'
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  let alreadyFollowing = false;
  if (user && user.id !== profile.id) {
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle();
    alreadyFollowing = Boolean(data);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-slate">@{profile.username}</p>
          {profile.bio && <p className="mt-3 max-w-xl text-cream/85">{profile.bio}</p>}
          <div className="mt-3 flex gap-4 font-mono text-xs text-slate">
            <span>{followerCount ?? 0} followers</span>
            <span>{followingCount ?? 0} following</span>
          </div>
        </div>
        <FollowButton viewerId={user?.id ?? null} targetId={profile.id} initiallyFollowing={alreadyFollowing} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">Diary</h2>
        {!reviews || reviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No activity yet.</p>
        ) : (
          <div className="mt-4 rounded border border-line bg-surface px-5">
            {reviews.map((r: any) => (
              <ReviewCard key={r.id} review={{ ...r, profiles: profile }} showAuthor={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
