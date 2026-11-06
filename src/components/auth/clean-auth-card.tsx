"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConvexPasswordAuthForm } from "./convex-password-auth-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ProTipsCard } from "@/components/pro-tips/pro-tips-card";
import {
  hasLocalPassword,
  isLocalUnlocked,
  unlockLocalVault,
  setLocalPassword,
  isLocalModePreferred,
  setLocalModePreferred,
} from "@/lib/auth/local-lock";
import { isConvexConfigured } from "@/components/providers/convex-client-provider";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";

type CleanAuthCardProps = {
  initialFlow: "signIn" | "signUp";
  redirectTo?: string;
};

type View = "auth" | "forgot" | "localLock";

export function CleanAuthCard({ initialFlow, redirectTo = "/dashboard" }: CleanAuthCardProps) {
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">(initialFlow);
  const [view, setView] = useState<View>("auth");
  const [localMode, setLocalMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return isLocalModePreferred() || !isConvexConfigured() || !isLocalUnlocked();
  });

  // Local lock states
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSettingUpLock, setIsSettingUpLock] = useState(false);

  const hasConfiguredLock = typeof window !== "undefined" ? hasLocalPassword() : false;

  const handleLocalUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    setLocalModePreferred(true);

    if (hasConfiguredLock) {
      const ok = await unlockLocalVault(masterPassword);
      if (ok) {
        router.push(redirectTo);
      } else {
        setLocalError("Incorrect password. Please try again.");
      }
    } else {
      if (isSettingUpLock) {
        if (masterPassword.length < 4) {
          setLocalError("Password must be at least 4 characters long.");
          return;
        }
        if (masterPassword !== confirmMasterPassword) {
          setLocalError("Passwords do not match.");
          return;
        }
        await setLocalPassword(masterPassword);
        router.push(redirectTo);
      } else {
        // Continue directly without setting a password
        router.push(redirectTo);
      }
    }
  };

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
          <span className="text-xl font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-100 bg-clip-text text-transparent">
            Budget Boss
          </span>
          {localMode ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              <Lock className="h-3 w-3" /> Local Vault
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Cloud Sync
            </span>
          )}
        </div>

        {localMode ? (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {hasConfiguredLock
                ? "Unlock Local Vault"
                : isSettingUpLock
                ? "Set Master Password"
                : "Offline / Local Mode"}
            </h1>
            <p className="text-sm text-emerald-200/60 mb-6">
              {hasConfiguredLock
                ? "Enter your local device password to open your budget."
                : isSettingUpLock
                ? "Protect your on-device financial records with a local password."
                : "Keep your data 100% on this device with zero server dependency."}
            </p>

            <form onSubmit={handleLocalUnlock} className="space-y-4">
              {hasConfiguredLock || isSettingUpLock ? (
                <>
                  <label className="grid gap-2 text-sm font-semibold text-white">
                    Master Password / PIN
                    <input
                      type="password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus:border-(--accent-strong) focus:ring-2 focus:ring-(--accent-strong)/35"
                    />
                  </label>
                  {isSettingUpLock && (
                    <label className="grid gap-2 text-sm font-semibold text-white">
                      Confirm Master Password
                      <input
                        type="password"
                        value={confirmMasterPassword}
                        onChange={(e) => setConfirmMasterPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus:border-(--accent-strong) focus:ring-2 focus:ring-(--accent-strong)/35"
                      />
                    </label>
                  )}
                </>
              ) : null}

              {localError && (
                <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100" role="alert">
                  {localError}
                </p>
              )}

              <button type="submit" className="bb-button-primary w-full justify-center">
                {hasConfiguredLock
                  ? "Unlock Budget"
                  : isSettingUpLock
                  ? "Save & Open Budget"
                  : "Open Local Budget"}
              </button>

              {!hasConfiguredLock && !isSettingUpLock && (
                <button
                  type="button"
                  onClick={() => setIsSettingUpLock(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
                >
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  Set a Device Password
                </button>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-white/5 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setLocalModePreferred(false);
                  setLocalMode(false);
                }}
                className="text-white/60 hover:text-amber-400 cursor-pointer"
              >
                Switch to Cloud Account Login
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {flow === "signIn" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-emerald-200/60 mb-6">
              {flow === "signIn"
                ? "Enter your credentials to access your cloud budget."
                : "Sign up to start tracking your daily disposable budget."}
            </p>

            {/* Auth form */}
            <ConvexPasswordAuthForm
              flow={flow}
              redirectTo={redirectTo}
              submitLabel={flow === "signIn" ? "Sign In" : "Sign Up"}
              emailLabel="Email / Username"
              passwordLabel="Password"
              helperText=""
            />

            {/* Local offline bypass button */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setLocalModePreferred(true);
                  setLocalMode(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-400/20 transition cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                Continue Offline (Local-Only Vault)
              </button>
            </div>

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
        )}

        {/* Boss Pro-Tip: rotating financial tip on the signed-out surface */}
        <div className="mt-6">
          <ProTipsCard locale="en" />
        </div>
      </div>
    </div>
  );
}
