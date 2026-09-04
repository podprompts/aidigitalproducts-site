import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try { body = await req.json(); } catch { body = {}; }

  const { password } = body;
  const adminPw  = process.env.ADMIN_PASSWORD;
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminPw && !adminKey) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }
  if (!password || (password !== adminPw && password !== adminKey)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // Set an httpOnly cookie so middleware can recognize the admin session
  // server-side. This is separate from the localStorage token your admin
  // UI already uses for x-admin-key — that stays unchanged.
  res.cookies.set("admin_session", password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}