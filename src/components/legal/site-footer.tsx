"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { termsContent, privacyContent, cookieContent } from "@/lib/legal/content";

// Fixed-screen routes (dashboard, wizard) manage their own chrome and use a
// 100dvh shell, so a global footer there would be unreachable. Hide there.
const HIDDEN_PREFIXES = ["/dashboard", "/wizard"];

export function SiteFooter() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-white/50">
        <span className="font-semibold text-white/70">Budget Boss</span>
        <Link href="/terms" className="hover:text-amber-400">
          {termsContent.en.title}
        </Link>
        <Link href="/privacy" className="hover:text-amber-400">
          {privacyContent.en.title}
        </Link>
        <Link href="/cookie-policy" className="hover:text-amber-400">
          {cookieContent.en.title}
        </Link>
      </div>
    </footer>
  );
}
