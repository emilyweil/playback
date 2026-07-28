'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewEpisodeForm({ podcastId, podcastSlug }: { podcastId: string; podcastSlug: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  const [title, setTitle] = useState('');
  const [season, setSeason] = useState('');
  const [episodeNum, setEpisodeNum] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [description, setDescription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('episodes')
      .insert({
        podcast_id: podcastId,
        title: title.trim(),
        season_number: season ? Number(season) : null,
        episode_number: episodeNum ? Number(episodeNum) : null,
        published_at: publishedAt || null,
        description: description.trim() || null,
        audio_url: audioUrl.trim() || null,
        added_by: userId,
      })
      .select('id')
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(`/episodes/${data.id}`);
  }

  if (userId === undefined) return null;

  if (userId === null) {
    return (
      <div className="mt-6 text-center">
        <p className="text-sm text-slate">Sign in to add episodes.</p>
        <Link href="/login" className="btn-primary mt-4 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <Field label="Title *">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
      </Field>
      <div className="flex gap-4">
        <Field label="Season #">
          <input value={season} onChange={(e) => setSeason(e.target.value)} className="input" type="number" />
        </Field>
        <Field label="Episode #">
          <input
            value={episodeNum}
            onChange={(e) => setEpisodeNum(e.target.value)}
            className="input"
            type="number"
          />
        </Field>
      </div>
      <Field label="Published date">
        <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="input" />
      </Field>
      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="textarea" />
      </Field>
      <Field label="Audio URL">
        <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="input" />
      </Field>

      {error && <p className="text-sm text-rust">{error}</p>}
      <button type="submit" disabled={loading || !title.trim()} className="btn-primary">
        {loading ? 'Adding…' : 'Add episode'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-slate">{label}</span>
      {children}
    </label>
  );
}
