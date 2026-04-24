import { NextRequest } from 'next/server';
import { list, getDownloadUrl } from '@vercel/blob';

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

  const rows = entries.map((e: any) => {
    const d = new Date(e.lastLogin);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const status = e.authorized
      ? `<span style="color:#4ade80;font-weight:600">✓ Authorized</span>`
      : `<span style="color:#f87171;font-weight:600">✗ Rejected</span>`;
    const avatar = e.avatar
      ? `<img src="${e.avatar}" width="32" height="32" style="border-radius:50%;vertical-align:middle;margin-right:8px">`
      : `<span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#334155;vertical-align:middle;margin-right:8px"></span>`;
    return `<tr>
      <td>${avatar}${e.name ?? '—'}</td>
      <td style="color:#94a3b8;font-size:12px">${e.discordId}</td>
      <td>${date} <span style="color:#64748b">${time} UTC</span></td>
      <td>${status}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JWA Dinodex — Login Audit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px 24px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    p.sub { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #64748b; border-bottom: 1px solid #1e293b; }
    td { padding: 10px 14px; border-bottom: 1px solid #1e293b; vertical-align: middle; }
    tr:hover td { background: #1e293b55; }
    .empty { text-align: center; padding: 48px; color: #475569; }
  </style>
</head>
<body>
  <h1>Login Audit</h1>
  <p class="sub">${entries.length} user${entries.length !== 1 ? 's' : ''} · sorted by most recent login</p>
  <table>
    <thead>
      <tr>
        <th>User</th>
        <th>Discord ID</th>
        <th>Last Login</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="4" class="empty">No entries yet.</td></tr>`}
    </tbody>
  </table>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
