import { useTranslations } from "next-intl";

export function PrivacyBadge() {
    const t = useTranslations("integrationsShared");

    return (
        <span className="inline-flex rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-50">
            {t("privacyBadge")}
        </span>
    );
}
