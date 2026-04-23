import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|_next/data|favicon\\.ico).+)',
  ],
};
