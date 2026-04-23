"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getInstallPromptSnapshot,
  promptToInstall,
  subscribeToInstallPrompt,
} from "@/modules/pwa/install-prompt";

type InstallButtonProps = {
  className?: string;
};

export function InstallButton({ className = "bb-button-secondary" }: InstallButtonProps) {
  const installPrompt = useSyncExternalStore(
    subscribeToInstallPrompt,
    getInstallPromptSnapshot,
    () => null,
  );
  const [isOpeningPrompt, setIsOpeningPrompt] = useState(false);

  if (!installPrompt) {
    return null;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        setIsOpeningPrompt(true);

        try {
          await promptToInstall();
        } finally {
          setIsOpeningPrompt(false);
        }
      }}
      disabled={isOpeningPrompt}
    >
      {isOpeningPrompt ? "Opening install prompt..." : "Install app"}
    </button>
  );
}