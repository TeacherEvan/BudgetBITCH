import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ClaudeIntegrationPage from "./page";

vi.mock("next-intl", () => ({
    useTranslations: (namespace?: string) => (key: string, values?: Record<string, string>) => {
        const translations: Record<string, string> = {
            backToConnectionHub: "Back to connection hub",
            tools: "Tools",
            privacyShieldTitle: "Privacy Shield",
            privacyShieldDescription: `Review how ${values?.providerLabel ?? ""} receives data before enabling any connection.`.trim(),
            officialLinksTitle: "Official links",
            officialLogin: "Official login",
            officialDocs: "Official docs",
            privacyBadge: "No silent sharing",
            systemAccessWarning: "System access warning",
            "integrationProviderPages.claude.eyebrow": "Claude Setup",
            "integrationProviderPages.claude.title": "Connect Claude",
            "integrationProviderPages.claude.description":
                "Use the official Anthropic path, review the privacy shield, and only then add the credential for this workspace.",
            "disclosures.minimumData": "Only explicitly connected providers receive the minimum required data.",
            "disclosures.noSilentSharing": "No silent sharing or automatic cross-provider routing.",
            "disclosures.revokeAnyTime": "You can revoke and disconnect this provider at any time.",
        };

        return translations[namespace ? `${namespace}.${key}` : key] ?? translations[key] ?? key;
    },
}));

describe("ClaudeIntegrationPage", () => {
    it("renders the Claude setup wizard with privacy disclosures and official links", () => {
        render(<ClaudeIntegrationPage />);

        expect(screen.getByRole("heading", { name: "Connect Claude" })).toBeInTheDocument();
        expect(
            screen.getByText(
                "Only explicitly connected providers receive the minimum required data.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
            "href",
            expect.stringContaining("platform.claude.com"),
        );
    });
});
