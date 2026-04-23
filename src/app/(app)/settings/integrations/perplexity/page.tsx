import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import { providerRegistry } from "@/modules/integrations/provider-registry";

export default function PerplexityIntegrationPage() {
    const provider = providerRegistry.perplexity;

    return (
        <ProviderWizardShell
            eyebrow="Perplexity Setup"
            title="Connect Perplexity"
            description="Follow the official Perplexity console flow, review the privacy disclosure, and keep the connection limited to the workspace that needs it."
            actions={buildProviderActionList(provider)}
        >
            <PrivacyDisclosurePanel providerLabel={provider.label} />
            <OfficialLinkList
                loginUrl={provider.officialLoginUrl}
                docsUrl={provider.officialDocsUrl}
            />
        </ProviderWizardShell>
    );
}