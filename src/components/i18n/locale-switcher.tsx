"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { localeCookieName, supportedLocales, type AppLocale } from "@/i18n/messages";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("localeSwitcher");
  const router = useRouter();

  function handleLocaleChange(nextLocale: AppLocale) {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <label className="bb-mini-copy inline-flex items-center gap-2 text-sm text-white/80">
      <span>{t("label")}</span>
      <select
        aria-label={t("label")}
        className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-white"
        onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
        value={locale}
      >
        {supportedLocales.map((option) => (
          <option key={option} value={option}>
            {t(`options.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}