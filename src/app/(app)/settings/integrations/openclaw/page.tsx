import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { RiskChecklist } from "@/components/integrations/risk-checklist";
import { SystemAccessWarning } from "@/components/integrations/system-access-warning";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import { providerRegistry } from "@/modules/integrations/provider-registry";
import { useTranslations } from "next-intl";

export default function OpenClawIntegrationPage() {
    const provider = providerRegistry.openclaw;
    const t = useTranslations("integrationProviderPages");

    return (
        <ProviderWizardShell
            eyebrow={t("openclaw.eyebrow")}
            title={t("openclaw.title")}
            description={t("openclaw.description")}
            actions={buildProviderActionList(provider)}
        >
            <div className="space-y-6">
                <RiskChecklist
                    title={t("openclaw.riskChecklistTitle")}
                    items={[
                        t("openclaw.riskChecklistItems.localReach"),
                        t("openclaw.riskChecklistItems.promptRouting"),
                        t("openclaw.riskChecklistItems.oneClickRevoke"),
                    ]}
                />
                <SystemAccessWarning message={t("openclaw.systemAccessMessage")} />
            </div>
            <div className="space-y-6">
                <PrivacyDisclosurePanel providerLabel={provider.label} />
                <OfficialLinkList
                    loginUrl={provider.officialLoginUrl}
                    docsUrl={provider.officialDocsUrl}
                />
            </div>
        </ProviderWizardShell>
    );
}
