'use client';

import { useEffect } from 'react';
import { isNative } from '@/lib/native';

const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.matches(EDITABLE_SELECTOR)) return true;
  // Nested node inside a contenteditable container.
  return target.closest(EDITABLE_SELECTOR) !== null;
}

function requestFullscreenIfPossible(): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const fn = el.requestFullscreen?.bind(el);
  if (!fn || document.fullscreenElement) return;
  try {
    void fn({ navigationUI: 'hide' }).catch(() => {
      /* rejected: no fresh gesture, or embedded webview blocks it */
    });
  } catch {
    /* unsupported */
  }
}

/**
 * Forces an immersive, kiosk-like app surface:
 *  - requests the Fullscreen API on the first user gesture (web/PWA build only;
 *    the native Capacitor shell is already full-bleed via NativeBridge)
 *  - re-requests fullscreen if the OS/browser drops it while the tab is visible
 *  - blocks long-press text selection, the iOS callout, and the context menu on
 *    non-editable content (globals.css handles the CSS side)
 */
export function ImmersiveShell() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isNative()) return; // native shell already owns the full screen

    const onFirstGesture = () => {
      requestFullscreenIfPossible();
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture, { passive: true });
    window.addEventListener('touchstart', onFirstGesture, { passive: true });

    let lastReentry = 0;
    const onFullscreenChange = () => {
      if (document.fullscreenElement) return;
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastReentry < 800) return; // throttle re-requests
      lastReentry = now;
      requestFullscreenIfPossible();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Block highlight/callout on non-editable content (belt-and-suspenders for
    // Android webviews where CSS user-select alone sometimes still selects).
    const blockNonEditable = (e: Event) => {
      if (!isEditableTarget(e.target)) e.preventDefault();
    };
    document.addEventListener('contextmenu', blockNonEditable);
    document.addEventListener('selectstart', blockNonEditable);
    document.addEventListener('dragstart', blockNonEditable);

    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', blockNonEditable);
      document.removeEventListener('selectstart', blockNonEditable);
      document.removeEventListener('dragstart', blockNonEditable);
    };
  }, []);

  return null;
}
