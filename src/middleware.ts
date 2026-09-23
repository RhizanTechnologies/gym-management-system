import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected path prefixes requiring authenticated session
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/checkin',
  '/members',
  '/leads',
  '/expenses',
  '/equipment',
  '/plans',
  '/pos',
  '/import',
  '/lockers',
  '/staff',
  '/super-admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, next internal files, and manifest
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get('gymos_session')?.value;

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(sessionCookie);
    if (!session?.userId) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Pass session user headers downstream
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.userId);
    if (session.role) response.headers.set('x-user-role', session.role);
    if (session.tenantId) response.headers.set('x-tenant-id', session.tenantId);

    return response;
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
