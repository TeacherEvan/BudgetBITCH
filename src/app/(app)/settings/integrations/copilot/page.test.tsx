import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import CopilotIntegrationPage from "./page";

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
            "integrationProviderPages.copilot.eyebrow": "GitHub Copilot Setup",
            "integrationProviderPages.copilot.title": "Connect GitHub Copilot",
            "integrationProviderPages.copilot.description":
                "Review repository access, prompt exposure, and revoke controls before enabling GitHub Copilot in this workspace.",
            "integrationProviderPages.copilot.systemAccessMessage":
                "Review extension, repository, and prompt access before enabling GitHub Copilot.",
            "integrationProviderPages.copilot.riskChecklistTitle": "Risk checklist",
            "integrationProviderPages.copilot.riskChecklistItems.repositoryAccess":
                "Confirm which repositories and files the tool can inspect.",
            "integrationProviderPages.copilot.riskChecklistItems.officialFlow":
                "Use only the official GitHub Copilot authentication flow.",
            "integrationProviderPages.copilot.riskChecklistItems.revokeAccess":
                "Revoke access immediately if the workspace no longer requires it.",
            "disclosures.minimumData": "Only explicitly connected providers receive the minimum required data.",
            "disclosures.noSilentSharing": "No silent sharing or automatic cross-provider routing.",
            "disclosures.revokeAnyTime": "You can revoke and disconnect this provider at any time.",
        };

        return translations[namespace ? `${namespace}.${key}` : key] ?? translations[key] ?? key;
    },
}));

describe("CopilotIntegrationPage", () => {
    it("renders the Copilot setup wizard with system access guidance", () => {
        render(<CopilotIntegrationPage />);

        expect(
            screen.getByRole("heading", { name: "Connect GitHub Copilot" }),
        ).toBeInTheDocument();
        expect(screen.getByText("System access warning")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Review extension, repository, and prompt access before enabling GitHub Copilot.",
            ),
        ).toBeInTheDocument();
    });

    it("renders the Copilot checklist items and official links", () => {
        render(<CopilotIntegrationPage />);

        expect(
            screen.getByText("Confirm which repositories and files the tool can inspect."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Use only the official GitHub Copilot authentication flow."),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Revoke access immediately if the workspace no longer requires it.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
            "href",
            expect.stringContaining("github.com/features/copilot"),
        );
        expect(screen.getByRole("link", { name: "Official docs" })).toHaveAttribute(
            "href",
            expect.stringContaining("docs.github.com/en/copilot"),
        );
    });
});
