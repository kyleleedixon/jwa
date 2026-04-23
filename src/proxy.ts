import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for next-auth v5 session cookie
  const sessionToken =
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('__Secure-authjs.session-token');

  if (!sessionToken && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (sessionToken && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
