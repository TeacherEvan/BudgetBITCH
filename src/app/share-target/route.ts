// app/share-target/route.ts
// PWA Web Share Target endpoint. The manifest declares `share_target` with a
// POST to this route; Android's share sheet posts multipart/form-data and we
// forward the SMS text to the confirm page via a 303 redirect (GET) so the
// result is shareable / refresh-safe and never re-POSTed on reload.
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Shared values become part of the redirect Location, so cap them to keep the
// URL bounded. A `File` part is not a valid shared text value and must not be
// cast to string — trimming it used to throw and return a 500.
const MAX_SHARED_TEXT_LENGTH = 4096;

export async function POST(request: NextRequest) {
  let text = '';

  try {
    // Both urlencoded and multipart share posts are parsed by formData(); the
    // original content-type branch was redundant and both paths did the same.
    const params = await request.formData();
    const raw = params.get('text') ?? params.get('url');
    text = typeof raw === 'string' ? raw.slice(0, MAX_SHARED_TEXT_LENGTH) : '';
  } catch {
    text = '';
  }

  const trimmed = text.trim();
  const target = trimmed
    ? `/sms-confirm?text=${encodeURIComponent(trimmed)}`
    : '/sms-confirm';

  return NextResponse.redirect(new URL(target, request.url), 303);
}
