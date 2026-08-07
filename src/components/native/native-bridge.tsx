"use client";

import { useEffect } from "react";
import { isNative } from "@/lib/native";

/**
 * Boots Capacitor-native behavior once, on the client, inside the first-party
 * native shell (Android/iOS). Every plugin call is guarded so a missing native
 * implementation (e.g. before `cap sync`, or on the web build) degrades to a
 * no-op instead of throwing.
 *
 * This is the single place native plugins are touched from React; UI elsewhere
 * keeps using `@/lib/native` for platform booleans only.
 */
function tryNative<T>(label: string, fn: () => Promise<T> | T): void {
  if (typeof window === "undefined") return;
  try {
    void Promise.resolve(fn()).catch((err) => {
      // Plugin-not-implemented or unsynced native side: ignore.
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[native-bridge] ${label} skipped:`, err);
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[native-bridge] ${label} skipped:`, err);
    }
  }
}

export function NativeBridge() {
  useEffect(() => {
    if (!isNative()) return;

    // Dark app chrome → light status-bar text (visible over the dark base).
    tryNative("status-bar", async () => {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setStyle({ style: Style.Light });
    });

    // Reveal the web view once React has mounted (splash handled by native).
    tryNative("splash-hide", async () => {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide();
    });
  }, []);

  return null;
}
