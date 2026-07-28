import { createBrowserClient } from '@supabase/ssr';

// Not parameterized with our hand-written Database type: this version of
// @supabase/postgrest-js has stricter generic requirements (Relationships,
// Functions, etc.) that a hand-rolled schema doesn't reliably satisfy. Swap
// in a real generated type once the project is live:
//   supabase gen types typescript --project-id <id> > lib/supabase/types.ts
// and re-add `<Database>` here. Row/Insert shapes are still typed manually
// via lib/supabase/types.ts at the call sites that need it.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
