'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Clicking the emailed link gives this page a temporary "recovery"
    // session. supabase-js exchanges the URL token for that session
    // automatically on load and fires this event when it's ready.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setValidLink(true);
      }
      setReady(true);
    });

    // In case the event already fired before this listener attached.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidLink(true);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords don\u2019t match.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="font-display text-2xl font-semibold text-cream">Password updated</h1>
        <p className="mt-3 text-sm text-slate">You&rsquo;re all set — head back in and pick up where you left off.</p>
        <a href="/" className="btn-primary mt-6 inline-block">
          Go to Playback
        </a>
      </div>
    );
  }

  if (!ready) return null;

  if (!validLink) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="font-display text-xl font-semibold text-cream">This link isn&rsquo;t valid</h1>
        <p className="mt-2 text-sm text-slate">
          Password reset links expire after a while, or may have already been used. Request a new one.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-6 inline-block">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl font-semibold text-cream">Set a new password</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-slate">New password</span>
          <input
            type="password"
            name="new-password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-slate">Confirm password</span>
          <input
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-rust">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
