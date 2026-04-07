import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrivacyDisclosurePanel } from "./privacy-disclosure-panel";

describe("PrivacyDisclosurePanel", () => {
    it("renders provider-specific disclosure copy and all required privacy guardrails", () => {
        render(<PrivacyDisclosurePanel providerLabel="OpenAI" />);

        expect(screen.getByRole("heading", { name: "Privacy Shield" })).toBeInTheDocument();
        expect(
            screen.getByText(/review how openai receives data before enabling any connection/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Only explicitly connected providers receive the minimum required data."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("No silent sharing or automatic cross-provider routing."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("You can revoke and disconnect this provider at any time."),
        ).toBeInTheDocument();
    });
});