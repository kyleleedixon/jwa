import { auth } from '../auth';
import { NextResponse } from 'next/server';

export const proxy = auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)'],
};
