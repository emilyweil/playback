'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
      }}
      className="text-sm text-slate hover:text-cream transition-colors"
    >
      Sign out
    </button>
  );
}
