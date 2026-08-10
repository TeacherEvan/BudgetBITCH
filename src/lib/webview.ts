// Detection of in-app webviews (LINE, WhatsApp, Facebook, Instagram, LinkedIn,
// Slack, Telegram, etc.). These render pages in a trimmed-down WebView that
// commonly blocks or drops the HTTP cookies Convex Auth uses for sessions, so
// sign-in loops or silently fails. We surface a "open in browser" escape hatch
// instead of letting the user get stuck.

export function detectWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";

  // LINE
  if (/Line\//i.test(ua)) return true;
  // WhatsApp
  if (/WhatsApp/i.test(ua)) return true;
  // Facebook / Instagram in-app browser
  if (/FBAN|FBAV|Instagram/i.test(ua)) return true;
  // LinkedIn
  if (/LinkedInApp/i.test(ua)) return true;
  // Telegram
  if (/Telegram/i.test(ua)) return true;
  // Slack
  if (/\bSlack\b/i.test(ua) && /WebView|AppleWebKit/i.test(ua)) return true;
  // Generic webview markers (but not full Chrome/Safari which also carry them)
  if (/\bWebView\b/i.test(ua) && !/\bChrome\//i.test(ua) && !/\bFxiOS\b/i.test(ua)) {
    return true;
  }

  return false;
}

// Best-effort "open in external browser" URL. Most webviews honor the
// universal-link / intent via location change; some need the user to tap.
export function getOpenInBrowserUrl(currentUrl?: string): string {
  if (currentUrl) return currentUrl;
  if (typeof window !== "undefined") return window.location.href;
  return "https://budgetbitch.app";
}

// Build an Android `intent://` deep link that forces a URL to open in the
// device's external (system) browser, escaping the host app's in-app WebView.
// This is the exact mechanism chat apps (LINE, WhatsApp, Telegram, Facebook,
// Instagram) use when they "open this in your browser". Returns null when the
// runtime is not an Android WebView (e.g. iOS has no equivalent — callers
// fall back to the share sheet there).
export function buildExternalBrowserIntent(url: string): string | null {
  if (typeof navigator === "undefined") return null;
  if (!/Android/i.test(navigator.userAgent)) return null;
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return null;

  try {
    const u = new URL(url);
    const path = u.pathname + u.search + u.hash || "/";
    const scheme = u.protocol.replace(":", ""); // "https"
    // intent://<host><path>#Intent;scheme=https;action=android.intent.action.VIEW;end
    return `intent://${u.host}${path}#Intent;scheme=${scheme};action=android.intent.action.VIEW;end`;
  } catch {
    return null;
  }
}

// Open the given URL in the real external browser where the platform allows.
// - Android in-app WebView: `intent://` deep link escapes to the default browser.
// - Elsewhere: best-effort location change (may reload in-place; the user can
//   also use the share/sheet menu to open in Safari/Chrome).
export function openInExternalBrowser(url: string): void {
  if (typeof window === "undefined") return;
  const intent = buildExternalBrowserIntent(url);
  window.location.href = intent ?? url;
}
