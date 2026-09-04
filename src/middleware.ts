import { NextRequest, NextResponse } from 'next/server';

// Set to 'false' (or remove the env var) in Vercel's project settings
// when you're ready to launch and want the real site back.
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE !== 'false';

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Already the coming-soon page — let it through as-is.
  if (pathname === '/coming-soon.html') {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/coming-soon.html';
  return NextResponse.rewrite(url);
}

export const config = {
  // Run on every route EXCEPT:
  // - /_next/*        (Next.js internals: JS, CSS, etc.)
  // - /api/*           (your API routes, in case anything still needs to hit them)
  // - /coming-soon.html (the page itself, so it doesn't rewrite in a loop)
  // - favicon.ico and common static asset extensions
  matcher: [
    '/((?!_next/|api/|coming-soon\\.html|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)$).*)',
  ],
};