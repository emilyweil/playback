'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';
import SignOutButton from '@/components/SignOutButton';

type FeedItem = {
  id: string;
  rating: number | null;
  created_at: string;
  profiles: { username: string; display_name: string | null } | null;
  podcasts: { title: string; slug: string; cover_url: string | null } | null;
};

export default function ProfileMenu({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoading(true);
      const { data: followingRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profile.id);
      const ids = (followingRows ?? []).map((f) => f.following_id);

      if (ids.length > 0) {
        const { data } = await supabase
          .from('reviews')
          .select('id, rating, created_at, profiles(username, display_name), podcasts(title, slug, cover_url)')
          .in('user_id', ids)
          .not('podcast_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);
        setItems((data as any) ?? []);
      }
      setLoaded(true);
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="rounded border border-line px-3 py-1.5 text-cream hover:border-amber transition-colors"
      >
        {profile.display_name || profile.username}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded border border-line bg-surface shadow-lg">
          <p className="border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wide2 text-slate">
            From people you follow
          </p>

          <div className="max-h-80 overflow-y-auto p-2">
            {loading ? (
              <p className="px-2 py-3 text-sm text-slate">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate">
                Nothing yet — follow people from their profile page to see their activity here.
              </p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={`/podcasts/${item.podcasts?.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded px-2 py-2 hover:bg-raised"
                >
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-raised">
                    {item.podcasts?.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.podcasts.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-sm text-slate">
                        {item.podcasts?.title?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                  <p className="min-w-0 truncate text-sm text-cream">
                    <span className="font-medium">
                      {item.profiles?.display_name || item.profiles?.username}
                    </span>{' '}
                    rated <span className="font-medium">{item.podcasts?.title}</span>
                    {item.rating ? ` ${item.rating}/5` : ''}
                  </p>
                </Link>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <Link
              href={`/u/${profile.username}`}
              onClick={() => setOpen(false)}
              className="text-xs text-cream hover:text-amber"
            >
              View full profile
            </Link>
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
