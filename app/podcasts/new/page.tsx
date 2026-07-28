'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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

    const slug = slugify(title);
    const { data, error } = await supabase
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
      .select('slug')
      .single();

    setLoading(false);

    if (error) {
      setError(
        error.code === '23505'
          ? 'A podcast with a matching title already exists.'
          : error.message
      );
      return;
    }

    router.push(`/podcasts/${data.slug}`);
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
        <Field label="Title *">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
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

        {error && <p className="text-sm text-rust">{error}</p>}
        <button type="submit" disabled={loading || !title.trim()} className="btn-primary">
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
