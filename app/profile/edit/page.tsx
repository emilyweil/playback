'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [username, setUsername] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setLoadingProfile(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, bio, location, avatar_url')
        .eq('id', uid)
        .single();
      if (profile) {
        setUsername(profile.username);
        setDisplayName(profile.display_name ?? '');
        setBio(profile.bio ?? '');
        setLocation(profile.location ?? '');
        setAvatarUrl(profile.avatar_url ?? '');
      }
      setLoadingProfile(false);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', userId);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(`/u/${username}`);
    router.refresh();
  }

  if (userId === undefined || loadingProfile) return null;

  if (userId === null) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-cream">Sign in to edit your profile</h1>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-cream">Edit profile</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Display name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
        </Field>
        <Field label="Bio">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="textarea" />
        </Field>
        <Field label="Location">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Portland, OR"
            className="input"
          />
        </Field>
        <Field label="Profile image URL">
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="input" />
        </Field>

        {error && <p className="text-sm text-rust">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-slate">{label}</span>
      {children}
    </label>
  );
}
