import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import OpenClawIntegrationPage from "./page";

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, string>) => {
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
            "disclosures.minimumData": "Only explicitly connected providers receive the minimum required data.",
            "disclosures.noSilentSharing": "No silent sharing or automatic cross-provider routing.",
            "disclosures.revokeAnyTime": "You can revoke and disconnect this provider at any time.",
        };

        return translations[key] ?? key;
    },
}));

describe("OpenClawIntegrationPage", () => {
    it("renders the OpenClaw setup wizard with high-risk warnings", () => {
        render(<OpenClawIntegrationPage />);

        expect(screen.getByRole("heading", { name: "Connect OpenClaw" })).toBeInTheDocument();
        expect(screen.getByText("High-risk connection")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Verify local system access, data paths, and model routing before enabling OpenClaw.",
            ),
        ).toBeInTheDocument();
    });

    it("shows all high-risk checklist items and the official OpenClaw links", () => {
        render(<OpenClawIntegrationPage />);

        expect(
            screen.getByText("Check which local files, tools, or shells OpenClaw can reach."),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Confirm prompt routing and storage paths before enabling the integration.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Use one-click revoke if your trust model changes."),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Privacy Shield" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
            "href",
            expect.stringContaining("openclaw.ai"),
        );
        expect(screen.getByRole("link", { name: "Official docs" })).toHaveAttribute(
            "href",
            expect.stringContaining("openclaw.ai"),
        );
    });
});
