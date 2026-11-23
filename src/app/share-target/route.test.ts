import { NextRequest } from 'next/server';
import { vi } from 'vitest';
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

  // Regression guards for P3-C2. FormData.get() returns string | File | null:
  // casting a File part to string makes text.trim() throw (500), and an
  // unbounded string makes the redirect Location unbounded.
  it('redirects to the bare page when the shared value is a File part', async () => {
    const req = new NextRequest('http://localhost/share-target', { method: 'POST' });
    const filePart = new Blob(['binary-payload']) as File;
    // jsdom's Request.formData() throws on multipart bodies, so stub it with a
    // real File value to exercise the exact cast bug.
    vi.spyOn(req, 'formData').mockResolvedValue({
      get: () => filePart,
    } as unknown as FormData);

    const res = await POST(req);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('http://localhost/sms-confirm');
  });

  it('caps oversized shared text so the redirect Location stays bounded', async () => {
    const fd = new FormData();
    fd.set('text', 'x'.repeat(10_000));
    const res = await POST(buildPost(fd));
    const location = res.headers.get('location') ?? '';
    expect(res.status).toBe(303);
    expect(location.length).toBeLessThan(5_000);
  });
});
