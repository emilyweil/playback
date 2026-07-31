import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PodcastCard from '@/components/PodcastCard';

export default async function BrowsePodcasts({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const q = searchParams.q?.trim();

  let query = supabase
    .from('podcasts')
    .select('id, slug, title, cover_url, host_names')
    .order('created_at', { ascending: false })
    .limit(48);

  if (q) query = query.ilike('title', `%${q}%`);

  const { data: podcasts, error } = await query;

  // podcast_stats is an aggregate view with no foreign key back to podcasts,
  // so PostgREST can't embed it via nested select syntax — fetch separately
  // and merge by id instead.
  const statsById: Record<string, { average_rating: number | null; rating_count: number }> = {};
  if (podcasts && podcasts.length > 0) {
    const { data: stats } = await supabase
      .from('podcast_stats')
      .select('podcast_id, average_rating, rating_count')
      .in('podcast_id', podcasts.map((p) => p.id));
    for (const s of stats ?? []) statsById[s.podcast_id] = s;
  }

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
          {q ? (
            `No podcasts matching "${q}".`
          ) : user ? (
            <>
              No podcasts yet —{' '}
              <Link href="/podcasts/new" className="text-cream hover:text-amber">
                add one
              </Link>
              .
            </>
          ) : (
            <>
              No podcasts yet —{' '}
              <Link href="/signup" className="text-cream hover:text-amber">
                sign up
              </Link>{' '}
              to add one.
            </>
          )}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {podcasts.map((p) => (
            <PodcastCard
              key={p.id}
              slug={p.slug}
              title={p.title}
              coverUrl={p.cover_url}
              hostNames={p.host_names}
              averageRating={statsById[p.id]?.average_rating}
              ratingCount={statsById[p.id]?.rating_count}
            />
          ))}
        </div>
      )}
    </div>
  );
}
