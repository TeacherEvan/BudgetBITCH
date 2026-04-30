import { cookies } from "next/headers";
import {
  defaultLocale,
  getLocaleMessages,
  localeCookieName,
  resolveLocale,
} from "@/i18n/messages";

export async function getRequestLocale() {
  try {
    const cookieStore = await cookies();
    return resolveLocale(cookieStore.get(localeCookieName)?.value);
  } catch {
    return defaultLocale;
  }
}

export async function getRequestMessages() {
  return getLocaleMessages(await getRequestLocale());
}