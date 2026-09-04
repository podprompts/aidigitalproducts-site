import { NextRequest, NextResponse } from 'next/server';

// Set to 'false' (or remove the env var) in Vercel's project settings
// when you're ready to launch and want the real site back for everyone.
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE !== 'false';

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === '/coming-soon.html') {
    return NextResponse.next();
  }

  // If you're logged into /admin, the login route sets an httpOnly
  // admin_session cookie. As long as that cookie matches your real
  // admin password/key, you see the live site everywhere — not just
  // inside /admin — until you log out.
  const sessionCookie = request.cookies.get('admin_session')?.value;
  const adminPw = process.env.ADMIN_PASSWORD;
  const adminKey = process.env.ADMIN_API_KEY;
  const isValidAdminSession =
    !!sessionCookie && (sessionCookie === adminPw || sessionCookie === adminKey);

  if (isValidAdminSession) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/coming-soon.html';
  return NextResponse.rewrite(url);
}

export const config = {
  // Run on every route EXCEPT:
  // - /_next/*          (Next.js internals: JS, CSS, etc.)
  // - /api/*             (API routes always work — including the admin
  //                        login route itself, so you can always log in)
  // - /admin              (the admin UI itself always loads, so the
  //                        login screen and dashboard are always reachable)
  // - /coming-soon.html   (the page itself, so it doesn't rewrite in a loop)
  // - favicon.ico and common static asset extensions
  matcher: [
    '/((?!_next/|api/|admin|coming-soon\\.html|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)$).*)',
  ],
};