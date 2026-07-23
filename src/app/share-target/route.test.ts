import { NextRequest } from 'next/server';
import { POST } from './route';

function buildPost(body: BodyInit): NextRequest {
  return new NextRequest('http://localhost/share-target', {
    method: 'POST',
    body,
  });
}

describe('share-target route (PWA Web Share Target)', () => {
  it('redirects multipart form "text" to /sms-confirm with encoded text', async () => {
    const fd = new FormData();
    fd.set('text', 'KBANK 200 baht at Tesco');
    const res = await POST(buildPost(fd));

    expect(res.status).toBe(303);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/sms-confirm?text=');
    expect(decodeURIComponent(location)).toContain('KBANK 200 baht at Tesco');
  });

  it('falls back to "url" field when "text" is empty', async () => {
    const fd = new FormData();
    fd.set('url', 'SCB msg: 150 THB received');
    const res = await POST(buildPost(fd));

    expect(res.status).toBe(303);
    const location = decodeURIComponent(res.headers.get('location') ?? '');
    expect(location).toContain('SCB msg: 150 THB received');
  });

  it('encodes safely so the redirect target stays a valid single query param', async () => {
    const fd = new FormData();
    fd.set('text', 'a&b=c?d#e');
    const res = await POST(buildPost(fd));
    const location = res.headers.get('location') ?? '';
    // The whole SMS must be one encoded value, not break the query string.
    expect(location).toBe(`http://localhost/sms-confirm?text=${encodeURIComponent('a&b=c?d#e')}`);
  });
});
