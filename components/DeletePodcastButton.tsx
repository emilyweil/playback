'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeletePodcastButton({
  podcastId,
  podcastTitle,
  userId,
  addedBy,
}: {
  podcastId: string;
  podcastTitle: string;
  userId: string | null;
  addedBy: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId || userId !== addedBy) return null;

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${podcastTitle}"? This removes all of its episodes, reviews, and ratings. This can't be undone.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.from('podcasts').delete().eq('id', podcastId);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/podcasts');
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm text-rust hover:underline disabled:opacity-60"
      >
        {loading ? 'Deleting…' : 'Delete podcast'}
      </button>
      {error && <p className="mt-1 text-xs text-rust">{error}</p>}
    </div>
  );
}
