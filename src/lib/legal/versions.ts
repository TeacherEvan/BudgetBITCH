// Single source of truth for legal policy versions.
// Bump these strings when the corresponding policy text changes, and the
// sign-up consent flow + legal pages stay aligned automatically.

export const TERMS_VERSION = "2026-07-23";
export const PRIVACY_VERSION = "2026-07-23";
export const COOKIE_POLICY_VERSION = "2026-07-19";

// Effective date shown on the legal pages (human-readable, ISO date).
export const LEGAL_EFFECTIVE_DATE = "2026-07-19";

export type AppLocale = "en" | "es" | "fr" | "de" | "pt" | "zh";

// Legal copy is only authored in English; every other locale falls back to
// English at render time.
export type LegalLocale = "en";

export function shortLocale(_locale: string | undefined | null): LegalLocale {
  void _locale;
  // All locales fall back to English for legal copy.
  return "en";
}
