'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PodcastStatus } from '@/lib/supabase/types';

const OPTIONS: { value: PodcastStatus['status']; label: string }[] = [
  { value: 'want_to_listen', label: 'Want to listen' },
  { value: 'listening', label: 'Listening' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

export default function StatusSelector({
  podcastId,
  userId,
  initialStatus,
}: {
  podcastId: string;
  userId: string | null;
  initialStatus: PodcastStatus['status'] | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  if (!userId) return null;

  async function update(next: PodcastStatus['status']) {
    setLoading(true);
    if (next === status) {
      await supabase.from('podcast_statuses').delete().eq('user_id', userId).eq('podcast_id', podcastId);
      setStatus(null);
    } else {
      await supabase
        .from('podcast_statuses')
        .upsert({ user_id: userId, podcast_id: podcastId, status: next }, { onConflict: 'user_id,podcast_id' });
      setStatus(next);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          disabled={loading}
          onClick={() => update(o.value)}
          className={`rounded border px-3 py-1.5 text-sm transition-colors ${
            status === o.value
              ? 'border-amber bg-amber/10 text-amber'
              : 'border-line text-slate hover:border-amber/60 hover:text-cream'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
