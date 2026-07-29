import Link from 'next/link';
import type { Profile } from '@/lib/supabase/types';
import SignOutButton from '@/components/SignOutButton';

export default function Nav({ profile }: { profile: Profile | null }) {
  return (
    <header className="border-b border-line bg-surface shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <WaveMark />
          <span className="font-display text-lg font-semibold tracking-wide2 text-cream">
            PLAYBACK
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/podcasts" className="text-slate hover:text-cream transition-colors">
            Browse
          </Link>
          <Link href="/podcasts/new" className="text-slate hover:text-cream transition-colors">
            Add a podcast
          </Link>
          <Link href="/lists" className="text-slate hover:text-cream transition-colors">
            Lists
          </Link>

          {profile ? (
            <>
              <Link
                href={`/u/${profile.username}`}
                className="rounded border border-line px-3 py-1.5 text-cream hover:border-amber transition-colors"
              >
                {profile.display_name || profile.username}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate hover:text-cream transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded bg-amber px-3 py-1.5 font-medium text-ink hover:bg-amber/90 transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function WaveMark() {
  const heights = [0.5, 0.9, 1, 0.6];
  return (
    <span className="inline-flex items-end gap-[2px]" style={{ height: 20 }}>
      {heights.map((h, i) => (
        <span
          key={i}
          className="block w-[3px] rounded-sm bg-amber"
          style={{ height: Math.round(20 * h) }}
        />
      ))}
    </span>
  );
}
