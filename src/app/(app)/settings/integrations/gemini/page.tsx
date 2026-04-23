import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import { providerRegistry } from "@/modules/integrations/provider-registry";

export default function GeminiIntegrationPage() {
    const provider = providerRegistry.gemini;

    return (
        <ProviderWizardShell
            eyebrow="Gemini Setup"
            title="Connect Gemini"
            description="Use the official Google AI Studio path, verify the privacy disclosure, and only connect Gemini when this workspace clearly needs it."
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