"use client";

import { signOut } from "next-auth/react";

type AuthAccountRecoveryButtonProps = {
  redirectTo: string;
};

export function AuthAccountRecoveryButton({ redirectTo }: AuthAccountRecoveryButtonProps) {
  async function handleClick() {
    await signOut({ redirectTo: `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}` });
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