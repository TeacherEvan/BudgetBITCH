import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { providerRegistry } from "@/modules/integrations/provider-registry";

export default function OpenAiIntegrationPage() {
    const provider = providerRegistry.openai;

    return (
        <ProviderWizardShell
            eyebrow="OpenAI Setup"
            title="Connect OpenAI"
            description="Follow the official OpenAI path, verify the disclosure copy, and connect only if this workspace explicitly needs it."
        >
            <PrivacyDisclosurePanel providerLabel={provider.label} />
            <OfficialLinkList
                loginUrl={provider.officialLoginUrl}
                docsUrl={provider.officialDocsUrl}
            />
        </ProviderWizardShell>
    );
}
