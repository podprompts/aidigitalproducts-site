import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Uses cookie-based session storage (via @supabase/ssr) instead of
// localStorage, so server components/layouts can read the logged-in
// session too. Functionally a drop-in replacement for the plain
// supabase-js client — same API surface (storage.uploadToSignedUrl, etc.)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
