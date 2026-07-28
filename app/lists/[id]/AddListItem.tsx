'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AddListItem({ listId }: { listId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; title: string }[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function search(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const { data } = await supabase.from('podcasts').select('id, title').ilike('title', `%${q}%`).limit(6);
    setResults(data ?? []);
  }

  async function add(podcastId: string) {
    setError(null);
    const { error } = await supabase.from('list_items').insert({ list_id: listId, podcast_id: podcastId, note: note.trim() || null });
    if (error) {
      setError(error.message);
      return;
    }
    setQuery('');
    setResults([]);
    setNote('');
    router.refresh();
  }

  return (
    <div className="rounded border border-line p-4">
      <p className="text-sm text-slate">Add a podcast to this list</p>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search podcasts by title…"
        className="input mt-2 w-full"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="input mt-2 w-full"
      />
      {error && <p className="mt-2 text-sm text-rust">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-line rounded border border-line">
          {results.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-cream">{p.title}</span>
              <button onClick={() => add(p.id)} className="text-sm text-amber hover:underline">
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
