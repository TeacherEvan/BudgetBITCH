"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

type ConvexPasswordAuthFormProps = {
  flow: "signIn" | "signUp";
  redirectTo: string;
  submitLabel: string;
  emailLabel: string;
  passwordLabel: string;
  helperText: string;
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
        router.push(`/auth/continue?redirectTo=${encodeURIComponent(redirectTo)}`);
        router.refresh();
        return;
      }

      setError("Check your email and password, then try again.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
