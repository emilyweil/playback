'use client';

import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        // Hard navigation — see app/login/page.tsx for why.
        window.location.href = '/';
      }}
      className="text-sm text-slate hover:text-cream transition-colors"
    >
      Sign out
    </button>
  );
}
