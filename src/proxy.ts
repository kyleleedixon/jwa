import { NextRequest, NextResponse } from 'next/server';

// Auth is enforced at the page level (src/app/page.tsx)
export default function proxy(_req: NextRequest) {
  return NextResponse.next();
}
