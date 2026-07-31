'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RatingStars from '@/components/RatingStars';

type Props = {
  targetType: 'podcast' | 'episode';
  targetId: string;
  userId: string | null;
};

export default function ReviewForm({ targetType, targetId, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [listenedAt, setListenedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!userId) {
    return (
      <p className="rounded border border-line p-4 text-sm text-slate">
        <a href="/login" className="text-cream hover:text-amber">
          Sign in
        </a>{' '}
        to log or review this {targetType}.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === null) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.from('reviews').insert({
      user_id: userId,
      podcast_id: targetType === 'podcast' ? targetId : null,
      episode_id: targetType === 'episode' ? targetId : null,
      rating,
      body: body.trim() || null,
      listened_at: listenedAt,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Reviewing a podcast means you've actually listened to it, so it no
    // longer belongs on a "want to listen" or "currently listening" shelf.
    if (targetType === 'podcast') {
      await supabase
        .from('podcast_statuses')
        .delete()
        .eq('user_id', userId)
        .eq('podcast_id', targetId)
        .in('status', ['want_to_listen', 'listening']);
    }

    setLoading(false);
    setDone(true);
    setBody('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate">Your rating *</span>
        <RatingStars rating={rating} onChange={setRating} size="lg" label />
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Write a review of this ${targetType} (optional)…`}
        rows={3}
        className="textarea mt-4 w-full"
      />

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate">
        <label className="flex items-center gap-2">
          <span>Listened on</span>
          <input
            type="date"
            value={listenedAt}
            onChange={(e) => setListenedAt(e.target.value)}
            className="input py-1"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-rust">{error}</p>}
      {done && <p className="mt-3 text-sm text-signal">Logged.</p>}

      <button type="submit" disabled={loading || rating === null} className="btn-primary mt-4">
        {loading ? 'Saving…' : 'Save log'}
      </button>
    </form>
  );
}
