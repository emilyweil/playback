'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function FollowButton({
  viewerId,
  targetId,
  initiallyFollowing,
  followingLabel = 'Following',
}: {
  viewerId: string | null;
  targetId: string;
  initiallyFollowing: boolean;
  followingLabel?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);

  if (!viewerId || viewerId === targetId) return null;

  async function toggle() {
    setLoading(true);
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert({ follower_id: viewerId, following_id: targetId });
    }
    setFollowing(!following);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={following ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
    >
      {following ? followingLabel : 'Follow'}
    </button>
  );
}
