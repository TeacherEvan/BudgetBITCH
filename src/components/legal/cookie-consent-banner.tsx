"use client";

import { useSyncExternalStore, useState } from "react";
import { useAuthToken } from "@convex-dev/auth/react";
import { useLocale } from "next-intl";
import { shortLocale, COOKIE_POLICY_VERSION } from "@/lib/legal/versions";

const STORAGE_KEY = "budgetbitch:cookieConsent";

type StoredChoice = {
  accepted: boolean;
  optionalAccepted: boolean;
  version: string;
};

const COPY = {
  en: {
    title: "Cookies",
    body: "We use essential cookies to keep you signed in and remember your settings. Optional cookies help us improve the app. See our",
    acceptAll: "Accept all",
    essentialOnly: "Essential only",
    cookiePolicy: "Cookie Policy",
  },
  th: {
    title: "คุกกี้",
    body: "เราใช้คุกกี้ที่จำเป็นเพื่อคงสถานะการเข้าสู่ระบบและจดจำการตั้งค่าของคุณ คุกกี้แบบเลือกได้ช่วยให้เราปรับปรุงแอป ดู",
    acceptAll: "ยอมรับทั้งหมด",
    essentialOnly: "เฉพาะที่จำเป็น",
    cookiePolicy: "นโยบายคุกกี้",
  },
};

function readStored(): StoredChoice | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredChoice;
  } catch {
    return null;
  }
}

function isBannerVisible(): boolean {
  const stored = readStored();
  // Show only when no choice exists, or the policy version changed.
  return !stored || stored.version !== COOKIE_POLICY_VERSION;
}

// Noop subscribe: banner visibility is derived from localStorage in the client
// snapshot and toggled locally via `hidden` once the user makes a choice.
const noopSubscribe = () => () => {};

export function CookieConsentBanner() {
  const localeRaw = useLocale();
  const locale = shortLocale(localeRaw);
  const copy = COPY[locale];
  // Optional: forwarded to the relay only when a user is signed in. Anonymous
  // visitors stay anonymous (the relay leaves userId undefined).
  const authToken = useAuthToken();

  // Server and first client render both show nothing (no banner) so the HTML
  // matches; the real visibility is decided after mount from localStorage.
  // useSyncExternalStore reads localStorage in the client snapshot and returns
  // false on the server snapshot, avoiding a React #418 hydration mismatch
  // without calling setState synchronously inside an effect.
  const [hidden, setHidden] = useState(false);
  const needsConsent = useSyncExternalStore(
    noopSubscribe,
    isBannerVisible,
    () => false,
  );
  const visible = needsConsent && !hidden;

  function persist(accepted: boolean, optionalAccepted: boolean) {
    const choice: StoredChoice = {
      accepted,
      optionalAccepted,
      version: COOKIE_POLICY_VERSION,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
      // Non-fatal: consent UX must not break if storage is unavailable.
    }
    setHidden(true);

    // Fire-and-forget server record via the relay. The relay captures the real
    // client IP server-side (Convex mutations can't see the request). Never
    // block the consent UI on a telemetry failure.
    void fetch("/api/legal/record-cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accepted,
        optionalAccepted,
        version: COOKIE_POLICY_VERSION,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        token: authToken ?? undefined,
      }),
    }).catch(() => {
      /* intentionally ignored */
    });
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={copy.title}
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-amber-400/60 bg-zinc-950/95 px-4 py-4 backdrop-blur-xl pointer-events-none sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white">{copy.title}.</span>{" "}
          {copy.body}{" "}
          <a
            href="/cookie-policy"
            className="font-semibold text-amber-400 underline hover:text-amber-300"
          >
            {copy.cookiePolicy}
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => persist(true, false)}
            className="bb-button-secondary pointer-events-auto px-4 py-2 text-sm font-semibold"
          >
            {copy.essentialOnly}
          </button>
          <button
            type="button"
            onClick={() => persist(true, true)}
            className="bb-button-primary pointer-events-auto px-4 py-2 text-sm font-semibold"
          >
            {copy.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
