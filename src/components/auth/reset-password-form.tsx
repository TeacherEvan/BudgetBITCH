"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useLocale } from "next-intl";
import { shortLocale } from "@/lib/legal/versions";
import { AUTH_ROUTES } from "@/lib/auth/routes";

const COPY = {
  en: {
    title: "Choose a new password",
    emailLabel: "Email address",
    codeLabel: "Reset code from your email",
    passwordLabel: "New password",
    submit: "Reset password",
    success: "Password updated. Redirecting you to sign in…",
    goBack: "Back to sign in",
    invalid:
      "That code is invalid or expired. Request a new reset email from the sign-in screen.",
    generic: "Could not reset your password. Please try again.",
  },
  th: {
    title: "ตั้งรหัสผ่านใหม่",
    emailLabel: "ที่อยู่อีเมล",
    codeLabel: "รหัสรีเซ็ตจากอีเมลของคุณ",
    passwordLabel: "รหัสผ่านใหม่",
    submit: "ตั้งรหัสผ่านใหม่",
    success: "อัปเดตรหัสผ่านแล้ว กำลังนำคุณไปยังหน้าเข้าสู่ระบบ…",
    goBack: "กลับไปหน้าเข้าสู่ระบบ",
    invalid: "รหัสไม่ถูกต้องหรือหมดอายุ ให้ขออีเมลรีเซ็ตใหม่จากหน้าเข้าสู่ระบบ",
    generic: "ไม่สามารถรีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง",
  },
  zh: {
    title: "设置新密码",
    emailLabel: "电子邮箱",
    codeLabel: "邮件中的重置验证码",
    passwordLabel: "新密码",
    submit: "重置密码",
    success: "密码已更新，正在跳转到登录页…",
    goBack: "返回登录",
    invalid: "验证码无效或已过期。请在登录页重新请求重置邮件。",
    generic: "无法重置密码，请重试。",
  },
} as const;

type ResetPasswordFormProps = {
  email?: string;
  code?: string;
};

export function ResetPasswordForm({ email = "", code = "" }: ResetPasswordFormProps) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const localeRaw = useLocale();
  const locale = shortLocale(localeRaw) as keyof typeof COPY;
  const copy = COPY[locale];

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("flow", "reset-verification");
      await signIn("password", formData);
      setSuccess(true);
      // Convex Auth signs the user in after a successful reset; the provider
      // clears the code from the URL. Send them back to the dashboard.
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (caughtError) {
      const msg =
        caughtError instanceof Error ? caughtError.message.toLowerCase() : "";
      if (msg.includes("invalid code") || msg.includes("invalid")) {
        setError(copy.invalid);
      } else {
        setError(copy.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div
        className="relative w-full max-w-md rounded-3xl border p-8"
        style={{
          borderColor: "rgba(255, 215, 0, 0.15)",
          background:
            "linear-gradient(145deg, rgba(16, 24, 23, 0.8) 0%, rgba(10, 15, 14, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}
      >
        <span
          className="text-xl font-bold uppercase tracking-[0.2em]"
          style={{
            background: "linear-gradient(90deg, #FFD700, #FFF9C4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Budget-BOSS
        </span>

        <h1 className="mt-6 text-2xl font-bold text-white">{copy.title}</h1>

        {success ? (
          <p className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            {copy.success}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label className="grid gap-2 text-sm font-semibold text-white" htmlFor="reset-email">
              {copy.emailLabel}
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={email}
                required
                className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus:border-(--accent-strong) focus:ring-2 focus:ring-(--accent-strong)/35"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white" htmlFor="reset-code">
              {copy.codeLabel}
              <input
                id="reset-code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                defaultValue={code}
                required
                className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus:border-(--accent-strong) focus:ring-2 focus:ring-(--accent-strong)/35"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white" htmlFor="reset-password">
              {copy.passwordLabel}
              <input
                id="reset-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
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

            <button
              type="submit"
              className="bb-button-primary mt-2 w-full justify-center md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Working..." : copy.submit}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-sm">
          <button
            type="button"
            onClick={() => router.push(AUTH_ROUTES.signIn)}
            className="font-semibold text-amber-400 hover:underline cursor-pointer"
          >
            {copy.goBack}
          </button>
        </div>
      </div>
    </div>
  );
}
