"use client";

import { useEffect, type ReactNode } from "react";
import { InstallButton } from "@/components/pwa/install-button";
import {
  clearInstallPrompt,
  storeInstallPrompt,
  type DeferredInstallPrompt,
} from "@/modules/pwa/install-prompt";

type PwaProviderProps = {
  children: ReactNode;
};

export function PwaProvider({ children }: PwaProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Service worker registration failed.", error);
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as DeferredInstallPrompt;
      promptEvent.preventDefault();
      storeInstallPrompt(promptEvent);
    };
    const handleAppInstalled = () => {
      clearInstallPrompt();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <div className="pointer-events-auto">
          <InstallButton className="bb-button-secondary min-w-[11rem] justify-center" />
        </div>
      </div>
    </>
  );
}