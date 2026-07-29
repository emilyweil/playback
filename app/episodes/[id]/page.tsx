import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RatingWaveform from '@/components/RatingWaveform';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: episodeData, error: episodeError } = await supabase
    .from('episodes')
    .select('*, podcasts(title, slug, cover_url)')
    .eq('id', params.id)
    .single();

  if (episodeError && episodeError.code !== 'PGRST116') {
    return (
      <p className="rounded border border-rust/40 bg-rust/5 p-4 text-sm text-rust">
        Couldn&rsquo;t load this episode: {episodeError.message}
      </p>
    );
  }

  const episode = episodeData as any;

  if (!episode) notFound();

  // episode_stats is an aggregate view with no foreign key back to
  // episodes, so PostgREST can't embed it via nested select syntax — fetch
  // it separately instead.
  const { data: stats } = await supabase
    .from('episode_stats')
    .select('average_rating, rating_count, log_count')
    .eq('episode_id', episode.id)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      'id, rating, body, contains_spoilers, is_relisten, listened_at, created_at, episode_id, profiles(username, display_name)'
    )
    .eq('episode_id', episode.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const podcast = (episode as any).podcasts;

  return (
    <div>
      <Link href={`/podcasts/${podcast.slug}`} className="text-sm text-slate hover:text-amber">
        ← {podcast.title}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-slate">
            {episode.season_number ? `S${episode.season_number} ` : ''}
            {episode.episode_number ? `E${episode.episode_number}` : ''}
          </span>
          <h1 className="mt-1 font-display text-2xl font-semibold text-cream">{episode.title}</h1>
          {episode.published_at && (
            <p className="mt-1 font-mono text-xs text-slate">
              {new Date(episode.published_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        <RatingWaveform rating={stats?.average_rating ? Math.round(stats.average_rating) : null} size="md" />
      </div>

      {episode.description && <p className="mt-4 max-w-2xl text-cream/85">{episode.description}</p>}
      <p className="mt-2 font-mono text-xs text-slate">
        {stats?.average_rating ? stats.average_rating.toFixed(2) : '—'} avg · {stats?.rating_count ?? 0} ratings ·{' '}
        {stats?.log_count ?? 0} logs
      </p>

      {episode.audio_url && (
        <audio controls className="mt-4 w-full max-w-md">
          <source src={episode.audio_url} />
        </audio>
      )}

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">Log or review</h2>
        <div className="mt-4">
          <ReviewForm targetType="episode" targetId={episode.id} userId={user?.id ?? null} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">Reviews</h2>
        {!reviews || reviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No reviews yet.</p>
        ) : (
          <div className="mt-4 rounded border border-line bg-surface px-5">
            {reviews.map((r: any) => (
              <ReviewCard key={r.id} review={{ ...r, podcasts: null, episodes: { title: episode.title, episode_number: episode.episode_number, season_number: episode.season_number, podcasts: podcast } }} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
