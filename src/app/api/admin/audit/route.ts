import { NextRequest, NextResponse } from 'next/server';
import { list, get } from '@vercel/blob';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key || key !== process.env.AUDIT_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN!;
  const { blobs } = await list({ prefix: 'audit/', token });
  blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  const entries = await Promise.all(
    blobs.map(async blob => {
      try {
        const meta = await get(blob.url, { token, access: 'private' });
        if (!meta) return null;
        const res = await fetch(getDownloadUrl(blob.url), {
          headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json(entries.filter(Boolean));
}

function getDownloadUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set('download', '1');
  return u.toString();
}
