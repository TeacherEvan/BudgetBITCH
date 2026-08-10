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

export interface UseLineLink {
  status: LinkStatus;
  error: string | null;
  lineUserId: string | null;
  link: () => Promise<void>;
}

/**
 * Links the current authenticated Convex user to their LINE account.
 *
 * Loads the LIFF SDK, initializes it with NEXT_PUBLIC_LINE_LIFF_ID, and — if
 * the user is not yet logged in to LINE — triggers the LIFF login redirect.
 * Once logged in, it reads the LINE user id from the profile and calls the
 * `linkLineAccount` mutation so the receipt-bot webhook can later resolve
 * uploads to this user.
 */
export function useLineLink(accountId?: string): UseLineLink {
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const linkMutation = useMutation(api.line.linkLineAccount);
  const linkingRef = useRef(false);

  const link = useCallback(async () => {
    if (linkingRef.current) return;
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (!liffId) {
      setStatus('error');
      setError('LINE is not configured on this build.');
      return;
    }
    linkingRef.current = true;
    setStatus('loading');
    setError(null);
    try {
      await loadLiffSdk();
      if (!window.liff) throw new Error('LIFF SDK unavailable');
      await window.liff.init({ liffId });

      // Not authenticated with LINE yet → kick off the OAuth redirect.
      // `login()` performs a full page navigation, so we stop here.
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }

      const profile = await window.liff.getProfile();
      if (!profile?.userId) {
        throw new Error('Could not read LINE user id');
      }
      setLineUserId(profile.userId);
      await linkMutation({ lineUserId: profile.userId, accountId });
      setStatus('linked');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to link LINE account');
    } finally {
      linkingRef.current = false;
    }
  }, [accountId, linkMutation]);

  // Reset transient state if the component unmounts mid-flow.
  useEffect(() => {
    return () => {
      linkingRef.current = false;
    };
  }, []);

  return { status, error, lineUserId, link };
}
