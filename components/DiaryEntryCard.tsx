'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import RatingStars from '@/components/RatingStars';

type Entry = {
  id: string;
  rating: number | null;
  body: string | null;
  listened_at: string;
  podcasts: { title: string; slug: string; cover_url: string | null } | null;
  episodes: {
    title: string;
    episode_number: number | null;
    season_number: number | null;
    podcasts: { title: string; slug: string; cover_url: string | null } | null;
  } | null;
};

export default function DiaryEntryCard({ entry, isOwner }: { entry: Entry; isOwner: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [rating, setRating] = useState(entry.rating);
  const [body, setBody] = useState(entry.body ?? '');
  const [listenedAt, setListenedAt] = useState(entry.listened_at);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (deleted) return null;

  const isEpisode = Boolean(entry.episodes);
  const podcast = isEpisode ? entry.episodes?.podcasts : entry.podcasts;
  const href = isEpisode ? `/podcasts/${podcast?.slug}` : `/podcasts/${entry.podcasts?.slug}`;
  const title = isEpisode
    ? `${podcast?.title ?? 'Unknown podcast'} — ${
        entry.episodes?.season_number ? `S${entry.episodes.season_number} ` : ''
      }${entry.episodes?.episode_number ? `E${entry.episodes.episode_number}` : ''} ${entry.episodes?.title}`
    : entry.podcasts?.title ?? 'Unknown podcast';

  async function handleSave() {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('reviews')
      .update({ rating, body: body.trim() || null, listened_at: listenedAt })
      .eq('id', entry.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm('Remove this entry from your diary? This can\u2019t be undone.');
    if (!confirmed) return;
    setLoading(true);
    const { error } = await supabase.from('reviews').delete().eq('id', entry.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDeleted(true);
    router.refresh();
  }

  return (
    <article className="flex gap-4 border-b border-line py-5 last:border-b-0">
      <Link href={href} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-raised">
        {podcast?.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={podcast.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-xl text-slate">
            {podcast?.title?.charAt(0).toUpperCase() ?? '?'}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <Link href={href} className="font-display text-sm font-medium text-cream hover:text-amber transition-colors">
            {title}
          </Link>
          {!editing && entry.rating && <RatingStars rating={entry.rating} size="sm" />}
        </div>

        {editing ? (
          <div className="mt-3 rounded border border-line p-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate">Rating</span>
              <RatingStars rating={rating} onChange={setRating} size="md" label />
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="textarea mt-3 w-full"
              placeholder="Write a review (optional)…"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-slate">
              <span>Listened on</span>
              <input
                type="date"
                value={listenedAt}
                onChange={(e) => setListenedAt(e.target.value)}
                className="input py-1"
              />
            </label>
            {error && <p className="mt-2 text-sm text-rust">{error}</p>}
            <div className="mt-3 flex gap-3">
              <button onClick={handleSave} disabled={loading} className="btn-primary py-1.5 text-sm">
                {loading ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={loading}
                className="btn-secondary py-1.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {entry.body && (
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-cream/90">{entry.body}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <time className="font-mono text-[11px] text-slate">
                {new Date(entry.listened_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
              {isOwner && (
                <>
                  <button onClick={() => setEditing(true)} className="text-xs text-slate hover:text-amber">
                    Edit
                  </button>
                  <button onClick={handleDelete} disabled={loading} className="text-xs text-slate hover:text-rust">
                    Delete
                  </button>
                </>
              )}
            </div>
            {error && <p className="mt-1 text-xs text-rust">{error}</p>}
          </>
        )}
      </div>
    </article>
  );
}
