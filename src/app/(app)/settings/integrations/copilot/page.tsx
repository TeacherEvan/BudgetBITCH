import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { RiskChecklist } from "@/components/integrations/risk-checklist";
import { SystemAccessWarning } from "@/components/integrations/system-access-warning";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import { providerRegistry } from "@/modules/integrations/provider-registry";

export default function CopilotIntegrationPage() {
    const provider = providerRegistry.copilot;

    return (
        <ProviderWizardShell
            eyebrow="GitHub Copilot Setup"
            title="Connect GitHub Copilot"
            description="Review repository access, prompt exposure, and revoke controls before enabling GitHub Copilot in this workspace."
            actions={buildProviderActionList(provider)}
        >
            <div className="space-y-6">
                <SystemAccessWarning message="Review extension, repository, and prompt access before enabling GitHub Copilot." />
                <RiskChecklist
                    title="Risk checklist"
                    items={[
                        "Confirm which repositories and files the tool can inspect.",
                        "Use only the official GitHub Copilot authentication flow.",
                        "Revoke access immediately if the workspace no longer requires it.",
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
