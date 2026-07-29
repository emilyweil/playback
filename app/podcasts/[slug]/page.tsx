import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RatingWaveform from '@/components/RatingWaveform';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';
import StatusSelector from '@/components/StatusSelector';

export default async function PodcastPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: podcast, error: podcastError } = await supabase
    .from('podcasts')
    .select('*')
    .eq('slug', params.slug)
    .single();

  // PGRST116 = "no rows found", the only case that's a genuine 404. Any
  // other error should be visible, not silently swallowed into a
  // misleading not-found page.
  if (podcastError && podcastError.code !== 'PGRST116') {
    return (
      <p className="rounded border border-rust/40 bg-rust/5 p-4 text-sm text-rust">
        Couldn&rsquo;t load this podcast: {podcastError.message}
      </p>
    );
  }

  if (!podcast) notFound();

  // podcast_stats/episode_stats are aggregate views with no foreign key
  // back to their base tables, so PostgREST can't embed them via nested
  // select syntax ("Could not find a relationship..." error) — fetch them
  // separately and merge by id instead.
  const { data: stats } = await supabase
    .from('podcast_stats')
    .select('average_rating, rating_count, log_count')
    .eq('podcast_id', podcast.id)
    .maybeSingle();

  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, episode_number, season_number, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(100);

  const episodeStatsById: Record<string, { average_rating: number | null; rating_count: number }> = {};
  if (episodes && episodes.length > 0) {
    const { data: epStats } = await supabase
      .from('episode_stats')
      .select('episode_id, average_rating, rating_count')
      .in('episode_id', episodes.map((e) => e.id));
    for (const s of epStats ?? []) episodeStatsById[s.episode_id] = s;
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      'id, rating, body, contains_spoilers, is_relisten, listened_at, created_at, episode_id, profiles(username, display_name), podcasts(title, slug)'
    )
    .eq('podcast_id', podcast.id)
    .order('created_at', { ascending: false })
    .limit(20);

  let myStatus = null;
  if (user) {
    const { data } = await supabase
      .from('podcast_statuses')
      .select('status')
      .eq('user_id', user.id)
      .eq('podcast_id', podcast.id)
      .maybeSingle();
    myStatus = data?.status ?? null;
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="h-40 w-40 flex-shrink-0 overflow-hidden rounded bg-raised">
          {podcast.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={podcast.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl text-slate">
              {podcast.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold text-cream">{podcast.title}</h1>
          {podcast.host_names && <p className="mt-1 text-slate">{podcast.host_names}</p>}

          <div className="mt-3 flex items-center gap-3">
            <RatingWaveform rating={stats?.average_rating ? Math.round(stats.average_rating) : null} size="md" />
            <span className="font-mono text-xs text-slate">
              {stats?.average_rating ? stats.average_rating.toFixed(2) : '—'} avg · {stats?.rating_count ?? 0} ratings
              · {stats?.log_count ?? 0} logs
            </span>
          </div>

          {podcast.description && <p className="mt-4 max-w-2xl text-cream/85">{podcast.description}</p>}

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {podcast.website_url && (
              <a href={podcast.website_url} target="_blank" className="text-slate hover:text-amber">
                Website ↗
              </a>
            )}
            {podcast.rss_url && (
              <a href={podcast.rss_url} target="_blank" className="text-slate hover:text-amber">
                RSS feed ↗
              </a>
            )}
            <Link href={`/podcasts/${podcast.slug}/episodes/new`} className="text-slate hover:text-amber">
              + Add episode
            </Link>
          </div>

          <div className="mt-5">
            <StatusSelector podcastId={podcast.id} userId={user?.id ?? null} initialStatus={myStatus} />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
          Episodes {episodes ? `(${episodes.length})` : ''}
        </h2>
        {!episodes || episodes.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No episodes logged yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded border border-line bg-surface px-4">
            {episodes.map((ep: any) => (
              <li key={ep.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/episodes/${ep.id}`} className="min-w-0 flex-1">
                  <span className="font-mono text-xs text-slate">
                    {ep.season_number ? `S${ep.season_number} ` : ''}
                    {ep.episode_number ? `E${ep.episode_number}` : ''}
                  </span>
                  <span className="ml-2 text-cream hover:text-amber">{ep.title}</span>
                </Link>
                <RatingWaveform
                  rating={episodeStatsById[ep.id]?.average_rating ? Math.round(episodeStatsById[ep.id].average_rating!) : null}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">Log or review</h2>
        <div className="mt-4">
          <ReviewForm targetType="podcast" targetId={podcast.id} userId={user?.id ?? null} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">Reviews</h2>
        {!reviews || reviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No reviews yet.</p>
        ) : (
          <div className="mt-4 rounded border border-line bg-surface px-5">
            {reviews.map((r: any) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
