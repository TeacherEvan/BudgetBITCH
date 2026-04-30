import { OfficialLinkList } from "@/components/integrations/official-link-list";
import { PrivacyDisclosurePanel } from "@/components/integrations/privacy-disclosure-panel";
import { ProviderWizardShell } from "@/components/integrations/provider-wizard-shell";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import { providerRegistry } from "@/modules/integrations/provider-registry";
import { useTranslations } from "next-intl";

export default function MistralIntegrationPage() {
    const provider = providerRegistry.mistral;
    const t = useTranslations("integrationProviderPages");

    return (
        <ProviderWizardShell
            eyebrow={t("mistral.eyebrow")}
            title={t("mistral.title")}
            description={t("mistral.description")}
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