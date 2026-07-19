"use client";

import { useState } from "react";
import { ConvexPasswordAuthForm } from "./convex-password-auth-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

type CleanAuthCardProps = {
  initialFlow: "signIn" | "signUp";
  redirectTo?: string;
};

type View = "auth" | "forgot";

export function CleanAuthCard({ initialFlow, redirectTo = "/dashboard" }: CleanAuthCardProps) {
  const [flow, setFlow] = useState<"signIn" | "signUp">(initialFlow);
  const [view, setView] = useState<View>("auth");

  if (view === "forgot") {
    return <ForgotPasswordForm onBack={() => setView("auth")} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      {/* Background gradients */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: "radial-gradient(circle 800px at 50% -20%, oklch(0.3 0.035 195) 0%, transparent 100%)",
        }}
      />

      <div
        className="relative w-full max-w-md rounded-3xl border p-8"
        style={{
          borderColor: "rgba(255, 215, 0, 0.15)",
          background: "linear-gradient(145deg, rgba(16, 24, 23, 0.8) 0%, rgba(10, 15, 14, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header section */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-bold uppercase tracking-[0.2em]" style={{
            background: "linear-gradient(90deg, #FFD700, #FFF9C4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            BudgetBITCH
          </span>
          <LocaleSwitcher />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {flow === "signIn" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-emerald-200/60 mb-6">
          {flow === "signIn"
            ? "Enter your credentials to access your budget."
            : "Sign up to start tracking your daily disposable budget."}
        </p>

        {/* Auth form */}
        <ConvexPasswordAuthForm
          flow={flow}
          redirectTo={redirectTo}
          submitLabel={flow === "signIn" ? "Sign In" : "Sign Up"}
          emailLabel="Email address"
          passwordLabel="Password"
          helperText=""
        />

        {/* Forgot password link (sign-in only) */}
        {flow === "signIn" ? (
          <div className="mt-3 text-right text-sm">
            <button
              type="button"
              onClick={() => setView("forgot")}
              className="font-semibold text-amber-400 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        ) : null}

        {/* Footer switcher */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-sm">
          {flow === "signIn" ? (
            <p className="text-white/60">
              Need an account?{" "}
              <button
                onClick={() => setFlow("signUp")}
                className="font-semibold text-amber-400 hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-white/60">
              Already have an account?{" "}
              <button
                onClick={() => setFlow("signIn")}
                className="font-semibold text-amber-400 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
