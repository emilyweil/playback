'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Profile } from '@/lib/supabase/types';
import SignOutButton from '@/components/SignOutButton';

export default function ProfileMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded border border-line px-3 py-1.5 text-cream hover:border-amber transition-colors"
      >
        {profile.display_name || profile.username}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded border border-line bg-surface py-1 shadow-lg">
          <Link
            href="/friends/find"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-cream hover:bg-raised"
          >
            Find friends
          </Link>
          <Link
            href="/friends"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-cream hover:bg-raised"
          >
            Friends
          </Link>
          <Link
            href="/friends/feed"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-cream hover:bg-raised"
          >
            Friend Feed
          </Link>
          <Link
            href="/profile/lists"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-cream hover:bg-raised"
          >
            My lists
          </Link>
          <div className="my-1 border-t border-line" />
          <Link
            href={`/u/${profile.username}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-cream hover:bg-raised"
          >
            Profile & Diary
          </Link>
          <div className="px-4 py-2">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
