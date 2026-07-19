"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useLocale } from "next-intl";
import type { FormEvent } from "react";
import { useState } from "react";
import { shortLocale } from "@/lib/legal/versions";

const COPY = {
  en: {
    title: "Reset your password",
    description:
      "Enter the email for your BudgetBITCH account and we'll send a reset code.",
    emailLabel: "Email address",
    submit: "Send reset code",
    sent: "If that email exists, a reset code is on its way. Check your inbox (and spam).",
    backToSignIn: "Back to sign in",
    generic: "Could not send the reset email. Please try again.",
  },
  th: {
    title: "รีเซ็ตรหัสผ่าน",
    description: "ป้อนอีเมลของบัญชี BudgetBITCH ของคุณ เราจะส่งรหัสรีเซ็ตให้",
    emailLabel: "ที่อยู่อีเมล",
    submit: "ส่งรหัสรีเซ็ต",
    sent: "หากอีเมลนี้มีในระบบ รหัสรีเซ็ตจะถูกส่งไปแล้ว ตรวจสอบกล่องจดหมาย (และสแปม)",
    backToSignIn: "กลับไปหน้าเข้าสู่ระบบ",
    generic: "ไม่สามารถส่งอีเมลรีเซ็ตได้ โปรดลองอีกครั้ง",
  },
  zh: {
    title: "重置密码",
    description: "输入你的 BudgetBITCH 账户邮箱，我们会发送重置验证码。",
    emailLabel: "电子邮箱",
    submit: "发送验证码",
    sent: "如果该邮箱存在，重置验证码已发出。请查收收件箱（及垃圾邮件）。",
    backToSignIn: "返回登录",
    generic: "无法发送重置邮件，请重试。",
  },
} as const;

type ForgotPasswordFormProps = {
  onBack: () => void;
};

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { signIn } = useAuthActions();
  const localeRaw = useLocale();
  const locale = shortLocale(localeRaw) as keyof typeof COPY;
  const copy = COPY[locale];

  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("flow", "reset");
      // We always surface the generic "sent" message so we don't reveal
      // whether an email is registered.
      await signIn("password", formData).catch(() => undefined);
      setSent(true);
    } catch {
      setError(copy.generic);
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
          BudgetBITCH
        </span>

        <h1 className="mt-6 text-2xl font-bold text-white">{copy.title}</h1>
        <p className="mt-2 text-sm text-emerald-200/60">{copy.description}</p>

        {sent ? (
          <p className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            {copy.sent}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label className="grid gap-2 text-sm font-semibold text-white" htmlFor="forgot-email">
              {copy.emailLabel}
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
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
            onClick={onBack}
            className="font-semibold text-amber-400 hover:underline cursor-pointer"
          >
            {copy.backToSignIn}
          </button>
        </div>
      </div>
    </div>
  );
}
