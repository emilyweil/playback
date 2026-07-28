import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PodcastCard from '@/components/PodcastCard';
import AddListItem from './AddListItem';

export default async function ListPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: list } = await supabase
    .from('lists')
    .select('*, profiles(username, display_name)')
    .eq('id', params.id)
    .single();

  if (!list) notFound();

  const { data: items } = await supabase
    .from('list_items')
    .select(
      'id, note, position, podcasts(slug, title, cover_url, host_names), episodes(id, title, podcasts(slug, title))'
    )
    .eq('list_id', list.id)
    .order('position', { ascending: true });

  const isOwner = user?.id === list.user_id;
  const author = (list as any).profiles;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cream">{list.title}</h1>
      <p className="mt-1 text-sm text-slate">
        by{' '}
        <Link href={`/u/${author?.username}`} className="text-cream hover:text-amber">
          {author?.display_name || author?.username}
        </Link>
        {!list.is_public && ' · private'}
      </p>
      {list.description && <p className="mt-3 max-w-xl text-cream/85">{list.description}</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items?.map((item: any) =>
          item.podcasts ? (
            <PodcastCard
              key={item.id}
              slug={item.podcasts.slug}
              title={item.podcasts.title}
              coverUrl={item.podcasts.cover_url}
              hostNames={item.podcasts.host_names}
            />
          ) : (
            <Link key={item.id} href={`/episodes/${item.episodes.id}`} className="text-cream hover:text-amber">
              {item.episodes.podcasts?.title} — {item.episodes.title}
            </Link>
          )
        )}
      </div>

      {(!items || items.length === 0) && <p className="mt-6 text-sm text-slate">This list is empty.</p>}

      {isOwner && (
        <div className="mt-10">
          <AddListItem listId={list.id} />
        </div>
      )}
    </div>
  );
}
