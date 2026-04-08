import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function isAdminAuthed(req: NextRequest): boolean {
  const key =
    req.headers.get("x-admin-key") ??
    req.nextUrl.searchParams.get("admin_key");
  if (!key) return false;
  const pw = process.env.ADMIN_PASSWORD;
  const apiKey = process.env.ADMIN_API_KEY;
  return (!!pw && key === pw) || (!!apiKey && key === apiKey);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
