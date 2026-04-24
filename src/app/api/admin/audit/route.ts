import { NextRequest, NextResponse } from 'next/server';
import { list, head } from '@vercel/blob';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key || key !== process.env.AUDIT_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { blobs } = await list({ prefix: 'audit/', token: process.env.BLOB_READ_WRITE_TOKEN });
  blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  const entries = await Promise.all(
    blobs.map(async blob => {
      try {
        const res = await fetch(blob.url);
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json(entries.filter(Boolean));
}
