import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FriendAddedPodcasts from '@/components/FriendAddedPodcasts';

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

  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);
  const followingIds = (followingRows ?? []).map((f) => f.following_id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cream">Friend feed</h1>
      <FriendAddedPodcasts followingIds={followingIds} />
    </div>
  );
}
