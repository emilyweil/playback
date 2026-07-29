import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PodcastCard from '@/components/PodcastCard';

export default async function BrowsePodcasts({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim();

  let query = supabase
    .from('podcasts')
    .select('id, slug, title, cover_url, host_names, podcast_stats(average_rating, rating_count)')
    .order('created_at', { ascending: false })
    .limit(48);

  if (q) query = query.ilike('title', `%${q}%`);

  const { data: podcasts, error } = await query;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-cream">Browse podcasts</h1>
        <Link href="/podcasts/new" className="btn-secondary text-sm">
          + Add a podcast
        </Link>
      </div>

      <form className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="input w-full max-w-md"
        />
      </form>

      {error ? (
        <p className="mt-10 rounded border border-rust/40 bg-rust/5 p-4 text-sm text-rust">
          Couldn&rsquo;t load podcasts: {error.message}
        </p>
      ) : !podcasts || podcasts.length === 0 ? (
        <p className="mt-10 text-slate">
          {q ? `No podcasts matching "${q}".` : 'No podcasts yet — be the first to add one.'}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {podcasts.map((p: any) => (
            <PodcastCard
              key={p.id}
              slug={p.slug}
              title={p.title}
              coverUrl={p.cover_url}
              hostNames={p.host_names}
              averageRating={p.podcast_stats?.[0]?.average_rating}
              ratingCount={p.podcast_stats?.[0]?.rating_count}
            />
          ))}
        </div>
      )}
    </div>
  );
}
