import { NextRequest } from 'next/server';
import { list, getDownloadUrl } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key || key !== process.env.AUDIT_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN!;
  const { blobs } = await list({ prefix: 'audit/', token });
  blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  const entries = (await Promise.all(
    blobs.map(async blob => {
      try {
        const downloadUrl = getDownloadUrl(blob.url);
        const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
        return await res.json();
      } catch { return null; }
    })
  )).filter(Boolean);

  const cards = entries.map((e: any) => {
    const d = new Date(e.lastLogin);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const authorized = e.authorized;
    const avatar = e.avatar
      ? `<img src="${e.avatar}" width="40" height="40" class="avatar">`
      : `<span class="avatar avatar-fallback"></span>`;
    return `<div class="card ${authorized ? 'card-ok' : 'card-rej'}">
      <div class="card-left">
        ${avatar}
        <div class="card-info">
          <div class="card-name">${e.name ?? '—'}</div>
          <div class="card-id">${e.discordId}</div>
        </div>
      </div>
      <div class="card-right">
        <div class="card-status ${authorized ? 'status-ok' : 'status-rej'}">${authorized ? '✓ Authorized' : '✗ Rejected'}</div>
        <div class="card-date">${date}</div>
        <div class="card-time">${time} UTC</div>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JWA Dinodex — Login Audit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px 16px; max-width: 640px; margin: 0 auto; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    p.sub { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    .cards { display: flex; flex-direction: column; gap: 10px; }
    .card { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #1e293b; border-radius: 12px; padding: 12px 14px; border-left: 3px solid transparent; }
    .card-ok { border-left-color: #4ade80; }
    .card-rej { border-left-color: #f87171; }
    .card-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
    .avatar-fallback { display: inline-block; background: #334155; }
    .card-info { min-width: 0; }
    .card-name { font-size: 14px; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .card-id { font-size: 11px; color: #64748b; margin-top: 2px; }
    .card-right { text-align: right; flex-shrink: 0; }
    .card-status { font-size: 12px; font-weight: 600; }
    .status-ok { color: #4ade80; }
    .status-rej { color: #f87171; }
    .card-date { font-size: 12px; color: #94a3b8; margin-top: 3px; }
    .card-time { font-size: 11px; color: #475569; }
    .empty { text-align: center; padding: 48px; color: #475569; }
  </style>
</head>
<body>
  <h1>Login Audit</h1>
  <p class="sub">${entries.length} user${entries.length !== 1 ? 's' : ''} · sorted by most recent login</p>
  <div class="cards">
    ${cards || `<div class="empty">No entries yet.</div>`}
  </div>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } });
}
