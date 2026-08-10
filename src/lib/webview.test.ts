import { describe, it, expect } from "vitest";
import {
  detectWebView,
  buildExternalBrowserIntent,
  openInExternalBrowser,
  getOpenInBrowserUrl,
} from "./webview";

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

describe("detectWebView", () => {
  it("flags LINE, WhatsApp, Telegram and Instagram in-app browsers", () => {
    setUserAgent("Mozilla/5.0 (Linux) Line/14.0");
    expect(detectWebView()).toBe(true);
    setUserAgent("WhatsApp/2.0");
    expect(detectWebView()).toBe(true);
    setUserAgent("Telegram/5.0");
    expect(detectWebView()).toBe(true);
    setUserAgent("Instagram 220.0");
    expect(detectWebView()).toBe(true);
  });

  it("does not flag a normal Chrome/Safari browser", () => {
    setUserAgent(
      "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    );
    expect(detectWebView()).toBe(false);
  });
});

describe("buildExternalBrowserIntent", () => {
  it("returns an intent:// deep link on Android", () => {
    setUserAgent("Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile");
    const intent = buildExternalBrowserIntent("https://budgetbitch.app/dashboard?x=1#top");
    expect(intent).toBe(
      "intent://budgetbitch.app/dashboard?x=1#top#Intent;scheme=https;action=android.intent.action.VIEW;end",
    );
  });

  it("returns null on iOS (no equivalent escape mechanism)", () => {
    setUserAgent("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148");
    expect(buildExternalBrowserIntent("https://budgetbitch.app")).toBeNull();
  });

  it("falls back to / when the URL has no path", () => {
    setUserAgent("Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile");
    const intent = buildExternalBrowserIntent("https://budgetbitch.app");
    expect(intent).toContain("intent://budgetbitch.app/#Intent");
  });
});

describe("openInExternalBrowser", () => {
  it("navigates to the intent URL on Android webview", () => {
    setUserAgent("Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile");
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
    openInExternalBrowser("https://budgetbitch.app/dashboard");
    expect(window.location.href).toBe(
      "intent://budgetbitch.app/dashboard#Intent;scheme=https;action=android.intent.action.VIEW;end",
    );
  });

  it("falls back to the plain URL when no intent is available (iOS)", () => {
    setUserAgent("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148");
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
    openInExternalBrowser("https://budgetbitch.app/dashboard");
    expect(window.location.href).toBe("https://budgetbitch.app/dashboard");
  });
});

describe("getOpenInBrowserUrl", () => {
  it("prefers the explicit url argument", () => {
    expect(getOpenInBrowserUrl("https://budgetbitch.app/x")).toBe(
      "https://budgetbitch.app/x",
    );
  });
});
