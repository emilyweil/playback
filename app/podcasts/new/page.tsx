'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import RatingWaveform from '@/components/RatingWaveform';

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type Match = { id: string; slug: string; title: string; host_names: string | null };

export default function NewPodcastPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  const [title, setTitle] = useState('');
  const [hostNames, setHostNames] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  function handleTitleChange(value: string) {
    setTitle(value);
    setShowMatches(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setMatches([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('podcasts')
        .select('id, slug, title, host_names')
        .ilike('title', `%${value.trim()}%`)
        .limit(5);
      setMatches(data ?? []);
    }, 250);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || rating === null) return;
    setLoading(true);
    setError(null);

    const slug = slugify(title);

    // If this podcast is already in the system, don't try to create a
    // duplicate — just log your rating against the existing one.
    const { data: existing } = await supabase
      .from('podcasts')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    let podcastId: string;
    let podcastSlug: string;

    if (existing) {
      podcastId = existing.id;
      podcastSlug = existing.slug;
    } else {
      const { data: created, error: podcastError } = await supabase
        .from('podcasts')
        .insert({
          title: title.trim(),
          slug,
          host_names: hostNames.trim() || null,
          description: description.trim() || null,
          cover_url: coverUrl.trim() || null,
          rss_url: rssUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          added_by: userId,
        })
        .select('id, slug')
        .single();

      if (podcastError) {
        // Race condition: someone else added the same podcast between our
        // check above and this insert. Recover the same way — log against
        // theirs rather than surfacing an error.
        if (podcastError.code === '23505') {
          const { data: raceExisting } = await supabase
            .from('podcasts')
            .select('id, slug')
            .eq('slug', slug)
            .maybeSingle();
          if (!raceExisting) {
            setLoading(false);
            setError(podcastError.message);
            return;
          }
          podcastId = raceExisting.id;
          podcastSlug = raceExisting.slug;
        } else {
          setLoading(false);
          setError(podcastError.message);
          return;
        }
      } else {
        podcastId = created.id;
        podcastSlug = created.slug;
      }
    }

    // Rating is required up front, so log it as a review right away — this
    // is what actually adds the podcast to "podcasts you've listened to,"
    // whether it was just created or already existed.
    const { error: reviewError } = await supabase.from('reviews').insert({
      user_id: userId,
      podcast_id: podcastId,
      rating,
      listened_at: new Date().toISOString().slice(0, 10),
    });

    setLoading(false);

    if (reviewError) {
      // The podcast itself is fine either way — don't block on this, just
      // let them know they can rate it again from the podcast page.
      console.error('Failed to save initial rating:', reviewError.message);
    }

    router.push(`/podcasts/${podcastSlug}`);
  }

  if (userId === undefined) return null;

  if (userId === null) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-cream">Sign in to add a podcast</h1>
        <p className="mt-2 text-sm text-slate">Adding shows is a member feature so we can track who added what.</p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-cream">Add a podcast</h1>
      <p className="mt-1 text-sm text-slate">
        Anyone can add a show. Fill in what you know — you can always add episodes afterward.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="relative">
          <Field label="Title *">
            <input
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => setShowMatches(true)}
              onBlur={() => setTimeout(() => setShowMatches(false), 150)}
              autoComplete="off"
              className="input"
            />
          </Field>

          {showMatches && matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded border border-line bg-surface shadow-md">
              <li className="border-b border-line px-3 py-1.5 text-xs text-slate">
                Already on Playback — tap to go there instead of creating a duplicate
              </li>
              {matches.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/podcasts/${m.slug}`}
                    className="block px-3 py-2 text-sm text-cream hover:bg-raised"
                  >
                    {m.title}
                    {m.host_names && <span className="ml-2 text-xs text-slate">{m.host_names}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Field label="Hosts">
          <input
            value={hostNames}
            onChange={(e) => setHostNames(e.target.value)}
            placeholder="e.g. Jane Doe, Sam Lee"
            className="input"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="textarea"
          />
        </Field>
        <Field label="Cover image URL">
          <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="input" />
        </Field>
        <Field label="RSS feed URL">
          <input value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} className="input" />
        </Field>
        <Field label="Website">
          <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="input" />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded border border-line p-4">
          <span className="text-sm text-slate">Your rating *</span>
          <RatingWaveform rating={rating} onChange={setRating} size="lg" label />
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}
        <button type="submit" disabled={loading || !title.trim() || rating === null} className="btn-primary">
          {loading ? 'Adding…' : 'Add podcast'}
        </button>
      </form>
    </div>
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
