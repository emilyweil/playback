'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function BlockButton({
  viewerId,
  targetId,
  initiallyBlocked = false,
}: {
  viewerId: string;
  targetId: string;
  initiallyBlocked?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (!blocked) {
      const confirmed = window.confirm(
        'Block this person? They will be unfollowed and won\u2019t be able to follow you again.'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setError(null);

    const { error } = blocked
      ? await supabase.from('blocks').delete().eq('blocker_id', viewerId).eq('blocked_id', targetId)
      : await supabase.from('blocks').insert({ blocker_id: viewerId, blocked_id: targetId });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setBlocked(!blocked);
    router.refresh();
  }

  return (
    <div>
      <button onClick={handleToggle} disabled={loading} className="btn-secondary text-sm">
        {loading ? (blocked ? 'Unblocking…' : 'Blocking…') : blocked ? 'Unblock' : 'Block'}
      </button>
      {error && <p className="mt-1 text-xs text-rust">{error}</p>}
    </div>
  );
}
