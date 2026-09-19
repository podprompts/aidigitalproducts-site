import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

// This client reads/writes the vendor's actual login session (via cookies).
// It's completely separate from src/lib/supabase/server.ts's supabaseAdmin,
// which uses the service-role key and deliberately bypasses auth/RLS for
// admin operations. Never mix the two — this one respects Row Level
// Security as the logged-in vendor; supabaseAdmin ignores it entirely.
//
// NOTE: this is a plain (non-async) function that takes an already-resolved
// cookie store, rather than calling cookies() internally — call cookies()
// directly at each call site instead. This matches Supabase's actual
// recommended pattern for Next.js App Router.
export function createSessionClient(cookieStore: CookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies —
            // safe to ignore if middleware/layout handles refresh elsewhere.
          }
        },
      },
    }
  );
}