import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { RiskChecklist } from "@/components/integrations/risk-checklist";
import { SystemAccessWarning } from "@/components/integrations/system-access-warning";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import { providerRegistry } from "@/modules/integrations/provider-registry";
import { useTranslations } from "next-intl";

export default function CopilotIntegrationPage() {
    const provider = providerRegistry.copilot;
    const t = useTranslations("integrationProviderPages");

    return (
        <ProviderWizardShell
            eyebrow={t("copilot.eyebrow")}
            title={t("copilot.title")}
            description={t("copilot.description")}
            actions={buildProviderActionList(provider)}
        >
            <div className="space-y-6">
                <SystemAccessWarning message={t("copilot.systemAccessMessage")} />
                <RiskChecklist
                    title={t("copilot.riskChecklistTitle")}
                    items={[
                        t("copilot.riskChecklistItems.repositoryAccess"),
                        t("copilot.riskChecklistItems.officialFlow"),
                        t("copilot.riskChecklistItems.revokeAccess"),
                    ]}
                />
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
