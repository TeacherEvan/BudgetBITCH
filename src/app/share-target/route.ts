// app/share-target/route.ts
// PWA Web Share Target endpoint. The manifest declares `share_target` with a
// POST to this route; Android's share sheet posts multipart/form-data and we
// forward the SMS text to the confirm page via a 303 redirect (GET) so the
// result is shareable / refresh-safe and never re-POSTed on reload.
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let text = '';

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = await request.formData();
    text = (params.get('text') as string) || (params.get('url') as string) || '';
  } else {
    // multipart/form-data (default for share_target) or anything else
    try {
      const params = await request.formData();
      text = (params.get('text') as string) || (params.get('url') as string) || '';
    } catch {
      text = '';
    }
  }

  const trimmed = text.trim();
  const target = trimmed
    ? `/sms-confirm?text=${encodeURIComponent(trimmed)}`
    : '/sms-confirm';

  return NextResponse.redirect(new URL(target, request.url), 303);
}
