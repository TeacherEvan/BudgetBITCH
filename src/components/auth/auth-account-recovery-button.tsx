"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

type AuthAccountRecoveryButtonProps = {
  redirectTo: string;
};

export function AuthAccountRecoveryButton({ redirectTo }: AuthAccountRecoveryButtonProps) {
  const { signOut } = useAuthActions();
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.push(`/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      className="bb-button-secondary w-full justify-center md:w-auto"
      onClick={() => {
        void handleClick();
      }}
    >
      Sign out and switch account
    </button>
  );
}