import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface AdminTokenPayload {
  sub: string;
  email: string;
  name?: string;
}

function getSecretKey(): Uint8Array | null {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  const key = getSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email, name: payload.name as string | undefined };
  } catch {
    // Invalid signature, malformed token, or expired — all treated as unauthenticated
    return null;
  }
}

// Signature unchanged in effect (still checks the same x-admin-key header
// or admin_key query param) but now async — every call site needs `await`.
export async function isAdminAuthed(req: NextRequest): Promise<boolean> {
  const key =
    req.headers.get("x-admin-key") ??
    req.nextUrl.searchParams.get("admin_key");
  if (!key) return false;
  return (await verifyAdminToken(key)) !== null;
}

// New — for routes that want to know WHICH admin is authenticated, not just
// whether. Useful for recording who approved a listing, issued a refund, etc.
export async function getAdminUser(req: NextRequest): Promise<AdminTokenPayload | null> {
  const key =
    req.headers.get("x-admin-key") ??
    req.nextUrl.searchParams.get("admin_key");
  if (!key) return null;
  return verifyAdminToken(key);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}