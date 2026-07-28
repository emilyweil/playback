import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ListsPage() {
  const supabase = createClient();
  const { data: lists } = await supabase
    .from('lists')
    .select('id, title, description, profiles(username, display_name)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-cream">Lists</h1>
        <Link href="/lists/new" className="btn-secondary text-sm">
          + New list
        </Link>
      </div>

      {!lists || lists.length === 0 ? (
        <p className="mt-10 text-slate">No public lists yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {lists.map((l: any) => (
            <li key={l.id} className="py-4">
              <Link href={`/lists/${l.id}`} className="font-display text-cream hover:text-amber">
                {l.title}
              </Link>
              <p className="text-sm text-slate">
                by {l.profiles?.display_name || l.profiles?.username}
                {l.description ? ` — ${l.description}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
