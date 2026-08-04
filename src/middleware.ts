import { NextResponse, type NextRequest } from 'next/server';

/**
 * Normalizes uppercase URLs to their lowercase route (e.g. /Anahuac → /anahuac).
 *
 * This cannot be done with `redirects()` in next.config: Next matches redirect
 * sources case-insensitively, so a `/Anahuac → /anahuac` rule also matches the
 * destination and loops forever (ERR_TOO_MANY_REDIRECTS).
 *
 * Here the redirect only fires when the path is *not* already lowercase, and the
 * target always is — so a second pass is impossible.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals, the API routes and anything with a file extension.
  matcher: ['/((?!_next|api|.*\\.).*)'],
};
