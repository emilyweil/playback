'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
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

    const { data, error } = await supabase
      .from('lists')
      .insert({ user_id: userId, title: title.trim(), description: description.trim() || null, is_public: isPublic })
      .select('id')
      .single();

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/lists/${data.id}`);
  }

  if (userId === undefined) return null;

  if (userId === null) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-cream">Sign in to create a list</h1>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-cream">New list</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-slate">Title *</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-slate">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="textarea" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Public (visible to everyone)
        </label>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button type="submit" disabled={loading || !title.trim()} className="btn-primary">
          {loading ? 'Creating…' : 'Create list'}
        </button>
      </form>
    </div>
  );
}
