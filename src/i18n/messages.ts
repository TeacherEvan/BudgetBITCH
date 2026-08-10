import type { LocaleMessages } from './locales/en';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { pt } from './locales/pt';
import { zh } from './locales/zh';

export const localeCookieName = 'bb-locale';
export const defaultLocale = 'en';
export const supportedLocales = ['en', 'es', 'fr', 'de', 'pt', 'zh'] as const;
export type AppLocale = (typeof supportedLocales)[number];
export type { LocaleMessages };

const CATALOGS: Record<string, LocaleMessages> = { en, es, fr, de, pt, zh };

export function resolveLocale(value: string | undefined | null): AppLocale {
  if (value && (supportedLocales as readonly string[]).includes(value)) {
    return value as AppLocale;
  }
  return defaultLocale;
}

/**
 * Returns the message catalog for a locale. Falls back to English when a
 * translation file is missing or still being added.
 */
export function getLocaleMessages(locale: AppLocale): LocaleMessages {
  return CATALOGS[locale] ?? CATALOGS.en;
}
