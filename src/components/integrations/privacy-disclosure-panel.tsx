import { useTranslations } from "next-intl";

type PrivacyDisclosurePanelProps = {
    providerLabel: string;
};

export function PrivacyDisclosurePanel({ providerLabel }: PrivacyDisclosurePanelProps) {
    const t = useTranslations("integrationsShared");
    const disclosures = [
        t("disclosures.minimumData"),
        t("disclosures.noSilentSharing"),
        t("disclosures.revokeAnyTime"),
    ];

    return (
        <div className="rounded-4xl border border-emerald-200/20 bg-emerald-300/10 p-6">
            <h2 className="text-xl font-semibold">{t("privacyShieldTitle")}</h2>
            <p className="mt-3 text-sm text-emerald-50/85">
                {t("privacyShieldDescription", { providerLabel })}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white">
                {disclosures.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
}
