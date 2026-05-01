import { useTranslations } from "next-intl";

type PrivacyDisclosurePanelProps = {
    providerLabel: string;
};

export function PrivacyDisclosurePanel({ providerLabel }: PrivacyDisclosurePanelProps) {
    const t = useTranslations("integrationsShared");
    const disclosures = [
        {
            heading: t("disclosureHeadings.minimumData"),
            detail: t("disclosures.minimumData"),
        },
        {
            heading: t("disclosureHeadings.noSilentSharing"),
            detail: t("disclosures.noSilentSharing"),
        },
        {
            heading: t("disclosureHeadings.revokeAnyTime"),
            detail: t("disclosures.revokeAnyTime"),
        },
    ];

    return (
        <div className="rounded-4xl border border-emerald-200/20 bg-emerald-300/10 p-6">
            <h2 className="text-xl font-semibold">{t("privacyShieldTitle")}</h2>
            <p className="mt-3 text-sm text-emerald-50/85">
                {t("privacyShieldDescription", { providerLabel })}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white">
                {disclosures.map((item) => (
                    <li key={item.heading} className="rounded-3xl border border-emerald-200/15 bg-black/10 px-4 py-3">
                        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50/80">
                            {item.heading}
                        </span>
                        <span className="mt-1 block text-sm text-white/90">{item.detail}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
