'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <h1 className="font-display text-xl font-semibold text-cream">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate">
        That&rsquo;s on us, not you. Try again — if it keeps happening, refreshing the page usually clears it.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
