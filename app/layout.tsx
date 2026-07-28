import type { Metadata } from 'next';
import { Space_Grotesk, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/types';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600'],
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Playback — track every episode, rate every show',
  description:
    'A social site for podcasts. Log episodes as you listen, rate and review shows, follow other listeners, and build lists.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink font-serif text-cream antialiased">
        <Nav profile={profile} />
        <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-5 py-10 text-xs text-slate">
          Playback — built with Next.js &amp; Supabase.
        </footer>
      </body>
    </html>
  );
}
