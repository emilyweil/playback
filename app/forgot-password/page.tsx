'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="font-display text-2xl font-semibold text-cream">Check your email</h1>
        <p className="mt-3 text-sm text-slate">
          If there&rsquo;s an account for {email}, we sent a link to reset your password. Click it to continue.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-cream hover:text-amber">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl font-semibold text-cream">Reset your password</h1>
      <p className="mt-1 text-sm text-slate">
        Enter the email you signed up with and we&rsquo;ll send you a link to set a new password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-slate">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-rust">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate">
        <Link href="/login" className="text-cream hover:text-amber">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
