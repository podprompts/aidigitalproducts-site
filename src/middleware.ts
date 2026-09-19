import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Set to 'false' (or remove the env var) in Vercel's project settings
// when you're ready to launch and want the real site back for everyone.
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE !== 'false';

function getSecretKey(): Uint8Array | null {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get('admin_session')?.value;
  if (!sessionCookie) return false;

  const key = getSecretKey();
  if (!key) return false;

  try {
    await jwtVerify(sessionCookie, key);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname === '/make-offer.html' ||
    pathname === '/terms.html' ||
    pathname.startsWith('/vendor')
  ) {
    return NextResponse.next();
  }

  // If you're logged into /admin, the login route sets an httpOnly
  // admin_session cookie containing a signed session token. As long as
  // it's valid, you see the live site everywhere — not just inside
  // /admin — until you log out or it expires.
  if (await hasValidAdminSession(request)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/make-offer.html';
  return NextResponse.rewrite(url);
}

export const config = {
  // Run on every route EXCEPT:
  // - /_next/*          (Next.js internals: JS, CSS, etc.)
  // - /api/*             (API routes always work — including the admin
  //                        login route itself, so you can always log in)
  // - /admin              (the admin UI itself always loads, so the
  //                        login screen and dashboard are always reachable)
  // - /vendor             (real vendors need to reach login/dashboard
  //                        regardless of maintenance mode, same as /admin)
  // - /make-offer.html    (the page itself, so it doesn't rewrite in a loop)
  // - /terms.html         (linked from the offer form, must load directly)
  // - favicon.ico and common static asset extensions
  matcher: [
    '/((?!_next/|api/|admin|vendor|make-offer\\.html|terms\\.html|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)$).*)',
  ],
};