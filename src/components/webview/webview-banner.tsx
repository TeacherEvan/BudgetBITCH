"use client";

import { useSyncExternalStore, useState } from "react";
import { detectWebView } from "@/lib/webview";

const DISMISS_KEY = "bb:webview-banner-dismissed";

function subscribe() {
  // No external events drive this; computed once on mount.
  return () => {};
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  if (!detectWebView()) return false;
  if (sessionStorage.getItem(DISMISS_KEY) === "true") return false;
  return true;
}

// Shown only inside in-app webviews (LINE, WhatsApp, etc.) where cookie-based
// auth can't persist. Gives the user a reliable way to open the real app in
// their full browser. Non-blocking: the page still renders underneath.
//
// `show` comes from useSyncExternalStore so it is computed on the client after
// mount (server snapshot is false) — no hydration mismatch and no setState in
// an effect (which the React Compiler lint forbids). `dismissed` is toggled in
// a click handler, not an effect, so it stays lint-clean.
export function WebViewBanner() {
  const show = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  const openInBrowser = () => {
    const url = window.location.href;
    // Try to break out to the external browser. Webviews without a native
    // "open in browser" affordance will simply reload here; the user can also
    // use the share/sheet menu to open in Safari/Chrome.
    window.location.href = url;
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-black">
      <p className="mb-1">
        For the full BudgetBITCH experience (including sign-in), open this page
        in your browser.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={openInBrowser}
          className="rounded bg-black px-3 py-1 text-xs font-bold text-amber-400"
        >
          Open in browser
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, "true");
            setDismissed(true);
          }}
          className="text-xs underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
