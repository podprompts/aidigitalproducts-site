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

  return NextResponse.json({ ok: true });
}
