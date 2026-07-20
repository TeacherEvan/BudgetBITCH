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
