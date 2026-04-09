import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { RiskChecklist } from "@/components/integrations/risk-checklist";
import { SystemAccessWarning } from "@/components/integrations/system-access-warning";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import { providerRegistry } from "@/modules/integrations/provider-registry";

export default function OpenClawIntegrationPage() {
    const provider = providerRegistry.openclaw;

    return (
        <ProviderWizardShell
            eyebrow="OpenClaw Setup"
            title="Connect OpenClaw"
            description="OpenClaw can introduce higher trust and system-scope concerns, so review every warning before you enable it."
            actions={buildProviderActionList(provider)}
        >
            <div className="space-y-6">
                <RiskChecklist
                    title="High-risk connection"
                    items={[
                        "Check which local files, tools, or shells OpenClaw can reach.",
                        "Confirm prompt routing and storage paths before enabling the integration.",
                        "Use one-click revoke if your trust model changes.",
                    ]}
                />
                <SystemAccessWarning message="Verify local system access, data paths, and model routing before enabling OpenClaw." />
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
