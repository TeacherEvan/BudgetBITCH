"use client";

import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useLocale } from "next-intl";
import { shortLocale } from "@/lib/legal/versions";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/lib/legal/versions";

type ConvexPasswordAuthFormProps = {
  flow: "signIn" | "signUp";
  redirectTo: string;
  submitLabel: string;
  emailLabel: string;
  passwordLabel: string;
  helperText: string;
};

const LEGAL_COPY = {
  en: {
    acceptTerms:
      "I have read and accept the {terms} and {privacy}.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
  },
  th: {
    acceptTerms: "ฉันได้อ่านและยอมรับ{terms}และ{privacy}",
    terms: "ข้อกำหนดการให้บริการ",
    privacy: "นโยบายความเป็นส่วนตัว",
  },
};

export function ConvexPasswordAuthForm({
  flow,
  redirectTo,
  submitLabel,
  emailLabel,
  passwordLabel,
  helperText,
}: ConvexPasswordAuthFormProps) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const localeRaw = useLocale();
  const locale = shortLocale(localeRaw);
  const legalCopy = LEGAL_COPY[locale];
  const authToken = useAuthToken();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Sign-up requires explicit acceptance of Terms + Privacy.
    if (flow === "signUp" && !acceptedTerms) {
      setError(
        locale === "th"
          ? "กรุณายอมรับข้อกำหนดการให้บริการและนโยบายความเป็นส่วนตัว"
          : "Please accept the Terms of Service and Privacy Policy.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("flow", flow);
      const result = await signIn("password", formData);

      if (result.redirect) {
        window.location.href = result.redirect.toString();
        return;
      }

      if (result.signingIn) {
        // Record the legal acceptance server-side. We route through the
        // /api/legal/record-agreement relay so the client IP is captured from
        // the real request header (the Convex mutation itself cannot see it).
        // The token is forwarded because Convex Auth uses localStorage storage,
        // so the server cannot read the fresh sign-up token on its own.
        if (flow === "signUp") {
          let tokenToUse = authToken;
          if (!tokenToUse && typeof window !== "undefined") {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("__convexAuthJWT_")) {
                tokenToUse = localStorage.getItem(key);
                break;
              }
            }
          }

          try {
            const res = await fetch("/api/legal/record-agreement", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                termsVersion: TERMS_VERSION,
                privacyVersion: PRIVACY_VERSION,
                userAgent:
                  typeof navigator !== "undefined"
                    ? navigator.userAgent
                    : undefined,
                token: tokenToUse ?? "",
              }),
            });
            if (!res.ok) {
              // Do NOT redirect on failure — surface and let the user retry.
              // The acceptance record is audit evidence, not a blocker, but
              // silent loss is worse than a visible error.
              const detail = await res
                .json()
                .then((d) => d?.error)
                .catch(() => undefined);
              setError(
                detail
                  ? `Could not save your acceptance: ${detail}`
                  : "Could not save your acceptance. Please try again.",
              );
              setIsSubmitting(false);
              return;
            }
          } catch {
            setError("Could not save your acceptance. Please try again.");
            setIsSubmitting(false);
            return;
          }
        }
        router.push(redirectTo);
        router.refresh();
        return;
      }

      setError("Check your email and password, then try again.");
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        const msg = caughtError.message.toLowerCase();
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          setError("An account with this email already exists.");
        } else if (
          // The Convex Auth Next.js proxy masks every auth error (incl. a normal
          // wrong-password) as a generic "Server Error" / MIDDLEWARE_INVOCATION_FAILED
          // 500. Surface a friendly credential hint instead of the raw proxy message.
          msg.includes("server error") ||
          msg.includes("middleware_invocation_failed") ||
          msg.includes("middleware invocation failed")
        ) {
          setError("Check your email and password, then try again.");
        } else {
          setError(caughtError.message);
        }
      } else {
        setError("Check your email and password, then try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const termsLink = (
    <a
      key="terms"
      href="/terms"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-amber-400 underline hover:text-amber-300"
    >
      {legalCopy.terms}
    </a>
  );
  const privacyLink = (
    <a
      key="privacy"
      href="/privacy"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-amber-400 underline hover:text-amber-300"
    >
      {legalCopy.privacy}
    </a>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="grid gap-2 text-sm font-semibold text-white" htmlFor={`${flow}-email`}>
        {emailLabel}
        <input
          id={`${flow}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus:border-(--accent-strong) focus:ring-2 focus:ring-(--accent-strong)/35"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-white" htmlFor={`${flow}-password`}>
        {passwordLabel}
        <input
          id={`${flow}-password`}
          name="password"
          type="password"
          autoComplete={flow === "signUp" ? "new-password" : "current-password"}
          minLength={8}
          required
          className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus:border-(--accent-strong) focus:ring-2 focus:ring-(--accent-strong)/35"
        />
      </label>

      {flow === "signUp" ? (
        <label className="mt-1 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/80">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-(--accent-strong)"
            required
          />
          <span>
            {locale === "th"
              ? legalCopy.acceptTerms
                  .replace("{terms}", legalCopy.terms)
                  .replace("{privacy}", legalCopy.privacy)
              : "I have read and accept the "}
            {locale === "th" ? null : termsLink}
            {locale === "th" ? null : " and "}
            {locale === "th" ? null : privacyLink}
            {locale === "th" ? null : "."}
          </span>
        </label>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="bb-button-primary w-full justify-center md:w-auto" disabled={isSubmitting}>
        {isSubmitting ? "Working..." : submitLabel}
      </button>
      <p className="bb-mini-copy text-sm">{helperText}</p>
    </form>
  );
}
