import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrivacyDisclosurePanel } from "./privacy-disclosure-panel";

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, string>) => {
        const translations: Record<string, string> = {
            privacyShieldTitle: "Privacy Shield",
            privacyShieldDescription: `Check what ${values?.providerLabel ?? ""} can receive before you connect it.`.trim(),
            "disclosureHeadings.minimumData": "Minimum data",
            "disclosureHeadings.noSilentSharing": "No silent sharing",
            "disclosureHeadings.revokeAnyTime": "Revoke any time",
            "disclosures.minimumData": "Only explicitly connected providers receive the minimum required data.",
            "disclosures.noSilentSharing": "No silent sharing or automatic cross-provider routing.",
            "disclosures.revokeAnyTime": "You can revoke and disconnect this provider at any time.",
        };

        return translations[key] ?? key;
    },
}));

describe("PrivacyDisclosurePanel", () => {
    it("renders provider-specific disclosure copy and all required privacy guardrails", () => {
        render(<PrivacyDisclosurePanel providerLabel="OpenAI" />);

        expect(screen.getByRole("heading", { name: "Privacy Shield" })).toBeInTheDocument();
        expect(
            screen.getByText(/check what openai can receive before you connect it/i),
        ).toBeInTheDocument();
        expect(screen.getByText("Minimum data")).toBeInTheDocument();
        expect(
            screen.getByText("Only explicitly connected providers receive the minimum required data."),
        ).toBeInTheDocument();
        expect(screen.getByText("No silent sharing")).toBeInTheDocument();
        expect(
            screen.getByText("No silent sharing or automatic cross-provider routing."),
        ).toBeInTheDocument();
        expect(screen.getByText("Revoke any time")).toBeInTheDocument();
        expect(
            screen.getByText("You can revoke and disconnect this provider at any time."),
        ).toBeInTheDocument();
    });
});