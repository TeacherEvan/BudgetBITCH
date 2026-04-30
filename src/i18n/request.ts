import { getRequestConfig } from "next-intl/server";
import { getRequestLocale, getRequestMessages } from "@/i18n/server";

export default getRequestConfig(async () => {
  const locale = await getRequestLocale();
  const messages = await getRequestMessages();

  return {
    locale,
    messages,
  };
});