import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewEpisodeForm from './NewEpisodeForm';

export default async function NewEpisodePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('id, title, slug')
    .eq('slug', params.slug)
    .single();

  if (!podcast) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-cream">Add an episode</h1>
      <p className="mt-1 text-sm text-slate">to {podcast.title}</p>
      <NewEpisodeForm podcastId={podcast.id} podcastSlug={podcast.slug} />
    </div>
  );
}
