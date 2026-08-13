import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PodcastCard from '@/components/PodcastCard';

async function getStatsById(supabase: ReturnType<typeof createClient>, podcastIds: string[]) {
  const statsById: Record<string, { average_rating: number | null; rating_count: number }> = {};
  if (podcastIds.length === 0) return statsById;
  const { data } = await supabase
    .from('podcast_stats')
    .select('podcast_id, average_rating, rating_count')
    .in('podcast_id', podcastIds);
  for (const s of data ?? []) statsById[s.podcast_id] = s;
  return statsById;
}

function StatusList({
  title,
  items,
  statsById,
}: {
  title: string;
  items: any[];
  statsById: Record<string, any>;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide2 text-slate">
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate">Nothing here yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {items.map((p: any) => (
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
    </section>
  );
}

export default async function MyListsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-cream">Sign in to see your lists</h1>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  const { data: statusRows } = await supabase
    .from('podcast_statuses')
    .select('status, podcasts(id, slug, title, cover_url, host_names)')
    .eq('user_id', user.id);

  const wantToListen = (statusRows ?? [])
    .filter((r: any) => r.status === 'want_to_listen')
    .map((r: any) => r.podcasts)
    .filter(Boolean);
  const listening = (statusRows ?? [])
    .filter((r: any) => r.status === 'listening')
    .map((r: any) => r.podcasts)
    .filter(Boolean);

  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('created_at, podcasts(id, slug, title, cover_url, host_names)')
    .eq('user_id', user.id)
    .not('podcast_id', 'is', null)
    .not('rating', 'is', null)
    .order('created_at', { ascending: false });

  // A podcast can have more than one log entry — keep just the most recent.
  const seen = new Set<string>();
  const listened: any[] = [];
  for (const r of reviewRows ?? []) {
    const p = (r as any).podcasts;
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      listened.push(p);
    }
  }

  const statsById = await getStatsById(
    supabase,
    [...listened, ...listening, ...wantToListen].map((p: any) => p.id)
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cream">My lists</h1>
      <StatusList title="Listened" items={listened} statsById={statsById} />
      <StatusList title="Listening" items={listening} statsById={statsById} />
      <StatusList title="Want to Listen" items={wantToListen} statsById={statsById} />
    </div>
  );
}
