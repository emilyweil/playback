'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function BlockButton({ viewerId, targetId }: { viewerId: string; targetId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (blocked) return null;

  async function handleBlock() {
    const confirmed = window.confirm(
      'Block this person? They will be unfollowed and won\u2019t be able to follow you again.'
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const { error } = await supabase.from('blocks').insert({ blocker_id: viewerId, blocked_id: targetId });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setBlocked(true);
    router.refresh();
  }

  return (
    <div>
      <button onClick={handleBlock} disabled={loading} className="btn-secondary text-sm">
        {loading ? 'Blocking…' : 'Block'}
      </button>
      {error && <p className="mt-1 text-xs text-rust">{error}</p>}
    </div>
  );
}
