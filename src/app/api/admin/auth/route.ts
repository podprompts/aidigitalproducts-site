import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";

function getSecretKey(): Uint8Array | null {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const key = getSecretKey();
  if (!key) {
    return NextResponse.json({ error: "Admin auth not configured" }, { status: 503 });
  }

  // Verify credentials against real Supabase Auth. This is a fresh,
  // unauthenticated client — deliberately separate from the vendor session
  // client, since admins and vendors are different account systems.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Being a valid Supabase Auth user isn't enough on its own — confirm this
  // is actually an active admin account.
  const { data: adminProfile } = await supabaseAdmin
    .from("admin_profiles")
    .select("display_name, is_active")
    .eq("id", data.user.id)
    .single();

  if (!adminProfile || !adminProfile.is_active) {
    return NextResponse.json({ error: "This account is not an active admin" }, { status: 403 });
  }

  // Issue a signed, self-contained session token. isAdminAuthed() verifies
  // this by signature alone — no database lookup needed on every request.
  const token = await new SignJWT({ email: data.user.email, name: adminProfile.display_name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(data.user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);

  const res = NextResponse.json({ ok: true, token });

  // Set an httpOnly cookie so middleware can recognize the admin session
  // server-side, for the maintenance-mode bypass. Separate from the
  // localStorage token the admin UI sends as x-admin-key — both now carry
  // the same signed JWT.
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}