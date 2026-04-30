"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { mobileRouteConfig } from "@/modules/mobile/mobile-route-config";

function isRouteActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const t = useTranslations("appNav");

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(8,21,18,0.92)] px-4 py-2 backdrop-blur">
      <nav aria-label={t("mobileNavigation")} className="md:hidden">
        <div className="flex gap-2 overflow-x-auto py-1">
          {mobileRouteConfig.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              aria-current={isRouteActive(pathname, route.href) ? "page" : undefined}
              className="bb-button-ghost shrink-0 px-3 py-1.5 text-sm font-semibold"
            >
              {t(`routes.${route.labelKey}`)}
            </Link>
          ))}
        </div>
      </nav>

      <nav aria-label={t("desktopNavigation")} className="hidden md:flex md:items-center">
        <Link
          href="/dashboard"
          className="bb-button-ghost flex items-center gap-2 px-3 py-1.5 text-sm font-semibold"
          aria-label={t("openDashboard")}
          aria-current={isRouteActive(pathname, "/dashboard") ? "page" : undefined}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          {t("routes.dashboard")}
        </Link>
      </nav>
    </div>
  );
}
