"use client";

import { useClerk } from "@clerk/nextjs";

type AuthAccountRecoveryButtonProps = {
  redirectTo: string;
};

export function AuthAccountRecoveryButton({ redirectTo }: AuthAccountRecoveryButtonProps) {
  const clerk = useClerk();

  async function handleClick() {
    await clerk.signOut({ redirectUrl: `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}` });
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