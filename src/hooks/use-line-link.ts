import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

type LinkStatus = 'idle' | 'loading' | 'linked' | 'error';

// LIFF web SDK is loaded on demand from LINE's CDN (no extra npm dependency —
// `@line/liff` is intentionally NOT added to package.json). It attaches a
// `liff` object to the global scope.
declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      getProfile: () => Promise<{ userId: string; displayName: string }>;
      isLoggedIn: () => boolean;
      login: (options?: { redirectUri?: string }) => void;
    };
  }
}

const LIFF_SDK_URL = 'https://static.line-systems.com/libs/liff/2.25.0/sdk.js';

function loadLiffSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.liff) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${LIFF_SDK_URL}"]`,
    );
    if (existing) {
      // Already loading/loaded; wait for it to be ready.
      const check = setInterval(() => {
        if (window.liff) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error('LIFF SDK failed to initialize'));
      }, 10000);
      return;
    }
    const script = document.createElement('script');
    script.src = LIFF_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
    document.head.appendChild(script);
  });
}

/** Map the W3 ConvexError messages to actionable UI copy. The client wraps the
 * thrown string in a ConvexError whose `data`/`message` is that exact string. */
function linkErrorMessage(err: unknown): string {
  const data = (err as { data?: unknown } | null)?.data;
  const raw =
    typeof data === 'string'
      ? data
      : err instanceof Error
        ? err.message
        : String(err);
  const message = raw.replace(/^ConvexError:\s*/, '').trim();
  switch (message) {
    case 'LINE link code is required':
      return 'Enter the code the LINE bot sent you before linking.';
    case 'Invalid or expired LINE link code':
      return 'That code is invalid or has expired. Ask the LINE bot for a new one.';
    case 'This LINE account is already linked to another user':
      return 'This LINE account is already linked to another user.';
    case 'Authentication required':
      return 'Please sign in before linking your LINE account.';
    case 'app: LINE user IDs are internal and cannot be linked':
      return 'This LINE identity cannot be linked.';
    case 'Account not found':
      return 'The selected account could not be found.';
    case 'You are not authorized for this account':
      return 'You are not authorized for this account.';
    default:
      return message || 'Failed to link LINE account';
  }
}

export interface UseLineLink {
  status: LinkStatus;
  error: string | null;
  lineUserId: string | null;
  /** Manual, single-use code delivered to the user by the LINE bot. */
  code: string;
  setCode: (code: string) => void;
  /** LIFF login + profile discovery. Reveals the code entry once successful. */
  start: () => Promise<void>;
  /** Submit the entered code to `linkLineAccount`. */
  link: () => Promise<void>;
}

/**
 * Links the current authenticated Convex user to their LINE account.
 *
 * `start()` loads the LIFF SDK, initializes it with NEXT_PUBLIC_LINE_LIFF_ID,
 * and — if the user is not yet logged in to LINE — triggers the LIFF login
 * redirect. Once logged in it reads the LINE user id from the profile; the app
 * then shows a manual code entry because the one-time code is issued by the
 * external LINE bot and cannot be delivered to the browser without exposing
 * the bot's shared secret. `link()` submits that code to `linkLineAccount`.
 *
 * The Convex user id is resolved server-side from auth — never taken from args.
 */
export function useLineLink(accountId?: string): UseLineLink {
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const linkMutation = useMutation(api.line.linkLineAccount);
  const linkingRef = useRef(false);

  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  /** Returns the LINE user id, or null when a login redirect was initiated. */
  const readProfile = useCallback(async (liffId: string): Promise<string | null> => {
    await loadLiffSdk();
    if (!window.liff) throw new Error('LIFF SDK unavailable');
    await window.liff.init({ liffId });

    // Not authenticated with LINE yet → kick off the OAuth redirect.
    // `login()` performs a full page navigation, so we stop here.
    if (!window.liff.isLoggedIn()) {
      window.liff.login();
      return null;
    }

    const profile = await window.liff.getProfile();
    if (!profile?.userId) throw new Error('Could not read LINE user id');
    return profile.userId;
  }, []);

  const guard = useCallback((): boolean => {
    if (linkingRef.current) return false;
    if (!liffId) {
      setStatus('error');
      setError('LINE is not configured on this build.');
      return false;
    }
    linkingRef.current = true;
    setStatus('loading');
    setError(null);
    return true;
  }, [liffId]);

  // Phase 1: log in to LINE and discover the LINE user id. No mutation is
  // attempted — the user still needs the bot-issued code.
  const start = useCallback(async () => {
    if (!guard() || !liffId) return;
    try {
      const profileUserId = await readProfile(liffId);
      if (!profileUserId) return; // login redirect in progress
      setLineUserId(profileUserId);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(linkErrorMessage(err));
    } finally {
      linkingRef.current = false;
    }
  }, [guard, liffId, readProfile]);

  // Phase 2: submit the code the user copied from the LINE bot. The profile is
  // re-read so this remains safe after a login redirect / page remount.
  const link = useCallback(async () => {
    if (!guard() || !liffId) return;
    try {
      const profileUserId = await readProfile(liffId);
      if (!profileUserId) return; // login redirect in progress
      setLineUserId(profileUserId);

      const trimmedCode = code.trim();
      if (!trimmedCode) {
        setStatus('error');
        setError('Enter the code the LINE bot sent you before linking.');
        return;
      }

      await linkMutation({
        lineUserId: profileUserId,
        code: trimmedCode,
        accountId,
      });
      setStatus('linked');
    } catch (err) {
      setStatus('error');
      setError(linkErrorMessage(err));
    } finally {
      linkingRef.current = false;
    }
  }, [accountId, code, guard, liffId, linkMutation, readProfile]);

  // Reset transient state if the component unmounts mid-flow.
  useEffect(() => {
    return () => {
      linkingRef.current = false;
    };
  }, []);

  return { status, error, lineUserId, code, setCode, start, link };
}
